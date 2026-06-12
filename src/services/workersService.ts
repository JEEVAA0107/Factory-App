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
  return onSnapshot(workersRef, (snapshot: QuerySnapshot<DocumentData>) => {
    const workers: Worker[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Worker, "id">),
    }));
    callback(workers);
  });
};

export const addWorker = async (data: {
  name: string;
  role: string;
  mobile?: string;
}): Promise<string> => {
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
  await updateDoc(doc(db, "Workers", docId), { assigned_tasks });
};
