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
function isLowStockByUnit(quantity, unit) {
  const q = Number(quantity) || 0;
  switch (unit) {
    case "pieces": return q < 3;
    case "kg":     return q < 0.5;
    case "g":      return q < 100;
    case "L":      return q < 0.5;
    case "ml":     return q < 100;
    case "pack":   return q < 1;
    default:       return q <= 0;
  }
}

/* ---------------- Validation Middleware ---------------- */
const MEAL_TYPES = new Set(["Breakfast", "Lunch", "Dinner", "Snack"]);
const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const INV_UNITS = new Set(["pieces", "kg", "g", "ml", "L", "pack"]);
const INV_CATEGORIES = new Set(["Vegetables", "Fruits", "Grains", "Dairy", "Meat", "Pantry"]);
const INV_LOCATIONS = new Set(["Fridge", "Freezer", "Pantry", "Cupboard"]);

function bad(res, msg) {
  return res.redirect(`/error-${STUDENT_ID}?msg=${encodeURIComponent(msg)}`);
}

function validateRecipeBody(req, res, next) {
  const { title, chef, mealType, cuisineType, prepTime,
    difficulty, servings, ingredients, instructions, createdDate } = req.body;

  if (!title?.trim()) return bad(res, "title is required");
  if (!chef?.trim()) return bad(res, "chef is required");
  if (!mealType || !MEAL_TYPES.has(mealType)) return bad(res, "invalid mealType");
  if (!cuisineType?.trim()) return bad(res, "cuisineType is required");

  const pt = Number(prepTime);
  if (!Number.isFinite(pt) || pt < 0) return bad(res, "prepTime must be ≥0");

  if (!difficulty || !DIFFICULTIES.has(difficulty)) return bad(res, "invalid difficulty");

  const sv = Number(servings);
  if (!Number.isFinite(sv) || sv <= 0) return bad(res, "servings must be >0");

  if (!ingredients || (Array.isArray(ingredients) ? ingredients.length === 0 : toLines(ingredients).length === 0)) {
    return bad(res, "ingredients required");
  }
  if (!instructions || (Array.isArray(instructions) ? instructions.length === 0 : toLines(instructions).length === 0)) {
    return bad(res, "instructions required");
  }

  const cd = createdDate || new Date().toISOString().split("T")[0];
  if (!ISO_DATE_REGEX.test(cd)) return bad(res, "createdDate must be YYYY-MM-DD");
  req.body.createdDate = cd;
  next();
}

function validateInventoryBody(req, res, next) {
  const { userId, ingredientName, quantity, unit, category,
    purchaseDate, expirationDate, location, cost, createdDate } = req.body;

  if (!userId?.trim()) return bad(res, "userId required");
  if (!ingredientName?.trim()) return bad(res, "ingredientName required");

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 0) return bad(res, "quantity must be ≥0");

  if (!unit || !INV_UNITS.has(unit)) return bad(res, "invalid unit");
  if (!category || !INV_CATEGORIES.has(category)) return bad(res, "invalid category");
  if (!location || !INV_LOCATIONS.has(location)) return bad(res, "invalid location");

  if (!ISO_DATE_REGEX.test(purchaseDate || "")) return bad(res, "bad purchaseDate");
  if (!ISO_DATE_REGEX.test(expirationDate || "")) return bad(res, "bad expirationDate");
  if (new Date(expirationDate) < new Date(purchaseDate)) return bad(res, "expiration before purchase");

  const c = Number(cost);
  if (!Number.isFinite(c) || c < 0) return bad(res, "cost must be ≥0");

  const cd = createdDate || new Date().toISOString().split("T")[0];
  if (!ISO_DATE_REGEX.test(cd)) return bad(res, "bad createdDate");
  req.body.createdDate = cd;
  next();
}

