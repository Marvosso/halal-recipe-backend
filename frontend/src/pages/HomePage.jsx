import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import CommunityConversions from "../components/CommunityConversions";
import { COMMUNITY_CONVERSIONS_MOCK } from "../data/communityConversionsData";
import "./SEO.css";

function HomePage() {
  return (
    <>
      <Helmet>
        <title>Halal Kitchen - Cook Any Recipe, Halal-Certified | Free Recipe Converter</title>
        <meta
          name="description"
          content="Free halal recipe converter plus ingredient guides: substitutes for pork and alcohol, gelatin, vanilla, and more. Convert recipes and check ingredients with Quick Lookup."
        />
        <meta name="keywords" content="halal recipe converter, halal food, halal substitutes, Islamic cooking, halal ingredients, recipe conversion" />
        <link rel="canonical" href="https://halalkitchen.app/" />
      </Helmet>
      
      <main className="seo-page">
        <header className="hero-section">
          <h1 className="hero-headline">Cook Any Recipe, Halal-Certified</h1>
          <p className="hero-subheadline">
            Paste any recipe and get halal-compliant alternatives in seconds—with clear substitutes, 
            Islamic references, and confidence scores. No guesswork, no stress.
          </p>
          <div className="hero-trust-bar" aria-label="Why trust Halal Kitchen">
            <div className="hero-trust-item">
              <span className="hero-trust-icon" aria-hidden="true">✓</span>
              <span>Free to try — convert your first recipe now</span>
            </div>
            <div className="hero-trust-item">
              <span className="hero-trust-icon" aria-hidden="true">✓</span>
              <span>Instant results — halal swaps in seconds</span>
            </div>
            <div className="hero-trust-item">
              <span className="hero-trust-icon" aria-hidden="true">✓</span>
              <span>Islamic guidance — clear references & substitutes</span>
            </div>
          </div>
          <div className="hero-cta-wrap">
            <Link to="/app" className="hero-cta-primary">
              Try the converter — it's free
            </Link>
          </div>
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
              <li><strong>Ingredient guides:</strong> SEO pages for common halal questions (gelatin, soy sauce, wine, and more)</li>
            </ul>

            <h3>How It Works</h3>
            <p>
              Our converter analyzes your recipe ingredients and identifies 
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

        <section className="seo-content seo-guide" aria-labelledby="guide-heading">
          <article>
            <h2 id="guide-heading">Practical guide: halal cooking at home</h2>
            <p>
              Eating halal is not only about avoiding a short list of ingredients—it is about building habits:
              reading labels carefully, knowing when an ingredient&apos;s <em>source</em> matters (for example
              gelatin or enzymes), and choosing suppliers you trust. Halal Kitchen exists to speed up that
              work: we highlight common problems in a recipe, suggest swaps, and point you to references so
              you can decide with confidence.
            </p>
            <h3>Why &quot;questionable&quot; ingredients need context</h3>
            <p>
              Some items are halal or haram depending on how they were made. Gelatin might come from fish,
              beef, or pork. Vanilla extract may contain alcohol as a solvent. Rennet in cheese can be
              animal-derived or microbial. A generic recipe that says &quot;gelatin&quot; or &quot;natural flavors&quot;
              does not tell you the source—so a good halal workflow is: identify the ambiguous line, check
              the product label or manufacturer, and substitute when in doubt (for example agar-agar instead
              of unknown gelatin).
            </p>
            <h3>Reading packaged food labels</h3>
            <p>
              Start with the ingredient list, not only the marketing on the front. Look for alcohol in any
              form (wine, beer, ethyl alcohol, &quot;natural flavor&quot; carriers in some products), pork or lard,
              and non-halal animal derivatives. If a product carries a recognized halal certification mark
              for your market, that can reduce guesswork—but certification standards differ by country and
              body, so many families still prefer to read ingredients for themselves.
            </p>
            <h3>Restaurants, shared kitchens, and cross-contact</h3>
            <p>
              At home you control pans, oils, and grills. In restaurants or industrial kitchens, cross-contact
              with non-halal meat or alcohol may occur. Our converter focuses on <strong>ingredient lists in
              recipes</strong>; it does not certify a kitchen or supply chain. When eating out, ask how food is
              prepared if you follow strict separation.
            </p>
            <p>
              For ingredient-by-ingredient reference, see our{" "}
              <Link to="/is-it-halal">Is It Halal?</Link> guide and{" "}
              <Link to="/halal-substitutes">halal substitutes</Link> page—then use the{" "}
              <Link to="/app">converter</Link> when you have a full recipe ready to adapt.
            </p>
          </article>
        </section>

        <section className="seo-content seo-faq" aria-labelledby="faq-heading">
          <article>
            <h2 id="faq-heading">Frequently asked questions</h2>
            <dl className="seo-faq-list">
              <dt>Is Halal Kitchen a fatwa or legal authority?</dt>
              <dd>
                No. We provide educational tools and automated suggestions. For personal rulings on edge cases,
                consult a qualified scholar you trust.
              </dd>
              <dt>Does the recipe converter work for any cuisine?</dt>
              <dd>
                You can paste recipes from any tradition. The tool flags common haram or doubtful ingredients
                and suggests halal-friendly replacements; you should still verify packaged products yourself.
              </dd>
              <dt>How do I check a single ingredient?</dt>
              <dd>
                Open the <Link to="/app#quick-lookup">converter app</Link> and use Quick Lookup below
                the recipe box—type an ingredient like gelatin or soy sauce for an instant ruling.
              </dd>
              <dt>What does the confidence score mean?</dt>
              <dd>
                It reflects how strongly our rules match the ingredients we detected—lower scores often mean
                more substitutions or more items that need manual verification.
              </dd>
              <dt>How do you make money?</dt>
              <dd>
                Halal Kitchen may show ads (for example through Google AdSense) and may use affiliate links
                where relevant. See our <Link to="/privacy">Privacy Policy</Link> for how ads and analytics work.
              </dd>
            </dl>
          </article>
        </section>

        <CommunityConversions items={COMMUNITY_CONVERSIONS_MOCK} maxItems={5} />

        <section className="seo-links">
          <h2>Learn more</h2>
          <nav className="seo-nav">
            <Link to="/is-it-halal">Is It Halal? — Ingredient guide</Link>
            <Link to="/halal-substitutes">Common halal substitutes</Link>
            <Link to="/how-it-works">How our converter works</Link>
            <Link to="/about">About Halal Kitchen</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Use</Link>
          </nav>
        </section>
      </main>
    </>
  );
}

export default HomePage;
