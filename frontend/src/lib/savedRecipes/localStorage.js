const STORAGE_KEY = "halalSavedRecipes";
const LEGACY_STORAGE_KEY = "halalRecipes";

export { STORAGE_KEY, LEGACY_STORAGE_KEY };

export const SAVED_RECIPES_UPDATED_EVENT = "recipesUpdated";

export function notifySavedRecipesUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SAVED_RECIPES_UPDATED_EVENT));
  }
}

export function loadLocalSavedRecipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalSavedRecipes(recipes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    notifySavedRecipesUpdated();
    return true;
  } catch {
    return false;
  }
}

/** Migrate legacy halalRecipes key into dedicated storage once */
export function migrateLegacyHalalRecipes() {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    const current = loadLocalSavedRecipes();
    if (!legacy) return current;

    const parsed = JSON.parse(legacy);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return current;
    }

    if (current.length > 0) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return current;
    }

    const normalized = parsed.map((r) => ({
      ...r,
      recipeKind: "saved",
    }));
    saveLocalSavedRecipes(normalized);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return normalized;
  } catch {
    return loadLocalSavedRecipes();
  }
}

export function addLocalSavedRecipe(recipe) {
  const list = loadLocalSavedRecipes();
  const entry = {
    ...recipe,
    id: recipe.id || `local-${Date.now()}`,
    recipeKind: "saved",
    savedAt: recipe.savedAt || new Date().toISOString(),
  };
  const updated = [entry, ...list];
  saveLocalSavedRecipes(updated);
  return entry;
}

export function removeLocalSavedRecipe(id) {
  const updated = loadLocalSavedRecipes().filter((r) => r.id !== id);
  saveLocalSavedRecipes(updated);
  return updated;
}
