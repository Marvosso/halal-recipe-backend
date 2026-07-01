import { useCallback, useEffect, useState } from "react";
import {
  listSavedHalalRecipes,
  saveHalalRecipe,
  deleteSavedHalalRecipe,
} from "../api/savedRecipesApi";
import { buildSavePayload } from "../lib/savedRecipes/savedRecipeModel";
import { isAuthenticated } from "../api/authApi";
import { SAVED_RECIPES_UPDATED_EVENT } from "../lib/savedRecipes/localStorage";

/**
 * Saved halal recipes list + actions for My Halal Recipes page.
 */
export function useSavedRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listSavedHalalRecipes();
      setRecipes(list);
    } catch (err) {
      setError(err?.message || "Failed to load saved recipes");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onUpdate = () => {
      refresh();
    };
    window.addEventListener(SAVED_RECIPES_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(SAVED_RECIPES_UPDATED_EVENT, onUpdate);
  }, [refresh]);

  const saveConversion = useCallback(
    async ({ recipe, converted, confidence, issues, title }) => {
      setSaving(true);
      try {
        const payload = buildSavePayload({ recipe, converted, confidence, issues, title });
        const saved = await saveHalalRecipe(payload);
        setRecipes((prev) => {
          const exists = prev.some((r) => r.id === saved.id);
          if (exists) return prev.map((r) => (r.id === saved.id ? saved : r));
          return [saved, ...prev];
        });
        return saved;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const remove = useCallback(async (id) => {
    if (!id) return;
    setDeletingId(id);
    try {
      await deleteSavedHalalRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }, []);

  return {
    recipes,
    loading,
    error,
    saving,
    deletingId,
    isLoggedIn: isAuthenticated(),
    refresh,
    saveConversion,
    remove,
  };
}
