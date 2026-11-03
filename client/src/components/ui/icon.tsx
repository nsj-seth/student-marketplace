import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AppIconProps = {
  icon: LucideIcon;
  className?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export function AppIcon({
  icon: Icon,
  className,
  size = 18,
  strokeWidth = 1.9,
  label
}: AppIconProps) {
  return (
    <Icon
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
