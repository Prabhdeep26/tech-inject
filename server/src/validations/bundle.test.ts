import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateComponentBundle,
  MAX_FILE_SIZE_BYTES,
  MAX_BUNDLE_TOTAL_SIZE_BYTES,
  MAX_BUNDLE_FILES_COUNT,
  isAllowedFileExtension,
  isSafeRelativePath,
} from "./bundle.js";

describe("ComponentBundle Validation", () => {
  const validMeta = {
    slug: "pricing-card",
    name: "Pricing Card",
    description: "A responsive pricing card component",
    category: "marketing",
    version: "1.0.0",
    accessLevel: "free" as const,
    status: "published" as const,
    props: {
      title: { type: "string", required: true },
      price: { type: "number", required: true },
    },
    dependencies: ["lucide-react"],
    entryPoint: "PricingCard.tsx",
  };

  const validFiles = [
    {
      path: "PricingCard.tsx",
      content: "export function PricingCard() { return <div>Pricing</div>; }",
    },
    {
      path: "styles.css",
      content: ".pricing-card { display: flex; }",
    },
    {
      path: "schema.json",
      content: JSON.stringify({ version: 1 }),
    },
  ];

  describe("1. Valid Bundles Acceptance", () => {
    it("should accept a complete, valid component bundle", () => {
      const result = validateComponentBundle({
        files: validFiles,
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, true);
      if (result.isValid) {
        assert.strictEqual(result.data.meta.slug, "pricing-card");
        assert.strictEqual(result.data.files.length, 3);
        assert.strictEqual(result.data.meta.accessLevel, "free");
      }
    });

    it("should apply default values for optional metadata", () => {
      const minimalMeta = {
        slug: "hero-section",
        name: "Hero Section",
        description: "Modern hero section",
        category: "headers",
        version: "2.1.0",
      };

      const result = validateComponentBundle({
        files: [{ path: "Hero.tsx", content: "export default () => <h1>Hero</h1>" }],
        meta: minimalMeta,
      });

      assert.strictEqual(result.isValid, true);
      if (result.isValid) {
        assert.strictEqual(result.data.meta.accessLevel, "free");
        assert.strictEqual(result.data.meta.status, "draft");
        assert.deepStrictEqual(result.data.meta.dependencies, []);
        assert.deepStrictEqual(result.data.meta.props, {});
      }
    });

    it("should allow supported extensions: tsx, jsx, ts, js, mjs, cjs, css, scss, sass, json, md, mdx, svg", () => {
      const supportedExtensions = [
        "Component.tsx",
        "Widget.jsx",
        "utils.ts",
        "helper.js",
        "plugin.mjs",
        "legacy.cjs",
        "style.css",
        "theme.scss",
        "grid.sass",
        "config.json",
        "README.md",
        "docs.mdx",
        "icon.svg",
      ];

      for (const filePath of supportedExtensions) {
        assert.strictEqual(
          isAllowedFileExtension(filePath),
          true,
          `Expected ${filePath} to be allowed`
        );
      }
    });
  });

  describe("2. Missing Required Fields", () => {
    it("should reject payload when files is missing", () => {
      const result = validateComponentBundle({
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("files")));
      }
    });

    it("should reject when files is not an array", () => {
      const result = validateComponentBundle({
        files: "not-an-array",
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("array")));
      }
    });

    it("should reject empty files array", () => {
      const result = validateComponentBundle({
        files: [],
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("at least one file")));
      }
    });

    it("should reject a file missing 'path'", () => {
      const result = validateComponentBundle({
        files: [{ content: "const a = 1;" } as unknown as { path: string; content: string }],
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.toLowerCase().includes("path")));
      }
    });

    it("should reject a file missing 'content'", () => {
      const result = validateComponentBundle({
        files: [{ path: "Button.tsx" } as unknown as { path: string; content: string }],
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.toLowerCase().includes("content")));
      }
    });

    it("should reject payload when meta is missing", () => {
      const result = validateComponentBundle({
        files: validFiles,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("meta")));
      }
    });

    it("should reject when meta.slug is missing or empty", () => {
      const result = validateComponentBundle({
        files: validFiles,
        meta: { ...validMeta, slug: "" },
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("slug")));
      }
    });

    it("should reject invalid slug format with spaces, uppercase, or special characters", () => {
      const invalidSlugs = ["Pricing Card", "PricingCard", "pricing_card", "-pricing", "card-"];

      for (const slug of invalidSlugs) {
        const result = validateComponentBundle({
          files: validFiles,
          meta: { ...validMeta, slug },
        });

        assert.strictEqual(result.isValid, false, `Expected slug '${slug}' to be rejected`);
      }
    });

    it("should reject when meta.name is missing or empty", () => {
      const result = validateComponentBundle({
        files: validFiles,
        meta: { ...validMeta, name: "" },
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("name")));
      }
    });

    it("should reject when meta.description is missing or empty", () => {
      const result = validateComponentBundle({
        files: validFiles,
        meta: { ...validMeta, description: "" },
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("description")));
      }
    });

    it("should reject when meta.category is missing or empty", () => {
      const result = validateComponentBundle({
        files: validFiles,
        meta: { ...validMeta, category: "" },
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("category")));
      }
    });

    it("should reject when meta.version is not valid semver", () => {
      const invalidVersions = ["v1", "beta", "1.0", "1.0.0.0"];

      for (const version of invalidVersions) {
        const result = validateComponentBundle({
          files: validFiles,
          meta: { ...validMeta, version },
        });

        assert.strictEqual(result.isValid, false, `Expected version '${version}' to be rejected`);
      }
    });

    it("should reject when entryPoint does not match any file in bundle", () => {
      const result = validateComponentBundle({
        files: [{ path: "Button.tsx", content: "export const Button = () => null;" }],
        meta: { ...validMeta, entryPoint: "NonExistent.tsx" },
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("Entry point")));
      }
    });

    it("should reject duplicate file paths", () => {
      const result = validateComponentBundle({
        files: [
          { path: "Button.tsx", content: "export const Button = () => 1;" },
          { path: "Button.tsx", content: "export const Button = () => 2;" },
        ],
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("Duplicate file path")));
      }
    });
  });

  describe("3. Unsupported File Types and Insecure Paths", () => {
    const unsupportedFiles = [
      "malicious.exe",
      "script.sh",
      "run.bat",
      "command.cmd",
      "server.php",
      "exploit.py",
      "runner.rb",
      "index.html",
      "template.htm",
      "archive.zip",
      "binary.bin",
      "Dockerfile",
      "Makefile",
      ".env",
    ];

    it("should reject any file with unsupported extension", () => {
      for (const fileName of unsupportedFiles) {
        assert.strictEqual(
          isAllowedFileExtension(fileName),
          false,
          `Expected ${fileName} to be rejected by extension checker`
        );

        const result = validateComponentBundle({
          files: [{ path: fileName, content: "arbitrary-content" }],
          meta: validMeta,
        });

        assert.strictEqual(
          result.isValid,
          false,
          `Expected bundle with file '${fileName}' to be rejected`
        );
        if (!result.isValid) {
          assert.ok(
            result.errors.some(
              (e) => e.includes("Unsupported file extension") || e.includes("safe, relative path")
            )
          );
        }
      }
    });

    it("should reject path traversal attempts (..)", () => {
      const traversalPaths = [
        "../secret.tsx",
        "components/../../etc/passwd.ts",
        "foo/../bar/../../../evil.tsx",
      ];

      for (const p of traversalPaths) {
        assert.strictEqual(isSafeRelativePath(p), false, `Expected path '${p}' to be unsafe`);

        const result = validateComponentBundle({
          files: [{ path: p, content: "code" }],
          meta: validMeta,
        });

        assert.strictEqual(result.isValid, false);
        if (!result.isValid) {
          assert.ok(result.errors.some((e) => e.includes("directory traversal")));
        }
      }
    });

    it("should reject absolute paths", () => {
      const absolutePaths = [
        "/etc/passwd.ts",
        "\\Windows\\system32\\drivers.tsx",
      ];

      for (const p of absolutePaths) {
        assert.strictEqual(isSafeRelativePath(p), false, `Expected path '${p}' to be unsafe`);

        const result = validateComponentBundle({
          files: [{ path: p, content: "code" }],
          meta: validMeta,
        });

        assert.strictEqual(result.isValid, false);
      }
    });

    it("should reject paths containing null bytes", () => {
      const nullBytePath = "Button.tsx\0.exe";
      assert.strictEqual(isSafeRelativePath(nullBytePath), false);

      const result = validateComponentBundle({
        files: [{ path: nullBytePath, content: "code" }],
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
    });
  });

  describe("4. Oversized Payloads", () => {
    it("should reject an individual file exceeding 1MB", () => {
      // 1MB + 10 bytes
      const oversizedContent = "A".repeat(MAX_FILE_SIZE_BYTES + 10);

      const result = validateComponentBundle({
        files: [{ path: "HeavyComponent.tsx", content: oversizedContent }],
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("exceeds maximum allowed size of 1MB")));
      }
    });

    it("should reject bundle when total payload exceeds 10MB", () => {
      // 11 files of 950KB each = ~10.45MB total
      const fileSize = 950 * 1024;
      const fileContent = "B".repeat(fileSize);

      const files = Array.from({ length: 11 }, (_, i) => ({
        path: `File_${i}.tsx`,
        content: fileContent,
      }));

      const result = validateComponentBundle({
        files,
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(
          result.errors.some((e) => e.includes("Total bundle size") && e.includes("exceeds maximum limit"))
        );
      }
    });

    it("should reject bundle containing more than 50 files", () => {
      const files = Array.from({ length: MAX_BUNDLE_FILES_COUNT + 1 }, (_, i) => ({
        path: `File_${i}.tsx`,
        content: `export const X${i} = ${i};`,
      }));

      const result = validateComponentBundle({
        files,
        meta: validMeta,
      });

      assert.strictEqual(result.isValid, false);
      if (!result.isValid) {
        assert.ok(result.errors.some((e) => e.includes("too many files")));
      }
    });
  });
});
