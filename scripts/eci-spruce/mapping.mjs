export const CONFIDENCE = {
  high: "high",
  medium: "medium",
  guess: "guess",
} as const;

export type ConfidenceLevel = (typeof CONFIDENCE)[keyof typeof CONFIDENCE];
export type StorageLocation = "Outdoor yard" | "Warehouse" | "Kiln";
export type LossReason = "damaged" | "lost" | "warped" | "giveaway" | "kiln_loss";

export const money = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
};

export const integer = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
};

export const text = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value).trim();

export const decimal = (value: unknown): number => {
  const raw = text(value);
  if (!raw) return 0;

  const mixed = raw.match(/^(\d+)[\s-](\d+)\/(\d+)$/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }

  const fraction = raw.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);

  const parsed = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const LOCATION_MAP: Array<{ match: RegExp; value: StorageLocation }> = [
  { match: /kiln|dry/i, value: "Kiln" },
  { match: /warehouse|shop|inside|indoor|shed/i, value: "Warehouse" },
  { match: /yard|outdoor|outside|rack|canopy/i, value: "Outdoor yard" },
];

export const location = (value: unknown): StorageLocation => {
  const raw = text(value);
  const hit = LOCATION_MAP.find((entry) => entry.match.test(raw));
  return hit ? hit.value : "Outdoor yard";
};

