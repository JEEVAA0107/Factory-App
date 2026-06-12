import { useEffect, useState } from "react";
import { subscribeProduction, Production } from "@/services/productionService";

export const useProduction = () => {
  const [production, setProduction] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeProduction((data) => {
      setProduction(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { production, loading };
};
