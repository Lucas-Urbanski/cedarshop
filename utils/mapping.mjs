// Guessed field-by-field mapping from an ECI Spruce export onto this app's
// Firestore model.
//
// Nothing here has been confirmed against a real export: the client data is
// still held by the outgoing vendor, so every source column is a candidate
// list rather than a fixed name, and every field carries a confidence level.
// When the export arrives, correct the `source` arrays and re-check the
// document shapes against firestore.rules.
//
// `mapRecord("items", row)` turns one source row into the Firestore documents
// it would produce, which is the piece a backend function or one-off import
// script needs. It touches nothing itself.

export const CONFIDENCE = {
  high: "high", // near-certain name in any lumber ERP export
  medium: "medium", // plausible; verify against the header row
  guess: "guess", // invented; expect to change it
};

// --------------------------------------------------------------- transforms

const text = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const money = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));

  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
};

const integer = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));

  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
};

const decimal = (value) => {
  // Lumber dimensions arrive as 2, 1-1/2, 1 1/2, 5/4 ...
  const raw = text(value);
  if (!raw) return 0;

  const mixed = raw.match(/^(\d+)[\s-](\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  const fraction = raw.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);

  const parsed = Number(raw.replace(/[^0-9.]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
};

const yes = (value) => /^(y|yes|true|1|green|gd)/i.test(text(value));
const active = (value) =>
  !/^(n|no|false|0|discontinued|inactive)/i.test(text(value));
const email = (value) => text(value).toLowerCase();

// Only these three values are valid in Firestore (see firestore.rules).
export const LOCATION_MAP = [
  { match: /kiln|dry/i, value: "Kiln" },
  { match: /warehouse|shop|inside|indoor|shed/i, value: "Warehouse" },
  { match: /yard|outdoor|outside|rack|canopy/i, value: "Outdoor yard" },
];

export const location = (value) => {
  const raw = text(value);
  const hit = LOCATION_MAP.find((entry) => entry.match.test(raw));

  return hit ? hit.value : "Outdoor yard";
};

export const dateOnly = (value) => {
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

  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
};

// YardStock.dimensions reads like "2 × 4 · 8 ft".
const dimensionsFrom = (get) => {
  const thickness = decimal(get("Thickness"));
  const width = decimal(get("Width"));
  const length = decimal(get("Length"));
  if (!thickness || !width) return "";

  const unit = /^(i|in|inch|inches|")$/i.test(text(get("LengthUOM")))
    ? "in"
    : "ft";

  return `${thickness} × ${width}${length ? ` · ${length} ${unit}` : ""}`;
};

// ---------------------------------------------------------------- mappings

/**
 * One entry per import family.
 *
 * `collection` is the Firestore collection the record becomes. `status` is
 * "ready" when that collection and its rules exist today, "planned" when the
 * app has no home for the data yet. `id` lists candidate source columns for the
 * document id; `fields` lists candidate source columns per target field, and a
 * field may name a different `collection` when one export feeds several.
 */
export const MAPPINGS = {
  items: {
    label: "Inventory master (stock, cost, retail price)",
    collection: "inventory",
    alsoWrites: ["products", "productCosts"],
    status: "ready",
    id: ["ItemCode", "ItemID", "ItemNo", "SKU", "ProductCode"],
    fields: [
      {
        target: "name",
        source: ["Description", "ItemDescription", "LongDescription", "Name"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "dimensions",
        source: ["Dimensions", "Size", "NominalSize"],
        confidence: CONFIDENCE.guess,
        transform: text,
        fallback: dimensionsFrom,
        fallbackColumns: ["Thickness", "Width", "Length", "LengthUOM"],
      },
      {
        target: "quantity",
        source: ["OnHand", "OnHandQty", "QtyOnHand", "QuantityOnHand", "Stock"],
        confidence: CONFIDENCE.high,
        transform: integer,
        note: "Must be a whole number or firestore.rules rejects the write.",
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
        note: "Mapped onto Outdoor yard / Warehouse / Kiln.",
      },
      {
        target: "bay",
        source: ["BinLocation", "Bin", "Bay", "Rack"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "cost",
        source: ["StandardCost", "AverageCost", "LastCost", "UnitCost"],
        confidence: CONFIDENCE.medium,
        transform: money,
        collection: "productCosts",
      },
      {
        target: "price",
        source: ["RetailPrice", "SellPrice", "ListPrice", "Price1", "Price"],
        confidence: CONFIDENCE.high,
        transform: money,
        collection: "products",
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
        note: "Feeds the dry vs green weight engine; confirm the export is in pounds.",
      },
      {
        target: "moisturePercent",
        source: ["MoisturePercent", "MoistureContent", "MCPercent", "Moisture"],
        confidence: CONFIDENCE.guess,
        transform: decimal,
        note: "Must land between 0 and 100 or firestore.rules rejects the write.",
      },
      {
        target: "dryWeightLbs",
        source: ["DryWeight", "DryWeightLbs", "KilnDryWeight"],
        confidence: CONFIDENCE.guess,
        transform: decimal,
        note: "Only present when the export carries a kiln-dry weight.",
      },
      {
        target: "isGreenStock",
        source: ["GreenFlag", "IsGreen", "MoistureCode"],
        confidence: CONFIDENCE.guess,
        transform: yes,
      },
      {
        target: "active",
        source: ["ActiveFlag", "Active", "Discontinued", "Status"],
        confidence: CONFIDENCE.medium,
        transform: active,
      },
    ],
  },

  customers: {
    label: "Accounts receivable / customers",
    collection: "users",
    status: "ready",
    id: ["Email", "EmailAddress", "BillToEmail"],
    note:
      "User documents are keyed by Firebase Auth uid, not by customer code. " +
      "Look the account up by email first and create it if it does not exist; " +
      "the rest of the profile matches the users document shape.",
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
        transform: email,
      },
      {
        target: "phone",
        source: ["Phone", "PhoneNumber", "BillToPhone"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "shippingAddress.street",
        source: ["Address1", "ShipToAddress1", "BillToAddress1"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "shippingAddress.city",
        source: ["City", "ShipToCity", "BillToCity"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "shippingAddress.province",
        source: ["Province", "State", "ShipToProvince"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "shippingAddress.postalCode",
        source: ["PostalCode", "Zip", "ZipCode", "ShipToPostalCode"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "role",
        source: [],
        confidence: CONFIDENCE.high,
        transform: () => "customer",
      },
    ],
  },

  vendors: {
    label: "Vendors / timber suppliers",
    collection: "vendors",
    status: "planned",
    id: ["VendorCode", "VendorNo", "SupplierCode", "VendorID"],
    note:
      "No vendors collection or rules block yet; the admin vendor page is the " +
      "next feature. Keep this mapping until that lands.",
    fields: [
      {
        target: "name",
        source: ["Name", "VendorName", "SupplierName"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "contactName",
        source: ["Contact", "ContactName", "BuyerName"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "email",
        source: ["Email", "EmailAddress", "OrderEmail"],
        confidence: CONFIDENCE.high,
        transform: email,
      },
      {
        target: "phone",
        source: ["Phone", "PhoneNumber"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "address",
        source: ["Address1", "Address"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "city",
        source: ["City"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "province",
        source: ["Province", "State"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "postalCode",
        source: ["PostalCode", "Zip", "ZipCode"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "terms",
        source: ["Terms", "TermsCode", "PaymentTerms"],
        confidence: CONFIDENCE.medium,
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
    label: "Sales history / invoices",
    collection: "salesQuotes",
    status: "ready",
    id: ["InvoiceNumber", "InvoiceNo", "DocumentNo", "OrderNumber"],
    note:
      "Historical invoices land in salesQuotes because it is the only priced " +
      "sales collection today. Set createdBy to the importing staff uid, and " +
      "keep taxRate at 0.05 so the GST checks in firestore.rules hold.",
    fields: [
      {
        target: "customerName",
        source: ["CustomerName", "BillToName", "Customer"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "subtotal",
        source: ["Subtotal", "NetAmount", "GoodsAmount"],
        confidence: CONFIDENCE.high,
        transform: money,
      },
      {
        target: "discountAmount",
        source: ["DiscountAmount", "Discount"],
        confidence: CONFIDENCE.medium,
        transform: money,
      },
      {
        target: "taxableSubtotal",
        source: ["TaxableAmount", "TaxableSubtotal"],
        confidence: CONFIDENCE.medium,
        transform: money,
      },
      {
        target: "tax",
        source: ["TaxTotal", "TaxAmount", "GSTAmount", "Tax"],
        confidence: CONFIDENCE.high,
        transform: money,
      },
      {
        target: "total",
        source: ["Total", "InvoiceTotal", "DocumentTotal", "GrossAmount"],
        confidence: CONFIDENCE.high,
        transform: money,
      },
      {
        target: "taxRate",
        source: [],
        confidence: CONFIDENCE.high,
        transform: () => 0.05,
      },
      {
        target: "createdAt",
        source: ["InvoiceDate", "Date", "DocumentDate"],
        confidence: CONFIDENCE.high,
        transform: dateOnly,
      },
    ],
  },

  accounts: {
    label: "General ledger accounts",
    collection: null,
    status: "planned",
    id: ["AccountNumber", "AccountNo", "GLAccount"],
    note:
      "The app has no accounting collection yet, so there is nowhere to import " +
      "these rows. Mapping kept for the field names only.",
    fields: [
      {
        target: "name",
        source: ["Description", "AccountDescription", "AccountName"],
        confidence: CONFIDENCE.high,
        transform: text,
      },
      {
        target: "type",
        source: ["Type", "AccountType", "Category"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "balance",
        source: ["Balance", "CurrentBalance", "Amount"],
        confidence: CONFIDENCE.medium,
        transform: money,
      },
      {
        target: "asOf",
        source: ["AsOfDate", "BalanceDate", "PeriodEnd"],
        confidence: CONFIDENCE.guess,
        transform: dateOnly,
      },
    ],
  },
};

// ------------------------------------------------------------------ helpers

// Source headers are guesses, so matching ignores case and spacing.
function makeGetter(record) {
  const exact = new Set(Object.keys(record));
  const byNormalisedName = new Map(
    Object.keys(record).map((key) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), key]),
  );

  return (name) => {
    if (exact.has(name)) return { value: record[name], column: name };

    const column = byNormalisedName.get(
      name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );

    return column === undefined
      ? { value: undefined, column: null }
      : { value: record[column], column };
  };
}

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

function assign(target, path, value) {
  const [head, tail] = path.split(".");

  if (!tail) {
    target[head] = value;
    return;
  }

  target[head] = target[head] ?? {};
  target[head][tail] = value;
}

/**
 * Turns one source row into the Firestore documents it produces.
 *
 * Returns `{ id, collection, documents, unmappedColumns }`, where `documents`
 * is keyed by collection name. Throws for a family that has no collection yet.
 */
export function mapRecord(entity, record) {
  const mapping = MAPPINGS[entity];

  if (!mapping) {
    throw new Error(
      `Unknown entity "${entity}". Use one of: ${Object.keys(MAPPINGS).join(", ")}.`,
    );
  }

  if (mapping.status !== "ready" || !mapping.collection) {
    throw new Error(`${entity}: ${mapping.note ?? "no Firestore collection yet."}`);
  }

  const get = makeGetter(record);
  const idColumn = mapping.id
    .map(get)
    .find((hit) => !isBlank(hit.value));

  if (!idColumn) {
    throw new Error(
      `${entity}: none of ${mapping.id.join(", ")} is present, so there is no document id.`,
    );
  }

  const consumed = new Set([idColumn.column]);
  const documents = {};

  for (const field of mapping.fields) {
    const collection = field.collection ?? mapping.collection;
    let value;
    let matched = false;

    for (const name of field.source) {
      const hit = get(name);

      if (!isBlank(hit.value)) {
        value = field.transform(hit.value);
        consumed.add(hit.column);
        matched = true;
        break;
      }
    }

    if (!matched && field.fallback) {
      const derived = field.fallback((name) => get(name).value);

      if (!isBlank(derived)) {
        value = derived;
        matched = true;
      }

      for (const name of field.fallbackColumns ?? []) {
        const hit = get(name);
        if (hit.column) consumed.add(hit.column);
      }
    }

    if (!matched) {
      // A transform with no source is a constant, e.g. role or taxRate.
      if (field.source.length === 0) {
        value = field.transform(undefined);
        matched = true;
      }
    }

    if (!matched) continue;

    documents[collection] = documents[collection] ?? {};
    assign(documents[collection], field.target, value);
  }

  return {
    id: text(idColumn.value),
    collection: mapping.collection,
    documents,
    unmappedColumns: Object.keys(record).filter((key) => !consumed.has(key)),
  };
}
