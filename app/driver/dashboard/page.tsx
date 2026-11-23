"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Phone,
  Route,
  Search,
  Truck,
} from "lucide-react";
import { doc, runTransaction, where } from "firebase/firestore";

import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import useAuthDisplayName from "@/hooks/useAuthDisplayName";
import type {
  DeliveryRecord,
  DeliveryStopCardProps,
  DriverStatusFilter,
  DriverStopStatus,
} from "@/types/types";
import { auth, db } from "@/utils/firebase";

const noSubscription = () => () => {};

// Prerendering happens at build time, so there is no visitor timezone yet. The
// empty server snapshot keeps the static markup and first client render equal.
function readLocalToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

const readServerToday = () => "";

function useLocalToday() {
  return useSyncExternalStore(noSubscription, readLocalToday, readServerToday);
}

function DeliveryStopCard({
  delivery,
  onAdvanceStatus,
  disabled = false,
}: DeliveryStopCardProps) {
  const itemCount = delivery.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <article
      className={`driver-stop-card${delivery.status === "Delivered" ? " is-delivered" : ""}`}
      aria-labelledby={`stop-${delivery.id}`}
    >
      <div className="driver-stop-head">
        <div>
          <p className="driver-stop-kicker">ORDER {delivery.orderId}</p>
          <h3 id={`stop-${delivery.id}`}>{delivery.customer}</h3>
        </div>
        <span
          className={`driver-status status-${delivery.status.toLowerCase().replace(" ", "-")}`}
        >
          {delivery.status}
        </span>
      </div>

      <div className="driver-stop-time">
        <Clock3 size={16} aria-hidden="true" />
        <span>{delivery.scheduledTime}</span>
        <span className="driver-stop-separator">·</span>
        <span>Stop {delivery.id}</span>
      </div>

      <div className="driver-stop-address">
        <span className="driver-detail-icon">
          <MapPin size={18} aria-hidden="true" />
        </span>
        <div>
          <strong>{delivery.address}</strong>
          <span>{delivery.city}</span>
        </div>
        <a
          className="driver-map-link"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${delivery.address}, ${delivery.city}`)}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open map to ${delivery.address}, ${delivery.city}`}
        >
          Directions
        </a>
      </div>

      <div className="driver-items">
        <div className="driver-items-heading">
          <span>
            <Package size={16} aria-hidden="true" /> Load details
          </span>
          <strong>{itemCount} pieces</strong>
        </div>
        <ul>
          {delivery.items.map((item) => (
            <li key={`${item.name}-${item.unit}`}>
              <span>{item.name}</span>
              <strong>
                {item.quantity} {item.unit}
              </strong>
            </li>
          ))}
        </ul>
      </div>

      {delivery.instructions && (
        <p className="driver-instructions">
          <strong>Delivery note</strong>
          {delivery.instructions}
        </p>
      )}

      <div className="driver-stop-actions">
        <a
          className="driver-call-link"
          href={`tel:${delivery.phone}`}
          aria-label={`Call ${delivery.customer}`}
        >
          <Phone size={16} aria-hidden="true" /> Call customer
        </a>
        <button
          type="button"
          className="driver-complete-button"
          onClick={() => onAdvanceStatus(delivery.id)}
          disabled={delivery.status === "Delivered" || disabled}
        >
          <Check size={17} aria-hidden="true" />
          {delivery.status === "Delivered"
            ? "Delivered"
            : delivery.status === "Ready"
              ? "Start delivery"
              : "Mark delivered"}
        </button>
      </div>
    </article>
  );
}

const statusOptions: DriverStatusFilter[] = [
  "All stops",
  "Ready",
  "In Progress",
  "Delivered",
];

export default function DriverDashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DriverStatusFilter>("All stops");
  const [actionError, setActionError] = useState("");
  const [updatingStop, setUpdatingStop] = useState<string | null>(null);
  const today = useLocalToday();
  const todayLabel = today
    ? new Date(`${today}T12:00:00`)
        .toLocaleDateString("en-CA", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    : "";
  const driverName = useAuthDisplayName("Driver");
  const userId = auth.currentUser?.uid ?? "";

  const assignedFilters = useMemo(
    () => [
      where("driverUid", "==", userId),
      where("deliveryDate", "==", today),
    ],
    [today, userId],
  );
  const demoFilters = useMemo(
    () => [where("isDemo", "==", true), where("deliveryDate", "==", today)],
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
    return [...records.values()].map(
      ({ customerUid, driverUid, ...delivery }) => delivery,
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

  const completedStops = route.filter(
    (stop) => stop.status === "Delivered",
  ).length;
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
        </div>
        <div className="driver-welcome-icon" aria-hidden="true">
          <Truck size={42} strokeWidth={1.4} />
        </div>
      </div>

      <div className="driver-metrics" aria-label="Today's route summary">
        <article>
          <span className="driver-metric-icon">
            <Route size={19} />
          </span>
          <div>
            <p>Total stops</p>
            <strong>{route.length}</strong>
          </div>
        </article>
        <article>
          <span className="driver-metric-icon">
            <Package size={19} />
          </span>
          <div>
            <p>Pieces to deliver</p>
            <strong>{remainingPieces}</strong>
          </div>
        </article>
        <article>
          <span className="driver-metric-icon">
            <CheckCircle2 size={19} />
          </span>
          <div>
            <p>Stops completed</p>
            <strong>
              {completedStops}
              <span> / {route.length}</span>
            </strong>
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

      <section
        id="stops"
        className="driver-route-section"
        aria-labelledby="route-title"
      >
        <div className="driver-route-heading">
          <div>
            <p className="driver-eyebrow">YOUR DELIVERY PLAN</p>
            <h2 id="route-title">Today&apos;s route</h2>
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
                setStatusFilter(event.target.value as DriverStatusFilter)
              }
              aria-label="Filter stops by status"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
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
        ) : (
          !loading && (
            <div className="driver-empty-state">
              <Package size={26} aria-hidden="true" />
              <strong>No stops found</strong>
              <p>Try a different search or status filter.</p>
            </div>
          )
        )}
      </section>
    </section>
  );
}
