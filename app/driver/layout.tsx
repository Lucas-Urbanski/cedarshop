import type { ReactNode } from "react";
import DriverShell from "@/components/driver/DriverShell";
import "@/styles/driver.css";

export default function DriverLayout({ children }: { children: ReactNode }) {
  return <DriverShell>{children}</DriverShell>;
}
