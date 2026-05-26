import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getIngredientPageBySlug } from "../data/ingredientPageConfig";
import { FEATURED_INGREDIENT_SLUGS } from "../lib/seo/internalLinks";
import { getIngredientPagePath } from "../lib/seo/urls";
import "./SEOFooter.css";

function SEOFooter() {
  const featured = useMemo(
    () =>
      FEATURED_INGREDIENT_SLUGS.map((slug) => getIngredientPageBySlug(slug)).filter(Boolean),
    []
  );

  return (
    <footer className="seo-footer">
      <div className="seo-footer-content">
        <nav className="seo-footer-nav" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/is-it-halal">Is It Halal?</Link>
          <Link to="/halal-substitutes">Halal Substitutes</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/about">About</Link>
          <Link to="/app">Recipe Converter</Link>
          <Link to="/my-halal-recipes">My Halal Recipes</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Use</Link>
        </nav>
        {featured.length > 0 && (
          <nav className="seo-footer-ingredients" aria-label="Popular ingredient guides">
            {featured.map((page) => (
              <Link key={page.slug} to={getIngredientPagePath(page.slug)}>
                {page.ingredientName}
              </Link>
            ))}
          </nav>
        )}
        <p className="seo-footer-copyright">
          © {new Date().getFullYear()} Halal Kitchen - Making recipes halal-compliant
        </p>
      </div>
    </footer>
  );
}

export default SEOFooter;
