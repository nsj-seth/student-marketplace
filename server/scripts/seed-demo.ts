import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "dotenv/config";
import {
  DEMO_DOMAIN,
  DEMO_PASSWORD,
  businessTemplates,
  firstNames,
  lastNames,
  productsByCategory,
  reportReasons,
  reviewComments
} from "./demo-data.js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type IdMap = Record<string, string>;

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const pick = <T>(items: T[], index: number) => items[index % items.length];
const daysAgo = (days: number, extraHours = 0) =>
  new Date(Date.now() - days * 86400000 - extraHours * 3600000).toISOString();

async function must<T>(promise: PromiseLike<{ data: T | null; error: any }>, label: string) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data as T;
}

async function cleanupDemoUsers(client: SupabaseClient) {
  console.log("Cleaning previous demo marketplace data...");
  const demoUsers: Array<{ id: string; email?: string }> = [];
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    demoUsers.push(...data.users.filter((user) => user.email?.endsWith(`@${DEMO_DOMAIN}`)));
    if (data.users.length < 1000) break;
    page += 1;
  }

  if (demoUsers.length === 0) return;
  const userIds = demoUsers.map((user) => user.id);

  const demoBusinesses = await must<any[]>(
    client.from("businesses").select("id").in("owner_id", userIds),
    "load prior demo businesses"
  );
  const businessIds = demoBusinesses.map((row) => row.id);

  const demoOrders = await must<any[]>(
    client.from("orders").select("id").in("customer_id", userIds),
    "load prior demo orders"
  );
  const orderIds = demoOrders.map((row) => row.id);

  let sellerOrderIds: string[] = [];
  if (orderIds.length > 0) {
    const sellerOrders = await must<any[]>(
      client.from("seller_orders").select("id").in("order_id", orderIds),
      "load prior demo seller orders"
    );
    sellerOrderIds = sellerOrders.map((row) => row.id);
  }

  if (businessIds.length > 0) {
    const extraSellerOrders = await must<any[]>(
      client.from("seller_orders").select("id,order_id").in("business_id", businessIds),
      "load seller orders attached to demo businesses"
    );
    sellerOrderIds = [...new Set([...sellerOrderIds, ...extraSellerOrders.map((row) => row.id)])];
    orderIds.push(...extraSellerOrders.map((row) => row.order_id));
  }

  const uniqueOrderIds = [...new Set(orderIds)];

  if (sellerOrderIds.length > 0) {
    await must(client.from("reviews").delete().in("seller_order_id", sellerOrderIds), "delete prior demo reviews");
    await must(client.from("order_status_history").delete().in("seller_order_id", sellerOrderIds), "delete prior demo history");
    await must(client.from("order_items").delete().in("seller_order_id", sellerOrderIds), "delete prior demo order items");
    await must(client.from("seller_orders").delete().in("id", sellerOrderIds), "delete prior demo seller orders");
  }

  if (uniqueOrderIds.length > 0) {
    await must(client.from("orders").delete().in("id", uniqueOrderIds), "delete prior demo orders");
  }

  await must(client.from("reports").delete().in("reporter_id", userIds), "delete prior demo reports");
  await must(client.from("notifications").delete().in("recipient_id", userIds), "delete prior demo notifications");
  await must(client.from("wishlist_items").delete().in("user_id", userIds), "delete prior demo wishlists");
  await must(client.from("carts").delete().in("user_id", userIds), "delete prior demo carts");

  if (businessIds.length > 0) {
    const demoProducts = await must<any[]>(
      client.from("products").select("id").in("business_id", businessIds),
      "load prior demo products"
    );
    const productIds = demoProducts.map((row) => row.id);
    if (productIds.length > 0) {
      await must(client.from("reports").delete().eq("target_type", "PRODUCT").in("target_id", productIds), "delete product reports");
      await must(client.from("wishlist_items").delete().in("product_id", productIds), "delete product wishlist references");
      await must(client.from("cart_items").delete().in("product_id", productIds), "delete product cart references");
      await must(client.from("product_images").delete().in("product_id", productIds), "delete product image metadata");
      await must(client.from("products").delete().in("id", productIds), "delete prior demo products");
    }
    await must(client.from("reports").delete().eq("target_type", "BUSINESS").in("target_id", businessIds), "delete business reports");
    await must(client.from("business_categories").delete().in("business_id", businessIds), "delete prior demo business categories");
    await must(client.from("businesses").delete().in("id", businessIds), "delete prior demo businesses");
  }

  await must(client.from("reports").delete().in("target_id", userIds), "delete reports targeting demo users");

  const applications = await must<any[]>(
    client.from("seller_applications").select("id").in("applicant_id", userIds),
    "load prior demo applications"
  );
  const applicationIds = applications.map((row) => row.id);
  if (applicationIds.length > 0) {
    await must(client.from("seller_application_categories").delete().in("seller_application_id", applicationIds), "delete prior demo application categories");
    await must(client.from("student_verifications").delete().in("seller_application_id", applicationIds), "delete prior demo verifications");
    await must(client.from("seller_applications").delete().in("id", applicationIds), "delete prior demo applications");
  }

  await must(client.from("user_roles").delete().in("user_id", userIds), "delete prior demo roles");

  for (const user of demoUsers) {
    const result = await client.auth.admin.deleteUser(user.id);
    if (result.error) throw result.error;
  }
}

