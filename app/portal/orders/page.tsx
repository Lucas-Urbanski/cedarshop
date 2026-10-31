
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/types/types";
// Just a mock data for testing 
const initialOrders: Order[] = [
  {
    id: "CS-1001",
    date: "Oct 20, 2026",
    items: "Pine Lumber, 2x4",
    quantity: 120,
    unit: "pieces",
    total: 1450,
    status: "In Progress",
  },
  {
    id: "CS-1002",
    date: "Oct 18, 2026",
    items: "Cedar Boards, 1x6",
    quantity: 80,
    unit: "pieces",
    total: 980,
    status: "Delivered",
  },
  {
    id: "CS-1003",
    date: "Oct 15, 2026",
    items: "Spruce Lumber, 2x6",
    quantity: 200,
    unit: "pieces",
    total: 2200,
    status: "Pending",
  },
  {
    id: "CS-1004",
    date: "Oct 12, 2026",
    items: "Plywood Sheets",
    quantity: 40,
    unit: "sheets",
    total: 760,
    status: "Cancelled",
  },
];

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.items.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function saveOrder() {
    if (!editingOrder) return;

    if (
      !editingOrder.items.trim() ||
      editingOrder.quantity < 1 ||
      editingOrder.total < 0
    ) {
      setMessage("Enter a product, a quantity above zero, and a valid total.");
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === editingOrder.id ? editingOrder : order
      )
    );

    setEditingOrder(null);
    setMessage(`Order ${editingOrder.id} updated successfully.`);
  }

  function cancelOrder(order: Order) {
    if (order.status !== "Pending") {
      setMessage(
        "Only pending orders can be cancelled directly. Please contact the Cedar Shop team for assistance."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel order ${order.id}?`
    );

    if (!confirmed) return;

    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === order.id
          ? { ...currentOrder, status: "Cancelled" }
          : currentOrder
      )
    );

    setSelectedOrder(null);
    setMessage(`Order ${order.id} has been cancelled.`);
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
                      {order.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {order.date}
                    </td>
                    <td className="px-4 py-4 text-gray-800">
                      {order.items}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {order.quantity} {order.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">
                      {order.total.toLocaleString("en-CA", {
                        style: "currency",
                        currency: "CAD",
                      })}
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

                {filteredOrders.length === 0 && (
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
                <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                <p><strong>Date:</strong> {selectedOrder.date}</p>
                <p><strong>Product:</strong> {selectedOrder.items}</p>
                <p>
                  <strong>Quantity:</strong> {selectedOrder.quantity}{" "}
                  {selectedOrder.unit}
                </p>
                <p>
                  <strong>Total:</strong>{" "}
                  {selectedOrder.total.toLocaleString("en-CA", {
                    style: "currency",
                    currency: "CAD",
                  })}
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
                  Edit Order {editingOrder.id}
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

                <div>
                  <label
                    htmlFor="order-total"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Order total (CAD)
                  </label>
                  <input
                    id="order-total"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editingOrder.total}
                    onChange={(event) =>
                      setEditingOrder({
                        ...editingOrder,
                        total: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Demo only: a real system should calculate or validate
                    pricing on the server.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
