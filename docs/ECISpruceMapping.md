# ECI Spruce to Firestore mapping (guessed)

Status: **unverified**. The client data is still held by the outgoing vendor, so
every source column below is a guess built from how lumber ERPs name things.
The mapping lives in code at `utils/mapping.mjs`; when the real export arrives,
correct the `source` arrays there and re-check the documents against
`firestore.rules`.

`mapRecord(family, row)` in that module turns one export row into the Firestore
documents it would produce, and reports the columns it could not place. It writes
nothing itself.

Confidence: `high` = near-certain, `medium` = plausible and worth checking first,
`guess` = invented, expect to change it.

## Target collections

| Family | Target collection | Status | Document id from |
| --- | --- | --- | --- |
| items | `inventory` | ready | `ItemCode`, `ItemID`, `ItemNo`, `SKU`, `ProductCode` |
| customers | `users` | ready | `Email`, `EmailAddress`, `BillToEmail` |
| vendors | `vendors` | planned | `VendorCode`, `VendorNo`, `SupplierCode`, `VendorID` |
| sales | `salesQuotes` | ready | `InvoiceNumber`, `InvoiceNo`, `DocumentNo`, `OrderNumber` |
| accounts | none yet | planned | `AccountNumber`, `AccountNo`, `GLAccount` |

`ready` means the collection and its rules exist today. `planned` means the app
has no home for that data yet; `mapRecord` refuses those families so nothing is
imported into a collection that does not exist.

## Inventory master (stock, cost, retail price) (`items`)

Target: `inventory` plus `products`, `productCosts` (ready)

| Firestore field | Guessed Spruce column(s) | Confidence | Note |
| --- | --- | --- | --- |
| `name` | `Description`, `ItemDescription`, `LongDescription`, `Name` | high |  |
| `dimensions` | `Dimensions`, `Size`, `NominalSize` | guess |  |
| `quantity` | `OnHand`, `OnHandQty`, `QtyOnHand`, `QuantityOnHand`, `Stock` | high | Must be a whole number or firestore.rules rejects the write. |
| `minimum` | `ReorderPoint`, `MinStock`, `Minimum`, `ReorderLevel` | medium |  |
| `location` | `Location`, `Warehouse`, `YardCode`, `StockLocation` | medium | Mapped onto Outdoor yard / Warehouse / Kiln. |
| `bay` | `BinLocation`, `Bin`, `Bay`, `Rack` | medium |  |
| `productCosts/cost` | `StandardCost`, `AverageCost`, `LastCost`, `UnitCost` | medium |  |
| `products/price` | `RetailPrice`, `SellPrice`, `ListPrice`, `Price1`, `Price` | high |  |
| `species` | `Species`, `SpeciesCode`, `WoodSpecies` | medium |  |
| `grade` | `Grade`, `GradeCode` | medium |  |
| `unit` | `StockingUnit`, `UOM`, `UnitOfMeasure`, `SellUnit` | medium |  |
| `vendorCode` | `VendorCode`, `PrimaryVendor`, `Vendor`, `SupplierCode` | medium |  |
| `weightPerUnitLbs` | `WeightPerUnit`, `LbsPerUnit`, `UnitWeight` | guess | Feeds the dry vs green weight engine; confirm the export is in pounds. |
| `moisturePercent` | `MoisturePercent`, `MoistureContent`, `MCPercent`, `Moisture` | guess | Must land between 0 and 100 or firestore.rules rejects the write. |
| `dryWeightLbs` | `DryWeight`, `DryWeightLbs`, `KilnDryWeight` | guess | Only present when the export carries a kiln-dry weight. |
| `isGreenStock` | `GreenFlag`, `IsGreen`, `MoistureCode` | guess |  |
| `active` | `ActiveFlag`, `Active`, `Discontinued`, `Status` | medium |  |

## Accounts receivable / customers (`customers`)

Target: `users` (ready)

User documents are keyed by Firebase Auth uid, not by customer code. Look the account up by email first and create it if it does not exist; the rest of the profile matches the users document shape.

| Firestore field | Guessed Spruce column(s) | Confidence | Note |
| --- | --- | --- | --- |
| `fullName` | `Name`, `CustomerName`, `BillToName`, `ContactName` | high |  |
| `company` | `Company`, `CompanyName`, `TradeName` | medium |  |
| `email` | `Email`, `EmailAddress`, `BillToEmail` | high |  |
| `phone` | `Phone`, `PhoneNumber`, `BillToPhone` | high |  |
| `shippingAddress.street` | `Address1`, `ShipToAddress1`, `BillToAddress1` | medium |  |
| `shippingAddress.city` | `City`, `ShipToCity`, `BillToCity` | medium |  |
| `shippingAddress.province` | `Province`, `State`, `ShipToProvince` | medium |  |
| `shippingAddress.postalCode` | `PostalCode`, `Zip`, `ZipCode`, `ShipToPostalCode` | medium |  |
| `role` | constant | high |  |

## Vendors / timber suppliers (`vendors`)

Target: `vendors` (planned)

No vendors collection or rules block yet; the admin vendor page is the next feature. Keep this mapping until that lands.

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

## Sales history / invoices (`sales`)

Target: `salesQuotes` (ready)

Historical invoices land in salesQuotes because it is the only priced sales collection today. Set createdBy to the importing staff uid, and keep taxRate at 0.05 so the GST checks in firestore.rules hold.

| Firestore field | Guessed Spruce column(s) | Confidence | Note |
| --- | --- | --- | --- |
| `customerName` | `CustomerName`, `BillToName`, `Customer` | high |  |
| `subtotal` | `Subtotal`, `NetAmount`, `GoodsAmount` | high |  |
| `discountAmount` | `DiscountAmount`, `Discount` | medium |  |
| `taxableSubtotal` | `TaxableAmount`, `TaxableSubtotal` | medium |  |
| `tax` | `TaxTotal`, `TaxAmount`, `GSTAmount`, `Tax` | high |  |
| `total` | `Total`, `InvoiceTotal`, `DocumentTotal`, `GrossAmount` | high |  |
| `taxRate` | constant | high |  |
| `createdAt` | `InvoiceDate`, `Date`, `DocumentDate` | high |  |

## General ledger accounts (`accounts`)

Target: none yet (planned)

The app has no accounting collection yet, so there is nowhere to import these rows. Mapping kept for the field names only.

| Firestore field | Guessed Spruce column(s) | Confidence | Note |
| --- | --- | --- | --- |
| `name` | `Description`, `AccountDescription`, `AccountName` | high |  |
| `type` | `Type`, `AccountType`, `Category` | medium |  |
| `balance` | `Balance`, `CurrentBalance`, `Amount` | medium |  |
| `asOf` | `AsOfDate`, `BalanceDate`, `PeriodEnd` | guess |  |
