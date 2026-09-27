export interface InstallOptions {
  slug: string;
  targetDir: string;
  apiUrl?: string;
  token?: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface BundleFile {
  path: string;
  content: string;
  size?: number;
  contentType?: string;
}

export interface ComponentBundleResponse {
  slug: string;
  version?: string;
  entryPoint?: string;
  totalSize?: number;
  fileCount?: number;
  files: BundleFile[];
}

export interface InstallResult {
  success: boolean;
  slug: string;
  version?: string;
  targetDir: string;
  writtenFiles: string[];
  skippedFiles?: string[];
  warnings?: string[];
  error?: string;
}
