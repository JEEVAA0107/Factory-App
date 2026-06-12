import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  QuerySnapshot,
  DocumentData,
  where,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { isMockMode, getMockData, saveMockData, subscribeMock } from "@/services/mockDb";

export interface Production {
  id: string;
  order_id: string;
  order_doc_id?: string;
  stage: string;
  assigned_worker: string;
  status: "pending" | "in-progress" | "completed" | "shipped";
  deadline?: string;
  product?: string;
  material_id?: string;
  consumption_per_unit?: number;
  quantity?: number;
  shipped_at?: any; 
  history?: Array<{
    stage: string;
    worker: string;
    completed_at: any;
  }>;
}

const productionRef = collection(db, "Production");

export const subscribeProduction = (
  callback: (items: Production[]) => void
): (() => void) => {
  if (isMockMode()) {
    return subscribeMock("production", callback);
  }
  const q = query(
    productionRef, 
    where("status", "in", ["pending", "in-progress", "completed", "shipped"])
  );
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const items: Production[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Production, "id">),
    }));
    callback(items);
  }, (error) => {
    console.error("Production sync error:", error);
    callback([]);
  });
};

export const addProductionStage = async (data: {
  order_id: string;
  order_doc_id: string;
  stage: string;
  assigned_worker: string;
  status: "pending" | "in-progress" | "completed";
  deadline?: string;
  product?: string;
  material_id?: string | null;
  consumption_per_unit?: number | null;
  quantity?: number | null;
}): Promise<string> => {
  if (isMockMode()) {
    const items = getMockData("production");
    const id = `p-${Date.now().toString(36)}`;
    const newItem = { id, ...data, history: [] };
    items.push(newItem);
    saveMockData("production", items);
    return id;
  }
  const docRef = await addDoc(productionRef, data);
  return docRef.id;
};

export const updateProductionStatus = async (
  docId: string,
  status: "pending" | "in-progress" | "completed" | "shipped",
  completedBy?: { worker: string, stage: string }
): Promise<void> => {
  if (isMockMode()) {
    const items = getMockData("production");
    const item = items.find((i: any) => i.id === docId);
    if (item) {
      item.status = status;
      if (status === "shipped") {
        item.shipped_at = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      }
      if (completedBy) {
        if (!item.history) item.history = [];
        item.history.push({
          stage: completedBy.stage,
          worker: completedBy.worker,
          completed_at: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
        });
      }
      saveMockData("production", items);
    }
    return;
  }
  const { Timestamp, arrayUnion } = await import("firebase/firestore");
  const updates: any = { status };
  
  if (status === "shipped") {
    updates.shipped_at = Timestamp.now();
  }

  if (completedBy) {
    updates.history = arrayUnion({
      stage: completedBy.stage,
      worker: completedBy.worker,
      completed_at: Timestamp.now()
    });
  }

  await updateDoc(doc(db, "Production", docId), updates);
};

export const updateProductionStage = async (
  docId: string,
  newStage: string,
  completedBy?: { worker: string, stage: string }
): Promise<void> => {
  if (isMockMode()) {
    const items = getMockData("production");
    const item = items.find((i: any) => i.id === docId);
    if (item) {
      item.stage = newStage;
      if (completedBy) {
        if (!item.history) item.history = [];
        item.history.push({
          stage: completedBy.stage,
          worker: completedBy.worker,
          completed_at: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
        });
      }
      saveMockData("production", items);
    }
    return;
  }
  const { Timestamp, arrayUnion } = await import("firebase/firestore");
  const updates: any = { stage: newStage };

  if (completedBy) {
    updates.history = arrayUnion({
      stage: completedBy.stage,
      worker: completedBy.worker,
      completed_at: Timestamp.now()
    });
  }

  await updateDoc(doc(db, "Production", docId), updates);
};

export const updateProductionStatusByOrderId = async (
  orderDocId: string,
  orderReadableId: string,
  status: "pending" | "in-progress" | "completed" | "shipped"
): Promise<void> => {
  if (isMockMode()) {
    const items = getMockData("production");
    items.forEach((item: any) => {
      if (item.order_doc_id === orderDocId || item.order_id === orderReadableId || item.order_id === orderDocId) {
        item.status = status;
        item.order_doc_id = orderDocId;
        item.order_id = orderReadableId;
      }
    });
    saveMockData("production", items);
    return;
  }
  const q1 = query(productionRef, where("order_doc_id", "==", orderDocId));
  const q2 = query(productionRef, where("order_id", "==", orderReadableId));
  const q3 = query(productionRef, where("order_id", "==", orderDocId));
  
  const [snap1, snap2, snap3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
  
  const batch = writeBatch(db);
  const seenIds = new Set<string>();

  [...snap1.docs, ...snap2.docs, ...snap3.docs].forEach((d) => {
    if (!seenIds.has(d.id)) {
      batch.update(d.ref, { 
        status, 
        order_doc_id: orderDocId,
        order_id: orderReadableId
      });
      seenIds.add(d.id);
    }
  });
  
  await batch.commit();
};

export const updateProductionWorker = async (
  docId: string,
  assigned_worker: string
): Promise<void> => {
  if (isMockMode()) {
    const items = getMockData("production");
    const item = items.find((i: any) => i.id === docId);
    if (item) {
      item.assigned_worker = assigned_worker;
      saveMockData("production", items);
    }
    return;
  }
  await updateDoc(doc(db, "Production", docId), { assigned_worker });
};

export const updateProductionWorkerByOrderId = async (
  orderReadableId: string,
  assigned_worker: string
): Promise<void> => {
  if (isMockMode()) {
    const items = getMockData("production");
    items.forEach((item: any) => {
      if (item.order_id === orderReadableId) {
        item.assigned_worker = assigned_worker;
      }
    });
    saveMockData("production", items);
    return;
  }
  const q = query(productionRef, where("order_id", "==", orderReadableId));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, { assigned_worker });
  });
  await batch.commit();
};
