import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  UserRound,
  X
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../services/auth.service";
import { getCart } from "../../services/cart.service";
import { getUnreadNotificationCount } from "../../services/notification.service";
import { getWishlist } from "../../services/wishlist.service";

interface AppShellProps {
  children: ReactNode;
}

const primaryLinks = [
  { to: "/products", label: "Explore" },
  { to: "/businesses", label: "Stores" },
  { to: "/reference-data", label: "Categories" }
] as const;

function Brand() {
  return (
    <Link
      className="group flex min-w-max items-center gap-3 text-foreground no-underline"
      to="/"
      aria-label="Student Marketplace home"
    >
      <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-[1.03]">
        <ShoppingBag className="size-5" strokeWidth={2.1} aria-hidden="true" />
      </span>
      <span className="hidden leading-none sm:grid">
        <strong className="text-[15px] font-bold tracking-[-0.02em] text-foreground">Student Marketplace</strong>
        <span className="mt-1 text-[11px] font-medium text-muted-foreground">Local discovery, made simple</span>
      </span>
    </Link>
  );
}

function DesktopNav() {
  return (
    <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
      {primaryLinks.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function sellerNavIcon(to: string) {
  if (to === "/seller") return <LayoutDashboard className="size-4 shrink-0" />;
  if (to === "/seller/businesses") return <Store className="size-4 shrink-0" />;
  if (to === "/seller/orders") return <Package className="size-4 shrink-0" />;
  if (to === "/seller/reviews") return <MessageSquareText className="size-4 shrink-0" />;
  return null;
}

function IconLink({
  to,
  label,
  children,
  badge
}: {
  to: string;
  label: string;
  children: ReactNode;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs transition-all hover:-translate-y-px hover:border-primary/25 hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
    >
      {children}
      {!!badge && (
        <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: AppShellProps) {
  const { user, roles, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unread, setUnread] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const isSellerArea = location.pathname === "/seller" || location.pathname.startsWith("/seller/");
  const isAdminArea = location.pathname.startsWith("/admin");
  const hasWorkspace = isSellerArea || isAdminArea;

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      setCartCount(0);
      setWishlistCount(0);
      return;
    }

    let active = true;

    void Promise.allSettled([
      getUnreadNotificationCount(),
      getCart(),
      getWishlist()
    ]).then(([notificationResult, cartResult, wishlistResult]) => {
      if (!active) return;

      setUnread(
        notificationResult.status === "fulfilled"
          ? notificationResult.value.data?.count ?? 0
          : 0
      );
      setCartCount(
        cartResult.status === "fulfilled"
          ? cartResult.value.data?.total_quantity ?? 0
          : 0
      );
      setWishlistCount(
        wishlistResult.status === "fulfilled"
          ? wishlistResult.value.data?.length ?? 0
          : 0
      );
    });

    return () => {
      active = false;
    };
  }, [user, location.pathname]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
    setMenuOpen(false);
  }

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

  const avatar = (user?.email?.[0] ?? "U").toUpperCase();

  return (
    <div className="app-root bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/90 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] w-[min(1240px,calc(100%-32px))] items-center gap-4">
          <Brand />

          <DesktopNav />

          <form
            className="relative ml-auto hidden min-w-0 flex-1 lg:block xl:max-w-[420px]"
            onSubmit={submitSearch}
            role="search"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 rounded-xl bg-muted/55 pl-9 pr-16 shadow-none"
              placeholder="Search marketplace"
              aria-label="Search marketplace products"
            />
            <button
              data-ui="header-search-submit"
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-accent"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            {!loading && user ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <IconLink to="/wishlist" label="Wishlist" badge={wishlistCount}>
                    <Heart className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
                  </IconLink>
                  <IconLink to="/cart" label="Cart" badge={cartCount}>
                    <ShoppingCart className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
                  </IconLink>
                  <IconLink to="/notifications" label="Notifications" badge={unread}>
                    <Bell className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
                  </IconLink>
                </div>

                <div className="relative hidden md:block">
                  <Button
                    variant="outline"
                    className="h-10 gap-2 rounded-xl bg-card px-2.5 shadow-xs"
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    onClick={() => setAccountOpen((value) => !value)}
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {avatar}
                    </span>
                    <span className="max-w-24 truncate text-sm font-semibold">
                      {user.email?.split("@")[0] ?? "Account"}
                    </span>
                    <ChevronDown
                      className={cn("size-4 text-muted-foreground transition-transform", accountOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </Button>

                  {accountOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
                    >
                      <div className="border-b border-border px-3 py-2.5">
                        <p className="m-0 truncate text-sm font-semibold text-foreground">{user.email}</p>
                        <p className="m-0 mt-1 text-xs text-muted-foreground">
                          {roles.includes("SELLER") ? "Customer · Seller" : "Marketplace customer"}
                        </p>
                      </div>

                      <div className="grid gap-1 py-2">
                        <Link className="modern-account-menu-item" to="/profile">
                          <UserRound className="size-4" aria-hidden="true" /> Profile
                        </Link>
                        <Link className="modern-account-menu-item" to="/orders">
                          <Package className="size-4" aria-hidden="true" /> My orders
                        </Link>
                        {roles.includes("SELLER") && (
                          <Link className="modern-account-menu-item" to="/seller">
                            <LayoutDashboard className="size-4" aria-hidden="true" /> Seller Hub
                          </Link>
                        )}
                        {roles.includes("ADMIN") && (
                          <Link className="modern-account-menu-item" to="/admin">
                            <LayoutDashboard className="size-4" aria-hidden="true" /> Admin
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-border pt-2">
                        <button
                          data-ui="account-menu-logout"
                          type="button"
                          className="modern-account-menu-item w-full text-left text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void logout()}
                        >
                          <LogOut className="size-4" aria-hidden="true" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : !loading ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
                  to="/login"
                >
                  Sign in
                </Link>
                <Link className={buttonVariants({ size: "sm" })} to="/register">
                  Join marketplace
                </Link>
              </div>
            ) : null}

            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="mx-auto grid w-[min(1240px,calc(100%-32px))] gap-4 py-4">
              <form className="relative" onSubmit={submitSearch} role="search">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Search products"
                  aria-label="Search marketplace products"
                />
              </form>

              <nav className="grid gap-1" aria-label="Mobile navigation">
                {primaryLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    className={({ isActive }) =>
                      cn("modern-mobile-nav-link", isActive && "bg-accent text-accent-foreground")
                    }
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}

                {!loading && user ? (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <NavLink className="modern-mobile-nav-link" to="/orders">
                      <Package className="size-4" /> My orders
                    </NavLink>
                    <NavLink className="modern-mobile-nav-link" to="/wishlist">
                      <Heart className="size-4" /> Wishlist
                      {wishlistCount > 0 && <span className="ml-auto text-xs text-muted-foreground">{wishlistCount}</span>}
                    </NavLink>
                    <NavLink className="modern-mobile-nav-link" to="/cart">
                      <ShoppingCart className="size-4" /> Cart
                      {cartCount > 0 && <span className="ml-auto text-xs text-muted-foreground">{cartCount}</span>}
                    </NavLink>
                    <NavLink className="modern-mobile-nav-link" to="/notifications">
                      <Bell className="size-4" /> Notifications
                      {unread > 0 && <span className="ml-auto text-xs font-semibold text-primary">{unread > 9 ? "9+" : unread}</span>}
                    </NavLink>
                    <NavLink className="modern-mobile-nav-link" to="/profile">
                      <UserRound className="size-4" /> Account
                    </NavLink>
                    <NavLink className="modern-mobile-nav-link" to="/sell">
                      <Store className="size-4" /> Sell on marketplace
                    </NavLink>
                    {roles.includes("SELLER") && (
                      <NavLink className="modern-mobile-nav-link" to="/seller">
                        <LayoutDashboard className="size-4" /> Seller Hub
                      </NavLink>
                    )}
                    {roles.includes("ADMIN") && (
                      <NavLink className="modern-mobile-nav-link" to="/admin">
                        <LayoutDashboard className="size-4" /> Admin
                      </NavLink>
                    )}
                    <button
                      data-ui="mobile-logout"
                      className="modern-mobile-nav-link mt-1 text-left text-red-600"
                      type="button"
                      onClick={() => void logout()}
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </>
                ) : !loading ? (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <NavLink className="modern-mobile-nav-link" to="/login">Sign in</NavLink>
                    <NavLink className="modern-mobile-nav-link font-semibold text-primary" to="/register">Create account</NavLink>
                  </>
                ) : null}
              </nav>
            </div>
          </div>
        )}
      </header>

      {hasWorkspace ? (
        <div className="workspace-layout">
          <aside className="workspace-sidebar">
            <div className="workspace-sidebar__heading">
              <span className="workspace-sidebar__badge">
                {isAdminArea ? "A" : <Store className="size-4" aria-hidden="true" />}
              </span>
              <div>
                <strong>{isAdminArea ? "Admin Panel" : "Seller Hub"}</strong>
                <small>{isAdminArea ? "Marketplace control" : "Your commerce workspace"}</small>
              </div>
            </div>
            <nav className="workspace-nav" aria-label={isAdminArea ? "Admin navigation" : "Seller navigation"}>
              {workspaceLinks.map(([to, label]) => (
                <NavLink
                  key={to}
                  className={({ isActive }) =>
                    cn(
                      "workspace-nav__link",
                      isSellerArea && "flex items-center gap-2.5",
                      isActive && "workspace-nav__link--active"
                    )
                  }
                  end={to === "/admin" || to === "/seller"}
                  to={to}
                >
                  {isSellerArea && sellerNavIcon(to)}
                  <span>{label}</span>
                </NavLink>
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
