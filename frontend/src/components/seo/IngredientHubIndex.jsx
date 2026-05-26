import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getAllIngredientPages } from "../../data/ingredientPageConfig";
import { buildIngredientHubSections } from "../../lib/seo/internalLinks";
import { getIngredientPagePath } from "../../lib/seo/urls";

/**
 * Internal linking hub — lists all config-driven ingredient pages.
 */
function IngredientHubIndex() {
  const sections = useMemo(() => {
    const pages = getAllIngredientPages().map((p) => ({
      slug: p.slug,
      ingredientName: p.ingredientName,
      verdict: p.verdict,
      title: p.title,
    }));
    return buildIngredientHubSections(pages);
  }, []);

  return (
    <section className="seo-ingredient-hub" aria-labelledby="ingredient-hub-title">
      <h2 id="ingredient-hub-title">Ingredient halal guides</h2>
      <p className="seo-hub-intro">
        Browse our top ingredient pages or use Quick Lookup in the app for any item not listed.
      </p>
      {sections.map((section) => (
        <div key={section.id} className="seo-hub-section">
          <h3>{section.label}</h3>
          <ul className="seo-hub-list">
            {section.items.map((item) => (
              <li key={item.slug}>
                <Link to={item.path || getIngredientPagePath(item.slug)}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default IngredientHubIndex;
