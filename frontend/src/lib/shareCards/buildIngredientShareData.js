/**
 * Build share payload for ingredient verdict cards.
 * @param {object} result - UI model (with optional .evaluation V1) or API envelope
 * @param {string} [query]
 */
import { v1ToShareIngredientData } from "../formatters/ingredientEvaluationFormatters.js";

export function buildIngredientShareData(result, query = "") {
  return v1ToShareIngredientData(result, query);
}
