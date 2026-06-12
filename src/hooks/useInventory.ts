import { useEffect, useState } from "react";
import { subscribeInventory, InventoryItem } from "@/services/inventoryService";

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeInventory((data) => {
      setInventory(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { inventory, loading };
};
