
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  ShoppingCart,
  Plus,
  Trash2,
  FileText,
  ArrowLeft,
} from "lucide-react";

type Product = {
  id: number;
  sku: string;
  name: string;
  price: number;
  quantity: number;
};

type QuoteItem = {
  product: Product;
  quantity: number;
};

const products: Product[] = [
  {
    id: 1,
    sku: "CED-001",
    name: "2x4 Western Red Cedar - 8ft",
    price: 12.4,
    quantity: 762,
  },
  {
    id: 2,
    sku: "CED-002",
    name: "2x6 Western Red Cedar - 10ft",
    price: 19.99,
    quantity: 340,
  },
  {
    id: 3,
    sku: "CED-003",
    name: "4x4 Cedar Post - 8ft",
    price: 32.5,
    quantity: 125,
  },
];

const money = (amount: number) =>
  amount.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });

export default function SalesDashboard() {
  const [search, setSearch] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");

  const filteredProducts = products.filter((product) =>
    `${product.sku} ${product.name}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const totalStock = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const subtotal = quoteItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  function addToQuote(product: Product) {
    setQuoteItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  product.quantity
                ),
              }
            : item
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: number, value: number) {
    setQuoteItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(
                  item.product.quantity,
                  Math.floor(value) || 1
                )
              ),
            }
          : item
      )
    );
  }

  function removeFromQuote(productId: number) {
    setQuoteItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]";

  const cardClass =
    "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5";

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--header-bg)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              The Cedar Shop
            </p>
            <h1 className="text-2xl font-bold text-white">
              Sales Staff Dashboard
            </h1>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-900"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Introduction */}
        <div>
          <h2 className="text-2xl font-bold">
            Sales Overview
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Check lumber availability and prepare customer quotes.
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Prototype — sample inventory data
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">
                Products
              </span>
              <Package className="text-[var(--accent)]" size={22} />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {products.length}
            </p>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">
                Available Units
              </span>
              <Package className="text-[var(--accent)]" size={22} />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {totalStock.toLocaleString()}
            </p>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">
                Quote Items
              </span>
              <ShoppingCart className="text-[var(--accent)]" size={22} />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {quoteItems.length}
            </p>
          </div>
        </div>

        {/* Inventory */}
        <section className={cardClass}>
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Lumber Inventory
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Search inventory and add lumber to a quote.
            </p>
          </div>

          <div className="relative mb-5">
            <Search
              size={19}
              className="absolute left-3 top-3.5 text-[var(--text-muted)]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name or SKU..."
              aria-label="Search lumber inventory"
              className={`${inputClass} pl-10`}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-[var(--surface-muted)]">
                <tr>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">In Stock</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-raised)]"
                  >
                    <td className="p-4">{product.sku}</td>
                    <td className="p-4 font-medium">
                      {product.name}
                    </td>
                    <td className="p-4">
                      {money(product.price)}
                    </td>
                    <td className="p-4">
                      {product.quantity}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => addToQuote(product)}
                        className="flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 font-semibold text-black hover:bg-amber-300"
                      >
                        <Plus size={16} />
                        Add to Quote
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-[var(--text-muted)]"
                    >
                      No matching products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quote builder */}
        <section className={cardClass}>
          <div className="mb-6 flex items-center gap-3">
            <FileText className="text-[var(--accent)]" size={24} />
            <div>
              <h2 className="text-xl font-bold">
                Customer Quote Builder
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Build a quote using multiple lumber products.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="customer-name"
              className="mb-2 block text-sm font-medium"
            >
              Customer Name
            </label>
            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(event) =>
                setCustomerName(event.target.value)
              }
              placeholder="Enter customer name..."
              className={inputClass}
            />
          </div>

          {quoteItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border-hover)] p-10 text-center">
              <ShoppingCart
                size={30}
                className="mx-auto mb-3 text-[var(--text-muted)]"
              />
              <p className="font-medium">
                Your quote is empty.
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Select Add to Quote from the inventory table.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-[var(--surface-muted)]">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItems.map((item) => (
                    <tr
                      key={item.product.id}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="p-4">
                        {item.product.name}
                      </td>
                      <td className="p-4">
                        {money(item.product.price)}
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          min={1}
                          max={item.product.quantity}
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(
                              item.product.id,
                              Number(event.target.value)
                            )
                          }
                          aria-label={`Quantity for ${item.product.name}`}
                          className="w-20 rounded border border-[var(--border)] bg-[var(--surface-muted)] p-2"
                        />
                      </td>
                      <td className="p-4 font-medium">
                        {money(
                          item.product.price * item.quantity
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() =>
                            removeFromQuote(item.product.id)
                          }
                          aria-label={`Remove ${item.product.name}`}
                          className="rounded p-2 text-red-400 hover:bg-red-950"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="mt-6 ml-auto max-w-md rounded-lg bg-[var(--surface-muted)] p-5">
            <div className="mb-4">
              <label
                htmlFor="discount"
                className="mb-2 block text-sm font-medium"
              >
                Discount (%)
              </label>
              <input
                id="discount"
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={(event) =>
                  setDiscount(
                    Math.max(
                      0,
                      Math.min(
                        100,
                        Number(event.target.value) || 0
                      )
                    )
                  )
                }
                className={inputClass}
              />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Discount ({discount}%)</span>
                <span>-{money(discountAmount)}</span>
              </div>

              <div className="flex justify-between border-t border-[var(--border)] pt-4 text-xl font-bold">
                <span>Estimated Total</span>
                <span className="text-[var(--accent)]">
                  {money(total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setQuoteItems([]);
                setDiscount(0);
                setCustomerName("");
              }}
              disabled={quoteItems.length === 0}
              className="mt-5 w-full rounded-lg border border-[var(--border-hover)] px-4 py-3 font-medium hover:bg-[var(--surface-raised)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear Quote
            </button>
          </div>

          <p className="mt-5 text-xs text-[var(--text-muted)]">
            Prototype estimate only. Taxes and delivery fees
            are excluded. Quotes are not saved to a database.
          </p>
        </section>
      </div>
    </main>
  );
}

