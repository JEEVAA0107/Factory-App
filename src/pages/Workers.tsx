import AppLayout from "@/components/AppLayout";
import FAB from "@/components/FAB";
import { useOrders } from "@/hooks/useOrders";
import { useProduction } from "@/hooks/useProduction";
import { useWorkers } from "@/hooks/useWorkers";
import { updateWorkerTasks, Worker } from "@/services/workersService";
import { updateProductionWorkerByOrderId, updateProductionStatus, updateProductionStage } from "@/services/productionService";
import { updateOrderStatusByReadableId } from "@/services/ordersService";
import { adjustStock } from "@/services/inventoryService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, X, History, Briefcase, Play } from "lucide-react";

const DEFAULT_STAGES = ["Cutting", "Stitching", "Dyeing", "Finishing", "Packing"];

const STAGE_TO_ROLE: Record<string, string> = {
  "Cutting": "Cutter",
  "Stitching": "Stitcher",
  "Dyeing": "Dyer",
  "Finishing": "Finisher",
  "Packing": "Packer"
};

const Workers = () => {
  const { workers, loading } = useWorkers();
  const { orders } = useOrders();
  const { production } = useProduction();
  const { userProfile } = useAuth();
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const stages = userProfile?.productionStages || DEFAULT_STAGES;

  const handleStartTask = async (orderReadableId: string, prodDocId: string) => {
    const task = production.find(p => p.id === prodDocId);
    if (!task) return;

    try {
      // 1. Automate Inventory Subtraction
      if (task.material_id && task.consumption_per_unit && task.quantity) {
        const totalToSubtract = task.quantity * task.consumption_per_unit;
        await adjustStock(task.material_id, -totalToSubtract);
      }

      // 2. Update Production Status & First Stage
      await updateProductionStatus(prodDocId, "in-progress");
      await updateProductionStage(prodDocId, stages[0]);
      
      // 3. Sync with Order
      await updateOrderStatusByReadableId(orderReadableId, "in-progress");
      
      toast.success(`Production started at ${stages[0]}!`);
    } catch (error) {
      console.error("Start task error:", error);
      toast.error("Failed to start production");
    }
  };

  const handleRemoveTask = async (workerId: string, currentTasks: string[], orderId: string) => {
    const newTasks = currentTasks.filter((t) => t !== orderId);
    try {
      await updateWorkerTasks(workerId, newTasks);
      await updateProductionWorkerByOrderId(orderId, "");
      toast.success("Task removed");
    } catch {
      toast.error("Failed to remove task");
    }
  };

  const handleCompleteStage = async (workerId: string, orderId: string, currentTasks: string[]) => {
    const prodTask = production.find(p => p.order_id === orderId);
    if (!prodTask) return;

    const worker = workers.find(w => w.id === workerId);
    const workerName = worker?.name || "Unknown";
    const currentStage = prodTask.stage;

    const currentIndex = stages.indexOf(currentStage);
    const isLastStage = currentIndex === stages.length - 1;

    try {
      if (isLastStage) {
        // Full completion
        await updateProductionStatus(prodTask.id, "completed", { worker: workerName, stage: currentStage });
        await updateProductionStage(prodTask.id, "Finished");
        await updateOrderStatusByReadableId(orderId, "completed");
        toast.success("Order fully completed!");
      } else {
        // Move to next stage
        const nextStage = stages[currentIndex + 1];
        await updateProductionStage(prodTask.id, nextStage, { worker: workerName, stage: currentStage });
        toast.info(`Stage ${currentStage} done. Next: ${nextStage}`);
      }
      
      // Always remove from current worker's list once they finish their part
      await handleRemoveTask(workerId, currentTasks, orderId);
    } catch (error) {
      console.error("Complete stage error:", error);
      toast.error("Failed to update status");
    }
  };

  const getOrderName = (orderId: string) => {
    const order = orders.find(o => o.order_id === orderId);
    return order ? order.customer_name : "Unknown Customer";
  };

  const getWorkerFinishedTasksToday = (workerName: string) => {
    const todayStr = new Date().toDateString();
    
    // Find all production items where this worker completed a stage today
    const finishedStages = production.flatMap(p => 
      (p.history || [])
        .filter(h => h.worker === workerName && h.completed_at?.toDate?.().toDateString() === todayStr)
        .map(h => ({
          order_id: p.order_id,
          stage: h.stage,
          customer: getOrderName(p.order_id)
        }))
    );

    return finishedStages;
  };

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-1">Workers</h1>
      </div>
      <div className="px-4 space-y-3 pb-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No workers added yet</p>
          </div>
        ) : (
          workers.map((w) => (
            <div
              key={w.id}
              className="bg-card rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {w.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{w.name}</p>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        w.assigned_tasks.length > 0 ? "bg-success" : "bg-muted-foreground/40"
                      }`}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{w.role}</p>
                </div>
                <span className="text-xs text-muted-foreground">{w.assigned_tasks.length} tasks</span>
              </div>

                {/* Current tasks (only non-completed AND matching current worker's role/stage) */}
                <div className="flex flex-col gap-2 mt-3">
                  {w.assigned_tasks.filter(t => {
                    const order = orders.find(ord => ord.order_id === t);
                    const prodTask = production.find(p => p.order_id === t);
                    
                    // Basic check: Order exists and isn't finished
                    const isActive = order && order.status !== "completed" && order.status !== "shipped";
                    if (!isActive) return false;

                    // Role check: If production info exists, only show if current stage matches worker role
                    if (prodTask && prodTask.stage) {
                      // Get the expected role for the current stage
                      const expectedRole = STAGE_TO_ROLE[prodTask.stage];
                      if (expectedRole && expectedRole.toLowerCase() !== w.role.toLowerCase()) {
                        return false; // Wrong person's turn now
                      }
                    }
                    return true;
                  }).map((t) => {
                    const prodTask = production.find(p => p.order_id === t);
                    const isPending = prodTask?.status === "pending";
                    
                    return (
                      <div key={t} className="flex items-center gap-2">
                        <span className="flex-1 px-3 py-2 bg-card border border-border rounded-xl text-xs font-bold flex items-center justify-between group">
                          <div className="flex flex-col">
                            <span className="text-[9px] opacity-60 uppercase leading-none mb-1">{t}</span>
                            <span className="text-foreground">{getOrderName(t)}</span>
                          </div>
                          {!isPending ? (
                            <span className="text-[10px] font-black uppercase text-primary bg-primary/5 px-2 py-1 rounded-lg">
                              Progressing
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTask(w.id, w.assigned_tasks, t);
                              }}
                              className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-destructive/10"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </span>
                        
                        {isPending && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTask(t, prodTask.id);
                            }}
                            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-[0.95] transition-all"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    );
                  })}
                  
                  {(() => {
                    const finished = getWorkerFinishedTasksToday(w.name);
                    if (finished.length === 0) return null;
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHistory(showHistory === w.id ? null : w.id);
                        }}
                        className="w-fit px-3 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-muted/80"
                      >
                        <History size={12} />
                        {finished.length} Completed Today
                      </button>
                    );
                  })()}
                </div>

              {/* History dropdown */}
              {showHistory === w.id && (
                <div className="mt-3 p-3 bg-muted/30 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <History size={10} /> Today's Accomplishments
                  </p>
                  <div className="flex flex-col gap-2">
                    {getWorkerFinishedTasksToday(w.name).map((f, idx) => (
                      <div key={idx} className="px-3 py-2 bg-card border border-border rounded-lg flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-foreground leading-none">{f.customer}</span>
                          <span className="text-[8px] text-muted-foreground font-mono">{f.order_id}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-success/10 text-success rounded text-[9px] font-black uppercase">
                          {f.stage} Done
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <FAB to="/workers/add" />
    </AppLayout>
  );
};

export default Workers;
