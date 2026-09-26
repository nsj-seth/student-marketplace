import type { RequestHandler } from "express";
import { createReportSchema, listReportsQuerySchema, resolveReportSchema } from "./report.schema.js";
import { getAdminReport, getAdminReports, getOwnReports, moderateReport, submitReport } from "./report.service.js";

export const createReportController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = createReportSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, message: "Invalid report details.", code: "VALIDATION_ERROR" }); return; }
    const report = await submitReport(req.auth!.user.id, parsed.data);
    if (!report) { res.status(404).json({ success: false, message: "Report target not found.", code: "TARGET_NOT_FOUND" }); return; }
    res.status(201).json({ success: true, data: report });
  } catch (error) { next(error); }
};

export const listMyReportsController: RequestHandler = async (req, res, next) => {
  try { res.json({ success: true, data: await getOwnReports(req.auth!.user.id) }); } catch (error) { next(error); }
};

export const listAdminReportsController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = listReportsQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ success: false, message: "Invalid report filters.", code: "VALIDATION_ERROR" }); return; }
    res.json({ success: true, data: await getAdminReports(parsed.data.status, parsed.data.targetType) });
  } catch (error) { next(error); }
};

export const getAdminReportController: RequestHandler = async (req, res, next) => {
  try {
    const report = await getAdminReport(req.params.id);
    if (!report) { res.status(404).json({ success: false, message: "Report not found.", code: "REPORT_NOT_FOUND" }); return; }
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};

export const resolveAdminReportController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = resolveReportSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, message: "Invalid moderation decision.", code: "VALIDATION_ERROR" }); return; }
    const report = await moderateReport(req.params.id, req.auth!.user.id, parsed.data.status, parsed.data.action, parsed.data.note);
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};
