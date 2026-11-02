"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Package, Route, Search, Truck } from "lucide-react";
import DeliveryStopCard from "@/components/driver/DeliveryStopCard";
import {
  type DriverStopStatus,
} from "@/data/Delivery";
import {
  doc,
  runTransaction,
  where,
} from "firebase/firestore";

import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import useAuthDisplayName from "@/hooks/useAuthDisplayName";
import type { DeliveryRecord } from "@/types/business";
import { auth, db } from "@/utils/firebase";

type StatusFilter = "All stops" | DriverStopStatus;

const statusOptions: StatusFilter[] = [
  "All stops",
  "Ready",
  "In Progress",
  "Delivered",
];

export default function DriverDashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All stops");
  const [actionError, setActionError] = useState("");
  const [updatingStop, setUpdatingStop] = useState<string | null>(null);
  const [today, setToday] = useState("");
  const [todayLabel, setTodayLabel] = useState("");
  const driverName = useAuthDisplayName("Driver");
  const userId = auth.currentUser?.uid ?? "";

  useEffect(() => {
    const now = new Date();
    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60_000,
    )
      .toISOString()
      .slice(0, 10);
    const dateLabel = now.toLocaleDateString("en-CA", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    setToday(localDate);
    setTodayLabel(dateLabel.toUpperCase());
  }, []);

  const assignedFilters = useMemo(
    () => [
      where("driverUid", "==", userId),
      where("deliveryDate", "==", today),
    ],
    [today, userId],
  );
  const demoFilters = useMemo(
    () => [
      where("isDemo", "==", true),
      where("deliveryDate", "==", today),
    ],
    [today],
  );
  const assigned = useFirestoreCollection<DeliveryRecord>(
    "deliveries",
    assignedFilters,
    !!userId && !!today,
  );
  const demo = useFirestoreCollection<DeliveryRecord>(
    "deliveries",
    demoFilters,
    !!userId && !!today,
  );
  const route = useMemo(() => {
    const records = new Map<string, DeliveryRecord>();
    [...assigned.items, ...demo.items].forEach((item) =>
      records.set(item.id, item),
    );
    return [...records.values()].map(({ customerUid, driverUid, ...delivery }) =>
      delivery,
    );
  }, [assigned.items, demo.items]);
  const loading = !today || assigned.loading || demo.loading;
  const loadError = assigned.error || demo.error;

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

  async function advanceStop(deliveryId: string) {
    setUpdatingStop(deliveryId);
    setActionError("");
    try {
      await runTransaction(db, async (transaction) => {
        const reference = doc(db, "deliveries", deliveryId);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists()) {
          throw new Error("This delivery stop no longer exists.");
        }

        const currentStatus = snapshot.data().status as DriverStopStatus;
        if (currentStatus === "Delivered") return;
        const nextStatus: DriverStopStatus =
          currentStatus === "Ready" ? "In Progress" : "Delivered";
        transaction.update(reference, {
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        });
      });
    } catch (error) {
      console.error("Could not update delivery status.", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Delivery status could not be updated.",
      );
    } finally {
      setUpdatingStop(null);
    }
  }

  return (
    <section className="driver-dashboard" aria-labelledby="driver-title">
      <div className="driver-welcome">
        <div>
          <p className="driver-eyebrow">{todayLabel}</p>
          <h1 id="driver-title">Welcome, {driverName.split(/\s+/)[0]}</h1>
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

      {loadError && <p role="alert">{loadError}</p>}
      {actionError && <p role="alert">{actionError}</p>}
      {loading && <p role="status">Loading assigned delivery stops…</p>}
      {route.some((stop) => stop.id.startsWith("DEMO-")) && (
        <p className="driver-prototype-note" role="status">
          Demonstration route records are shown.
        </p>
      )}

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
                disabled={updatingStop === delivery.id}
              />
            ))}
          </div>
        ) : !loading && (
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
