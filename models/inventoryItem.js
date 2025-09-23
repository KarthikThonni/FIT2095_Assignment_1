// models/InventoryItem.js
import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    inventoryId: {
      type: String,
      required: true,
      unique: true,
      match: /^I-\d{5}$/, // I-XXXXX format
    },
    userId: {
      type: String,
      required: true,
      match: /^U-\d{5}$/, // must link to a valid User
    },
    ingredientName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      match: /^[A-Za-z\s-]+$/, // only letters, spaces, hyphens
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
      max: 9999,
    },
    unit: {
      type: String,
      required: true,
      enum: ["pieces", "kg", "g", "liters", "ml", "cups", "tbsp", "tsp", "dozen"],
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Vegetables",
        "Fruits",
        "Meat",
        "Dairy",
        "Grains",
        "Spices",
        "Beverages",
        "Frozen",
        "Canned",
        "Other",
      ],
    },
    purchaseDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Purchase date cannot be in the future",
      },
    },
    expirationDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.purchaseDate;
        },
        message: "Expiration date must be after purchase date",
      },
    },
    location: {
      type: String,
      required: true,
      enum: ["Fridge", "Freezer", "Pantry", "Counter", "Cupboard"],
    },
    cost: {
      type: Number,
      required: true,
      min: 0.01,
      max: 999.99,
      validate: {
        validator: function (value) {
          return /^\d+(\.\d{1,2})?$/.test(value.toString());
        },
        message: "Cost must have at most 2 decimal places",
      },
    },
    createdDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Created date cannot be in the future",
      },
    },
  },
  { timestamps: true }
);

export const InventoryItem = mongoose.model("InventoryItem", inventorySchema);
