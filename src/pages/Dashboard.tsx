import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import { ClipboardList, Clock, AlertTriangle, CheckCircle, Plus, Package, UserPlus, Settings, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { useInventory } from "@/hooks/useInventory";
import { useMemo } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { orders } = useOrders();
  const { inventory } = useInventory();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Live stats from Firestore - Optimized with useMemo
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();

    const ordersToday = orders.filter((o) => {
      if (o.created_at?.toDate) {
        return o.created_at.toDate().toDateString() === todayStr;
      }
      return false;
    }).length;

    const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;

    const finishedToday = orders.filter((o) => {
      const isCompletedOrShipped = o.status === "completed" || o.status === "shipped";
      if (!isCompletedOrShipped) return false;
      const doneDate = o.shipped_at?.toDate?.() || o.completed_at?.toDate?.();
      return (doneDate && doneDate.toDateString() === todayStr) ||
        (o.status === "completed" && o.created_at?.toDate()?.toDateString() === todayStr);
    });

    return {
      ordersToday,
      pendingOrders: pendingOrdersCount,
      completedToday: finishedToday.length,
      finishedOrdersList: finishedToday
    };
  }, [orders]);

  const lowStockThreshold = userProfile?.stockThreshold || 10;
  const lowStockAlerts = useMemo(() =>
    inventory.filter((item) => item.stock_quantity <= lowStockThreshold).length
    , [inventory, lowStockThreshold]);

  const displayName = userProfile?.name || "User";

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4">
        <p className="text-muted-foreground text-sm">👋 {greeting}</p>
        <h1 className="text-2xl font-black">{displayName}</h1>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
        <StatCard 
          icon={ClipboardList} 
          label="Orders Today" 
          value={stats.ordersToday} 
          variant="blue" 
          onClick={() => navigate("/orders")}
        />
        <StatCard 
          icon={Clock} 
          label="Pending Orders" 
          value={stats.pendingOrders} 
          variant="yellow" 
          onClick={() => navigate("/orders?status=pending")}
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Low Stock Alerts" 
          value={lowStockAlerts} 
          variant="red" 
          onClick={() => navigate("/inventory")}
        />
        <StatCard 
          icon={CheckCircle} 
          label="Completed Today" 
          value={stats.completedToday} 
          variant="green" 
          onClick={() => navigate("/production")}
        />
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 ml-1">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => navigate("/orders/add")} 
            className="w-full h-16 rounded-2xl bg-primary text-white font-bold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            <span>New Order</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/inventory/add")}
              className="h-16 rounded-2xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-teal-600/20"
            >
              <Package size={18} />
              <span>Add Stock</span>
            </button>
            <button
              onClick={() => navigate("/workers/add")}
              className="h-16 rounded-2xl bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-amber-600/10"
            >
              <UserPlus size={18} />
              <span>Add Worker</span>
            </button>
          </div>
        </div>
      </div>

      {stats.finishedOrdersList.length > 0 && (
        <div className="px-4 mt-8 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <CheckCircle size={20} className="text-success" />
              Finished Today
            </h2>
            <span className="text-[10px] font-black bg-success/10 text-success px-2 py-0.5 rounded-full uppercase tracking-widest">
              {stats.finishedOrdersList.length} Units
            </span>
          </div>

          <div className="space-y-3">
            {stats.finishedOrdersList.map((order) => (
              <div key={order.id} className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs">
                    {order.order_id.slice(-4)}
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-none mb-1">{order.product}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{order.customer_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-success">{order.quantity}</p>
                  <p className="text-[8px] text-muted-foreground uppercase font-bold">Qty</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Dashboard;
