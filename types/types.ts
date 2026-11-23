import type { ReactNode } from "react";

export type Identified<T> = T & { id: string };

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

export type WorkspaceIcon =
  | "account"
  | "alert"
  | "dashboard"
  | "mapPin"
  | "inventory"
  | "newOrder"
  | "orders"
  | "settings"
  | "store"
  | "mobile"
  | "truck";

export interface WorkspaceNavigationItem {
  label: string;
  href: string;
  icon: WorkspaceIcon;
}

export interface WorkspaceShellProps extends ChildrenProps {
  workspaceName: string;
  navigation: readonly WorkspaceNavigationItem[];
  className?: string;
  contentClassName?: string;
}

export interface FirestoreCollectionState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

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

export type DriverStatusFilter = "All stops" | DriverStopStatus;

export interface DeliveryStopCardProps {
  delivery: DriverDelivery;
  onAdvanceStatus: (deliveryId: string) => void;
  disabled?: boolean;
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
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number | null;
  quantity: number;
}

export type AdminLossReportStatus = "Pending" | "Approved" | "Rejected";

export interface AdminLossReport {
  id: string;
  sku: string;
  product: string;
  quantity: number;
  reason: string;
  status: AdminLossReportStatus;
}

export interface SalesProduct {
  id: string;
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
  update: (
    change: (current: YardData) => YardData,
    message: string,
  ) => Promise<boolean>;
}

export interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptOutcome>;
}

export interface InstallPromptOutcome {
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

export interface ProductRecord {
  id: string;
  name: string;
  price: number;
}

export type InventoryRecord = YardStock;

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

export interface SalesQuoteItemRecord {
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  /** Line total after the quote discount. */
  lineTotal?: number;
  /** GST charged on this line. */
  tax?: number;
}

export interface SalesQuoteRecord {
  id: string;
  customerName: string;
  createdBy: string;
  createdAt: string;
  items: SalesQuoteItemRecord[];
  subtotal: number;
  discountPercent: number;
  discountAmount?: number;
  /** Subtotal after discount; the amount GST is charged on. */
  taxableSubtotal?: number;
  taxRate?: number;
  tax?: number;
  total: number;
}

export interface YardActivityRecord {
  id: string;
  text: string;
  at: string;
  createdBy: string;
}