/* ---------------- Pantry Match Helpers ---------------- */
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const STOPWORDS = new Set(["g","kg","ml","l","tbsp","tsp","cup","cups","large","small","ripe","fresh","pieces","slice","slices"]);
function ingredientKeywords(line) {
  const words = normalize(line).split(" ");
  const keep = words.filter(w => w && !STOPWORDS.has(w) && isNaN(Number(w)));
  return keep.slice(-2).join(" ");
}
function inventoryMatchScore(ingredientLine, invItemName) {
  const a = normalize(ingredientLine);
  const b = normalize(invItemName);
  if (a.includes(b) || b.includes(a)) return 1;
  const kw = ingredientKeywords(ingredientLine);
  if (kw && (b.includes(kw) || kw.includes(b))) return 0.8;
  return 0;
}

/* ---------------- Root redirect ---------------- */
app.get("/", (req, res) => res.redirect(`/home-${STUDENT_ID}`));

/* ---------------- Home ---------------- */
app.get(`/home-${STUDENT_ID}`, (req, res) => {
  const cuisineSet = new Set(recipes.map(r => (r.toJSON ? r.toJSON().cuisineType : r.cuisineType)));
  const totalValue = sumTotalInventoryValue(inventory);
  const recentRecipes = recipes.map(r => (r.toJSON ? r.toJSON() : r)).slice(-3).reverse();
  const expiringItems = inventory
    .map(i => {
      const x = i.toJSON ? i.toJSON() : i;
      return { ...x, daysToExpire: daysUntil(x.expirationDate) };
    })
    .sort((a,b)=>a.daysToExpire-b.daysToExpire)
    .filter(x=>x.daysToExpire<=3)
    .slice(0,3);

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
    recipes: recipes.map(r => (r.toJSON ? r.toJSON() : r)),
  });
});

app.get(`/add-recipe-${STUDENT_ID}`, (req, res) => {
  res.render("addRecipe", {
    studentId: STUDENT_ID,
    mealTypes: [...MEAL_TYPES],
    difficulties: [...DIFFICULTIES],
  });
});

app.get(`/filter-recipes-${STUDENT_ID}`, (req, res) => {
  const { mealType, cuisineType, difficulty } = req.query;
  let data = recipes.map(r => (r.toJSON ? r.toJSON() : r));
  if (mealType && mealType !== "All") data = data.filter(r => r.mealType === mealType);
  if (cuisineType && cuisineType.trim()) data = data.filter(r => (r.cuisineType || "").toLowerCase().includes(cuisineType.toLowerCase()));
  if (difficulty && difficulty !== "All") data = data.filter(r => r.difficulty === difficulty);
  res.render("filterRecipes", {
    studentId: STUDENT_ID,
    recipes: data,
    selected: { mealType: mealType || "All", cuisineType: cuisineType || "", difficulty: difficulty || "All" },
  });
});

app.get(`/search-recipes-${STUDENT_ID}`, (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  let data = recipes.map(r => (r.toJSON ? r.toJSON() : r));
  if (q) {
    data = data.filter(r =>
      (r.title || "").toLowerCase().includes(q) ||
      (r.chef || "").toLowerCase().includes(q) ||
      (r.cuisineType || "").toLowerCase().includes(q)
    );
  }
  res.render("searchRecipes", { studentId: STUDENT_ID, q: req.query.q || "", results: data });
});

// SCALE — defensive
app.get(`/scale-recipe-${STUDENT_ID}`, (req, res) => {
  try {
    const allRecipes = recipes.map(r => (r.toJSON ? r.toJSON() : r));

    if (!allRecipes.length) {
      return res.render("scaleRecipe", {
        studentId: STUDENT_ID,
        allRecipes,
        selected: null,
        newServings: "",
        scaledIngredients: [],
        noRecipes: true,
      });
    }

    const { recipeId } = req.query;
    const selected = allRecipes.find(r => r.recipeId === recipeId) || allRecipes[0];

    const rawNew = req.query.newServings;
    const newServings = (rawNew && Number(rawNew) > 0)
      ? String(rawNew)
      : String((Number(selected.servings) || 1) * 2);

    const factor = Number(newServings) / (Number(selected.servings) || 1);
    const scaledIngredients = (selected.ingredients || []).map(line => {
      const m = String(line).match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!m) return line;
      const qty = parseFloat(m[1]) * factor;
      return `${(Math.round(qty * 100) / 100).toString()}${m[2]}`;
    });

    return res.render("scaleRecipe", {
      studentId: STUDENT_ID,
      allRecipes,
      selected,
      newServings,
      scaledIngredients,
      noRecipes: false,
    });
  } catch (err) {
    console.error("Scale route error:", err);
    return res.status(500).render("error", { message: err.message || "Scale page failed." });
  }
});

