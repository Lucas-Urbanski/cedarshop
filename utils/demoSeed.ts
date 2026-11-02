import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
} from "firebase/firestore";

import { initialDriverDeliveries } from "@/data/Delivery";
import { db } from "@/utils/firebase";
import type {
  DeliveryRecord,
  InventoryRecord,
  ProductRecord,
  YardLossRecord,
  YardWorkOrderRecord,
} from "@/types/business";

const demoProducts: ProductRecord[] = [
  {
    id: "CED-001",
    name: "2x4 Western Red Cedar - 8ft",
    price: 12.4,
  },
  {
    id: "CED-002",
    name: "2x6 Western Red Cedar - 10ft",
    price: 19.99,
  },
  {
    id: "CED-003",
    name: "4x4 Cedar Post - 8ft",
    price: 32.5,
  },
  {
    id: "CED-004",
    name: "1x6 Cedar Fence Board - 6ft",
    price: 8.75,
  },
];

const demoInventory: InventoryRecord[] = [
  {
    id: "CED-001",
    name: "2x4 Western Red Cedar - 8ft",
    dimensions: "2 × 4 · 8 ft",
    location: "Outdoor yard",
    bay: "A-01",
    quantity: 762,
    minimum: 50,
  },
  {
    id: "CED-002",
    name: "2x6 Western Red Cedar - 10ft",
    dimensions: "2 × 6 · 10 ft",
    location: "Warehouse",
    bay: "W-04",
    quantity: 340,
    minimum: 30,
  },
  {
    id: "CED-003",
    name: "4x4 Cedar Post - 8ft",
    dimensions: "4 × 4 · 8 ft",
    location: "Outdoor yard",
    bay: "B-02",
    quantity: 125,
    minimum: 25,
  },
  {
    id: "CED-004",
    name: "1x6 Cedar Fence Board - 6ft",
    dimensions: "1 × 6 · 6 ft",
    location: "Outdoor yard",
    bay: "A-03",
    quantity: 18,
    minimum: 50,
  },
];

const demoCosts = [
  { id: "CED-001", cost: 7.5 },
  { id: "CED-002", cost: 12.25 },
  { id: "CED-003", cost: 21 },
  { id: "CED-004", cost: 4.8 },
];

const demoWorkOrders: Omit<YardWorkOrderRecord, "createdBy" | "updatedAt">[] = [
  {
    id: "WO-DEMO-1042",
    title: "Fence board cut-down",
    stockId: "CED-004",
    quantity: 24,
    cutLength: 60,
    dropCut: 12,
    due: "2026-11-02",
    priority: "High",
    status: "In progress",
    notes: "Cut to 60 inches. Stack and label for pickup.",
  },
  {
    id: "WO-DEMO-1043",
    title: "Decking preparation",
    stockId: "CED-001",
    quantity: 16,
    cutLength: 120,
    dropCut: 24,
    due: "2026-11-03",
    priority: "Normal",
    status: "Queued",
    notes: "Check finished lengths before staging.",
  },
  {
    id: "WO-DEMO-1044",
    title: "Cedar post trimming",
    stockId: "CED-003",
    quantity: 8,
    cutLength: 84,
    dropCut: 12,
    due: "2026-11-04",
    priority: "Normal",
    status: "Queued",
    notes: "Keep reusable offcuts together.",
  },
];

const demoLossReports: Omit<YardLossRecord, "createdBy">[] = [
  {
    id: "LOSS-DEMO-101",
    stockId: "CED-001",
    quantity: 8,
    reason: "Yard damage",
    notes: "Damaged during handling.",
    photo: "",
    created: "2026-10-31T15:00:00.000Z",
    status: "Pending review",
  },
  {
    id: "LOSS-DEMO-102",
    stockId: "CED-003",
    quantity: 3,
    reason: "Other",
    notes: "Cracked lumber.",
    photo: "",
    created: "2026-10-31T15:10:00.000Z",
    status: "Pending review",
  },
  {
    id: "LOSS-DEMO-103",
    stockId: "CED-002",
    quantity: 5,
    reason: "Transport damage",
    notes: "Moisture damage.",
    photo: "",
    created: "2026-10-31T15:20:00.000Z",
    status: "Pending review",
  },
];

export async function seedDemoData(userId: string): Promise<void> {
  const marker = doc(db, "system", "demoFixturesV1");
  const collections = [
    "products",
    "inventory",
    "productCosts",
    "yardWorkOrders",
    "yardLossReports",
    "deliveries",
  ];
  const snapshots = await Promise.all(
    collections.map((name) =>
      getDocs(query(collection(db, name), limit(1))),
    ),
  );
  if (snapshots.some((snapshot) => !snapshot.empty)) {
    throw new Error("Demo records can only be loaded into an empty workspace.");
  }

  await runTransaction(db, async (transaction) => {
    const markerSnapshot = await transaction.get(marker);

    if (markerSnapshot.exists()) {
      throw new Error("Demo records have already been loaded.");
    }

    transaction.set(marker, {
      version: 1,
      loadedBy: userId,
      loadedAt: new Date().toISOString(),
    });

    demoProducts.forEach((product) => {
      const { id, ...fields } = product;
      transaction.set(doc(db, "products", id), { ...fields, isDemo: true });
    });

    demoInventory.forEach((item) => {
      const { id, ...fields } = item;
      transaction.set(doc(db, "inventory", id), {
        ...fields,
        isDemo: true,
      });
    });

    demoCosts.forEach(({ id, ...fields }) => {
      transaction.set(doc(db, "productCosts", id), {
        ...fields,
        isDemo: true,
      });
    });

    demoWorkOrders.forEach(({ id, ...fields }) => {
      transaction.set(doc(db, "yardWorkOrders", id), {
        ...fields,
        createdBy: userId,
        updatedAt: new Date().toISOString(),
        isDemo: true,
      });
    });

    demoLossReports.forEach(({ id, ...fields }) => {
      transaction.set(doc(db, "yardLossReports", id), {
        ...fields,
        createdBy: userId,
        isDemo: true,
      });
    });

    const now = new Date();
    const deliveryDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60_000,
    )
      .toISOString()
      .slice(0, 10);
    initialDriverDeliveries.forEach((delivery) => {
      const id = `DEMO-${delivery.id}`;
      const demoDelivery: DeliveryRecord = {
        ...delivery,
        id,
        customerUid: "",
        driverUid: null,
        deliveryDate,
        driverName: "Demonstration driver",
        itemsSummary: delivery.items
          .map((item) => `${item.quantity} ${item.unit} ${item.name}`)
          .join(", "),
        trackingNote: "Demonstration route record.",
        isDemo: true,
      };
      transaction.set(doc(db, "deliveries", id), demoDelivery);
    });
  });
}
