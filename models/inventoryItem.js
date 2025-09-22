import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema({
  inventoryId: { type: String, required: true, unique: true },            
  userId: { type: String, required: true },                               
  ingredientName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, enum: ["pieces", "kg", "g", "liters", "ml", "cups", "tbsp", "tsp", "dozen"], required: true },
  category: { type: String, enum: ["Vegetables", "Fruits", "Meat", "Dairy", "Grains", "Spices", "Beverages", "Frozen", "Canned", "Other"], required: true },
  purchaseDate: { type: Date, required: true },
  expirationDate: { type: Date, required: true },
  location: { type: String, enum: ["Fridge", "Freezer", "Pantry", "Counter", "Cupboard"], required: true },
  cost: { type: Number, required: true },
  createdDate: { type: Date, required: true }
});

const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
export default InventoryItem;
