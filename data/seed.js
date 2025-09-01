// data/seed.js

// --- Recipe Sample Data ---
export const recipes = [
  {
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
    mealType: "Dinner",
    cuisineType: "Italian",
    prepTime: 25,
    difficulty: "Medium",
    servings: 4,
    createdDate: "2025-07-20",
  },
  {
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
    mealType: "Breakfast",
    cuisineType: "Mediterranean",
    prepTime: 10,
    difficulty: "Easy",
    servings: 2,
    createdDate: "2025-07-21",
  },
];

// --- Inventory Sample Data ---
export const inventory = [
  {
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
  },
  {
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
  },
];
