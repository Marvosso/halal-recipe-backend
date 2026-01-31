import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./SEO.css";

function HalalSubstitutesPage() {
  return (
    <>
      <Helmet>
        <title>Halal Substitutes - Complete Replacement Guide | Halal Kitchen</title>
        <meta 
          name="description" 
          content="Complete guide to halal substitutes for common non-halal ingredients. Learn how to replace pork, alcohol, gelatin, and more in your recipes." 
        />
        <meta name="keywords" content="halal substitutes, halal alternatives, pork substitute, alcohol substitute, halal cooking tips" />
        <link rel="canonical" href="https://halalkitchen.app/halal-substitutes" />
      </Helmet>
      
      <main className="seo-page">
        <header className="seo-header">
          <h1>Halal Substitutes - Complete Replacement Guide</h1>
          <p className="seo-subtitle">
            Find the perfect halal alternatives for common non-halal ingredients in your recipes.
          </p>
        </header>

        <section className="seo-content">
          <article>
            <h2>Meat Substitutes</h2>
            
            <div className="substitute-item">
              <h3>Pork → Halal Alternatives</h3>
              <ul>
                <li><strong>Bacon:</strong> Turkey bacon, beef bacon, or halal chicken bacon</li>
                <li><strong>Pork chops/roast:</strong> Beef, lamb, or halal chicken</li>
                <li><strong>Pork sausage:</strong> Halal beef or chicken sausage</li>
                <li><strong>Ham:</strong> Turkey ham or beef pastrami</li>
                <li><strong>Lard:</strong> Halal shortening, vegetable oil, or butter</li>
              </ul>
            </div>

            <h2>Liquid Substitutes</h2>
            
            <div className="substitute-item">
              <h3>Wine → Halal Alternatives</h3>
              <ul>
                <li><strong>Red wine:</strong> Grape juice, pomegranate juice, or non-alcoholic red wine</li>
                <li><strong>White wine:</strong> Apple juice, white grape juice, or non-alcoholic white wine</li>
                <li><strong>Cooking wine:</strong> Chicken stock, vegetable stock, or broth</li>
                <li><strong>Wine vinegar:</strong> Apple cider vinegar or balsamic vinegar (check for alcohol)</li>
              </ul>
            </div>

            <h2>Thickening Agents</h2>
            
            <div className="substitute-item">
              <h3>Gelatin → Halal Alternatives</h3>
              <ul>
                <li><strong>Halal-certified gelatin:</strong> Check for halal certification</li>
                <li><strong>Agar-agar:</strong> Plant-based, works similarly to gelatin</li>
                <li><strong>Pectin:</strong> Great for jams and jellies</li>
                <li><strong>Carrageenan:</strong> Derived from seaweed, halal</li>
                <li><strong>Cornstarch or arrowroot:</strong> For sauces and puddings</li>
              </ul>
            </div>

            <h2>Flavoring Substitutes</h2>
            
            <div className="substitute-item">
              <h3>Vanilla Extract → Halal Alternatives</h3>
              <ul>
                <li><strong>Alcohol-free vanilla extract:</strong> Look for halal-certified versions</li>
                <li><strong>Vanilla powder:</strong> Pure vanilla without alcohol</li>
                <li><strong>Vanilla bean paste:</strong> Made from vanilla beans, no alcohol</li>
                <li><strong>Vanilla beans:</strong> Scrape seeds from whole beans</li>
              </ul>
            </div>

            <h2>General Tips</h2>
            <ul>
              <li>Always check ingredient labels for halal certification</li>
              <li>When in doubt, choose plant-based alternatives</li>
              <li>Some substitutes may slightly alter flavor - adjust seasonings as needed</li>
              <li>For baking, test substitutes in small batches first</li>
            </ul>

            <div className="seo-cta">
              <Link to="/app" className="cta-button">
                Convert Your Recipe with Automatic Substitutes
              </Link>
            </div>
          </article>
        </section>

        <section className="seo-links">
          <nav className="seo-nav">
            <Link to="/">Home</Link>
            <Link to="/is-it-halal">Is It Halal?</Link>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/about">About</Link>
          </nav>
        </section>
      </main>
    </>
  );
}

export default HalalSubstitutesPage;
