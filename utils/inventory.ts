import {
  collection,
  doc,
  runTransaction,
  type Transaction,
} from "firebase/firestore";

import type { InventoryRecord, ProductRecord } from "@/types/types";
import type { YardLocation } from "@/types/types";
import { auth, db } from "@/utils/firebase";

const locations: readonly YardLocation[] = [
  "Outdoor yard",
  "Warehouse",
  "Kiln",
];
const maximumQuantity = 1_000_000;

export interface NewInventoryProduct {
  sku: string;
  name: string;
  price: number;
  dimensions: string;
  location: YardLocation;
  bay: string;
  quantity: number;
  minimum: number;
}

export interface InventoryDetails {
  dimensions: string;
  location: YardLocation;
  bay: string;
  minimum: number;
}

function currentUserId() {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in again before adding inventory.");
  return user.uid;
}

function validateSku(value: string) {
  const sku = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(sku)) {
    throw new Error("Use a SKU with letters, numbers, dots, underscores or hyphens.");
  }
  return sku;
}

function validateQuantity(quantity: number) {
  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    quantity > maximumQuantity
  ) {
    throw new Error("Enter a whole quantity between 1 and 1,000,000.");
  }
}

function validateInventoryDetails(details: InventoryDetails) {
  if (
    !details.dimensions.trim() ||
    details.dimensions.trim().length > 80 ||
    !details.bay.trim() ||
    details.bay.trim().length > 24 ||
    !locations.includes(details.location) ||
    !Number.isSafeInteger(details.minimum) ||
    details.minimum < 0 ||
    details.minimum > maximumQuantity
  ) {
    throw new Error("Enter valid dimensions, location, bay and minimum stock.");
  }
}

function addActivity(
  transaction: Transaction,
  text: string,
  userId: string,
) {
  transaction.set(doc(collection(db, "yardActivity")), {
    text,
    at: new Date().toISOString(),
    createdBy: userId,
  });
}

export async function createInventoryProduct(input: NewInventoryProduct) {
  const sku = validateSku(input.sku);
  const name = input.name.trim();
  const price = input.price;
  const dimensions = input.dimensions.trim();
  const bay = input.bay.trim();
  validateQuantity(input.quantity);
  validateInventoryDetails({
    dimensions,
    location: input.location,
    bay,
    minimum: input.minimum,
  });

  if (!name || name.length > 120 || !Number.isFinite(price) || price < 0) {
    throw new Error("Enter a product name and a valid non-negative sale price.");
  }

  const userId = currentUserId();
  const productRef = doc(db, "products", sku);
  const inventoryRef = doc(db, "inventory", sku);

  await runTransaction(db, async (transaction) => {
    const productSnapshot = await transaction.get(productRef);
    const inventorySnapshot = await transaction.get(inventoryRef);
    if (productSnapshot.exists() || inventorySnapshot.exists()) {
      throw new Error("That SKU already exists. Receive stock for the existing product instead.");
    }

    const product: Omit<ProductRecord, "id"> = { name, price };
    const inventory: Omit<InventoryRecord, "id"> = {
      name,
      dimensions,
      location: input.location,
      bay,
      quantity: input.quantity,
      minimum: input.minimum,
    };
    transaction.set(productRef, product);
    transaction.set(inventoryRef, inventory);
    addActivity(
      transaction,
      `Added ${input.quantity} pieces of ${name} (${sku}) to ${input.location}, bay ${bay}.`,
      userId,
    );
  });
}

export async function receiveInventory(
  skuValue: string,
  quantity: number,
  details?: InventoryDetails,
) {
  const sku = validateSku(skuValue);
  validateQuantity(quantity);
  if (details) validateInventoryDetails(details);

  const userId = currentUserId();
  const productRef = doc(db, "products", sku);
  const inventoryRef = doc(db, "inventory", sku);

  await runTransaction(db, async (transaction) => {
    const productSnapshot = await transaction.get(productRef);
    if (!productSnapshot.exists()) {
      throw new Error("That catalog product could not be found.");
    }

    const inventorySnapshot = await transaction.get(inventoryRef);
    const product = productSnapshot.data() as Omit<ProductRecord, "id">;

    if (inventorySnapshot.exists()) {
      const currentInventory =
        inventorySnapshot.data() as Omit<InventoryRecord, "id">;
      const nextQuantity = currentInventory.quantity + quantity;
      if (
        !Number.isSafeInteger(currentInventory.quantity) ||
        currentInventory.quantity < 0 ||
        nextQuantity > maximumQuantity
      ) {
        throw new Error("The new quantity would exceed the supported inventory limit.");
      }

      transaction.update(inventoryRef, { quantity: nextQuantity });
      addActivity(
        transaction,
        `Received ${quantity} pieces of ${product.name} (${sku}); ${nextQuantity} now on hand.`,
        userId,
      );
      return;
    }

    if (!details) {
      throw new Error("Add the storage details to create this product's first stock record.");
    }

    transaction.set(inventoryRef, {
      name: product.name,
      dimensions: details.dimensions.trim(),
      location: details.location,
      bay: details.bay.trim(),
      quantity,
      minimum: details.minimum,
    });
    addActivity(
      transaction,
      `Added initial stock of ${quantity} pieces of ${product.name} (${sku}) to ${details.location}, bay ${details.bay.trim()}.`,
      userId,
    );
  });
}
