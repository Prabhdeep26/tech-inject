import { getFriendlyErrorMessage } from './ErrorState';

/**
 * Standardized API Error class thrown whenever an HTTP or network error occurs.
 * Contains sanitized friendly message, status code, and optional payload data.
 */
export class ApiError extends Error {
  public status: number;
  public data: any;
  public isNetworkError: boolean;

  constructor(
    message: string,
    status: number = 0,
    data: any = null,
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface ApiRequestOptions extends RequestInit {
  data?: any;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
}

/**
 * Centralized fetch wrapper that standardizes headers, session credentials,
 * automatic serialization/deserialization, and friendly error handling.
 */
export async function apiFetch<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { data, params, headers, ...customConfig } = options;

  let requestUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      requestUrl += (requestUrl.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {};
  let body = customConfig.body;

  if (data !== undefined) {
    if (
      (typeof FormData !== 'undefined' && data instanceof FormData) ||
      (typeof Blob !== 'undefined' && data instanceof Blob) ||
      typeof data === 'string'
    ) {
      body = data;
    } else {
      defaultHeaders['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }
  }

  const config: RequestInit = {
    method: options.method || (data !== undefined ? 'POST' : 'GET'),
    credentials: 'include',
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
    body,
  };

  let response: Response;
  try {
    response = await fetch(requestUrl, config);
  } catch (err: any) {
    const friendly = getFriendlyErrorMessage(
      err,
      0,
      'Something went wrong, please try again'
    );
    throw new ApiError(friendly, 0, null, true);
  }

  let responseData: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    const rawMsg =
      responseData?.message ||
      responseData?.error ||
      (typeof responseData === 'string' ? responseData : response.statusText);
    const friendly = getFriendlyErrorMessage(rawMsg, response.status);
    throw new ApiError(friendly, response.status, responseData);
  }

  return {
    data: responseData as T,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    ok: response.ok,
  };
}

/**
 * Standardized API client for all GET, POST, PUT, PATCH, DELETE requests.
 */
export const apiClient = {
  request: <T = any>(url: string, options?: ApiRequestOptions) => apiFetch<T>(url, options),
  get: <T = any>(url: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiFetch<T>(url, { ...options, method: 'GET' }),
  post: <T = any>(url: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'data'>) =>
    apiFetch<T>(url, { ...options, method: 'POST', data }),
  put: <T = any>(url: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'data'>) =>
    apiFetch<T>(url, { ...options, method: 'PUT', data }),
  patch: <T = any>(url: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'data'>) =>
    apiFetch<T>(url, { ...options, method: 'PATCH', data }),
  delete: <T = any>(url: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiFetch<T>(url, { ...options, method: 'DELETE' }),
};
