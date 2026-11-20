"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  Check,
  Download,
  Laptop,
  Smartphone,
} from "lucide-react";

import type { InstallPrompt } from "@/types/types";
import "@/styles/download.css";

const desktopReleasesUrl =
  "https://github.com/Lucas-Urbanski/cedarshop/releases";

let knownInstalled = false;
const installedListeners = new Set<() => void>();

function getInstalledSnapshot() {
  return (
    knownInstalled ||
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function notifyInstalled() {
  knownInstalled = true;
  installedListeners.forEach((listener) => listener());
}

function subscribeToInstalledState(listener: () => void) {
  installedListeners.add(listener);
  const displayMode = window.matchMedia("(display-mode: standalone)");
  const updateDisplayMode = () => listener();
  displayMode.addEventListener("change", updateDisplayMode);
  window.addEventListener("appinstalled", notifyInstalled);

  return () => {
    installedListeners.delete(listener);
    displayMode.removeEventListener("change", updateDisplayMode);
    window.removeEventListener("appinstalled", notifyInstalled);
  };
}

export default function DownloadPage() {
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [installError, setInstallError] = useState("");
  const installed = useSyncExternalStore(
    subscribeToInstalledState,
    getInstalledSnapshot,
    () => false,
  );

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };

    window.addEventListener("beforeinstallprompt", capturePrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
    };
  }, []);

  async function installApp() {
    setInstallError("");
    if (!install) {
      setShowInstallHelp((visible) => !visible);
      return;
    }

    try {
      await install.prompt();
      const choice = await install.userChoice;
      if (choice.outcome === "accepted") notifyInstalled();
      setInstall(null);
    } catch (error) {
      console.error("Could not start app installation.", error);
      setInstall(null);
      setInstallError(
        error instanceof Error
          ? error.message
          : "The app could not be installed. Try the browser's install menu.",
      );
      setShowInstallHelp(true);
    }
  }

  return (
    <main className="download-page">
      <header className="download-heading">
        <p className="download-eyebrow">CEDAR SHOP APPS</p>
        <h1>Take Cedar Shop with you</h1>
        <p>
          Install the mobile app on your phone, or get the native desktop app
          for your computer.
        </p>
      </header>

      <div className="download-options">
        <section className="download-card" aria-labelledby="mobile-app-title">
          <div className="download-card-icon">
            <Smartphone size={25} aria-hidden="true" />
          </div>
          <p className="download-card-label">MOBILE · PWA</p>
          <h2 id="mobile-app-title">Cedar Shop on your phone</h2>
          <p className="download-card-description">
            Add the Cedar Yard workspace to your home screen for a full-screen
            app experience. It stays up to date with the website.
          </p>

          <button
            className="download-button"
            type="button"
            disabled={installed}
            onClick={installApp}
          >
            {installed ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Download size={18} aria-hidden="true" />
            )}
            {installed
              ? "App installed"
              : install
                ? "Install mobile app"
                : showInstallHelp
                  ? "Hide install steps"
                  : "Show install steps"}
          </button>

          {installError && (
            <p className="download-error" role="alert">
              {installError}
            </p>
          )}

          {showInstallHelp && !installed && (
            <div className="download-help">
              <h3>Install from your browser</h3>
              <p>
                <strong>iPhone or iPad:</strong> Open this page in Safari, tap
                Share, then choose Add to Home Screen.
              </p>
              <p>
                <strong>Android:</strong> Open this page in Chrome and choose
                Install app or Add to Home screen from the browser menu.
              </p>
              <p>
                The install option requires a secure HTTPS connection. Yard
                updates still need an internet connection.
              </p>
            </div>
          )}
        </section>

        <section className="download-card" aria-labelledby="desktop-app-title">
          <div className="download-card-icon">
            <Laptop size={25} aria-hidden="true" />
          </div>
          <p className="download-card-label">DESKTOP · TAURI</p>
          <h2 id="desktop-app-title">Cedar Shop for your computer</h2>
          <p className="download-card-description">
            Get the native desktop app, packaged with Tauri. Choose the
            installer that matches your operating system from the official
            releases page.
          </p>

          <a
            className="download-button"
            href={desktopReleasesUrl}
            target="_blank"
            rel="noreferrer"
          >
            View desktop releases
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>

          <p className="download-release-note">
            Windows, macOS, and Linux installers are listed there when a build
            is published. If no release is available yet, check back later.
          </p>
        </section>
      </div>
    </main>
  );
}
