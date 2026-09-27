import { findAdminOrderById, listAdminOrders } from "./admin-order.repository.js";
export const getAdminOrders = listAdminOrders;
export const getAdminOrder = findAdminOrderById;
