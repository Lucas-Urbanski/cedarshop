"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import type {
  InventoryRecord,
  ProductRecord,
} from "@/types/business";
import type { YardLocation } from "@/types/yard";
import {
  createInventoryProduct,
  receiveInventory,
} from "@/utils/inventory";
import "@/styles/inventory.css";

const locations: readonly YardLocation[] = [
  "Outdoor yard",
  "Warehouse",
  "Kiln",
];

interface AddInventoryDialogProps {
  products: ProductRecord[];
  inventory: InventoryRecord[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

type AddMode = "existing" | "new";

function isYardLocation(value: string): value is YardLocation {
  return locations.some((location) => location === value);
}

function readDetails(form: FormData) {
  const dimensions = String(form.get("dimensions") ?? "").trim();
  const locationValue = String(form.get("location") ?? "");
  const bay = String(form.get("bay") ?? "").trim();
  const minimum = Number(form.get("minimum"));

  if (
    !dimensions ||
    !isYardLocation(locationValue) ||
    !bay ||
    !Number.isSafeInteger(minimum) ||
    minimum < 0 ||
    minimum > 1_000_000
  ) {
    throw new Error("Enter valid dimensions, location, bay and minimum stock.");
  }

  return { dimensions, location: locationValue, bay, minimum };
}

function readPositiveQuantity(form: FormData) {
  const quantity = Number(form.get("quantity"));
  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    quantity > 1_000_000
  ) {
    throw new Error("Enter a whole quantity between 1 and 1,000,000.");
  }
  return quantity;
}

export default function AddInventoryDialog({
  products,
  inventory,
  onClose,
  onSaved,
}: AddInventoryDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<AddMode>(
    products.length ? "existing" : "new",
  );
  const [selectedSku, setSelectedSku] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeSku = selectedSku || products[0]?.id || "";
  const selectedProduct = products.find((product) => product.id === activeSku);
  const selectedInventory = inventory.find((record) => record.id === activeSku);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    let savedMessage: string | null = null;

    try {
      const form = new FormData(event.currentTarget);
      const quantity = readPositiveQuantity(form);

      if (mode === "new") {
        const sku = String(form.get("sku") ?? "").trim().toUpperCase();
        const name = String(form.get("name") ?? "").trim();
        const price = Number(form.get("price"));
        if (!name || !Number.isFinite(price) || price < 0) {
          throw new Error("Enter a product name and a valid non-negative sale price.");
        }

        await createInventoryProduct({
          sku,
          name,
          price,
          quantity,
          ...readDetails(form),
        });
        savedMessage = `Created ${name} (${sku}) with ${quantity} pieces in inventory.`;
      } else {
        const sku = String(form.get("sku") ?? "");
        if (!sku || !selectedProduct) {
          throw new Error("Choose a catalog product to receive.");
        }

        await receiveInventory(
          sku,
          quantity,
          selectedInventory ? undefined : readDetails(form),
        );
        savedMessage = `Added ${quantity} pieces of ${selectedProduct.name} (${selectedProduct.id}) to inventory.`;
      }
    } catch (caughtError) {
      console.error("Could not add inventory.", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Inventory could not be saved. Check your connection and try again.",
      );
    } finally {
      if (savedMessage) onSaved(savedMessage);
      else setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="inventory-dialog"
      aria-labelledby="add-inventory-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
    >
      <header className="inventory-dialog-header">
        <div>
          <p className="inventory-dialog-eyebrow">STOCK MANAGEMENT</p>
          <h2 id="add-inventory-title">Add inventory</h2>
        </div>
        <button
          className="inventory-close-button"
          type="button"
          aria-label="Close dialog"
          disabled={saving}
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="inventory-dialog-content">
        <div
          className="inventory-mode-switch"
          role="group"
          aria-label="Inventory action"
        >
          <button
            type="button"
            aria-pressed={mode === "existing"}
            disabled={saving}
            onClick={() => {
              setMode("existing");
              setError("");
            }}
          >
            Receive existing product
          </button>
          <button
            type="button"
            aria-pressed={mode === "new"}
            disabled={saving}
            onClick={() => {
              setMode("new");
              setError("");
            }}
          >
            Create product
          </button>
        </div>

        <form className="inventory-form" onSubmit={submit}>
          {mode === "new" ? (
            <>
              <p className="inventory-form-hint">
                Creates a catalog product and its first inventory record.
              </p>
              <div className="inventory-form-grid">
                <label className="inventory-field">
                  SKU
                  <input
                    name="sku"
                    required
                    maxLength={64}
                    pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,63}"
                    title="Use letters, numbers, dots, underscores or hyphens."
                    autoComplete="off"
                  />
                </label>
                <label className="inventory-field">
                  Product name
                  <input name="name" required maxLength={120} />
                </label>
                <label className="inventory-field">
                  Sale price (CAD)
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                </label>
                <label className="inventory-field">
                  Initial quantity (pieces)
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max="1000000"
                    step="1"
                    required
                  />
                </label>
              </div>
              <StockDetailsFields />
            </>
          ) : products.length ? (
            <>
              <p className="inventory-form-hint">
                Add received pieces to an existing product. Existing stock
                location details stay unchanged.
              </p>
              <label className="inventory-field">
                Catalog product
                <select
                  name="sku"
                  required
                  value={activeSku}
                  onChange={(event) => setSelectedSku(event.target.value)}
                >
                  {products.map((product) => {
                    const stock = inventory.find(
                      (record) => record.id === product.id,
                    );
                    return (
                      <option key={product.id} value={product.id}>
                        {product.name} · {product.id}
                        {stock ? ` · ${stock.quantity} on hand` : " · no stock record"}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="inventory-field">
                Quantity received (pieces)
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max="1000000"
                  step="1"
                  required
                />
              </label>
              {selectedInventory ? (
                <p className="inventory-form-hint">
                  Current stock: {selectedInventory.quantity} pieces ·{" "}
                  {selectedInventory.location}, bay {selectedInventory.bay}
                </p>
              ) : (
                <>
                  <p className="inventory-form-hint">
                    This product has no stock record yet. Add its storage
                    details to create one.
                  </p>
                  <StockDetailsFields />
                </>
              )}
            </>
          ) : (
            <p className="inventory-form-hint">
              No catalog products exist yet. Create a product first.
            </p>
          )}

          {error && (
            <p className="inventory-form-error" role="alert">
              {error}
            </p>
          )}

          <div className="inventory-form-actions">
            <button
              className="inventory-secondary-button"
              type="button"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="inventory-primary-button"
              type="submit"
              disabled={
                saving || (mode === "existing" && products.length === 0)
              }
            >
              {saving ? "Saving…" : mode === "new" ? "Create inventory" : "Receive stock"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function StockDetailsFields() {
  return (
    <div className="inventory-form-grid">
      <label className="inventory-field">
        Dimensions
        <input
          name="dimensions"
          required
          maxLength={80}
          placeholder="e.g. 2 × 4 · 8 ft"
        />
      </label>
      <label className="inventory-field">
        Storage location
        <select name="location" defaultValue="Outdoor yard">
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </label>
      <label className="inventory-field">
        Bay / rack
        <input name="bay" required maxLength={24} />
      </label>
      <label className="inventory-field">
        Minimum stock
        <input
          name="minimum"
          type="number"
          min="0"
          max="1000000"
          step="1"
          required
        />
      </label>
    </div>
  );
}
