"use client";

import { useState, useEffect } from "react";
import type { UserProfile, UserRole } from "@/types/types";
import { WorkflowCard } from "@/components/card";
import Link from "next/link";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { LogoutButton } from "@/components/auth/logoutButton";
import Navbar from "@/components/NavBar";

import {
  Trees,
  Truck,
  ScanLine,
  ShoppingCart,
  ShieldAlert,
} from "lucide-react";

const userRoles: Record<string, UserRole> = {
  customer: "Customer",
  driver: "Driver",
  floorstaff: "FloorStaff",
  salesstaff: "SalesStaff",
  administrator: "Administrator",
};

export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser || !firebaseUser.emailVerified) {
          if (firebaseUser) {
            try {
              await signOut(auth);
            } catch (error: unknown) {
              if (isCurrent) {
                setAuthError(
                  error instanceof Error ? error.message : "Sign out failed.",
                );
              }
            }
          }
          if (isCurrent) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        try {
          const profileSnapshot = await getDoc(
            doc(db, "users", firebaseUser.uid),
          );
          if (!profileSnapshot.exists()) {
            throw new Error("Your Cedar Shop account profile could not be found.");
          }

          const profile = profileSnapshot.data();
          const roleValue =
            typeof profile.role === "string"
              ? userRoles[profile.role.toLowerCase().replace(/\s+/g, "")]
              : undefined;
          if (!roleValue) {
            throw new Error("Your Cedar Shop account role is not recognized.");
          }

          if (isCurrent) {
            setUser({
              name:
                (typeof profile.fullName === "string" && profile.fullName) ||
                firebaseUser.displayName ||
                firebaseUser.email ||
                "Customer",
              email: firebaseUser.email ?? "",
              role: roleValue,
            });
            setAuthError(null);
          }
        } catch (error: unknown) {
          if (isCurrent) {
            setUser(null);
            setAuthError(
              error instanceof Error
                ? error.message
                : "Could not load your account profile.",
            );
          }
        } finally {
          if (isCurrent) setLoading(false);
        }
      },
      (error) => {
        if (isCurrent) {
          setAuthError(error.message);
          setLoading(false);
        }
      },
    );

    return () => {
      isCurrent = false;
      unsubscribe();
    };
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
      <header className="homeHeader">
        <div className="headerContent">
          <h1 className="headerTitle">Cedar Shop LMS</h1>

          <div className="headerActions">
            {user ? (
              <>
                <span className="greeting">Hello, {user.name}</span>
                <Link href="/settings" className="button buttonSettings">
                  Settings
                </Link>
                <LogoutButton className="button buttonSettings" />
              </>
            ) : (
              <>
                <Link href="/auth/login" className="button buttonSettings">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="button buttonPrimary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="homeMain">
        {authError && (
          <p role="alert" className="mb-6 rounded-md border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {authError}
          </p>
        )}
        {/* Persona Workflow Shortcuts Grid */}
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