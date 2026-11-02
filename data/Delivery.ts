export type DriverStopStatus = "Ready" | "In Progress" | "Delivered";

export interface DriverDeliveryItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface DriverDelivery {
  id: string;
  orderId: string;
  customer: string;
  phone: string;
  address: string;
  city: string;
  scheduledTime: string;
  status: DriverStopStatus;
  items: DriverDeliveryItem[];
  instructions?: string;
}

export const initialDriverDeliveries: DriverDelivery[] = [
  {
    id: "01",
    orderId: "CS-2481",
    customer: "Mason Construction",
    phone: "+14035550101",
    address: "1820 9 Avenue SE",
    city: "Calgary, AB T2G 0T3",
    scheduledTime: "8:30 – 9:30 AM",
    status: "In Progress",
    items: [
      { name: "2×4×8 SPF dimensional lumber", quantity: 48, unit: "pieces" },
      { name: "3/4 in. plywood sheets", quantity: 12, unit: "sheets" },
    ],
    instructions: "Use the east entrance. Call on arrival; the site gate is locked.",
  },
  {
    id: "02",
    orderId: "CS-2484",
    customer: "Riverbend Renovations",
    phone: "+14035550102",
    address: "4108 17 Street SW",
    city: "Calgary, AB T2T 4M9",
    scheduledTime: "10:00 – 11:00 AM",
    status: "Ready",
    items: [
      { name: "1×6×10 cedar deck boards", quantity: 36, unit: "pieces" },
      { name: "Cedar railing posts", quantity: 8, unit: "pieces" },
    ],
  },
  {
    id: "03",
    orderId: "CS-2488",
    customer: "North Hill Home Builders",
    phone: "+14035550103",
    address: "7320 Centre Street NW",
    city: "Calgary, AB T2K 0V3",
    scheduledTime: "11:30 AM – 12:30 PM",
    status: "Ready",
    items: [
      { name: "2×6×12 pressure-treated lumber", quantity: 24, unit: "pieces" },
      { name: "Concrete form stakes", quantity: 20, unit: "pieces" },
    ],
    instructions: "Leave materials beside the garage, not in the driveway.",
  },
  {
    id: "04",
    orderId: "CS-2490",
    customer: "Willow Creek Landscaping",
    phone: "+14035550104",
    address: "95 Heritage Gate",
    city: "Calgary, AB T2H 3A7",
    scheduledTime: "1:30 – 2:30 PM",
    status: "Ready",
    items: [
      { name: "4×4×8 pressure-treated posts", quantity: 18, unit: "pieces" },
      { name: "Fence pickets", quantity: 120, unit: "pieces" },
    ],
  },
];
