// models/Recipe.js
import mongoose from "mongoose";

const RECIPE_ID_RE = /^R-\d{5}$/;
const USER_ID_RE = /^U-\d{5}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const RecipeSchema = new mongoose.Schema(
  {
    recipeId: {
      type: String,
      required: true,
      unique: true,
      validate: v => RECIPE_ID_RE.test(v),
    },
    userId: {
      type: String,
      required: true,
      validate: v => USER_ID_RE.test(v),
      index: true,
    },
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
      trim: true,
    },
    chef: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      match: /^[A-Za-z' -]+$/,
      trim: true,
    },
    
    ingredients: {
      type: [String],
      validate: {
        validator(arr) {
          if (!Array.isArray(arr)) return false;
          if (arr.length < 1 || arr.length > 20) return false;
          return arr.every(s => typeof s === "string" && s.trim().length >= 3);
        },
        message: "ingredients must have 1–20 items, each at least 3 chars",
      },
      required: true,
    },
    instructions: {
      type: [String],
      validate: {
        validator(arr) {
          if (!Array.isArray(arr)) return false;
          if (arr.length < 1 || arr.length > 15) return false;
          return arr.every(s => typeof s === "string" && s.trim().length >= 10);
        },
        message: "instructions must have 1–15 steps, each at least 10 chars",
      },
      required: true,
    },
    mealType: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
    },
    cuisineType: {
      type: String,
      required: true,
      enum: [
        "Italian",
        "Asian",
        "Mexican",
        "American",
        "French",
        "Indian",
        "Mediterranean",
        "Other",
      ],
    },
    prepTime: {
      type: Number,
      required: true,
      min: 1,
      max: 480, 
      validate: {
        validator: Number.isInteger,
        message: "prepTime must be an integer",
      },
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
    },
    servings: {
      type: Number,
      required: true,
      min: 1,
      max: 20, 
      validate: {
        validator: Number.isInteger,
        message: "servings must be an integer",
      },
    },
    createdDate: {
      type: String, 
      required: true,
      validate: {
        validator(v) {
          if (!DATE_RE.test(v)) return false;
          const today = new Date();
          const d = new Date(v + "T00:00:00");
          return d <= new Date(today.getFullYear(), today.getMonth(), today.getDate());
        },
        message: "createdDate must be YYYY-MM-DD and not in the future",
      },
    },
  },
  { collection: "recipes", timestamps: true }
);

RecipeSchema.index({ userId: 1, title: 1 }, { unique: true });

export const Recipe = mongoose.model("Recipe", RecipeSchema);
