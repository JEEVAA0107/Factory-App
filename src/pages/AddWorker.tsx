import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { addWorker } from "@/services/workersService";

const AddWorker = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", role: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.role) {
      toast.error("Fill required fields");
      return;
    }
    setLoading(true);
    try {
      await addWorker({
        name: form.name,
        role: form.role,
      });
      toast.success("Worker added!");
      navigate("/workers");
    } catch (error: any) {
      console.error("Add worker error:", error);
      toast.error("Failed to add worker. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <PageHeader title="Add Worker" back />
      <div className="px-4 py-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-14 px-4 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Role</label>
          <select 
            value={form.role} 
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full h-14 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="">Select Role</option>
            <option value="Cutter">Cutter</option>
            <option value="Stitcher">Stitcher</option>
            <option value="Dyer">Dyer</option>
            <option value="Finisher">Finisher</option>
            <option value="Packer">Packer</option>
            <option value="Weaver">Weaver</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Worker"}
        </button>
      </div>
    </div>
  );
};

export default AddWorker;
