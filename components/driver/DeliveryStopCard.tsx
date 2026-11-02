import { Check, Clock3, MapPin, Package, Phone } from "lucide-react";
import type { DriverDelivery } from "@/data/Delivery";

export default function DeliveryStopCard({
  delivery,
  onAdvanceStatus,
  disabled = false,
}: {
  delivery: DriverDelivery;
  onAdvanceStatus: (deliveryId: string) => void;
  disabled?: boolean;
}) {
  const itemCount = delivery.items.reduce((total, item) => total + item.quantity, 0);

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
        <span className={`driver-status status-${delivery.status.toLowerCase().replace(" ", "-")}`}>
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
        <span className="driver-detail-icon"><MapPin size={18} aria-hidden="true" /></span>
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
          <span><Package size={16} aria-hidden="true" /> Load details</span>
          <strong>{itemCount} pieces</strong>
        </div>
        <ul>
          {delivery.items.map((item) => (
            <li key={`${item.name}-${item.unit}`}>
              <span>{item.name}</span>
              <strong>{item.quantity} {item.unit}</strong>
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
