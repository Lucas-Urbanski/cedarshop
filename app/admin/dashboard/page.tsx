
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navBar";
import type { AdminLossReport, AdminProduct } from "@/types/types";

const initialProducts: AdminProduct[] = [
  {
    id: 1,
    sku: "CED-001",
    name: "2x4 Western Red Cedar - 8ft",
    price: 12.4,
    cost: 7.5,
    quantity: 762,
  },
  {
    id: 2,
    sku: "CED-002",
    name: "2x6 Western Red Cedar - 10ft",
    price: 19.99,
    cost: 12.25,
    quantity: 340,
  },
  {
    id: 3,
    sku: "CED-003",
    name: "4x4 Cedar Post - 8ft",
    price: 32.5,
    cost: 21,
    quantity: 125,
  },
  {
    id: 4,
    sku: "CED-004",
    name: "1x6 Cedar Fence Board - 6ft",
    price: 8.75,
    cost: 4.8,
    quantity: 18,
  },
];

const initialReports: AdminLossReport[] = [
  {
    id: 101,
    sku: "CED-001",
    product: "2x4 Western Red Cedar - 8ft",
    quantity: 8,
    reason: "Damaged during handling",
    status: "Pending",
  },
  {
    id: 102,
    sku: "CED-003",
    product: "4x4 Cedar Post - 8ft",
    quantity: 3,
    reason: "Cracked lumber",
    status: "Pending",
  },
  {
    id: 103,
    sku: "CED-002",
    product: "2x6 Western Red Cedar - 10ft",
    quantity: 5,
    reason: "Moisture damage",
    status: "Pending",
  },
];

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
  const [products, setProducts] = useState(initialProducts);
  const [reports, setReports] = useState(initialReports);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

  const totalUnits = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const inventoryValue = products.reduce(
    (sum, product) => sum + product.quantity * product.cost,
    0
  );

  const lowStockCount = products.filter(
    (product) => product.quantity < 50
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

  function saveQuantity(id: number) {
    const nextQuantity = Number(editQuantity);

    if (
      editQuantity.trim() === "" ||
      !Number.isSafeInteger(nextQuantity) ||
      nextQuantity < 0
    ) {
      alert("Enter a valid whole-number quantity.");
      return;
    }

    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, quantity: nextQuantity }
          : product
      )
    );

    setEditingId(null);
    setEditQuantity("");
  }

  function updateReport(
    id: number,
    status: "Approved" | "Rejected"
  ) {
    const report = reports.find((item) => item.id === id);

    if (!report || report.status !== "Pending") return;

    if (status === "Approved") {
      const product = products.find(
        (item) => item.sku === report.sku
      );

      if (!product || product.quantity < report.quantity) {
        alert("Not enough inventory to approve this loss report.");
        return;
      }

      setProducts((current) =>
        current.map((item) =>
          item.sku === report.sku
            ? {
                ...item,
                quantity: item.quantity - report.quantity,
              }
            : item
        )
      );
    }

    setReports((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  }

  return (
    <div className="appShell">
      <Navbar user={null}>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-white">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="font-semibold text-[var(--highlight)]">
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
                      {money(product.cost)}
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
                      ) : (
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
            Review damaged or missing lumber.
            Approving a report reduces the demo inventory quantity.
          </p>

          <div className="space-y-3">
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
          Prototype only. Inventory costs, quantities, and loss
          reports are sample data. Changes reset when the page
          reloads. Firebase integration and admin authorization
          are not yet implemented.
        </p>
      </main>
    </div>
  );
}
