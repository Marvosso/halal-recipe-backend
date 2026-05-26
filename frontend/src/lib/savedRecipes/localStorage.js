const STORAGE_KEY = "halalSavedRecipes";

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
    return true;
  } catch {
    return false;
  }
}

/** Migrate legacy halalRecipes key into dedicated storage once */
export function migrateLegacyHalalRecipes() {
  try {
    const legacy = localStorage.getItem("halalRecipes");
    if (!legacy) return loadLocalSavedRecipes();
    const parsed = JSON.parse(legacy);
    if (!Array.isArray(parsed) || parsed.length === 0) return loadLocalSavedRecipes();
    const current = loadLocalSavedRecipes();
    if (current.length > 0) return current;
    const normalized = parsed.map((r) => ({
      ...r,
      recipeKind: "saved",
    }));
    saveLocalSavedRecipes(normalized);
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
