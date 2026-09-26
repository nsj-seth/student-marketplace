import { buildCartView } from "../cart/cart.repository.js";
import { findProfileById } from "../profiles/profile.repository.js";
import type { CheckoutPreview, CheckoutValidationInput, FulfilmentMethod, ValidatedCheckout } from "./checkout.types.js";

function checkoutError(name: string, message: string) {
  const error = new Error(message);
  error.name = name;
  return error;
}

function availableMethods(group: Awaited<ReturnType<typeof buildCartView>>["groups"][number]): FulfilmentMethod[] {
  const methods: FulfilmentMethod[] = [];
  if (group.business.pickup_enabled) methods.push("PICKUP");
  if (group.business.seller_delivery_enabled) methods.push("SELLER_DELIVERY");
  return methods;
}

async function buildPreview(userId: string, email: string): Promise<CheckoutPreview> {
  const cart = await buildCartView(userId);
  if (!cart.id || cart.items.length === 0) {
    throw checkoutError("EMPTY_CART", "Your cart is empty.");
  }

  for (const group of cart.groups) {
    if (group.business.availability_status !== "OPEN") {
      throw checkoutError("BUSINESS_UNAVAILABLE", `${group.business.name} is currently unavailable.`);
    }

    const methods = availableMethods(group);
    if (methods.length === 0) {
      throw checkoutError("NO_FULFILMENT_METHOD", `${group.business.name} has no available fulfilment method.`);
    }

    for (const item of group.items) {
      if (item.product.status === "OUT_OF_STOCK" || item.product.stock_quantity < item.quantity) {
        throw checkoutError(
          "INSUFFICIENT_STOCK",
          `${item.product.name} no longer has enough stock for the quantity in your cart.`
        );
      }
    }
  }

  const profile = await findProfileById(userId);

  return {
    customer: {
      full_name: profile.full_name,
      email
    },
    cart_id: cart.id,
    groups: cart.groups.map((group) => ({
      business: {
        id: group.business.id,
        name: group.business.name,
        slug: group.business.slug,
        location_text: group.business.location_text,
        pickup_enabled: group.business.pickup_enabled,
        seller_delivery_enabled: group.business.seller_delivery_enabled
      },
      items: group.items,
      subtotal: group.subtotal,
      available_fulfilment_methods: availableMethods(group)
    })),
    item_count: cart.item_count,
    total_quantity: cart.total_quantity,
    total: cart.total
  };
}

export async function getCheckoutPreview(userId: string, email: string) {
  return buildPreview(userId, email);
}

export async function validateCheckout(userId: string, email: string, input: CheckoutValidationInput): Promise<ValidatedCheckout> {
  const preview = await buildPreview(userId, email);
  const selectionMap = new Map(input.fulfilmentSelections.map((selection) => [selection.businessId, selection.method]));

  if (selectionMap.size !== input.fulfilmentSelections.length) {
    throw checkoutError("INVALID_FULFILMENT_SELECTION", "Each business must have exactly one fulfilment selection.");
  }

  if (selectionMap.size !== preview.groups.length) {
    throw checkoutError("INVALID_FULFILMENT_SELECTION", "Choose a fulfilment method for every business in your cart.");
  }

  for (const group of preview.groups) {
    const selected = selectionMap.get(group.business.id);
    if (!selected) {
      throw checkoutError("INVALID_FULFILMENT_SELECTION", `Choose a fulfilment method for ${group.business.name}.`);
    }
    if (!group.available_fulfilment_methods.includes(selected)) {
      throw checkoutError("INVALID_FULFILMENT_SELECTION", `${selected} is not available for ${group.business.name}.`);
    }
  }

  for (const businessId of selectionMap.keys()) {
    if (!preview.groups.some((group) => group.business.id === businessId)) {
      throw checkoutError("INVALID_FULFILMENT_SELECTION", "A fulfilment selection references a business that is not in your cart.");
    }
  }

  return {
    ...preview,
    checkout_details: {
      customer_full_name: input.customerFullName.trim(),
      phone: input.phone.trim(),
      location: input.location.trim(),
      note: input.note?.trim() ? input.note.trim() : null,
      fulfilment_selections: preview.groups.map((group) => ({
        business_id: group.business.id,
        method: selectionMap.get(group.business.id)!
      }))
    }
  };
}
