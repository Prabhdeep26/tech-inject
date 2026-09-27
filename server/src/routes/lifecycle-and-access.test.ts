import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { app } from "../app.js";
import { connectDB, disconnectDB } from "../db/mongoose.js";
import { ComponentModel, ComponentBundleModel, UserModel } from "../models/index.js";
import { deleteBundleFiles } from "../storage/gridfs.js";
import { fetchComponentBundle, installComponent } from "@tech-inject/installer";

describe("Automated Test Suite: Admin Security, Draft Concealment, Bundle Publishing & Sync Consistency", () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let tempInstallDir: string;

  const timestamp = Date.now();
  const testCustomerEmail = `customer_lifecycle_${timestamp}@example.com`;
  const draftSlug = `draft-test-isolated-${timestamp}`;
  const validSyncSlug = `sync-metric-badge-${timestamp}`;
  const syncVersion = "2.1.0";
  const syncFileContent = `export const SyncMetricBadge = () => <div className="badge">Sync Metric v${syncVersion}</div>;`;

  before(async () => {
    await connectDB();
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = (server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;

    tempInstallDir = await fs.mkdtemp(path.join(os.tmpdir(), "tech-inject-lifecycle-test-"));

    // Clean up test data if pre-existing
    await UserModel.deleteMany({ email: testCustomerEmail });
    await ComponentModel.deleteMany({ slug: { $in: [draftSlug, validSyncSlug] } });
    await ComponentBundleModel.deleteMany({ slug: { $in: [draftSlug, validSyncSlug] } });

    // 1. Admin login to obtain admin token/cookie
    const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@tech-inject.dev", password: "admin123" }),
    });
    assert.strictEqual(adminLoginRes.status, 200, "Admin login must succeed");
    const adminSetCookie = adminLoginRes.headers.get("set-cookie");
    adminToken = adminSetCookie?.match(/tech_inject_admin_token=([^;]+)/)?.[1] || "";
    assert.ok(adminToken, "Admin cookie must be established");

    // 2. Register regular customer (non-admin)
    const custRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testCustomerEmail, password: "password123" }),
    });
    assert.strictEqual(custRegRes.status, 201, "Customer register must succeed");
    const custData = await custRegRes.json();
    customerId = custData.data.user._id || custData.data.user.id;
    const custSetCookie = custRegRes.headers.get("set-cookie");
    customerToken = custSetCookie?.match(/tech_inject_auth_token=([^;]+)/)?.[1] || "";
    assert.ok(customerToken, "Customer cookie must be established");
    assert.ok(customerId, "Customer ID must be established");

    // 3. Create a draft component for test (b)
    const draftCreateRes = await fetch(`${baseUrl}/admin/components`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `tech_inject_admin_token=${adminToken}`,
      },
      body: JSON.stringify({
        slug: draftSlug,
        name: "Confidential Draft Component",
        description: "An unpublished draft component",
        category: "internal",
        version: "0.1.0",
        accessLevel: "free",
        status: "draft",
      }),
    });
    assert.strictEqual(draftCreateRes.status, 201, "Draft component creation must succeed");
  });

  after(async () => {
    await UserModel.deleteMany({ email: testCustomerEmail });
    await ComponentModel.deleteMany({ slug: { $in: [draftSlug, validSyncSlug] } });
    await ComponentBundleModel.deleteMany({ slug: { $in: [draftSlug, validSyncSlug] } });
    await deleteBundleFiles(validSyncSlug);
    if (tempInstallDir) {
      await fs.rm(tempInstallDir, { recursive: true, force: true }).catch(() => {});
    }
    server.close();
    await disconnectDB();
  });

  // =========================================================================
  // (a) Unauthenticated request to ANY admin write endpoint returns 401/403
  // =========================================================================
  describe("(a) Unauthenticated & Non-Admin Requests to Admin Write Endpoints", () => {
    const adminWriteEndpoints = [
      { method: "POST", getPath: () => "/admin/components", payload: { slug: "sample-slug" } },
      { method: "PATCH", getPath: () => `/admin/components/${draftSlug}`, payload: { name: "Updated Name" } },
      { method: "POST", getPath: () => `/admin/components/${draftSlug}/publish` },
      { method: "POST", getPath: () => `/admin/components/${draftSlug}/unpublish` },
      { method: "POST", getPath: () => "/admin/bundles", payload: { files: [], meta: {} } },
      { method: "POST", getPath: () => "/admin/components/bundle", payload: { files: [], meta: {} } },
      { method: "POST", getPath: () => "/admin/components/upload", payload: { files: [], meta: {} } },
      { method: "POST", getPath: () => "/admin/components/validate", payload: { slug: "validate-test" } },
      { method: "POST", getPath: () => "/admin/bundles/validate", payload: { files: [], meta: {} } },
      { method: "POST", getPath: () => `/admin/customers/${customerId}/grant-premium` },
      { method: "POST", getPath: () => `/admin/customers/${customerId}/revoke-premium` },
    ];

    for (const { method, getPath, payload } of adminWriteEndpoints) {
      it(`Unauthenticated request to ${method} write endpoint returns 401 Unauthorized`, async () => {
        const epPath = getPath();
        const res = await fetch(`${baseUrl}${epPath}`, {
          method,
          headers: payload ? { "Content-Type": "application/json" } : undefined,
          body: payload ? JSON.stringify(payload) : undefined,
        });

        assert.strictEqual(
          res.status,
          401,
          `Expected 401 for unauthenticated request to ${method} ${epPath}, got ${res.status}`
        );
        const body = await res.json();
        assert.strictEqual(body.status, "error");
      });

      it(`Non-admin (customer) request to ${method} write endpoint returns 403 Forbidden`, async () => {
        const epPath = getPath();
        const res = await fetch(`${baseUrl}${epPath}`, {
          method,
          headers: {
            ...(payload ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${customerToken}`,
          },
          body: payload ? JSON.stringify(payload) : undefined,
        });

        assert.strictEqual(
          res.status,
          403,
          `Expected 403 for non-admin request to ${method} ${epPath}, got ${res.status}`
        );
        const body = await res.json();
        assert.strictEqual(body.status, "error");
        assert.ok(
          body.message.includes("Administrative privileges required") ||
            body.message.includes("Access denied"),
          `Expected clear forbidden error message, got: ${body.message}`
        );
      });
    }
  });

  // =========================================================================
  // (b) Public GET request for a draft/unpublished component's slug returns 404
  // =========================================================================
  describe("(b) Public GET Requests for Draft / Unpublished Component Return 404", () => {
    it("public GET /components/:slug returns 404 for draft component", async () => {
      const res = await fetch(`${baseUrl}/components/${draftSlug}`);
      assert.strictEqual(res.status, 404, "Draft component metadata must return 404 to public");
      const body = await res.json();
      assert.strictEqual(body.status, "error");
      assert.ok(body.message.includes("not found"));
    });

    it("public GET /components/:slug/source returns 404 for draft component", async () => {
      const res = await fetch(`${baseUrl}/components/${draftSlug}/source`);
      assert.strictEqual(res.status, 404, "Draft component source must return 404 to public");
      const body = await res.json();
      assert.strictEqual(body.status, "error");
      assert.ok(body.message.includes("not found"));
    });

    it("public GET /components/:slug/download returns 404 for draft component", async () => {
      const res = await fetch(`${baseUrl}/components/${draftSlug}/download`);
      assert.strictEqual(res.status, 404, "Draft component download must return 404 to public");
      const body = await res.json();
      assert.strictEqual(body.status, "error");
      assert.ok(body.message.includes("not found"));
    });

    it("public GET /components/:slug/agent-prompt returns 404 for draft component", async () => {
      const res = await fetch(`${baseUrl}/components/${draftSlug}/agent-prompt`);
      assert.strictEqual(res.status, 404, "Draft component agent-prompt must return 404 to public");
      const body = await res.json();
      assert.strictEqual(body.status, "error");
      assert.ok(body.message.includes("not found"));
    });

    it("public GET /components catalogue listing completely excludes draft components", async () => {
      const res = await fetch(`${baseUrl}/components`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const isDraftListed = body.data.components.some((c: any) => c.slug === draftSlug);
      assert.strictEqual(isDraftListed, false, "Draft component must not be present in public listing");
    });
  });

  // =========================================================================
  // (c) Publishing a valid bundle succeeds and invalid bundle is rejected
  // =========================================================================
  describe("(c) Component Bundle Validation & Publishing", () => {
    it("rejects an invalid bundle missing required field (files empty) with 400 and clear error", async () => {
      const invalidPayload = {
        files: [],
        meta: {
          slug: "invalid-missing-files",
          name: "Invalid Component",
          description: "Missing files array",
          category: "ui",
          version: "1.0.0",
        },
      };

      const res = await fetch(`${baseUrl}/admin/bundles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `tech_inject_admin_token=${adminToken}`,
        },
        body: JSON.stringify(invalidPayload),
      });

      assert.strictEqual(res.status, 400, "Should return 400 for empty files");
      const body = await res.json();
      assert.strictEqual(body.status, "error");
      assert.ok(Array.isArray(body.errors), "Should return errors array");
      assert.ok(
        body.errors.some((err: string) => err.includes("at least one file")),
        `Expected missing files error, got: ${JSON.stringify(body.errors)}`
      );
    });

    it("rejects an invalid bundle missing required metadata field (meta.slug missing) with 400", async () => {
      const invalidPayload = {
        files: [{ path: "Comp.tsx", content: "export default () => <div>Test</div>" }],
        meta: {
          // slug missing
          name: "Missing Slug Component",
          description: "No slug provided",
          category: "ui",
          version: "1.0.0",
        },
      };

      const res = await fetch(`${baseUrl}/admin/bundles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `tech_inject_admin_token=${adminToken}`,
        },
        body: JSON.stringify(invalidPayload),
      });

      assert.strictEqual(res.status, 400, "Should return 400 for missing slug");
      const body = await res.json();
      assert.strictEqual(body.status, "error");
      assert.ok(
        body.errors.some((err: string) => err.includes("slug")),
        `Expected slug error, got: ${JSON.stringify(body.errors)}`
      );
    });

    it("rejects an invalid bundle with disallowed file type (e.g. .exe or .sh) with 400 and clear error", async () => {
      const disallowedPayload = {
        files: [
          { path: "Exploit.tsx", content: "export const Exploit = () => null;" },
          { path: "malicious-script.sh", content: "#!/bin/sh\nrm -rf /" },
        ],
        meta: {
          slug: "disallowed-file-comp",
          name: "Disallowed File Component",
          description: "Contains disallowed shell script",
          category: "ui",
          version: "1.0.0",
        },
      };

      const res = await fetch(`${baseUrl}/admin/bundles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `tech_inject_admin_token=${adminToken}`,
        },
        body: JSON.stringify(disallowedPayload),
      });

      assert.strictEqual(res.status, 400, "Should return 400 for disallowed file extension");
      const body = await res.json();
      assert.strictEqual(body.status, "error");
      assert.ok(
        body.errors.some((err: string) => err.includes("Unsupported file extension")),
        `Expected 'Unsupported file extension' error, got: ${JSON.stringify(body.errors)}`
      );
    });

    it("successfully uploads and stores a valid component bundle in GridFS & MongoDB", async () => {
      const validBundlePayload = {
        files: [
          {
            path: "SyncMetricBadge.tsx",
            content: syncFileContent,
          },
          {
            path: "SyncMetricBadge.css",
            content: ".badge { display: inline-flex; padding: 4px 8px; border-radius: 4px; }",
          },
        ],
        meta: {
          slug: validSyncSlug,
          name: "Sync Metric Badge",
          description: "A synchronized metric badge component for live verification.",
          category: "metrics",
          version: syncVersion,
          accessLevel: "free",
          status: "draft",
          entryPoint: "SyncMetricBadge.tsx",
          props: {
            label: { type: "string", required: true, description: "Metric title text" },
          },
          dependencies: ["react"],
        },
      };

      const res = await fetch(`${baseUrl}/admin/bundles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `tech_inject_admin_token=${adminToken}`,
        },
        body: JSON.stringify(validBundlePayload),
      });

      assert.strictEqual(res.status, 201, "Bundle upload must return 201 Created");
      const body = await res.json();
      assert.strictEqual(body.status, "success");
      assert.strictEqual(body.data.component.slug, validSyncSlug);
      assert.strictEqual(body.data.component.version, syncVersion);
      assert.strictEqual(body.data.bundle.files.length, 2);
    });

    it("successfully publishes the component via POST /admin/components/:id/publish", async () => {
      const res = await fetch(`${baseUrl}/admin/components/${validSyncSlug}/publish`, {
        method: "POST",
        headers: {
          Cookie: `tech_inject_admin_token=${adminToken}`,
        },
      });

      assert.strictEqual(res.status, 200, "Publish endpoint must return 200 OK");
      const body = await res.json();
      assert.strictEqual(body.status, "success");
      assert.strictEqual(body.data.component.status, "published");
    });
  });

  // =========================================================================
  // (d) Installer + source endpoint + agent-prompt endpoint reflect same version & content
  // =========================================================================
  describe("(d) Consistency Across Installer, Source Endpoint, and Agent-Prompt Endpoint", () => {
    it("confirms source endpoint reflects published version and file content", async () => {
      const res = await fetch(`${baseUrl}/components/${validSyncSlug}/source`);
      assert.strictEqual(res.status, 200, "Source endpoint must return 200 for published component");
      const body = await res.json();

      assert.strictEqual(body.status, "success");
      assert.strictEqual(body.data.slug, validSyncSlug);
      assert.strictEqual(body.data.version, syncVersion);

      const tsxFile = body.data.files.find((f: any) => f.path === "SyncMetricBadge.tsx");
      assert.ok(tsxFile, "Source files must include SyncMetricBadge.tsx");
      assert.strictEqual(tsxFile.content, syncFileContent, "Source file content must match published content");
    });

    it("confirms agent-prompt endpoint reflects the same version and component specifications", async () => {
      const res = await fetch(`${baseUrl}/components/${validSyncSlug}/agent-prompt`);
      assert.strictEqual(res.status, 200, "Agent prompt endpoint must return 200 for published component");
      const body = await res.json();

      assert.strictEqual(body.status, "success");
      assert.strictEqual(body.data.slug, validSyncSlug);
      assert.strictEqual(body.data.version, syncVersion);

      // Verify the generated prompt includes the identical version and metadata
      assert.ok(
        body.data.prompt.includes(`v${syncVersion}`),
        `Agent prompt must contain version 'v${syncVersion}'`
      );
      assert.ok(
        body.data.prompt.includes("Sync Metric Badge"),
        "Agent prompt must contain component name"
      );
      assert.ok(
        body.data.prompt.includes(validSyncSlug),
        "Agent prompt must contain component slug"
      );
    });

    it("confirms installer fetches and extracts the identical version and file content to disk", async () => {
      // 1. Test bundle client fetch
      const bundle = await fetchComponentBundle(validSyncSlug, { apiUrl: baseUrl });
      assert.strictEqual(bundle.slug, validSyncSlug);
      assert.strictEqual(bundle.version, syncVersion, "Installer fetched bundle version must match");

      const bundleTsx = bundle.files.find((f) => f.path === "SyncMetricBadge.tsx");
      assert.ok(bundleTsx, "Installer bundle must contain SyncMetricBadge.tsx");
      assert.strictEqual(bundleTsx.content, syncFileContent, "Installer bundle file content must match");

      // 2. Test full installer file writing to target directory
      const installResult = await installComponent({
        slug: validSyncSlug,
        targetDir: tempInstallDir,
        apiUrl: baseUrl,
      });
      assert.strictEqual(installResult.version, syncVersion, "Installer result version must match");
      assert.strictEqual(installResult.slug, validSyncSlug);

      // Verify written file on disk
      const writtenFilePath = path.join(tempInstallDir, "SyncMetricBadge.tsx");
      const writtenDiskContent = await fs.readFile(writtenFilePath, "utf8");
      assert.strictEqual(
        writtenDiskContent,
        syncFileContent,
        "File written to disk by installer must match source endpoint and bundle content exactly"
      );
    });

    it("verifies absolute version and content equality across all three consumption channels", async () => {
      // Channel 1: Source Endpoint
      const sourceRes = await fetch(`${baseUrl}/components/${validSyncSlug}/source`);
      const sourceBody = await sourceRes.json();
      const sourceVersion = sourceBody.data.version;
      const sourceContent = sourceBody.data.files.find((f: any) => f.path === "SyncMetricBadge.tsx").content;

      // Channel 2: Agent Prompt Endpoint
      const promptRes = await fetch(`${baseUrl}/components/${validSyncSlug}/agent-prompt`);
      const promptBody = await promptRes.json();
      const promptVersion = promptBody.data.version;

      // Channel 3: Installer Client
      const bundle = await fetchComponentBundle(validSyncSlug, { apiUrl: baseUrl });
      const installerVersion = bundle.version;
      const installerContent = bundle.files.find((f) => f.path === "SyncMetricBadge.tsx")?.content;

      // Assert complete synchrony across channels
      assert.strictEqual(sourceVersion, syncVersion, "Source version matches published version");
      assert.strictEqual(promptVersion, syncVersion, "Prompt version matches published version");
      assert.strictEqual(installerVersion, syncVersion, "Installer version matches published version");

      assert.strictEqual(sourceVersion, promptVersion, "Source and Prompt versions are identical");
      assert.strictEqual(sourceVersion, installerVersion, "Source and Installer versions are identical");

      assert.strictEqual(sourceContent, syncFileContent, "Source content is exact");
      assert.strictEqual(installerContent, syncFileContent, "Installer content is exact");
      assert.strictEqual(sourceContent, installerContent, "Source and Installer contents are identical");
    });
  });
});
