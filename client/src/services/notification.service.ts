import { apiRequest } from "./api";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const getNotifications = (unreadOnly = false) =>
  apiRequest<NotificationItem[]>(`/notifications${unreadOnly ? "?unread=true" : ""}`);

export const getUnreadNotificationCount = () =>
  apiRequest<{ count: number }>("/notifications/unread-count");

export const markNotificationRead = (id: string) =>
  apiRequest<NotificationItem>(`/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  apiRequest<{ updated: boolean }>("/notifications/read-all", { method: "PATCH" });
