import { cn } from "@/lib/utils";

type BadgeVariant = "pending" | "in-progress" | "completed" | "shipped" | "low-stock" | "active" | "idle";

const variantStyles: Record<BadgeVariant, string> = {
  pending: "bg-warning/20 text-warning-foreground",
  "in-progress": "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  shipped: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
  "low-stock": "bg-danger/15 text-danger",
  active: "bg-success/15 text-success",
  idle: "bg-muted text-muted-foreground",
};

const labels: Record<BadgeVariant, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
  shipped: "Shipped",
  "low-stock": "LOW STOCK",
  active: "Active",
  idle: "Idle",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  className?: string;
}

const StatusBadge = ({ variant, className }: StatusBadgeProps) => (
  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", variantStyles[variant], className)}>
    {labels[variant]}
  </span>
);

export default StatusBadge;
