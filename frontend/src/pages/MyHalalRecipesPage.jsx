import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bookmark, Loader2, Plus } from "lucide-react";
import { useSavedRecipes } from "../hooks/useSavedRecipes";
import SavedRecipeCard from "../components/saved/SavedRecipeCard";
import SavedRecipeDetail from "../components/saved/SavedRecipeDetail";
import "./MyHalalRecipesPage.css";
import "../components/saved/SavedRecipes.css";

function MyHalalRecipesPage() {
  const navigate = useNavigate();
  const { recipes, loading, error, deletingId, isLoggedIn, refresh, remove } = useSavedRecipes();
  const [selected, setSelected] = useState(null);

  const handleOpenInConverter = (item) => {
    if (!item) return;
    navigate("/app", { state: { loadRecipe: item } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this saved recipe?")) return;
    try {
      await remove(id);
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert(err?.message || "Failed to delete recipe.");
    }
  };

  return (
    <>
      <Helmet>
        <title>My Halal Recipes | Halal Kitchen</title>
        <meta
          name="description"
          content="View, reopen, and delete your saved halal recipe conversions."
        />
        <link rel="canonical" href="https://halalkitchen.app/my-halal-recipes" />
      </Helmet>

      <main className="my-halal-recipes-page">
        <header className="my-halal-recipes-header">
          <h1>My Halal Recipes</h1>
          <p className="my-halal-recipes-subtitle">
            Saved conversions from the recipe converter. Tap a recipe to reopen it.
          </p>
          <Link to="/app" className="my-halal-recipes-btn primary my-halal-recipes-header-cta">
            <Plus size={18} aria-hidden="true" />
            New conversion
          </Link>
        </header>

        {!isLoggedIn && (
          <p className="my-halal-recipes-guest-note" role="status">
            Recipes are saved on this device. Log in from the app to sync saves to your account.
          </p>
        )}

        {loading && (
          <div className="my-halal-recipes-loading" aria-busy="true">
            <Loader2 size={28} className="spin" />
            <span>Loading your recipes…</span>
          </div>
        )}

        {error && (
          <div className="my-halal-recipes-error" role="alert">
            <p>{error}</p>
            <button type="button" className="my-halal-recipes-btn secondary" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <section className="my-halal-recipes-empty">
            <Bookmark size={48} aria-hidden="true" />
            <p>No saved recipes yet.</p>
            <p>Convert a recipe, then tap &ldquo;Save Halal Version&rdquo; to store it here.</p>
            <Link to="/app" className="my-halal-recipes-btn primary">
              Convert a recipe
            </Link>
          </section>
        )}

        {!loading && !error && recipes.length > 0 && (
          <section className="my-halal-recipes-list" aria-label="Saved halal recipes">
            {recipes.map((item) => (
              <SavedRecipeCard
                key={item.id}
                recipe={item}
                selected={selected?.id === item.id}
                onOpen={setSelected}
                onDelete={handleDelete}
                deleting={deletingId === item.id}
              />
            ))}
          </section>
        )}

        <nav className="my-halal-recipes-nav">
          <Link to="/app">Back to Converter</Link>
          <Link to="/">Home</Link>
        </nav>
      </main>

      {selected && (
        <SavedRecipeDetail
          recipe={selected}
          onClose={() => setSelected(null)}
          onOpenInConverter={(item) => {
            setSelected(null);
            handleOpenInConverter(item);
          }}
        />
      )}
    </>
  );
}

export default MyHalalRecipesPage;
