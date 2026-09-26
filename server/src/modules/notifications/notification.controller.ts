import type { RequestHandler } from "express";
import {
  getMyNotifications,
  getMyUnreadCount,
  readAllMyNotifications,
  readMyNotification
} from "./notification.service.js";

export const listNotificationsController: RequestHandler = async (req, res, next) => {
  try {
    const unreadOnly = req.query.unread === "true";
    const data = await getMyNotifications(req.auth!.user.id, unreadOnly);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const unreadCountController: RequestHandler = async (req, res, next) => {
  try {
    const count = await getMyUnreadCount(req.auth!.user.id);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

export const markNotificationReadController: RequestHandler = async (req, res, next) => {
  try {
    const data = await readMyNotification(req.auth!.user.id, req.params.id);
    if (!data) {
      res.status(404).json({ success: false, message: "Notification not found.", code: "NOTIFICATION_NOT_FOUND" });
      return;
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsReadController: RequestHandler = async (req, res, next) => {
  try {
    await readAllMyNotifications(req.auth!.user.id);
    res.status(200).json({ success: true, data: { updated: true } });
  } catch (error) {
    next(error);
  }
};
