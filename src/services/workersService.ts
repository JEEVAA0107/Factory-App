import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { isMockMode, getMockData, saveMockData, subscribeMock } from "@/services/mockDb";

export interface Worker {
  id: string;
  name: string;
  role: string;
  assigned_tasks: string[];
  mobile?: string;
}

const workersRef = collection(db, "Workers");

export const subscribeWorkers = (
  callback: (workers: Worker[]) => void
): (() => void) => {
  if (isMockMode()) {
    return subscribeMock("workers", callback);
  }
  return onSnapshot(workersRef, (snapshot: QuerySnapshot<DocumentData>) => {
    const workers: Worker[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Worker, "id">),
    }));
    callback(workers);
  }, (error) => {
    console.error("Workers subscribe error:", error);
    callback([]);
  });
};

export const addWorker = async (data: {
  name: string;
  role: string;
  mobile?: string;
}): Promise<string> => {
  if (isMockMode()) {
    const workers = getMockData("workers");
    const id = `w-${Date.now().toString(36)}`;
    const newWorker = {
      id,
      name: data.name,
      role: data.role,
      assigned_tasks: [],
      mobile: data.mobile || "",
    };
    workers.push(newWorker);
    saveMockData("workers", workers);
    return id;
  }
  const docRef = await addDoc(workersRef, {
    name: data.name,
    role: data.role,
    assigned_tasks: [],
    mobile: data.mobile || "",
  });
  return docRef.id;
};

export const updateWorkerTasks = async (
  docId: string,
  assigned_tasks: string[]
): Promise<void> => {
  if (isMockMode()) {
    const workers = getMockData("workers");
    const worker = workers.find((w: any) => w.id === docId);
    if (worker) {
      worker.assigned_tasks = assigned_tasks;
      saveMockData("workers", workers);
    }
    return;
  }
  await updateDoc(doc(db, "Workers", docId), { assigned_tasks });
};
