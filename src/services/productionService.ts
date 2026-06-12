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
  const docRef = await addDoc(productionRef, data);
  return docRef.id;
};

export const updateProductionStatus = async (
  docId: string,
  status: "pending" | "in-progress" | "completed" | "shipped",
  completedBy?: { worker: string, stage: string }
): Promise<void> => {
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
  // We try to find by order_doc_id, OR the human readable order_id, 
  // OR the case where the order_id field accidentally contains the Firebase Doc ID
  const q1 = query(productionRef, where("order_doc_id", "==", orderDocId));
  const q2 = query(productionRef, where("order_id", "==", orderReadableId));
  const q3 = query(productionRef, where("order_id", "==", orderDocId));
  
  const [snap1, snap2, snap3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
  
  const batch = writeBatch(db);
  const seenIds = new Set<string>();

  [...snap1.docs, ...snap2.docs, ...snap3.docs].forEach((d) => {
    if (!seenIds.has(d.id)) {
      // Patch the data to be correct for future syncs
      batch.update(d.ref, { 
        status, 
        order_doc_id: orderDocId,
        order_id: orderReadableId // Ensure human readable ID is set correctly
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
  await updateDoc(doc(db, "Production", docId), { assigned_worker });
};

export const updateProductionWorkerByOrderId = async (
  orderReadableId: string,
  assigned_worker: string
): Promise<void> => {
  const q = query(productionRef, where("order_id", "==", orderReadableId));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, { assigned_worker });
  });
  await batch.commit();
};
