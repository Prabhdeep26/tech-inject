import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { app } from "../app.js";
import { connectDB, disconnectDB } from "../db/mongoose.js";
import { UserModel } from "../models/User.js";

describe("Customer Management & Privilege Escalation Protection", () => {
  let server: Server;
  let baseUrl: string;
  let adminCookie: string;
  let customerCookie: string;
  let customerId: string;
  const testCustomerEmail = `test_customer_${Date.now()}@example.com`;

  before(async () => {
    await connectDB();
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = (server.address() as any).port;
    baseUrl = `http://localhost:${port}`;

    // Clean up if existing
    await UserModel.deleteMany({ email: testCustomerEmail });

    // 1. Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@tech-inject.dev", password: "admin123" }),
    });
    const setCookie = adminLoginRes.headers.get("set-cookie");
    adminCookie = setCookie?.match(/tech_inject_admin_token=([^;]+)/)?.[1] || "";
    assert.ok(adminCookie, "Admin authentication cookie must be established");

    // 2. Register regular customer
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: "initialPassword123",
      }),
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    customerId = regData.data.user.id;
    const custSetCookie = regRes.headers.get("set-cookie");
    customerCookie = custSetCookie?.match(/tech_inject_auth_token=([^;]+)/)?.[1] || "";
    assert.ok(customerCookie, "Customer authentication cookie must be established");
  });

  after(async () => {
    await UserModel.deleteMany({ email: testCustomerEmail });
    server.close();
    await disconnectDB();
  });

  it("CRITICAL: customer PATCH request to their own user record cannot change isPremium", async () => {
    // Verify customer starts as free (isPremium === false)
    const initialUserInDb = await UserModel.findById(customerId);
    assert.strictEqual(initialUserInDb?.isPremium, false);

    // Customer attempts privilege escalation via PATCH /auth/me
    const patchRes = await fetch(`${baseUrl}/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `tech_inject_auth_token=${customerCookie}`,
      },
      body: JSON.stringify({
        isPremium: true,
      }),
    });

    // Endpoint must reject privilege escalation attempt with 403 Forbidden
    assert.strictEqual(
      patchRes.status,
      403,
      "Expected 403 Forbidden when a customer attempts to modify isPremium"
    );

    // Verify in database that isPremium remains strictly false
    const afterUserInDb = await UserModel.findById(customerId);
    assert.strictEqual(
      afterUserInDb?.isPremium,
      false,
      "Database isPremium must remain false after customer PATCH attempt"
    );
  });

  it("CRITICAL: customer PATCH request cannot change isAdmin", async () => {
    const patchRes = await fetch(`${baseUrl}/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `tech_inject_auth_token=${customerCookie}`,
      },
      body: JSON.stringify({
        isAdmin: true,
      }),
    });

    assert.strictEqual(patchRes.status, 403, "Expected 403 Forbidden when attempting to modify isAdmin");

    const userInDb = await UserModel.findById(customerId);
    assert.strictEqual(userInDb?.isAdmin, false, "Database isAdmin must remain false");
  });

  it("Customer can update legitimate profile fields without escalating privileges", async () => {
    const patchRes = await fetch(`${baseUrl}/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `tech_inject_auth_token=${customerCookie}`,
      },
      body: JSON.stringify({
        password: "newUpdatedPassword123",
      }),
    });

    assert.strictEqual(patchRes.status, 200, "Legitimate profile update should succeed");

    const userInDb = await UserModel.findById(customerId);
    assert.strictEqual(userInDb?.isPremium, false, "isPremium must still be false");
    assert.strictEqual(userInDb?.isAdmin, false, "isAdmin must still be false");
  });

  it("Customer cannot call admin grant-premium endpoint", async () => {
    // 1. Customer calling with customer cookie -> 401 (Admin token required)
    const unauthorizedGrantRes = await fetch(`${baseUrl}/admin/customers/${customerId}/grant-premium`, {
      method: "POST",
      headers: {
        Cookie: `tech_inject_auth_token=${customerCookie}`,
      },
    });

    assert.ok(
      unauthorizedGrantRes.status === 401 || unauthorizedGrantRes.status === 403,
      "Customer must be rejected from calling admin grant-premium"
    );

    // 2. Customer attempting to spoof admin cookie with customer token -> 403 Forbidden
    const spoofedGrantRes = await fetch(`${baseUrl}/admin/customers/${customerId}/grant-premium`, {
      method: "POST",
      headers: {
        Cookie: `tech_inject_admin_token=${customerCookie}`,
      },
    });

    assert.strictEqual(
      spoofedGrantRes.status,
      403,
      "Customer spoofing admin cookie must be rejected with 403 Forbidden"
    );

    const userInDb = await UserModel.findById(customerId);
    assert.strictEqual(userInDb?.isPremium, false, "isPremium must still be false");
  });

  it("Admin GET /admin/customers lists customer accounts", async () => {
    const listRes = await fetch(`${baseUrl}/admin/customers`, {
      headers: {
        Cookie: `tech_inject_admin_token=${adminCookie}`,
      },
    });

    assert.strictEqual(listRes.status, 200);
    const body = await listRes.json();
    assert.ok(Array.isArray(body.data.customers));
    const found = body.data.customers.some((c: any) => c.email === testCustomerEmail);
    assert.strictEqual(found, true, "Customer must be present in admin customer listing");
  });

  it("Admin POST /admin/customers/:id/grant-premium grants premium status", async () => {
    const grantRes = await fetch(`${baseUrl}/admin/customers/${customerId}/grant-premium`, {
      method: "POST",
      headers: {
        Cookie: `tech_inject_admin_token=${adminCookie}`,
      },
    });

    assert.strictEqual(grantRes.status, 200);
    const grantBody = await grantRes.json();
    assert.strictEqual(grantBody.data.customer.isPremium, true);

    // Verify directly in MongoDB
    const userInDb = await UserModel.findById(customerId);
    assert.strictEqual(userInDb?.isPremium, true, "MongoDB user.isPremium must now be true");
  });

  it("Admin POST /admin/customers/:id/revoke-premium revokes premium status", async () => {
    const revokeRes = await fetch(`${baseUrl}/admin/customers/${customerId}/revoke-premium`, {
      method: "POST",
      headers: {
        Cookie: `tech_inject_admin_token=${adminCookie}`,
      },
    });

    assert.strictEqual(revokeRes.status, 200);
    const revokeBody = await revokeRes.json();
    assert.strictEqual(revokeBody.data.customer.isPremium, false);

    // Verify directly in MongoDB
    const userInDb = await UserModel.findById(customerId);
    assert.strictEqual(userInDb?.isPremium, false, "MongoDB user.isPremium must now be false");
  });
});
