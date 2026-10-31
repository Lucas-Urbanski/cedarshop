
"use client";

import { useMemo, useState } from "react";

type Product = {
  id: number;
  sku: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
};

type LossReport = {
  id: number;
  sku: string;
  product: string;
  quantity: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
};

const initialProducts: Product[] = [
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

const initialReports: LossReport[] = [
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

const money = (value: number) =>
  value.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });

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

  const cardClass =
    "rounded-xl border border-white/10 bg-[#1e1c1b] p-5";

  const buttonClass =
    "rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600";

  return (
    <main className="min-h-screen bg-[#2d2928] px-5 py-10 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            The Cedar Shop
          </p>
          <h1 className="text-3xl font-bold">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage lumber inventory, review loss reports,
            and monitor operations.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Lumber Products",
              value: products.length.toString(),
            },
            {
              label: "Available Units",
              value: totalUnits.toLocaleString(),
            },
            {
              label: "Inventory Cost Value",
              value: money(inventoryValue),
            },
            {
              label: "Pending Loss Reports",
              value: pendingReports.toString(),
            },
          ].map((stat) => (
            <div key={stat.label} className={cardClass}>
              <p className="text-xs text-gray-400">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-bold">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Inventory Management
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Search products and adjust available quantities.
              </p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-400">
              {lowStockCount} low-stock product(s)
            </span>
          </div>

          <input
            type="search"
            placeholder="Search lumber by product name or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-5 w-full rounded-lg border border-white/10 bg-[#11100f] p-3 text-white outline-none focus:border-emerald-500"
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#11100f] text-gray-300">
                <tr>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Sale Price</th>
                  <th className="p-4">Unit Cost</th>
                  <th className="p-4">Available</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-white/10"
                  >
                    <td className="p-4">{product.sku}</td>
                    <td className="p-4">{product.name}</td>
                    <td className="p-4">
                      {money(product.price)}
                    </td>
                    <td className="p-4">
                      {money(product.cost)}
                    </td>
                    <td className="p-4">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editQuantity}
                          onChange={(event) =>
                            setEditQuantity(event.target.value)
                          }
                          className="w-24 rounded border border-white/20 bg-black p-2"
                        />
                      ) : (
                        <span
                          className={
                            product.quantity < 50
                              ? "font-semibold text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          {product.quantity}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === product.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveQuantity(product.id)}
                            className={buttonClass}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg bg-gray-700 px-3 py-2 hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(product.id);
                            setEditQuantity(
                              product.quantity.toString()
                            );
                          }}
                          className={buttonClass}
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
              <p className="p-6 text-center text-gray-400">
                No matching lumber products found.
              </p>
            )}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-bold">
            Loss Report Approval Queue
          </h2>
          <p className="mb-5 mt-1 text-sm text-gray-400">
            Review reported damaged or missing lumber.
            Approved losses reduce the demo inventory quantity.
          </p>

          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#11100f] p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold">
                    {report.product}
                  </p>
                  <p className="text-sm text-gray-400">
                    {report.sku} · {report.quantity} unit(s)
                  </p>
                  <p className="text-sm text-gray-400">
                    Reason: {report.reason}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={
                      report.status === "Approved"
                        ? "text-sm font-semibold text-emerald-400"
                        : report.status === "Rejected"
                        ? "text-sm font-semibold text-red-400"
                        : "text-sm font-semibold text-amber-400"
                    }
                  >
                    {report.status}
                  </span>

                  {report.status === "Pending" && (
                    <>
                      <button
                        onClick={() =>
                          updateReport(report.id, "Approved")
                        }
                        className={buttonClass}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          updateReport(report.id, "Rejected")
                        }
                        className="rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold hover:bg-red-800"
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

        <footer className="text-xs text-gray-400">
          Demo dashboard only. Product costs, quantities,
          and loss reports are sample data. Changes reset
          when the page reloads. Firebase integration and
          admin authorization are not yet implemented.
        </footer>
      </div>
    </main>
  );
}
