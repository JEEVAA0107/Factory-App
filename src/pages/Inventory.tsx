import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import FAB from "@/components/FAB";
import { useInventory } from "@/hooks/useInventory";
import { adjustStock } from "@/services/inventoryService";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Minus, AlertTriangle } from "lucide-react";

const Inventory = () => {
  const { inventory, loading } = useInventory();
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");

  const getLevel = (qty: number, threshold: number) => {
    if (qty <= threshold) return { color: "bg-danger", level: "low" };
    if (qty <= threshold * 2.5) return { color: "bg-warning", level: "medium" };
    return { color: "bg-success", level: "good" };
  };

  const lowStockItems = inventory.filter((item) => item.stock_quantity <= item.threshold);

  const handleAdjust = async (docId: string, amount: number) => {
    try {
      await adjustStock(docId, amount);
      toast.success(amount > 0 ? "Stock added" : "Stock subtracted");
      setAdjustingId(null);
      setAdjustQty("");
    } catch {
      toast.error("Failed to adjust stock");
    }
  };

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Inventory</h1>
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockItems.length > 0 && (
        <div className="px-4 mb-3">
          <div className="bg-danger/10 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle size={18} className="text-danger mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-danger">Low Stock Alert!</p>
              <p className="text-xs text-danger/80 mt-0.5">
                {lowStockItems.map((i) => i.item_name).join(", ")} {lowStockItems.length === 1 ? "is" : "are"} below threshold
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-3 pb-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No inventory items yet</p>
          </div>
        ) : (
          inventory.map((item) => {
            const maxVal = Math.max(item.threshold * 3, item.stock_quantity, 1);
            const { color, level } = getLevel(item.stock_quantity, item.threshold);
            const pct = Math.round((item.stock_quantity / maxVal) * 100);
            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm overflow-hidden"
              >
                <div onClick={() => setAdjustingId(adjustingId === item.id ? null : item.id)}>
                  <div className="flex justify-between items-start gap-3 mb-1">
                    <p className="font-bold text-base leading-tight break-words flex-1">{item.item_name}</p>
                    {level === "low" && <StatusBadge variant="low-stock" className="shrink-0 scale-90 origin-right" />}
                  </div>
                  
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      Current: <span className="text-foreground font-bold">{item.stock_quantity}</span> {item.unit || "pcs"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Limit: {item.threshold}</p>
                  </div>

                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>

                {/* Mobile-Friendly Adjust Controls */}
                {adjustingId === item.id && (
                  <div className="mt-4 pt-4 border-t border-dashed border-border flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Update Quantity</p>
                      <button 
                        onClick={() => setAdjustingId(null)}
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-12 bg-muted rounded-xl px-3 flex items-center shadow-inner">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          placeholder="Amount (default: 5)"
                          className="w-full bg-transparent border-none text-left font-bold text-sm focus:ring-0 outline-none text-foreground placeholder:text-muted-foreground/50"
                        />
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleAdjust(item.id, -Math.abs(Number(adjustQty) || 5))}
                          className="w-12 sm:w-14 h-12 rounded-xl bg-danger text-white flex items-center justify-center active:scale-90 transition-transform shadow-md shadow-danger/20"
                          title="Subtract Stock"
                        >
                          <Minus size={20} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => handleAdjust(item.id, Math.abs(Number(adjustQty) || 5))}
                          className="w-12 sm:w-14 h-12 rounded-xl bg-success text-white flex items-center justify-center active:scale-90 transition-transform shadow-md shadow-success/20"
                          title="Add Stock"
                        >
                          <Plus size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <FAB to="/inventory/add" />
    </AppLayout>
  );
};

export default Inventory;
