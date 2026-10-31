
"use client";

import { useState } from "react";
import type { Delivery, DeliveryStatus } from "@/types/types";

const initialDeliveries: Delivery[] = [
  {
    id: "DEL-2001",
    orderId: "CS-1001",
    date: "Oct 28, 2026",
    address: "123 Example Street, Calgary, AB",
    items: "Pine Lumber, 2x4",
    status: "In Transit",
    driver: "Assigned driver",
    trackingNote: "Your order is on its way.",
  },
  {
    id: "DEL-2002",
    orderId: "CS-1002",
    date: "Oct 18, 2026",
    address: "45 Example Avenue, Calgary, AB",
    items: "Cedar Boards, 1x6",
    status: "Delivered",
    driver: "Assigned driver",
    trackingNote: "Delivery completed.",
  },
  {
    id: "DEL-2003",
    orderId: "CS-1003",
    date: "Oct 30, 2026",
    address: "789 Example Road, Calgary, AB",
    items: "Spruce Lumber, 2x6",
    status: "Scheduled",
    driver: "Not yet assigned",
    trackingNote: "Your delivery is scheduled.",
  },
  {
    id: "DEL-2004",
    orderId: "CS-1005",
    date: "Oct 27, 2026",
    address: "20 Example Crescent, Calgary, AB",
    items: "Plywood Sheets",
    status: "Delayed",
    driver: "Assigned driver",
    trackingNote: "Please contact the Cedar Shop team for an update.",
  },
];

function getStatusStyle(status: DeliveryStatus) {
  switch (status) {
    case "Scheduled":
      return "bg-purple-100 text-purple-800";
    case "In Transit":
      return "bg-blue-100 text-blue-800";
    case "Delivered":
      return "bg-green-100 text-green-800";
    case "Delayed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function DeliveriesPage() {
  const [deliveries] = useState<Delivery[]>(initialDeliveries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDelivery, setSelectedDelivery] =
    useState<Delivery | null>(null);

  const filteredDeliveries = deliveries.filter((delivery) => {
    const searchTerm = search.toLowerCase();

    const matchesSearch =
      delivery.id.toLowerCase().includes(searchTerm) ||
      delivery.orderId.toLowerCase().includes(searchTerm) ||
      delivery.items.toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "All" || delivery.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = deliveries.filter(
    (delivery) =>
      delivery.status === "Scheduled" ||
      delivery.status === "In Transit"
  ).length;

  const deliveredCount = deliveries.filter(
    (delivery) => delivery.status === "Delivered"
  ).length;

  const delayedCount = deliveries.filter(
    (delivery) => delivery.status === "Delayed"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Deliveries
          </h1>
          <p className="mt-2 text-gray-600">
            Check delivery schedules and track your lumber orders.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Active Deliveries</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {deliveredCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Delayed</p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {delayedCount}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search delivery, order ID, or product..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 sm:max-w-md"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
          >
            <option value="All">All statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredDeliveries.map((delivery) => (
            <article
              key={delivery.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {delivery.id}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Order {delivery.orderId}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(delivery.status)}`}
                >
                  {delivery.status}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Product</p>
                  <p className="font-medium text-gray-900">
                    {delivery.items}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Delivery date</p>
                  <p className="font-medium text-gray-900">
                    {delivery.date}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Delivery address</p>
                  <p className="font-medium text-gray-900">
                    {delivery.address}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(delivery)}
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Track Delivery
                </button>
              </div>
            </article>
          ))}

          {filteredDeliveries.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 lg:col-span-2">
              No deliveries match your search.
            </div>
          )}
        </div>

        <p className="mt-5 text-sm text-gray-500">
          Showing {filteredDeliveries.length} of {deliveries.length} deliveries
        </p>

        {selectedDelivery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delivery-details-title"
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl text-gray-600"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2
                  id="delivery-details-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Delivery Details
                </h2>

                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  aria-label="Close delivery details"
                  className="text-xl text-gray-500 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <p>
                  <strong>Delivery ID:</strong> {selectedDelivery.id}
                </p>
                <p>
                  <strong>Order ID:</strong> {selectedDelivery.orderId}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedDelivery.status)}`}
                  >
                    {selectedDelivery.status}
                  </span>
                </p>
                <p>
                  <strong>Scheduled date:</strong> {selectedDelivery.date}
                </p>
                <p>
                  <strong>Product:</strong> {selectedDelivery.items}
                </p>
                <p>
                  <strong>Driver:</strong> {selectedDelivery.driver}
                </p>
                <p>
                  <strong>Address:</strong> {selectedDelivery.address}
                </p>
              </div>

              <div className="mt-5 rounded-lg bg-gray-50 p-4">
                <p className="font-semibold text-gray-800">
                  Latest update
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedDelivery.trackingNote}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
