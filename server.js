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

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static assets (no CDN)
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));

// Home — shows live counts
app.get(`/home-${STUDENT_ID}`, (req, res) => {
  res.render("index", {
    studentId: STUDENT_ID,
    stats: { recipeCount: recipes.length, inventoryCount: inventory.length },
  });
});

// Simple JSON endpoints (handy for testing Task 1)
app.get(`/api/recipes-${STUDENT_ID}`, (req, res) => res.status(200).json(recipes));
app.get(`/api/inventory-${STUDENT_ID}`, (req, res) => res.status(200).json(inventory));

// Error page (Task 3 placeholder)
app.get(`/error-${STUDENT_ID}`, (req, res) => {
  res.status(400).render("error", { message: "Invalid request data." });
});

// 404
app.use((req, res) => res.status(404).render("notfound", { path: req.originalUrl }));

app.listen(PORT, () => {
  console.log(`✅ Running: http://localhost:${PORT}/home-${STUDENT_ID}`);
});
