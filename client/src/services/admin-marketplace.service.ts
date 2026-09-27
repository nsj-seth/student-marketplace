import { apiRequest } from "./api";

export interface MarketplaceAdminBusiness {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  status: string;
  is_featured: boolean;
  created_at: string;
}

export interface MarketplaceAdminProduct {
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
  businesses: MarketplaceAdminBusiness[];
  products: MarketplaceAdminProduct[];
}

export function getMarketplaceManagement() {
  return apiRequest<MarketplaceManagementData>("/admin/marketplace");
}

export function setFeaturedBusiness(id: string, featured: boolean) {
  return apiRequest<{ businessId: string; featured: boolean; changed: boolean }>(`/admin/marketplace/businesses/${id}/featured`, {
    method: "PATCH",
    body: JSON.stringify({ featured })
  });
}

export function setFeaturedProduct(id: string, featured: boolean) {
  return apiRequest<{ productId: string; featured: boolean; changed: boolean }>(`/admin/marketplace/products/${id}/featured`, {
    method: "PATCH",
    body: JSON.stringify({ featured })
  });
}
