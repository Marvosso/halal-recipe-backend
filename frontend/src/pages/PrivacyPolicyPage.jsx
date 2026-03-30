import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./SEO.css";

const LAST_UPDATED = "March 30, 2026";

function PrivacyPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Halal Kitchen</title>
        <meta
          name="description"
          content="How Halal Kitchen collects, uses, and protects your information. Cookies, analytics, advertising, and your choices."
        />
        <link rel="canonical" href="https://halalkitchen.app/privacy" />
      </Helmet>

      <main className="seo-page">
        <header className="seo-header">
          <h1>Privacy Policy</h1>
          <p className="seo-subtitle">Last updated: {LAST_UPDATED}</p>
        </header>

        <section className="seo-content">
          <article className="policy-article">
            <p>
              Halal Kitchen (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates halalkitchen.app. This page
              explains what information we may collect when you use the site, how we use it, and the
              choices you have. If you do not agree with this policy, please do not use the service.
            </p>

            <h2>1. Information we collect</h2>
            <p>
              <strong>Information you provide.</strong> If you create an account, post content, or contact us,
              we may store the details you submit (for example, email address, display name, or message text)
              as needed to provide those features.
            </p>
            <p>
              <strong>Recipe and tool usage.</strong> Text you paste into the recipe converter or ingredient
              tools may be processed on our servers to return results. We use this data to operate the
              service and improve accuracy. We do not sell your personal recipe text to third parties.
            </p>
            <p>
              <strong>Technical data.</strong> Like most websites, we receive standard technical information
              such as browser type, general location (country/region), device type, and pages visited. This
              helps us secure the site, fix errors, and understand how features are used.
            </p>

            <h2>2. Cookies and similar technologies</h2>
            <p>
              We and our partners may use cookies, local storage, and similar technologies to remember
              preferences, keep you signed in where applicable, measure traffic, and show advertising.
              You can control cookies through your browser settings; blocking some cookies may limit
              certain features.
            </p>

            <h2>3. Analytics</h2>
            <p>
              We use privacy-focused analytics (such as Plausible Analytics) to see aggregate usage
              trends—for example, which pages are popular. These tools are configured to minimize personal
              data and avoid cross-site tracking where possible.
            </p>

            <h2>4. Advertising (Google AdSense)</h2>
            <p>
              Third-party vendors, including Google, may use cookies to serve ads based on your prior visits
              to this or other websites. Google&apos;s use of advertising cookies enables it and its partners
              to serve ads to you. You may opt out of personalized advertising by visiting{" "}
              <a href="https://www.google.com/settings/ads" rel="noopener noreferrer" target="_blank">
                Google Ads Settings
              </a>{" "}
              or{" "}
              <a href="https://www.aboutads.info" rel="noopener noreferrer" target="_blank">
                aboutads.info
              </a>
              . See also how Google uses data when you use our partners&apos; sites:{" "}
              <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer" target="_blank">
                Google partner sites policy
              </a>
              .
            </p>

            <h2>5. How we use information</h2>
            <ul>
              <li>To provide, maintain, and improve Halal Kitchen features</li>
              <li>To respond to support requests and secure the service</li>
              <li>To comply with law and enforce our terms</li>
              <li>To measure performance and plan product improvements</li>
            </ul>

            <h2>6. Sharing</h2>
            <p>
              We may share information with service providers who assist us (hosting, email, analytics,
              advertising networks) under contracts that require appropriate safeguards. We may disclose
              information if required by law or to protect rights, safety, or the integrity of the service.
            </p>

            <h2>7. Data retention</h2>
            <p>
              We keep information only as long as needed for the purposes above, unless a longer period is
              required by law. Account-related data is removed or anonymized when you delete your account
              where technically feasible, subject to backup and legal retention needs.
            </p>

            <h2>8. Children</h2>
            <p>
              Halal Kitchen is not directed at children under 13 (or the minimum age in your jurisdiction).
              We do not knowingly collect personal information from young children. If you believe we have,
              please contact us and we will delete it.
            </p>

            <h2>9. International users</h2>
            <p>
              If you access the site from outside the United States, your information may be processed in
              the U.S. or other countries where we or our providers operate.
            </p>

            <h2>10. Your choices</h2>
            <p>
              Depending on where you live, you may have rights to access, correct, delete, or restrict
              certain personal data, or to object to processing. Contact us to exercise these rights. You may
              also unsubscribe from marketing emails using the link in any message we send.
            </p>

            <h2>11. Changes</h2>
            <p>
              We may update this policy from time to time. We will post the new date at the top of this page.
              Continued use after changes means you accept the updated policy.
            </p>

            <h2>12. Contact</h2>
            <p>
              Questions about privacy: see our{" "}
              <Link to="/contact">Contact</Link> page.
            </p>

            <div className="seo-links policy-back">
              <nav className="seo-nav" aria-label="Related pages">
                <Link to="/">Home</Link>
                <Link to="/terms">Terms of Use</Link>
                <Link to="/contact">Contact</Link>
              </nav>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}

export default PrivacyPolicyPage;
