import type { CartItemView } from "../cart/cart.types.js";

export type FulfilmentMethod = "PICKUP" | "SELLER_DELIVERY";

export interface CheckoutBusinessGroup {
  business: {
    id: string;
    name: string;
    slug: string;
    location_text: string;
    pickup_enabled: boolean;
    seller_delivery_enabled: boolean;
  };
  items: CartItemView[];
  subtotal: number;
  available_fulfilment_methods: FulfilmentMethod[];
}

export interface CheckoutPreview {
  customer: {
    full_name: string;
    email: string;
  };
  cart_id: string;
  groups: CheckoutBusinessGroup[];
  item_count: number;
  total_quantity: number;
  total: number;
}

export interface CheckoutValidationInput {
  customerFullName: string;
  phone: string;
  location: string;
  note?: string;
  fulfilmentSelections: Array<{
    businessId: string;
    method: FulfilmentMethod;
  }>;
}

export interface ValidatedCheckout extends CheckoutPreview {
  checkout_details: {
    customer_full_name: string;
    phone: string;
    location: string;
    note: string | null;
    fulfilment_selections: Array<{
      business_id: string;
      method: FulfilmentMethod;
    }>;
  };
}
