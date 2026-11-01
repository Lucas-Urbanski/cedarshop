import type { UserRole } from "@/types/types";

const userRoles: Record<string, UserRole> = {
  customer: "Customer",
  driver: "Driver",
  floorstaff: "FloorStaff",
  salesstaff: "SalesStaff",
  administrator: "Administrator",
};

export function getUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;

  return userRoles[value.toLowerCase().replace(/\s+/g, "")] ?? null;
}
