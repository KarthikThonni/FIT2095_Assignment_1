// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { recipes, inventory } from "./data/seed.js";
import { RECIPE_ID_REGEX, INVENTORY_ID_REGEX, ISO_DATE_REGEX } from "./models/constants.js";

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
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ---- NEW: Low-stock helper ---- */
function isLowStockByUnit(quantity, unit) {
  const q = Number(quantity) || 0;
  switch (unit) {
    case "pieces": return q < 3;
    case "kg":     return q < 0.5;
    case "g":      return q < 100;
    case "L":      return q < 0.5;
    case "ml":     return q < 100;
    case "pack":   return q < 1;
    default:       return q <= 0; // fallback
  }
}

/* ---------------- HD Task 4: Validation Middleware ---------------- */
const MEAL_TYPES = new Set(["Breakfast", "Lunch", "Dinner", "Snack"]);
const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const INV_UNITS = new Set(["pieces", "kg", "g", "ml", "L", "pack"]);
const INV_CATEGORIES = new Set(["Vegetables", "Fruits", "Grains", "Dairy", "Meat", "Pantry"]);
const INV_LOCATIONS = new Set(["Fridge", "Freezer", "Pantry", "Cupboard"]);

function bad(res, msg) {
  return res.redirect(`/error-${STUDENT_ID}?msg=${encodeURIComponent(msg)}`);
}

function validateRecipeBody(req, res, next) {
  const {
    title, chef, mealType, cuisineType, prepTime,
    difficulty, servings, ingredients, instructions, createdDate,
  } = req.body;

  if (!title?.trim()) return bad(res, "title is required");
  if (!chef?.trim()) return bad(res, "chef is required");
  if (!mealType || !MEAL_TYPES.has(mealType)) return bad(res, `mealType must be one of: ${[...MEAL_TYPES].join(", ")}`);
  if (!cuisineType?.trim()) return bad(res, "cuisineType is required");

  const pt = Number(prepTime);
  if (!Number.isFinite(pt) || pt < 0) return bad(res, "prepTime must be a number ≥ 0");

  if (!difficulty || !DIFFICULTIES.has(difficulty)) return bad(res, `difficulty must be one of: ${[...DIFFICULTIES].join(", ")}`);

  const sv = Number(servings);
  if (!Number.isFinite(sv) || sv <= 0) return bad(res, "servings must be a number > 0");

  if (!ingredients || (Array.isArray(ingredients) ? ingredients.length === 0 : toLines(ingredients).length === 0)) {
    return bad(res, "ingredients must be non-empty");
  }
  if (!instructions || (Array.isArray(instructions) ? instructions.length === 0 : toLines(instructions).length === 0)) {
    return bad(res, "instructions must be non-empty");
  }

  const cd = createdDate || new Date().toISOString().split("T")[0];
  if (!ISO_DATE_REGEX.test(cd)) return bad(res, "createdDate must be YYYY-MM-DD");
  req.body.createdDate = cd; // normalize
  next();
}

function validateInventoryBody(req, res, next) {
  const {
    userId, ingredientName, quantity, unit, category,
    purchaseDate, expirationDate, location, cost, createdDate,
  } = req.body;

  if (!userId?.trim()) return bad(res, "userId is required");
  if (!ingredientName?.trim()) return bad(res, "ingredientName is required");

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 0) return bad(res, "quantity must be a number ≥ 0");

  if (!unit || !INV_UNITS.has(unit)) return bad(res, `unit must be one of: ${[...INV_UNITS].join(", ")}`);
  if (!category || !INV_CATEGORIES.has(category)) return bad(res, `category must be one of: ${[...INV_CATEGORIES].join(", ")}`);
  if (!location || !INV_LOCATIONS.has(location)) return bad(res, `location must be one of: ${[...INV_LOCATIONS].join(", ")}`);

  if (!ISO_DATE_REGEX.test(purchaseDate || "")) return bad(res, "purchaseDate must be YYYY-MM-DD");
  if (!ISO_DATE_REGEX.test(expirationDate || "")) return bad(res, "expirationDate must be YYYY-MM-DD");

  if (new Date(expirationDate) < new Date(purchaseDate)) {
    return bad(res, "expirationDate cannot be before purchaseDate");
  }

  const c = Number(cost);
  if (!Number.isFinite(c) || c < 0) return bad(res, "cost must be a number ≥ 0");

  const cd = createdDate || new Date().toISOString().split("T")[0];
  if (!ISO_DATE_REGEX.test(cd)) return bad(res, "createdDate must be YYYY-MM-DD");
  req.body.createdDate = cd; // normalize
  next();
}

