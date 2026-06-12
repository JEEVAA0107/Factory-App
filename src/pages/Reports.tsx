import AppLayout from "@/components/AppLayout";
import { BarChart3, ClipboardList, Package, Users, TrendingUp, CheckCircle } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useInventory } from "@/hooks/useInventory";
import { useWorkers } from "@/hooks/useWorkers";
import { useProduction } from "@/hooks/useProduction";

const Reports = () => {
  const { orders } = useOrders();
  const { inventory } = useInventory();
  const { workers } = useWorkers();
  const { production } = useProduction();

  // Stats
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const inProgressOrders = orders.filter((o) => o.status === "in-progress").length;
  const totalOrders = orders.length;

  const activeWorkers = workers.filter((w) => w.assigned_tasks.length > 0).length;
  const totalWorkers = workers.length;

  const lowStockItems = inventory.filter((i) => i.stock_quantity <= i.threshold);
  const totalInventory = inventory.length;

  const completedProduction = production.filter((p) => p.status === "completed").length;
  const totalProduction = production.length;

  // Build chart data from orders (group by day of week for THE CURRENT WEEK ONLY)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts = new Array(7).fill(0);
  
  const today = new Date();
  // Find the Monday of the current week
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); 
  const mondayOfThisWeek = new Date(curr.setDate(first));
  mondayOfThisWeek.setHours(0, 0, 0, 0);

  orders.forEach((o) => {
    if (o.created_at?.toDate) {
      const orderDate = o.created_at.toDate();
      // Only count if the order is from this week (Monday onwards)
      if (orderDate >= mondayOfThisWeek && orderDate <= today) {
        const day = orderDate.getDay();
        dayCounts[day]++;
      }
    }
  });

  // Rearrange to Mon-Sun
  const chartDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartValues = [dayCounts[1], dayCounts[2], dayCounts[3], dayCounts[4], dayCounts[5], dayCounts[6], dayCounts[0]];
  const maxVal = Math.max(...chartValues, 1);

  // Completion rate
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Reports</h1>
      </div>
      <div className="px-4 space-y-4 pb-4">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle size={16} className="text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">{completedOrders}</p>
            <p className="text-xs text-muted-foreground">Orders Completed</p>
          </div>
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center">
                <ClipboardList size={16} className="text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold">{pendingOrders + inProgressOrders}</p>
            <p className="text-xs text-muted-foreground">Pending Work</p>
          </div>
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users size={16} className="text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{activeWorkers}/{totalWorkers}</p>
            <p className="text-xs text-muted-foreground">Active Workers</p>
          </div>
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                <Package size={16} className="text-danger" />
              </div>
            </div>
            <p className="text-2xl font-bold">{lowStockItems.length}</p>
            <p className="text-xs text-muted-foreground">Low Stock Items</p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold flex items-center gap-2"><TrendingUp size={16} /> Order Completion Rate</p>
            <span className="text-lg font-bold text-primary">{completionRate}%</span>
          </div>
          <div className="h-3 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completionRate}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{completedOrders} completed</span>
            <span>{totalOrders} total</span>
          </div>
        </div>

        {/* Orders Weekly Report - Horizontal Bar Chart */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">Weekly Performance</h2>
            <p className="text-[10px] text-muted-foreground font-medium italic">Quantity produced per day</p>
          </div>

          <div className="space-y-4">
            {chartDays.map((d, i) => {
              const value = chartValues[i];
              const isZero = value === 0;
              
              const barColors = [
                "bg-[#10B981]", "bg-[#059669]", "bg-[#047857]", "bg-[#064E3B]",
                "bg-[#10B981]", "bg-[#059669]", "bg-[#047857]"
              ];
              
              const barColor = isZero ? "bg-[#EF4444]" : barColors[i % barColors.length];
              const percentage = (value / maxVal) * 100;

              return (
                <div key={d} className="flex items-center gap-3 group">
                  {/* Day Label */}
                  <div className={`w-10 text-xs font-black uppercase tracking-tighter ${isZero ? 'text-red-500' : 'text-foreground'}`}>
                    {d}
                  </div>
                  
                  {/* The Bar */}
                  <div className={`flex-1 h-8 ${isZero ? 'bg-red-50/50' : 'bg-muted/30'} rounded-r-md overflow-hidden relative border ${isZero ? 'border-red-200' : 'border-border/10'}`}>
                    <div
                      className={`h-full ${barColor} transition-all duration-700 ease-out group-hover:brightness-110`}
                      style={{ width: `${Math.max(percentage, isZero ? 1 : 2)}%` }}
                    />
                    
                    {/* Number Overlay */}
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                       <span className={`text-[10px] font-black ${percentage > 10 ? 'text-white' : (isZero ? 'text-red-600' : 'text-foreground')}`}>
                         {value} {isZero ? 'Orders (Alert)' : 'Orders'}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Production Progress */}
        <div className="bg-card rounded-xl p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><ClipboardList size={16} /> Production Status</p>
          <div className="space-y-2">
            {[
              { label: "Pending", count: production.filter((p) => p.status === "pending").length, color: "bg-warning" },
              { label: "In Progress", count: production.filter((p) => p.status === "in-progress").length, color: "bg-primary" },
              { label: "Completed", count: completedProduction, color: "bg-success" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-sm flex-1">{item.label}</span>
                <span className="text-sm font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Material Usage - from inventory */}
        <div className="bg-card rounded-xl p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Package size={16} /> Inventory Overview</p>
          <div className="space-y-2">
            {inventory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inventory data</p>
            ) : (
              inventory.map((m) => (
                <div key={m.id} className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {m.stock_quantity <= m.threshold && (
                      <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                    )}
                    {m.item_name}
                  </span>
                  <span className={`font-medium ${m.stock_quantity <= m.threshold ? "text-danger" : "text-muted-foreground"}`}>
                    {m.stock_quantity} {m.unit || "units"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default Reports;
