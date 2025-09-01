// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { recipes, inventory } from "./data/seed.js";
import { RECIPE_ID_REGEX, INVENTORY_ID_REGEX } from "./models/constants.js";

const STUDENT_ID = "33905320";
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ---------------- View / Middleware ---------------- */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));

/* ---------------- Helpers ---------------- */
function sumTotalInventoryValue(items) {
  return items.reduce((acc, it) => acc + (Number(it.cost) || 0), 0);
}
function daysUntil(dateStr) {
  const today = new Date();
  const exp = new Date(dateStr);
  return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
}
function nextId(prefix, arr, regex) {
  let max = 0;
  for (const x of arr) {
    const id = prefix === "R" ? x.recipeId : x.inventoryId;
    const m = String(id).match(regex);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(5, "0")}`;
}
function toLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

/* ---------------- Home (unique layout) ---------------- */
app.get(`/home-${STUDENT_ID}`, (req, res) => {
  const cuisineSet = new Set(recipes.map(r => (r.cuisineType ?? (r.toJSON ? r.toJSON().cuisineType : ""))));
  const totalValue = sumTotalInventoryValue(inventory);

  // latest 3 recipes
  const recentRecipes = recipes
    .map(r => (r.toJSON ? r.toJSON() : r))
    .slice(-3)
    .reverse();

  // soonest 3 expiring items (<=3 days, includes expired)
  const expiringItems = inventory
    .map(i => {
      const x = i.toJSON ? i.toJSON() : i;
      return { ...x, daysToExpire: daysUntil(x.expirationDate) };
    })
    .sort((a, b) => a.daysToExpire - b.daysToExpire)
    .filter(x => x.daysToExpire <= 3)
    .slice(0, 3);

  res.render("index", {
    studentId: STUDENT_ID,
    stats: {
      recipeCount: recipes.length,
      inventoryCount: inventory.length,
      cuisineTypes: cuisineSet.size,
      totalInventoryValue: totalValue.toFixed(2),
    },
    recentRecipes,
    expiringItems,
  });
});

/* ---------------- Recipes ---------------- */
// View: all recipes
app.get(`/recipes-${STUDENT_ID}`, (req, res) => {
  res.render("recipes", {
    studentId: STUDENT_ID,
    recipes: recipes.map(r => (r.toJSON ? r.toJSON() : r)),
  });
});

// View: add recipe form
app.get(`/add-recipe-${STUDENT_ID}`, (req, res) => {
  res.render("addRecipe", {
    studentId: STUDENT_ID,
    mealTypes: ["Breakfast", "Lunch", "Dinner", "Snack"],
    difficulties: ["Easy", "Medium", "Hard"],
  });
});

// API: list recipes (JSON)
app.get(`/api/recipes-${STUDENT_ID}`, (req, res) => {
  res.status(200).json(recipes.map(r => (r.toJSON ? r.toJSON() : r)));
});

// API: create recipe
app.post(`/api/add-recipe-${STUDENT_ID}`, (req, res) => {
  const {
    title, chef, mealType, cuisineType, prepTime,
    difficulty, servings, ingredients, instructions, createdDate
  } = req.body;

  if (!title || !chef || !mealType || !cuisineType || !difficulty) {
    return res.redirect(`/error-${STUDENT_ID}?msg=Missing+required+fields`);
  }

  const newRecipe = {
    recipeId: nextId("R", recipes, /^R-(\d{5})$/),
    title,
    chef,
    ingredients: Array.isArray(ingredients) ? ingredients : toLines(ingredients),
    instructions: Array.isArray(instructions) ? instructions : toLines(instructions),
    mealType,
    cuisineType,
    prepTime: Number(prepTime) || 0,
    difficulty,
    servings: Number(servings) || 1,
    createdDate: createdDate || new Date().toISOString().split("T")[0],
  };

  recipes.push(newRecipe);
  return res.redirect(`/recipes-${STUDENT_ID}`);
});

// API: delete recipe
app.post(`/api/delete-recipe-${STUDENT_ID}`, (req, res) => {
  const { recipeId } = req.body;
  if (typeof recipeId !== "string" || !RECIPE_ID_REGEX.test(recipeId)) {
    return res.redirect(`/error-${STUDENT_ID}?msg=Invalid+recipeId`);
  }
  const idx = recipes.findIndex(r => r.recipeId === recipeId);
  if (idx === -1) return res.redirect(`/error-${STUDENT_ID}?msg=Recipe+not+found`);
  recipes.splice(idx, 1);
  return res.redirect(`/recipes-${STUDENT_ID}`);
});

/* ---------------- Inventory ---------------- */
// View: inventory dashboard
app.get(`/inventory-${STUDENT_ID}`, (req, res) => {
  const items = inventory.map(i => {
    const plain = i.toJSON ? i.toJSON() : i;
    const dte = daysUntil(plain.expirationDate);
    return { ...plain, daysToExpire: dte, isExpiringSoon: dte <= 3, isExpired: dte < 0 };
  });
  const totalValue = sumTotalInventoryValue(items);

  res.render("inventory", {
    studentId: STUDENT_ID,
    items,
    totalValue: totalValue.toFixed(2),
  });
});

// View: add inventory form
app.get(`/add-inventory-${STUDENT_ID}`, (req, res) => {
  res.render("addInventory", {
    studentId: STUDENT_ID,
    categories: ["Vegetables", "Fruits", "Grains", "Dairy", "Meat", "Pantry"],
    locations: ["Fridge", "Freezer", "Pantry", "Cupboard"],
    units: ["pieces", "kg", "g", "ml", "L", "pack"],
  });
});

// API: list inventory (JSON)
app.get(`/api/inventory-${STUDENT_ID}`, (req, res) => {
  res.status(200).json(inventory.map(i => (i.toJSON ? i.toJSON() : i)));
});

// API: create inventory item
app.post(`/api/add-inventory-${STUDENT_ID}`, (req, res) => {
  const {
    userId, ingredientName, quantity, unit, category,
    purchaseDate, expirationDate, location, cost, createdDate
  } = req.body;

  if (!userId || !ingredientName || !unit || !category || !purchaseDate || !expirationDate || !location) {
    return res.redirect(`/error-${STUDENT_ID}?msg=Missing+required+fields`);
  }

  const newItem = {
    inventoryId: nextId("I", inventory, /^I-(\d{5})$/),
    userId,
    ingredientName,
    quantity: Number(quantity) || 0,
    unit,
    category,
    purchaseDate,
    expirationDate,
    location,
    cost: Number(cost) || 0,
    createdDate: createdDate || new Date().toISOString().split("T")[0],
  };

  inventory.push(newItem);
  return res.redirect(`/inventory-${STUDENT_ID}`);
});

// API: delete inventory item
app.post(`/api/delete-inventory-${STUDENT_ID}`, (req, res) => {
  const { inventoryId } = req.body;
  if (typeof inventoryId !== "string" || !INVENTORY_ID_REGEX.test(inventoryId)) {
    return res.redirect(`/error-${STUDENT_ID}?msg=Invalid+inventoryId`);
  }
  const idx = inventory.findIndex(i => i.inventoryId === inventoryId);
  if (idx === -1) return res.redirect(`/error-${STUDENT_ID}?msg=Item+not+found`);
  inventory.splice(idx, 1);
  return res.redirect(`/inventory-${STUDENT_ID}`);
});

/* ---------------- (Optional) HD: Filter Recipes ---------------- */
app.get(`/filter-recipes-${STUDENT_ID}`, (req, res) => {
  const { mealType, cuisineType, difficulty } = req.query;
  let data = recipes.map(r => (r.toJSON ? r.toJSON() : r));
  if (mealType && mealType !== "All") data = data.filter(r => r.mealType === mealType);
  if (cuisineType && cuisineType.trim()) data = data.filter(r => r.cuisineType.toLowerCase().includes(cuisineType.toLowerCase()));
  if (difficulty && difficulty !== "All") data = data.filter(r => r.difficulty === difficulty);

  res.render("filterRecipes", {
    studentId: STUDENT_ID,
    recipes: data,
    selected: { mealType: mealType || "All", cuisineType: cuisineType || "", difficulty: difficulty || "All" },
  });
});

/* ---------------- Error Handling ---------------- */
app.get(`/error-${STUDENT_ID}`, (req, res) => {
  const message = req.query.msg || "Invalid request.";
  res.status(400).render("error", { message });
});
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).render("error", { message: err.message || "Server error" });
});
app.use((req, res) => {
  res.status(404).render("notfound", { path: req.originalUrl });
});

/* ---------------- Start ---------------- */
app.listen(PORT, () => {
  console.log(`✅ Running: http://localhost:${PORT}/home-${STUDENT_ID}`);
});
