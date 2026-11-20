// Field-by-field guess at the ECI Spruce export shape, mapped onto this app's
// Firestore model. Nothing here has been confirmed against a real export: the
// client data is still held by the vendor, so every row carries a confidence
// level and the source names are candidate lists, not fixed columns.
//
// When the real export arrives, edit the `source` arrays here (cheapest fix)
// and re-run `npm run migrate:eci -- <entity> <file>`; the converter reports
// any source column it could not place.

export const CONFIDENCE = {
  high: "high", // near-certain name in any lumber ERP export
  medium: "medium", // plausible; verify against the header row
  guess: "guess", // invented; expect to change it
};

const money = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
};

const integer = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));

  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
};

const text = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const decimal = (value) => {
  // Lumber dimensions arrive as 2, 1-1/2, 1 1/2, 5/4 ...
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

export const dimensionsFrom = (value) => {
  const thicknessValue = decimal(value("Thickness"));
  const widthValue = decimal(value("Width"));
  const lengthValue = decimal(value("Length"));
  const lengthUom = value("LengthUOM");
  if (!thicknessValue || !widthValue) return "";

  const uom = /^(i|in|inch|inches|")$/i.test(text(lengthUom)) ? "in" : "ft";
  const lengthLabel = lengthValue
    ? ` · ${lengthValue} ${uom}`
    : "";

  return `${thicknessValue} × ${widthValue}${lengthLabel}`;
};

/**
 * One entry per Firestore collection. `id` lists candidate source columns for
 * the document id; `fields` lists candidate source columns per target field.
 */
export const MAPPINGS = {
  items: {
    label: "Inventory master (items, costs, retail pricing)",
    collection: "inventory",
    companionCollections: ["products", "productCosts"],
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
        target: "weightPerUnit",
        source: ["WeightPerUnit", "LbsPerUnit", "UnitWeight"],
        confidence: CONFIDENCE.guess,
        transform: decimal,
        note: "Feeds the dry vs green weight engine; verify the unit (lb vs kg).",
      },
      {
        target: "isGreenStock",
        source: ["GreenFlag", "IsGreen", "MoistureCode"],
        confidence: CONFIDENCE.guess,
        transform: (value) => /^(y|yes|true|1|green|gd)/i.test(text(value)),
        note: "Outdoor yard stock defaults to green unless the export says otherwise.",
      },
      {
        target: "active",
        source: ["ActiveFlag", "Active", "Discontinued", "Status"],
        confidence: CONFIDENCE.medium,
        transform: (value) => !/^(n|no|false|0|discontinued|inactive)/i.test(text(value)),
      },
    ],
  },

  customers: {
    label: "Accounts receivable / customers",
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
        transform: (value) => text(value).toLowerCase(),
        note: "Used to link the imported account to a Firebase Auth user on first sign-in.",
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
        target: "creditLimit",
        source: ["CreditLimit", "CreditLimitAmount"],
        confidence: CONFIDENCE.medium,
        transform: money,
      },
      {
        target: "balance",
        source: ["Balance", "CurrentBalance", "ARBalance"],
        confidence: CONFIDENCE.medium,
        transform: money,
      },
      {
        target: "terms",
        source: ["Terms", "TermsCode", "PaymentTerms"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "taxCode",
        source: ["TaxCode", "TaxGroup", "TaxStatus"],
        confidence: CONFIDENCE.medium,
        transform: text,
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
        target: "contactName",
        source: ["Contact", "ContactName", "BuyerName"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "email",
        source: ["Email", "EmailAddress", "OrderEmail"],
        confidence: CONFIDENCE.high,
        transform: (value) => text(value).toLowerCase(),
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
    collection: "invoices",
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
        target: "dueDate",
        source: ["DueDate", "PaymentDueDate"],
        confidence: CONFIDENCE.medium,
        transform: dateOnly,
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
        target: "balance",
        source: ["Balance", "AmountDue", "OpenBalance"],
        confidence: CONFIDENCE.medium,
        transform: money,
      },
      {
        target: "salesRep",
        source: ["SalesRep", "Salesperson", "RepCode"],
        confidence: CONFIDENCE.medium,
        transform: text,
      },
      {
        target: "lines",
        source: ["Lines", "InvoiceLines", "Details", "LineItems"],
        confidence: CONFIDENCE.guess,
        transform: (value) =>
          Array.isArray(value)
            ? value.map((line) => ({
                sku: text(
                  line.ItemCode ?? line.SKU ?? line.ProductCode ?? line.Item,
                ),
                name: text(line.Description ?? line.ItemDescription),
                quantity: integer(line.Qty ?? line.Quantity),
                unitPrice: money(line.UnitPrice ?? line.Price),
                lineTotal: money(line.ExtPrice ?? line.ExtendedPrice),
                tax: money(line.TaxAmount ?? line.Tax),
              }))
            : [],
        note: "Nested line arrays only survive a JSON export; a CSV export needs the line file joined on invoice number.",
      },
    ],
  },

  accounts: {
    label: "General ledger accounts",
    collection: "accounts",
    id: ["AccountNumber", "AccountNo", "GLAccount", "AccountCode"],
    fields: [
      {
        target: "description",
        source: ["Description", "AccountName", "Name"],
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

export const ENTITY_NAMES = Object.keys(MAPPINGS);
