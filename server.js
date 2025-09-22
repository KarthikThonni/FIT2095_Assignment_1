// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// ---------- Config ----------
const STUDENT_ID = "33905320";
const PORT = process.env.PORT || 8080;
const MONGO_URI = "mongodb://127.0.0.1:27017/cloudkitchen_pro"; 
// Database name: cloudkitchen_pro

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- Database Connection ----------
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ---------- Middleware ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));

// ---------- Temp Root (for testing) ----------
app.get("/", (req, res) => {
  res.send(`<h1>CloudKitchen Pro</h1><p>Server running with MongoDB connection </p>`);
});

// ---------- Errors ----------
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}/home-${STUDENT_ID}`);
});
