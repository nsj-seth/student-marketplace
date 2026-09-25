export type PublicProductStatus = "ACTIVE" | "OUT_OF_STOCK";

export interface PublicProductImage {
  id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface PublicProduct {
  id: string;
  business_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  status: PublicProductStatus;
  created_at: string;
  updated_at: string;
  category: { id: string; name: string; slug: string } | null;
  business: {
    id: string;
    name: string;
    slug: string;
    business_type: "STUDENT_BUSINESS" | "OTHER_BUSINESS";
    availability_status: "OPEN" | "UNAVAILABLE";
    university_id: string | null;
    location_text: string;
    pickup_enabled: boolean;
    seller_delivery_enabled: boolean;
    logo_path: string | null;
    university: null | { id: string; name: string; short_name: string | null; slug: string };
  };
  images: PublicProductImage[];
}
