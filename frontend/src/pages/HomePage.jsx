import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./SEO.css";

function HomePage() {
  return (
    <>
      <Helmet>
        <title>Halal Kitchen - Convert Any Recipe to Halal | Free Recipe Converter</title>
        <meta 
          name="description" 
          content="Convert any recipe to halal-compliant with our free AI-powered recipe converter. Get halal substitutes, Islamic dietary guidance, and confidence scores. Start converting recipes today!" 
        />
        <meta name="keywords" content="halal recipe converter, halal food, halal substitutes, Islamic cooking, halal ingredients, recipe conversion" />
        <meta name="impact-site-verification" value="fe2ab7e4-4056-474d-ad17-32d276d1e47c" />
        <link rel="canonical" href="https://halalkitchen.app/" />
      </Helmet>
      
      <main className="seo-page">
        <header className="seo-header">
          <h1>Halal Kitchen - Your Free Recipe Conversion Tool</h1>
          <p className="seo-subtitle">
            Convert any recipe to halal-compliant instantly. Get halal substitutes, 
            Islamic dietary guidance, and confidence scores for every conversion.
          </p>
        </header>

        <section className="seo-content">
          <article>
            <h2>Why Use Halal Kitchen?</h2>
            <p>
              Halal Kitchen is the easiest way to make any recipe halal-compliant. 
              Whether you're cooking for your family, running a halal restaurant, or 
              exploring Islamic dietary guidelines, our converter provides instant 
              halal substitutions with confidence scores.
            </p>

            <h3>Key Features</h3>
            <ul>
              <li><strong>Instant Conversion:</strong> Paste any recipe and get halal-compliant results in seconds</li>
              <li><strong>Halal Substitutes:</strong> Automatic ingredient replacements with Islamic references</li>
              <li><strong>Confidence Scores:</strong> Know how confident we are in each conversion</li>
              <li><strong>Quick Lookup:</strong> Check if individual ingredients are halal before cooking</li>
              <li><strong>Community Tips:</strong> Learn from other users' substitution experiences</li>
            </ul>

            <h3>How It Works</h3>
            <p>
              Our AI-powered converter analyzes your recipe ingredients and identifies 
              non-halal items like pork, alcohol, and non-halal gelatin. We then suggest 
              halal alternatives that maintain flavor and texture, backed by Qur'anic and 
              Hadith references.
            </p>

            <div className="seo-cta">
              <Link to="/app" className="cta-button">
                Start Converting Recipes Now
              </Link>
            </div>
          </article>
        </section>

        <section className="seo-links">
          <h2>Learn More</h2>
          <nav className="seo-nav">
            <Link to="/is-it-halal">Is It Halal? - Ingredient Guide</Link>
            <Link to="/halal-substitutes">Common Halal Substitutes</Link>
            <Link to="/how-it-works">How Our Converter Works</Link>
            <Link to="/about">About Halal Kitchen</Link>
          </nav>
        </section>
      </main>
    </>
  );
}

export default HomePage;
