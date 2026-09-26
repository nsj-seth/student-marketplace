import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "./notification.repository.js";

export const getMyNotifications = (userId: string, unreadOnly = false) => listNotifications(userId, unreadOnly);
export const getMyUnreadCount = (userId: string) => getUnreadNotificationCount(userId);
export const readMyNotification = (userId: string, id: string) => markNotificationRead(userId, id);
export const readAllMyNotifications = (userId: string) => markAllNotificationsRead(userId);
