import { useEffect, useState } from "react";
import { subscribeOrders, getOrdersPaginated, Order } from "@/services/ordersService";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Initial sync - using subscribe for real-time updates for the first batch
    const unsubscribe = subscribeOrders((data) => {
      // We only update the state if we haven't loaded more pages yet, 
      // otherwise real-time sync with pagination gets very complex
      if (!lastDoc) {
        setOrders(data);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [lastDoc]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      // If lastDoc is not set yet, we need to get the last doc from the current orders
      // but since we are using onSnapshot for initial, it's simpler to just fetch next
      const result = await getOrdersPaginated(lastDoc || undefined);
      if (result.orders.length < 20) {
        setHasMore(false);
      }
      if (result.orders.length > 0) {
        // Filter out duplicates that might have been caught by real-time sync
        const newOrders = result.orders.filter(
          (no) => !orders.some((o) => o.id === no.id)
        );
        setOrders((prev) => [...prev, ...newOrders]);
        setLastDoc(result.lastDoc);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more orders:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return { orders, loading, loadingMore, hasMore, loadMore };
};
