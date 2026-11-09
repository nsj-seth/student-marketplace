import { useEffect, useState } from "react";
import { Bell, CheckCheck, Circle, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccountNav } from "../../components/account/AccountNav";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem
} from "../../services/notification.service";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await getNotifications(unreadOnly);
      setItems(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [unreadOnly]);

  async function openNotification(item: NotificationItem) {
    if (!item.is_read) {
      await markNotificationRead(item.id);
      setItems((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
    }
    if (item.action_url) navigate(item.action_url);
  }

  async function readAll() {
    await markAllNotificationsRead();
    setItems((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at ?? new Date().toISOString()
      }))
    );
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto mt-5 w-[min(1100px,calc(100%-32px))]">
        <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <Bell className="size-3.5" />
              Account activity
            </Badge>
            <h1 className="text-3xl font-bold tracking-[-.025em]">Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Order updates, seller activity and marketplace messages appear here.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-5 py-4 text-center shadow-sm">
            <strong className="block text-2xl">{unreadCount}</strong>
            <span className="text-xs text-muted-foreground">unread in this view</span>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountNav />

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(event) => setUnreadOnly(event.target.checked)}
                  className="size-4 accent-violet-600"
                />
                Show unread only
              </label>

              <button
                data-ui="notifications-read-all"
                type="button"
                onClick={() => void readAll()}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <CheckCheck className="size-4" />
                Mark all as read
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
                {error}
              </div>
            )}

            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-card text-primary-text shadow-sm">
                  <Inbox className="size-6" />
                </span>
                <h2 className="mt-4 text-xl font-semibold">
                  {unreadOnly ? "You're all caught up" : "No notifications yet"}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {unreadOnly
                    ? "You have no unread notifications in this view."
                    : "Marketplace activity will appear here when there is something new."}
                </p>
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="space-y-3">
                {items.map((item) => (
                  <button
                    data-ui="notification-card"
                    key={item.id}
                    type="button"
                    onClick={() => void openNotification(item)}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-sm",
                      item.is_read
                        ? "border-border bg-card"
                        : "border-primary/20 bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl",
                        item.is_read
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {item.is_read ? <Bell className="size-4" /> : <Circle className="size-4 fill-current" />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-semibold text-foreground">{item.title}</strong>
                        {!item.is_read && <Badge variant="secondary">New</Badge>}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.message}</span>
                      <small className="mt-2 block text-xs text-muted-foreground">{formatDate(item.created_at)}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
