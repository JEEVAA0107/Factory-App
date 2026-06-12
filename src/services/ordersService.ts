import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  where,
  getDocs,
  writeBatch,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { isMockMode, getMockData, saveMockData, subscribeMock } from "@/services/mockDb";

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  product: string;
  quantity: number;
  status: "pending" | "in-progress" | "completed" | "shipped";
  deadline: string;
  notes?: string;
  created_at: Timestamp;
  completed_at?: Timestamp;
  shipped_at?: Timestamp;
  material_id?: string; // ID of the inventoried fabric/item
  consumption_per_unit?: number; // How much per unit (e.g., 1.5m)
}

const ordersRef = collection(db, "Orders");

export const subscribeOrders = (
  callback: (orders: Order[]) => void
): (() => void) => {
  if (isMockMode()) {
    return subscribeMock("orders", callback);
  }
  const q = query(ordersRef, orderBy("created_at", "desc"), limit(50)); // Limit initial sync for performance
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const orders: Order[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Order, "id">),
    }));
    callback(orders);
  }, (error) => {
    console.error("Orders subscribe error:", error);
    callback([]);
  });
};

export const getOrdersPaginated = async (
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  pageSize: number = 20
) => {
  if (isMockMode()) {
    const orders = getMockData("orders");
    // Simple mock pagination
    return {
      orders: orders.slice(0, pageSize),
      lastDoc: null
    };
  }
  let q = query(ordersRef, orderBy("created_at", "desc"), limit(pageSize));
  if (lastDoc) {
    q = query(ordersRef, orderBy("created_at", "desc"), startAfter(lastDoc), limit(pageSize));
  }
  const snapshot = await getDocs(q);
  const orders: Order[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Order, "id">),
  }));
  return {
    orders,
    lastDoc: snapshot.docs[snapshot.docs.length - 1]
  };
};

export const addOrder = async (data: {
  customer_name: string;
  product: string;
  quantity: number;
  deadline: string;
  notes?: string;
  material_id?: string;
  consumption_per_unit?: number;
}): Promise<{ id: string; order_id: string }> => {
  const order_id = `ORD-${Date.now().toString(36).toUpperCase()}`;
  if (isMockMode()) {
    const orders = getMockData("orders");
    const id = `o-${Date.now().toString(36)}`;
    const newOrder: any = {
      id,
      order_id,
      customer_name: data.customer_name,
      product: data.product,
      quantity: data.quantity,
      status: "pending",
      deadline: data.deadline,
      notes: data.notes || "",
      material_id: data.material_id || null,
      consumption_per_unit: data.consumption_per_unit || null,
      created_at: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    };
    orders.unshift(newOrder); // Add to beginning
    saveMockData("orders", orders);
    return { id, order_id };
  }
  const docRef = await addDoc(ordersRef, {
    order_id,
    customer_name: data.customer_name,
    product: data.product,
    quantity: data.quantity,
    status: "pending",
    deadline: data.deadline,
    notes: data.notes || "",
    material_id: data.material_id || null,
    consumption_per_unit: data.consumption_per_unit || null,
    created_at: Timestamp.now(),
  });
  return { id: docRef.id, order_id };
};

export const updateOrderStatus = async (
  docId: string,
  status: "pending" | "in-progress" | "completed" | "shipped"
): Promise<void> => {
  if (isMockMode()) {
    const orders = getMockData("orders");
    const order = orders.find((o: any) => o.id === docId);
    if (order) {
      order.status = status;
      const now = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      if (status === "completed") order.completed_at = now;
      if (status === "shipped") order.shipped_at = now;
      saveMockData("orders", orders);
    }
    return;
  }
  const updates: any = { status };
  if (status === "completed") updates.completed_at = Timestamp.now();
  if (status === "shipped") updates.shipped_at = Timestamp.now();
  await updateDoc(doc(db, "Orders", docId), updates);
};

export const updateOrderStatusByReadableId = async (
  order_id: string,
  status: "pending" | "in-progress" | "completed" | "shipped"
): Promise<void> => {
  if (isMockMode()) {
    const orders = getMockData("orders");
    const order = orders.find((o: any) => o.order_id === order_id);
    if (order) {
      order.status = status;
      const now = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      if (status === "completed") order.completed_at = now;
      if (status === "shipped") order.shipped_at = now;
      saveMockData("orders", orders);
    }
    return;
  }
  const q = query(ordersRef, where("order_id", "==", order_id));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  const now = Timestamp.now();
  snapshot.docs.forEach((d) => {
    const updates: any = { status };
    if (status === "completed") updates.completed_at = now;
    if (status === "shipped") updates.shipped_at = now;
    batch.update(d.ref, updates);
  });
  await batch.commit();
};
