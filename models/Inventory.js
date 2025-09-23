// models/Inventory.js
import mongoose from "mongoose";

const INVENTORY_ID_RE = /^I-\d{5}$/;
const USER_ID_RE = /^U-\d{5}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const InventorySchema = new mongoose.Schema(
  {
    inventoryId: {
      type: String,
      required: true,
      unique: true,
      validate: v => INVENTORY_ID_RE.test(v),
    },
    userId: {
      type: String,
      required: true,
      validate: v => USER_ID_RE.test(v),
    },
    ingredientName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      match: /^[A-Za-z\- ]+$/,
      trim: true,
    },
    quantity: { type: Number, required: true, min: 0.01, max: 9999 },
    unit: {
      type: String,
      required: true,
      enum: ["pieces", "kg", "g", "liters", "ml", "cups", "tbsp", "tsp", "dozen"],
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Vegetables", "Fruits", "Meat", "Dairy", "Grains", "Spices",
        "Beverages", "Frozen", "Canned", "Other",
      ],
    },
    purchaseDate: {
      type: String,
      required: true,
      validate: v => DATE_RE.test(v),
    },
    expirationDate: {
      type: String,
      required: true,
      validate: v => DATE_RE.test(v),
    },
    location: {
      type: String,
      required: true,
      enum: ["Fridge", "Freezer", "Pantry", "Counter", "Cupboard"],
    },
    cost: { type: Number, required: true, min: 0.01, max: 999.99 },
    createdDate: {
      type: String,
      required: true,
      validate: v => DATE_RE.test(v),
    },
  },
  { collection: "inventory", timestamps: true }
);

export const Inventory = mongoose.model("Inventory", InventorySchema);
