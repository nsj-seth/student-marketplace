import { getSupabaseAdminClient } from "../../lib/supabase.js";
import type { NotificationItem } from "./notification.types.js";

const fields = "id,type,title,message,entity_type,entity_id,action_url,is_read,read_at,created_at";

export async function listNotifications(userId: string, unreadOnly = false): Promise<NotificationItem[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("notifications")
    .select(fields)
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load notifications: ${error.message}`);
  return (data ?? []) as NotificationItem[];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(`Unable to count notifications: ${error.message}`);
  return count ?? 0;
}

export async function markNotificationRead(userId: string, id: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", userId)
    .select(fields)
    .maybeSingle();

  if (error) throw new Error(`Unable to update notification: ${error.message}`);
  return data as NotificationItem | null;
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(`Unable to update notifications: ${error.message}`);
}
