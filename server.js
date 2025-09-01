// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { recipes, inventory } from "./data/seed.js";

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

// ---------------------- Routes ----------------------

// Homepage
app.get(`/home-${STUDENT_ID}`, (req, res) => {
  res.render("index", {
    studentId: STUDENT_ID,
    stats: {
      recipeCount: recipes.length,
      inventoryCount: inventory.length,
    },
  });
});

// API: Get all recipes
app.get(`/api/recipes-${STUDENT_ID}`, (req, res) => {
  res.status(200).json(recipes.map(r => r.toJSON()));
});

// API: Get all inventory
app.get(`/api/inventory-${STUDENT_ID}`, (req, res) => {
  res.status(200).json(inventory.map(i => i.toJSON()));
});

// Error page (bad data, validation errors, etc.)
app.get(`/error-${STUDENT_ID}`, (req, res) => {
  res.status(400).render("error", { message: "Invalid request data." });
});

// 404 page (catch-all)
app.use((req, res) => {
  res.status(404).render("notfound", { path: req.originalUrl });
});

// ---------------------- Server Start ----------------------
app.listen(PORT, () => {
  console.log(`✅ Running: http://localhost:${PORT}/home-${STUDENT_ID}`);
});
