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

/* ---------- Auth Helpers ---------- */
const sessions = Object.create(null);

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [k, v] = part.trim().split("=");
    if (k) acc[k] = decodeURIComponent(v || "");
    return acc;
  }, {});
}
function authMiddleware(req, res, next) {
  const token = parseCookies(req).sid;
  req.user = token && sessions[token] ? sessions[token] : null;
  next();
}
function createToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

app.use(authMiddleware);

/* ---------- Basic Routes ---------- */
app.get("/", (req, res) => res.redirect(`/home-${STUDENT_ID}`));

app.get(`/home-${STUDENT_ID}`, (req, res) => {
  const u = req.user;
  res.type("html").send(`
    <h1>CloudKitchen Pro</h1>
    <p>Server is running and MongoDB connection is ready.</p>
    ${
      u
        ? `<div><strong>Logged in:</strong> ${u.fullname} (${u.email}) — ${u.role} | <a href="/logout-${STUDENT_ID}">Logout</a></div>`
        : `<div><a href="/login-${STUDENT_ID}">Login</a> | <a href="/register-${STUDENT_ID}">Register</a></div>`
    }
  `);
});

/* ---------- Registration ---------- */
app.get(`/register-${STUDENT_ID}`, (req, res) => {
  res.render("register", { studentId: STUDENT_ID, errors: [], data: {} });
});

app.post(`/register-${STUDENT_ID}`, async (req, res) => {
  try {
    const { email, password, fullname, role, phone } = req.body;
    const errors = [];
    if (!email || !password || !fullname || !role || !phone) errors.push("All fields are required.");

    const existing = await User.findOne({ email });
    if (existing) errors.push("Email already registered.");

    if (errors.length) {
      return res.status(400).render("register", {
        studentId: STUDENT_ID,
        errors,
        data: { email, fullname, role, phone },
      });
    }

    const user = new User({ email, password, fullname, role, phone });
    await user.save();
    res.redirect(`/login-${STUDENT_ID}`);
  } catch (e) {
    res.status(400).render("register", {
      studentId: STUDENT_ID,
      errors: [e.message],
      data: req.body,
    });
  }
});

/* ---------- Login ---------- */
app.get(`/login-${STUDENT_ID}`, (req, res) => {
  res.render("login", { studentId: STUDENT_ID, errors: [], data: {} });
});

app.post(`/login-${STUDENT_ID}`, async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = [];
    if (!email || !password) errors.push("Email and password are required.");

    const user = await User.findOne({ email, password });
    if (!user) errors.push("Invalid email or password.");

    if (errors.length) {
      return res.status(400).render("login", {
        studentId: STUDENT_ID,
        errors,
        data: { email },
      });
    }

    const token = createToken();
    sessions[token] = { userId: user.userId, email: user.email, fullname: user.fullname, role: user.role };
    res.setHeader("Set-Cookie", `sid=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`);
    res.redirect(`/home-${STUDENT_ID}`);
  } catch (e) {
    res.status(400).render("login", {
      studentId: STUDENT_ID,
      errors: [e.message],
      data: { email: req.body.email || "" },
    });
  }
});

/* ---------- Logout ---------- */
app.get(`/logout-${STUDENT_ID}`, (req, res) => {
  const token = parseCookies(req).sid;
  if (token) delete sessions[token];
  res.setHeader("Set-Cookie", "sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  res.redirect(`/login-${STUDENT_ID}`);
});

/* ---------- 404 ---------- */
app.use((req, res) => {
  res.status(404).send("Page not found");
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/home-${STUDENT_ID}`);
});
