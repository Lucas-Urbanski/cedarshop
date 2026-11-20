# ECI Spruce to Firestore mapping (guessed)

Status: **unverified**. The client data is still held by the outgoing vendor, so every
source column below is a guess built from how lumber ERPs name things. The mapping
lives in code at `scripts/eci-spruce/mapping.mjs`; when the real export arrives, edit
the `source` arrays there and re-run the converter. It reports any column it cannot
place, which is the list to work through.

Confidence: `high` = near-certain, `medium` = plausible and worth checking first,
`guess` = invented, expect to change it.

## Target collections

| Collection | Written from | Used by |
| --- | --- | --- |
| `inventory` | items | yard inventory, admin stock table, sales availability |
| `products` | items (retail price) | storefront, sales quote pricing |
| `productCosts` | items (cost) | margin reporting, loss write-off value |
| `customers` | customers | account records; linked to a Firebase Auth user by email |
| `vendors` | vendors | vendor profiles and restock orders |
| `invoices` | sales | sales reports, tax history |
| `accounts` | accounts | general ledger reference data |

## Inventory master (items, costs, retail pricing) (`items` -> `inventory`)

Document id from: `ItemCode`, `ItemID`, `ItemNo`, `SKU`, `ProductCode`

| Firestore field | Guessed Spruce column(s) | Confidence | Note |
| --- | --- | --- | --- |
| `name` | `Description`, `ItemDescription`, `LongDescription`, `Name` | high |  |
| `species` | `Species`, `SpeciesCode`, `WoodSpecies` | medium |  |
| `grade` | `Grade`, `GradeCode` | medium |  |
| `dimensions` | `Dimensions`, `Size`, `NominalSize` | guess |  |
| `quantity` | `OnHand`, `OnHandQty`, `QtyOnHand`, `QuantityOnHand`, `Stock` | high |  |
| `minimum` | `ReorderPoint`, `MinStock`, `Minimum`, `ReorderLevel` | medium |  |
| `location` | `Location`, `Warehouse`, `YardCode`, `StockLocation` | medium |  |
| `bay` | `BinLocation`, `Bin`, `Bay`, `Rack` | medium |  |
| `productCosts/cost` | `StandardCost`, `AverageCost`, `LastCost`, `UnitCost` | medium |  |
| `products/price` | `RetailPrice`, `SellPrice`, `ListPrice`, `Price1`, `Price` | high |  |
| `unit` | `StockingUnit`, `UOM`, `UnitOfMeasure`, `SellUnit` | medium |  |
| `vendorCode` | `VendorCode`, `PrimaryVendor`, `Vendor`, `SupplierCode` | medium |  |
| `weightPerUnit` | `WeightPerUnit`, `LbsPerUnit`, `UnitWeight` | guess | Feeds the dry vs green weight engine; verify the unit (lb vs kg). |
| `isGreenStock` | `GreenFlag`, `IsGreen`, `MoistureCode` | guess | Outdoor yard stock defaults to green unless the export says otherwise. |
| `active` | `ActiveFlag`, `Active`, `Discontinued`, `Status` | medium |  |

## Accounts receivable / customers (`customers` -> `customers`)

Document id from: `CustomerCode`, `CustNo`, `CustomerID`, `AccountCode`

| Firestore field | Guessed Spruce column(s) | Confidence | Note |
| --- | --- | --- | --- |
| `fullName` | `Name`, `CustomerName`, `BillToName`, `ContactName` | high |  |
| `company` | `Company`, `CompanyName`, `TradeName` | medium |  |
| `email` | `Email`, `EmailAddress`, `BillToEmail` | high | Used to link the imported account to a Firebase Auth user on first sign-in. |
| `phone` | `Phone`, `PhoneNumber`, `BillToPhone` | high |  |
| `shippingAddress.street` | `Address1`, `ShipToAddress1`, `BillToAddress1` | medium |  |
| `shippingAddress.city` | `City`, `ShipToCity`, `BillToCity` | medium |  |
| `shippingAddress.province` | `Province`, `State`, `ShipToProvince` | medium |  |
| `shippingAddress.postalCode` | `PostalCode`, `Zip`, `ZipCode`, `ShipToPostalCode` | medium |  |
| `creditLimit` | `CreditLimit`, `CreditLimitAmount` | medium |  |
| `balance` | `Balance`, `CurrentBalance`, `ARBalance` | medium |  |
| `terms` | `Terms`, `TermsCode`, `PaymentTerms` | medium |  |
| `taxCode` | `TaxCode`, `TaxGroup`, `TaxStatus` | medium |  |

