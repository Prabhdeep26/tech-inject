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
import { installComponent } from "@tech-inject/installer";

describe("End-to-End Premium Lifecycle: Publish → Denied → Grant → Allowed → Revoke → Denied", () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let tempInstallDir: string;

  const timestamp = Date.now();
  const customerEmail = `lifecycle_customer_${timestamp}@test.dev`;
  const premiumSlug = `premium-analytics-grid-${timestamp}`;
  const freeSlug = `free-badge-widget-${timestamp}`;

  const premiumContent = `export const PremiumAnalyticsGrid = () => <div className="grid">Enterprise Analytics v1.0.0</div>;`;
  const freeContent = `export const FreeBadgeWidget = () => <span className="badge">Public Free Badge</span>;`;

  before(async () => {
    await connectDB();
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = (server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;

    tempInstallDir = await fs.mkdtemp(path.join(os.tmpdir(), "tech-inject-premium-lifecycle-"));

    // Cleanup any lingering records
    await UserModel.deleteMany({ email: customerEmail });
    await ComponentModel.deleteMany({ slug: { $in: [premiumSlug, freeSlug] } });
    await ComponentBundleModel.deleteMany({ slug: { $in: [premiumSlug, freeSlug] } });

    // 1. Authenticate admin
    const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@tech-inject.dev", password: "admin123" }),
    });
    assert.strictEqual(adminLoginRes.status, 200, "Admin login must succeed");
    const adminSetCookie = adminLoginRes.headers.get("set-cookie");
    adminToken = adminSetCookie?.match(/tech_inject_admin_token=([^;]+)/)?.[1] || "";
    assert.ok(adminToken, "Admin cookie must be established");

    // 2. Register free customer
    const custRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: customerEmail, password: "Password123!" }),
    });
    assert.strictEqual(custRegRes.status, 201, "Customer registration must succeed");
    const custData = await custRegRes.json();
    customerId = custData.data.user._id || custData.data.user.id;
    const custSetCookie = custRegRes.headers.get("set-cookie");
    customerToken = custSetCookie?.match(/tech_inject_auth_token=([^;]+)/)?.[1] || "";
    assert.ok(customerToken, "Customer session token must be established");
    assert.ok(customerId, "Customer ID must be established");

    // 3. Admin publishes a FREE component
    const freeBundlePayload = {
      files: [{ path: "FreeBadge.tsx", content: freeContent }],
      meta: {
        slug: freeSlug,
        name: "Free Badge Widget",
        description: "Publicly accessible free component",
        category: "widgets",
        version: "1.0.0",
        accessLevel: "free",
        status: "published",
        entryPoint: "FreeBadge.tsx",
      },
    };
    const freeUploadRes = await fetch(`${baseUrl}/admin/bundles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `tech_inject_admin_token=${adminToken}`,
      },
      body: JSON.stringify(freeBundlePayload),
    });
    assert.strictEqual(freeUploadRes.status, 201, "Free bundle upload must succeed");

    // 4. Admin publishes a PREMIUM component
    const premiumBundlePayload = {
      files: [{ path: "PremiumAnalyticsGrid.tsx", content: premiumContent }],
      meta: {
        slug: premiumSlug,
        name: "Premium Analytics Grid",
        description: "Enterprise grade analytics visualization reserved for subscribers",
        category: "analytics",
        version: "1.0.0",
        accessLevel: "premium",
        status: "published",
        entryPoint: "PremiumAnalyticsGrid.tsx",
      },
    };
    const premiumUploadRes = await fetch(`${baseUrl}/admin/bundles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `tech_inject_admin_token=${adminToken}`,
      },
      body: JSON.stringify(premiumBundlePayload),
    });
    assert.strictEqual(premiumUploadRes.status, 201, "Premium bundle upload must succeed");
  });

  after(async () => {
    await UserModel.deleteMany({ email: customerEmail });
    await ComponentModel.deleteMany({ slug: { $in: [premiumSlug, freeSlug] } });
    await ComponentBundleModel.deleteMany({ slug: { $in: [premiumSlug, freeSlug] } });
    await deleteBundleFiles(premiumSlug);
    await deleteBundleFiles(freeSlug);
    if (tempInstallDir) {
      await fs.rm(tempInstallDir, { recursive: true, force: true }).catch(() => {});
    }
    server.close();
    await disconnectDB();
  });

  // =========================================================================
  // Helper functions for the four customer requests
  // =========================================================================
  async function testPreview(slug: string, token: string) {
    const res = await fetch(`${baseUrl}/components/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    return { status: res.status, body };
  }

  async function testSource(slug: string, token: string) {
    const res = await fetch(`${baseUrl}/components/${slug}/source`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    return { status: res.status, body };
  }

  async function testInstall(slug: string, token: string, targetSubdir: string) {
    const destDir = path.join(tempInstallDir, targetSubdir);
    try {
      const result = await installComponent({
        slug,
        targetDir: destDir,
        apiUrl: baseUrl,
        token,
        force: true,
      });
      return { success: true, result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async function testAgentPrompt(slug: string, token: string) {
    const res = await fetch(`${baseUrl}/components/${slug}/agent-prompt`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    return { status: res.status, body };
  }

  // =========================================================================
  // STAGE 1: Free Customer State (Initial)
  // All 4 requests to premium component MUST be denied.
  // All 4 requests to free component MUST succeed.
  // =========================================================================
  describe("Stage 1: Initial Free Customer Tier (Non-Premium)", () => {
    it("denies preview for premium component (returns locked metadata and strips bundle)", async () => {
      const { status, body } = await testPreview(premiumSlug, customerToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.component.isLocked, true, "Premium component must be marked locked");
      assert.strictEqual(body.data.component.bundle, undefined, "Bundle must be stripped for non-premium user");
      assert.ok(
        body.data.component.lockReason?.includes("Premium subscription required"),
        "Lock reason must state premium required"
      );
    });

    it("denies source endpoint request for premium component with 403", async () => {
      const { status, body } = await testSource(premiumSlug, customerToken);
      assert.strictEqual(status, 403, "Source access must be rejected with 403");
      assert.ok(
        body.message.includes("Active premium subscription required"),
        `Expected descriptive 403 message, got: ${body.message}`
      );
    });

    it("denies CLI install command for premium component with access error", async () => {
      const { success, error } = await testInstall(premiumSlug, customerToken, "stage1-premium");
      assert.strictEqual(success, false, "CLI install must fail for non-premium user");
      assert.ok(
        error?.includes("Access denied") || error?.includes("Premium"),
        `Expected access denial error from CLI, got: ${error}`
      );
    });

    it("denies agent-prompt endpoint request for premium component with 403", async () => {
      const { status, body } = await testAgentPrompt(premiumSlug, customerToken);
      assert.strictEqual(status, 403, "Agent prompt access must be rejected with 403");
      assert.ok(
        body.message.includes("Active premium subscription required"),
        `Expected descriptive 403 message, got: ${body.message}`
      );
    });

    it("confirms all 4 requests for the free component succeed simultaneously", async () => {
      // 1. Preview
      const preview = await testPreview(freeSlug, customerToken);
      assert.strictEqual(preview.status, 200);
      assert.strictEqual(preview.body.data.component.isLocked, false);
      assert.ok(preview.body.data.component.bundle);

      // 2. Source
      const source = await testSource(freeSlug, customerToken);
      assert.strictEqual(source.status, 200);
      assert.strictEqual(source.body.data.files[0].content, freeContent);

      // 3. Install
      const install = await testInstall(freeSlug, customerToken, "stage1-free");
      assert.strictEqual(install.success, true);
      const freeFilePath = path.join(tempInstallDir, "stage1-free", "FreeBadge.tsx");
      const diskContent = await fs.readFile(freeFilePath, "utf8");
      assert.strictEqual(diskContent, freeContent);

      // 4. Agent-prompt
      const prompt = await testAgentPrompt(freeSlug, customerToken);
      assert.strictEqual(prompt.status, 200);
      assert.ok(prompt.body.data.prompt.includes("Free Badge Widget"));
    });
  });

  // =========================================================================
  // STAGE 2: Admin Grants Premium
  // All 4 requests to premium component MUST now succeed!
  // All 4 requests to free component remain accessible.
  // =========================================================================
  describe("Stage 2: Admin Grants Premium Status to Customer", () => {
    it("executes admin grant-premium endpoint successfully", async () => {
      const grantRes = await fetch(`${baseUrl}/admin/customers/${customerId}/grant-premium`, {
        method: "POST",
        headers: { Cookie: `tech_inject_admin_token=${adminToken}` },
      });

      assert.strictEqual(grantRes.status, 200);
      const grantBody = await grantRes.json();
      assert.strictEqual(grantBody.data.customer.isPremium, true);

      // Verify in DB directly
      const userInDb = await UserModel.findById(customerId);
      assert.strictEqual(userInDb?.isPremium, true);
    });

    it("now unlocks preview for premium component (isLocked: false with bundle details)", async () => {
      const { status, body } = await testPreview(premiumSlug, customerToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.component.isLocked, false, "Component must be unlocked for premium user");
      assert.ok(body.data.component.bundle, "Bundle details must be included");
    });

    it("now allows source endpoint request for premium component (200 with code)", async () => {
      const { status, body } = await testSource(premiumSlug, customerToken);
      assert.strictEqual(status, 200, "Source access must succeed with 200");
      assert.strictEqual(body.data.slug, premiumSlug);
      const primaryFile = body.data.files.find((f: any) => f.path === "PremiumAnalyticsGrid.tsx");
      assert.ok(primaryFile, "Primary file must be returned");
      assert.strictEqual(primaryFile.content, premiumContent);
    });

    it("now allows CLI install for premium component and extracts files to disk", async () => {
      const { success, result } = await testInstall(premiumSlug, customerToken, "stage2-premium");
      assert.strictEqual(success, true, "CLI install must succeed for premium user");
      assert.strictEqual(result?.slug, premiumSlug);

      const installedFilePath = path.join(tempInstallDir, "stage2-premium", "PremiumAnalyticsGrid.tsx");
      const diskContent = await fs.readFile(installedFilePath, "utf8");
      assert.strictEqual(diskContent, premiumContent);
    });

    it("now allows agent-prompt request for premium component (200 with prompt)", async () => {
      const { status, body } = await testAgentPrompt(premiumSlug, customerToken);
      assert.strictEqual(status, 200, "Agent prompt access must succeed with 200");
      assert.ok(body.data.prompt.includes("Premium Analytics Grid"));
      assert.ok(body.data.prompt.includes("Enterprise grade analytics"));
    });

    it("confirms free component remains fully accessible in premium stage", async () => {
      const preview = await testPreview(freeSlug, customerToken);
      assert.strictEqual(preview.status, 200);
      assert.strictEqual(preview.body.data.component.isLocked, false);

      const source = await testSource(freeSlug, customerToken);
      assert.strictEqual(source.status, 200);

      const install = await testInstall(freeSlug, customerToken, "stage2-free");
      assert.strictEqual(install.success, true);

      const prompt = await testAgentPrompt(freeSlug, customerToken);
      assert.strictEqual(prompt.status, 200);
    });
  });

  // =========================================================================
  // STAGE 3: Admin Revokes Premium
  // All 4 requests to premium component MUST be denied again.
  // Free component remains accessible throughout.
  // =========================================================================
  describe("Stage 3: Admin Revokes Premium Status from Customer", () => {
    it("executes admin revoke-premium endpoint successfully", async () => {
      const revokeRes = await fetch(`${baseUrl}/admin/customers/${customerId}/revoke-premium`, {
        method: "POST",
        headers: { Cookie: `tech_inject_admin_token=${adminToken}` },
      });

      assert.strictEqual(revokeRes.status, 200);
      const revokeBody = await revokeRes.json();
      assert.strictEqual(revokeBody.data.customer.isPremium, false);

      // Verify in DB directly
      const userInDb = await UserModel.findById(customerId);
      assert.strictEqual(userInDb?.isPremium, false);
    });

    it("immediately locks preview again (isLocked: true, bundle stripped)", async () => {
      const { status, body } = await testPreview(premiumSlug, customerToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.component.isLocked, true, "Must revert to locked state");
      assert.strictEqual(body.data.component.bundle, undefined, "Bundle must be stripped again");
    });

    it("immediately denies source request with 403 again", async () => {
      const { status, body } = await testSource(premiumSlug, customerToken);
      assert.strictEqual(status, 403, "Source must be denied with 403 after revocation");
      assert.ok(body.message.includes("Active premium subscription required"));
    });

    it("immediately rejects CLI install attempt with access denial error again", async () => {
      const { success, error } = await testInstall(premiumSlug, customerToken, "stage3-premium");
      assert.strictEqual(success, false, "CLI install must be rejected after revocation");
      assert.ok(error?.includes("Access denied") || error?.includes("Premium"));
    });

    it("immediately denies agent-prompt request with 403 again", async () => {
      const { status, body } = await testAgentPrompt(premiumSlug, customerToken);
      assert.strictEqual(status, 403, "Agent prompt must be denied with 403 after revocation");
      assert.ok(body.message.includes("Active premium subscription required"));
    });

    it("confirms free component remains 100% accessible after premium revocation", async () => {
      // 1. Preview
      const preview = await testPreview(freeSlug, customerToken);
      assert.strictEqual(preview.status, 200);
      assert.strictEqual(preview.body.data.component.isLocked, false);
      assert.ok(preview.body.data.component.bundle);

      // 2. Source
      const source = await testSource(freeSlug, customerToken);
      assert.strictEqual(source.status, 200);
      assert.strictEqual(source.body.data.files[0].content, freeContent);

      // 3. Install
      const install = await testInstall(freeSlug, customerToken, "stage3-free");
      assert.strictEqual(install.success, true);
      const freeFilePath = path.join(tempInstallDir, "stage3-free", "FreeBadge.tsx");
      const diskContent = await fs.readFile(freeFilePath, "utf8");
      assert.strictEqual(diskContent, freeContent);

      // 4. Agent-prompt
      const prompt = await testAgentPrompt(freeSlug, customerToken);
      assert.strictEqual(prompt.status, 200);
      assert.ok(prompt.body.data.prompt.includes("Free Badge Widget"));
    });
  });
});
