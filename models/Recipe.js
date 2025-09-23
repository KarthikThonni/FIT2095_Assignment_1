// models/Recipe.js
import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema(
  {
    recipeId: { type: String, required: true, unique: true }, 
    userId: { type: String, required: true },                 
    title: { type: String, required: true, minlength: 3, maxlength: 100 },
    chef: { type: String, required: true, minlength: 2, maxlength: 50 },
    ingredients: {
      type: [mongoose.Schema.Types.Mixed], // allow strings or {itemName, quantity}
      validate: v => Array.isArray(v) && v.length >= 1 && v.length <= 20
    },
    instructions: {
      type: [String],
      validate: v => Array.isArray(v) && v.length >= 1 && v.length <= 15
    },
    mealType: { type: String, required: true, enum: ["Breakfast", "Lunch", "Dinner", "Snack"] },
    cuisineType: {
      type: String,
      required: true,
      enum: ["Italian", "Asian", "Mexican", "American", "French", "Indian", "Mediterranean", "Other"]
    },
    prepTime: { type: Number, required: true, min: 1, max: 480 },
    difficulty: { type: String, required: true, enum: ["Easy", "Medium", "Hard"] },
    servings: { type: Number, required: true, min: 1, max: 1000 },
    createdDate: { type: String, required: true }, 
  },
  { timestamps: true }
);

export const Recipe = mongoose.model("Recipe", recipeSchema);
