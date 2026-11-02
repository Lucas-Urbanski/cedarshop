
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navBar";
import type { AdminLossReport, AdminProduct } from "@/types/types";
import {
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import type {
  InventoryRecord,
  ProductCostRecord,
  ProductRecord,
  YardLossRecord,
} from "@/types/business";
import { auth, db } from "@/utils/firebase";
import { seedDemoData } from "@/utils/demoSeed";

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

export default function AdminDashboard() {
  const { items: productRecords, loading: productsLoading, error: productsError } =
    useFirestoreCollection<ProductRecord>("products");
  const { items: costRecords, error: costsError } =
    useFirestoreCollection<ProductCostRecord>("productCosts");
  const {
    items: inventoryRecords,
    loading: inventoryLoading,
    error: inventoryError,
  } = useFirestoreCollection<InventoryRecord>("inventory");
  const { items: lossRecords, error: lossesError } =
    useFirestoreCollection<YardLossRecord>("yardLossReports");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const costsBySku = useMemo(
    () => new Map(costRecords.map((record) => [record.id, record.cost])),
    [costRecords],
  );
  const inventoryBySku = useMemo(
    () => new Map(inventoryRecords.map((record) => [record.id, record])),
    [inventoryRecords],
  );
  const products: AdminProduct[] = useMemo(
    () =>
      productRecords.map((product) => ({
        id: product.id,
        sku: product.id,
        name: product.name,
        price: product.price,
        cost: costsBySku.get(product.id) ?? null,
        quantity: inventoryBySku.get(product.id)?.quantity ?? 0,
      })),
    [costsBySku, inventoryBySku, productRecords],
  );
  const reports: AdminLossReport[] = useMemo(
    () =>
      lossRecords.map((report) => ({
        id: report.id,
        sku: report.stockId,
        product:
          productRecords.find((product) => product.id === report.stockId)?.name ??
          report.stockId,
        quantity: report.quantity,
        reason: report.notes,
        status:
          report.status === "Pending review" ? "Pending" : report.status,
      })),
    [lossRecords, productRecords],
  );

  const totalUnits = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const inventoryValue = products.reduce(
    (sum, product) => sum + product.quantity * (product.cost ?? 0),
    0
  );

  const lowStockCount = products.filter(
    (product) =>
      product.quantity <
      (inventoryBySku.get(product.id)?.minimum ?? Number.POSITIVE_INFINITY),
  ).length;

  const pendingReports = reports.filter(
    (report) => report.status === "Pending"
  ).length;

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
    );
  }, [products, search]);

  async function saveQuantity(id: string) {
    const nextQuantity = Number(editQuantity);

    if (
      editQuantity.trim() === "" ||
      !Number.isSafeInteger(nextQuantity) ||
      nextQuantity < 0
    ) {
      setActionError("Enter a valid whole-number quantity.");
      return;
    }

    setSaving(true);
    setActionError("");
    try {
      await updateDoc(doc(db, "inventory", id), { quantity: nextQuantity });
      setEditingId(null);
      setEditQuantity("");
      setActionMessage(`Stock for ${id} was updated.`);
    } catch (error) {
      console.error("Could not update inventory.", error);
      setActionError("Inventory could not be updated. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateReport(
    id: string,
    status: "Approved" | "Rejected"
  ) {
    const report = reports.find((item) => item.id === id);
    const user = auth.currentUser;

    if (!report || report.status !== "Pending") return;
    if (!user) {
      setActionError("Sign in again before reviewing a loss report.");
      return;
    }

    setSaving(true);
    setActionError("");
    setActionMessage("");
    try {
      await runTransaction(db, async (transaction) => {
        const reportRef = doc(db, "yardLossReports", id);
        const reportSnapshot = await transaction.get(reportRef);
        if (!reportSnapshot.exists()) {
          throw new Error("This loss report no longer exists.");
        }

        const currentReport = reportSnapshot.data() as YardLossRecord;
        if (currentReport.status !== "Pending review") {
          throw new Error("This loss report has already been reviewed.");
        }

        if (status === "Approved") {
          const inventoryRef = doc(db, "inventory", currentReport.stockId);
          const inventorySnapshot = await transaction.get(inventoryRef);
          if (!inventorySnapshot.exists()) {
            throw new Error("The reported inventory item could not be found.");
          }

          const quantity = inventorySnapshot.data().quantity;
          if (
            typeof quantity !== "number" ||
            quantity < currentReport.quantity
          ) {
            throw new Error("There is not enough inventory to approve this report.");
          }
          transaction.update(inventoryRef, {
            quantity: quantity - currentReport.quantity,
          });
        }

        transaction.update(reportRef, {
          status,
          reviewedBy: user.uid,
          reviewedAt: serverTimestamp(),
        });
      });
      setActionMessage(`Loss report ${id} was ${status.toLowerCase()}.`);
    } catch (error) {
      console.error("Could not review loss report.", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "The loss report could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSeedDemoData() {
    const user = auth.currentUser;
    if (!user) {
      setActionError("Sign in again before loading demonstration records.");
      return;
    }
    if (productRecords.length || inventoryRecords.length) {
      setActionError("The workspace already contains inventory records.");
      return;
    }

    setSeeding(true);
    setActionError("");
    setActionMessage("");
    try {
      await seedDemoData(user.uid);
      setActionMessage("Demonstration inventory, yard records, and route records were loaded.");
    } catch (error) {
      console.error("Could not load demonstration records.", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Demonstration records could not be loaded.",
      );
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="appShell">
      <Navbar user={null}>
        <nav className="workspace-nav" aria-label="Administrator navigation">
          <Link href="/" className="workspace-nav-link">
            Home
          </Link>
          <span className="workspace-nav-current" aria-current="page">
            Admin Dashboard
          </span>
        </nav>
      </Navbar>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-7 px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:px-8">
        <header>
          <p className="eyebrow">The Cedar Shop</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Manage lumber inventory, review loss reports,
            and monitor operations.
          </p>
        </header>

        {actionError && <p role="alert" className="text-sm text-red-500">{actionError}</p>}
        {actionMessage && <p role="status" className="text-sm text-green-600">{actionMessage}</p>}
        {(productsError || costsError || lossesError || inventoryError) && (
          <p role="alert" className="text-sm text-red-500">
            {productsError || costsError || lossesError || inventoryError}
          </p>
        )}
        {!productsLoading &&
          !inventoryLoading &&
          productRecords.length === 0 &&
          inventoryRecords.length === 0 && (
          <section className={cardClass}>
            <h2 className="text-lg font-semibold">No inventory records</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Add real inventory in Firestore, or explicitly load the clearly marked demonstration records once.
            </p>
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={seeding}
              className={`${primaryButton} mt-4 disabled:opacity-50`}
            >
              {seeding ? "Loading demonstration records…" : "Load demonstration records"}
            </button>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              Inventory Cost Value
            </p>
            <p className="mt-2 text-3xl font-bold">
              {money(inventoryValue)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm text-[var(--text-muted)]">
              Pending Loss Reports
            </p>
            <p className="mt-2 text-3xl font-bold">
              {pendingReports}
            </p>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Inventory Management
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Search products and adjust available quantities.
              </p>
            </div>

            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-500">
              {lowStockCount} low-stock product(s)
            </span>
          </div>

          <label
            htmlFor="admin-inventory-search"
            className="mb-2 block text-sm font-semibold"
          >
            Search Inventory
          </label>
          <input
            id="admin-inventory-search"
            type="search"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={inputClass}
          />

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Sale Price</th>
                  <th className="p-3">Unit Cost</th>
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
                    <td className="p-3">
                      {product.name}
                    </td>
                    <td className="p-3">
                      {money(product.price)}
                    </td>
                    <td className="p-3">
                      {product.cost === null ? "—" : money(product.cost)}
                    </td>
                    <td className="p-3">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={editQuantity}
                          onChange={(event) =>
                            setEditQuantity(event.target.value)
                          }
                          aria-label={`New stock quantity for ${product.name}`}
                          className="w-24 rounded-lg border border-[var(--border-hover)] bg-[var(--surface-muted)] px-2 py-2 text-[var(--text-primary)]"
                        />
                      ) : (
                        <span
                          className={
                            product.quantity < 50
                              ? "font-semibold text-amber-500"
                              : "font-semibold text-[var(--accent)]"
                          }
                        >
                          {product.quantity.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingId === product.id ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              saveQuantity(product.id)
                            }
                            className={primaryButton}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditQuantity("");
                            }}
                            className="rounded-lg border border-[var(--border-hover)] px-3 py-2 text-sm hover:bg-[var(--surface-raised)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : inventoryBySku.has(product.id) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(product.id);
                            setEditQuantity(
                              product.quantity.toString()
                            );
                          }}
                          className={primaryButton}
                        >
                          Edit Stock
                        </button>
                      ) : (
                        <span className="text-[var(--text-muted)]">
                          No stock record
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                No matching products found.
              </p>
            )}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-bold">
            Loss Report Approval Queue
          </h2>
          <p className="mb-5 mt-1 text-sm text-[var(--text-secondary)]">
            Review damaged or missing lumber. Approving a report deducts the
            reported quantity from inventory.
          </p>

          <div className="space-y-3">
            {productsLoading && (
              <p role="status" className="text-sm text-[var(--text-muted)]">
                Loading inventory…
              </p>
            )}
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold">
                    {report.product}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {report.sku} · {report.quantity} unit(s)
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Reason: {report.reason}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={
                      report.status === "Approved"
                        ? "text-sm font-semibold text-[var(--accent)]"
                        : report.status === "Rejected"
                          ? "text-sm font-semibold text-red-500"
                          : "text-sm font-semibold text-amber-500"
                    }
                  >
                    {report.status}
                  </span>

                  {report.status === "Pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          updateReport(report.id, "Approved")
                        }
                        className={primaryButton}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateReport(report.id, "Rejected")
                        }
                        className="rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="pb-4 text-xs text-[var(--text-muted)]">
          Inventory, unit costs, and loss reports are synchronized with
          Firestore. Demonstration records are explicitly marked when loaded.
        </p>
      </main>
    </div>
  );
}
