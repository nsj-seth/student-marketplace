import {
  Bell,
  FileWarning,
  Heart,
  Package,
  UserRound
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { to: "/profile", label: "Profile", description: "Personal details", icon: UserRound },
  { to: "/orders", label: "My orders", description: "Track purchases", icon: Package },
  { to: "/wishlist", label: "Wishlist", description: "Saved products", icon: Heart },
  { to: "/notifications", label: "Notifications", description: "Marketplace updates", icon: Bell },
  { to: "/reports", label: "My reports", description: "Moderation requests", icon: FileWarning }
] as const;

export function AccountNav() {
  return (
    <aside className="rounded-2xl border border-border bg-card p-2 shadow-sm lg:sticky lg:top-[92px] lg:self-start">
      <nav className="grid gap-1" aria-label="Account navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 transition",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted"
                )
              }
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-black/5">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-semibold">{item.label}</strong>
                <small className="block truncate text-xs opacity-70">{item.description}</small>
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
