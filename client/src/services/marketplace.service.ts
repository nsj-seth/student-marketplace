import { apiRequest } from "./api";
import type { PublicBusiness } from "./business.service";
import type { Category } from "./category.service";
import type { PublicProduct } from "./product.service";

export interface MarketplaceHomeData {
  categories: Category[];
  featuredBusinesses: PublicBusiness[];
  featuredProducts: PublicProduct[];
  newBusinesses: PublicBusiness[];
  newProducts: PublicProduct[];
}

export function getMarketplaceHome() {
  return apiRequest<MarketplaceHomeData>("/marketplace/home");
}
