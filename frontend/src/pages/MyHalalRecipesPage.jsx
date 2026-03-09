import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bookmark, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { getMyRecipes, deleteRecipe } from "../api/recipesApi";
import { isAuthenticated } from "../api/authApi";
import "./MyHalalRecipesPage.css";

function MyHalalRecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getMyRecipes()
      .then((list) => {
        const normalized = Array.isArray(list)
          ? list.map((r) => ({
              id: r.id,
              title: r.title || "Untitled Recipe",
              original: r.originalRecipe ?? r.original_recipe ?? r.original ?? "",
              converted: r.convertedRecipe ?? r.converted_recipe ?? r.converted ?? "",
              savedAt: r.createdAt ?? r.created_at ?? r.savedAt,
            }))
          : [];
        setRecipes(normalized);
      })
      .catch((err) => {
        setError(err?.error || err?.message || "Failed to load recipes.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRevisit = (item) => {
    if (!item?.original && !item?.converted) return;
    navigate("/app", { state: { loadRecipe: item } });
  };

  const handleDelete = async (id) => {
    if (!id || !window.confirm("Delete this saved recipe?")) return;
    setDeletingId(id);
    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err?.error || err?.message || "Failed to delete recipe.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
  };

  if (!isAuthenticated()) {
    return (
      <>
        <Helmet>
          <title>My Halal Recipes | Halal Kitchen</title>
          <meta name="description" content="View and manage your saved halal recipe conversions." />
        </Helmet>
        <main className="my-halal-recipes-page">
          <header className="my-halal-recipes-header">
            <h1>My Halal Recipes</h1>
            <p className="my-halal-recipes-subtitle">Your saved halal conversions in one place.</p>
          </header>
          <section className="my-halal-recipes-cta">
            <p>Log in to see your saved halal recipes and sync across devices.</p>
            <Link to="/app" className="my-halal-recipes-btn primary">
              Go to App
            </Link>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Halal Recipes | Halal Kitchen</title>
        <meta name="description" content="View and manage your saved halal recipe conversions." />
      </Helmet>
      <main className="my-halal-recipes-page">
        <header className="my-halal-recipes-header">
          <h1>My Halal Recipes</h1>
          <p className="my-halal-recipes-subtitle">Your saved halal conversions. Revisit or remove any recipe.</p>
        </header>

        {loading && (
          <div className="my-halal-recipes-loading" aria-busy="true">
            <Loader2 size={28} className="spin" />
            <span>Loading your recipes…</span>
          </div>
        )}

        {error && (
          <div className="my-halal-recipes-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <section className="my-halal-recipes-empty">
            <Bookmark size={48} aria-hidden="true" />
            <p>No saved recipes yet.</p>
            <p>Convert a recipe and tap &ldquo;Save Halal Version&rdquo; to add it here.</p>
            <Link to="/app" className="my-halal-recipes-btn primary">Convert a recipe</Link>
          </section>
        )}

        {!loading && !error && recipes.length > 0 && (
          <section className="my-halal-recipes-list" aria-label="Saved halal recipes">
            {recipes.map((item) => (
              <article key={item.id} className="my-halal-recipe-card">
                <div className="my-halal-recipe-main">
                  <h2 className="my-halal-recipe-title">{item.title}</h2>
                  <p className="my-halal-recipe-date">{formatDate(item.savedAt)}</p>
                  <p className="my-halal-recipe-preview">
                    {(item.converted || item.original || "").slice(0, 120)}
                    {((item.converted || item.original) || "").length > 120 ? "…" : ""}
                  </p>
                </div>
                <div className="my-halal-recipe-actions">
                  <button
                    type="button"
                    className="my-halal-recipes-btn secondary"
                    onClick={() => handleRevisit(item)}
                    aria-label={`Revisit ${item.title}`}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    Revisit
                  </button>
                  <button
                    type="button"
                    className="my-halal-recipes-btn danger"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    aria-label={`Delete ${item.title}`}
                  >
                    {deletingId === item.id ? (
                      <Loader2 size={16} className="spin" aria-hidden="true" />
                    ) : (
                      <Trash2 size={16} aria-hidden="true" />
                    )}
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        <nav className="my-halal-recipes-nav">
          <Link to="/app">Back to Converter</Link>
          <Link to="/">Home</Link>
        </nav>
      </main>
    </>
  );
}

export default MyHalalRecipesPage;
