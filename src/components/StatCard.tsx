import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant: "blue" | "yellow" | "red" | "green";
  onClick?: () => void;
}

const bgMap = {
  blue: "bg-primary/10 text-primary hover:bg-primary/15",
  yellow: "bg-warning/15 text-warning-foreground hover:bg-warning/20",
  red: "bg-danger/10 text-danger hover:bg-danger/15",
  green: "bg-success/10 text-success hover:bg-success/15",
};

const iconBg = {
  blue: "bg-primary text-primary-foreground",
  yellow: "bg-warning text-warning-foreground",
  red: "bg-danger text-danger-foreground",
  green: "bg-success text-success-foreground",
};

const StatCard = ({ icon: Icon, label, value, variant, onClick }: StatCardProps) => (
  <div 
    onClick={onClick}
    className={cn(
      "rounded-2xl p-4 flex flex-col gap-2 transition-all duration-200 border border-transparent", 
      bgMap[variant],
      onClick && "cursor-pointer active:scale-95 shadow-sm hover:shadow-md hover:border-border"
    )}
  >
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", iconBg[variant])}>
      <Icon size={20} />
    </div>
    <span className="text-2xl font-black">{value}</span>
    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">{label}</span>
  </div>
);

export default StatCard;
