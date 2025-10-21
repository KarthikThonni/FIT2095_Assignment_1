// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// A2 models (Mongo)
import { User } from "./models/User.js";
import { Recipe } from "./models/Recipe.js";
import { Inventory } from "./models/Inventory.js";

/* Config */
const STUDENT_ID = "33905320";
const PORT = process.env.PORT || 8080;
const DB_NAME = `cloudKitchenPro_${STUDENT_ID}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* MongoDB connect */
mongoose
  .connect(`mongodb://127.0.0.1:27017/${DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`MongoDB connected: ${DB_NAME}`))
  .catch((err) => console.error("MongoDB connection error:", err));

/* Views / static / body */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist"))
);

/* Cookie auth */
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

/* Locals for views */
app.use((req, res, next) => {
  res.locals.user = getAuthFromCookie(req);
  res.locals.studentId = STUDENT_ID;
  next();
});

/* Helpers */
function toLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function daysUntil(dateStr) {
  const today = new Date();
  const exp = new Date(dateStr);
  return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
}

function sumTotalInventoryValue(items) {
  return items.reduce((acc, it) => acc + (Number(it.cost) || 0), 0);
}

function nextId(prefix, arr, regex) {
  let max = 0;
  for (const x of arr) {
    const id =
      prefix === "R"
        ? x.toJSON
          ? x.toJSON().recipeId
          : x.recipeId
        : x.toJSON
        ? x.toJSON().inventoryId
        : x.inventoryId;
    const m = String(id).match(regex);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(5, "0")}`;
}

function isLowStockByUnit(quantity, unit) {
  const q = Number(quantity) || 0;
  switch (unit) {
    case "pieces":
      return q < 3;
    case "dozen":
      return q < 1;
    case "kg":
      return q < 0.5;
    case "g":
      return q < 100;
    case "liters":
      return q < 0.5;
    case "ml":
      return q < 100;
    case "cups":
      return q < 1;
    case "tbsp":
      return q < 2;
    case "tsp":
      return q < 3;
    default:
      return q <= 0;
  }
}

/* Validation constants */
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
const INV_LOCATIONS = new Set([
  "Fridge",
  "Freezer",
  "Pantry",
  "Counter",
  "Cupboard",
]);

function bad(res, msg) {
  return res.redirect(`/error-${STUDENT_ID}?msg=${encodeURIComponent(msg)}`);
}

// ID/date regex 
const RECIPE_ID_REGEX = /^R-(\d{5})$/;      
const INVENTORY_ID_REGEX = /^I-(\d{5})$/;   
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; 


/* Recipe body validate */
function validateRecipeBody(req, res, next) {
  const {
    title,
    chef,
    mealType,
    cuisineType,
    prepTime,
    difficulty,
    servings,
    ingredients,
    instructions,
    createdDate,
  } = req.body;

  if (!title?.trim()) return bad(res, "title is required");
  if (!chef?.trim()) return bad(res, "chef is required");
  if (!mealType || !MEAL_TYPES.has(mealType)) return bad(res, "invalid mealType");

  if (!cuisineType || !CUISINES.includes(cuisineType)) {
    return bad(res, "invalid cuisineType");
  }

  const pt = Number(prepTime);
  if (!Number.isInteger(pt) || pt < 1 || pt > 480) {
    return bad(res, "prepTime must be an integer 1–480");
  }

  if (!difficulty || !DIFFICULTIES.has(difficulty)) {
    return bad(res, "invalid difficulty");
  }

  const sv = Number(servings);
  if (!Number.isInteger(sv) || sv < 1 || sv > 20) {
    return bad(res, "servings must be an integer 1–20");
  }

  const ingOk = Array.isArray(ingredients)
    ? ingredients.length > 0
    : toLines(ingredients).length > 0;
  if (!ingOk) return bad(res, "ingredients required");

  const instOk = Array.isArray(instructions)
    ? instructions.length > 0
    : toLines(instructions).length > 0;
  if (!instOk) return bad(res, "instructions required");

  const cd = createdDate || new Date().toISOString().split("T")[0];
  if (!ISO_DATE_REGEX.test(cd)) return bad(res, "createdDate must be YYYY-MM-DD");
  req.body.createdDate = cd;

  next();
}

/* Inventory body validate */
function validateInventoryBody(req, res, next) {
  const {
    userId,
    ingredientName,
    quantity,
    unit,
    category,
    purchaseDate,
    expirationDate,
    location,
    cost,
    createdDate,
  } = req.body;

  if (!userId?.trim()) return bad(res, "userId required");
  if (!ingredientName?.trim()) return bad(res, "ingredientName required");

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 0) return bad(res, "quantity must be ≥ 0");

  if (!unit || !INV_UNITS.has(unit)) return bad(res, "invalid unit");
  if (!category || !INV_CATEGORIES.has(category)) return bad(res, "invalid category");
  if (!location || !INV_LOCATIONS.has(location)) return bad(res, "invalid location");

  if (!ISO_DATE_REGEX.test(purchaseDate || "")) return bad(res, "bad purchaseDate");
  if (!ISO_DATE_REGEX.test(expirationDate || "")) return bad(res, "bad expirationDate");
  if (new Date(expirationDate) < new Date(purchaseDate)) {
    return bad(res, "expiration before purchase");
  }

  const c = Number(cost);
  if (!Number.isFinite(c) || c < 0) return bad(res, "cost must be ≥ 0");

  const cd = createdDate || new Date().toISOString().split("T")[0];
  if (!ISO_DATE_REGEX.test(cd)) return bad(res, "bad createdDate");
  req.body.createdDate = cd;

  next();
}

/* Pantry match helpers */
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "g",
  "kg",
  "ml",
  "l",
  "tbsp",
  "tsp",
  "cup",
  "cups",
  "large",
  "small",
  "ripe",
  "fresh",
  "pieces",
  "slice",
  "slices",
]);

function ingredientKeywords(line) {
  const words = normalize(line).split(" ");
  const keep = words.filter((w) => w && !STOPWORDS.has(w) && isNaN(Number(w)));
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

app.post(`/api/register-${STUDENT_ID}`, async (req, res) => {
  try {
    // ✅ normalize inputs
    const rawEmail = String(req.body.email || '');
    const email = rawEmail.trim().toLowerCase();
    const password = String(req.body.password || '').trim();
    const fullname = String(req.body.fullname || '').trim();
    const role = String(req.body.role || '').trim();
    const phone = String(req.body.phone || '').trim();

    if (!email || !password || !fullname || !role || !phone) {
      return res.render("register", { studentId: STUDENT_ID, error: "All fields are required." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.render("register", { studentId: STUDENT_ID, error: "Please enter a valid email address." });
    }
    if (!PASSWORD_COMPLEXITY.test(password)) {
      return res.render("register", { studentId: STUDENT_ID, error: "Password must be 8+ chars and include uppercase, lowercase, number, and special character." });
    }
    if (!ROLES.has(role)) {
      return res.render("register", { studentId: STUDENT_ID, error: "Role must be admin, chef, or manager." });
    }
    if (!PHONE_REGEX.test(phone)) {
      return res.render("register", { studentId: STUDENT_ID, error: "Please enter a valid phone number." });
    }

    // unique by normalized email
    const exists = await User.findOne({ email });
    if (exists) {
      return res.render("register", { studentId: STUDENT_ID, error: "Email already registered." });
    }

    const count = await User.countDocuments();
    const userId = `U-${String(count + 1).padStart(5, "0")}`;

    await User.create({ userId, email, password, fullname, role, phone });

    const wantsJson = req.is('application/json') || (req.get('accept') || '').includes('application/json');
    if (wantsJson) return res.status(201).json({ ok: true });
    return res.redirect(`/login-${STUDENT_ID}`);
  } catch (err) {
    console.error("Register error:", err);
    const wantsJson = req.is('application/json') || (req.get('accept') || '').includes('application/json');
    if (wantsJson) return res.status(400).json({ ok: false, message: "Registration failed. Try again." });
    return res.render("register", { studentId: STUDENT_ID, error: "Registration failed. Try again." });
  }
});

app.post(`/api/login-${STUDENT_ID}`, async (req, res) => {
  try {
    // ✅ normalize inputs
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '').trim();

    const wantsJson = req.is('application/json') || (req.get('accept') || '').includes('application/json');

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      if (wantsJson) return res.status(401).json({ ok: false, message: "Invalid email or password." });
      return res.render("login", { studentId: STUDENT_ID, error: "Invalid email or password." });
    }

    setAuthCookie(res, { userId: user.userId, email: user.email, fullname: user.fullname, role: user.role });

    if (wantsJson) return res.status(200).json({ ok: true });
    return res.redirect(`/home-${STUDENT_ID}`);
  } catch (err) {
    console.error("Login error:", err);
    const wantsJson = req.is('application/json') || (req.get('accept') || '').includes('application/json');
    if (wantsJson) return res.status(500).json({ ok: false, message: "Login failed. Try again." });
    return res.render("login", { studentId: STUDENT_ID, error: "Login failed. Try again." });
  }
});

app.get(`/api/stats-${STUDENT_ID}`, async (req, res) => {
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

// Current user from auth cookie (for Angular guard)
app.get(`/api/me-${STUDENT_ID}`, (req, res) => {
  const u = getAuthFromCookie(req);
  if (!u) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: u });
});



/* Auth (register / login) */
const PASSWORD_COMPLEXITY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d[\d\s-]{6,}$/; 
const ROLES = new Set(["admin", "chef", "manager"]);

app.get(`/register-${STUDENT_ID}`, (req, res) => {
  res.render("register", { studentId: STUDENT_ID, error: null });
});

app.post(`/api/register-${STUDENT_ID}`, async (req, res) => {
  try {
    const { email, password, fullname, role, phone } = req.body;

    if (!email || !password || !fullname || !role || !phone) {
      return res.render("register", {
        studentId: STUDENT_ID,
        error: "All fields are required.",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.render("register", {
        studentId: STUDENT_ID,
        error: "Please enter a valid email address.",
      });
    }

    if (!PASSWORD_COMPLEXITY.test(password)) {
      return res.render("register", {
        studentId: STUDENT_ID,
        error:
          "Password must be 8+ chars and include uppercase, lowercase, number, and special character.",
      });
    }

    if (!ROLES.has(role)) {
      return res.render("register", {
        studentId: STUDENT_ID,
        error: "Role must be admin, chef, or manager.",
      });
    }

    if (!PHONE_REGEX.test(phone)) {
      return res.render("register", {
        studentId: STUDENT_ID,
        error: "Please enter a valid phone number.",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.render("register", {
        studentId: STUDENT_ID,
        error: "Email already registered.",
      });
    }

    const count = await User.countDocuments();
    const userId = `U-${String(count + 1).padStart(5, "0")}`;

    await User.create({ userId, email, password, fullname, role, phone });

    return res.redirect(`/login-${STUDENT_ID}`);
  } catch (err) {
    console.error("Register error:", err);
    return res.render("register", {
      studentId: STUDENT_ID,
      error: "Registration failed. Try again.",
    });
  }
});

app.get(`/login-${STUDENT_ID}`, (req, res) => {
  res.render("login", { studentId: STUDENT_ID, error: null });
});

app.post(`/api/login-${STUDENT_ID}`, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.render("login", {
        studentId: STUDENT_ID,
        error: "Invalid email or password.",
      });
    }

    setAuthCookie(res, {
      userId: user.userId,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    });

    return res.redirect(`/home-${STUDENT_ID}`);
  } catch (err) {
    console.error("Login error:", err);
    return res.render("login", {
      studentId: STUDENT_ID,
      error: "Login failed. Try again.",
    });
  }
});

app.post(`/logout-${STUDENT_ID}`, (req, res) => {
  clearAuthCookie(res);
  res.redirect(`/login-${STUDENT_ID}`);
});

function requireChef(req, res, next) {
  const u = getAuthFromCookie(req);
  if (u && u.role === "chef") return next();
  return res.status(403).render("error", {
    studentId: STUDENT_ID,
    message: "Recipes are for chefs only.",
  });
}

/* Recipes (Mongo) */

// list recipes
app.get(`/recipes-${STUDENT_ID}`, requireChef, async (req, res) => {
  try {
    const recipes = await Recipe.find().lean();
    res.render("recipes", { studentId: STUDENT_ID, recipes });
  } catch (err) {
    console.error("Error loading recipes:", err);
    res.render("error", {
      studentId: STUDENT_ID,
      message: "Failed to load recipes.",
    });
  }
});

// allowed cuisines
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

// add recipe (GET)
app.get(`/add-recipe-${STUDENT_ID}`, requireChef, (req, res) => {
  res.render("addRecipe", {
    studentId: STUDENT_ID,
    mealTypes: [...MEAL_TYPES],
    difficulties: [...DIFFICULTIES],
    cuisines: CUISINES,
    error: null,
  });
});

// add recipe (POST)
app.post(
  `/api/add-recipe-${STUDENT_ID}`,
  requireChef,
  validateRecipeBody,
  async (req, res) => {
    try {
      const auth = getAuthFromCookie(req);
      if (!auth) return res.redirect(`/login-${STUDENT_ID}`);

      const body = { ...req.body };
      const ingredients = Array.isArray(body.ingredients)
        ? body.ingredients
        : toLines(body.ingredients);
      const instructions = Array.isArray(body.instructions)
        ? body.instructions
        : toLines(body.instructions);

      const last = await Recipe.findOne().sort({ recipeId: -1 }).lean();
      let nextNum = 1;
      if (last?.recipeId) {
        const m = last.recipeId.match(/R-(\d+)/);
        if (m) nextNum = parseInt(m[1], 10) + 1;
      }
      const recipeId = `R-${String(nextNum).padStart(5, "0")}`;

      await Recipe.create({
        recipeId,
        userId: auth.userId, 
        title: body.title.trim(),
        chef: auth.fullname, 
        ingredients,
        instructions,
        mealType: body.mealType,
        cuisineType: body.cuisineType,
        prepTime: Number(body.prepTime),
        difficulty: body.difficulty,
        servings: Number(body.servings),
        createdDate: body.createdDate,
      });

      return res.redirect(`/recipes-${STUDENT_ID}`);
    } catch (err) {
      console.error("Add recipe error:", err);
      return res.render("addRecipe", {
        studentId: STUDENT_ID,
        mealTypes: [...MEAL_TYPES],
        difficulties: [...DIFFICULTIES],
        cuisines: CUISINES,
        error: "Failed to save recipe. Please check your inputs.",
      });
    }
  }
);

// filter recipes
app.get(`/filter-recipes-${STUDENT_ID}`, requireChef, async (req, res) => {
  try {
    const { mealType, cuisineType, difficulty } = req.query;
    const query = {};
    if (mealType && mealType !== "All") query.mealType = mealType;
    if (cuisineType && cuisineType.trim()) {
      query.cuisineType = new RegExp(cuisineType, "i");
    }
    if (difficulty && difficulty !== "All") query.difficulty = difficulty;

    const recipes = await Recipe.find(query).lean();

    res.render("filterRecipes", {
      studentId: STUDENT_ID,
      recipes,
      selected: {
        mealType: mealType || "All",
        cuisineType: cuisineType || "",
        difficulty: difficulty || "All",
      },
    });
  } catch (err) {
    console.error("Error filtering recipes:", err);
    res.render("error", { studentId: STUDENT_ID, message: "Filter failed." });
  }
});

// search recipes
app.get(`/search-recipes-${STUDENT_ID}`, requireChef, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    let recipes = [];
    if (q) {
      recipes = await Recipe.find({
        $or: [
          { title: new RegExp(q, "i") },
          { chef: new RegExp(q, "i") },
          { cuisineType: new RegExp(q, "i") },
        ],
      }).lean();
    }
    res.render("searchRecipes", {
      studentId: STUDENT_ID,
      q,
      results: recipes,
    });
  } catch (err) {
    console.error("Error searching recipes:", err);
    res.render("error", { studentId: STUDENT_ID, message: "Search failed." });
  }
});

// scale recipe
app.get(`/scale-recipe-${STUDENT_ID}`, requireChef, async (req, res) => {
  try {
    const allRecipes = await Recipe.find().lean();

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
    const selected =
      allRecipes.find((r) => r.recipeId === recipeId) || allRecipes[0];

    const rawNew = req.query.newServings;
    const newServings =
      rawNew && Number(rawNew) > 0
        ? String(rawNew)
        : String((Number(selected.servings) || 1) * 2);

    const factor = Number(newServings) / (Number(selected.servings) || 1);

    const scaledIngredients = (selected.ingredients || []).map((line) => {
      const m = String(line).match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!m) return line;
      const qty = parseFloat(m[1]) * factor;
      return `${(Math.round(qty * 100) / 100).toString()}${m[2]}`;
    });

    res.render("scaleRecipe", {
      studentId: STUDENT_ID,
      allRecipes,
      selected,
      newServings,
      scaledIngredients,
      noRecipes: false,
    });
  } catch (err) {
    console.error("Scale error:", err);
    res.render("error", { studentId: STUDENT_ID, message: "Scaling failed." });
  }
});

// delete recipe (page)
app.get(`/delete-recipe-${STUDENT_ID}`, requireChef, async (req, res) => {
  try {
    const all = await Recipe.find().lean();
    const selected = all.find((r) => r.recipeId === req.query.recipeId) || null;

    res.render("deleteRecipe", {
      studentId: STUDENT_ID,
      recipes: all,
      selected,
      msg: req.query.msg || "",
    });
  } catch (err) {
    console.error("Delete page error:", err);
    res.render("error", { studentId: STUDENT_ID, message: "Delete page failed." });
  }
});

// delete recipe (POST)
app.post(`/api/delete-recipe-${STUDENT_ID}`, requireChef, async (req, res) => {
  try {
    const { recipeId, confirm } = req.body;
    if (!confirm) {
      return res.redirect(
        `/delete-recipe-${STUDENT_ID}?recipeId=${encodeURIComponent(
          recipeId
        )}&msg=${encodeURIComponent("Please tick the confirmation box.")}`
      );
    }
    await Recipe.deleteOne({ recipeId });
    res.redirect(`/recipes-${STUDENT_ID}`);
  } catch (err) {
    console.error("Delete recipe error:", err);
    res.render("error", { studentId: STUDENT_ID, message: "Delete failed." });
  }
});

// edit recipe (GET)
app.get(`/edit-recipe-${STUDENT_ID}`, requireChef, async (req, res) => {
  try {
    const { recipeId } = req.query;
    if (!recipeId) return res.redirect(`/recipes-${STUDENT_ID}`);

    const recipe = await Recipe.findOne({ recipeId }).lean();
    if (!recipe) return res.redirect(`/recipes-${STUDENT_ID}`);

    res.render("editRecipe", {
      studentId: STUDENT_ID,
      recipe,
      mealTypes: [...MEAL_TYPES],
      difficulties: [...DIFFICULTIES],
      cuisines: CUISINES,
      error: req.query.msg || null,
    });
  } catch (err) {
    console.error("Edit recipe (GET) error:", err);
    res.render("error", { studentId: STUDENT_ID, message: "Failed to load recipe." });
  }
});

// edit recipe (POST)
app.post(`/api/edit-recipe-${STUDENT_ID}`, requireChef, async (req, res) => {
  try {
    const { recipeId } = req.body;
    if (!recipeId || !RECIPE_ID_REGEX.test(recipeId)) {
      return bad(res, "Invalid recipeId.");
    }

    const body = { ...req.body };
    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients
      : toLines(body.ingredients);
    const instructions = Array.isArray(body.instructions)
      ? body.instructions
      : toLines(body.instructions);

    if (!MEAL_TYPES.has(body.mealType)) return bad(res, "invalid mealType");
    if (!CUISINES.includes(body.cuisineType)) return bad(res, "invalid cuisineType");

    const pt = Number(body.prepTime);
    const sv = Number(body.servings);
    if (!Number.isInteger(pt) || pt < 1 || pt > 480) return bad(res, "prepTime must be 1–480");
    if (!Number.isInteger(sv) || sv < 1 || sv > 20) return bad(res, "servings must be 1–20");
    if (!DIFFICULTIES.has(body.difficulty)) return bad(res, "invalid difficulty");
    if (!ingredients.length || !instructions.length) {
      return bad(res, "ingredients/instructions required");
    }

    const auth = getAuthFromCookie(req);
    const updateDoc = {
      userId: auth.userId,
      chef: auth.fullname,
      title: body.title.trim(),
      ingredients,
      instructions,
      mealType: body.mealType,
      cuisineType: body.cuisineType,
      prepTime: pt,
      difficulty: body.difficulty,
      servings: sv,
      createdDate: body.createdDate,
    };

    const updated = await Recipe.findOneAndUpdate(
      { recipeId },
      { $set: updateDoc },
      { runValidators: true }
    );

    if (!updated) return bad(res, "Recipe not found.");
    res.redirect(`/recipes-${STUDENT_ID}`);
  } catch (err) {
    console.error("Edit recipe (POST) error:", err);
    res.redirect(
      `/edit-recipe-${STUDENT_ID}?recipeId=${encodeURIComponent(
        req.body.recipeId
      )}&msg=${encodeURIComponent("Update failed. Check values.")}`
    );
  }
});

/* Inventory (Mongo) */

// list inventory
app.get(`/inventory-${STUDENT_ID}`, async (req, res) => {
  try {
    const docs = await Inventory.find({}).sort({ createdAt: -1 }).lean();

    const items = docs.map((x) => {
      const dte = daysUntil(x.expirationDate);
      return {
        ...x,
        daysToExpire: dte,
        isExpiringSoon: dte <= 3,
        isExpired: dte < 0,
        isLowStock: isLowStockByUnit(x.quantity, x.unit),
      };
    });

    const agg = await Inventory.aggregate([
      { $project: { value: { $multiply: ["$quantity", "$cost"] } } },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);

    const totalValue = (agg[0]?.total || 0).toFixed(2);
    const lowStockCount = items.filter((x) => x.isLowStock).length;

    res.render("inventory", {
      studentId: STUDENT_ID,
      items,
      totalValue,
      lowStockCount,
    });
  } catch (err) {
    console.error("Inventory list error:", err);
    res
      .status(500)
      .render("error", { studentId: STUDENT_ID, message: "Failed to load inventory." });
  }
});

// add inventory (GET)
app.get(`/add-inventory-${STUDENT_ID}`, (req, res) => {
  res.render("addInventory", {
    studentId: STUDENT_ID,
    categories: [...INV_CATEGORIES],
    locations: [...INV_LOCATIONS],
    units: [...INV_UNITS],
  });
});

function injectUserIdFromCookie(req, res, next) {
  const auth = getAuthFromCookie(req);
  if (!auth) return res.redirect(`/login-${STUDENT_ID}`);
  req.body.userId = auth.userId; 
  next();
}

// add inventory (POST)
app.post(
  `/api/add-inventory-${STUDENT_ID}`,
  injectUserIdFromCookie,
  validateInventoryBody,
  async (req, res) => {
    try {
      const b = req.body;

      const count = await Inventory.countDocuments();
      const inventoryId = `I-${String(count + 1).padStart(5, "0")}`;

      await Inventory.create({
        inventoryId,
        userId: req.body.userId,
        ingredientName: b.ingredientName.trim(),
        quantity: Number(b.quantity),
        unit: b.unit,
        category: b.category,
        purchaseDate: b.purchaseDate,
        expirationDate: b.expirationDate,
        location: b.location,
        cost: Number(b.cost),
        createdDate: b.createdDate,
      });

      res.redirect(`/inventory-${STUDENT_ID}`);
    } catch (err) {
      console.error("Add inventory error:", err);
      res
        .status(400)
        .render("error", { studentId: STUDENT_ID, message: "Invalid inventory data." });
    }
  }
);

// delete inventory (POST)
app.post(`/api/delete-inventory-${STUDENT_ID}`, async (req, res) => {
  try {
    const { inventoryId } = req.body || {};
    if (!inventoryId) return bad(res, "Invalid inventoryId.");

    const r = await Inventory.deleteOne({ inventoryId });
    if (r.deletedCount === 0) return bad(res, "Inventory ID not found.");

    res.redirect(`/inventory-${STUDENT_ID}`);
  } catch (err) {
    console.error("Delete inventory error:", err);
    res
      .status(500)
      .render("error", { studentId: STUDENT_ID, message: "Failed to delete item." });
  }
});

// edit inventory (GET)
app.get(`/edit-inventory-${STUDENT_ID}`, async (req, res) => {
  try {
    const { inventoryId } = req.query;
    if (!inventoryId) return res.redirect(`/inventory-${STUDENT_ID}`);

    const item = await Inventory.findOne({ inventoryId }).lean();
    if (!item) return res.redirect(`/inventory-${STUDENT_ID}`);

    res.render("editInventory", {
      studentId: STUDENT_ID,
      item,
      categories: [...INV_CATEGORIES],
      locations: [...INV_LOCATIONS],
      units: [
        "pieces",
        "kg",
        "g",
        "ml",
        "L",
        "pack",
        "liters",
        "cups",
        "tbsp",
        "tsp",
        "dozen",
      ],
      error: null,
    });
  } catch (err) {
    console.error("Edit inventory (GET) error:", err);
    res.render("error", { studentId: STUDENT_ID, message: "Failed to load item." });
  }
});

// edit inventory (POST)
app.post(
  `/api/edit-inventory-${STUDENT_ID}`,
  injectUserIdFromCookie,
  validateInventoryBody,
  async (req, res) => {
    try {
      const {
        inventoryId,
        ingredientName,
        quantity,
        unit,
        category,
        purchaseDate,
        expirationDate,
        location,
        cost,
        createdDate,
      } = req.body;

      if (!inventoryId || !INVENTORY_ID_REGEX.test(inventoryId)) {
        return bad(res, "Invalid inventoryId.");
      }

      const userId = getAuthFromCookie(req)?.userId;

      const updated = await Inventory.findOneAndUpdate(
        { inventoryId },
        {
          $set: {
            userId,
            ingredientName: ingredientName.trim(),
            quantity: Number(quantity),
            unit,
            category,
            purchaseDate,
            expirationDate,
            location,
            cost: Number(cost),
            createdDate,
          },
        },
        { runValidators: true }
      );

      if (!updated) return bad(res, "Inventory item not found.");
      res.redirect(`/inventory-${STUDENT_ID}`);
    } catch (err) {
      console.error("Edit inventory (POST) error:", err);
      res.redirect(
        `/edit-inventory-${STUDENT_ID}?inventoryId=${encodeURIComponent(
          req.body.inventoryId
        )}&msg=${encodeURIComponent("Update failed. Check values.")}`
      );
    }
  }
);

// Pantry check 
app.get(`/check-ingredients-${STUDENT_ID}`, async (req, res) => {
  try {
    const allRecipes = await Recipe.find({}).lean();
    const selected =
      allRecipes.find(r => r.recipeId === String(req.query.recipeId || "")) ||
      allRecipes[0] || null;

    let result = null;
    if (selected) {
      const inv = await Inventory.find({}).lean();
      const have = [];
      const missing = [];

      (selected.ingredients || []).forEach(line => {
        let best = { score: 0, item: null };
        inv.forEach(it => {
          const score = inventoryMatchScore(line, it.ingredientName);
          if (score > best.score) best = { score, item: it };
        });
        if (best.score >= 0.8 && best.item) {
          have.push({ line, matchedItem: best.item });
        } else {
          missing.push({ line });
        }
      });

      const pct = selected.ingredients?.length
        ? Math.round((have.length / selected.ingredients.length) * 100)
        : 0;

      result = { have, missing, pct };
    }

    res.render("checkIngredients", {
      studentId: STUDENT_ID,
      allRecipes,
      selected,
      result,
    });
  } catch (err) {
    console.error("Pantry check error:", err);
    res.status(500).render("error", { studentId: STUDENT_ID, message: "Failed to check pantry." });
  }
});

// Suggested recipes 
app.get(`/suggest-recipes-${STUDENT_ID}`, async (req, res) => {
  try {
    const threshold = Math.max(0, Math.min(100, Number(req.query.threshold) || 60));
    const allRecipes = await Recipe.find({}).lean();
    const inv = await Inventory.find({}).lean();

    const scored = allRecipes
      .map(r => {
        let have = 0;
        (r.ingredients || []).forEach(line => {
          let ok = false;
          for (const it of inv) {
            if (inventoryMatchScore(line, it.ingredientName) >= 0.8) { ok = true; break; }
          }
          if (ok) have += 1;
        });
        const total = r.ingredients?.length || 1;
        const pct = Math.round((have / total) * 100);
        return { recipe: r, pct };
      })
      .sort((a, b) => b.pct - a.pct);

    const suggested = scored.filter(x => x.pct >= threshold);

    res.render("suggestRecipes", {
      studentId: STUDENT_ID,
      threshold,
      suggested,
      all: scored,
    });
  } catch (err) {
    console.error("Suggest recipes error:", err);
    res.status(500).render("error", { studentId: STUDENT_ID, message: "Failed to build suggestions." });
  }
});

/* Debug routes */
app.get("/", (req, res) => {
  res.redirect(`/home-${STUDENT_ID}`); 
});

/* Home (DB-driven) */
app.get(`/home-${STUDENT_ID}`, async (req, res) => {
  const user = getAuthFromCookie(req);
  if (!user) return res.redirect(`/login-${STUDENT_ID}`);

  try {
    const [totalUsers, recipeCount, inventoryCount, cuisines, valueAgg] =
      await Promise.all([
        User.countDocuments(),
        Recipe.countDocuments(),
        Inventory.countDocuments(),
        Recipe.distinct("cuisineType"),
        Inventory.aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]),
      ]);

    const totalInventoryValue = (valueAgg[0]?.total || 0).toFixed(2);

    return res.render("index", {
      studentId: STUDENT_ID,
      stats: {
        totalUsers,
        recipeCount,
        inventoryCount,
        cuisineTypes: cuisines.length,
        totalInventoryValue,
      },
    });
  } catch (err) {
    console.error("Home stats error:", err);
    return res.render("error", {
      studentId: STUDENT_ID,
      message: "Failed to load dashboard stats.",
    });
  }
});

/* Routes listing */
app.get(`/routes-${STUDENT_ID}`, (req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route) {
      const methods = Object.keys(m.route.methods).join(",").toUpperCase();
      routes.push(`${methods.padEnd(6)} ${m.route.path}`);
    }
  });
  res.type("text").send(routes.sort().join("\n"));
});

/* Errors */
app.get(`/error-${STUDENT_ID}`, (req, res) => {
  const message = req.query.msg || "Invalid request.";
  res.status(400).render("error", { studentId: STUDENT_ID, message });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res
    .status(500)
    .render("error", { studentId: STUDENT_ID, message: err.message || "Server error" });
});

app.use((req, res) => {
  res
    .status(404)
    .render("notfound", { studentId: STUDENT_ID, path: req.originalUrl });
});

/* Start server */
app.listen(PORT, () => {
  console.log(
    `✅ CloudKitchen Pro running at http://localhost:${PORT}/home-${STUDENT_ID}`
  );
});