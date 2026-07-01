import { getAPIURL } from "../utils/apiConfig";
import { getAuthToken } from "./authApi";
import {
  addLocalSavedRecipe,
  loadLocalSavedRecipes,
  migrateLegacyHalalRecipes,
  removeLocalSavedRecipe,
  saveLocalSavedRecipes,
  notifySavedRecipesUpdated,
} from "../lib/savedRecipes/localStorage";
import { normalizeSavedRecipe } from "../lib/savedRecipes/savedRecipeModel";

async function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * @param {object} payload — from buildSavePayload()
 */
export async function saveHalalRecipe(payload) {
  const token = getAuthToken();
  if (!token) {
    const local = addLocalSavedRecipe({
      title: payload.title,
      original: payload.originalRecipe,
      converted: payload.convertedRecipe,
      issues: payload.substitutionsUsed || payload.issues,
      confidenceScore: payload.confidenceScore,
    });
    return normalizeSavedRecipe(local);
  }

  const url = await getAPIURL("/api/saved-recipes");
  const response = await fetch(url, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || "Failed to save recipe");
  }

  const data = await response.json();
  const saved = normalizeSavedRecipe(data.recipe);
  notifySavedRecipesUpdated();
  return saved;
}

/**
 * @returns {Promise<object[]>}
 */
export async function listSavedHalalRecipes() {
  const token = getAuthToken();
  if (!token) {
    return migrateLegacyHalalRecipes().map(normalizeSavedRecipe).filter(Boolean);
  }

  const url = await getAPIURL("/api/saved-recipes");
  const response = await fetch(url, {
    headers: await authHeaders(),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || "Failed to load saved recipes");
  }

  const data = await response.json();
  const list = (data.recipes || []).map(normalizeSavedRecipe).filter(Boolean);
  saveLocalSavedRecipes(
    list.map((r) => ({
      id: r.id,
      title: r.title,
      original: r.original,
      converted: r.converted,
      issues: r.issues,
      confidenceScore: r.confidenceScore,
      savedAt: r.savedAt,
      recipeKind: "saved",
    }))
  );
  return list;
}

/**
 * @param {string} id
 */
export async function getSavedHalalRecipe(id) {
  const token = getAuthToken();
  if (!token) {
    const found = migrateLegacyHalalRecipes().find((r) => r.id === id);
    return normalizeSavedRecipe(found);
  }

  const url = await getAPIURL(`/api/saved-recipes/${id}`);
  const response = await fetch(url, { headers: await authHeaders() });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || "Recipe not found");
  }

  const data = await response.json();
  return normalizeSavedRecipe(data.recipe);
}

/**
 * @param {string} id
 */
export async function deleteSavedHalalRecipe(id) {
  const token = getAuthToken();
  if (!token) {
    removeLocalSavedRecipe(id);
    return;
  }

  const url = await getAPIURL(`/api/saved-recipes/${id}`);
  const response = await fetch(url, {
    method: "DELETE",
    headers: await authHeaders(),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || "Failed to delete recipe");
  }

  const local = loadLocalSavedRecipes().filter((r) => r.id !== id);
  saveLocalSavedRecipes(local);
}
