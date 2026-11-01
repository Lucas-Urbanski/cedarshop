import type { ReactNode } from "react";
import type { YardData } from "@/types/yard";

export type UserRole =
  | "Customer"
  | "Driver"
  | "FloorStaff"
  | "SalesStaff"
  | "Administrator";

export interface ChildrenProps {
  readonly children: ReactNode;
}

export interface UserProfile {
  name: string;
  role: UserRole;
  email: string;
}

export interface NavbarProps {
  user: UserProfile | null;
  children?: ReactNode;
}

export interface WorkflowNavigationItem {
  label: string;
  href: string;
  role: UserRole;
  icon: ReactNode;
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

export interface LogoutButtonProps {
  className?: string;
  children?: ReactNode;
}

export interface RouteGuardProps extends ChildrenProps {
  allowedRoles?: readonly UserRole[];
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

export interface AdminProduct {
  id: number;
  sku: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
}

export type AdminLossReportStatus = "Pending" | "Approved" | "Rejected";

export interface AdminLossReport {
  id: number;
  sku: string;
  product: string;
  quantity: number;
  reason: string;
  status: AdminLossReportStatus;
}

export interface SalesProduct {
  id: number;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SalesQuoteItem {
  product: SalesProduct;
  quantity: number;
}

export interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
}

export interface YardHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export type YardBadgeTone = "green" | "amber" | "muted";

export interface YardBadgeProps extends ChildrenProps {
  tone?: YardBadgeTone;
}

export interface YardDialogProps extends ChildrenProps {
  title: string;
  onClose: () => void;
}

export interface YardContextValue {
  data: YardData;
  ready: boolean;
  notice: string;
  update: (change: (current: YardData) => YardData, message: string) => boolean;
}

export interface YardInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<YardInstallPromptOutcome>;
}

export interface YardInstallPromptOutcome {
  outcome: "accepted" | "dismissed";
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