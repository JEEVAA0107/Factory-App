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
import { isMockMode, getMockData, saveMockData, subscribeMock } from "@/services/mockDb";

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
  if (isMockMode()) {
    return subscribeMock("inventory", callback);
  }
  return onSnapshot(inventoryRef, (snapshot: QuerySnapshot<DocumentData>) => {
    const items: InventoryItem[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<InventoryItem, "id">),
    }));
    callback(items);
  }, (error) => {
    console.error("Inventory subscribe error:", error);
    // Call callback with empty array or fallback to prevent infinite loading screen
    callback([]);
  });
};

export const addOrUpdateStock = async (
  item_name: string,
  stock_quantity: number,
  threshold: number,
  unit: string = "kg"
): Promise<void> => {
  const docId = item_name.toLowerCase().replace(/\s+/g, "-");
  if (isMockMode()) {
    const items = getMockData("inventory");
    const existingIdx = items.findIndex((i: any) => i.id === docId);
    const newItem = { id: docId, item_name, stock_quantity, threshold, unit };
    if (existingIdx > -1) {
      items[existingIdx] = newItem;
    } else {
      items.push(newItem);
    }
    saveMockData("inventory", items);
    return;
  }
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
  if (isMockMode()) {
    const items = getMockData("inventory");
    const item = items.find((i: any) => i.id === docId);
    if (item) {
      const current = item.stock_quantity || 0;
      item.stock_quantity = Math.max(0, current + amount);
      saveMockData("inventory", items);
    }
    return;
  }
  const docRef = doc(db, "Inventory", docId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const current = snap.data().stock_quantity || 0;
    const newQty = Math.max(0, current + amount);
    await updateDoc(docRef, { stock_quantity: newQty });
  }
};
