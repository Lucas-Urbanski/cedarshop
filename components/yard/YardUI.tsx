"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function YardHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="yard-heading">
      <div>
        <p className="yard-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="yard-heading-actions">{children}</div>
    </div>
  );
}

export function YardBadge({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "muted";
}) {
  return <span className={`yard-badge ${tone}`}>{children}</span>;
}

export function YardDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();

    return () => element?.close();
  }, []);

  return (
    <dialog
      className="yard-dialog"
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="yard-dialog-title"
    >
      <div className="yard-dialog-head">
        <h2 id="yard-dialog-title">{title}</h2>

        <button
          type="button"
          className="yard-icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      {children}
    </dialog>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="yard-empty">{children}</div>;
}

export function shortDate(value: string) {
  return new Date(
    value.includes("T") ? value : `${value}T12:00:00`,
  ).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}