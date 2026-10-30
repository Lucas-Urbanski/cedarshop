
import type { ReactNode } from "react";
import CustomerNavbar from "@/components/customer/CustomerNavbar";

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <CustomerNavbar />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}
