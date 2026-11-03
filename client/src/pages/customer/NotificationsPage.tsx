import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getNotifications, markAllNotificationsRead, markNotificationRead, type NotificationItem } from "../../services/notification.service";

function formatDate(value: string) { return new Date(value).toLocaleString(); }

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try { const response = await getNotifications(unreadOnly); setItems(response.data ?? []); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load notifications."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [unreadOnly]);

  async function openNotification(item: NotificationItem) {
    if (!item.is_read) {
      await markNotificationRead(item.id);
      setItems((current) => current.map((n) => n.id === item.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
    }
    if (item.action_url) navigate(item.action_url);
  }

  async function readAll() {
    await markAllNotificationsRead();
    setItems((current) => current.map((item) => ({ ...item, is_read: true, read_at: item.read_at ?? new Date().toISOString() })));
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <main className="wide-shell notifications-page">
      <section className="notifications-hero">
        <div><span className="eyebrow">Account activity</span><h1>Notifications</h1><p>Order updates, seller activity, account changes and marketplace messages appear here.</p></div>
        <div className="notifications-hero__count"><strong>{unreadCount}</strong><span>unread in this view</span></div>
      </section>

      <div className="notifications-toolbar">
        <label className="toggle-filter"><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} /><span>Unread only</span></label>
        <div><Link to="/profile">Account</Link><button className="button-secondary" onClick={() => void readAll()}>Mark all as read</button></div>
      </div>

      {error && <p className="message message--error">{error}</p>}
      {loading && <div className="orders-loading">Loading notifications...</div>}
      {!loading && items.length === 0 && <div className="empty-state notifications-empty"><span className="empty-state__icon">◇</span><h2>{unreadOnly ? "You're all caught up" : "No notifications yet"}</h2><p>{unreadOnly ? "You have no unread notifications in this view." : "Marketplace activity will appear here when there is something new."}</p></div>}

      <div className="notification-list notification-list--premium">
        {items.map((item) => (
          <button key={item.id} className={`notification-card notification-card--premium${item.is_read ? "" : " notification-card--unread"}`} onClick={() => void openNotification(item)}>
            <span className={`notification-card__icon${item.is_read ? "" : " notification-card__icon--unread"}`}>◇</span>
            <div className="notification-card__content"><div><strong>{item.title}</strong>{!item.is_read && <span className="notification-dot" aria-label="Unread" />}</div><p>{item.message}</p><small>{formatDate(item.created_at)}</small></div>
            <span className="notification-card__arrow">→</span>
          </button>
        ))}
      </div>
    </main>
  );
}
