// Mock database for local demo mode using localStorage

const getStorageItem = (key: string, defaultValue: any) => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return defaultValue;
  }
};

const setStorageItem = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initial default data
const DEFAULT_WORKERS = [
  { id: "w1", name: "Rohan Das", role: "Cutter", assigned_tasks: ["ORD-101"] },
  { id: "w2", name: "Amit Patel", role: "Stitcher", assigned_tasks: [] },
  { id: "w3", name: "Priya Sharma", role: "Dyer", assigned_tasks: [] }
];

const DEFAULT_INVENTORY = [
  { id: "fabric-cotton", item_name: "Cotton Fabric", stock_quantity: 150, threshold: 50, unit: "meters" },
  { id: "buttons", item_name: "Buttons", stock_quantity: 500, threshold: 100, unit: "pcs" },
  { id: "thread-blue", item_name: "Blue Thread", stock_quantity: 25, "threshold": 10, unit: "spools" }
];

const DEFAULT_ORDERS = [
  {
    id: "o1",
    order_id: "ORD-101",
    customer_name: "StyleCorp",
    product: "Cotton Shirts",
    quantity: 100,
    status: "in-progress",
    deadline: "2026-06-20",
    notes: "Premium quality stitch",
    created_at: { seconds: Math.floor(Date.now() / 1000) - 86400, nanoseconds: 0 },
    material_id: "fabric-cotton",
    consumption_per_unit: 1.5
  },
  {
    id: "o2",
    order_id: "ORD-102",
    customer_name: "TrendWear Ltd",
    product: "Summer Dresses",
    quantity: 50,
    status: "pending",
    deadline: "2026-06-25",
    notes: "",
    created_at: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    material_id: "fabric-cotton",
    consumption_per_unit: 2.0
  }
];

const DEFAULT_PRODUCTION = [
  {
    id: "p1",
    order_id: "ORD-101",
    order_doc_id: "o1",
    stage: "Cutting",
    assigned_worker: "Rohan Das",
    status: "in-progress",
    deadline: "2026-06-20",
    product: "Cotton Shirts",
    material_id: "fabric-cotton",
    consumption_per_unit: 1.5,
    quantity: 100,
    history: []
  }
];

const DEFAULT_PROFILES = {
  "demo-uid": {
    id: "demo-uid",
    name: "Demo Manager",
    role: "owner",
    productionStages: ["Cutting", "Stitching", "Dyeing", "Finishing", "Packing"],
    workerRoles: ["Cutter", "Stitcher", "Dyer", "Finisher", "Packer"]
  }
};

type Listener = (data: any) => void;
const listeners: Record<string, Set<Listener>> = {
  workers: new Set(),
  inventory: new Set(),
  orders: new Set(),
  production: new Set()
};

export const getMockData = (key: string): any[] => {
  if (key === "workers") return getStorageItem("mock_workers", DEFAULT_WORKERS);
  if (key === "inventory") return getStorageItem("mock_inventory", DEFAULT_INVENTORY);
  if (key === "orders") return getStorageItem("mock_orders", DEFAULT_ORDERS);
  if (key === "production") return getStorageItem("mock_production", DEFAULT_PRODUCTION);
  return [];
};

export const saveMockData = (key: string, data: any[]) => {
  if (key === "workers") setStorageItem("mock_workers", data);
  if (key === "inventory") setStorageItem("mock_inventory", data);
  if (key === "orders") setStorageItem("mock_orders", data);
  if (key === "production") setStorageItem("mock_production", data);
  
  // Notify listeners
  if (listeners[key]) {
    const freshData = getMockData(key);
    listeners[key].forEach(cb => cb(freshData));
  }
};

export const subscribeMock = (key: string, callback: Listener): (() => void) => {
  if (!listeners[key]) listeners[key] = new Set();
  listeners[key].add(callback);
  
  // Trigger initial callback
  callback(getMockData(key));
  
  return () => {
    listeners[key].delete(callback);
  };
};

export const isMockMode = (): boolean => {
  return localStorage.getItem("use_mock_data") === "true";
};

export const getMockUserProfile = (uid: string) => {
  const profiles = getStorageItem("mock_profiles", DEFAULT_PROFILES);
  return profiles[uid] || { id: uid, name: "Demo User", role: "owner" };
};

export const saveMockUserProfile = (uid: string, profile: any) => {
  const profiles = getStorageItem("mock_profiles", DEFAULT_PROFILES);
  profiles[uid] = { ...profile, id: uid };
  setStorageItem("mock_profiles", profiles);
};
