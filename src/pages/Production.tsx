import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { Calendar, User, ArrowRight, Layers } from "lucide-react";
import { useProduction } from "@/hooks/useProduction";
import { useWorkers } from "@/hooks/useWorkers";
import { updateProductionStatus, updateProductionStage, updateProductionWorker, Production as ProductionItem } from "@/services/productionService";
import { updateWorkerTasks } from "@/services/workersService";
import { updateOrderStatus, updateOrderStatusByReadableId } from "@/services/ordersService";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { adjustStock } from "@/services/inventoryService";

const DEFAULT_STAGES = ["Cutting", "Stitching", "Dyeing", "Finishing", "Packing"];

const STAGE_TO_ROLE: Record<string, string> = {
  "Cutting": "Cutter",
  "Stitching": "Stitcher",
  "Dyeing": "Dyer",
  "Finishing": "Finisher",
  "Packing": "Packer"
};

const Production = () => {
  const { userProfile } = useAuth();
  const { production, loading } = useProduction();
  const { workers } = useWorkers();
  const [editingId, setEditingId] = useState<string | null>(null);

  const stages = userProfile?.productionStages || DEFAULT_STAGES;

  // Group tasks by status - memoized for performance
  const columns = useMemo(() => {
    const todayStr = new Date().toDateString();
    
    // Sort production by order_id manually since we removed it from the query
    const sortedProduction = [...production].sort((a, b) => 
      (a.order_id || "").localeCompare(b.order_id || "")
    );

    return [
      { title: "To Do", id: "pending", variant: "pending" as const, headerClass: "bg-amber-500/10 text-amber-600", tasks: sortedProduction.filter((t) => t.status === "pending") },
      { title: "In Production", id: "in-progress", variant: "in-progress" as const, headerClass: "bg-primary/10 text-primary", tasks: sortedProduction.filter((t) => t.status === "in-progress") },
      { title: "Finished", id: "completed", variant: "completed" as const, headerClass: "bg-success/10 text-success", tasks: sortedProduction.filter((t) => t.status === "completed") },
      { 
        title: "Shipped Today", 
        id: "shipped", 
        variant: "shipped" as const, 
        headerClass: "bg-indigo-500/10 text-indigo-400", 
        tasks: sortedProduction.filter((t) => 
          t.status === "shipped" && t.shipped_at?.toDate?.()?.toDateString() === todayStr
        ) 
      },
    ];
  }, [production]);

  const handleStartProduction = async (task: ProductionItem) => {
    try {
      // 1. Automate Inventory Subtraction (Improved Logic)
      if (task.material_id && task.consumption_per_unit && task.quantity) {
        const totalToSubtract = task.quantity * task.consumption_per_unit;
        await adjustStock(task.material_id, -totalToSubtract);
        toast.info(`Inventory Update: Subtracted ${totalToSubtract} units from stock.`);
      }

      // 3. Set to In Progress and set first stage
      await updateProductionStatus(task.id, "in-progress");
      await updateProductionStage(task.id, stages[0]);
      
      // Sync with Order
      if (task.order_doc_id) {
        await updateOrderStatus(task.order_doc_id, "in-progress");
      } else if (task.order_id) {
        await updateOrderStatusByReadableId(task.order_id, "in-progress");
      }
      
      toast.success(`Production started at ${stages[0]}!`);
    } catch (error) {
      console.error("Start production error:", error);
      toast.error("Failed to start production");
    }
  };

  const handleMoveForward = async (task: ProductionItem) => {
    if (task.status === "in-progress") {
      const currentIndex = stages.indexOf(task.stage);
      const isLastStage = currentIndex === stages.length - 1;
      const currentWorker = task.assigned_worker || "Unknown";

      try {
        if (isLastStage) {
          await updateProductionStatus(task.id, "completed", { worker: currentWorker, stage: task.stage });
          if (task.order_doc_id) await updateOrderStatus(task.order_doc_id, "completed");
          else if (task.order_id) await updateOrderStatusByReadableId(task.order_id, "completed");
          toast.success("All stages finished! Ready for shipping.");
        } else {
          const nextStage = stages[currentIndex + 1];
          await updateProductionStage(task.id, nextStage, { worker: currentWorker, stage: task.stage });
          await updateProductionWorker(task.id, ""); // Clear assigned worker for next stage
          toast.success(`Stage ${task.stage} done. Next: ${nextStage}`);
        }
      } catch {
        toast.error("Failed to update status");
      }
    } else if (task.status === "completed") {
      try {
        await updateProductionStatus(task.id, "shipped");
        if (task.order_doc_id) await updateOrderStatus(task.order_doc_id, "shipped");
        else if (task.order_id) await updateOrderStatusByReadableId(task.order_id, "shipped");
        toast.success("Order marked as Shipped!");
      } catch {
        toast.error("Failed to mark as shipped");
      }
    }
  };

  const handleWorkerAssign = async (taskId: string, workerName: string, orderId: string) => {
    try {
      await updateProductionWorker(taskId, workerName);
      const newWorker = workers.find(w => w.name === workerName);
      if (newWorker) {
        const updatedTasks = newWorker.assigned_tasks.includes(orderId) ? newWorker.assigned_tasks : [...newWorker.assigned_tasks, orderId];
        await updateWorkerTasks(newWorker.id, updatedTasks);
      }
      const oldWorkerName = production.find(t => t.id === taskId)?.assigned_worker;
      if (oldWorkerName && oldWorkerName !== workerName) {
        const oldWorker = workers.find(w => w.name === oldWorkerName);
        if (oldWorker) await updateWorkerTasks(oldWorker.id, oldWorker.assigned_tasks.filter(id => id !== orderId));
      }
      toast.success(`Assigned to ${workerName}`);
    } catch {
      toast.error("Failed to assign worker");
      throw new Error("Assignment failed");
    }
  };

  // Visual component for stage tracking
  const StageProgress = ({ currentStage, status }: { currentStage: string, status: string }) => {
    const currentIndex = stages.indexOf(currentStage);
    return (
      <div className="w-full py-2">
        <div className="flex justify-between mb-2">
          {stages.map((s, idx) => {
            const isCompleted = status === 'completed' || status === 'shipped' || idx < currentIndex;
            const isCurrent = status === 'in-progress' && idx === currentIndex;
            return (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-3 h-3 rounded-full mb-1 border-2 transition-all ${
                  isCompleted ? "bg-success border-success" : 
                  isCurrent ? "bg-primary animate-pulse border-primary" : 
                  "bg-muted border-muted-foreground/30"
                }`} />
                <span className={`text-[8px] font-bold uppercase tracking-tighter ${
                  isCurrent ? "text-primary" : "text-muted-foreground/60"
                }`}>{s}</span>
              </div>
            );
          })}
        </div>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-success transition-all duration-500" 
            style={{ width: status === 'completed' || status === 'shipped' ? '100%' : `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-2xl font-black mb-1">Factory Floor</h1>
        <p className="text-sm text-muted-foreground font-medium">Streamline your production workflow</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : production.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40"><ArrowRight size={32} /></div>
          <p className="text-xl font-bold mb-1">No tasks today</p>
          <p className="text-sm text-muted-foreground">Orders will appear here once they are created.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10 px-4 pb-20">
          {columns.map((col) => col.tasks.length > 0 && (
            <div key={col.id} className="w-full">
              <div className={`rounded-2xl px-5 py-3 mb-5 font-black text-xs uppercase tracking-widest flex justify-between items-center ${col.headerClass}`}>
                <span>{col.title}</span>
                <span className="bg-foreground/10 px-2.5 py-1 rounded-lg">{col.tasks.length}</span>
              </div>

              <div className="space-y-5">
                {col.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-card rounded-[2rem] p-6 border-b-4 border-r-2 border-border/40 shadow-xl overflow-hidden relative"
                  >
                    {/* Header info */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">{task.order_id}</span>
                          <StatusBadge variant={col.variant} />
                        </div>
                        <h3 className="font-black text-xl text-foreground tracking-tight">{task.product || "Unknown Product"}</h3>
                      </div>
                      <button 
                        onClick={() => setEditingId(editingId === task.id ? null : task.id)}
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      >
                        <User size={18} className={task.assigned_worker ? "text-primary" : "text-muted-foreground"} />
                      </button>
                    </div>

                    {/* Progress Visual */}
                    {task.status !== 'pending' && (
                      <div className="mb-6 bg-muted/30 p-4 rounded-2xl">
                        <StageProgress currentStage={task.stage} status={task.status} />
                      </div>
                    )}

                    {/* Info bar */}
                    <div className="flex justify-between items-center text-xs font-bold mb-6">
                      {task.status !== 'completed' && task.status !== 'shipped' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"><User size={14} /></div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-tighter text-muted-foreground">Assigned To</span>
                            <span className="text-foreground">{task.assigned_worker || "Needs Assignment"}</span>
                          </div>
                        </div>
                      ) : <div className="flex-1" />}
                      
                      <div className="flex items-center gap-2 text-right">
                        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center ml-auto"><Calendar size={14} /></div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-tighter text-muted-foreground">Target Date</span>
                          <span className="text-foreground">{task.deadline || "ASAP"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-4">
                      {editingId === task.id || !task.assigned_worker ? (
                        <div className="bg-muted/20 p-5 rounded-[1.5rem] border border-dashed border-border">
                          <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-muted-foreground text-center">
                            {task.status === 'pending' ? `Select a ${STAGE_TO_ROLE[stages[0]]} to Start` : `Re-Assign ${STAGE_TO_ROLE[task.stage] || 'Worker'}`}
                          </p>
                          <div className="flex gap-2 flex-wrap justify-center">
                            {(() => {
                              const role = task.status === 'pending' ? STAGE_TO_ROLE[stages[0]] : STAGE_TO_ROLE[task.stage];
                              const filtered = role ? workers.filter(w => w.role.toLowerCase() === role.toLowerCase()) : workers;
                              
                              if (filtered.length === 0) return <p className="text-[10px] font-bold text-muted-foreground italic">No specialized workers found. Add them in Settings.</p>;
                              
                              return filtered.map(w => (
                                <button
                                  key={w.id}
                                  onClick={() => handleWorkerAssign(task.id, w.name, task.order_id).then(() => setEditingId(null))}
                                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                    task.assigned_worker === w.name ? "bg-primary text-white scale-105 shadow-lg shadow-primary/25" : "bg-card border-2 border-border text-foreground hover:border-primary/50"
                                  }`}
                                >
                                  {w.name}
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      ) : null}

                      {task.assigned_worker && task.status !== 'shipped' && (
                        <button
                          onClick={() => task.status === 'pending' ? handleStartProduction(task) : handleMoveForward(task)}
                          className={`w-full h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-xl ${
                            task.status === 'pending' ? 'bg-amber-500 text-white shadow-amber-500/20' :
                            task.status === 'completed' ? 'bg-indigo-600 text-white shadow-indigo-600/20' :
                            'bg-success text-white shadow-success/20'
                          }`}
                        >
                          <span>
                            {task.status === 'pending' ? `Start ${stages[0]}` : 
                             task.status === 'completed' ? 'Mark as Shipped' : 
                             `Complete ${task.stage} Stage`}
                          </span>
                          <ArrowRight size={20} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Production;
