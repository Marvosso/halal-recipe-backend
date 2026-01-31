import { getAPIURL } from "../utils/apiConfig";

/**
 * Converts a recipe to halal-compliant version
 * @param {string} recipeText - The recipe text to convert
 * @returns {Promise<Object>} The converted recipe data
 */
export async function convertRecipe(recipeText) {
  const url = await getAPIURL("/convert");
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ recipe: recipeText })
  });

  if (!response.ok) {
    throw new Error("Failed to convert recipe");
  }

  return response.json();
}
