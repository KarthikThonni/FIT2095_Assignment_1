// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true, 
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "chef", "manager"],
    },
    phone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } 
);


export const User = mongoose.model("User", userSchema);
