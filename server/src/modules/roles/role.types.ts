export const APP_ROLES = ["CUSTOMER", "SELLER", "ADMIN"] as const;
export type AppRole = (typeof APP_ROLES)[number];
