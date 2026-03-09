# SEO-Friendly Ingredient Page Template

## Overview
Template for creating SEO-optimized ingredient pages targeting "Is [ingredient] halal?" searches.

---

## Page Template Structure

### 1. Metadata Structure

```jsx
// Example metadata for "Is Rice Halal?" page
<Helmet>
  {/* Primary Meta Tags */}
  <title>Is Rice Halal? Complete Guide with Islamic References | Halal Kitchen</title>
  <meta name="description" content="Rice is naturally halal. Learn why rice is halal according to Islamic dietary law, with clear explanations and Quranic references. Get halal cooking guidance." />
  <meta name="keywords" content="is rice halal, rice halal status, halal rice, is rice haram, rice islamic ruling, halal ingredients" />
  
  {/* Open Graph / Facebook */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://halalkitchen.app/is-rice-halal" />
  <meta property="og:title" content="Is Rice Halal? Complete Guide | Halal Kitchen" />
  <meta property="og:description" content="Rice is naturally halal. Learn why with clear Islamic guidance and references." />
  <meta property="og:image" content="https://halalkitchen.app/og-images/is-rice-halal.jpg" />
  
  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://halalkitchen.app/is-rice-halal" />
  <meta name="twitter:title" content="Is Rice Halal? Complete Guide | Halal Kitchen" />
  <meta name="twitter:description" content="Rice is naturally halal. Learn why with clear Islamic guidance." />
  <meta name="twitter:image" content="https://halalkitchen.app/og-images/is-rice-halal.jpg" />
  
  {/* Canonical URL */}
  <link rel="canonical" href="https://halalkitchen.app/is-rice-halal" />
  
  {/* Schema.org Structured Data */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Is Rice Halal? Complete Guide with Islamic References",
      "description": "Rice is naturally halal. Learn why rice is halal according to Islamic dietary law, with clear explanations and Quranic references.",
      "image": "https://halalkitchen.app/og-images/is-rice-halal.jpg",
      "author": {
        "@type": "Organization",
        "name": "Halal Kitchen",
        "url": "https://halalkitchen.app"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Halal Kitchen",
        "logo": {
          "@type": "ImageObject",
          "url": "https://halalkitchen.app/logo.png"
        }
      },
      "datePublished": "2026-01-21",
      "dateModified": "2026-01-21",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://halalkitchen.app/is-rice-halal"
      },
      "articleSection": "Halal Ingredients",
      "keywords": "is rice halal, rice halal status, halal rice, islamic dietary law"
    })}
  </script>
  
  {/* FAQ Schema */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is rice halal?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, rice is naturally halal. Rice is a plant-based ingredient in its natural, unprocessed form, which is generally halal unless specifically prohibited in Islamic law. Plain rice requires no special certification and can be consumed with confidence."
          }
        },
        {
          "@type": "Question",
          "name": "Is all rice halal?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Plain, unprocessed rice is halal. However, processed rice products (like flavored rice mixes or rice dishes with added ingredients) should be checked for haram ingredients such as alcohol, pork, or non-halal additives."
          }
        },
        {
          "@type": "Question",
          "name": "Does rice need halal certification?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Plain rice does not require halal certification as it is a natural, plant-based ingredient. However, processed rice products or rice dishes with added ingredients may benefit from halal certification to ensure all components are halal-compliant."
          }
        }
      ]
    })}
  </script>
</Helmet>
```

---

## Page Content Structure

### 2. H1 Title (Primary Keyword)

```jsx
<h1>Is Rice Halal?</h1>
<p className="subtitle">Complete guide with Islamic references and practical guidance</p>
```

**Best Practices:**
- Use exact search query: "Is [ingredient] halal?"
- Keep H1 as the only H1 on the page
- Add descriptive subtitle for context

---

### 3. Quick Answer Box (Featured Snippet Optimization)

```jsx
<div className="quick-answer-box">
  <div className="answer-header">
    <CheckCircle size={24} color="#0A9D58" />
    <h2>Quick Answer</h2>
  </div>
  <p className="answer-text">
    <strong>Yes, rice is naturally halal.</strong> Rice is a plant-based ingredient in its natural, unprocessed form, which is generally halal unless specifically prohibited in Islamic law. Plain rice requires no special certification and can be consumed with confidence.
  </p>
  <div className="answer-details">
    <span className="badge halal">Halal</span>
    <span className="confidence">High Confidence (95%)</span>
  </div>
</div>
```

