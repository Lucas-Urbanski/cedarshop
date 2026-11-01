"use client";

import { useState, type FormEvent } from "react";
import {
  Search,
  SlidersHorizontal,
  Package,
  MapPin,
} from "lucide-react";

import { useYard } from "@/components/yard/YardProvider";
import {
  YardHeading,
  YardBadge,
  YardDialog,
  EmptyState,
} from "@/components/yard/YardUI";

import type { YardStock, YardLocation } from "@/types/yard";

export default function InventoryPage() {
  const { data, update } = useYard();

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All locations");
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState<YardStock | null>(null);
  const [error, setError] = useState("");

  const items = data.inventory.filter((item) => {
    const matchesSearch =
      `${item.name} ${item.id} ${item.bay}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesLocation =
      location === "All locations" || item.location === location;

    const matchesStock = !lowOnly || item.quantity < item.minimum;

    return matchesSearch && matchesLocation && matchesStock;
  });

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing) return;

    const form = new FormData(event.currentTarget);
    const quantity = Number(form.get("quantity"));
    const bay = String(form.get("bay")).trim();
    const reason = String(form.get("reason")).trim();
    const nextLocation = String(form.get("location")) as YardLocation;

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 0 ||
      !bay ||
      !reason
    ) {
      setError("Enter a valid whole-piece count, bay and reason.");
      return;
    }

    const saved = update(
      (current) => ({
        ...current,
        inventory: current.inventory.map((item) =>
          item.id === editing.id
            ? { ...item, quantity, bay, location: nextLocation }
            : item,
        ),
      }),
      `${editing.id}: stock set to ${quantity} pieces, ${nextLocation} / ${bay}. Reason: ${reason}`,
    );

    if (saved) {
      setEditing(null);
    } else {
      setError("Save failed. Check available device storage and try again.");
    }
  }

  return (
    <>
      <YardHeading
        eyebrow="STOCK & STORAGE"
        title="Yard inventory"
        description="Find lumber, check availability and keep stock counts up to date."
      />

      <div className="yard-location-grid">
        {["Outdoor yard", "Warehouse", "Kiln"].map((area) => (
          <button
            key={area}
            onClick={() =>
              setLocation(location === area ? "All locations" : area)
            }
            className={`yard-location-card ${
              location === area ? "selected" : ""
            }`}
            aria-pressed={location === area}
          >
            <MapPin size={21} />

            <span>
              <strong>{area}</strong>
              <small>
                {data.inventory
                  .filter((item) => item.location === area)
                  .reduce((sum, item) => sum + item.quantity, 0)}{" "}
                pieces on hand
              </small>
            </span>
          </button>
        ))}
      </div>

      <section className="yard-panel">
        <div className="yard-toolbar">
          <label className="yard-search">
            <Search size={18} />
            <input
              aria-label="Search inventory"
              placeholder="Search product, SKU or bay…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            aria-label="Filter storage location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            {["All locations", "Outdoor yard", "Warehouse", "Kiln"].map(
              (area) => <option key={area}>{area}</option>,
            )}
          </select>

          <button
            className={`yard-button secondary ${lowOnly ? "selected" : ""}`}
            aria-pressed={lowOnly}
            onClick={() => setLowOnly(!lowOnly)}
          >
            <SlidersHorizontal size={16} />
            Low stock
          </button>
        </div>

        <div className="yard-section-head">
          <h2>
            Stock list
            <span className="yard-inline-count">{items.length}</span>
          </h2>
          <span className="yard-muted">Quantity in pieces</span>
        </div>

        <div className="yard-table-wrap">
          <table className="yard-table">
            <thead>
              <tr>
                <th>Product / SKU</th>
                <th>Storage</th>
                <th>On hand</th>
                <th>Status</th>
                <th>
                  <span className="yard-sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="yard-product">
                      <span className="yard-square-icon">
                        <Package size={21} />
                      </span>

                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          {item.id} · {item.dimensions}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>
                    {item.location}
                    <small>Bay {item.bay}</small>
                  </td>

                  <td>
                    <strong>{item.quantity}</strong>
                    <small>Min. {item.minimum}</small>
                  </td>

                  <td>
                    <YardBadge
                      tone={item.quantity < item.minimum ? "amber" : "green"}
                    >
                      {item.quantity < item.minimum ? "Low stock" : "In stock"}
                    </YardBadge>
                  </td>

                  <td>
                    <button
                      className="yard-button secondary"
                      aria-label={`Update ${item.name}`}
                      onClick={() => {
                        setEditing(item);
                        setError("");
                      }}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!items.length && (
          <EmptyState>
            No stock matches these filters. Try another product or location.
          </EmptyState>
        )}
      </section>

      {editing && (
        <YardDialog
          title="Update inventory"
          onClose={() => setEditing(null)}
        >
          <form className="yard-form" onSubmit={save}>
            <p>
              {editing.name} · {editing.id}
            </p>

            <label>
              Count on hand (pieces)
              <input
                name="quantity"
                type="number"
                min="0"
                max="1000000"
                step="1"
                required
                defaultValue={editing.quantity}
              />
            </label>

            <div className="yard-form-grid">
              <label>
                Storage location
                <select name="location" defaultValue={editing.location}>
                  {["Outdoor yard", "Warehouse", "Kiln"].map((area) => (
                    <option key={area}>{area}</option>
                  ))}
                </select>
              </label>

              <label>
                Bay / rack
                <input
                  name="bay"
                  required
                  maxLength={24}
                  defaultValue={editing.bay}
                />
              </label>
            </div>

            <label>
              Reason for adjustment
              <textarea
                name="reason"
                required
                maxLength={240}
                placeholder="For example: physical stock count completed"
              />
            </label>

            <p className="yard-helper">
              Use a loss report for damage awaiting review. This form changes
              the demo stock count immediately.
            </p>

            {error && (
              <p className="yard-form-error" role="alert">{error}</p>
            )}

            <div className="yard-form-actions">
              <button
                type="button"
                className="yard-button secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>

              <button className="yard-button" type="submit">
                Save inventory
              </button>
            </div>
          </form>
        </YardDialog>
      )}
    </>
  );
}