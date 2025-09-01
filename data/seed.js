// data/seed.js
import { MealType, Difficulty } from "../models/enums.js";
import { Recipe } from "../models/Recipe.js";
import { InventoryItem } from "../models/InventoryItem.js";

export const recipes = [
  Recipe.from({
    recipeId: "R-00001",
    title: "Classic Spaghetti Carbonara",
    chef: "MarioRossi-87654321",
    ingredients: [
      "400g spaghetti",
      "200g pancetta",
      "4 large eggs",
      "100g Pecorino Romano",
      "Black pepper",
    ],
    instructions: [
      "Boil salted water for pasta",
      "Cook pancetta until crispy",
      "Whisk eggs with cheese",
      "Combine hot pasta with pancetta",
      "Add egg mixture off heat",
    ],
    mealType: MealType.DINNER,
    cuisineType: "Italian",
    prepTime: 25,
    difficulty: Difficulty.MEDIUM,
    servings: 4,
    createdDate: "2025-07-20",
  }),
  Recipe.from({
    recipeId: "R-00002",
    title: "Avocado Toast Supreme",
    chef: "SarahJones-12345678",
    ingredients: [
      "2 slices sourdough bread",
      "1 ripe avocado",
      "1 tomato",
      "Feta cheese",
      "Olive oil",
      "Lemon juice",
    ],
    instructions: [
      "Toast bread until golden",
      "Mash avocado with lemon",
      "Slice tomato",
      "Spread avocado on toast",
      "Top with tomato and feta",
    ],
    mealType: MealType.BREAKFAST,
    cuisineType: "Mediterranean",
    prepTime: 10,
    difficulty: Difficulty.EASY,
    servings: 2,
    createdDate: "2025-07-21",
  }),
];

export const inventory = [
  InventoryItem.from({
    inventoryId: "I-00001",
    userId: "SarahJones-12345678",
    ingredientName: "Fresh Tomatoes",
    quantity: 8,
    unit: "pieces",
    category: "Vegetables",
    purchaseDate: "2025-07-18",
    expirationDate: "2025-07-25",
    location: "Fridge",
    cost: 6.4,
    createdDate: "2025-07-18",
  }),
  InventoryItem.from({
    inventoryId: "I-00002",
    userId: "MarioRossi-87654321",
    ingredientName: "Spaghetti Pasta",
    quantity: 2,
    unit: "kg",
    category: "Grains",
    purchaseDate: "2025-07-15",
    expirationDate: "2025-12-15",
    location: "Pantry",
    cost: 8.9,
    createdDate: "2025-07-22",
  }),
];
