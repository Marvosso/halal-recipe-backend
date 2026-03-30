import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./SEO.css";

const LAST_UPDATED = "March 30, 2026";

function TermsOfUsePage() {
  return (
    <>
      <Helmet>
        <title>Terms of Use | Halal Kitchen</title>
        <meta
          name="description"
          content="Terms of Use for Halal Kitchen: acceptable use, disclaimers, and limitations of liability for our halal recipe tools."
        />
        <link rel="canonical" href="https://halalkitchen.app/terms" />
      </Helmet>

      <main className="seo-page">
        <header className="seo-header">
          <h1>Terms of Use</h1>
          <p className="seo-subtitle">Last updated: {LAST_UPDATED}</p>
        </header>

        <section className="seo-content">
          <article className="policy-article">
            <p>
              These Terms of Use (&quot;Terms&quot;) govern your access to and use of Halal Kitchen at
              halalkitchen.app and related services. By using the site, you agree to these Terms.
            </p>

            <h2>1. Educational tool; not religious ruling</h2>
            <p>
              Halal Kitchen provides educational information and automated suggestions to help you adapt
              recipes and understand common ingredient issues. Output is generated using rules, data, and
              optional AI assistance. It is <strong>not</strong> a substitute for a qualified Islamic scholar
              (&quot;mufti&quot;) or your own research when your situation requires a formal ruling. You are
              responsible for verifying ingredients, certifications, and sources for your own dietary needs.
            </p>

            <h2>2. No warranty</h2>
            <p>
              The service is provided &quot;as is&quot; without warranties of any kind, express or implied. We do
              not guarantee that results are complete, error-free, or suitable for every school of thought or
              jurisdiction. Halal standards can vary by region, certification body, and personal practice.
            </p>

            <h2>3. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the site to break the law or infringe others&apos; rights</li>
              <li>Attempt to disrupt, overload, or reverse-engineer the service maliciously</li>
              <li>Scrape or automate access in a way that harms performance or other users</li>
              <li>Upload malware or abusive content</li>
            </ul>

            <h2>4. User content</h2>
            <p>
              If you submit recipes, posts, or other content, you grant us a license to host, display, and
              process that content to operate the service. You represent that you have the right to submit it.
              We may remove content that violates these Terms or applicable law.
            </p>

            <h2>5. Third-party links and ads</h2>
            <p>
              The site may include links to third-party sites or advertisements. We are not responsible for
              third-party content, policies, or practices. Advertising is served by partners such as Google;
              their use of cookies and data is described in our Privacy Policy.
            </p>

            <h2>6. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Halal Kitchen and its operators shall not be liable for
              any indirect, incidental, special, or consequential damages arising from your use of the site.
              Our total liability for any claim related to the service shall not exceed the greater of (a)
              amounts you paid us for the service in the twelve months before the claim or (b) fifty U.S.
              dollars, if you paid nothing.
            </p>

            <h2>7. Changes</h2>
            <p>
              We may modify these Terms or the service. We will post updates here with a new &quot;last
              updated&quot; date. Continued use after changes constitutes acceptance.
            </p>

            <h2>8. Contact</h2>
            <p>
              Questions: <Link to="/contact">Contact us</Link>.
            </p>

            <div className="seo-links policy-back">
              <nav className="seo-nav" aria-label="Related pages">
                <Link to="/">Home</Link>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/contact">Contact</Link>
              </nav>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}

export default TermsOfUsePage;
