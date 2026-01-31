import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./SEO.css";

function HowItWorksPage() {
  return (
    <>
      <Helmet>
        <title>How It Works - Halal Recipe Converter Explained | Halal Kitchen</title>
        <meta 
          name="description" 
          content="Learn how Halal Kitchen's recipe converter works. Understand our AI-powered ingredient analysis, halal substitution process, and confidence scoring system." 
        />
        <meta name="keywords" content="how halal converter works, recipe conversion process, halal AI, ingredient analysis" />
        <link rel="canonical" href="https://halalkitchen.app/how-it-works" />
      </Helmet>
      
      <main className="seo-page">
        <header className="seo-header">
          <h1>How Halal Kitchen Works</h1>
          <p className="seo-subtitle">
            Understand our recipe conversion process, from ingredient analysis to halal substitutions.
          </p>
        </header>

        <section className="seo-content">
          <article>
            <h2>Step-by-Step Process</h2>
            
            <div className="process-step">
              <h3>1. Recipe Input</h3>
              <p>
                Simply paste your recipe into our converter. Our system accepts recipes in any format - 
                from simple ingredient lists to full cooking instructions.
              </p>
            </div>

            <div className="process-step">
              <h3>2. Ingredient Analysis</h3>
              <p>
                Our AI-powered system analyzes each ingredient in your recipe, checking against our 
                comprehensive database of halal and haram ingredients. We identify:
              </p>
              <ul>
                <li>Haram (prohibited) ingredients like pork and alcohol</li>
                <li>Questionable ingredients that require source verification</li>
                <li>Halal ingredients that need no changes</li>
              </ul>
            </div>

            <div className="process-step">
              <h3>3. Halal Substitution</h3>
              <p>
                For each non-halal ingredient, we suggest halal alternatives that:
              </p>
              <ul>
                <li>Maintain similar flavor profiles</li>
                <li>Preserve texture and cooking properties</li>
                <li>Are readily available in most markets</li>
                <li>Include Islamic references (Qur'an and Hadith)</li>
              </ul>
            </div>

            <div className="process-step">
              <h3>4. Confidence Scoring</h3>
              <p>
                Each conversion receives a confidence score (0-100%) that indicates:
              </p>
              <ul>
                <li><strong>90-100%:</strong> All ingredients verified halal, high confidence</li>
                <li><strong>70-89%:</strong> Most ingredients halal, some may need verification</li>
                <li><strong>50-69%:</strong> Many substitutions made, review recommended</li>
                <li><strong>Below 50%:</strong> Significant changes needed, manual review required</li>
              </ul>
            </div>

            <div className="process-step">
              <h3>5. Detailed Results</h3>
              <p>
                You receive a complete converted recipe with:
              </p>
              <ul>
                <li>Full recipe text with highlighted changes</li>
                <li>Detailed explanation for each substitution</li>
                <li>Islamic references (Qur'an and Hadith)</li>
                <li>Community tips and suggestions</li>
              </ul>
            </div>

            <h2>Our Technology</h2>
            <p>
              Halal Kitchen uses advanced natural language processing to understand recipe context 
              and suggest appropriate halal substitutes. Our database is continuously updated with 
              new ingredients and community feedback.
            </p>

            <h2>Customization Options</h2>
            <ul>
              <li><strong>Strictness Level:</strong> Choose Strict, Standard, or Flexible halal guidelines</li>
              <li><strong>School of Thought:</strong> Select Hanafi, Shafi'i, Maliki, or Hanbali preferences</li>
              <li><strong>Simple Explanations:</strong> Toggle between detailed references and simple explanations</li>
            </ul>

            <div className="seo-cta">
              <Link to="/app" className="cta-button">
                Try Our Recipe Converter Now
              </Link>
            </div>
          </article>
        </section>

        <section className="seo-links">
          <nav className="seo-nav">
            <Link to="/">Home</Link>
            <Link to="/is-it-halal">Is It Halal?</Link>
            <Link to="/halal-substitutes">Halal Substitutes</Link>
            <Link to="/about">About</Link>
          </nav>
        </section>
      </main>
    </>
  );
}

export default HowItWorksPage;
