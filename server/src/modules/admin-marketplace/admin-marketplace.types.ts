export interface FeaturedBusinessRecord {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  status: string;
  is_featured: boolean;
  created_at: string;
}

export interface FeaturedProductRecord {
  id: string;
  name: string;
  slug: string;
  business_id: string;
  business_name: string;
  business_status: string;
  status: string;
  price: number;
  is_featured: boolean;
  created_at: string;
}

export interface MarketplaceManagementData {
  businesses: FeaturedBusinessRecord[];
  products: FeaturedProductRecord[];
}