**Purpose:** Targets Google's featured snippet (position 0)
**Format:** Direct answer to the question in 40-60 words

---

### 4. Main Content Sections

#### Section 1: Why [Ingredient] is Halal/Haram

```jsx
<section className="content-section">
  <h2>Why Rice is Halal</h2>
  <p>
    Rice is naturally halal because it is a plant-based ingredient in its natural, unprocessed form. 
    According to Islamic dietary law, plant-based foods are generally halal unless specifically 
    prohibited in the Qur'an or authentic Hadith.
  </p>
  
  <div className="explanation-box">
    <h3>Islamic Basis</h3>
    <p>
      The general principle in Islam is that all foods are halal unless explicitly prohibited. 
      Since rice is a natural grain with no prohibited components, it is halal by default.
    </p>
    <p>
      The Qur'an states: "He has only forbidden to you dead animals, blood, the flesh of swine, 
      and that which has been dedicated to other than Allah" (Qur'an 2:173). Rice does not fall 
      into any of these categories.
    </p>
  </div>
</section>
```

**Best Practices:**
- Clear, simple language (avoid excessive religious jargon)
- Include Islamic references (Qur'an, Hadith) but explain in plain terms
- Use structured headings (H2, H3)

---

#### Section 2: When to Be Cautious

```jsx
<section className="content-section">
  <h2>When to Be Cautious with Rice</h2>
  <p>
    While plain rice is halal, processed rice products or rice dishes may contain haram ingredients. 
    Here's what to watch for:
  </p>
  
  <ul className="caution-list">
    <li>
      <strong>Flavored rice mixes:</strong> May contain alcohol-based flavorings or non-halal additives
    </li>
    <li>
      <strong>Rice dishes with meat:</strong> Ensure the meat is halal-certified
    </li>
    <li>
      <strong>Rice with sauces:</strong> Check for alcohol, pork, or non-halal ingredients
    </li>
    <li>
      <strong>Processed rice products:</strong> May contain additives or preservatives that need verification
    </li>
  </ul>
</section>
```

**Purpose:** Address edge cases and build trust through thoroughness

---

#### Section 3: Halal Alternatives (if applicable)

```jsx
<section className="content-section">
  <h2>Halal Rice Alternatives</h2>
  <p>
    If you're looking for rice alternatives for dietary or preference reasons, here are halal options:
  </p>
  
  <div className="alternatives-grid">
    <div className="alternative-card">
      <h3>Quinoa</h3>
      <p>High-protein grain, naturally halal</p>
      <span className="badge halal">Halal</span>
    </div>
    <div className="alternative-card">
      <h3>Couscous</h3>
      <p>Made from semolina, naturally halal</p>
      <span className="badge halal">Halal</span>
    </div>
    <div className="alternative-card">
      <h3>Bulgur</h3>
      <p>Cracked wheat, naturally halal</p>
      <span className="badge halal">Halal</span>
    </div>
  </div>
</section>
```

**Note:** For haram ingredients, this section would show halal substitutes. For halal ingredients, show alternatives for variety.

---

#### Section 4: Islamic Evidence

```jsx
<section className="content-section">
  <h2>Islamic References</h2>
  <p>
    The halal status of rice is based on the general Islamic principle that all foods are halal 
    unless explicitly prohibited. Here are the relevant Islamic sources:
  </p>
  
  <div className="references-box">
    <div className="reference-item">
      <h3>Qur'an 2:173</h3>
      <p>
        "He has only forbidden to you dead animals, blood, the flesh of swine, and that which 
        has been dedicated to other than Allah."
      </p>
      <p className="reference-note">
        This verse establishes that only specific categories are haram. Rice does not fall into 
        any prohibited category.
      </p>
    </div>
    
    <div className="reference-item">
      <h3>General Islamic Principle</h3>
      <p>
        The default ruling in Islam is that all foods are halal unless explicitly prohibited. 
        Since rice is a natural, plant-based food with no prohibition mentioned in the Qur'an 
        or authentic Hadith, it is halal.
      </p>
    </div>
  </div>
</section>
```

**Best Practices:**
- Include actual Qur'anic verses (with context)
- Explain in plain language what the reference means
- Avoid overwhelming with too many references

---

#### Section 5: Frequently Asked Questions

```jsx
<section className="content-section">
  <h2>Frequently Asked Questions</h2>
  
  <div className="faq-accordion">
    <div className="faq-item">
      <h3>Is all rice halal?</h3>
      <p>
        Plain, unprocessed rice is halal. However, processed rice products (like flavored rice 
        mixes or rice dishes with added ingredients) should be checked for haram ingredients 
        such as alcohol, pork, or non-halal additives.
      </p>
    </div>
    
    <div className="faq-item">
      <h3>Does rice need halal certification?</h3>
      <p>
        Plain rice does not require halal certification as it is a natural, plant-based ingredient. 
        However, processed rice products or rice dishes with added ingredients may benefit from 
        halal certification to ensure all components are halal-compliant.
      </p>
    </div>
    
    <div className="faq-item">
      <h3>Is brown rice halal?</h3>
      <p>
        Yes, brown rice is halal. Brown rice is simply rice with the bran layer intact, which 
        is still a natural, plant-based ingredient. The same halal status applies to brown rice 
        as to white rice.
      </p>
    </div>
    
    <div className="faq-item">
      <h3>Is rice vinegar halal?</h3>
      <p>
        Rice vinegar is generally halal. Vinegar is considered halal even if it was originally 
        made from alcohol, as the fermentation process transforms the alcohol into acetic acid. 
        This is supported by authentic Hadith where the Prophet (peace be upon him) approved of 
        vinegar made from wine.
      </p>
    </div>
  </div>
</section>
```

**Purpose:** Targets "People Also Ask" section in Google
**Format:** Direct questions with clear, concise answers

---

### 5. Call-to-Action Sections

```jsx
<section className="cta-section">
  <h2>Check Other Ingredients</h2>
  <p>Use Halal Kitchen to verify the halal status of any ingredient instantly.</p>
  <div className="cta-buttons">
    <button onClick={handleQuickLookup} className="cta-primary">
      Check an Ingredient
    </button>
    <button onClick={handleConvertRecipe} className="cta-secondary">
      Convert a Recipe
    </button>
  </div>
</section>
```

---

## Complete Example: "Is Rice Halal?" Page

```jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, ArrowRight } from 'lucide-react';
import SEOPageLayout from '../components/SEOPageLayout';
import './SEO.css';

function IsRiceHalalPage() {
  const handleQuickLookup = () => {
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'quick-check' }));
    window.dispatchEvent(new CustomEvent('prefillQuickLookup', { detail: 'rice' }));
  };

  const handleConvertRecipe = () => {
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'convert' }));
  };

  return (
    <>
      <Helmet>
        <title>Is Rice Halal? Complete Guide with Islamic References | Halal Kitchen</title>
        <meta 
          name="description" 
          content="Rice is naturally halal. Learn why rice is halal according to Islamic dietary law, with clear explanations and Quranic references. Get halal cooking guidance." 
        />
        <meta 
          name="keywords" 
          content="is rice halal, rice halal status, halal rice, is rice haram, rice islamic ruling, halal ingredients" 
        />
        <link rel="canonical" href="https://halalkitchen.app/is-rice-halal" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://halalkitchen.app/is-rice-halal" />
        <meta property="og:title" content="Is Rice Halal? Complete Guide | Halal Kitchen" />
        <meta property="og:description" content="Rice is naturally halal. Learn why with clear Islamic guidance and references." />
        
        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Is Rice Halal? Complete Guide with Islamic References",
            "description": "Rice is naturally halal. Learn why rice is halal according to Islamic dietary law.",
            "author": {
              "@type": "Organization",
              "name": "Halal Kitchen"
            },
            "datePublished": "2026-01-21",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://halalkitchen.app/is-rice-halal"
            }
          })}
        </script>
        
        {/* FAQ Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is rice halal?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, rice is naturally halal. Rice is a plant-based ingredient in its natural, unprocessed form, which is generally halal unless specifically prohibited in Islamic law."
                }
              },
              {
                "@type": "Question",
                "name": "Is all rice halal?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Plain, unprocessed rice is halal. However, processed rice products should be checked for haram ingredients such as alcohol, pork, or non-halal additives."
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="seo-page-wrapper">
        <nav className="seo-nav">
          <a href="/" className="back-link">
            ← Back to Halal Kitchen
          </a>
        </nav>

        <article className="seo-content">
          {/* H1 Title */}
          <h1>Is Rice Halal?</h1>
          <p className="subtitle">Complete guide with Islamic references and practical guidance</p>

          {/* Quick Answer Box */}
          <div className="quick-answer-box">
            <div className="answer-header">
              <CheckCircle size={24} color="#0A9D58" />
              <h2>Quick Answer</h2>
            </div>
            <p className="answer-text">
              <strong>Yes, rice is naturally halal.</strong> Rice is a plant-based ingredient in 
              its natural, unprocessed form, which is generally halal unless specifically prohibited 
              in Islamic law. Plain rice requires no special certification and can be consumed with confidence.
            </p>
            <div className="answer-details">
              <span className="badge halal">Halal</span>
              <span className="confidence">High Confidence (95%)</span>
            </div>
          </div>

          {/* Why Rice is Halal */}
          <section className="content-section">
            <h2>Why Rice is Halal</h2>
            <p>
              Rice is naturally halal because it is a plant-based ingredient in its natural, 
              unprocessed form. According to Islamic dietary law, plant-based foods are generally 
              halal unless specifically prohibited in the Qur'an or authentic Hadith.
            </p>
            
            <div className="explanation-box">
              <h3>Islamic Basis</h3>
              <p>
                The general principle in Islam is that all foods are halal unless explicitly prohibited. 
                Since rice is a natural grain with no prohibited components, it is halal by default.
              </p>
              <p>
                The Qur'an states: <em>"He has only forbidden to you dead animals, blood, the flesh 
                of swine, and that which has been dedicated to other than Allah"</em> (Qur'an 2:173). 
                Rice does not fall into any of these categories.
              </p>
            </div>
          </section>

          {/* When to Be Cautious */}
          <section className="content-section">
            <h2>When to Be Cautious with Rice</h2>
            <p>
              While plain rice is halal, processed rice products or rice dishes may contain haram 
              ingredients. Here's what to watch for:
            </p>
            
            <ul className="caution-list">
              <li>
                <strong>Flavored rice mixes:</strong> May contain alcohol-based flavorings or 
                non-halal additives
              </li>
              <li>
                <strong>Rice dishes with meat:</strong> Ensure the meat is halal-certified
              </li>
              <li>
                <strong>Rice with sauces:</strong> Check for alcohol, pork, or non-halal ingredients
              </li>
              <li>
                <strong>Processed rice products:</strong> May contain additives or preservatives 
                that need verification
              </li>
            </ul>
          </section>

          {/* Halal Alternatives */}
          <section className="content-section">
            <h2>Rice Alternatives</h2>
            <p>
              If you're looking for rice alternatives for dietary or preference reasons, here are 
              halal options:
            </p>
            
            <div className="alternatives-grid">
              <div className="alternative-card">
                <h3>Quinoa</h3>
                <p>High-protein grain, naturally halal</p>
                <span className="badge halal">Halal</span>
              </div>
              <div className="alternative-card">
                <h3>Couscous</h3>
                <p>Made from semolina, naturally halal</p>
                <span className="badge halal">Halal</span>
              </div>
              <div className="alternative-card">
                <h3>Bulgur</h3>
                <p>Cracked wheat, naturally halal</p>
                <span className="badge halal">Halal</span>
              </div>
            </div>
          </section>

          {/* Islamic Evidence */}
          <section className="content-section">
            <h2>Islamic References</h2>
            <p>
              The halal status of rice is based on the general Islamic principle that all foods 
              are halal unless explicitly prohibited. Here are the relevant Islamic sources:
            </p>
            
            <div className="references-box">
              <div className="reference-item">
                <h3>Qur'an 2:173</h3>
                <p>
                  <em>"He has only forbidden to you dead animals, blood, the flesh of swine, 
                  and that which has been dedicated to other than Allah."</em>
                </p>
                <p className="reference-note">
                  This verse establishes that only specific categories are haram. Rice does not 
                  fall into any prohibited category.
                </p>
              </div>
              
              <div className="reference-item">
                <h3>General Islamic Principle</h3>
                <p>
                  The default ruling in Islam is that all foods are halal unless explicitly prohibited. 
                  Since rice is a natural, plant-based food with no prohibition mentioned in the 
                  Qur'an or authentic Hadith, it is halal.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="content-section">
            <h2>Frequently Asked Questions</h2>
            
            <div className="faq-accordion">
              <div className="faq-item">
                <h3>Is all rice halal?</h3>
                <p>
                  Plain, unprocessed rice is halal. However, processed rice products (like flavored 
                  rice mixes or rice dishes with added ingredients) should be checked for haram 
                  ingredients such as alcohol, pork, or non-halal additives.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>Does rice need halal certification?</h3>
                <p>
                  Plain rice does not require halal certification as it is a natural, plant-based 
                  ingredient. However, processed rice products or rice dishes with added ingredients 
                  may benefit from halal certification to ensure all components are halal-compliant.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>Is brown rice halal?</h3>
                <p>
                  Yes, brown rice is halal. Brown rice is simply rice with the bran layer intact, 
                  which is still a natural, plant-based ingredient. The same halal status applies 
                  to brown rice as to white rice.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>Is rice vinegar halal?</h3>
                <p>
                  Rice vinegar is generally halal. Vinegar is considered halal even if it was 
                  originally made from alcohol, as the fermentation process transforms the alcohol 
                  into acetic acid. This is supported by authentic Hadith where the Prophet 
                  (peace be upon him) approved of vinegar made from wine.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <h2>Check Other Ingredients</h2>
            <p>Use Halal Kitchen to verify the halal status of any ingredient instantly.</p>
            <div className="cta-buttons">
              <button onClick={handleQuickLookup} className="cta-primary">
                Check an Ingredient
              </button>
              <button onClick={handleConvertRecipe} className="cta-secondary">
                Convert a Recipe
              </button>
            </div>
          </section>
        </article>
      </div>
    </>
  );
}

export default IsRiceHalalPage;
```

---

## SEO Best Practices

### 1. Keyword Optimization

**Primary Keyword:** "Is [ingredient] halal?"
- Use in H1, first paragraph, and meta title
- Include in URL: `/is-[ingredient]-halal`

**Secondary Keywords:**
- "[ingredient] halal status"
- "is [ingredient] haram"
- "[ingredient] islamic ruling"
- "halal [ingredient]"

### 2. Content Structure

- **H1:** Exact search query ("Is [ingredient] halal?")
- **H2:** Main sections (Why, When to be cautious, Alternatives, etc.)
- **H3:** Subsections (Islamic Basis, Specific references)
- **Bullet points:** For lists and key information
- **Bold text:** For emphasis on important points

### 3. Featured Snippet Optimization

- **Quick Answer Box:** 40-60 words, direct answer
- **First paragraph:** Answer the question immediately
- **Lists:** Use numbered or bulleted lists for "how to" or "what is" queries
- **Tables:** For comparison content (if applicable)

### 4. Internal Linking

- Link to related ingredient pages
- Link to recipe conversion tool
- Link to quick lookup feature
- Use descriptive anchor text

### 5. External Signals

- **Trust indicators:** Islamic references, scholarly sources
- **User engagement:** Clear CTAs, easy navigation
- **Mobile-friendly:** Responsive design
- **Page speed:** Optimized images, fast loading

---

## Metadata Template

### Title Tag Template

```
Is [Ingredient] Halal? [Benefit] | Halal Kitchen
```

**Examples:**
- "Is Rice Halal? Complete Guide with Islamic References | Halal Kitchen"
- "Is Gelatin Halal? Learn Why and Find Halal Alternatives | Halal Kitchen"
- "Is Bacon Halal? Islamic Ruling and Halal Substitutes | Halal Kitchen"

**Best Practices:**
- 50-60 characters
- Include primary keyword at the start
- Add benefit or differentiator
- Include brand name

---

### Meta Description Template

```
[Ingredient] is [halal/haram/conditional]. [One-sentence explanation]. Learn why with clear Islamic guidance, Quranic references, and practical alternatives. [CTA].
```

**Examples:**
- "Rice is naturally halal. Rice is a plant-based ingredient in its natural form, which is generally halal unless specifically prohibited. Learn why with clear Islamic guidance and references."
- "Gelatin is typically haram. Most gelatin is derived from pork or non-halal animals. Learn why and discover halal alternatives like agar agar with clear Islamic guidance."

**Best Practices:**
- 150-160 characters
- Include primary keyword
- Clear value proposition
- Include CTA or benefit

---

### URL Structure

```
https://halalkitchen.app/is-[ingredient]-halal
```

**Examples:**
- `/is-rice-halal`
- `/is-gelatin-halal`
- `/is-bacon-halal`
- `/is-parmesan-cheese-halal`

**Best Practices:**
- Use hyphens, not underscores
- Keep it short and readable
- Include primary keyword
- Lowercase only

---

## Schema Markup Templates

### Article Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Is [Ingredient] Halal? Complete Guide",
  "description": "[One-sentence description]",
  "image": "https://halalkitchen.app/og-images/is-[ingredient]-halal.jpg",
  "author": {
    "@type": "Organization",
    "name": "Halal Kitchen",
    "url": "https://halalkitchen.app"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Halal Kitchen",
    "logo": {
      "@type": "ImageObject",
      "url": "https://halalkitchen.app/logo.png"
    }
  },
  "datePublished": "2026-01-21",
  "dateModified": "2026-01-21",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://halalkitchen.app/is-[ingredient]-halal"
  }
}
```

### FAQ Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is [ingredient] halal?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Direct answer in 1-2 sentences]"
      }
    },
    {
      "@type": "Question",
      "name": "[Related question]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Direct answer]"
      }
    }
  ]
}
```

