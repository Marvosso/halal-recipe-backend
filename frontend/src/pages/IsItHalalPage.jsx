import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./SEO.css";

function IsItHalalPage() {
  return (
    <>
      <Helmet>
        <title>Is It Halal? - Complete Ingredient Guide | Halal Kitchen</title>
        <meta 
          name="description" 
          content="Quick reference guide to determine if ingredients are halal. Learn about pork, alcohol, gelatin, vanilla extract, and more. Check ingredients before cooking." 
        />
        <meta name="keywords" content="is it halal, halal ingredients, haram ingredients, halal food guide, Islamic dietary laws" />
        <link rel="canonical" href="https://halalkitchen.app/is-it-halal" />
      </Helmet>
      
      <main className="seo-page">
        <header className="seo-header">
          <h1>Is It Halal? Complete Ingredient Guide</h1>
          <p className="seo-subtitle">
            Quick reference to determine if common ingredients are halal, haram, or questionable.
          </p>
        </header>

        <section className="seo-content">
          <article>
            <h2>Common Haram (Prohibited) Ingredients</h2>
            
            <div className="ingredient-category">
              <h3>Pork and Pork Products</h3>
              <p>
                All pork products are haram (prohibited) in Islam. This includes:
              </p>
              <ul>
                <li>Pork meat</li>
                <li>Bacon</li>
                <li>Ham</li>
                <li>Pork sausage</li>
                <li>Lard (pork fat)</li>
              </ul>
              <p>
                <strong>Halal Alternatives:</strong> Beef, lamb, chicken, turkey, or plant-based alternatives
              </p>
            </div>

            <div className="ingredient-category">
              <h3>Alcohol</h3>
              <p>
                All alcoholic beverages and ingredients containing alcohol are haram:
              </p>
              <ul>
                <li>Wine (red, white, cooking wine)</li>
                <li>Beer</li>
                <li>Spirits and liquors</li>
                <li>Wine vinegar (if made from wine)</li>
              </ul>
              <p>
                <strong>Halal Alternatives:</strong> Non-alcoholic wine, grape juice, chicken or vegetable stock, 
                apple cider vinegar (non-alcoholic)
              </p>
            </div>

            <h2>Questionable Ingredients (Check Source)</h2>
            
            <div className="ingredient-category">
              <h3>Gelatin</h3>
              <p>
                Gelatin may be derived from pork or non-halal sources. Always check the source:
              </p>
              <ul>
                <li>Pork gelatin - <strong>Haram</strong></li>
                <li>Beef gelatin (non-halal slaughtered) - <strong>Haram</strong></li>
                <li>Halal-certified gelatin - <strong>Halal</strong></li>
              </ul>
              <p>
                <strong>Halal Alternatives:</strong> Halal-certified gelatin, agar-agar, pectin, carrageenan
              </p>
            </div>

            <div className="ingredient-category">
              <h3>Vanilla Extract</h3>
              <p>
                Most vanilla extracts contain alcohol. Look for alcohol-free versions:
              </p>
              <ul>
                <li>Regular vanilla extract (with alcohol) - <strong>Haram</strong></li>
                <li>Alcohol-free vanilla extract - <strong>Halal</strong></li>
                <li>Vanilla powder or bean paste - <strong>Halal</strong></li>
              </ul>
            </div>

            <h2>Always Halal Ingredients</h2>
            <ul>
              <li>Fresh fruits and vegetables</li>
              <li>Halal-certified meat (beef, lamb, chicken, turkey)</li>
              <li>Fish and seafood (most schools of thought)</li>
              <li>Grains (rice, wheat, oats)</li>
              <li>Legumes (beans, lentils, chickpeas)</li>
              <li>Dairy products (milk, cheese, yogurt - check for non-halal enzymes)</li>
            </ul>

            <div className="seo-cta">
              <Link to="/app" className="cta-button">
                Use Our Quick Lookup Tool
              </Link>
            </div>
          </article>
        </section>

        <section className="seo-links">
          <nav className="seo-nav">
            <Link to="/">Home</Link>
            <Link to="/halal-substitutes">Halal Substitutes</Link>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/about">About</Link>
          </nav>
        </section>
      </main>
    </>
  );
}

export default IsItHalalPage;
