// Alberta sales tax: 5% GST, applied to the discounted line amount so the
// printed line items always add up to the quote total.
export const GST_RATE = 0.05;
export const GST_LABEL = "GST";

export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;

  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function taxFor(amount: number, rate: number = GST_RATE): number {
  return roundMoney(amount * rate);
}

export function taxPercentLabel(rate: number = GST_RATE): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}

export interface TaxableLine {
  unitPrice: number;
  quantity: number;
}

export interface TaxedLine {
  /** Unit price times quantity, before discount. */
  gross: number;
  /** Gross minus this line's share of the discount. */
  net: number;
  tax: number;
}

export interface QuoteTotals {
  subtotal: number;
  discountAmount: number;
  /** Subtotal after the discount; tax is charged on this amount. */
  taxable: number;
  tax: number;
  total: number;
  taxRate: number;
  lines: TaxedLine[];
}

/**
 * Per-line tax is rounded and then summed, so the line items on a quote always
 * reconcile with the tax and total shown underneath them.
 */
export function calculateQuoteTotals(
  lines: readonly TaxableLine[],
  discountPercent = 0,
  taxRate: number = GST_RATE,
): QuoteTotals {
  const safeRate =
    Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : GST_RATE;
  const safeDiscount = Math.min(
    100,
    Math.max(0, Number.isFinite(discountPercent) ? discountPercent : 0),
  );

  const taxedLines: TaxedLine[] = lines.map(({ unitPrice, quantity }) => {
    const gross = roundMoney(
      (Number.isFinite(unitPrice) ? unitPrice : 0) *
        (Number.isFinite(quantity) ? quantity : 0),
    );
    const net = roundMoney(gross - gross * (safeDiscount / 100));

    return { gross, net, tax: taxFor(net, safeRate) };
  });

  const subtotal = roundMoney(
    taxedLines.reduce((sum, line) => sum + line.gross, 0),
  );
  const taxable = roundMoney(
    taxedLines.reduce((sum, line) => sum + line.net, 0),
  );
  const tax = roundMoney(taxedLines.reduce((sum, line) => sum + line.tax, 0));

  return {
    subtotal,
    discountAmount: roundMoney(subtotal - taxable),
    taxable,
    tax,
    total: roundMoney(taxable + tax),
    taxRate: safeRate,
    lines: taxedLines,
  };
}
