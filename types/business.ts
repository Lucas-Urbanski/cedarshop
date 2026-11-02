import type { DriverDelivery } from "@/data/Delivery";
import type { Order } from "@/types/types";
import type { YardLoss, YardStock, YardWorkOrder } from "@/types/yard";

export interface ProductRecord {
  id: string;
  name: string;
  price: number;
}

export interface InventoryRecord extends YardStock {}

export interface ProductCostRecord {
  cost: number;
}

export interface CustomerOrderRecord extends Order {
  customerUid: string;
  productType: string;
  dimensions: string;
  deliveryDate: string;
  deliveryAddress: string;
  notes: string;
  createdAt: string;
}

export interface DeliveryRecord extends DriverDelivery {
  customerUid: string;
  driverUid: string | null;
  deliveryDate: string;
  driverName: string;
  itemsSummary: string;
  trackingNote: string;
  isDemo?: boolean;
}

export interface YardWorkOrderRecord extends YardWorkOrder {
  createdBy: string;
  updatedAt: string;
}

export interface YardLossRecord extends YardLoss {
  createdBy: string;
}

export interface SalesQuoteRecord {
  id: string;
  customerName: string;
  createdBy: string;
  createdAt: string;
  items: {
    sku: string;
    name: string;
    unitPrice: number;
    quantity: number;
  }[];
  subtotal: number;
  discountPercent: number;
  total: number;
}

export interface YardActivityRecord {
  id: string;
  text: string;
  at: string;
  createdBy: string;
}
