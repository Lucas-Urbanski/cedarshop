"use client";

import {
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";

import { Camera, Plus, TriangleAlert, Clock3 } from "lucide-react";

import { useYard } from "@/components/yard/YardProvider";
import {
  YardHeading,
  YardBadge,
  YardDialog,
  EmptyState,
  shortDate,
} from "@/components/yard/YardUI";

import { newYardId } from "@/utils/yardData";
import { auth } from "@/utils/firebase";
import type { YardLoss } from "@/types/yard";

const maxPhotoDataUrlLength = 400_000;

async function compressPhoto(file: File): Promise<string> {
  const image = await createImageBitmap(file);

  try {
    const maxDimension = 1280;
    const scale = Math.min(
      1,
      maxDimension / image.width,
      maxDimension / image.height,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("The photo could not be processed in this browser.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
    if (dataUrl.length > maxPhotoDataUrlLength) {
      throw new Error(
        "The compressed photo is too large to save. Choose a smaller photo.",
      );
    }

    return dataUrl;
  } finally {
    image.close();
  }
}

export default function LossesPage() {
  const { data, update } = useYard();

  const [creating, setCreating] = useState(false);
  const [photo, setPhoto] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<YardLoss | null>(null);
  const [saving, setSaving] = useState(false);

  function openReportForm() {
    setCreating(true);
    setPhoto("");
    setError("");
  }

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    setPhoto("");
    setError("");

    if (!file) return;

    const supportedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!supportedTypes.includes(file.type) || file.size > 1500000) {
      setError("Choose a JPG, PNG or WebP photo smaller than 1.5 MB.");
      event.target.value = "";
      return;
    }

    setReading(true);

    try {
      setPhoto(await compressPhoto(file));
    } catch (caughtError) {
      console.error("Could not process loss report photo.", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The photo could not be processed. Please try another file.",
      );
    } finally {
      setReading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const stockId = String(form.get("stockId"));
    const quantity = Number(form.get("quantity"));
    const notes = String(form.get("notes")).trim();

    const stock = data.inventory.find((item) => item.id === stockId);

    if (
      !stock ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > stock.quantity ||
      !notes
    ) {
      setError(
        "Enter notes and a whole-piece quantity between 1 and the stock on hand.",
      );
      return;
    }

    if (reading) return;

    const user = auth.currentUser;
    if (!user) {
      setError("Sign in again before submitting this report.");
      return;
    }

    const report: YardLoss = {
      id: newYardId("LOSS"),
      stockId,
      quantity,
      notes,
      photo,
      reason: String(form.get("reason")) as YardLoss["reason"],
      created: new Date().toISOString(),
      status: "Pending review",
    };

    setSaving(true);
    try {
      const saved = await update(
        (current) => ({
          ...current,
          losses: [report, ...current.losses],
        }),
        `${report.id}: ${quantity} pieces of ${stockId} reported for review.`,
      );

      if (saved) {
        setCreating(false);
        setPhoto("");
      } else {
        setError("Save failed. Check your connection and try again.");
      }
    } catch (caughtError) {
      console.error("Could not save loss report.", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Save failed. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <YardHeading
        eyebrow="DAMAGE & LOSS TAGGING"
        title="Loss reports"
        description="Document damaged lumber so the team can review it."
      >
        <button className="yard-button" onClick={openReportForm}>
          <Plus size={18} />
          New loss report
        </button>
      </YardHeading>

      <div className="yard-info">
        <Clock3 size={22} />

        <div>
          <strong>Report now. Review before write-off.</strong>
          <p>
            Reports are sent to the administrator queue. Inventory is deducted
            only after approval.
          </p>
        </div>
      </div>

      <section className="yard-panel">
        <div className="yard-section-head">
          <div>
            <h2>Reported items</h2>
            <p>Photos, reasons and quantities in one place</p>
          </div>

          <YardBadge tone="amber">
            {data.losses.filter((report) => report.status === "Pending review").length} pending
          </YardBadge>
        </div>

        {data.losses.length ? (
          <div className="yard-loss-list">
            {data.losses.map((report) => (
              <button
                className="yard-loss-row"
                key={report.id}
                onClick={() => setViewing(report)}
              >
                <span className="yard-loss-thumb">
                  {report.photo ? (
                    <img
                      src={report.photo}
                      alt={`Damage reported for ${report.stockId}`}
                    />
                  ) : (
                    <TriangleAlert size={24} />
                  )}
                </span>

                <span className="yard-loss-copy">
                  <small>
                    {report.id} · {shortDate(report.created)}
                  </small>

                  <strong>
                    {data.inventory.find(
                      (item) => item.id === report.stockId,
                    )?.name}
                  </strong>

                  <span>
                    {report.quantity} pieces · {report.reason}
                  </span>
                </span>

                <YardBadge
                  tone={report.status === "Pending review" ? "amber" : "green"}
                >
                  {report.status}
                </YardBadge>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState>
            <span className="yard-empty-icon">
              <Camera size={32} />
            </span>

            <h3>No loss reports yet</h3>
            <p>
              Found damaged lumber? Add a photo and a few details to start a
              report.
            </p>

            <button
              className="yard-button secondary"
              onClick={openReportForm}
            >
              Create first report
            </button>
          </EmptyState>
        )}
      </section>

      {creating && (
        <YardDialog
          title="New loss report"
          onClose={() => setCreating(false)}
        >
          <form className="yard-form" onSubmit={save}>
            <label>
              Lumber product
              <select name="stockId" required disabled={!data.inventory.length}>
                {data.inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.quantity} on hand
                  </option>
                ))}
              </select>
            </label>

            <div className="yard-form-grid">
              <label>
                Affected pieces
                <input
                  type="number"
                  name="quantity"
                  required
                  min="1"
                  step="1"
                />
              </label>

              <label>
                Loss reason
                <select name="reason">
                  <option>Yard damage</option>
                  <option>Transport damage</option>
                  <option>Other</option>
                </select>
              </label>
            </div>

            <label>
              What happened?
              <textarea
                name="notes"
                required
                maxLength={600}
                placeholder="Describe the damage and where the material is located…"
              />
            </label>

            <label className="yard-photo-input">
              <Camera size={24} />
              Take or attach a photo (optional)

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={selectPhoto}
              />

              <small>
                JPG, PNG or WebP · up to 1.5 MB input · saved compressed in
                Firestore
              </small>
            </label>

            {photo && (
              <div>
                <img
                  className="yard-photo-preview"
                  src={photo}
                  alt="Selected damage photo"
                />

                <button
                  type="button"
                  className="yard-button secondary"
                  onClick={() => setPhoto("")}
                >
                  Remove photo
                </button>
              </div>
            )}

            {reading && <p role="status">Reading photo…</p>}

            {error && (
              <p role="alert" className="yard-form-error">{error}</p>
            )}

            <p className="yard-helper">
              Reports and compressed photos are saved to Firestore for
              administrator review.
            </p>

            <div className="yard-form-actions">
              <button
                type="button"
                className="yard-button secondary"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={reading || saving || !data.inventory.length}
                className="yard-button"
              >
                {saving ? "Saving…" : "Save loss report"}
              </button>
            </div>
          </form>
        </YardDialog>
      )}

      {viewing && (
        <YardDialog title={viewing.id} onClose={() => setViewing(null)}>
          <div className="yard-form">
            <YardBadge tone="amber">{viewing.status}</YardBadge>

            <h3>
              {data.inventory.find(
                (item) => item.id === viewing.stockId,
              )?.name}
            </h3>

            <p>
              {viewing.quantity} pieces · {viewing.reason}
            </p>

            <p className="yard-prewrap">{viewing.notes}</p>

            {viewing.photo && (
              <img
                className="yard-photo-preview"
                src={viewing.photo}
                alt="Reported lumber damage"
              />
            )}

            <button
              className="yard-button secondary"
              onClick={() => setViewing(null)}
            >
              Close report
            </button>
          </div>
        </YardDialog>
      )}
    </>
  );
}