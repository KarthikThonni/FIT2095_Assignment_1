// server.js
import express from "express";
import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Recipe } from "./models/Recipe.js";
import { Inventory } from "./models/Inventory.js";

/**
 * Basic app constants. I keep the student id in one place and derive
 * the DB name and some route prefixes from it to match the spec.
 */
const STUDENT_ID = "33905320";
const PORT = process.env.PORT || 8080;
const DB_NAME = `cloudKitchenPro_${STUDENT_ID}`;
const AUTH_COOKIE = "auth";

const app = express();

/**
 * Mongo connection to a per-student database. If this connects,
 * the rest of the API can read/write via the Mongoose models.
 */
mongoose
  .connect(`mongodb://127.0.0.1:27017/${DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`MongoDB connected: ${DB_NAME}`))
  .catch((err) => console.error("MongoDB connection error:", err));

/**
 * Body parsers. urlencoded handles form posts; json handles Angular’s JSON calls.
 */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* =========================
   Simple cookie-based auth
   ========================= */
/**
 * parseCookies: reads the Cookie header and returns a tiny key/value map.
 * Keeping it minimal since this assignment doesn’t require a full auth stack.
 */
function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [k, ...v] = part.trim().split("=");
    if (!k) return acc;
    acc[k] = decodeURIComponent(v.join("="));
    return acc;
  }, {});
}

/**
 * getAuthFromCookie: if the httpOnly auth cookie exists, parse its JSON payload
 * (we store userId, name, role). Otherwise return null (treated as not logged in).
 */
function getAuthFromCookie(req) {
  try {
    const cookies = parseCookies(req);
    if (!cookies[AUTH_COOKIE]) return null;
    return JSON.parse(cookies[AUTH_COOKIE]);
  } catch {
    return null;
  }
}

/**
 * setAuthCookie / clearAuthCookie: small helpers to write/remove the cookie.
 * The cookie is httpOnly to keep it out of client JS.
 */
function setAuthCookie(res, userObj) {
  const value = encodeURIComponent(JSON.stringify(userObj));
  res.setHeader("Set-Cookie", `${AUTH_COOKIE}=${value}; Path=/; HttpOnly`);
}
function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", `${AUTH_COOKIE}=; Path=/; Max-Age=0; HttpOnly`);
}

/* =========================
   Shared validation helpers
   ========================= */
/** Enumerations used for light server-side validation. */
const MEAL_TYPES = new Set(["Breakfast", "Lunch", "Dinner", "Snack"]);
const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const INV_UNITS = new Set(["pieces", "kg", "g", "liters", "ml", "cups", "tbsp", "tsp", "dozen"]);
const INV_CATEGORIES = new Set([
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
]);
const INV_LOCATIONS = new Set(["Fridge", "Freezer", "Pantry", "Counter", "Cupboard"]);
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Consistent error JSON helper. */
function badJson(res, status, msg) {
  return res.status(status).json({ ok: false, message: msg });
}

/** Regexes used during registration. */
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d[\d\s-]{6,}$/;
const ROLES = new Set(["admin", "chef", "manager"]);

/* =========================
   Auth endpoints
   ========================= */
/**
 * Register: minimal user creation. Validates fields, assigns sequential userId
 * (U-00001 style), stores plain password as per assignment scope.
 */
app.post(`/api/register-${STUDENT_ID}`, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();
    const fullname = String(req.body.fullname || "").trim();
    const role = String(req.body.role || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!email || !password || !fullname || !role || !phone) {
      return badJson(res, 400, "All fields are required.");
    }
    if (!EMAIL_REGEX.test(email)) return badJson(res, 400, "Please enter a valid email address.");
    if (!PASSWORD_COMPLEXITY.test(password)) {
      return badJson(res, 400, "Password must be 8+ chars and include uppercase, lowercase, number, and special character.");
    }
    if (!ROLES.has(role)) return badJson(res, 400, "Role must be admin, chef, or manager.");
    if (!PHONE_REGEX.test(phone)) return badJson(res, 400, "Please enter a valid phone number.");

    const exists = await User.findOne({ email });
    if (exists) return badJson(res, 409, "Email already registered.");

    // Simple “friendly id” generator for users
    const count = await User.countDocuments();
    const userId = `U-${String(count + 1).padStart(5, "0")}`;

    await User.create({ userId, email, password, fullname, role, phone });
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Register error:", err);
    return badJson(res, 500, "Registration failed. Try again.");
  }
});

/**
 * Login: look up by email, compare plain password, then write the small
 * user payload into the cookie so Angular can call /api/me-… and render the header.
 */
app.post(`/api/login-${STUDENT_ID}`, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();

    const user = await User.findOne({ email });
    if (!user || user.password !== password) return badJson(res, 401, "Invalid email or password.");

    setAuthCookie(res, {
      userId: user.userId,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return badJson(res, 500, "Login failed. Try again.");
  }
});

/** Logout: clears the cookie so the front-end returns to guest state. */
app.post(`/logout-${STUDENT_ID}`, (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

/** Me: tiny endpoint that returns the cookie payload; used by header/guards. */
app.get(`/api/me-${STUDENT_ID}`, (req, res) => {
  const u = getAuthFromCookie(req);
  if (!u) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: u });
});

/** Stats: simple counts for dashboard cards. */
app.get(`/api/stats-${STUDENT_ID}`, async (_req, res) => {
  try {
    const [totalUsers, recipeCount, inventoryCount] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments(),
      Inventory.countDocuments(),
    ]);
    res.json({ ok: true, totalUsers, recipeCount, inventoryCount });
  } catch (e) {
    console.error("stats error:", e);
    res.status(500).json({ ok: false });
  }
});

/* =========================
   Recipes CRUD
   ========================= */
/** Route prefix matches the assignment format. */
const RECIPES_API = `/api/recipes-${STUDENT_ID}`;
const CUISINES = ["Italian", "Asian", "Mexican", "American", "French", "Indian", "Mediterranean", "Other"];

/** Converts textarea strings into string[] (one line = one entry). */
function toArr(val) {
  if (Array.isArray(val)) return val.filter(Boolean).map(String);
  return String(val || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** List all recipes. `.lean()` returns plain objects (faster, no Mongoose doc). */
app.get(RECIPES_API, async (_req, res) => {
  try {
    const recipes = await Recipe.find().lean();
    res.json({ ok: true, recipes });
  } catch (e) {
    console.error("GET list recipes error:", e);
    res.status(500).json({ ok: false, recipes: [] });
  }
});

/** Get one by friendly recipeId (R-xxxxx) or by Mongo `_id`. */
app.get(`${RECIPES_API}/:id`, async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    const byFriendly = await Recipe.findOne({ recipeId: id }).lean();
    const doc = byFriendly || (await Recipe.findById(id).lean().catch(() => null));
    if (!doc) return res.status(404).json({ ok: false, message: "Not Found" });
    res.json({ ok: true, recipe: doc });
  } catch (e) {
    console.error("GET recipe error:", e);
    res.status(500).json({ ok: false, message: "Failed" });
  }
});

/**
 * Create: validates a few fields, issues the next friendly id (R-00001),
 * and normalises ingredients/instructions to arrays.
 */
app.post(RECIPES_API, async (req, res) => {
  try {
    const auth = getAuthFromCookie(req) || { userId: "U-00000", fullname: "Guest" };
    const b = req.body || {};

    if (!b.title || !b.mealType || !b.cuisineType || !b.prepTime || !b.difficulty || !b.servings) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }
    if (!MEAL_TYPES.has(b.mealType)) return res.status(400).json({ ok: false, message: "Bad mealType" });
    if (!CUISINES.includes(b.cuisineType)) return res.status(400).json({ ok: false, message: "Bad cuisineType" });

    const last = await Recipe.findOne().sort({ recipeId: -1 }).lean();
    let nextNum = 1;
    if (last?.recipeId) {
      const m = String(last.recipeId).match(/R-(\d+)/);
      if (m) nextNum = parseInt(m[1], 10) + 1;
    }
    const recipeId = `R-${String(nextNum).padStart(5, "0")}`;

    const doc = await Recipe.create({
      recipeId,
      userId: auth.userId,
      title: String(b.title || "").trim(),
      chef: auth.fullname,
      ingredients: toArr(b.ingredients),
      instructions: toArr(b.instructions),
      mealType: b.mealType,
      cuisineType: b.cuisineType,
      prepTime: Number(b.prepTime || 0),
      difficulty: b.difficulty,
      servings: Number(b.servings || 1),
      createdDate: b.createdDate || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ ok: true, recipe: doc.toObject() });
  } catch (e) {
    console.error("CREATE recipe error:", e);
    res.status(400).json({ ok: false, message: "Invalid data" });
  }
});

/** Update by recipeId. Uses `$set` and returns the new doc (`new: true`). */
app.put(`${RECIPES_API}/:id`, async (req, res) => {
  try {
    const b = req.body || {};
    const update = {
      title: String(b.title || "").trim(),
      chef: b.chef,
      ingredients: toArr(b.ingredients),
      instructions: toArr(b.instructions),
      mealType: b.mealType,
      cuisineType: b.cuisineType,
      prepTime: Number(b.prepTime || 0),
      difficulty: b.difficulty,
      servings: Number(b.servings || 1),
      createdDate: b.createdDate || new Date().toISOString().slice(0, 10),
    };

    const r = await Recipe.findOneAndUpdate({ recipeId: req.params.id }, { $set: update }, { new: true, runValidators: true }).lean();
    if (!r) return res.status(404).json({ ok: false, message: "Not Found" });
    res.json({ ok: true, recipe: r });
  } catch (e) {
    console.error("UPDATE recipe error:", e);
    res.status(400).json({ ok: false, message: "Update failed" });
  }
});

/** Delete by recipeId; if not found, attempt Mongo `_id` as fallback. */
app.delete(`${RECIPES_API}/:id`, async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    let r = await Recipe.deleteOne({ recipeId: id });
    if (r.deletedCount === 0) {
      r = await Recipe.deleteOne({ _id: id }).catch(() => ({ deletedCount: 0 }));
    }
    if (r.deletedCount === 0) return res.status(404).json({ ok: false, message: "Not Found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE recipe error:", e);
    res.status(500).json({ ok: false, message: "Delete failed" });
  }
});

/* =========================
   Inventory CRUD
   ========================= */
const INV_API = `/api/inventory-${STUDENT_ID}`;

/**
 * Friendly inventory id generator (I-00001). Same idea as recipes.
 */
async function nextInventoryId() {
  const last = await Inventory.findOne().sort({ inventoryId: -1 }).lean();
  let n = 1;
  if (last?.inventoryId) {
    const m = String(last.inventoryId).match(/I-(\d+)/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `I-${String(n).padStart(5, "0")}`;
}

/** List inventory items. */
app.get(INV_API, async (_req, res) => {
  try {
    const items = await Inventory.find().lean();
    res.json({ ok: true, items });
  } catch (e) {
    console.error("INV list error:", e);
    res.status(500).json({ ok: false, items: [] });
  }
});

/** Get one item by inventoryId or `_id`. */
app.get(`${INV_API}/:id`, async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    const byFriendly = await Inventory.findOne({ inventoryId: id }).lean();
    const doc = byFriendly || (await Inventory.findById(id).lean().catch(() => null));
    if (!doc) return res.status(404).json({ ok: false, message: "Not Found" });
    res.json({ ok: true, item: doc });
  } catch (e) {
    console.error("INV get error:", e);
    res.status(500).json({ ok: false, message: "Failed" });
  }
});

/**
 * Create item: validates enums (unit/category/location), checks dates,
 * prevents negative quantities/cost, and assigns the next I-xxxxx id.
 */
app.post(INV_API, async (req, res) => {
  try {
    const auth = getAuthFromCookie(req) || { userId: "U-00000" };
    const b = req.body || {};

    const qty = Number(b.quantity);
    const cost = Number(b.cost);
    if (!b.ingredientName?.trim()) return res.status(400).json({ ok: false, message: "ingredientName required" });
    if (!Number.isFinite(qty) || qty < 0) return res.status(400).json({ ok: false, message: "quantity must be ≥ 0" });
    if (!INV_UNITS.has(b.unit)) return res.status(400).json({ ok: false, message: "invalid unit" });
    if (!INV_CATEGORIES.has(b.category)) return res.status(400).json({ ok: false, message: "invalid category" });
    if (!INV_LOCATIONS.has(b.location)) return res.status(400).json({ ok: false, message: "invalid location" });
    if (!ISO_DATE_REGEX.test(b.purchaseDate || "")) return res.status(400).json({ ok: false, message: "bad purchaseDate" });
    if (!ISO_DATE_REGEX.test(b.expirationDate || "")) return res.status(400).json({ ok: false, message: "bad expirationDate" });
    if (new Date(b.expirationDate) < new Date(b.purchaseDate)) return res.status(400).json({ ok: false, message: "expiration before purchase" });
    if (!Number.isFinite(cost) || cost < 0) return res.status(400).json({ ok: false, message: "cost must be ≥ 0" });

    const inventoryId = await nextInventoryId();

    const doc = await Inventory.create({
      inventoryId,
      userId: auth.userId,
      ingredientName: String(b.ingredientName).trim(),
      quantity: qty,
      unit: b.unit,
      category: b.category,
      purchaseDate: b.purchaseDate,
      expirationDate: b.expirationDate,
      location: b.location,
      cost: cost,
      createdDate: b.createdDate && ISO_DATE_REGEX.test(b.createdDate) ? b.createdDate : new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ ok: true, item: doc.toObject() });
  } catch (e) {
    console.error("INV create error:", e);
    res.status(500).json({ ok: false, message: "Create failed" });
  }
});

/** Update item in place by friendly id. Keeps the same validation as create. */
app.put(`${INV_API}/:id`, async (req, res) => {
  try {
    const b = req.body || {};
    const qty = Number(b.quantity);
    const cost = Number(b.cost);
    if (!b.ingredientName?.trim()) return res.status(400).json({ ok: false, message: "ingredientName required" });
    if (!Number.isFinite(qty) || qty < 0) return res.status(400).json({ ok: false, message: "quantity must be ≥ 0" });
    if (!INV_UNITS.has(b.unit)) return res.status(400).json({ ok: false, message: "invalid unit" });
    if (!INV_CATEGORIES.has(b.category)) return res.status(400).json({ ok: false, message: "invalid category" });
    if (!INV_LOCATIONS.has(b.location)) return res.status(400).json({ ok: false, message: "invalid location" });
    if (!ISO_DATE_REGEX.test(b.purchaseDate || "")) return res.status(400).json({ ok: false, message: "bad purchaseDate" });
    if (!ISO_DATE_REGEX.test(b.expirationDate || "")) return res.status(400).json({ ok: false, message: "bad expirationDate" });
    if (new Date(b.expirationDate) < new Date(b.purchaseDate)) return res.status(400).json({ ok: false, message: "expiration before purchase" });
    if (!Number.isFinite(cost) || cost < 0) return res.status(400).json({ ok: false, message: "cost must be ≥ 0" });

    const update = {
      ingredientName: String(b.ingredientName).trim(),
      quantity: qty,
      unit: b.unit,
      category: b.category,
      purchaseDate: b.purchaseDate,
      expirationDate: b.expirationDate,
      location: b.location,
      cost: cost,
      createdDate: b.createdDate && ISO_DATE_REGEX.test(b.createdDate) ? b.createdDate : new Date().toISOString().slice(0, 10),
    };

    const r = await Inventory.findOneAndUpdate({ inventoryId: req.params.id }, { $set: update }, { new: true, runValidators: true }).lean();
    if (!r) return res.status(404).json({ ok: false, message: "Not Found" });
    res.json({ ok: true, item: r });
  } catch (e) {
    console.error("INV update error:", e);
    res.status(500).json({ ok: false, message: "Update failed" });
  }
});

/** Delete item by I-xxxxx or `_id`. Returns ok:true on success. */
app.delete(`${INV_API}/:id`, async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    let r = await Inventory.deleteOne({ inventoryId: id });
    if (r.deletedCount === 0) {
      r = await Inventory.deleteOne({ _id: id }).catch(() => ({ deletedCount: 0 }));
    }
    if (r.deletedCount === 0) return res.status(404).json({ ok: false, message: "Not Found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("INV delete error:", e);
    res.status(500).json({ ok: false, message: "Delete failed" });
  }
});

/* =========================
   Basic fallbacks & startup
   ========================= */
/** Health check root so I can see the API is alive in the browser. */
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "CloudKitchen Pro API (A3) running" });
});

/** Catch-all 404 so unknown routes don’t hang. */
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Not Found" });
});

/** Last-chance error handler so exceptions become JSON not crashes. */
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ ok: false, message: err?.message || "Server error" });
});

/** Start server. Angular talks to this via the proxy config. */
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT} (student ${STUDENT_ID})`);
});
