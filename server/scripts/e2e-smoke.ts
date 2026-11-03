import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const API_BASE = (process.env.E2E_API_BASE_URL ?? "http://localhost:5000/api").replace(/\/$/, "");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL ?? "demo.user19@demo.studentmarket.local";
const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL ?? "demo.user01@demo.studentmarket.local";
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD ?? "DemoPass!2026";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.");
}

const authClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const results: CheckResult[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name} — ${detail}`);
}

async function signIn(email: string, password: string) {
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Login failed for ${email}: ${error?.message ?? "No session returned"}`);
  }
  return data.session.access_token;
}

async function request(
  path: string,
  token?: string,
  expected = 200,
  options?: { method?: string; body?: unknown }
) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options?.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
    method: options?.method ?? "GET",
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  let body: any = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = await response.json().catch(() => null);
  } else {
    body = await response.text().catch(() => "");
  }

  return { response, body, expected };
}

async function checkStatus(
  name: string,
  path: string,
  expected: number,
  token?: string,
  options?: { method?: string; body?: unknown }
) {
  try {
    const { response, body } = await request(path, token, expected, options);
    const ok = response.status === expected;
    record(
      name,
      ok,
      `HTTP ${response.status}${ok ? "" : ` (expected ${expected})`}${body?.requestId ? ` · request ${body.requestId}` : ""}`
    );
    return { ok, body, status: response.status };
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error));
    return { ok: false, body: null, status: 0 };
  }
}

function countData(body: any) {
  if (Array.isArray(body?.data)) return body.data.length;
  if (Array.isArray(body)) return body.length;
  return null;
}

async function main() {
  console.log("\nPhase 22 — Student Marketplace E2E API Smoke Test");
  console.log(`API: ${API_BASE}\n`);

  const health = await checkStatus("Public health endpoint", "/health", 200);
  if (!health.ok) {
    console.error("\nBackend is not reachable. Start it with: npm run dev");
    process.exitCode = 1;
    return;
  }

  const home = await checkStatus("Marketplace home loads", "/marketplace/home", 200);
  if (home.ok) {
    const data = home.body?.data;
    const populated =
      !!data &&
      (
        (Array.isArray(data.featuredProducts) && data.featuredProducts.length > 0) ||
        (Array.isArray(data.newProducts) && data.newProducts.length > 0) ||
        (Array.isArray(data.featuredBusinesses) && data.featuredBusinesses.length > 0) ||
        (Array.isArray(data.newBusinesses) && data.newBusinesses.length > 0)
      );
    record("Marketplace home is populated", populated, populated ? "Demo listings are present" : "No populated home collections detected");
  }

  const products = await checkStatus("Public product catalogue", "/products", 200);
  if (products.ok) {
    const count = countData(products.body);
    record("Product catalogue has data", count !== null && count > 0, count === null ? "Could not detect result array" : `${count} products returned`);
  }

  const businesses = await checkStatus("Public business directory", "/businesses", 200);
  if (businesses.ok) {
    const count = countData(businesses.body);
    record("Business directory has data", count !== null && count > 0, count === null ? "Could not detect result array" : `${count} businesses returned`);
  }

  console.log("\nCustomer flow");
  let customerToken = "";
  try {
    customerToken = await signIn(CUSTOMER_EMAIL, DEMO_PASSWORD);
    record("Customer login", true, CUSTOMER_EMAIL);
  } catch (error) {
    record("Customer login", false, error instanceof Error ? error.message : String(error));
  }

  if (customerToken) {
    await checkStatus("Customer profile", "/me", 200, customerToken);
    await checkStatus("Customer wishlist", "/wishlist", 200, customerToken);
    await checkStatus("Customer cart", "/cart", 200, customerToken);

    const publicRows = Array.isArray(products.body?.data) ? products.body.data : [];
    const checkoutProduct = publicRows.find((product: any) =>
      product?.status === "ACTIVE" &&
      Number(product?.stock_quantity) > 0 &&
      product?.business?.availability_status === "OPEN" &&
      (product?.business?.pickup_enabled || product?.business?.seller_delivery_enabled)
    );

    if (checkoutProduct?.id) {
      await checkStatus("Reset demo customer cart", "/cart", 200, customerToken, { method: "DELETE" });
      await checkStatus(
        "Add valid checkout product",
        "/cart/items",
        201,
        customerToken,
        { method: "POST", body: { productId: checkoutProduct.id, quantity: 1 } }
      );
      await checkStatus("Checkout preview", "/checkout/preview", 200, customerToken);
    } else {
      record("Checkout preview", false, "No public in-stock product from an OPEN business was available for the smoke test");
    }
    await checkStatus("Customer order history", "/orders", 200, customerToken);
    await checkStatus("Customer notifications", "/notifications", 200, customerToken);
    await checkStatus("Unread notification count", "/notifications/unread-count", 200, customerToken);
    await checkStatus("Customer reports", "/reports/mine", 200, customerToken);
    await checkStatus("Customer blocked from seller API", "/seller/orders", 403, customerToken);
    await checkStatus("Customer blocked from admin API", "/admin/dashboard", 403, customerToken);
  }

  console.log("\nSeller flow");
  let sellerToken = "";
  try {
    sellerToken = await signIn(SELLER_EMAIL, DEMO_PASSWORD);
    record("Seller login", true, SELLER_EMAIL);
  } catch (error) {
    record("Seller login", false, error instanceof Error ? error.message : String(error));
  }

  if (sellerToken) {
    await checkStatus("Seller profile", "/me", 200, sellerToken);
    const sellerBusinesses = await checkStatus("Seller businesses", "/seller/businesses", 200, sellerToken);
    await checkStatus("Seller orders", "/seller/orders", 200, sellerToken);
    await checkStatus("Seller notifications", "/notifications", 200, sellerToken);
    await checkStatus("Seller blocked from admin API", "/admin/dashboard", 403, sellerToken);

    const rows = sellerBusinesses.body?.data;
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
      await checkStatus("Seller business detail", `/seller/businesses/${rows[0].id}`, 200, sellerToken);
      await checkStatus("Seller product list", `/seller/businesses/${rows[0].id}/products`, 200, sellerToken);
    } else if (sellerBusinesses.ok) {
      record("Seller has an owned business", false, "No business returned for seeded seller");
    }
  }

  console.log("\nAdmin flow");
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    let adminToken = "";
    try {
      adminToken = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
      record("Admin login", true, ADMIN_EMAIL);
    } catch (error) {
      record("Admin login", false, error instanceof Error ? error.message : String(error));
    }

    if (adminToken) {
      await checkStatus("Admin dashboard", "/admin/dashboard", 200, adminToken);
      await checkStatus("Admin users", "/admin/users", 200, adminToken);
      await checkStatus("Admin seller applications", "/admin/seller-applications", 200, adminToken);
      await checkStatus("Admin businesses", "/admin/businesses", 200, adminToken);
      await checkStatus("Admin products", "/admin/products", 200, adminToken);
      await checkStatus("Admin orders", "/admin/orders", 200, adminToken);
      await checkStatus("Admin reports", "/admin/reports", 200, adminToken);
      await checkStatus("Admin marketplace management", "/admin/marketplace", 200, adminToken);
    }
  } else {
    record("Admin API smoke checks", true, "Skipped — set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to include them");
  }

  const passed = results.filter((result) => result.ok).length;
  const failed = results.length - passed;

  console.log("\nSummary");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
