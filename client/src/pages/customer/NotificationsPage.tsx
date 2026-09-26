import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      setItems((current) => current.map((n) => n.id === item.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
    }
    if (item.action_url) navigate(item.action_url);
  }

  async function readAll() {
    await markAllNotificationsRead();
    setItems((current) => current.map((item) => ({ ...item, is_read: true, read_at: item.read_at ?? new Date().toISOString() })));
  }

  return (
    <main className="page-shell">
      <p><Link to="/">← Marketplace</Link></p>
      <div className="section-heading">
        <div><span className="eyebrow">Account</span><h1>Notifications</h1></div>
        <button onClick={() => void readAll()}>Mark all as read</button>
      </div>

      <label className="checkbox-row">
        <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />
        Show unread only
      </label>

      {error && <p className="message message--error">{error}</p>}
      {loading && <p>Loading notifications...</p>}
      {!loading && items.length === 0 && <p>No notifications to show.</p>}

      <div className="notification-list">
        {items.map((item) => (
          <button
            key={item.id}
            className={`notification-card${item.is_read ? "" : " notification-card--unread"}`}
            onClick={() => void openNotification(item)}
          >
            <div>
              <strong>{item.title}</strong>
              {!item.is_read && <span className="notification-dot" aria-label="Unread" />}
            </div>
            <p>{item.message}</p>
            <small>{formatDate(item.created_at)}</small>
          </button>
        ))}
      </div>
    </main>
  );
}
