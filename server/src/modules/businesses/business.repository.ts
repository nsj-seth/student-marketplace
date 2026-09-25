import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { BusinessAvailability, BusinessRecord, ManagedBusiness } from "./business.types.js";

const businessFields = "id, owner_id, source_application_id, business_type, name, slug, description, university_id, location_text, contact_phone, social_links, pickup_enabled, seller_delivery_enabled, logo_path, status, availability_status, approved_at, created_at, updated_at";

async function attachRelations(businesses: BusinessRecord[]): Promise<ManagedBusiness[]> {
  if (businesses.length === 0) return [];
  const supabase = getSupabaseAdminClient();
  const ids = businesses.map((business) => business.id);
  const universityIds = [...new Set(businesses.map((business) => business.university_id).filter(Boolean))] as string[];

  const { data: relationRows, error: relationError } = await supabase
    .from("business_categories")
    .select("business_id, category_id, categories(id, name, slug, is_active)")
    .in("business_id", ids);

  if (relationError) throw new Error(`Unable to load business categories: ${relationError.message}`);

  let universityRows: Array<{ id: string; name: string; short_name: string | null; slug: string }> = [];
  if (universityIds.length) {
    const { data, error } = await supabase
      .from("universities")
      .select("id, name, short_name, slug")
      .in("id", universityIds);
    if (error) throw new Error(`Unable to load business universities: ${error.message}`);
    universityRows = (data ?? []) as Array<{ id: string; name: string; short_name: string | null; slug: string }>;
  }

  const universities = new Map(universityRows.map((row) => [row.id, row]));
  const relations = new Map<string, Array<{ id: string; name: string; slug: string; is_active: boolean }>>();

  for (const row of relationRows ?? []) {
    const raw = row.categories as unknown;
    const category = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string; slug: string; is_active: boolean } | null;
    if (!category) continue;
    const businessId = row.business_id as string;
    const current = relations.get(businessId) ?? [];
    current.push(category);
    relations.set(businessId, current);
  }

  return businesses.map((business) => {
    const categories = relations.get(business.id) ?? [];
    return {
      ...business,
      social_links: (business.social_links ?? {}) as Record<string, string>,
      categories,
      category_ids: categories.map((category) => category.id),
      university: business.university_id
        ? (universities.get(business.university_id) as ManagedBusiness["university"] | undefined) ?? null
        : null
    };
  });
}

export async function listBusinessesOwnedBy(ownerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(businessFields)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load businesses: ${error.message}`);
  return attachRelations((data ?? []) as BusinessRecord[]);
}

export async function findBusinessOwnedBy(id: string, ownerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(businessFields)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load business: ${error.message}`);
  if (!data) return null;
  const [business] = await attachRelations([data as BusinessRecord]);
  return business ?? null;
}

export async function updateOwnedBusinessRecord(
  businessId: string,
  ownerId: string,
  input: {
    name: string;
    description: string;
    locationText: string;
    contactPhone: string;
    categoryIds: string[];
    pickupEnabled: boolean;
    sellerDeliveryEnabled: boolean;
    logoPath: string;
    socialLinks: Record<string, string | undefined>;
  }
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("update_owned_business", {
    p_business_id: businessId,
    p_owner_id: ownerId,
    p_name: input.name,
    p_description: input.description,
    p_location_text: input.locationText,
    p_contact_phone: input.contactPhone,
    p_social_links: Object.fromEntries(Object.entries(input.socialLinks).filter(([, value]) => Boolean(value))),
    p_pickup_enabled: input.pickupEnabled,
    p_seller_delivery_enabled: input.sellerDeliveryEnabled,
    p_logo_path: input.logoPath,
    p_category_ids: [...new Set(input.categoryIds)]
  });

  if (error) throw new Error(`Unable to update business: ${error.message}`);
  return findBusinessOwnedBy(businessId, ownerId);
}

export async function updateOwnedBusinessAvailability(
  businessId: string,
  ownerId: string,
  availabilityStatus: BusinessAvailability
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("businesses")
    .update({ availability_status: availabilityStatus })
    .eq("id", businessId)
    .eq("owner_id", ownerId)
    .select(businessFields)
    .maybeSingle();

  if (error) throw new Error(`Unable to update business availability: ${error.message}`);
  if (!data) return null;
  const [business] = await attachRelations([data as BusinessRecord]);
  return business ?? null;
}
