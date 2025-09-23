import mongoose from "mongoose";

const DB_NAME = "cloudKitchenPro_33905320";
const DB_URL = `mongodb://127.0.0.1:27017/${DB_NAME}`;

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log(`✅ MongoDB connected: ${DB_NAME}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
