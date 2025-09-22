import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
  recipeId: { type: String, required: true, unique: true },               
  userId: { type: String, required: true },                               
  title: { type: String, required: true },
  chef: { type: String, required: true },
  ingredients: { type: [String], required: true },                        
  instructions: { type: [String], required: true },
  mealType: { type: String, enum: ["Breakfast", "Lunch", "Dinner", "Snack"], required: true },
  cuisineType: { type: String, enum: ["Italian", "Asian", "Mexican", "American", "French", "Indian", "Mediterranean", "Other"], required: true },
  prepTime: { type: Number, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
  servings: { type: Number, required: true },
  createdDate: { type: Date, required: true }
});

const Recipe = mongoose.model("Recipe", recipeSchema);
export default Recipe;
