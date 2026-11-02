"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  ScanLine,
  Search,
  ShieldAlert,
  ShoppingCart,
  Trees,
  Truck,
  X,
} from "lucide-react";
import Navbar from "@/components/navBar";
import ProductCard from "@/components/store/ProductCard";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type {
  ProductCardData,
  UserProfile,
  WorkflowNavigationItem,
} from "@/types/types";
import { auth, db } from "@/utils/firebase";
import { getUserRole } from "@/utils/userProfile";
import { doc, getDoc } from "firebase/firestore";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import type { ProductRecord } from "@/types/business";

const workflowNavigation: WorkflowNavigationItem[] = [
  {
    label: "Customer Portal",
    href: "/portal",
    role: "Customer",
    icon: <ShoppingCart aria-hidden="true" />,
  },
  {
    label: "Sales Counter & POS",
    href: "/sales",
    role: "SalesStaff",
    icon: <Trees aria-hidden="true" />,
  },
  {
    label: "Yard & Mobile PWA",
    href: "/yard",
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
    href: "/admin",
    role: "Administrator",
    icon: <ShieldAlert aria-hidden="true" />,
  },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const productsRowRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const {
    items: productRecords,
    loading: productsLoading,
    error: productsError,
  } = useFirestoreCollection<ProductRecord>("products");
  const popularProducts: ProductCardData[] = useMemo(
    () =>
      productRecords.map((product) => ({
        name: product.name,
        sku: product.id,
        price: product.price.toFixed(2),
      })),
    [productRecords],
  );
  const visibleProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return popularProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term),
    );
  }, [popularProducts, productSearch]);
  const availableWorkflows = workflowNavigation.filter(
    (workflow) =>
      user !== null &&
      (workflow.role === user.role || user.role === "Administrator"),
  );

  useEffect(() => {
    let isCurrent = true;
    let authCheck = 0;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        const currentCheck = ++authCheck;
        const isLatestCheck = () =>
          isCurrent && currentCheck === authCheck;

        setLoading(true);
        setAuthError(null);

        if (!firebaseUser || !firebaseUser.emailVerified) {
          if (firebaseUser) {
            try {
              await signOut(auth);
            } catch (error: unknown) {
              if (isLatestCheck()) {
                setAuthError(
                  error instanceof Error ? error.message : "Sign out failed.",
                );
              }
            }
          }
          if (isLatestCheck()) {
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
          const roleValue = getUserRole(profile.role);
          if (!roleValue) {
            throw new Error("Your Cedar Shop account role is not recognized.");
          }

          if (isLatestCheck()) {
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
          if (isLatestCheck()) {
            setUser(null);
            const code =
              typeof error === "object" &&
              error !== null &&
              "code" in error &&
              typeof error.code === "string"
                ? error.code
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
          if (isLatestCheck()) setLoading(false);
        }
      },
      (error) => {
        if (isCurrent) {
          setAuthError(error.message);
          setUser(null);
          setLoading(false);
        }
      },
    );

    return () => {
      isCurrent = false;
      authCheck += 1;
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
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
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
      {productsError ? (
        <p className="storeAuthError" role="alert">{productsError}</p>
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
            {visibleProducts.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
            {!productsLoading && visibleProducts.length === 0 && (
              <p className="storeEmptyProducts">
                {productSearch
                  ? "No products match your search."
                  : "No products are currently available."}
              </p>
            )}
            {productsLoading && (
              <p role="status">Loading products…</p>
            )}
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