async function createDemoUsers(client: SupabaseClient, count: number) {
  const users: Array<{ id: string; fullName: string; email: string }> = [];
  for (let i = 0; i < count; i += 1) {
    const fullName = `${pick(firstNames, i)} ${pick(lastNames, i * 3 + 2)}`;
    const email = `demo.user${String(i + 1).padStart(2, "0")}@${DEMO_DOMAIN}`;
    const { data, error } = await client.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName, demo: true }
    });
    if (error || !data.user) throw error ?? new Error("Failed to create demo user");
    users.push({ id: data.user.id, fullName, email });
  }
  return users;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "YES") {
    throw new Error("Refusing to seed demo data in production. Set ALLOW_DEMO_SEED=YES only if this is intentionally a disposable demo environment.");
  }

  console.log("Phase 24 demo seed starting...");
  await cleanupDemoUsers(supabase);

  const users = await createDemoUsers(supabase, 48);
  const owners = users.slice(0, businessTemplates.length);
  const customers = users.slice(18);

  const categories = await must<any[]>(
    supabase.from("categories").select("id,name,slug").eq("is_active", true),
    "load categories"
  );
  const universities = await must<any[]>(
    supabase.from("universities").select("id,name,short_name,slug").eq("is_active", true),
    "load universities"
  );

  const categoryByName: IdMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const universityByShort: IdMap = Object.fromEntries(universities.map((u) => [u.short_name, u.id]));

  const applications: any[] = [];
  const businesses: any[] = [];

  console.log("Creating seller applications and businesses...");
  for (let i = 0; i < businessTemplates.length; i += 1) {
    const owner = owners[i];
    const template = businessTemplates[i];
    const application = await must<any[]>(
      supabase
        .from("seller_applications")
        .insert({
          applicant_id: owner.id,
          business_type: template.type,
          status: "APPROVED",
          business_name: template.name,
          description: template.description,
          location_text: template.location,
          contact_phone: `024${String(1000000 + i * 731).slice(-7)}`,
          social_links: { instagram: `@${slugify(template.name).replaceAll("-", "")}` },
          pickup_enabled: template.pickup,
          seller_delivery_enabled: template.delivery,
          logo_path: null,
          submitted_at: daysAgo(120 - i * 3),
          reviewed_at: daysAgo(118 - i * 3),
          review_note: "Approved demo marketplace seller."
        })
        .select("*"),
      "insert approved seller application"
    ).then((rows) => rows[0]);

    applications.push(application);

    await must(
      supabase.from("seller_application_categories").insert(
        template.categories.map((name) => ({
          seller_application_id: application.id,
          category_id: categoryByName[name]
        }))
      ),
      "insert application categories"
    );

    if (template.type === "STUDENT_BUSINESS" && template.university) {
      await must(
        supabase.from("student_verifications").insert({
          applicant_id: owner.id,
          seller_application_id: application.id,
          university_id: universityByShort[template.university],
          student_email: `${slugify(owner.fullName).replaceAll("-", ".")}@${template.university.toLowerCase()}.edu.gh`,
          status: "VERIFIED",
          verified_at: daysAgo(121 - i * 3)
        }),
        "insert student verification"
      );
    }

    const business = await must<any[]>(
      supabase
        .from("businesses")
        .insert({
          owner_id: owner.id,
          source_application_id: application.id,
          business_type: template.type,
          name: template.name,
          slug: `${slugify(template.name)}-${String(i + 1).padStart(2, "0")}`,
          description: template.description,
          university_id: template.university ? universityByShort[template.university] : null,
          location_text: template.location,
          contact_phone: `024${String(1000000 + i * 731).slice(-7)}`,
          social_links: { instagram: `@${slugify(template.name).replaceAll("-", "")}` },
          pickup_enabled: template.pickup,
          seller_delivery_enabled: template.delivery,
          logo_path: null,
          status: i === 16 ? "DISABLED" : "ACTIVE",
          availability_status: i % 7 === 0 ? "UNAVAILABLE" : "OPEN",
          is_featured: i < 6,
          approved_at: daysAgo(118 - i * 3),
          created_at: daysAgo(118 - i * 3)
        })
        .select("*"),
      "insert business"
    ).then((rows) => rows[0]);

    businesses.push(business);

    await must(
      supabase.from("business_categories").insert(
        template.categories.map((name) => ({
          business_id: business.id,
          category_id: categoryByName[name]
        }))
      ),
      "insert business categories"
    );

    await must(
      supabase.from("user_roles").upsert({ user_id: owner.id, role: "SELLER" }, { onConflict: "user_id,role" }),
      "grant seller role"
    );
  }

  console.log("Creating pending and rejected seller applications...");
  for (let i = 0; i < 8; i += 1) {
    const applicant = customers[i];
    const status = i < 5 ? "PENDING" : "REJECTED";
    const type = i % 2 === 0 ? "STUDENT_BUSINESS" : "OTHER_BUSINESS";
    const name = ["Campus Laundry Co","Study Fuel","Creative Corner","Nova Gadgets","Snack Lab","Old Town Prints","Metro Beauty","Swift Tutors"][i];
    const app = await must<any[]>(
      supabase.from("seller_applications").insert({
        applicant_id: applicant.id,
        business_type: type,
        status,
        business_name: name,
        description: `${name} is a realistic demo seller application used to test the admin review workflow and marketplace onboarding experience.`,
        location_text: ["Ayeduase, Kumasi","Legon, Accra","Cape Coast","Madina, Accra"][i % 4],
        contact_phone: `055${String(4000000 + i * 211).slice(-7)}`,
        social_links: {},
        pickup_enabled: true,
        seller_delivery_enabled: i % 2 === 0,
        logo_path: `demo/${slugify(name)}.png`,
        submitted_at: daysAgo(8 - Math.min(i, 6)),
        reviewed_at: status === "REJECTED" ? daysAgo(2) : null,
        review_note: status === "REJECTED" ? "Application details were incomplete for demo moderation." : null
      }).select("*"),
      "insert demo pending/rejected app"
    ).then((rows) => rows[0]);

    await must(
      supabase.from("seller_application_categories").insert({
        seller_application_id: app.id,
        category_id: categoryByName[i % 2 === 0 ? "Services" : "Other"]
      }),
      "insert demo app category"
    );

    if (type === "STUDENT_BUSINESS") {
      const short = ["KNUST","UG","UCC","UPSA"][i % 4];
      await must(
        supabase.from("student_verifications").insert({
          applicant_id: applicant.id,
          seller_application_id: app.id,
          university_id: universityByShort[short],
          student_email: `applicant${i + 1}@${short.toLowerCase()}.edu.gh`,
          status: "VERIFIED",
          verified_at: daysAgo(9 - Math.min(i, 6))
        }),
        "insert demo application verification"
      );
    }
  }

  console.log("Creating products...");
  const products: any[] = [];
  let productCounter = 0;
  for (let b = 0; b < businesses.length; b += 1) {
    const template = businessTemplates[b];
    const pool = template.categories.flatMap((category) =>
      (productsByCategory[category] ?? []).map((item) => ({ category, item }))
    );
    const targetCount = 9 + (b % 5);
    for (let p = 0; p < targetCount; p += 1) {
      const source = pool[p % pool.length];
      const [baseName, basePrice, description] = source.item;
      const suffix = p >= pool.length ? ` ${Math.floor(p / pool.length) + 1}` : "";
      const status = productCounter % 19 === 0 ? "OUT_OF_STOCK" : productCounter % 23 === 0 ? "INACTIVE" : productCounter % 31 === 0 ? "HIDDEN" : "ACTIVE";
      const stock = status === "OUT_OF_STOCK" ? 0 : 3 + ((productCounter * 7) % 48);
      const product = await must<any[]>(
        supabase.from("products").insert({
          business_id: businesses[b].id,
          category_id: categoryByName[source.category],
          name: `${baseName}${suffix}`,
          slug: `${slugify(baseName)}-${b + 1}-${p + 1}`,
          description,
          price: Number((basePrice * (0.92 + ((b + p) % 5) * 0.04)).toFixed(2)),
          stock_quantity: stock,
          status,
          is_featured: productCounter < 12,
          created_at: daysAgo(95 - ((productCounter * 5) % 80))
        }).select("*"),
        "insert product"
      ).then((rows) => rows[0]);
      products.push(product);
      productCounter += 1;
    }
  }

  console.log(`Created ${products.length} products.`);

  console.log("Creating wishlists and active carts...");
  for (let i = 0; i < customers.length; i += 1) {
    const customer = customers[i];
    const wishlistRows = Array.from({ length: 3 + (i % 4) }, (_, j) => ({
      user_id: customer.id,
      product_id: products[(i * 11 + j * 7) % products.length].id,
      created_at: daysAgo((i + j) % 20)
    }));
    await must(
      supabase.from("wishlist_items").upsert(wishlistRows, { onConflict: "user_id,product_id", ignoreDuplicates: true }),
      "seed wishlists"
    );

    if (i < 12) {
      const cart = await must<any[]>(
        supabase.from("carts").insert({ user_id: customer.id, status: "ACTIVE", created_at: daysAgo(i % 4) }).select("*"),
        "seed active cart"
      ).then((rows) => rows[0]);
      const cartProducts = products.filter((p) => p.status === "ACTIVE" && Number(p.stock_quantity) > 2).slice(i * 2, i * 2 + 2);
      if (cartProducts.length) {
        await must(
          supabase.from("cart_items").insert(cartProducts.map((p, j) => ({
            cart_id: cart.id,
            product_id: p.id,
            quantity: 1 + ((i + j) % 2)
          }))),
          "seed cart items"
        );
      }
    }
  }

  console.log("Creating historical orders...");
  const activeProducts = products.filter((p) => p.status !== "REMOVED");
  const orderRows: any[] = [];
  const completedSellerOrders: any[] = [];
  for (let i = 0; i < 120; i += 1) {
    const customer = customers[i % customers.length];
    const sellerCount = i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1;
    const chosenBusinesses = Array.from({ length: sellerCount }, (_, j) => businesses[(i * 3 + j * 5) % 16]);
    const createdAt = daysAgo((i * 2) % 105, i % 17);

    const order = await must<any[]>(
      supabase.from("orders").insert({
        order_number: `DEMO-ORD-${String(1001 + i).padStart(5, "0")}`,
        customer_id: customer.id,
        customer_full_name: customer.fullName,
        customer_phone: `05${i % 2 === 0 ? "4" : "5"}${String(2000000 + i * 389).slice(-7)}`,
        customer_location: ["KNUST Campus","Ayeduase","Legon","Madina","Cape Coast","Adum, Kumasi"][i % 6],
        customer_note: i % 6 === 0 ? "Please call when you arrive." : null,
        status: "PENDING",
        total: 0,
        created_at: createdAt,
        updated_at: createdAt
      }).select("*"),
      "insert order"
    ).then((rows) => rows[0]);

    let orderTotal = 0;
    const statuses = ["COMPLETED","COMPLETED","COMPLETED","PREPARING","READY","OUT_FOR_DELIVERY","ACCEPTED","PENDING","REJECTED","CANCELLED"];
    const sellerOrdersForParent: any[] = [];

    for (let j = 0; j < chosenBusinesses.length; j += 1) {
      const business = chosenBusinesses[j];
      const candidates = activeProducts.filter((p) => p.business_id === business.id);
      if (!candidates.length) continue;
      const itemCount = 1 + ((i + j) % 3);
      const chosenProducts = Array.from({ length: itemCount }, (_, k) => candidates[(i + j + k * 2) % candidates.length]);
      const subtotal = chosenProducts.reduce((sum, p, k) => sum + Number(p.price) * (1 + ((i + k) % 2)), 0);
      const method = business.pickup_enabled && business.seller_delivery_enabled ? ((i + j) % 2 === 0 ? "PICKUP" : "SELLER_DELIVERY") : business.pickup_enabled ? "PICKUP" : "SELLER_DELIVERY";
      let finalStatus = statuses[(i + j) % statuses.length];
      if (method === "PICKUP" && finalStatus === "OUT_FOR_DELIVERY") finalStatus = "READY";
      if (method === "SELLER_DELIVERY" && finalStatus === "READY") finalStatus = "OUT_FOR_DELIVERY";

      const so = await must<any[]>(
        supabase.from("seller_orders").insert({
          order_id: order.id,
          business_id: business.id,
          seller_order_number: `${order.order_number}-${String(j + 1).padStart(2, "0")}`,
          business_name_snapshot: business.name,
          fulfilment_method: method,
          status: finalStatus,
          subtotal: Number(subtotal.toFixed(2)),
          created_at: createdAt,
          updated_at: createdAt
        }).select("*"),
        "insert seller order"
      ).then((rows) => rows[0]);

      sellerOrdersForParent.push(so);
      orderTotal += Number(subtotal.toFixed(2));

      const items = chosenProducts.map((p, k) => {
        const quantity = 1 + ((i + k) % 2);
        return {
          seller_order_id: so.id,
          product_id: p.id,
          product_name_snapshot: p.name,
          product_slug_snapshot: p.slug,
          unit_price: Number(p.price),
          quantity,
          subtotal: Number((Number(p.price) * quantity).toFixed(2)),
          created_at: createdAt
        };
      });

      const insertedItems = await must<any[]>(
        supabase.from("order_items").insert(items).select("*"),
        "insert order items"
      );

      const timeline: string[] =
        finalStatus === "COMPLETED"
          ? ["PENDING","ACCEPTED","PREPARING", method === "PICKUP" ? "READY" : "OUT_FOR_DELIVERY","COMPLETED"]
          : finalStatus === "REJECTED"
          ? ["PENDING","REJECTED"]
          : finalStatus === "CANCELLED"
          ? ["PENDING","CANCELLED"]
          : finalStatus === "PENDING"
          ? ["PENDING"]
          : finalStatus === "ACCEPTED"
          ? ["PENDING","ACCEPTED"]
          : finalStatus === "PREPARING"
          ? ["PENDING","ACCEPTED","PREPARING"]
          : ["PENDING","ACCEPTED","PREPARING",finalStatus];

      await must(
        supabase.from("order_status_history").delete().eq("seller_order_id", so.id),
        "replace status history"
      );
      await must(
        supabase.from("order_status_history").insert(
          timeline.map((status, idx) => ({
            seller_order_id: so.id,
            status,
            changed_by: status === "PENDING" ? null : business.owner_id,
            note: status === "REJECTED" ? "Seller could not fulfil this demo order." : null,
            created_at: new Date(new Date(createdAt).getTime() + idx * 2 * 3600000).toISOString()
          }))
        ),
        "insert demo status history"
      );

      if (finalStatus === "COMPLETED") {
        completedSellerOrders.push({ sellerOrder: so, items: insertedItems, customer, business, createdAt });
      }
    }

    const allTerminal = sellerOrdersForParent.every((so) => ["COMPLETED","REJECTED","CANCELLED"].includes(so.status));
    const anyCompleted = sellerOrdersForParent.some((so) => so.status === "COMPLETED");
    const parentStatus = allTerminal ? (anyCompleted ? "COMPLETED" : "CANCELLED") : "PENDING";
    await must(
      supabase.from("orders").update({ total: Number(orderTotal.toFixed(2)), status: parentStatus, updated_at: createdAt }).eq("id", order.id),
      "finalize parent order"
    );
    orderRows.push({ ...order, total: orderTotal, status: parentStatus });
  }

  console.log("Creating verified reviews...");
  for (let i = 0; i < Math.min(110, completedSellerOrders.length); i += 1) {
    const entry = completedSellerOrders[i];
    const rating = i % 11 === 0 ? 3 : i % 5 === 0 ? 4 : 5;
    if (i % 2 === 0) {
      await must(
        supabase.from("reviews").insert({
          reviewer_id: entry.customer.id,
          target_type: "BUSINESS",
          business_id: entry.business.id,
          seller_order_id: entry.sellerOrder.id,
          rating,
          comment: pick(reviewComments, i),
          status: "ACTIVE",
          created_at: new Date(new Date(entry.createdAt).getTime() + 3 * 86400000).toISOString()
        }),
        "insert business review"
      );
    }
    const item = entry.items[0];
    if (item) {
      await must(
        supabase.from("reviews").insert({
          reviewer_id: entry.customer.id,
          target_type: "PRODUCT",
          product_id: item.product_id,
          order_item_id: item.id,
          seller_order_id: entry.sellerOrder.id,
          rating,
          comment: pick(reviewComments, i + 3),
          status: "ACTIVE",
          created_at: new Date(new Date(entry.createdAt).getTime() + 4 * 86400000).toISOString()
        }),
        "insert product review"
      );
    }
  }

  console.log("Creating moderation reports...");
  const reportTargets = [
    ...products.slice(7, 12).map((p) => ({ type: "PRODUCT", id: p.id, label: p.name })),
    ...businesses.slice(3, 7).map((b) => ({ type: "BUSINESS", id: b.id, label: b.name })),
    ...owners.slice(9, 12).map((u) => ({ type: "SELLER", id: u.id, label: u.fullName }))
  ];
  for (let i = 0; i < reportTargets.length; i += 1) {
    const target = reportTargets[i];
    await must(
      supabase.from("reports").insert({
        reporter_id: customers[(i + 7) % customers.length].id,
        target_type: target.type,
        target_id: target.id,
        target_label: target.label,
        target_context: { demo: true },
        reason: reportReasons[i % reportReasons.length],
        description: "Demo moderation report created to exercise the admin review queue.",
        status: i < 7 ? "PENDING" : i < 9 ? "REVIEWED" : "DISMISSED",
        admin_action: "NONE",
        created_at: daysAgo(1 + (i % 12))
      }),
      "insert report"
    );
  }

  console.log("Adding extra notification activity...");
  for (let i = 0; i < customers.length; i += 1) {
    const rows = Array.from({ length: 2 + (i % 3) }, (_, j) => ({
      recipient_id: customers[i].id,
      type: j % 2 === 0 ? "MARKETPLACE_UPDATE" : "WISHLIST_REMINDER",
      title: j % 2 === 0 ? "Marketplace update" : "Wishlist reminder",
      message: j % 2 === 0 ? "New products and stores are available in the demo marketplace." : "One of your saved demo products is still available.",
      entity_type: null,
      entity_id: null,
      action_url: j % 2 === 0 ? "/products" : "/wishlist",
      is_read: j === 0 && i % 2 === 0,
      created_at: daysAgo((i + j) % 15)
    }));
    await must(supabase.from("notifications").insert(rows), "insert extra notifications");
  }

  console.log("\nDemo marketplace seeded successfully.");
  console.log(`Users: ${users.length}`);
  console.log(`Businesses: ${businesses.length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Orders: ${orderRows.length}`);
  console.log(`Completed seller orders available for reviews: ${completedSellerOrders.length}`);
  console.log(`Demo login password: ${DEMO_PASSWORD}`);
  console.log(`Example customer: ${customers[0].email}`);
  console.log(`Example seller: ${owners[0].email}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
