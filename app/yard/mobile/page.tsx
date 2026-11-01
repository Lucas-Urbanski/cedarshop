"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Package,
  Camera,
  ClipboardList,
  ArrowRight,
  Download,
  Smartphone,
  Check,
  MapPin,
} from "lucide-react";

import { useYard } from "@/components/yard/YardProvider";
import {
  YardHeading,
  YardBadge,
  shortDate,
} from "@/components/yard/YardUI";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function YardMobilePage() {
  const { data, update } = useYard();

  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };

    const installationFinished = () => {
      setInstalled(true);
      setInstall(null);
    };

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installationFinished);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", installationFinished);
    };
  }, []);

  async function installApp() {
    if (!install) {
      setHelp(!help);
      return;
    }

    try {
      await install.prompt();
      await install.userChoice;
      setInstall(null);
    } catch {
      setHelp(true);
    }
  }

  const activeOrders = data.orders.filter(
    (order) => order.status !== "Completed",
  );

  return (
    <>
      <YardHeading
        eyebrow="ON THE GO"
        title="Your yard, in your pocket."
        description="Quick actions for a busy day on the floor."
      />

      <div className="yard-mobile-grid">
        <div>
          <section className="yard-mobile-hero">
            <div>
              <MapPin size={18} />
              Yard & workshop
            </div>

            <h2>Ready for the next job?</h2>

            <p>
              <strong>{activeOrders.length}</strong> open work orders
              <span>•</span>
              {data.losses.length} loss reports pending
            </p>
          </section>

          <div className="yard-quick-grid">
            <Link href="/yard/inventory">
              <Package size={27} />
              <strong>Check stock</strong>
              <span>Find & update lumber</span>
              <ArrowRight size={18} />
            </Link>

            <Link href="/yard/losses">
              <Camera size={27} />
              <strong>Report damage</strong>
              <span>Photo & loss details</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          <section className="yard-panel">
            <div className="yard-section-head">
              <div>
                <h2>Next work orders</h2>
                <p>Measurements at your fingertips</p>
              </div>

              <Link href="/yard/work-orders">
                All jobs <ArrowRight size={16} />
              </Link>
            </div>

            {activeOrders.slice(0, 3).map((order) => (
              <article key={order.id} className="yard-mobile-job">
                <div>
                  <small>
                    {order.id} · Due {shortDate(order.due)}
                  </small>

                  <YardBadge
                    tone={order.priority === "High" ? "amber" : "muted"}
                  >
                    {order.priority}
                  </YardBadge>
                </div>

                <h3>{order.title}</h3>

                <p>
                  {order.quantity} pieces · Cut {order.cutLength} in ·
                  Offcut {order.dropCut} in
                </p>

                <button
                  className="yard-button secondary yard-full"
                  onClick={() => {
                    const status =
                      order.status === "Queued" ? "In progress" : "Completed";

                    update(
                      (current) => ({
                        ...current,
                        orders: current.orders.map((item) =>
                          item.id === order.id
                            ? { ...item, status }
                            : item,
                        ),
                      }),
                      `${order.id}: marked ${status.toLowerCase()}.`,
                    );
                  }}
                >
                  {order.status === "Queued" ? (
                    <ClipboardList size={18} />
                  ) : (
                    <Check size={18} />
                  )}

                  {order.status === "Queued"
                    ? "Start work order"
                    : "Mark completed"}
                </button>
              </article>
            ))}

            {!activeOrders.length && (
              <p className="yard-empty">All work orders are complete.</p>
            )}
          </section>
        </div>

        <aside className="yard-mobile-aside">
          <section className="yard-install-card">
            <span className="yard-install-icon">
              <Smartphone size={38} />
            </span>

            <p className="yard-eyebrow">CEDAR YARD PWA</p>

            <h2>
              One tap.
              <br />
              Back to work.
            </h2>

            <p>
              Add this workspace to your phone’s home screen for quick access
              in the yard.
            </p>

            <button
              className="yard-button yard-full"
              disabled={installed}
              onClick={installApp}
            >
              {installed ? <Check size={18} /> : <Download size={18} />}
              {installed ? "App installed" : "Install / setup"}
            </button>

            {help && (
              <div className="yard-install-help">
                <strong>Open on your phone</strong>

                <p>
                  On iPhone, open in Safari, tap Share, then Add to Home
                  Screen. On Android, use Chrome’s menu and choose Install
                  app or Add to Home screen when available.
                </p>

                <p>
                  Installation needs HTTPS or localhost. If the option is
                  missing, use the site in your browser.
                </p>
              </div>
            )}
          </section>

          <section className="yard-panel yard-mobile-note">
            <h3>Made for quick yard tasks</h3>

            <ul>
              <li>Large controls for phone screens</li>
              <li>Camera attachment on supported devices</li>
              <li>Demo changes saved on this device</li>
            </ul>

            <p>
              Offline navigation shows a reconnect page. Full offline editing
              and Firebase sync are planned.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}