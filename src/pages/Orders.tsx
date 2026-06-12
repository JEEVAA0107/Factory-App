import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import FAB from "@/components/FAB";
import { Search, Calendar, ChevronRight } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Order } from "@/services/ordersService";

const filters = ["All", "Pending", "In Progress", "Completed", "Shipped"] as const;

const Orders = () => {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get("status") || "All";
  // Convert "pending" or "in-progress" back to title case for the UI button
  const startFilter = filters.find(f => f.toLowerCase().replace(" ", "-") === initialFilter.toLowerCase()) || "All";
  
  const [activeFilter, setActiveFilter] = useState<string>(startFilter);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { orders, loading, loadingMore, hasMore, loadMore } = useOrders();

  const filtered = orders.filter((o) => {
    const matchFilter = activeFilter === "All" || o.status === activeFilter.toLowerCase().replace(" ", "-");
    const matchSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.product.toLowerCase().includes(search.toLowerCase()) ||
      o.order_id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold font-black tracking-tight">Orders</h1>
      </div>

      <div className="px-4 mb-3">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-12 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === f ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3 pb-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No orders found</p>
          </div>
        ) : (
          filtered.map((order) => (
            <div
              key={order.id}
              className="bg-card rounded-xl p-4 space-y-2 border border-border/50 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-base text-foreground">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{order.product}</p>
                </div>
                <StatusBadge variant={order.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{order.order_id}</span>
                <span className="font-bold">Qty: {order.quantity}</span>
                <span className="flex items-center gap-1 font-medium">
                  <Calendar size={14} /> {order.deadline || "No deadline"}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Load More Button */}
        {hasMore && orders.length > 0 && activeFilter === "All" && !search && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-4 text-sm font-bold text-primary bg-primary/5 rounded-xl border border-dashed border-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {loadingMore ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : "Load More Orders"}
          </button>
        )}
        
        {!hasMore && orders.length >= 20 && (
          <p className="text-center py-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            You've reached the end of the list
          </p>
        )}
      </div>
      <FAB to="/orders/add" />
    </AppLayout>
  );
};

export default Orders;
