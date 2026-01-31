import React from "react";
import { Link } from "react-router-dom";
import "./SEOFooter.css";

function SEOFooter() {
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
        </nav>
        <p className="seo-footer-copyright">
          © {new Date().getFullYear()} Halal Kitchen - Making recipes halal-compliant
        </p>
      </div>
    </footer>
  );
}

export default SEOFooter;