/* ---------------- Home ---------------- */
app.get(`/home-${STUDENT_ID}`, (req, res) => {
  const cuisineSet = new Set(
    recipes.map((r) => (r.toJSON ? r.toJSON().cuisineType : r.cuisineType))
  );
  const totalValue = sumTotalInventoryValue(inventory);

  const recentRecipes = recipes.map((r) => (r.toJSON ? r.toJSON() : r)).slice(-3).reverse();
  const expiringItems = inventory
    .map((i) => {
      const x = i.toJSON ? i.toJSON() : i;
      return { ...x, daysToExpire: daysUntil(x.expirationDate) };
    })
    .sort((a, b) => a.daysToExpire - b.daysToExpire)
    .filter((x) => x.daysToExpire <= 3)
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
app.get(`/recipes-${STUDENT_ID}`, (req, res) => {
  res.render("recipes", {
    studentId: STUDENT_ID,
    recipes: recipes.map((r) => (r.toJSON ? r.toJSON() : r)),
  });
});

app.get(`/add-recipe-${STUDENT_ID}`, (req, res) => {
  res.render("addRecipe", {
    studentId: STUDENT_ID,
    mealTypes: ["Breakfast", "Lunch", "Dinner", "Snack"],
    difficulties: ["Easy", "Medium", "Hard"],
  });
});

app.get(`/filter-recipes-${STUDENT_ID}`, (req, res) => {
  const { mealType, cuisineType, difficulty } = req.query;
  let data = recipes.map((r) => (r.toJSON ? r.toJSON() : r));
  if (mealType && mealType !== "All") data = data.filter((r) => r.mealType === mealType);
  if (cuisineType && cuisineType.trim())
    data = data.filter((r) =>
      (r.cuisineType || "").toLowerCase().includes(cuisineType.toLowerCase())
    );
  if (difficulty && difficulty !== "All") data = data.filter((r) => r.difficulty === difficulty);

  res.render("filterRecipes", {
    studentId: STUDENT_ID,
    recipes: data,
    selected: { mealType: mealType || "All", cuisineType: cuisineType || "", difficulty: difficulty || "All" },
  });
});

app.get(`/search-recipes-${STUDENT_ID}`, (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  let data = recipes.map((r) => (r.toJSON ? r.toJSON() : r));
  if (q) {
    data = data.filter(
      (r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.chef || "").toLowerCase().includes(q) ||
        (r.cuisineType || "").toLowerCase().includes(q)
    );
  }
  res.render("searchRecipes", { studentId: STUDENT_ID, q: req.query.q || "", results: data });
});

// Delete confirmation page
app.get(`/delete-recipe-${STUDENT_ID}`, (req, res) => {
  const all = recipes.map((r) => (r.toJSON ? r.toJSON() : r));
  const selectedId = req.query.recipeId || all[0]?.recipeId || "";
  const selected = all.find((r) => r.recipeId === selectedId) || null;

  res.render("deleteRecipe", {
    studentId: STUDENT_ID,
    allRecipes: all,
    selected,
    selectedId,
    query: req.query,
  });
});

// API: Add recipe (VALIDATED)
app.post(`/api/add-recipe-${STUDENT_ID}`, validateRecipeBody, (req, res) => {
  const {
    title, chef, mealType, cuisineType, prepTime, difficulty,
    servings, ingredients, instructions, createdDate,
  } = req.body;

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
    createdDate,
  };

  recipes.push(newRecipe);
  return res.redirect(`/recipes-${STUDENT_ID}`);
});

// API: Delete recipe (forces confirmation)
app.post(`/api/delete-recipe-${STUDENT_ID}`, (req, res) => {
  const { recipeId, confirm } = req.body;

  if (typeof recipeId !== "string" || !RECIPE_ID_REGEX.test(recipeId)) {
    return bad(res, "Invalid recipeId");
  }

  if (confirm !== "on") {
    const msg = encodeURIComponent("Please confirm deletion before proceeding.");
    return res.redirect(
      `/delete-recipe-${STUDENT_ID}?recipeId=${encodeURIComponent(recipeId)}&msg=${msg}`
    );
  }

  const idx = recipes.findIndex((r) => r.recipeId === recipeId);
  if (idx === -1) return bad(res, "Recipe not found");

  recipes.splice(idx, 1);
  return res.redirect(`/recipes-${STUDENT_ID}`);
});

/* ---------------- Inventory ---------------- */
app.get(`/inventory-${STUDENT_ID}`, (req, res) => {
  const items = inventory.map((i) => {
    const plain = i.toJSON ? i.toJSON() : i;
    const dte = daysUntil(plain.expirationDate);
    const low = isLowStockByUnit(plain.quantity, plain.unit); // NEW
    return {
      ...plain,
      daysToExpire: dte,
      isExpiringSoon: dte <= 3,
      isExpired: dte < 0,
      isLowStock: low, // NEW
    };
  });

  const totalValue = sumTotalInventoryValue(items);
  const lowStockCount = items.filter((x) => x.isLowStock).length; // NEW

  res.render("inventory", {
    studentId: STUDENT_ID,
    items,
    totalValue: totalValue.toFixed(2),
    lowStockCount, // NEW
  });
});

app.get(`/add-inventory-${STUDENT_ID}`, (req, res) => {
  res.render("addInventory", {
    studentId: STUDENT_ID,
    categories: [...INV_CATEGORIES],
    locations: [...INV_LOCATIONS],
    units: [...INV_UNITS],
  });
});

// API: Add inventory (VALIDATED)
app.post(`/api/add-inventory-${STUDENT_ID}`, validateInventoryBody, (req, res) => {
  const {
    userId, ingredientName, quantity, unit, category,
    purchaseDate, expirationDate, location, cost, createdDate,
  } = req.body;

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
    createdDate,
  };

  inventory.push(newItem);
  return res.redirect(`/inventory-${STUDENT_ID}`);
});

app.post(`/api/delete-inventory-${STUDENT_ID}`, (req, res) => {
  const { inventoryId } = req.body;
  if (typeof inventoryId !== "string" || !INVENTORY_ID_REGEX.test(inventoryId)) {
    return bad(res, "Invalid inventoryId");
  }
  const idx = inventory.findIndex((i) => i.inventoryId === inventoryId);
  if (idx === -1) return bad(res, "Item not found");
  inventory.splice(idx, 1);
  return res.redirect(`/inventory-${STUDENT_ID}`);
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
