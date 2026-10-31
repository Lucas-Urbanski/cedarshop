import type { ReactNode } from "react";

export type UserRole =
  | "Customer"
  | "Driver"
  | "FloorStaff"
  | "SalesStaff"
  | "Administrator";

export interface UserProfile {
  name: string;
  role: UserRole;
  email: string;
}

export interface NavbarProps {
  user: UserProfile | null;
  children?: ReactNode;
}

export interface ProductCardData {
  name: string;
  sku: string;
  price: string;
  lowStock?: boolean;
}

export interface ProductCardProps {
  product: ProductCardData;
}

export interface AuthPageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export interface CustomerProfile {
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export type OrderStatus = "Pending" | "In Progress" | "Delivered" | "Cancelled";

export interface Order {
  id: string;
  date: string;
  items: string;
  quantity: number;
  unit: string;
  total: number;
  status: OrderStatus;
}

export type DeliveryStatus =
  | "Scheduled"
  | "In Transit"
  | "Delivered"
  | "Delayed";

export interface Delivery {
  id: string;
  orderId: string;
  date: string;
  address: string;
  items: string;
  status: DeliveryStatus;
  driver: string;
  trackingNote: string;
}

export interface SignInFormValues {
  email: string;
  password: string;
}

export interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
}

export type Theme = "light" | "dark";

export type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};