import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  unreadCountController
} from "./notification.controller.js";

export const notificationRouter = Router();
notificationRouter.use(requireAuth);
notificationRouter.get("/", listNotificationsController);
notificationRouter.get("/unread-count", unreadCountController);
notificationRouter.patch("/read-all", markAllNotificationsReadController);
notificationRouter.patch("/:id/read", markNotificationReadController);
