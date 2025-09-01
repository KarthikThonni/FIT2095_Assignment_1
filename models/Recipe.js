// models/Recipe.js
import { MealType, Difficulty } from "./enums.js";
import { RECIPE_ID_REGEX, ISO_DATE_REGEX, assert } from "./constants.js";

/**
 * @typedef {Object} Ingredient
 * @property {string} itemName
 * @property {string|number} quantity
 */
export class Recipe {
  constructor(data) {
    this.recipeId = data.recipeId;
    this.title = data.title;
    this.chef = data.chef;
    /** @type {Array<string|Ingredient>} */ this.ingredients = data.ingredients;
    /** @type {string[]} */ this.instructions = data.instructions;
    this.mealType = data.mealType;
    this.cuisineType = data.cuisineType;
    this.prepTime = Number(data.prepTime);
    this.difficulty = data.difficulty;
    this.servings = Number(data.servings);
    this.createdDate = data.createdDate;
    this.validate();
  }

  validate() {
    assert(RECIPE_ID_REGEX.test(this.recipeId), "Invalid recipeId (R-XXXXX).");
    assert(typeof this.title === "string" && this.title.trim(), "title required.");
    assert(typeof this.chef === "string" && this.chef.trim(), "chef required.");

    assert(Array.isArray(this.ingredients) && this.ingredients.length > 0, "ingredients must be non-empty.");
    this.ingredients.forEach(ing => {
      if (typeof ing === "object") {
        assert(typeof ing.itemName === "string" && String(ing.itemName).trim(), "ingredient.itemName required.");
        assert(ing.quantity !== undefined && String(ing.quantity).trim() !== "", "ingredient.quantity required.");
      } else {
        assert(typeof ing === "string" && ing.trim(), "ingredient string must be non-empty.");
      }
    });

    assert(Array.isArray(this.instructions) && this.instructions.length > 0, "instructions must be non-empty.");
    this.instructions.forEach(step => assert(typeof step === "string" && step.trim(), "instruction must be non-empty."));

    const mealTypes = Object.values(MealType);
    assert(mealTypes.includes(this.mealType), `mealType must be: ${mealTypes.join(", ")}`);
    assert(typeof this.cuisineType === "string" && this.cuisineType.trim(), "cuisineType required.");

    assert(Number.isFinite(this.prepTime) && this.prepTime >= 0, "prepTime must be >= 0.");
    const difficulties = Object.values(Difficulty);
    assert(difficulties.includes(this.difficulty), `difficulty must be: ${difficulties.join(", ")}`);

    assert(Number.isFinite(this.servings) && this.servings > 0, "servings must be > 0.");
    assert(ISO_DATE_REGEX.test(this.createdDate), "createdDate must be YYYY-MM-DD.");
  }

  toJSON() {
    return {
      recipeId: this.recipeId,
      title: this.title,
      chef: this.chef,
      ingredients: this.ingredients,
      instructions: this.instructions,
      mealType: this.mealType,
      cuisineType: this.cuisineType,
      prepTime: this.prepTime,
      difficulty: this.difficulty,
      servings: this.servings,
      createdDate: this.createdDate,
    };
  }

  static from(data) {
    return new Recipe(data);
  }
}
