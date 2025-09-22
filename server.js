// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import User from "./models/User.js";
import Recipe from "./models/Recipe.js";
import InventoryItem from "./models/InventoryItem.js";

/* ---------- Config ---------- */
const STUDENT_ID = "33905320";
const PORT = process.env.PORT || 8080;
const MONGO_URI = "mongodb://127.0.0.1:27017/cloudkitchen_pro";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ---------- Database ---------- */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* ---------- Middleware ---------- */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));

/* ---------- Basic Routes ---------- */
app.get("/", (req, res) => {
  res.redirect(`/home-${STUDENT_ID}`);
});

app.get(`/home-${STUDENT_ID}`, (req, res) => {
  res.type("html").send(`
    <h1>CloudKitchen Pro</h1>
    <p>Server is running and MongoDB connection is ready.</p>
  `);
});

/* ---------- Helpers ---------- */
const ROLES = ["admin", "chef", "manager"];

async function nextUserId() {
  const count = await User.countDocuments();
  return "U-" + String(count + 1).padStart(5, "0");
}

/* ---------- Registration ---------- */
app.get(`/register-${STUDENT_ID}`, (req, res) => {
  res.render("register", { studentId: STUDENT_ID, errors: [], data: {} });
});

app.post(`/register-${STUDENT_ID}`, async (req, res) => {
  try {
    const { email, password, fullname, role, phone } = req.body;
    const errors = [];

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
    const passOk  = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password || "");
    const nameOk  = /^[a-zA-Z\s'-]{2,100}$/.test(fullname || "");
    const roleOk  = ROLES.includes(role);
    const phoneOk = /^\+?[0-9\s-]{6,20}$/.test(phone || "");

    if (!emailOk) errors.push("Invalid email.");
    if (!passOk) errors.push("Password must be 8+ chars with upper, lower, number, and special.");
    if (!nameOk) errors.push("Full name must be 2–100 letters (spaces, - and ' allowed).");
    if (!roleOk) errors.push("Invalid role.");
    if (!phoneOk) errors.push("Invalid phone.");

    const existing = await User.findOne({ email });
    if (existing) errors.push("Email already registered.");

    if (errors.length) {
      return res.status(400).render("register", {
        studentId: STUDENT_ID,
        errors,
        data: { email, fullname, role, phone }
      });
    }

    const userId = await nextUserId();

    const user = new User({
      userId,
      email,
      password,     
      fullname,
      role,
      phone
    });

    await user.save();
    return res.redirect(`/login-${STUDENT_ID}`);
  } catch (e) {
    return res.status(400).render("register", {
      studentId: STUDENT_ID,
      errors: [e.message],
      data: req.body
    });
  }
});

/* ---------- Login (placeholder page) ---------- */
app.get(`/login-${STUDENT_ID}`, (req, res) => {
  res.type("html").send(`
    <h2>Login</h2>
    <p>Registration successful. Implement login next.</p>
    <p><a href="/register-${STUDENT_ID}">Back to Register</a></p>
  `);
});


/* ---------- 404 ---------- */
app.use((req, res) => {
  res.status(404).send("Page not found");
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/home-${STUDENT_ID}`);
});
