// models/inventoryItem.js
import { INVENTORY_ID_REGEX, ISO_DATE_REGEX, assert } from "./constants.js";

export class InventoryItem {
  constructor(data) {
    this.inventoryId = data.inventoryId;
    this.userId = data.userId;
    this.ingredientName = data.ingredientName;
    this.quantity = Number(data.quantity);
    this.unit = data.unit;
    this.category = data.category;
    this.purchaseDate = data.purchaseDate;
    this.expirationDate = data.expirationDate;
    this.location = data.location;
    this.cost = Number(data.cost);
    this.createdDate = data.createdDate;
    this.validate();
  }

  validate() {
    assert(INVENTORY_ID_REGEX.test(this.inventoryId), "Invalid inventoryId (I-XXXXX).");
    assert(typeof this.userId === "string" && this.userId.trim(), "userId required.");
    assert(typeof this.ingredientName === "string" && this.ingredientName.trim(), "ingredientName required.");
    assert(Number.isFinite(this.quantity) && this.quantity >= 0, "quantity must be >= 0.");
    assert(typeof this.unit === "string" && this.unit.trim(), "unit required.");
    assert(typeof this.category === "string" && this.category.trim(), "category required.");
    assert(ISO_DATE_REGEX.test(this.purchaseDate), "purchaseDate must be YYYY-MM-DD.");
    assert(ISO_DATE_REGEX.test(this.expirationDate), "expirationDate must be YYYY-MM-DD.");
    assert(typeof this.location === "string" && this.location.trim(), "location required.");
    assert(Number.isFinite(this.cost) && this.cost >= 0, "cost must be >= 0.");
    assert(ISO_DATE_REGEX.test(this.createdDate), "createdDate must be YYYY-MM-DD.");
  }

  toJSON() {
    return {
      inventoryId: this.inventoryId,
      userId: this.userId,
      ingredientName: this.ingredientName,
      quantity: this.quantity,
      unit: this.unit,
      category: this.category,
      purchaseDate: this.purchaseDate,
      expirationDate: this.expirationDate,
      location: this.location,
      cost: this.cost,
      createdDate: this.createdDate,
    };
  }

  static from(data) {
    return new InventoryItem(data);
  }
}
