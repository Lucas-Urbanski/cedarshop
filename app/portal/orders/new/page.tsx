
"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewOrderPage() {
  const [form, setForm] = useState({
    productType: "",
    dimensions: "",
    quantity: "1",
    unit: "pieces",
    deliveryDate: "",
    deliveryAddress: "",
    notes: "",
  });

  const [message, setMessage] = useState("");

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(
      "Your order request has been submitted for this demo. It has not been saved to the database."
    );

    setForm({
      productType: "",
      dimensions: "",
      quantity: "1",
      unit: "pieces",
      deliveryDate: "",
      deliveryAddress: "",
      notes: "",
    });
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/portal/orders"
            className="text-sm font-medium text-green-800 hover:underline"
          >
            ← Back to Orders
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            New Order Request
          </h1>

          <p className="mt-2 text-gray-600">
            Tell us what lumber you need and how you would like it delivered.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Lumber Requirements
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Specify the product and quantity you need.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label
                htmlFor="productType"
                className="text-sm font-medium text-gray-700"
              >
                Lumber Type
              </label>
              <select
                id="productType"
                name="productType"
                value={form.productType}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Select lumber type</option>
                <option value="Pine">Pine</option>
                <option value="Cedar">Cedar</option>
                <option value="Spruce">Spruce</option>
                <option value="Plywood">Plywood</option>
                <option value="Other">Other / Special Request</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="dimensions"
                className="text-sm font-medium text-gray-700"
              >
                Dimensions / Specifications
              </label>
              <input
                id="dimensions"
                name="dimensions"
                value={form.dimensions}
                onChange={handleChange}
                placeholder="e.g. 2x4, 8 feet long"
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-gray-700"
                >
                  Quantity
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="unit"
                  className="text-sm font-medium text-gray-700"
                >
                  Unit
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="pieces">Pieces</option>
                  <option value="bundles">Bundles</option>
                  <option value="sheets">Sheets</option>
                  <option value="board feet">Board feet</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Delivery Details
              </h2>
            </div>

            <div>
              <label
                htmlFor="deliveryDate"
                className="text-sm font-medium text-gray-700"
              >
                Preferred Delivery Date
              </label>
              <input
                id="deliveryDate"
                name="deliveryDate"
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={form.deliveryDate}
                onChange={handleChange}
                required
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-500">
                This is your preferred date, not a confirmed delivery booking.
              </p>
            </div>

            <div>
              <label
                htmlFor="deliveryAddress"
                className="text-sm font-medium text-gray-700"
              >
                Delivery Address
              </label>
              <input
                id="deliveryAddress"
                name="deliveryAddress"
                value={form.deliveryAddress}
                onChange={handleChange}
                placeholder="Enter the delivery address"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="text-sm font-medium text-gray-700"
              >
                Additional Instructions
              </label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Special requirements or instructions..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">

          <Link
            href="/portal/orders"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-center text-sm font-semibold hover:bg-gray-100"
          >
            Cancel
          </Link>


            <button
              type="submit"
              className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
            >
              Submit Order Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
