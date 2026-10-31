"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Menu, Search, X } from "lucide-react";
import Navbar from "@/components/NavBar";
import ProductCard from "@/components/store/ProductCard";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { ReactNode } from "react";
import type { UserProfile, UserRole, ProductCardData } from "@/types/types";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc } from "firebase/firestore";

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

const workflowNavigation: {
  label: string;
  href: string;
  role: UserRole;
  icon: ReactNode;
}[] = [
  {
    label: "Customer Portal",
    href: "/portal",
    role: "Customer",
    icon: <ShoppingCart aria-hidden="true" />,
  },
  {
    label: "Sales Counter & POS",
    href: "/sales/dashboard",
    role: "SalesStaff",
    icon: <Trees aria-hidden="true" />,
  },
  {
    label: "Yard & Mobile PWA",
    href: "/yard/dashboard",
    role: "FloorStaff",
    icon: <ScanLine aria-hidden="true" />,
  },
  {
    label: "Driver Delivery App",
    href: "/driver/dashboard",
    role: "Driver",
    icon: <Truck aria-hidden="true" />,
  },
  {
    label: "Admin Dashboard",
    href: "/admin/dashboard",
    role: "Administrator",
    icon: <ShieldAlert aria-hidden="true" />,
  },
];

const popularProducts: ProductCardData[] = [
  {
    name: "5/4x6x8ft Kiln S4S Western Red Cedar",
    sku: "STK546K08",
    price: "24.80",
  },
  {
    name: "1x6x10ft S4S Brown MicroPro Sienna",
    sku: "MPS160DW10",
    price: "10.58",
  },
  {
    name: "4x4x8ft Brown MicroPro Sienna Ground Contact",
    sku: "MPS4040DW08",
    price: "18.80",
    lowStock: true,
  },
  {
    name: "1x6x7ft T&G Clear Western Red Cedar",
    sku: "TGC16TGCVC8",
    price: "39.08",
    lowStock: true,
  },
  {
    name: "2x6x12ft G1S Western Red Cedar",
    sku: "STK206KSC12",
    price: "41.52",
  },
  {
    name: "2x4x8ft SPF Dimensional Lumber",
    sku: "SPF20408",
    price: "6.48",
  },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const productsRowRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const availableWorkflows = workflowNavigation.filter(
    (workflow) =>
      workflow.role === (user?.role ?? "Customer") ||
      user?.role === "Administrator",
  );

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
            throw new Error(
              "Your Cedar Shop account profile could not be found.",
            );
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
            const code =
              typeof error === "object" && error !== null && "code" in error
                ? String((error as { code?: string }).code ?? "")
                : "";

            setAuthError(
              code === "permission-denied"
                ? "Could not load your account. Please try again."
                : error instanceof Error
                  ? error.message
                  : "Could not load your account. Please try again.",
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
    <main className="storefront">
      <div className="storeHeader">
        <Navbar user={user}>
          <label className="storeSearch">
            <Search aria-hidden="true" />
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search for products..."
            />
          </label>
        </Navbar>
        <nav className="storeNavigation" aria-label="Workflow navigation">
          <button
            type="button"
            className="storeMenuToggle"
            aria-expanded={menuOpen}
            aria-controls="store-navigation-links"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span>{menuOpen ? "Close" : "Menu"}</span>
          </button>
          <div
            id="store-navigation-links"
            className={`storeNavigationLinks${menuOpen ? " storeNavigationOpen" : ""}`}
          >
            {availableWorkflows.map((item) => (
              <Link
                href={item.href}
                key={item.label}
                onClick={() => setMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
      {authError ? (
        <p className="storeAuthError" role="alert">
          {authError}
        </p>
      ) : null}

      <section className="storeHero" aria-labelledby="hero-title">
        <div className="storeHeroContent">
          <h1 id="hero-title">Bringing nature to you.</h1>
        </div>
      </section>

      <section
        className="popularProducts"
        aria-labelledby="popular-products-title"
      >
        <h2 id="popular-products-title">Popular Products</h2>
        <div className="popularProductsRail">
          <div className="popularProductsTrack" ref={productsRowRef}>
            {popularProducts.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
          <button
            className="popularProductsPrevious"
            type="button"
            aria-label="Show previous popular products"
            onClick={() =>
              productsRowRef.current?.scrollBy({
                left: -300,
                behavior: "smooth",
              })
            }
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            className="popularProductsNext"
            type="button"
            aria-label="Show more popular products"
            onClick={() =>
              productsRowRef.current?.scrollBy({
                left: 300,
                behavior: "smooth",
              })
            }
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="storeHighlights" id="about">
        <div className="storeSectionHeading">
          <p className="eyebrow">The Cedar Shop</p>
          <h2>Good materials. Helpful people.</h2>
          <p>
            Whether you are planning a weekend project or managing a jobsite, we
            are here to help you get started.
          </p>
        </div>
      </section>
    </main>
  );
}
