import { db } from "@/lib/firebase";
import {
  collection,
  setDoc,
  doc,
  getDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  increment,
  updateDoc,
} from "firebase/firestore";

export interface InventoryItem {
  id: string;
  item_name: string;
  stock_quantity: number;
  threshold: number;
  unit?: string;
}

const inventoryRef = collection(db, "Inventory");

export const subscribeInventory = (
  callback: (items: InventoryItem[]) => void
): (() => void) => {
  return onSnapshot(inventoryRef, (snapshot: QuerySnapshot<DocumentData>) => {
    const items: InventoryItem[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<InventoryItem, "id">),
    }));
    callback(items);
  });
};

export const addOrUpdateStock = async (
  item_name: string,
  stock_quantity: number,
  threshold: number,
  unit: string = "kg"
): Promise<void> => {
  const docId = item_name.toLowerCase().replace(/\s+/g, "-");
  await setDoc(doc(db, "Inventory", docId), {
    item_name,
    stock_quantity,
    threshold,
    unit,
  });
};

export const adjustStock = async (
  docId: string,
  amount: number
): Promise<void> => {
  const docRef = doc(db, "Inventory", docId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const current = snap.data().stock_quantity || 0;
    const newQty = Math.max(0, current + amount);
    await updateDoc(docRef, { stock_quantity: newQty });
  }
};
