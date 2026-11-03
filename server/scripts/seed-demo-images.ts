import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "dotenv/config";
import { DEMO_DOMAIN, businessTemplates } from "./demo-data.js";
import { businessImagePool, demoImagePools, type DemoImageCategory } from "./demo-images.js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
}

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "YES") {
  throw new Error(
    "Refusing to seed demo images in production. Set ALLOW_DEMO_SEED=YES only for an intentional disposable demo environment."
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const imageCache = new Map<string, Uint8Array>();

async function must<T>(
  promise: PromiseLike<{ data: T | null; error: any }>,
  label: string
) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data as T;
}

async function getDemoUserIds(client: SupabaseClient) {
  const ids: string[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    ids.push(
      ...data.users
        .filter((user) => user.email?.endsWith(`@${DEMO_DOMAIN}`))
        .map((user) => user.id)
    );

    if (data.users.length < 1000) break;
    page += 1;
  }

  return ids;
}

async function fetchImage(source: string) {
  const cached = imageCache.get(source);
  if (cached) return cached;

  const response = await fetch(source, {
    headers: {
      "User-Agent": "student-marketplace-demo-seeder/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}): ${source}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  imageCache.set(source, bytes);
  return bytes;
}

async function downloadFromPool(pool: string[], preferredIndex: number) {
  let lastError: unknown;

  for (let offset = 0; offset < pool.length; offset += 1) {
    const source = pool[(preferredIndex + offset) % pool.length];
    try {
      return { source, bytes: await fetchImage(source) };
    } catch (error) {
      lastError = error;
      console.warn(`Skipping unavailable image source: ${source}`);
    }
  }

  throw lastError ?? new Error("No usable image source in pool.");
}

async function removeExistingDemoImages(productIds: string[], businessIds: string[]) {
  if (productIds.length > 0) {
    const existing = await must<any[]>(
      supabase
        .from("product_images")
        .select("id,storage_path")
        .in("product_id", productIds),
      "load existing demo product image metadata"
    );

    if (existing.length > 0) {
      await must(
        supabase.from("product_images").delete().in("id", existing.map((row) => row.id)),
        "delete existing demo product image metadata"
      );

      const storagePaths = existing
        .map((row) => row.storage_path)
        .filter((path): path is string => typeof path === "string" && path.startsWith("demo/"));

      if (storagePaths.length > 0) {
        const { error } = await supabase.storage.from("product-images").remove(storagePaths);
        if (error) console.warn("Could not remove some previous demo product objects:", error.message);
      }
    }
  }

  if (businessIds.length > 0) {
    const demoBusinesses = await must<any[]>(
      supabase.from("businesses").select("id,logo_path").in("id", businessIds),
      "load existing demo business images"
    );

    const logoPaths = demoBusinesses
      .map((row) => row.logo_path)
      .filter((path): path is string => typeof path === "string" && path.startsWith("demo/"));

    if (logoPaths.length > 0) {
      const { error } = await supabase.storage.from("business-logos").remove(logoPaths);
      if (error) console.warn("Could not remove some previous demo business objects:", error.message);
    }
  }
}

async function main() {
  console.log("Phase 24B demo image seed starting...");

  const demoUserIds = await getDemoUserIds(supabase);
  if (demoUserIds.length === 0) {
    throw new Error("No Phase 24 demo users found. Run npm run seed:demo first.");
  }

  const businesses = await must<any[]>(
    supabase
      .from("businesses")
      .select("id,owner_id,name")
      .in("owner_id", demoUserIds)
      .order("created_at", { ascending: true }),
    "load demo businesses"
  );

  if (businesses.length === 0) {
    throw new Error("No demo businesses found. Run npm run seed:demo first.");
  }

  const businessIds = businesses.map((business) => business.id);

  const categories = await must<any[]>(
    supabase.from("categories").select("id,name"),
    "load categories"
  );
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const products = await must<any[]>(
    supabase
      .from("products")
      .select("id,business_id,category_id,name")
      .in("business_id", businessIds)
      .order("created_at", { ascending: true }),
    "load demo products"
  );

  console.log(`Found ${businesses.length} demo businesses and ${products.length} demo products.`);
  console.log("Cleaning previous demo image metadata and objects...");
  await removeExistingDemoImages(products.map((product) => product.id), businessIds);

  console.log("Uploading business images...");
  for (let i = 0; i < businesses.length; i += 1) {
    const business = businesses[i];
    const templateIndex = businessTemplates.findIndex((template) => template.name === business.name);
    const imageIndex = templateIndex >= 0 ? templateIndex : i;

    const { bytes } = await downloadFromPool(businessImagePool, imageIndex);
    const storagePath = `demo/businesses/${business.id}/logo.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("business-logos")
      .upload(storagePath, bytes, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
        upsert: true
      });

    if (uploadError) throw new Error(`Upload business image: ${uploadError.message}`);

    await must(
      supabase.from("businesses").update({ logo_path: storagePath }).eq("id", business.id),
      "link demo business image"
    );

    process.stdout.write(`\rBusiness images: ${i + 1}/${businesses.length}`);
  }
  process.stdout.write("\n");

  console.log("Uploading product images...");
  let attached = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i += 1) {
    const product = products[i];
    const category = categoryNameById.get(product.category_id) as DemoImageCategory | undefined;
    const pool = category && demoImagePools[category] ? demoImagePools[category] : demoImagePools.Other;

    try {
      const { bytes } = await downloadFromPool(pool, i);
      const storagePath = `demo/products/${product.id}/primary.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(storagePath, bytes, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: true
        });

      if (uploadError) throw new Error(uploadError.message);

      await must(
        supabase.from("product_images").insert({
          product_id: product.id,
          storage_path: storagePath,
          alt_text: `${product.name} demo product photo`,
          sort_order: 0,
          is_primary: true
        }),
        "insert demo product image metadata"
      );

      attached += 1;
    } catch (error) {
      failed += 1;
      console.warn(
        `\nCould not attach image to ${product.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    process.stdout.write(`\rProduct images: ${i + 1}/${products.length}`);
  }
  process.stdout.write("\n");

  console.log("\nDemo images seeded.");
  console.log(`Business images: ${businesses.length}`);
  console.log(`Product images attached: ${attached}`);
  console.log(`Product image failures: ${failed}`);

  if (failed > 0) {
    console.log("Failed products will continue using the app's normal image placeholder.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
