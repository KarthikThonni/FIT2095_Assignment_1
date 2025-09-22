// models/User.js
import mongoose from "mongoose";

const ROLES = ["admin", "chef", "manager"];

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      match: /^U-\d{5}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      // 8+ chars, upper, lower, number, special
      match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      match: /^[A-Za-z\s'-]{2,100}$/,
    },
    role: {
      type: String,
      required: true,
      enum: ROLES,
    },
    phone: {
      type: String,
      required: true,
      match: /^\+?[0-9\s-]{6,20}$/,
    },
  },
  { timestamps: true }
);

userSchema.pre("validate", async function (next) {
  if (this.isNew && !this.userId) {
    const count = await mongoose.model("User").countDocuments();
    this.userId = "U-" + String(count + 1).padStart(5, "0");
  }
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
