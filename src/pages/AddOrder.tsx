import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { addOrder } from "@/services/ordersService";
import { addProductionStage } from "@/services/productionService";
import { useInventory } from "@/hooks/useInventory";

const AddOrder = () => {
  const navigate = useNavigate();
  const { inventory } = useInventory();
  const [form, setForm] = useState({ 
    customer: "", 
    product: "", 
    quantity: "", 
    deadline: "", 
    material_id: "",
    consumption: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.customer || !form.product || !form.quantity) {
      toast.error("Fill required fields");
      return;
    }
    setLoading(true);
    try {
      const { id: docId, order_id } = await addOrder({
        customer_name: form.customer,
        product: form.product,
        quantity: Number(form.quantity),
        deadline: form.deadline,
        material_id: form.material_id,
        consumption_per_unit: Number(form.consumption),
      });

      // Also create a production entry for this order
      await addProductionStage({
        order_id: order_id, 
        order_doc_id: docId,
        stage: "Cutting", 
        assigned_worker: "",
        status: "pending",
        deadline: form.deadline,
        product: form.product,
        material_id: form.material_id,
        consumption_per_unit: Number(form.consumption),
        quantity: Number(form.quantity),
      });

      toast.success("Order created!");
      navigate("/orders");
    } catch (error: any) {
      console.error("Add order error:", error);
      toast.error("Failed to create order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full h-14 px-4 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <PageHeader title="Add Order" back />
      <div className="px-4 py-4 space-y-4">
        {field("Customer Name", "customer")}
        {field("Product Name", "product")}
        <div className="grid grid-cols-2 gap-4">
          {field("Quantity", "quantity", "number")}
          {field("Deadline", "deadline", "date")}
        </div>

        <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-border space-y-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inventory Link (Optional)</p>
          
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block text-left">Fabric/Material</label>
            <select
              value={form.material_id}
              onChange={(e) => setForm({ ...form, material_id: e.target.value })}
              className="w-full h-12 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="">Select Material</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>{item.item_name} ({item.stock_quantity} {item.unit} available)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block text-left">Consumption per Unit (Qty {form.quantity || 0} x ?)</label>
            <input
              type="number"
              placeholder="e.g. 1.5"
              value={form.consumption}
              onChange={(e) => setForm({ ...form, consumption: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Order"}
        </button>
      </div>
    </div>
  );
};

export default AddOrder;
