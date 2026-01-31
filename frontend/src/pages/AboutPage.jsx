import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./SEO.css";

function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Halal Kitchen - Our Mission & Values | Halal Recipe Converter</title>
        <meta 
          name="description" 
          content="Learn about Halal Kitchen's mission to make halal cooking accessible to everyone. Free recipe conversion tool with Islamic dietary guidance." 
        />
        <meta name="keywords" content="about halal kitchen, halal cooking mission, Islamic dietary guidance, halal food community" />
        <link rel="canonical" href="https://halalkitchen.app/about" />
      </Helmet>
      
      <main className="seo-page">
        <header className="seo-header">
          <h1>About Halal Kitchen</h1>
          <p className="seo-subtitle">
            Making halal cooking accessible to everyone, one recipe at a time.
          </p>
        </header>

        <section className="seo-content">
          <article>
            <h2>Our Mission</h2>
            <p>
              Halal Kitchen was created to make halal cooking accessible to everyone. Whether you're 
              a Muslim family looking to convert favorite recipes, a restaurant owner serving halal 
              cuisine, or someone exploring Islamic dietary guidelines, we provide the tools and 
              knowledge you need.
            </p>

            <h2>What We Do</h2>
            <p>
              We offer a free, easy-to-use recipe converter that instantly transforms any recipe 
              into a halal-compliant version. Our system:
            </p>
            <ul>
              <li>Identifies non-halal ingredients automatically</li>
              <li>Suggests halal alternatives with Islamic references</li>
              <li>Provides confidence scores for each conversion</li>
              <li>Offers quick lookup for individual ingredients</li>
              <li>Builds a community of halal cooking enthusiasts</li>
            </ul>

            <h2>Our Values</h2>
            <ul>
              <li><strong>Accessibility:</strong> Free tools available to everyone</li>
              <li><strong>Accuracy:</strong> Based on authentic Islamic sources</li>
              <li><strong>Transparency:</strong> Clear explanations and confidence scores</li>
              <li><strong>Community:</strong> Learning from shared experiences</li>
              <li><strong>Respect:</strong> Honoring different schools of thought</li>
            </ul>

            <h2>Islamic Foundation</h2>
            <p>
              All our halal guidance is based on authentic Islamic sources, including:
            </p>
            <ul>
              <li>Qur'anic verses on dietary laws</li>
              <li>Authentic Hadith references</li>
              <li>Respected Islamic schools of thought (Hanafi, Shafi'i, Maliki, Hanbali)</li>
              <li>Contemporary halal certification standards</li>
            </ul>

            <h2>Privacy & Data</h2>
            <p>
              Your privacy is important to us. Halal Kitchen:
            </p>
            <ul>
              <li>Stores all data locally on your device</li>
              <li>Requires no account or personal information</li>
              <li>Does not track you across websites</li>
              <li>Respects your dietary preferences and choices</li>
            </ul>

            <h2>Get Started</h2>
            <p>
              Ready to convert your first recipe? Our tool is free, easy to use, and requires no 
              sign-up. Simply paste your recipe and get instant halal-compliant results.
            </p>

            <div className="seo-cta">
              <Link to="/app" className="cta-button">
                Start Converting Recipes
              </Link>
            </div>
          </article>
        </section>

        <section className="seo-links">
          <nav className="seo-nav">
            <Link to="/">Home</Link>
            <Link to="/is-it-halal">Is It Halal?</Link>
            <Link to="/halal-substitutes">Halal Substitutes</Link>
            <Link to="/how-it-works">How It Works</Link>
          </nav>
        </section>
      </main>
    </>
  );
}

export default AboutPage;
