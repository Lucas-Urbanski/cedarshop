"use client";

import { useState, type FormEvent } from "react";
import {
  Plus,
  ClipboardList,
  CalendarDays,
  ArrowRight,
  Check,
} from "lucide-react";

import { useYard } from "@/components/yard/YardProvider";
import {
  YardHeading,
  YardBadge,
  YardDialog,
  EmptyState,
  shortDate,
} from "@/components/yard/YardUI";

import { newYardId } from "@/utils/yardData";
import type { YardWorkOrder } from "@/types/yard";

export default function WorkOrdersPage() {
  const { data, update } = useYard();

  const [filter, setFilter] = useState("All orders");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const orders = data.orders.filter(
    (order) => filter === "All orders" || order.status === filter,
  );

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title")).trim();
    const quantity = Number(form.get("quantity"));
    const cutLength = Number(form.get("cutLength"));
    const dropCut = Number(form.get("dropCut"));

    if (
      !title ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(cutLength) ||
      cutLength <= 0 ||
      !Number.isFinite(dropCut) ||
      dropCut < 0
    ) {
      setError(
        "Enter a title, a positive whole-piece quantity and valid measurements.",
      );
      return;
    }

    const order: YardWorkOrder = {
      id: newYardId("WO"),
      title,
      quantity,
      cutLength,
      dropCut,
      stockId: String(form.get("stockId")),
      due: String(form.get("due")),
      priority: String(form.get("priority")) as YardWorkOrder["priority"],
      status: "Queued",
      notes: String(form.get("notes")).trim(),
    };

    const saved = update(
      (current) => ({
        ...current,
        orders: [order, ...current.orders],
      }),
      `${order.id}: ${title} added to the work queue.`,
    );

    if (saved) {
      setCreating(false);
    } else {
      setError("Save failed. Check available device storage and try again.");
    }
  }

  function advance(order: YardWorkOrder) {
    const status =
      order.status === "Queued" ? "In progress" : "Completed";

    update(
      (current) => ({
        ...current,
        orders: current.orders.map((item) =>
          item.id === order.id ? { ...item, status } : item,
        ),
      }),
      `${order.id}: marked ${status.toLowerCase()}.`,
    );
  }

  return (
    <>
      <YardHeading
        eyebrow="IN THE WORKSHOP"
        title="Work orders"
        description="Track custom millwork from the first measurement to the final cut."
      >
        <button
          className="yard-button"
          onClick={() => {
            setCreating(true);
            setError("");
          }}
        >
          <Plus size={18} />
          New work order
        </button>
      </YardHeading>

      <div className="yard-tabs" aria-label="Filter work orders">
        {["All orders", "Queued", "In progress", "Completed"].map((status) => (
          <button
            key={status}
            aria-pressed={filter === status}
            className={filter === status ? "active" : ""}
            onClick={() => setFilter(status)}
          >
            {status}
            <span>
              {data.orders.filter(
                (order) => status === "All orders" || order.status === status,
              ).length}
            </span>
          </button>
        ))}
      </div>

      <div className="yard-work-grid">
        {orders.map((order) => (
          <article className="yard-panel yard-work-card" key={order.id}>
            <div className="yard-work-top">
              <span className="yard-square-icon">
                <ClipboardList size={22} />
              </span>

              <span className="yard-muted">{order.id}</span>

              <YardBadge tone={order.priority === "High" ? "amber" : "muted"}>
                {order.priority} priority
              </YardBadge>
            </div>

            <h2>{order.title}</h2>
            <p>
              {data.inventory.find((item) => item.id === order.stockId)?.name}
              {" · "}
              {order.stockId}
            </p>

            <div className="yard-measurements">
              <div>
                <small>Quantity</small>
                <strong>{order.quantity} <span>pcs</span></strong>
              </div>

              <div>
                <small>Cut length</small>
                <strong>{order.cutLength} <span>in</span></strong>
              </div>

              <div>
                <small>Drop-cut / pc</small>
                <strong>{order.dropCut} <span>in</span></strong>
              </div>
            </div>

            <p className="yard-work-notes">
              {order.notes || "No additional instructions."}
            </p>

            <div className="yard-work-due">
              <span>
                <CalendarDays size={16} />
                Due {shortDate(order.due)}
              </span>

              <YardBadge tone={order.status === "Queued" ? "muted" : "green"}>
                {order.status}
              </YardBadge>
            </div>

            {order.status !== "Completed" ? (
              <button
                className="yard-button secondary yard-full"
                onClick={() => advance(order)}
              >
                {order.status === "Queued"
                  ? "Start work order"
                  : "Mark completed"}
                <ArrowRight size={17} />
              </button>
            ) : (
              <div className="yard-complete">
                <Check size={18} />
                Work completed
              </div>
            )}
          </article>
        ))}
      </div>

      {!orders.length && (
        <EmptyState>No work orders in this view.</EmptyState>
      )}

      <p className="yard-helper">
        Drop-cut is the recorded offcut length per piece. This prototype
        tracks work status; it does not reserve or deduct inventory.
      </p>

      {creating && (
        <YardDialog
          title="New work order"
          onClose={() => setCreating(false)}
        >
          <form className="yard-form" onSubmit={save}>
            <label>
              Job title
              <input
                name="title"
                required
                maxLength={80}
                placeholder="For example: fence board cut-down"
              />
            </label>

            <label>
              Lumber product
              <select name="stockId">
                {data.inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.id}
                  </option>
                ))}
              </select>
            </label>

            <div className="yard-form-grid">
              <label>
                Quantity (pieces)
                <input
                  name="quantity"
                  type="number"
                  required
                  min="1"
                  max="100000"
                  step="1"
                />
              </label>

              <label>
                Due date
                <input name="due" type="date" required />
              </label>

              <label>
                Finished cut length (in)
                <input
                  name="cutLength"
                  type="number"
                  required
                  min="0.01"
                  max="10000"
                  step="0.01"
                />
              </label>

              <label>
                Drop-cut per piece (in)
                <input
                  name="dropCut"
                  type="number"
                  required
                  min="0"
                  max="10000"
                  step="0.01"
                  defaultValue="0"
                />
              </label>
            </div>

            <label>
              Priority
              <select name="priority">
                <option>Normal</option>
                <option>High</option>
              </select>
            </label>

            <label>
              Instructions
              <textarea
                name="notes"
                maxLength={600}
                placeholder="Measurements, finishing or staging instructions…"
              />
            </label>

            {error && (
              <p className="yard-form-error" role="alert">{error}</p>
            )}

            <div className="yard-form-actions">
              <button
                type="button"
                className="yard-button secondary"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>

              <button type="submit" className="yard-button">
                Create work order
              </button>
            </div>
          </form>
        </YardDialog>
      )}
    </>
  );
}