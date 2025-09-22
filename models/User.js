// models/User.js
import mongoose from "mongoose";

// Schema for User
const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      match: /^U-\d{5}$/, // format U-00001
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // email format
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      // at least 1 uppercase, 1 lowercase, 1 number, 1 special char
      match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
    },
    fullname: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100,
      match: /^[a-zA-Z\s'-]+$/, // letters, spaces, hyphens, apostrophes
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "chef", "manager"],
    },
    phone: {
      type: String,
      required: true,
      match: /^\+?[0-9\s-]{6,20}$/, // international format
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
