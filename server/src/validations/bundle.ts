import { z } from "zod";
import path from "node:path";
import type { ComponentBundle, ComponentBundleFile } from "@tech-inject/types";

export const ALLOWED_FILE_EXTENSIONS = [
  ".tsx",
  ".jsx",
  ".ts",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".sass",
  ".json",
  ".md",
  ".mdx",
  ".svg",
] as const;

export type AllowedFileExtension = (typeof ALLOWED_FILE_EXTENSIONS)[number];

export const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB per individual file
export const MAX_BUNDLE_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB total bundle payload
export const MAX_BUNDLE_FILES_COUNT = 50; // Maximum allowed files per component bundle

/**
 * Validates whether a file path has an allowed extension for component bundles
 */
export function isAllowedFileExtension(filePath: string): boolean {
  if (!filePath || typeof filePath !== "string") return false;
  const ext = path.extname(filePath).toLowerCase();
  return (ALLOWED_FILE_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Validates that a file path is a safe relative path (preventing path traversal)
 */
export function isSafeRelativePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== "string") return false;
  if (filePath.includes("\0")) return false;
  if (path.isAbsolute(filePath)) return false;
  if (filePath.startsWith("/") || filePath.startsWith("\\")) return false;

  const normalized = filePath.replace(/\\/g, "/");
  const segments = normalized.split("/");

  // Reject empty segments or directory traversal segments
  for (const segment of segments) {
    if (segment === ".." || segment === "." && segment.length > 1) {
      return false;
    }
  }

  return true;
}

/**
 * Forbidden sensitive filename patterns (preventing accidental secret/credential inclusion)
 */
export const SENSITIVE_FILENAME_PATTERNS = [
  /^\.env/i,
  /\.env\./i,
  /credentials\.json$/i,
  /secrets?\.json$/i,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /id_dsa/i,
  /id_ecdsa/i,
  /id_ed25519/i,
];

/**
 * Forbidden sensitive content patterns (private keys, live tokens, database credentials)
 */
export const SENSITIVE_CONTENT_PATTERNS = [
  /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/i,
  /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/,
  /\bghp_[A-Za-z0-9_]{36}\b/,
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i,
];

/**
 * Zod schema for a single file within the bundle
 */
export const bundleFileSchema = z.object({
  path: z
    .string()
    .min(1, "File path is required")
    .refine(isSafeRelativePath, {
      message: "File path must be a safe, relative path without directory traversal (..)",
    })
    .refine(isAllowedFileExtension, {
      message: `Unsupported file extension. Allowed extensions are: ${ALLOWED_FILE_EXTENSIONS.join(", ")}`,
    })
    .refine(
      (p) => !SENSITIVE_FILENAME_PATTERNS.some((pattern) => pattern.test(path.basename(p))),
      {
        message: "Forbidden sensitive filename pattern detected (e.g. .env, credentials, or private keys).",
      }
    ),
  content: z
    .string()
    .refine((content) => Buffer.byteLength(content, "utf8") <= MAX_FILE_SIZE_BYTES, {
      message: `File content exceeds maximum allowed size of 1MB (${MAX_FILE_SIZE_BYTES} bytes)`,
    })
    .refine(
      (content) => !SENSITIVE_CONTENT_PATTERNS.some((pattern) => pattern.test(content)),
      {
        message: "File content contains sensitive credentials, private keys, or secret tokens.",
      }
    ),
});

/**
 * Zod schema for the component metadata
 */
export const bundleMetaSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens (e.g. 'pricing-card', 'hero-section')"
    ),
  name: z.string().min(1, "Name is required").max(120, "Name cannot exceed 120 characters").trim(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description cannot exceed 2000 characters")
    .trim(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(60, "Category cannot exceed 60 characters")
    .trim(),
  version: z
    .string()
    .min(1, "Version is required")
    .regex(
      /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/,
      "Version must follow semantic versioning format (e.g. '1.0.0' or '1.0.0-beta.1')"
    ),
  accessLevel: z.enum(["free", "premium"]).default("free"),
  status: z.enum(["draft", "published"]).default("draft"),
  dependencies: z.array(z.string()).default([]),
  props: z.record(z.string(), z.unknown()).default({}),
  entryPoint: z.string().optional(),
});

/**
 * Top-level Zod schema for ComponentBundle { files, meta }
 */
export const componentBundleSchema = z
  .object({
    files: z
      .array(bundleFileSchema)
      .min(1, "Bundle must contain at least one file")
      .max(
        MAX_BUNDLE_FILES_COUNT,
        `Bundle contains too many files (maximum allowed is ${MAX_BUNDLE_FILES_COUNT})`
      ),
    meta: bundleMetaSchema,
  })
  .superRefine((data, ctx) => {
    // 1. Validate total size across all files
    let totalSizeBytes = 0;
    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i];
      const byteSize = Buffer.byteLength(file.content, "utf8");
      totalSizeBytes += byteSize;
    }

    if (totalSizeBytes > MAX_BUNDLE_TOTAL_SIZE_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total bundle size (${totalSizeBytes} bytes) exceeds maximum limit of 10MB (${MAX_BUNDLE_TOTAL_SIZE_BYTES} bytes)`,
        path: ["files"],
      });
    }

    // 2. Validate uniqueness of file paths
    const seenPaths = new Set<string>();
    for (let i = 0; i < data.files.length; i++) {
      const normalized = data.files[i].path.replace(/\\/g, "/");
      if (seenPaths.has(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate file path detected in bundle: '${data.files[i].path}'`,
          path: ["files", i, "path"],
        });
      }
      seenPaths.add(normalized);
    }

    // 3. If entryPoint is provided in meta, verify that it matches an uploaded file
    if (data.meta.entryPoint) {
      const normalizedEntry = data.meta.entryPoint.replace(/\\/g, "/");
      if (!seenPaths.has(normalizedEntry)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Entry point '${data.meta.entryPoint}' specified in meta does not match any file in the bundle`,
          path: ["meta", "entryPoint"],
        });
      }
    }
  });

export type ValidatedComponentBundle = z.infer<typeof componentBundleSchema>;

export interface ValidationSuccess {
  isValid: true;
  data: ValidatedComponentBundle;
  errors?: never;
}

export interface ValidationFailure {
  isValid: false;
  errors: string[];
  data?: never;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Validates a component bundle payload and returns detailed validation errors or typed data
 */
export function validateComponentBundle(payload: unknown): ValidationResult {
  const result = componentBundleSchema.safeParse(payload);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const fieldPath = issue.path.length > 0 ? `[${issue.path.join(".")}] ` : "";
      return `${fieldPath}${issue.message}`;
    });

    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}
