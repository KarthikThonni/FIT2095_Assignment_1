// server.js
import express from "express";
import mongoose from "mongoose";

// Models
import { User } from "./models/User.js";
import { Recipe } from "./models/Recipe.js";
import { Inventory } from "./models/Inventory.js";

/* -------------------- Config -------------------- */
const STUDENT_ID = "33905320";
const PORT = process.env.PORT || 8080;
const DB_NAME = `cloudKitchenPro_${STUDENT_ID}`;

const app = express();

/* -------------------- DB -------------------- */
mongoose
  .connect(`mongodb://127.0.0.1:27017/${DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`MongoDB connected: ${DB_NAME}`))
  .catch((err) => console.error("MongoDB connection error:", err));

/* -------------------- Middleware -------------------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* -------------------- Cookie Auth (simple) -------------------- */
const AUTH_COOKIE = "auth";

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [k, ...v] = part.trim().split("=");
    if (!k) return acc;
    acc[k] = decodeURIComponent(v.join("="));
    return acc;
  }, {});
}

function getAuthFromCookie(req) {
  try {
    const cookies = parseCookies(req);
    if (!cookies[AUTH_COOKIE]) return null;
    return JSON.parse(cookies[AUTH_COOKIE]);
  } catch {
    return null;
  }
}

function setAuthCookie(res, userObj) {
  const value = encodeURIComponent(JSON.stringify(userObj));
  res.setHeader("Set-Cookie", `${AUTH_COOKIE}=${value}; Path=/; HttpOnly`);
}

function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", `${AUTH_COOKIE}=; Path=/; Max-Age=0; HttpOnly`);
}

/* -------------------- Helpers -------------------- */
function toLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
const MEAL_TYPES = new Set(["Breakfast", "Lunch", "Dinner", "Snack"]);
const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const INV_UNITS = new Set([
  "pieces",
  "kg",
  "g",
  "liters",
  "ml",
  "cups",
  "tbsp",
  "tsp",
  "dozen",
]);
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

const RECIPE_ID_REGEX = /^R-(\d{5})$/;
const INVENTORY_ID_REGEX = /^I-(\d{5})$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function badJson(res, status, msg) {
  return res.status(status).json({ ok: false, message: msg });
}

/* -------------------- Auth validation constants -------------------- */
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d[\d\s-]{6,}$/;
const ROLES = new Set(["admin", "chef", "manager"]);

/* ===========================================================
   API: Authentication (JSON only)
   =========================================================== */

// Register
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
    if (!EMAIL_REGEX.test(email)) {
      return badJson(res, 400, "Please enter a valid email address.");
    }
    if (!PASSWORD_COMPLEXITY.test(password)) {
      return badJson(
        res,
        400,
        "Password must be 8+ chars and include uppercase, lowercase, number, and special character."
      );
    }
    if (!ROLES.has(role)) {
      return badJson(res, 400, "Role must be admin, chef, or manager.");
    }
    if (!PHONE_REGEX.test(phone)) {
      return badJson(res, 400, "Please enter a valid phone number.");
    }

    const exists = await User.findOne({ email });
    if (exists) return badJson(res, 409, "Email already registered.");

    const count = await User.countDocuments();
    const userId = `U-${String(count + 1).padStart(5, "0")}`;

    await User.create({ userId, email, password, fullname, role, phone });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Register error:", err);
    return badJson(res, 500, "Registration failed. Try again.");
  }
});

// Login
app.post(`/api/login-${STUDENT_ID}`, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return badJson(res, 401, "Invalid email or password.");
    }

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

// Logout
app.post(`/logout-${STUDENT_ID}`, (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Current user (header/guards)
app.get(`/api/me-${STUDENT_ID}`, (req, res) => {
  const u = getAuthFromCookie(req);
  if (!u) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: u });
});

// Dashboard stats
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

/* ===================== Recipes API ===================== */
const RECIPES_API = `/api/recipes-${STUDENT_ID}`;
const CUISINES = [
  "Italian",
  "Asian",
  "Mexican",
  "American",
  "French",
  "Indian",
  "Mediterranean",
  "Other",
];

// textarea helper → string[]
function toArr(val) {
  if (Array.isArray(val)) return val.filter(Boolean).map(String);
  return String(val || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// LIST
app.get(RECIPES_API, async (_req, res) => {
  try {
    const recipes = await Recipe.find().lean();
    res.json({ ok: true, recipes });
  } catch (e) {
    console.error("GET list recipes error:", e);
    res.status(500).json({ ok: false, recipes: [] });
  }
});

// GET by id (accepts recipeId or Mongo _id)
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

// CREATE
app.post(RECIPES_API, async (req, res) => {
  try {
    const auth = getAuthFromCookie(req) || { userId: "U-00000", fullname: "Guest" };
    const b = req.body || {};

    // simple validation
    if (!b.title || !b.mealType || !b.cuisineType || !b.prepTime || !b.difficulty || !b.servings) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }
    if (!MEAL_TYPES.has(b.mealType)) {
      return res.status(400).json({ ok: false, message: "Bad mealType" });
    }
    if (!CUISINES.includes(b.cuisineType)) {
      return res.status(400).json({ ok: false, message: "Bad cuisineType" });
    }

    // next friendly id
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

// UPDATE
app.put(`${RECIPES_API}/:id`, async (req, res) => {
  try {
    const b = req.body || {};
    const update = {
      title: String(b.title || "").trim(),
      chef: b.chef, // optional (usually from cookie)
      ingredients: toArr(b.ingredients),
      instructions: toArr(b.instructions),
      mealType: b.mealType,
      cuisineType: b.cuisineType,
      prepTime: Number(b.prepTime || 0),
      difficulty: b.difficulty,
      servings: Number(b.servings || 1),
      createdDate: b.createdDate || new Date().toISOString().slice(0, 10),
    };

    const r = await Recipe.findOneAndUpdate(
      { recipeId: req.params.id },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!r) return res.status(404).json({ ok: false, message: "Not Found" });
    res.json({ ok: true, recipe: r });
  } catch (e) {
    console.error("UPDATE recipe error:", e);
    res.status(400).json({ ok: false, message: "Update failed" });
  }
});

// DELETE
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

/* -------------------- Fallbacks -------------------- */
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "CloudKitchen Pro API (A3) running" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Not Found" });
});

// Last-chance error handler
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ ok: false, message: err?.message || "Server error" });
});

/* -------------------- Start -------------------- */
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT} (student ${STUDENT_ID})`);
});
