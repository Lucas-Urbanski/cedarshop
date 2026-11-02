export type YardLocation = "Outdoor yard" | "Warehouse" | "Kiln";

export interface YardStock {
  id: string;
  name: string;
  dimensions: string;
  location: YardLocation;
  bay: string;
  quantity: number;
  minimum: number;
}

export interface YardWorkOrder {
  id: string;
  title: string;
  stockId: string;
  quantity: number;
  cutLength: number;
  dropCut: number;
  due: string;
  priority: "Normal" | "High";
  status: "Queued" | "In progress" | "Completed";
  notes: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface YardLoss {
  id: string;
  stockId: string;
  quantity: number;
  reason: "Yard damage" | "Transport damage" | "Other";
  notes: string;
  photo: string;
  created: string;
  status: "Pending review" | "Approved" | "Rejected";
  createdBy?: string;
}

export interface YardData {
  version: 1;
  inventory: YardStock[];
  orders: YardWorkOrder[];
  losses: YardLoss[];
  activity: {
    id: string;
    text: string;
    at: string;
  }[];
}