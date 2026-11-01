import type { ReactNode } from "react";
import DriverShell from "@/components/driver/DriverShell";
import "@/styles/driver.css";

export default function DriverPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DriverShell previewMode>{children}</DriverShell>;
}
