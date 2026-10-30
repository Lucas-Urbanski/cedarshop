"use client";

import { useState, useEffect } from "react";
import type { UserProfile } from "@/types/types";
import { WorkflowCard } from "@/components/card";
import Navbar from "@/components/NavBar";

import {
  Trees,
  Truck,
  ScanLine,
  ShoppingCart,
  ShieldAlert,
} from "lucide-react";

export default function HomePage() {
  // Mock auth state (Replace with your actual Firebase Auth hook / Context)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate checking Firebase auth state on load
    const timer = setTimeout(() => {
      // Example logged-in user (Set to null to preview public guest view)
      setUser({
        name: "Cody",
        role: "Administrator",
        email: "cody@cedarshop.com",
      });

      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loadingState">
        <div className="loadingSpinner" />
      </div>
    );
  }

  return (
    <div className="appShell">
      <Navbar user={user} />

      <main className="homeMain">
        <section>
          <div className="grid grid-cols-1 gap-6 min-[601px]:grid-cols-2 min-[901px]:grid-cols-3">
            {/* Customer Zone */}
            {user?.role === "Customer" ||
            user?.role === "Administrator" ? (
              <WorkflowCard
                title="Customer Portal"
                role="Customer"
                href="/portal"
                icon={<ShoppingCart className="workflowCardIcon" />}
                description="View order histories, track live jobsite deliveries, and view exact moisture-adjusted wood weight specs."
                activeRole={user.role}
              />
            ) : null}

            {/* Sales Zone */}
            {user?.role === "SalesStaff" ||
            user?.role === "Administrator" ? (
              <WorkflowCard
                title="Sales Counter & POS"
                role="SalesStaff"
                href="/sales/dashboard"
                icon={<Trees className="workflowCardIcon" />}
                description="Quick stock lookup across species/UOMs, build custom quotes with contractor discount tiers, and stage orders."
                activeRole={user.role}
              />
            ) : null}

            {/* Yard / Floor Staff PWA */}
            {user?.role === "FloorStaff" ||
            user?.role === "Administrator" ? (
              <WorkflowCard
                title="Yard & Mobile PWA"
                role="FloorStaff"
                href="/yard/dashboard"
                icon={<ScanLine className="workflowCardIcon" />}
                description="Mobile barcode scanner, kiln work-order yield tracking, and camera-enabled damage/loss tagging."
                activeRole={user.role}
              />
            ) : null}

            {/* Driver App */}
            {user?.role === "Driver" ||
            user?.role === "Administrator" ? (
              <WorkflowCard
                title="Driver Delivery App"
                role="Driver"
                href="/driver/dashboard"
                icon={<Truck className="workflowCardIcon" />}
                description="Assigned route planning, truck weight verification, and photo proof-of-delivery capture."
                activeRole={user.role}
              />
            ) : null}

            {/* Admin Management */}
            {user?.role === "Administrator" ? (
              <WorkflowCard
                title="Admin Dashboard"
                role="Administrator"
                href="/admin/dashboard"
                icon={<ShieldAlert className="workflowCardIcon" />}
                description="Master cost management, staff damage-photo write-off queue, and ECI Spruce migration utility."
                activeRole={user.role}
              />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}