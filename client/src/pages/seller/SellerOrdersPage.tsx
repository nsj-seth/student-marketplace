import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getMyBusinesses, type ManagedBusiness } from "../../services/business.service";
import { getSellerOrders, type SellerOrderGroup, type SellerOrderListItem } from "../../services/seller-order.service";

const money = (value: number) => `GH₵${value.toFixed(2)}`;
const dateTime = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll("_", " ");

const groups: Array<{ value: SellerOrderGroup; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected / Cancelled" },
  { value: "all", label: "All" }
];

export function SellerOrdersPage() {
  const [params, setParams] = useSearchParams();
  const group = (params.get("group") as SellerOrderGroup | null) ?? "pending";
  const businessId = params.get("businessId") ?? "";
  const [orders, setOrders] = useState<SellerOrderListItem[]>([]);
  const [businesses, setBusinesses] = useState<ManagedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void getMyBusinesses()
      .then((response) => setBusinesses(response.data ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    void getSellerOrders({ group, businessId: businessId || undefined })
      .then((response) => setOrders(response.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load seller orders."))
      .finally(() => setLoading(false));
  }, [group, businessId]);

  function updateFilter(key: "group" | "businessId", value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  }

  return (
    <main className="wide-shell">
      <section className="card wide-card">
        <div className="section-heading">
          <div><span className="eyebrow">Seller dashboard</span><h1>Orders</h1></div>
          <div className="actions"><Link to="/seller/businesses">My businesses</Link><Link to="/">Marketplace</Link></div>
        </div>

        <div className="seller-order-filters">
          <label>Business
            <select value={businessId} onChange={(event) => updateFilter("businessId", event.target.value)}>
              <option value="">All businesses</option>
              {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
            </select>
          </label>
          <label>Order group
            <select value={group} onChange={(event) => updateFilter("group", event.target.value)}>
              {groups.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>

        {error && <p className="message message--error">{error}</p>}
        {loading && <p>Loading seller orders...</p>}
        {!loading && orders.length === 0 && <div className="empty-state"><h2>No orders in this view</h2><p>Orders will appear here when customers place them.</p></div>}

        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="section-heading">
                <div><span className="eyebrow">{order.business_name}</span><h2>{order.seller_order_number}</h2><small>Parent: {order.parent_order_number}</small></div>
                <span className="status-chip">{label(order.status)}</span>
              </div>
              <div className="seller-order-list-grid">
                <div><span>Customer</span><strong>{order.customer_full_name}</strong></div>
                <div><span>Fulfilment</span><strong>{order.fulfilment_method === "PICKUP" ? "Customer Pickup" : "Seller Delivery"}</strong></div>
                <div><span>Placed</span><strong>{dateTime(order.created_at)}</strong></div>
                <div><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div>
              </div>
              <div className="order-card-footer"><span /><Link className="button-link" to={`/seller/orders/${order.id}`}>Manage order</Link></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