export const dateOnly = (value: unknown): string => {
  const raw = text(value);
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const northAmerican = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (northAmerican) {
    const [, month, day, year] = northAmerican;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

// Always normalizes lengths to inches so Work Orders don't mix feet & inches
export const dimensionsFrom = (getVal: (col: string) => unknown): string => {
  const thickness = decimal(getVal("Thickness"));
  const width = decimal(getVal("Width"));
  const length = decimal(getVal("Length"));
  const lengthUom = text(getVal("LengthUOM"));
  if (!thickness || !width) return "";

  const lengthInches = length
    ? /^(ft|foot|feet|')$/i.test(lengthUom)
      ? length * 12
      : length
    : 0;

  return lengthInches
    ? `${thickness}" × ${width}" × ${lengthInches}"`
    : `${thickness}" × ${width}"`;
};

export interface FieldMapping {
  target: string;
  source: string[];
  confidence: ConfidenceLevel;
  transform: (val: any) => any;
  fallback?: (getVal: (col: string) => unknown) => any;
  fallbackColumns?: string[];
  note?: string;
}

export interface EntityMapping {
  label: string;
  collection: string;
  id: string[];
  fields: FieldMapping[];
}

export const MAPPINGS: Record<string, EntityMapping> = {
  items: {
    label: "Inventory master (items, stock, pricing, weights)",
    collection: "inventory",
    id: ["ItemCode", "ItemID", "ItemNo", "SKU", "ProductCode"],
    fields: [
      {
        target: "name",
        source: ["Description", "ItemDescription", "LongDescription", "Name"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "species",
        source: ["Species", "SpeciesCode", "WoodSpecies"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "grade",
        source: ["Grade", "GradeCode"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "dimensions",
        source: ["Dimensions", "Size", "NominalSize"],
        confidence: CONFIDENCE.guess,
        transform: text,
        fallback: dimensionsFrom,
        fallbackColumns: ["Thickness", "Width", "Length", "LengthUOM"],
        note: "Normalized to inches to prevent feet-vs-inches bugs in Work Orders.",
      },
      {
        target: "quantity",
        source: ["OnHand", "OnHandQty", "QtyOnHand", "QuantityOnHand", "Stock"],
        confidence: CONFIDENCE.high,
        transform: integer,
      },
      {
        target: "minimum",
        source: ["ReorderPoint", "MinStock", "Minimum", "ReorderLevel"],
        confidence: CONFIDENCE.medium,
        transform: integer,
      },
      {
        target: "location",
        source: ["Location", "Warehouse", "YardCode", "StockLocation"],
        confidence: CONFIDENCE.medium,
        transform: location,
      },
      {
        target: "bay",
        source: ["BinLocation", "Bin", "Bay", "Rack"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "unitCost",
        source: ["StandardCost", "AverageCost", "LastCost", "UnitCost"],
        confidence: CONFIDENCE.medium,
        transform: money,
        note: "Protected by Firestore rules so only admins can read/write.",
      },
      {
        target: "retailPrice",
        source: ["RetailPrice", "SellPrice", "ListPrice", "Price1", "Price"],
        confidence: CONFIDENCE.high,
        transform: money,
      },
      {
        target: "unit",
        source: ["StockingUnit", "UOM", "UnitOfMeasure", "SellUnit"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "vendorCode",
        source: ["VendorCode", "PrimaryVendor", "Vendor", "SupplierCode"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "weightPerUnitLbs",
        source: ["WeightPerUnit", "LbsPerUnit", "UnitWeight"],
        confidence: CONFIDENCE.guess,
        transform: decimal,
      },
      {
        target: "moisturePercent",
        source: ["MoistureContent", "MC", "Moisture"],
        confidence: CONFIDENCE.guess,
        transform: decimal,
      },
      {
        target: "isGreenStock",
        source: ["GreenFlag", "IsGreen", "MoistureCode"],
        confidence: CONFIDENCE.guess,
        transform: (value: unknown) => /^(y|yes|true|1|green|gd)/i.test(text(value)),
      },
      {
        target: "status",
        source: ["Status"],
        confidence: CONFIDENCE.guess,
        transform: () => "available",
      },
    ],
  },

  customers: {
    label: "Customers",
    collection: "customers",
    id: ["CustomerCode", "CustNo", "CustomerID", "AccountCode"],
    fields: [
      {
        target: "fullName",
        source: ["Name", "CustomerName", "BillToName", "ContactName"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "company",
        source: ["Company", "CompanyName", "TradeName"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "email",
        source: ["Email", "EmailAddress", "BillToEmail"],
        confidence: CONFIDENCE.high,
        transform: (value: unknown) => text(value).toLowerCase(),
      },
      {
        target: "phone",
        source: ["Phone", "PhoneNumber", "BillToPhone"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "shippingAddress",
        source: ["Address1", "ShipToAddress1", "BillToAddress1"],
        confidence: CONFIDENCE.medium,
        transform: (value: unknown) => text(value),
      },
      {
        target: "taxCode",
        source: ["TaxCode", "TaxGroup", "TaxStatus"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "balance",
        source: ["Balance", "CurrentBalance", "ARBalance"],
        confidence: CONFIDENCE.medium,
        transform: money,
      },
    ],
  },

  vendors: {
    label: "Vendors / timber suppliers",
    collection: "vendors",
    id: ["VendorCode", "VendorNo", "SupplierCode", "VendorID"],
    fields: [
      {
        target: "name",
        source: ["Name", "VendorName", "SupplierName"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "email",
        source: ["Email", "EmailAddress", "OrderEmail"],
        confidence: CONFIDENCE.high,
        transform: (value: unknown) => text(value).toLowerCase(),
      },
      {
        target: "phone",
        source: ["Phone", "PhoneNumber"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "leadTimeDays",
        source: ["LeadTimeDays", "LeadTime", "DaysToDeliver"],
        confidence: CONFIDENCE.guess,
        transform: integer,
      },
    ],
  },

  sales: {
    label: "Sales / quotes / orders",
    collection: "orders",
    id: ["InvoiceNumber", "InvoiceNo", "DocumentNo", "OrderNumber"],
    fields: [
      {
        target: "customerCode",
        source: ["CustomerCode", "CustNo", "CustomerID"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "date",
        source: ["InvoiceDate", "Date", "DocumentDate"],
        confidence: CONFIDENCE.high,
        transform: dateOnly,
      },
      {
        target: "subtotal",
        source: ["Subtotal", "NetAmount", "GoodsAmount"],
        confidence: CONFIDENCE.high,
        transform: money,
      },
      {
        target: "taxAmount",
        source: ["TaxTotal", "TaxAmount", "GSTAmount", "Tax"],
        confidence: CONFIDENCE.high,
        transform: money,
      },
      {
        target: "totalAmount",
        source: ["Total", "InvoiceTotal", "DocumentTotal", "GrossAmount"],
        confidence: CONFIDENCE.high,
        transform: money,
      },
      {
        target: "status",
        source: ["Status"],
        confidence: CONFIDENCE.guess,
        transform: () => "delivered",
      },
    ],
  },
};

export const ENTITY_NAMES = Object.keys(MAPPINGS);