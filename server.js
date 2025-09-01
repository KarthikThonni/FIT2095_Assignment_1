// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { recipes, inventory } from "./data/seed.js";
import { RECIPE_ID_REGEX } from "./models/constants.js";
import { Recipe } from "./models/Recipe.js";

const STUDENT_ID = "33905320";
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static assets
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));

// ---------------------- Helpers ----------------------
function nextRecipeId() {
  let maxNum = 0;
  for (const r of recipes) {
    const m = String(r.recipeId).match(/^R-(\d{5})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  const next = String(maxNum + 1).padStart(5, "0");
  return `R-${next}`;
}

function toLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

// ---------------------- Routes ----------------------

// Homepage (Task 4)
app.get(`/home-${STUDENT_ID}`, (req, res) => {
  res.render("index", {
    studentId: STUDENT_ID,
    stats: {
      recipeCount: recipes.length,
      inventoryCount: inventory.length,
    },
  });
});

// Task 6: View all recipes (EJS table)
app.get(`/recipes-${STUDENT_ID}`, (req, res) => {
  res.render("recipes", {
    studentId: STUDENT_ID,
    recipes: recipes.map(r => r.toJSON()),
  });
});

// Task 5: Show Add Recipe form
app.get(`/add-recipe-${STUDENT_ID}`, (req, res) => {
  res.render("addRecipe", {
    studentId: STUDENT_ID,
    mealTypes: ["Breakfast", "Lunch", "Dinner", "Snack"],
    difficulties: ["Easy", "Medium", "Hard"],
  });
});

// Task 5: Handle Add Recipe (POST)
app.post(`/api/add-recipe-${STUDENT_ID}`, (req, res) => {
  try {
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
      createdDate
    } = req.body;

    const newRecipe = Recipe.from({
      recipeId: nextRecipeId(),
      title,
      chef,
      ingredients: toLines(ingredients),
      instructions: toLines(instructions),
      mealType,
      cuisineType,
      prepTime: Number(prepTime),
      difficulty,
      servings: Number(servings),
      createdDate
    });

    recipes.push(newRecipe);
    return res.redirect(`/recipes-${STUDENT_ID}`);
  } catch (err) {
    const msg = encodeURIComponent(err.message || "Invalid recipe data.");
    return res.redirect(`/error-${STUDENT_ID}?msg=${msg}`);
  }
});

// Task 7: Delete a recipe by ID
app.post(`/api/delete-recipe-${STUDENT_ID}`, (req, res) => {
  const { recipeId } = req.body;

  if (typeof recipeId !== "string" || !RECIPE_ID_REGEX.test(recipeId)) {
    return res.redirect(`/error-${STUDENT_ID}?msg=Invalid+recipeId+format`);
  }

  const index = recipes.findIndex(r => r.recipeId === recipeId);
  if (index === -1) {
    return res.redirect(`/error-${STUDENT_ID}?msg=Recipe+ID+not+found`);
  }

  recipes.splice(index, 1);
  return res.redirect(`/recipes-${STUDENT_ID}`);
});

// API: Get all recipes (JSON)
app.get(`/api/recipes-${STUDENT_ID}`, (req, res) => {
  res.status(200).json(recipes.map(r => r.toJSON()));
});

// API: Get all inventory (JSON)
app.get(`/api/inventory-${STUDENT_ID}`, (req, res) => {
  res.status(200).json(inventory.map(i => i.toJSON()));
});

// Error page (Task 3)
app.get(`/error-${STUDENT_ID}`, (req, res) => {
  const message = req.query.msg || "Invalid request data.";
  res.status(400).render("error", { message });
});

// 404 page (Task 3)
app.use((req, res) => {
  res.status(404).render("notfound", { path: req.originalUrl });
});

// ---------------------- Server Start ----------------------
app.listen(PORT, () => {
  console.log(`✅ Running: http://localhost:${PORT}/home-${STUDENT_ID}`);
});
