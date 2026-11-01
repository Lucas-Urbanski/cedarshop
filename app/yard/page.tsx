"use client";

import Link from "next/link";
import {
  ArrowRight,
  Package,
  ClipboardList,
  TriangleAlert,
  MapPin,
  Smartphone,
  Trees,
  ArrowUpRight,
} from "lucide-react";

import { useYard } from "@/components/yard/YardProvider";
import {
  YardHeading,
  YardBadge,
  shortDate,
} from "@/components/yard/YardUI";

export default function YardOverview() {
  const { data } = useYard();

  const lowStock = data.inventory.filter(
    (item) => item.quantity < item.minimum,
  );

  const activeOrders = data.orders.filter(
    (order) => order.status !== "Completed",
  );

  const metrics = [
    {
      label: "Pieces on hand",
      value: data.inventory.reduce((sum, item) => sum + item.quantity, 0),
      note: `${data.inventory.length} stock lines across 3 areas`,
      icon: Package,
    },
    {
      label: "Open work orders",
      value: activeOrders.length,
      note: `${
        activeOrders.filter((order) => order.status === "In progress").length
      } currently in progress`,
      icon: ClipboardList,
    },
    {
      label: "Low-stock items",
      value: lowStock.length,
      note: "Below minimum stock level",
      icon: TriangleAlert,
    },
    {
      label: "Loss reports",
      value: data.losses.length,
      note: "Awaiting review · local demo",
      icon: MapPin,
    },
  ];

  return (
    <>
      <YardHeading
        eyebrow="YOUR DAILY WORKSPACE"
        title="Yard overview"
        description="A clear view of the stock and work ahead."
      >
        <Link className="yard-button" href="/yard/mobile">
          <Smartphone size={18} />
          Open mobile workspace
        </Link>
      </YardHeading>

      <section className="yard-welcome">
        <div>
          <span className="yard-welcome-kicker">
            FROM THE YARD TO THE WORKSHOP
          </span>

          <h2>Keep the day moving.</h2>

          <p>
            Check your stock. Prepare the next order.
            <br />
            Keep your crew in the loop.
          </p>

          <Link href="/yard/work-orders">
            View work orders <ArrowRight size={18} />
          </Link>
        </div>

        <div className="yard-wood-art" aria-hidden="true">
          <Trees size={116} strokeWidth={1} />
          <span>THE CEDAR SHOP</span>
          <small>YARD OPERATIONS</small>
        </div>
      </section>

      <section className="yard-metrics" aria-label="Yard summary">
        {metrics.map(({ label, value, note, icon: Icon }) => (
          <article key={label}>
            <div className="yard-metric-label">
              {label}
              <Icon size={19} />
            </div>

            <strong>{value}</strong>
            <p>{note}</p>
          </article>
        ))}
      </section>

      <div className="yard-columns">
        <section className="yard-panel">
          <div className="yard-section-head">
            <div>
              <h2>Work order queue</h2>
              <p>Next up in the workshop</p>
            </div>

            <Link href="/yard/work-orders">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="yard-order-list">
            {activeOrders.length ? (
              activeOrders.slice(0, 3).map((order) => (
                <Link
                  href="/yard/work-orders"
                  className="yard-order-row"
                  key={order.id}
                >
                  <span className="yard-square-icon">
                    <ClipboardList size={21} />
                  </span>

                  <div>
                    <small>
                      {order.id} · Due {shortDate(order.due)}
                    </small>
                    <h3>{order.title}</h3>
                    <p>
                      {order.quantity} pieces · {order.cutLength} in cut length
                    </p>
                  </div>

                  <YardBadge
                    tone={order.status === "In progress" ? "green" : "muted"}
                  >
                    {order.status}
                  </YardBadge>
                </Link>
              ))
            ) : (
              <p className="yard-empty">All work orders are complete.</p>
            )}
          </div>
        </section>

        <section className="yard-panel">
          <div className="yard-section-head">
            <div>
              <h2>Needs attention</h2>
              <p>Check before the next job</p>
            </div>

            <span className="yard-count">{lowStock.length}</span>
          </div>

          {lowStock.map((item) => (
            <div className="yard-alert-row" key={item.id}>
              <TriangleAlert size={18} />

              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.quantity} pieces left · Bay {item.bay}
                </p>
              </div>

              <Link
                href="/yard/inventory"
                aria-label={`Review ${item.name}`}
              >
                <ArrowRight size={18} />
              </Link>
            </div>
          ))}

          {!lowStock.length && (
            <p className="yard-empty">
              All stock lines are above their minimum.
            </p>
          )}

          <Link href="/yard/losses" className="yard-report-link">
            Found damaged lumber?
            <span>
              Log a loss report <ArrowRight size={16} />
            </span>
          </Link>
        </section>
      </div>

      <section className="yard-panel yard-activity">
        <div className="yard-section-head">
          <div>
            <h2>Recent activity</h2>
            <p>Changes made in this demo workspace</p>
          </div>

          <YardBadge tone="muted">Device only</YardBadge>
        </div>

        {data.activity.slice(0, 4).map((item) => (
          <div key={item.id} className="yard-activity-row">
            <span className="yard-dot" />
            <p>{item.text}</p>
            <time dateTime={item.at}>{shortDate(item.at)}</time>
          </div>
        ))}
      </section>
    </>
  );
}