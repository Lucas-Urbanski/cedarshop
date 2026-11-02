
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/types/types";
import { doc, runTransaction, where } from "firebase/firestore";

import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import type { CustomerOrderRecord } from "@/types/business";
import { auth, db } from "@/utils/firebase";

function getStatusStyle(status: OrderStatus) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800";
    case "In Progress":
      return "bg-blue-100 text-blue-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function displayOrderId(id: string) {
  return `CS-${id.slice(0, 8).toUpperCase()}`;
}

export default function OrdersPage() {
  const userId = auth.currentUser?.uid ?? "";
  const orderFilters = useMemo(
    () => (userId ? [where("customerUid", "==", userId)] : []),
    [userId],
  );
  const {
    items: orders,
    loading,
    error: loadError,
  } = useFirestoreCollection<CustomerOrderRecord>(
    "orders",
    orderFilters,
    !!userId,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedOrder, setSelectedOrder] =
    useState<CustomerOrderRecord | null>(null);
  const [editingOrder, setEditingOrder] = useState<CustomerOrderRecord | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.items.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  async function saveOrder() {
    if (!editingOrder) return;

    if (
      !editingOrder.items.trim() ||
      !Number.isSafeInteger(editingOrder.quantity) ||
      editingOrder.quantity < 1 ||
      editingOrder.quantity > 1000000
    ) {
      setMessage("Enter a product and a valid quantity.");
      return;
    }

    setSaving(true);
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", editingOrder.id);
        const snapshot = await transaction.get(orderRef);
        if (!snapshot.exists() || snapshot.data().status !== "Pending") {
          throw new Error("Only pending orders can be edited.");
        }
        transaction.update(orderRef, {
          items: editingOrder.items.trim(),
          quantity: editingOrder.quantity,
          unit: editingOrder.unit,
        });
      });

      setEditingOrder(null);
      setMessage(
        `Order ${displayOrderId(editingOrder.id)} updated successfully.`,
      );
    } catch (error) {
      console.error("Could not update order.", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Order could not be updated. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrder(order: Order) {
    if (order.status !== "Pending") {
      setMessage(
        "Only pending orders can be cancelled directly. Please contact the Cedar Shop team for assistance."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel order ${displayOrderId(order.id)}?`
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", order.id);
        const snapshot = await transaction.get(orderRef);
        if (!snapshot.exists() || snapshot.data().status !== "Pending") {
          throw new Error("Only pending orders can be cancelled.");
        }
        transaction.update(orderRef, { status: "Cancelled" });
      });
      setSelectedOrder(null);
      setMessage(`Order ${displayOrderId(order.id)} has been cancelled.`);
    } catch (error) {
      console.error("Could not cancel order.", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Order could not be cancelled. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
       
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Orders
            </h1>
            <p className="mt-2 text-gray-600">
              View, manage, and track your lumber orders.
            </p>
          </div>

          <Link
            href="/portal/orders/new"
            className="inline-flex items-center justify-center rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            + New Order Request
          </Link>
        </div>

        {message && (
          <div
            role="status"
            className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            <p>{message}</p>
            <button
              type="button"
              onClick={() => setMessage("")}
              className="font-semibold"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}
        {loadError && (
          <p role="alert" className="mb-5 text-sm text-red-700">
            {loadError}
          </p>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {orders.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {orders.filter((order) => order.status === "In Progress").length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {orders.filter((order) => order.status === "Delivered").length}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              placeholder="Search by order ID or product..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 sm:max-w-sm"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-green-800">
                      {displayOrderId(order.id)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {new Date(order.date).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-4 text-gray-800">
                      {order.items}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {order.quantity} {order.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">
                      {order.total > 0
                        ? order.total.toLocaleString("en-CA", {
                        style: "currency",
                        currency: "CAD",
                          })
                        : "Awaiting quote"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          View
                        </button>

                        {order.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingOrder({ ...order })}
                              className="font-medium text-green-700 hover:underline"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => cancelOrder(order)}
                              className="font-medium text-red-700 hover:underline"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Loading your orders…
                    </td>
                  </tr>
                )}
                {!loading && filteredOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No orders match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>

        {/* View order details */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="view-order-title"
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2
                  id="view-order-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Order Details
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-xl text-gray-500 hover:text-gray-900"
                  aria-label="Close order details"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <p><strong>Order ID:</strong> {displayOrderId(selectedOrder.id)}</p>
                <p><strong>Date:</strong> {selectedOrder.date}</p>
                <p><strong>Product:</strong> {selectedOrder.items}</p>
                <p>
                  <strong>Quantity:</strong> {selectedOrder.quantity}{" "}
                  {selectedOrder.unit}
                </p>
                <p>
                  <strong>Total:</strong>{" "}
                  {selectedOrder.total > 0
                    ? selectedOrder.total.toLocaleString("en-CA", {
                        style: "currency",
                        currency: "CAD",
                      })
                    : "Awaiting quote"}
                </p>
                <p>
                  <strong>Status:</strong> {selectedOrder.status}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                {selectedOrder.status === "Pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOrder({ ...selectedOrder });
                        setSelectedOrder(null);
                      }}
                      className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                    >
                      Edit Order
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelOrder(selectedOrder)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Cancel Order
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit order form */}
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveOrder();
              }}
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit                   Order {displayOrderId(editingOrder.id)}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="text-xl text-gray-500 hover:text-gray-900"
                  aria-label="Close edit form"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="order-product"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Product
                  </label>
                  <input
                    id="order-product"
                    type="text"
                    required
                    value={editingOrder.items}
                    onChange={(event) =>
                      setEditingOrder({
                        ...editingOrder,
                        items: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-quantity"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Quantity ({editingOrder.unit})
                  </label>
                  <input
                    id="order-quantity"
                    type="number"
                    min="1"
                    required
                    value={editingOrder.quantity}
                    onChange={(event) =>
                      setEditingOrder({
                        ...editingOrder,
                        quantity: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <p className="text-sm text-gray-600">
                  Pricing is confirmed by the Cedar Shop team after reviewing
                  your request.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
