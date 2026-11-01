import type { YardData } from "@/types/yard";

// Sample records for the prototype.
// Firebase integration can replace local storage later.
export const yardStorageKey = "cedarshop-yard-demo-v1";

export function initialYardData(): YardData {
  return {
    version: 1,

    inventory: [
      {
        id: "WRC-206",
        name: "Western Red Cedar",
        dimensions: "2 × 6 · 12 ft",
        location: "Outdoor yard",
        bay: "A-01",
        quantity: 148,
        minimum: 30,
      },
      {
        id: "WRC-104",
        name: "Cedar Fence Boards",
        dimensions: "1 × 4 · 6 ft",
        location: "Outdoor yard",
        bay: "A-03",
        quantity: 320,
        minimum: 60,
      },
      {
        id: "WRC-404",
        name: "Cedar Posts",
        dimensions: "4 × 4 · 8 ft",
        location: "Outdoor yard",
        bay: "B-02",
        quantity: 18,
        minimum: 25,
      },
      {
        id: "WRC-TG6",
        name: "Cedar Tongue & Groove",
        dimensions: "1 × 6 · random lengths",
        location: "Warehouse",
        bay: "W-04",
        quantity: 86,
        minimum: 20,
      },
      {
        id: "WRC-208",
        name: "Cedar Decking",
        dimensions: "2 × 8 · 16 ft",
        location: "Warehouse",
        bay: "W-02",
        quantity: 12,
        minimum: 20,
      },
      {
        id: "WRC-606",
        name: "Rough Cedar Timbers",
        dimensions: "6 × 6 · 10 ft",
        location: "Kiln",
        bay: "K-01",
        quantity: 42,
        minimum: 10,
      },
    ],

    orders: [
      {
        id: "WO-1042",
        title: "Fence board cut-down",
        stockId: "WRC-104",
        quantity: 24,
        cutLength: 60,
        dropCut: 12,
        due: "2026-11-02",
        priority: "High",
        status: "In progress",
        notes: "Cut to 60 inches. Stack and label for pickup.",
      },
      {
        id: "WO-1043",
        title: "Decking preparation",
        stockId: "WRC-206",
        quantity: 16,
        cutLength: 120,
        dropCut: 24,
        due: "2026-11-03",
        priority: "Normal",
        status: "Queued",
        notes: "Check finished lengths before staging.",
      },
      {
        id: "WO-1044",
        title: "Cedar post trimming",
        stockId: "WRC-404",
        quantity: 8,
        cutLength: 84,
        dropCut: 12,
        due: "2026-11-04",
        priority: "Normal",
        status: "Queued",
        notes: "Keep reusable offcuts together.",
      },
    ],

    losses: [],

    activity: [
      {
        id: "setup",
        text: "Sample yard inventory and work orders loaded.",
        at: "2026-10-31T15:00:00Z",
      },
    ],
  };
}

// Works when demonstrating the app over a local HTTP network.
export function newYardId(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(8));

  const identifier = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  )
    .join("")
    .toUpperCase();

  return `${prefix}-${identifier}`;
}