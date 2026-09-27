import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../app.js";
import { signToken } from "../utils/jwt.js";

test("Backend /admin/* Security Smoke Tests: Reject Unauthenticated & Non-Admin Requests", async (t) => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  const customerToken = signToken({
    id: "60d5ecb8b5c9c62b3c7c1111",
    email: "customer@company.com",
    role: "customer",
    isAdmin: false,
  });

  const protectedEndpoints = [
    { method: "GET", path: "/admin/me" },
    { method: "GET", path: "/admin/components" },
    { method: "POST", path: "/admin/components" },
    { method: "POST", path: "/admin/bundles" },
    { method: "GET", path: "/admin/customers" },
    { method: "POST", path: "/admin/customers/usr_test/grant-premium" },
    { method: "POST", path: "/admin/customers/usr_test/revoke-premium" },
  ];

  for (const { method, path } of protectedEndpoints) {
    await t.test(`Unauthenticated request to ${method} ${path} returns 401 Unauthorized`, async () => {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? JSON.stringify({ test: "data" }) : undefined,
      });

      assert.equal(res.status, 401, `Expected 401 for unauthenticated ${method} ${path}`);
      const body = (await res.json()) as any;
      assert.equal(body.status, "error");
    });

    await t.test(`Non-admin (customer) request to ${method} ${path} returns 403 Forbidden`, async () => {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: method === "POST" ? JSON.stringify({ test: "data" }) : undefined,
      });

      assert.equal(res.status, 403, `Expected 403 for non-admin customer ${method} ${path}`);
      const body = (await res.json()) as any;
      assert.equal(body.status, "error");
    });
  }
});