## Vendors / timber suppliers (`vendors` -> `vendors`)

Document id from: `VendorCode`, `VendorNo`, `SupplierCode`, `VendorID`

| Firestore field | Guessed Spruce column(s) | Confidence | Note |
| --- | --- | --- | --- |
| `name` | `Name`, `VendorName`, `SupplierName` | high |  |
| `contactName` | `Contact`, `ContactName`, `BuyerName` | medium |  |
| `email` | `Email`, `EmailAddress`, `OrderEmail` | high |  |
| `phone` | `Phone`, `PhoneNumber` | high |  |
| `address` | `Address1`, `Address` | medium |  |
| `city` | `City` | medium |  |
| `province` | `Province`, `State` | medium |  |
| `postalCode` | `PostalCode`, `Zip`, `ZipCode` | medium |  |
| `terms` | `Terms`, `TermsCode`, `PaymentTerms` | medium |  |
| `leadTimeDays` | `LeadTimeDays`, `LeadTime`, `DaysToDeliver` | guess |  |

## Sales history / invoices (`sales` -> `invoices`)

Document id from: `InvoiceNumber`, `InvoiceNo`, `DocumentNo`, `OrderNumber`

| Firestore field | Guessed Spruce column(s) | Confidence | Note |
| --- | --- | --- | --- |
| `customerCode` | `CustomerCode`, `CustNo`, `CustomerID` | high |  |
| `date` | `InvoiceDate`, `Date`, `DocumentDate` | high |  |
| `dueDate` | `DueDate`, `PaymentDueDate` | medium |  |
| `subtotal` | `Subtotal`, `NetAmount`, `GoodsAmount` | high |  |
| `discountAmount` | `DiscountAmount`, `Discount` | medium |  |
| `taxableSubtotal` | `TaxableAmount`, `TaxableSubtotal` | medium |  |
| `tax` | `TaxTotal`, `TaxAmount`, `GSTAmount`, `Tax` | high |  |
| `total` | `Total`, `InvoiceTotal`, `DocumentTotal`, `GrossAmount` | high |  |
| `balance` | `Balance`, `AmountDue`, `OpenBalance` | medium |  |
| `salesRep` | `SalesRep`, `Salesperson`, `RepCode` | medium |  |
| `lines` | `Lines`, `InvoiceLines`, `Details`, `LineItems` | guess | Nested line arrays only survive a JSON export; a CSV export needs the line file joined on invoice number. |

## General ledger accounts (`accounts` -> `accounts`)

Document id from: `AccountNumber`, `AccountNo`, `GLAccount`, `AccountCode`

| Firestore field | Guessed Spruce column(s) | Confidence | Note |
| --- | --- | --- | --- |
| `description` | `Description`, `AccountName`, `Name` | high |  |
| `type` | `Type`, `AccountType`, `Category` | medium |  |
| `balance` | `Balance`, `CurrentBalance`, `Amount` | medium |  |
| `asOf` | `AsOfDate`, `BalanceDate`, `PeriodEnd` | guess |  |

## Running it

```bash
npm run migrate:eci -- items exports/spruce-items.csv --csv
npm run migrate:eci -- customers exports/spruce-customers.json
npm run migrate:eci -- vendors exports/spruce-vendors.json
npm run migrate:eci -- sales exports/spruce-invoices.json
npm run migrate:eci -- accounts exports/spruce-accounts.json
```

Output goes to `out/eci-spruce/`: `<entity>.json` holds the Firestore-shaped
documents keyed by id, and `<entity>-report.json` holds unmapped columns, missing or
duplicate ids, and a sample source/document pair. Nothing is written to Firestore;
loading is a separate, deliberate step once the mapping is confirmed.

`scripts/eci-spruce/samples/` has a worked example of the expected shape.
