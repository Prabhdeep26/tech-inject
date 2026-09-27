import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeSecrets } from "../middleware/errorHandler.js";
import { validateComponentBundle } from "./bundle.js";

describe("Security Audit: Secret Redaction & Leakage Prevention", () => {
  describe("1. sanitizeSecrets String Redaction", () => {
    it("redacts MongoDB connection strings containing username and password", () => {
      const leaked = "Failed to connect to mongodb://admin:SuperSecretPassword123!@cluster0.mongodb.net/db?retryWrites=true";
      const sanitized = sanitizeSecrets(leaked);
      assert.strictEqual(
        sanitized,
        "Failed to connect to mongodb://***:***@cluster0.mongodb.net/db?retryWrites=true"
      );
      assert.strictEqual(sanitized.includes("SuperSecretPassword123!"), false);
      assert.strictEqual(sanitized.includes("admin"), false);
    });

    it("redacts mongodb+srv connection URIs", () => {
      const leaked = "Error at mongodb+srv://app_user:VerySecretKey%40123@prod-cluster.mongodb.net/production";
      const sanitized = sanitizeSecrets(leaked);
      assert.strictEqual(
        sanitized,
        "Error at mongodb+srv://***:***@prod-cluster.mongodb.net/production"
      );
      assert.strictEqual(sanitized.includes("VerySecretKey"), false);
    });

    it("redacts Bearer tokens and raw JWTs", () => {
      const rawJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const leaked = `Authorization failed for Bearer ${rawJwt}`;
      const sanitized = sanitizeSecrets(leaked);
      assert.strictEqual(sanitized.includes(rawJwt), false);
      assert.ok(sanitized.includes("[REDACTED]"));
    });

    it("redacts passwords and secret keys from query/json error fragments", () => {
      const leaked = 'Database query failed with {"password": "PlainTextSecret", "secret": "xyz123"}';
      const sanitized = sanitizeSecrets(leaked);
      assert.strictEqual(sanitized.includes("PlainTextSecret"), false);
      assert.strictEqual(sanitized.includes("xyz123"), false);
    });
  });

  describe("2. Component Bundle Upload Secret Scanning", () => {
    const validMeta = {
      slug: "secure-widget",
      name: "Secure Widget",
      description: "A secure standalone widget",
      category: "ui",
      version: "1.0.0",
    };

    it("rejects bundle containing .env or .env.local file", () => {
      const forbiddenNames = [".env", ".env.local", ".env.production", ".env.staging"];
      for (const name of forbiddenNames) {
        const result = validateComponentBundle({
          files: [{ path: name, content: "DATABASE_URL=postgres://..." }],
          meta: validMeta,
        });
        assert.strictEqual(result.isValid, false, `Expected ${name} to be rejected`);
        if (!result.isValid) {
          assert.ok(
            result.errors.some((e) => e.includes("sensitive filename pattern") || e.includes("Unsupported file extension")),
            `Expected sensitive filename error, got: ${JSON.stringify(result.errors)}`
          );
        }
      }
    });

    it("rejects bundle containing credentials.json or secrets.json", () => {
      const forbiddenNames = ["credentials.json", "secrets.json", "secret.json", "my-credentials.json"];
      for (const name of forbiddenNames) {
        const result = validateComponentBundle({
          files: [{ path: name, content: JSON.stringify({ key: "secret" }) }],
          meta: validMeta,
        });
        assert.strictEqual(result.isValid, false, `Expected ${name} to be rejected`);
        if (!result.isValid) {
          assert.ok(
            result.errors.some((e) => e.includes("sensitive filename pattern")),
            `Expected sensitive filename error for ${name}`
          );
        }
      }
    });

    it("rejects bundle file containing private keys", () => {
      const privateKeyContent = `
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y3eZ6T...FAKE...PRIVATE...KEY...
-----END RSA PRIVATE KEY-----
`;
      const result = validateComponentBundle({
        files: [{ path: "KeyComponent.tsx", content: privateKeyContent }],
        meta: validMeta,
      });
      assert.strictEqual(result.isValid, false, "Bundle with private key must be rejected");
      if (!result.isValid) {
        assert.ok(
          result.errors.some((e) => e.includes("sensitive credentials, private keys, or secret tokens")),
          `Expected private key rejection error, got: ${JSON.stringify(result.errors)}`
        );
      }
    });

    it("rejects bundle file containing embedded live AWS credentials or GitHub PATs", () => {
      const leakedAws = 'const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";';
      const result = validateComponentBundle({
        files: [{ path: "AwsUploader.tsx", content: leakedAws }],
        meta: validMeta,
      });
      assert.strictEqual(result.isValid, false, "Bundle with AWS access key must be rejected");
      if (!result.isValid) {
        assert.ok(
          result.errors.some((e) => e.includes("sensitive credentials")),
          `Expected AWS key error, got: ${JSON.stringify(result.errors)}`
        );
      }
    });

    it("rejects bundle file containing embedded MongoDB connection strings with passwords", () => {
      const leakedMongo = 'const dbUri = "mongodb://admin:MySecretPassword@localhost:27017/prod";';
      const result = validateComponentBundle({
        files: [{ path: "DatabaseHelper.ts", content: leakedMongo }],
        meta: validMeta,
      });
      assert.strictEqual(result.isValid, false, "Bundle with connection string must be rejected");
      if (!result.isValid) {
        assert.ok(
          result.errors.some((e) => e.includes("sensitive credentials")),
          `Expected MongoDB URI rejection, got: ${JSON.stringify(result.errors)}`
        );
      }
    });
  });
});
