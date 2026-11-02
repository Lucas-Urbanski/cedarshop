"use client";

import { useMemo } from "react";
import Link from "next/link";
import { where } from "firebase/firestore";

import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import useAuthDisplayName from "@/hooks/useAuthDisplayName";
import type { CustomerOrderRecord } from "@/types/business";
import type { SummaryCardProps } from "@/types/types";
import { auth } from "@/utils/firebase";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

function displayOrderId(id: string) {
  return `CS-${id.slice(0, 8).toUpperCase()}`;
}

export default function CustomerDashboard() {
  const userId = auth.currentUser?.uid ?? "";
  const filters = useMemo(
    () => (userId ? [where("customerUid", "==", userId)] : []),
    [userId],
  );
  const { items: orders, loading, error } =
    useFirestoreCollection<CustomerOrderRecord>("orders", filters, !!userId);
  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [orders],
  );
  const displayName = useAuthDisplayName("there").split(/\s+/)[0];

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <p className="text-sm font-medium text-green-700">Customer Portal</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 text-gray-600">
            View your orders, track deliveries, and review lumber
            weight specifications.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            title="Total Orders"
            value={loading ? "…" : String(orders.length)}
            description="All-time orders"
          />
          <SummaryCard
            title="In Progress"
            value={loading
              ? "…"
              : String(orders.filter((order) => order.status === "In Progress").length)}
            description="Orders being processed"
          />
          <SummaryCard
            title="Delivered"
            value={loading
              ? "…"
              : String(orders.filter((order) => order.status === "Delivered").length)}
            description="Successfully delivered"
          />
        </section>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Orders
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your latest lumber orders
              </p>
            </div>

            <Link
              href="/portal/orders"
              className="text-sm font-medium text-green-700 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                      {displayOrderId(order.id)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {new Date(order.date).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{order.items}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-900">
                      {order.total > 0
                        ? order.total.toLocaleString("en-CA", {
                            style: "currency",
                            currency: "CAD",
                          })
                        : "Awaiting quote"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusStyles[order.status] ??
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                      Loading your orders…
                    </td>
                  </tr>
                )}
                {!loading && recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                      You haven’t submitted any orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ title, value, description }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}
