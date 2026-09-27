import { Readable } from "node:stream";
import path from "node:path";
import mongoose from "mongoose";

export interface StoredBundleFile {
  path: string;
  fileId: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}

const MIME_MAP: Record<string, string> = {
  ".tsx": "text/plain",
  ".jsx": "text/plain",
  ".ts": "text/plain",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".cjs": "application/javascript",
  ".css": "text/css",
  ".scss": "text/x-scss",
  ".sass": "text/x-sass",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".md": "text/markdown",
  ".mdx": "text/markdown",
};

/**
 * Maps a file path extension to an appropriate MIME content-type
 */
export function getFileMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || "text/plain";
}

let bucketInstance: mongoose.mongo.GridFSBucket | null = null;

/**
 * Returns a GridFSBucket instance bound to the active MongoDB connection
 */
export function getGridFSBucket(): mongoose.mongo.GridFSBucket {
  if (!mongoose.connection.db) {
    throw new Error("Cannot initialize GridFSBucket: MongoDB is not connected");
  }

  if (!bucketInstance || mongoose.connection.readyState !== 1) {
    bucketInstance = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "component_bundles",
    });
  }

  return bucketInstance;
}

/**
 * Store bundle files into MongoDB GridFS.
 *
 * CRITICAL SECURITY GUARANTEE:
 * File contents are treated strictly as passive text/binary data streams.
 * File contents are NEVER evaluated, interpreted, or executed via eval(),
 * Function constructors, vm module, or dynamic imports.
 */
export async function storeBundleFiles(
  slug: string,
  version: string,
  files: Array<{ path: string; content: string }>
): Promise<StoredBundleFile[]> {
  const bucket = getGridFSBucket();
  const storedFiles: StoredBundleFile[] = [];

  for (const file of files) {
    const byteSize = Buffer.byteLength(file.content, "utf8");
    const contentType = getFileMimeType(file.path);
    const normalizedPath = file.path.replace(/\\/g, "/");
    const gridFsFilename = `${slug}/${version}/${normalizedPath}`;
    const uploadedAt = new Date();

    const uploadStream = bucket.openUploadStream(gridFsFilename, {
      metadata: {
        slug,
        version,
        path: normalizedPath,
        contentType,
        size: byteSize,
        uploadedAt,
      },
    });

    const fileId = uploadStream.id.toString();

    // Stream the raw UTF-8 content directly into GridFS without execution or eval
    await new Promise<void>((resolve, reject) => {
      const buffer = Buffer.from(file.content, "utf8");
      const readableStream = Readable.from(buffer);

      readableStream
        .pipe(uploadStream)
        .on("error", (err) => {
          reject(new Error(`Failed to store bundle file '${file.path}' in GridFS: ${err.message}`));
        })
        .on("finish", () => {
          resolve();
        });
    });

    storedFiles.push({
      path: normalizedPath,
      fileId,
      size: byteSize,
      contentType,
      uploadedAt,
    });
  }

  return storedFiles;
}

/**
 * Opens a download stream for a stored file by GridFS file ID
 */
export function getBundleFileStream(fileId: string): NodeJS.ReadableStream {
  const bucket = getGridFSBucket();
  const objectId = new mongoose.Types.ObjectId(fileId);
  return bucket.openDownloadStream(objectId);
}

/**
 * Deletes files matching a component slug and optionally a specific version from GridFS
 */
export async function deleteBundleFiles(slug: string, version?: string): Promise<void> {
  const bucket = getGridFSBucket();
  const filter: Record<string, unknown> = { "metadata.slug": slug };
  if (version) {
    filter["metadata.version"] = version;
  }

  const cursor = bucket.find(filter);
  const filesToDelete = await cursor.toArray();

  for (const file of filesToDelete) {
    await bucket.delete(file._id);
  }
}

/**
 * Reads a stored file from GridFS and returns its content as a UTF-8 string.
 * Strictly reads passive data; never evaluates code.
 */
export async function getBundleFileContent(fileId: string): Promise<string> {
  const stream = getBundleFileStream(fileId);
  const chunks: Buffer[] = [];

  return new Promise<string>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("error", (err) => {
      reject(new Error(`Failed to read file from GridFS: ${err.message}`));
    });
    stream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
  });
}

