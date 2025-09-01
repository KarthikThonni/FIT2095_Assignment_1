// models/constants.js

export const RECIPE_ID_REGEX = /^R-\d{5}$/;
export const INVENTORY_ID_REGEX = /^I-\d{5}$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}
