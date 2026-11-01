"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Package, Route, Search, Truck } from "lucide-react";
import DeliveryStopCard from "@/components/driver/DeliveryStopCard";
import {
  initialDriverDeliveries,
  type DriverStopStatus,
} from "@/data/Delivery";

type StatusFilter = "All stops" | DriverStopStatus;

const statusOptions: StatusFilter[] = [
  "All stops",
  "Ready",
  "In Progress",
  "Delivered",
];

export default function DriverDashboardPage() {
  const [route, setRoute] = useState(initialDriverDeliveries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All stops");

  const visibleStops = useMemo(() => {
    const term = search.trim().toLowerCase();
    return route.filter((stop) => {
      const matchesStatus =
        statusFilter === "All stops" || stop.status === statusFilter;
      const searchableText = [
        stop.id,
        stop.orderId,
        stop.customer,
        stop.address,
        stop.city,
        ...stop.items.map((item) => item.name),
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && searchableText.includes(term);
    });
  }, [route, search, statusFilter]);

  const completedStops = route.filter((stop) => stop.status === "Delivered").length;
  const remainingPieces = route
    .filter((stop) => stop.status !== "Delivered")
    .flatMap((stop) => stop.items)
    .reduce((total, item) => total + item.quantity, 0);

  function advanceStop(deliveryId: string) {
    setRoute((currentRoute) =>
      currentRoute.map((stop) => {
        if (stop.id !== deliveryId) return stop;
        const nextStatus: DriverStopStatus =
          stop.status === "Ready" ? "In Progress" : "Delivered";
        return { ...stop, status: nextStatus };
      }),
    );
  }

  return (
    <section className="driver-dashboard" aria-labelledby="driver-title">
      <div className="driver-welcome">
        <div>
          <p className="driver-eyebrow">SUNDAY · NOVEMBER 1, 2026</p>
          <h1 id="driver-title">Welcome, Bao</h1>
          <p>Your route is ready. Here’s what you’ll be delivering today.</p>
        </div>
        <div className="driver-welcome-icon" aria-hidden="true">
          <Truck size={42} strokeWidth={1.4} />
        </div>
      </div>

      <div className="driver-metrics" aria-label="Today's route summary">
        <article>
          <span className="driver-metric-icon"><Route size={19} /></span>
          <div>
            <p>Total stops</p>
            <strong>{route.length}</strong>
          </div>
        </article>
        <article>
          <span className="driver-metric-icon"><Package size={19} /></span>
          <div>
            <p>Pieces to deliver</p>
            <strong>{remainingPieces}</strong>
          </div>
        </article>
        <article>
          <span className="driver-metric-icon"><CheckCircle2 size={19} /></span>
          <div>
            <p>Stops completed</p>
            <strong>{completedStops}<span> / {route.length}</span></strong>
          </div>
        </article>
      </div>

      <section id="stops" className="driver-route-section" aria-labelledby="route-title">
        <div className="driver-route-heading">
          <div>
            <p className="driver-eyebrow">YOUR DELIVERY PLAN</p>
            <h2 id="route-title">Today’s route</h2>
            <p>Check each load and destination before heading out.</p>
          </div>
          <span className="driver-route-count">
            {route.length} stops <span aria-hidden="true">·</span> Calgary
          </span>
        </div>

        <div className="driver-toolbar">
          <label className="driver-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, order, address, or item"
              aria-label="Search delivery stops"
            />
          </label>
          <label className="driver-filter">
            <span>Show</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              aria-label="Filter stops by status"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        {visibleStops.length > 0 ? (
          <div className="driver-stop-list">
            {visibleStops.map((delivery) => (
              <DeliveryStopCard
                key={delivery.id}
                delivery={delivery}
                onAdvanceStatus={advanceStop}
              />
            ))}
          </div>
        ) : (
          <div className="driver-empty-state">
            <Package size={26} aria-hidden="true" />
            <strong>No stops found</strong>
            <p>Try a different search or status filter.</p>
          </div>
        )}
      </section>
    </section>
  );
}
