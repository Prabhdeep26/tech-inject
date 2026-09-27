import type { ComponentBundleResponse } from './types.js';

export interface FetchBundleClientOptions {
  apiUrl?: string;
  token?: string;
}

/**
 * Fetches a component bundle from the Tech-Inject deployed API.
 * Never uses or embeds hardcoded credentials; dynamically passes
 * token if provided by the user via CLI option or environment variable.
 */
export async function fetchComponentBundle(
  slug: string,
  options: FetchBundleClientOptions = {}
): Promise<ComponentBundleResponse> {
  // Normalize slug: strip @tech-inject/ prefix if passed by user
  const cleanSlug = slug.replace(/^@tech-inject\//, '').trim();
  if (!cleanSlug) {
    throw new Error('Component slug must not be empty.');
  }

  const rawBaseUrl =
    options.apiUrl ||
    process.env.TECH_INJECT_API_URL ||
    process.env.API_URL ||
    'https://tech-inject-server.vercel.app';

  const baseUrl = rawBaseUrl.replace(/\/+$/, '');

  // Resolve token dynamically from argument or environment variable
  const token =
    options.token ||
    process.env.TECH_INJECT_TOKEN ||
    process.env.TECH_INJECT_API_KEY ||
    process.env.TECH_INJECT_AUTH_TOKEN;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const targetUrl = `${baseUrl}/components/${encodeURIComponent(cleanSlug)}/source`;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });
  } catch (err: any) {
    throw new Error(
      `Failed to connect to Tech-Inject registry at "${baseUrl}": ${err.message || 'Connection refused.'}`
    );
  }

  if (response.status === 401) {
    throw new Error(
      `Authentication required: Component '${cleanSlug}' requires authentication. Please provide an API token via --token <token> or set TECH_INJECT_TOKEN in your environment.`
    );
  }

  if (response.status === 403) {
    const errorData = (await response.json().catch(() => ({}))) as any;
    throw new Error(
      errorData.message ||
        `Access denied: Component '${cleanSlug}' requires an active Premium entitlement tier. Verify your account has Premium access.`
    );
  }

  if (response.status === 404) {
    throw new Error(`Component '${cleanSlug}' was not found in the registry.`);
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as any;
    throw new Error(
      errorData.message || `API request failed with HTTP ${response.status} (${response.statusText}).`
    );
  }

  const json = (await response.json()) as any;
  const bundleData = json.data || json;

  if (!bundleData || !Array.isArray(bundleData.files) || bundleData.files.length === 0) {
    throw new Error(`Registry returned an empty or malformed bundle for component '${cleanSlug}'.`);
  }

  return {
    slug: bundleData.slug || cleanSlug,
    version: bundleData.version,
    entryPoint: bundleData.entryPoint,
    totalSize: bundleData.totalSize,
    fileCount: bundleData.fileCount || bundleData.files.length,
    files: bundleData.files,
  };
}
