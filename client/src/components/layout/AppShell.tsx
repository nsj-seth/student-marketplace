import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../services/auth.service";
import { getUnreadNotificationCount } from "../../services/notification.service";

interface AppShellProps {
  children: ReactNode;
}

function Brand() {
  return (
    <Link className="app-brand" to="/" aria-label="Student Marketplace home">
      <span className="app-brand__mark" aria-hidden="true">S</span>
      <span className="app-brand__text">
        <strong>Student</strong>
        <span>Marketplace</span>
      </span>
    </Link>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? "app-nav__link app-nav__link--active" : "app-nav__link";
}

export function AppShell({ children }: AppShellProps) {
  const { user, roles, loading } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const isSellerArea = location.pathname === "/seller" || location.pathname.startsWith("/seller/");
  const isAdminArea = location.pathname.startsWith("/admin");
  const hasWorkspace = isSellerArea || isAdminArea;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    getUnreadNotificationCount()
      .then((response) => setUnread(response.data?.count ?? 0))
      .catch(() => setUnread(0));
  }, [user, location.pathname]);

  const workspaceLinks = useMemo(() => {
    if (isAdminArea) {
      return [
        ["/admin", "Overview"],
        ["/admin/seller-applications", "Seller applications"],
        ["/admin/users", "Users"],
        ["/admin/businesses", "Businesses"],
        ["/admin/products", "Products"],
        ["/admin/orders", "Orders"],
        ["/admin/reports", "Reports"],
        ["/admin/marketplace", "Marketplace"],
        ["/admin/reference-data", "Reference data"]
      ] as const;
    }
    if (isSellerArea) {
      return [
        ["/seller", "Overview"],
        ["/seller/businesses", "Businesses"],
        ["/seller/orders", "Orders"],
        ["/seller/reviews", "Reviews"]
      ] as const;
    }
    return [] as const;
  }, [isAdminArea, isSellerArea]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header__inner">
          <Brand />

          <nav className="app-nav app-nav--desktop" aria-label="Main navigation">
            <NavLink className={navClass} to="/products">Explore</NavLink>
            <NavLink className={navClass} to="/businesses">Stores</NavLink>
            <NavLink className={navClass} to="/reference-data">Categories</NavLink>
          </nav>

          <div className="app-header__actions">
            {!loading && user ? (
              <>
                <Link className="header-icon-link" to="/wishlist" aria-label="Wishlist">♡</Link>
                <Link className="header-icon-link" to="/cart" aria-label="Cart">▢</Link>
                <Link className="header-icon-link header-icon-link--notification" to="/notifications" aria-label="Notifications">
                  ♢{unread > 0 && <span>{unread > 9 ? "9+" : unread}</span>}
                </Link>
                <Link className="account-chip" to="/profile">
                  <span className="account-chip__avatar">{(user.email?.[0] ?? "U").toUpperCase()}</span>
                  <span className="account-chip__label">Account</span>
                </Link>
              </>
            ) : !loading ? (
              <>
                <Link className="app-nav__link app-nav--desktop" to="/login">Sign in</Link>
                <Link className="button-link app-header__cta app-nav--desktop" to="/register">Join marketplace</Link>
              </>
            ) : null}

            <button
              type="button"
              className="menu-toggle"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <NavLink className={navClass} to="/products">Explore products</NavLink>
            <NavLink className={navClass} to="/businesses">Browse stores</NavLink>
            <NavLink className={navClass} to="/reference-data">Categories</NavLink>
            {!loading && user ? (
              <>
                <NavLink className={navClass} to="/orders">My orders</NavLink>
                <NavLink className={navClass} to="/wishlist">Wishlist</NavLink>
                <NavLink className={navClass} to="/cart">Cart</NavLink>
                <NavLink className={navClass} to="/sell">Sell on marketplace</NavLink>
                {roles.includes("SELLER") && <NavLink className={navClass} to="/seller">Seller hub</NavLink>}
                {roles.includes("ADMIN") && <NavLink className={navClass} to="/admin">Admin</NavLink>}
                <button className="mobile-menu__logout" type="button" onClick={() => void logout()}>Sign out</button>
              </>
            ) : !loading ? (
              <>
                <NavLink className={navClass} to="/login">Sign in</NavLink>
                <NavLink className={navClass} to="/register">Create account</NavLink>
              </>
            ) : null}
          </div>
        )}
      </header>

      {hasWorkspace ? (
        <div className="workspace-layout">
          <aside className="workspace-sidebar">
            <div className="workspace-sidebar__heading">
              <span className="workspace-sidebar__badge">{isAdminArea ? "A" : "S"}</span>
              <div>
                <strong>{isAdminArea ? "Admin Panel" : "Seller Hub"}</strong>
                <small>{isAdminArea ? "Marketplace control" : "Your commerce workspace"}</small>
              </div>
            </div>
            <nav className="workspace-nav" aria-label={isAdminArea ? "Admin navigation" : "Seller navigation"}>
              {workspaceLinks.map(([to, label]) => (
                <NavLink key={to} className={({ isActive }) => isActive ? "workspace-nav__link workspace-nav__link--active" : "workspace-nav__link"} end={to === "/admin" || to === "/seller"} to={to}>{label}</NavLink>
              ))}
            </nav>
            <div className="workspace-sidebar__footer">
              <Link to="/">Back to marketplace</Link>
              <Link to="/profile">Account settings</Link>
            </div>
          </aside>
          <div className="workspace-content">{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
