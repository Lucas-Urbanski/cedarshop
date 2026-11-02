
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navBar";
import type { SalesProduct, SalesQuoteItem } from "@/types/types";
import {
  collection,
  doc,
  runTransaction,
} from "firebase/firestore";

import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import type { InventoryRecord, ProductRecord } from "@/types/business";
import { auth, db } from "@/utils/firebase";

const money = (amount: number) =>
  amount.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });

const cardClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm";

const inputClass =
  "w-full rounded-lg border border-[var(--border-hover)] bg-[var(--surface-muted)] px-3 py-2.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]";

const primaryButton =
  "rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110";

export default function SalesDashboard() {
  const { items: productRecords, loading, error: productsError } =
    useFirestoreCollection<ProductRecord>("products");
  const {
    items: inventoryRecords,
    loading: inventoryLoading,
    error: inventoryError,
  } = useFirestoreCollection<InventoryRecord>("inventory");
  const [search, setSearch] = useState("");
  const [quoteItems, setQuoteItems] = useState<SalesQuoteItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState("");
  const inventoryBySku = useMemo(
    () => new Map(inventoryRecords.map((record) => [record.id, record])),
    [inventoryRecords],
  );
  const products: SalesProduct[] = useMemo(
    () =>
      productRecords.map((product) => ({
        id: product.id,
        sku: product.id,
        name: product.name,
        price: product.price,
        quantity: inventoryBySku.get(product.id)?.quantity ?? 0,
      })),
    [inventoryBySku, productRecords],
  );

  const filteredProducts = products.filter((product) => {
    const term = search.trim().toLowerCase();

    return (
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term)
    );
  });

  const totalUnits = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const subtotal = quoteItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const safeDiscount = Math.min(100, Math.max(0, discount || 0));
  const discountAmount = subtotal * (safeDiscount / 100);
  const total = subtotal - discountAmount;

  function addToQuote(product: SalesProduct) {
    setQuoteItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  item.product.quantity
                ),
              }
            : item
        );
      }

      if (product.quantity === 0) return current;

      return [...current, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, value: number) {
    if (!Number.isFinite(value)) return;

    setQuoteItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(
                item.product.quantity,
                Math.max(1, Math.trunc(value))
              ),
            }
          : item
      )
    );
  }

  function removeFromQuote(productId: string) {
    setQuoteItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }

  async function saveQuote() {
    const user = auth.currentUser;
    if (!user || quoteItems.length === 0 || !customerName.trim()) return;

    setSavingQuote(true);
    setQuoteMessage("");
    const quoteRef = doc(collection(db, "salesQuotes"));
    try {
      await runTransaction(db, async (transaction) => {
        const latestRecords = await Promise.all(
          quoteItems.map((item) =>
            Promise.all([
              transaction.get(doc(db, "products", item.product.id)),
              transaction.get(doc(db, "inventory", item.product.id)),
            ]),
          ),
        );

        latestRecords.forEach(([productSnapshot, inventorySnapshot], index) => {
          const item = quoteItems[index];
          if (!productSnapshot.exists() || !inventorySnapshot.exists()) {
            throw new Error(`${item.product.name} is no longer available.`);
          }
          const latest = productSnapshot.data();
          const latestInventory = inventorySnapshot.data();
          if (
            latest.price !== item.product.price ||
            typeof latestInventory.quantity !== "number" ||
            latestInventory.quantity < item.quantity
          ) {
            throw new Error(
              "Inventory or prices changed. Review the quote and try again.",
            );
          }
        });

        transaction.set(quoteRef, {
          customerName: customerName.trim(),
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          items: quoteItems.map(({ product, quantity }) => ({
            sku: product.sku,
            name: product.name,
            unitPrice: product.price,
            quantity,
          })),
          subtotal,
          discountPercent: safeDiscount,
          total,
        });
      });

      setQuoteItems([]);
      setDiscount(0);
      setCustomerName("");
      setQuoteMessage("Quote saved.");
    } catch (error) {
      console.error("Could not save sales quote.", error);
      setQuoteMessage(
        error instanceof Error
          ? error.message
          : "Quote could not be saved. Check your connection and try again.",
      );
    } finally {
      setSavingQuote(false);
    }
  }

  return (
    <div className="appShell">
      <Navbar user={null}>
        <nav className="workspace-nav" aria-label="Sales navigation">
          <Link href="/" className="workspace-nav-link">
            Home
          </Link>
          <span className="workspace-nav-current" aria-current="page">
            Sales Dashboard
          </span>
        </nav>
      </Navbar>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-7 px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:px-8">
        <div>
          <p className="eyebrow">The Cedar Shop</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Sales Staff Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Search lumber inventory and prepare customer quotes.
          </p>
        </div>

        {(productsError || inventoryError) && (
          <p role="alert" className="text-sm text-red-500">
            {productsError || inventoryError}
          </p>
        )}
        {quoteMessage && (
          <p
            role={quoteMessage === "Quote saved." ? "status" : "alert"}
            className={`text-sm ${
              quoteMessage === "Quote saved."
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {quoteMessage}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className={cardClass}>
            <p className="text-sm text-[var(--text-muted)]">
              Lumber Products
            </p>
            <p className="mt-2 text-3xl font-bold">
              {products.length}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-[var(--text-muted)]">
              Available Units
            </p>
            <p className="mt-2 text-3xl font-bold">
              {totalUnits.toLocaleString()}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-[var(--text-muted)]">
              Items in Quote
            </p>
            <p className="mt-2 text-3xl font-bold">
              {quoteItems.reduce(
                (sum, item) => sum + item.quantity,
                0
              )}
            </p>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Lumber Inventory
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Find products by name or SKU and add them to a quote.
            </p>
          </div>

          <label
            htmlFor="inventory-search"
            className="mb-2 block text-sm font-semibold"
          >
            Search Inventory
          </label>
          <input
            id="inventory-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by product name or SKU..."
            className={inputClass}
          />

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="p-3 font-medium">
                      {product.sku}
                    </td>
                    <td className="p-3">{product.name}</td>
                    <td className="p-3">
                      {money(product.price)}
                    </td>
                    <td className="p-3">
                      {product.quantity.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => addToQuote(product)}
                        disabled={product.quantity === 0}
                        className={`${primaryButton} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        Add to Quote
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(loading || inventoryLoading) && (
              <p role="status" className="py-4 text-sm text-[var(--text-muted)]">
                Loading inventory…
              </p>
            )}
            {filteredProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                {loading || inventoryLoading ? " " : "No matching products found."}
              </p>
            )}
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Customer Quote Builder
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Add products, adjust quantities, and calculate a quote.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setQuoteItems([]);
                setDiscount(0);
                setCustomerName("");
              }}
              className="rounded-lg border border-[var(--border-hover)] px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-raised)]"
            >
              Clear Quote
            </button>
          </div>

          <div className="mb-5 max-w-md">
            <label
              htmlFor="customer-name"
              className="mb-2 block text-sm font-semibold"
            >
              Customer Name
            </label>
            <input
              id="customer-name"
              value={customerName}
              required
              onChange={(event) =>
                setCustomerName(event.target.value)
              }
              placeholder="Enter customer name"
              className={inputClass}
            />
          </div>

          {quoteItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border-hover)] bg-[var(--surface-muted)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
              Your quote is empty. Add a product from the inventory table.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Line Total</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {quoteItems.map((item) => (
                    <tr
                      key={item.product.id}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="p-3">
                        <p className="font-medium">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {item.product.sku}
                        </p>
                      </td>
                      <td className="p-3">
                        {money(item.product.price)}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={1}
                          max={item.product.quantity}
                          step={1}
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(
                              item.product.id,
                              Number(event.target.value)
                            )
                          }
                          aria-label={`Quantity for ${item.product.name}`}
                          className="w-20 rounded-lg border border-[var(--border-hover)] bg-[var(--surface-muted)] px-2 py-2 text-[var(--text-primary)]"
                        />
                      </td>
                      <td className="p-3 font-semibold">
                        {money(
                          item.product.price * item.quantity
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() =>
                            removeFromQuote(item.product.id)
                          }
                          className="rounded-lg border border-[var(--border-hover)] px-3 py-2 text-sm hover:bg-[var(--surface-raised)]"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-5 border-t border-[var(--border)] pt-5 md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-48">
              <label
                htmlFor="discount"
                className="mb-2 block text-sm font-semibold"
              >
                Discount (%)
              </label>
              <input
                id="discount"
                type="number"
                min={0}
                max={100}
                step={1}
                value={discount}
                onChange={(event) =>
                  setDiscount(
                    Math.min(
                      100,
                      Math.max(0, Number(event.target.value) || 0)
                    )
                  )
                }
                className={inputClass}
              />
            </div>

            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">
                  Subtotal
                </span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">
                  Discount ({safeDiscount}%)
                </span>
                <span>-{money(discountAmount)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-[var(--border)] pt-3 text-lg font-bold">
                <span>Quote Total</span>
                <span className="text-[var(--accent)]">
                  {money(total)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={saveQuote}
              disabled={
                savingQuote ||
                !quoteItems.length ||
                !customerName.trim()
              }
              className={`${primaryButton} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {savingQuote ? "Saving quote…" : "Save Quote"}
            </button>
          </div>
        </section>

        <p className="pb-4 text-xs text-[var(--text-muted)]">
          Quotes and current inventory prices are stored in Firestore.
          Totals exclude taxes and delivery.
        </p>
      </main>
    </div>
  );
}