/* ---------------- Inventory ---------------- */
app.get(`/inventory-${STUDENT_ID}`, (req, res) => {
  const items = inventory.map(i => {
    const plain = i.toJSON ? i.toJSON() : i;
    const dte = daysUntil(plain.expirationDate);
    const low = isLowStockByUnit(plain.quantity, plain.unit);
    return { ...plain, daysToExpire: dte, isExpiringSoon: dte <= 3, isExpired: dte < 0, isLowStock: low };
  });
  const totalValue = sumTotalInventoryValue(items);
  const lowStockCount = items.filter(x => x.isLowStock).length;
  res.render("inventory", {
    studentId: STUDENT_ID,
    items,
    totalValue: totalValue.toFixed(2),
    lowStockCount,
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

/* ---------------- Pantry Integration ---------------- */
app.get(`/check-ingredients-${STUDENT_ID}`, (req, res) => {
  const recipeId = String(req.query.recipeId || "");
  const allRecipes = recipes.map(r => (r.toJSON ? r.toJSON() : r));
  const selected = allRecipes.find(r => r.recipeId === recipeId) || allRecipes[0] || null;

  let result = null;
  if (selected) {
    const inv = inventory.map(i => (i.toJSON ? i.toJSON() : i));
    const have = [];
    const missing = [];
    selected.ingredients.forEach(line => {
      let best = { score: 0, item: null };
      inv.forEach(it => {
        const score = inventoryMatchScore(line, it.ingredientName);
        if (score > best.score) best = { score, item: it };
      });
      if (best.score >= 0.8 && best.item) have.push({ line, matchedItem: best.item });
      else missing.push({ line });
    });
    const pct = selected.ingredients.length
      ? Math.round((have.length / selected.ingredients.length) * 100)
      : 0;
    result = { have, missing, pct };
  }

  res.render("checkIngredients", { studentId: STUDENT_ID, allRecipes, selected, result });
});

app.get(`/suggest-recipes-${STUDENT_ID}`, (req, res) => {
  const threshold = Math.max(0, Math.min(100, Number(req.query.threshold) || 60));
  const allRecipes = recipes.map(r => (r.toJSON ? r.toJSON() : r));
  const inv = inventory.map(i => (i.toJSON ? i.toJSON() : i));

  const scored = allRecipes.map(r => {
    let have = 0;
    r.ingredients.forEach(line => {
      let ok = false;
      for (const it of inv) {
        if (inventoryMatchScore(line, it.ingredientName) >= 0.8) { ok = true; break; }
      }
      if (ok) have += 1;
    });
    const total = r.ingredients.length || 1;
    const pct = Math.round((have / total) * 100);
    return { recipe: r, pct };
  }).sort((a,b)=>b.pct-a.pct);

  const suggested = scored.filter(x => x.pct >= threshold);
  res.render("suggestRecipes", { studentId: STUDENT_ID, threshold, suggested, all: scored });
});

/* ---------------- Routes Debug ---------------- */
app.get(`/routes-${STUDENT_ID}`, (req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route) {
      const methods = Object.keys(m.route.methods).join(",").toUpperCase();
      routes.push(`${methods.padEnd(10)} ${m.route.path}`);
    }
  });
  res.type("text").send(routes.sort().join("\n"));
});

/* ---------------- Errors ---------------- */
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