### Breadcrumb Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://halalkitchen.app"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Is [Ingredient] Halal?",
      "item": "https://halalkitchen.app/is-[ingredient]-halal"
    }
  ]
}
```

---

## Content Guidelines

### Trust-Focused Writing

**Do:**
- Use clear, simple language
- Explain Islamic concepts in plain terms
- Cite specific references (Qur'an, Hadith)
- Acknowledge when certainty is high vs. conditional
- Provide practical guidance

**Don't:**
- Overwhelm with religious jargon
- Make absolute statements without basis
- Use fear-based language
- Be preachy or judgmental
- Skip explanations

### Tone Examples

**Good:**
> "Rice is naturally halal because it is a plant-based ingredient. According to Islamic dietary law, plant-based foods are generally halal unless specifically prohibited."

**Avoid:**
> "Rice is halal because it is not mentioned in the list of haram foods in the Qur'an, and therefore it is permissible for consumption according to the principles of Islamic jurisprudence."

---

## Page Performance Checklist

- [ ] H1 includes primary keyword
- [ ] Meta title optimized (50-60 chars)
- [ ] Meta description optimized (150-160 chars)
- [ ] URL includes primary keyword
- [ ] Quick answer box (featured snippet)
- [ ] FAQ section with schema markup
- [ ] Internal links to related pages
- [ ] Images optimized and have alt text
- [ ] Mobile-responsive design
- [ ] Fast page load time (<3 seconds)
- [ ] Clear CTAs
- [ ] Canonical URL set
- [ ] Open Graph tags included
- [ ] Twitter Card tags included
- [ ] Schema.org markup (Article, FAQ, Breadcrumb)

---

## Summary

This template provides:

✅ **Complete page structure** for SEO-optimized ingredient pages
✅ **Full example** for "Is Rice Halal?" page
✅ **Metadata templates** (title, description, schema)
✅ **Content guidelines** (trust-focused, accessible language)
✅ **SEO best practices** (keyword optimization, featured snippets)
✅ **Performance checklist** for quality assurance

Ready to scale to any ingredient with consistent, SEO-friendly structure.
