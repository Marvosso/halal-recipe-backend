import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./SEO.css";

/** Public contact for users and program reviews (e.g. AdSense). Update if you use a different inbox. */
const CONTACT_EMAIL = "marvinhodge86@gmail.com";

function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact Us | Halal Kitchen</title>
        <meta
          name="description"
          content="Contact Halal Kitchen for feedback, support, privacy questions, or partnership inquiries."
        />
        <link rel="canonical" href="https://halalkitchen.app/contact" />
      </Helmet>

      <main className="seo-page">
        <header className="seo-header">
          <h1>Contact Halal Kitchen</h1>
          <p className="seo-subtitle">
            We read feedback about the recipe converter, ingredient tools, privacy, and partnerships.
          </p>
        </header>

        <section className="seo-content">
          <article>
            <h2>Email</h2>
            <p>
              For general questions, corrections to ingredient information, or privacy requests, reach us
              at:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <p>
              Please allow several business days for a reply. We cannot provide individual religious rulings
              by email; for complex cases, consult a qualified scholar in your community.
            </p>

            <h2>What to include</h2>
            <ul>
              <li>A clear subject line (e.g. &quot;Bug: conversion error&quot; or &quot;Privacy request&quot;)</li>
              <li>The page or feature (e.g. Convert tab, Quick Lookup, scan)</li>
              <li>Browser and device type if reporting a technical issue</li>
            </ul>

            <h2>Abuse and security</h2>
            <p>
              To report security issues or abuse of the service, use the same email with &quot;Security&quot; in the
              subject line.
            </p>

            <div className="seo-links">
              <nav className="seo-nav" aria-label="Related pages">
                <Link to="/">Home</Link>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Use</Link>
                <Link to="/about">About</Link>
              </nav>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}

export default ContactPage;
