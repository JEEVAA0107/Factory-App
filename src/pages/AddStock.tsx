import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { addOrUpdateStock } from "@/services/inventoryService";

const AddStock = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ item: "", quantity: "", threshold: "50", unit: "kg" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.item || !form.quantity) {
      toast.error("Fill required fields");
      return;
    }
    setLoading(true);
    try {
      await addOrUpdateStock(
        form.item,
        Number(form.quantity),
        Number(form.threshold),
        form.unit
      );
      toast.success("Stock updated!");
      navigate("/inventory");
    } catch (error: any) {
      console.error("Add stock error:", error);
      toast.error("Failed to update stock. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <PageHeader title="Add Stock" back />
      <div className="px-4 py-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Item Name</label>
          <input
            type="text"
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            placeholder="e.g. Cotton Thread"
            className="w-full h-14 px-4 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Quantity</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-full h-14 px-4 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Low Stock Threshold</label>
          <input
            type="number"
            value={form.threshold}
            onChange={(e) => setForm({ ...form, threshold: e.target.value })}
            placeholder="e.g. 50"
            className="w-full h-14 px-4 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-black text-muted-foreground mb-1.5 block uppercase tracking-wider">Unit</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {["kg", "pcs", "meters", "liters"].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setForm({ ...form, unit: u })}
                className={`h-12 rounded-xl font-bold text-xs uppercase transition-all active:scale-95 ${
                  form.unit === u 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "bg-card text-muted-foreground border border-border hover:bg-muted/50"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Stock"}
        </button>
      </div>
    </div>
  );
};

export default AddStock;
