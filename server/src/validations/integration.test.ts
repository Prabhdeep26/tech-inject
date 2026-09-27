import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { app } from "../app.js";
import { connectDB, disconnectDB } from "../db/mongoose.js";
import { ComponentModel, ComponentBundleModel, UserModel } from "../models/index.js";
import { deleteBundleFiles } from "../storage/gridfs.js";

describe("Server Integration Tests: Security, Drafts & Dynamic Access Control", () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;

  const timestamp = Date.now();
  const testCustomerEmail = `customer_integ_${timestamp}@example.com`;
  const draftSlug = `draft-comp-${timestamp}`;
  const premiumSlug = `premium-comp-${timestamp}`;

  before(async () => {
    await connectDB();
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = (server.address() as any).port;
    baseUrl = `http://localhost:${port}`;

    // Clean up test data if pre-existing
    await UserModel.deleteMany({ email: testCustomerEmail });
    await ComponentModel.deleteMany({ slug: { $in: [draftSlug, premiumSlug] } });
    await ComponentBundleModel.deleteMany({ slug: { $in: [draftSlug, premiumSlug] } });

    // 1. Admin login to obtain admin session cookie
    const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@tech-inject.dev", password: "admin123" }),
    });
    assert.strictEqual(adminLoginRes.status, 200, "Admin login must succeed");
    const adminSetCookie = adminLoginRes.headers.get("set-cookie");
    adminToken = adminSetCookie?.match(/tech_inject_admin_token=([^;]+)/)?.[1] || "";
    assert.ok(adminToken, "Admin cookie must be established");

    // 2. Register regular customer (starts as free, non-premium)
    const custRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testCustomerEmail, password: "password123" }),
    });
    assert.strictEqual(custRegRes.status, 201, "Customer register must succeed");
    const custData = await custRegRes.json();
    customerId = custData.data.user.id;
    const custSetCookie = custRegRes.headers.get("set-cookie");
    customerToken = custSetCookie?.match(/tech_inject_auth_token=([^;]+)/)?.[1] || "";
    assert.ok(customerToken, "Customer cookie must be established");

    // 3. Admin creates an unpublished/draft component
    const draftCreateRes = await fetch(`${baseUrl}/admin/components`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `tech_inject_admin_token=${adminToken}`,
      },
      body: JSON.stringify({
        slug: draftSlug,
        name: "Confidential Draft Component",
        description: "An unreleased component that should never be visible to public users",
        category: "internal",
        version: "0.1.0",
        accessLevel: "free",
        status: "draft",
      }),
    });
    assert.strictEqual(draftCreateRes.status, 201, "Draft component creation must succeed");

    // 4. Admin uploads a published premium component with files
    const premiumBundlePayload = {
      files: [
        {
          path: "PremiumAnalytics.tsx",
          content: "export const PremiumAnalytics = () => <div>Interactive Analytics Chart</div>;",
        },
        {
          path: "analytics.css",
          content: ".analytics-chart { background: linear-gradient(to right, #6366f1, #a855f7); }",
        },
      ],
      meta: {
        slug: premiumSlug,
        name: "Premium Analytics Component",
        description: "Advanced analytics visualizer available strictly to premium subscribers.",
        category: "analytics",
        version: "1.0.0",
        accessLevel: "premium",
        status: "published",
        entryPoint: "PremiumAnalytics.tsx",
      },
    };

    const bundleRes = await fetch(`${baseUrl}/admin/bundles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `tech_inject_admin_token=${adminToken}`,
      },
      body: JSON.stringify(premiumBundlePayload),
    });
    assert.strictEqual(bundleRes.status, 201, "Premium bundle upload must succeed");
  });

  after(async () => {
    await UserModel.deleteMany({ email: testCustomerEmail });
    await ComponentModel.deleteMany({ slug: { $in: [draftSlug, premiumSlug] } });
    await ComponentBundleModel.deleteMany({ slug: { $in: [draftSlug, premiumSlug] } });
    await deleteBundleFiles(premiumSlug);
    server.close();
    await disconnectDB();
  });

  // =========================================================================
  // 1. UNAUTHORIZED ADMIN WRITE ATTEMPTS (403)
  // =========================================================================
  describe("1. Unauthorized Admin Write Attempts (403)", () => {
    it("rejects non-admin attempt to create component (POST /admin/components) with 403", async () => {
      const res = await fetch(`${baseUrl}/admin/components`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          slug: "hacker-comp",
          name: "Hacker Component",
          description: "Unauthorized",
          category: "exploit",
          version: "1.0.0",
        }),
      });

      assert.strictEqual(res.status, 403, "Must return 403 Forbidden for customer write attempt");
      const body = await res.json();
      assert.ok(
        body.message.includes("Administrative privileges required") ||
          body.message.includes("Access denied"),
        `Expected descriptive message, got: ${body.message}`
      );
    });

    it("rejects non-admin attempt to modify component (PATCH /admin/components/:id) with 403", async () => {
      const res = await fetch(`${baseUrl}/admin/components/${draftSlug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: "Tampered Name" }),
      });

      assert.strictEqual(res.status, 403);
    });

    it("rejects non-admin attempt to publish component (POST /admin/components/:id/publish) with 403", async () => {
      const res = await fetch(`${baseUrl}/admin/components/${draftSlug}/publish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
    });

    it("rejects non-admin attempt to unpublish component (POST /admin/components/:id/unpublish) with 403", async () => {
      const res = await fetch(`${baseUrl}/admin/components/${premiumSlug}/unpublish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
    });

    it("rejects non-admin attempt to upload bundle (POST /admin/bundles) with 403", async () => {
      const res = await fetch(`${baseUrl}/admin/bundles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ files: [], meta: {} }),
      });

      assert.strictEqual(res.status, 403);
    });

    it("rejects non-admin attempt to grant premium (POST /admin/customers/:id/grant-premium) with 403", async () => {
      const res = await fetch(`${baseUrl}/admin/customers/${customerId}/grant-premium`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
    });

    it("rejects non-admin attempt to revoke premium (POST /admin/customers/:id/revoke-premium) with 403", async () => {
      const res = await fetch(`${baseUrl}/admin/customers/${customerId}/revoke-premium`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
    });
  });

  // =========================================================================
  // 2. PUBLIC ACCESS TO UNPUBLISHED / DRAFT COMPONENTS (404)
  // =========================================================================
  describe("2. Public Access to Unpublished / Draft Components (404)", () => {
    it("returns 404 Not Found for unauthenticated request to GET /components/:slug on a draft", async () => {
      const res = await fetch(`${baseUrl}/components/${draftSlug}`);
      assert.strictEqual(res.status, 404, "Draft component must return 404 to unauthenticated public user");
      const body = await res.json();
      assert.ok(body.message.includes("not found"));
    });

    it("returns 404 Not Found for unauthenticated request to GET /components/:slug/source on a draft", async () => {
      const res = await fetch(`${baseUrl}/components/${draftSlug}/source`);
      assert.strictEqual(res.status, 404, "Draft source must return 404 to unauthenticated public user");
    });

    it("returns 404 Not Found for unauthenticated request to GET /components/:slug/download on a draft", async () => {
      const res = await fetch(`${baseUrl}/components/${draftSlug}/download`);
      assert.strictEqual(res.status, 404, "Draft download must return 404 to unauthenticated public user");
    });

    it("does NOT include draft components in public catalog listing (GET /components)", async () => {
      const res = await fetch(`${baseUrl}/components`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const isDraftPresent = body.data.components.some((c: any) => c.slug === draftSlug);
      assert.strictEqual(isDraftPresent, false, "Draft component must never appear in public GET /components");
    });

    it("returns 404 Not Found for customer requests to GET /components/:slug on a draft", async () => {
      const res = await fetch(`${baseUrl}/components/${draftSlug}`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(res.status, 404, "Draft component must return 404 to customers");
    });

    it("allows authenticated admin to inspect draft component on GET /components/:slug", async () => {
      const res = await fetch(`${baseUrl}/components/${draftSlug}`, {
        headers: { Cookie: `tech_inject_admin_token=${adminToken}` },
      });
      assert.strictEqual(res.status, 200, "Admin can view draft component");
      const body = await res.json();
      assert.strictEqual(body.data.component.slug, draftSlug);
      assert.strictEqual(body.data.component.status, "draft");
    });
  });

  // =========================================================================
  // 3. PREMIUM COMPONENT ACCESS DENIED WHEN SIGNED OUT OR NON-PREMIUM (403)
  // =========================================================================
  describe("3. Premium Component Access Denied When Signed Out or Non-Premium (403 with clear message)", () => {
    it("returns locked metadata with isLocked: true for signed-out user on GET /components/:slug", async () => {
      const res = await fetch(`${baseUrl}/components/${premiumSlug}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data.component.isLocked, true);
      assert.strictEqual(body.data.component.bundle, undefined, "Bundle files must be stripped when locked");
      assert.ok(
        body.data.component.lockReason && body.data.component.lockReason.includes("Premium subscription required"),
        "Must provide clear lockReason message"
      );
    });

    it("returns 403 with clear message when signed-out user requests GET /components/:slug/source", async () => {
      const res = await fetch(`${baseUrl}/components/${premiumSlug}/source`);
      assert.strictEqual(res.status, 403, "Signed-out request to premium source must be 403");
      const body = await res.json();
      assert.ok(
        body.message.includes("Active premium subscription required"),
        `Expected clear denial message, got: ${body.message}`
      );
    });

    it("returns 403 with clear message when signed-out user requests GET /components/:slug/download", async () => {
      const res = await fetch(`${baseUrl}/components/${premiumSlug}/download`);
      assert.strictEqual(res.status, 403, "Signed-out request to premium download must be 403");
      const body = await res.json();
      assert.ok(
        body.message.includes("Active premium subscription required"),
        `Expected clear denial message, got: ${body.message}`
      );
    });

    it("returns locked metadata with isLocked: true for non-premium customer on GET /components/:slug", async () => {
      const res = await fetch(`${baseUrl}/components/${premiumSlug}`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data.component.isLocked, true);
      assert.strictEqual(body.data.component.bundle, undefined);
    });

    it("returns 403 with clear message when non-premium customer requests GET /components/:slug/source", async () => {
      const res = await fetch(`${baseUrl}/components/${premiumSlug}/source`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(res.status, 403, "Non-premium customer request to premium source must be 403");
      const body = await res.json();
      assert.ok(
        body.message.includes("Active premium subscription required"),
        `Expected clear denial message, got: ${body.message}`
      );
    });

    it("returns 403 with clear message when non-premium customer requests GET /components/:slug/download", async () => {
      const res = await fetch(`${baseUrl}/components/${premiumSlug}/download`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(res.status, 403, "Non-premium customer request to premium download must be 403");
      const body = await res.json();
      assert.ok(
        body.message.includes("Active premium subscription required"),
        `Expected clear denial message, got: ${body.message}`
      );
    });
  });

  // =========================================================================
  // 4. FULL GRANT → ACCESS → REVOKE → DENIED SEQUENCE
  // =========================================================================
  describe("4. Full grant → access → revoke → denied sequence", () => {
    it("verifies live state transitions: initial denial -> admin grant -> access granted -> admin revoke -> access denied", async () => {
      // ---------------------------------------------------------
      // Step A: Initial state: customer is non-premium
      // ---------------------------------------------------------
      const initialUser = await UserModel.findById(customerId);
      assert.strictEqual(initialUser?.isPremium, false, "Customer must start as non-premium");

      // Verify access denied initially
      const initialSourceRes = await fetch(`${baseUrl}/components/${premiumSlug}/source`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(initialSourceRes.status, 403, "Step A: Access must be denied before grant");

      const initialMetaRes = await fetch(`${baseUrl}/components/${premiumSlug}`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      const initialMetaBody = await initialMetaRes.json();
      assert.strictEqual(initialMetaBody.data.component.isLocked, true, "Step A: Component must be locked");

      // ---------------------------------------------------------
      // Step B: Admin grants premium status
      // ---------------------------------------------------------
      const grantRes = await fetch(`${baseUrl}/admin/customers/${customerId}/grant-premium`, {
        method: "POST",
        headers: { Cookie: `tech_inject_admin_token=${adminToken}` },
      });
      assert.strictEqual(grantRes.status, 200, "Step B: Admin grant-premium must return 200");
      const grantBody = await grantRes.json();
      assert.strictEqual(grantBody.data.customer.isPremium, true);

      // Verify directly in MongoDB
      const grantedUserInDb = await UserModel.findById(customerId);
      assert.strictEqual(grantedUserInDb?.isPremium, true, "Step B: Database must reflect isPremium === true");

      // ---------------------------------------------------------
      // Step C: Customer immediately gains access (LIVE check on same token)
      // ---------------------------------------------------------
      const grantedSourceRes = await fetch(`${baseUrl}/components/${premiumSlug}/source`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(grantedSourceRes.status, 200, "Step C: Premium source access must be granted");
      const grantedSourceBody = await grantedSourceRes.json();
      assert.strictEqual(grantedSourceBody.data.slug, premiumSlug);
      assert.strictEqual(grantedSourceBody.data.files.length, 2);
      assert.ok(
        grantedSourceBody.data.files[0].content.includes("Interactive Analytics Chart"),
        "Source content must be retrieved"
      );

      const grantedMetaRes = await fetch(`${baseUrl}/components/${premiumSlug}`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(grantedMetaRes.status, 200);
      const grantedMetaBody = await grantedMetaRes.json();
      assert.strictEqual(grantedMetaBody.data.component.isLocked, false, "Step C: Component must now be unlocked");
      assert.ok(grantedMetaBody.data.component.bundle, "Bundle files must be present");

      const fileId = grantedMetaBody.data.component.bundle.files[0].fileId;
      const downloadRes = await fetch(`${baseUrl}/components/${premiumSlug}/download/${fileId}`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(downloadRes.status, 200, "Step C: File stream download must succeed");
      const fileContent = await downloadRes.text();
      assert.ok(fileContent.includes("Interactive Analytics Chart"));

      // ---------------------------------------------------------
      // Step D: Admin revokes premium status
      // ---------------------------------------------------------
      const revokeRes = await fetch(`${baseUrl}/admin/customers/${customerId}/revoke-premium`, {
        method: "POST",
        headers: { Cookie: `tech_inject_admin_token=${adminToken}` },
      });
      assert.strictEqual(revokeRes.status, 200, "Step D: Admin revoke-premium must return 200");
      const revokeBody = await revokeRes.json();
      assert.strictEqual(revokeBody.data.customer.isPremium, false);

      // Verify directly in MongoDB
      const revokedUserInDb = await UserModel.findById(customerId);
      assert.strictEqual(revokedUserInDb?.isPremium, false, "Step D: Database must reflect isPremium === false");

      // ---------------------------------------------------------
      // Step E: Customer access is immediately denied again (LIVE check)
      // ---------------------------------------------------------
      const revokedSourceRes = await fetch(`${baseUrl}/components/${premiumSlug}/source`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(revokedSourceRes.status, 403, "Step E: Source access must be immediately denied after revoke");
      const revokedSourceBody = await revokedSourceRes.json();
      assert.ok(
        revokedSourceBody.message.includes("Active premium subscription required"),
        `Expected clear denial message, got: ${revokedSourceBody.message}`
      );

      const revokedDownloadRes = await fetch(`${baseUrl}/components/${premiumSlug}/download/${fileId}`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(revokedDownloadRes.status, 403, "Step E: File download must be immediately denied after revoke");

      const revokedMetaRes = await fetch(`${baseUrl}/components/${premiumSlug}`, {
        headers: { Cookie: `tech_inject_auth_token=${customerToken}` },
      });
      assert.strictEqual(revokedMetaRes.status, 200);
      const revokedMetaBody = await revokedMetaRes.json();
      assert.strictEqual(revokedMetaBody.data.component.isLocked, true, "Step E: Component metadata must revert to locked");
      assert.strictEqual(revokedMetaBody.data.component.bundle, undefined, "Bundle details must be stripped again");
    });
  });
});
