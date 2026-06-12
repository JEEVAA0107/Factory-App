import { useEffect, useState } from "react";
import { subscribeWorkers, Worker } from "@/services/workersService";

export const useWorkers = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeWorkers((data) => {
      setWorkers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { workers, loading };
};
