// Work-order measurements are stored in inches because that is the unit the
// yard records and the seeded Firestore data already use, but the crew reads
// cut lengths in feet. Storage stays canonical; only the UI converts.
export const INCHES_PER_FOOT = 12;

export function inchesToFeet(inches: number): number {
  return inches / INCHES_PER_FOOT;
}

export function feetToInches(feet: number): number {
  return Math.round(feet * INCHES_PER_FOOT * 100) / 100;
}

/** Inches rendered as feet, e.g. 60 -> "5", 102 -> "8.5". */
export function formatFeet(inches: number): string {
  if (!Number.isFinite(inches)) return "0";

  return String(Number(inchesToFeet(inches).toFixed(2)));
}
