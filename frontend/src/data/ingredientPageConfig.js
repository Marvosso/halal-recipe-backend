/**
 * SEO ingredient page config.
 * Key = URL slug (e.g. "gelatin" -> /is-gelatin-halal).
 * Verdict: use VERDICT from seoVerdicts.js (halal | usually_halal | conditional | usually_haram | haram).
 */

import { VERDICT } from "./seoVerdicts";

const BASE_URL = "https://halalkitchen.app";

export const INGREDIENT_PAGE_CONFIG = {
  gelatin: {
    slug: "gelatin",
    metaTitle: "Is Gelatin Halal? Complete Guide with Halal Alternatives | Halal Kitchen",
    metaDescription: "Is gelatin halal? Learn about the Islamic ruling on gelatin, why it's usually haram, and discover halal alternatives like agar agar. Complete guide with scholarly basis.",
    canonical: `${BASE_URL}/is-gelatin-halal`,
    keywords: "is gelatin halal, gelatin haram, halal gelatin, agar agar, halal alternatives, Islamic dietary laws",
    title: "Is Gelatin Halal?",
    description: "Gelatin is typically haram (forbidden) in Islam because it's usually derived from pork or non-halal animals. However, halal-certified gelatin from halal sources is permissible. Learn about halal alternatives like agar agar.",
    ingredientName: "Gelatin",
    quickLookupIngredient: "gelatin",
    verdict: VERDICT.USUALLY_HARAM,
    rulingSummary: "Gelatin is usually haram unless it's halal-certified. Most commercial gelatin comes from pork or non-halal animals, making it impermissible for many Muslims. Halal-certified or plant-based alternatives are available.",
    lastReviewed: "2025-03-01",
    warnings: [
      "Most marshmallows, gummy candies, and Jell-O contain pork-derived gelatin unless labeled halal or vegan.",
      "Medicinal capsules and some dairy products may use gelatin—check the label or choose halal-certified brands.",
      "When the source is unknown, scholars recommend avoiding gelatin (principle of caution).",
    ],
    whyExplanation: "Gelatin is a protein derived from animal collagen, typically extracted from bones, skin, and connective tissues. Most commercial gelatin comes from pigs or non-halal slaughtered animals. According to widely held Islamic principles, products derived from haram sources are not permissible. Gelatin from halal-certified sources (e.g. halal beef or fish) is considered permissible by many scholars. Views can vary; when in doubt, consult a qualified scholar or choose certified alternatives.",
    scholarlyBasis: [
      "Prohibition of consuming what is derived from haram sources (e.g. Qur'an 2:173).",
      "Emphasis on consuming halal and avoiding doubtful matters (hadith literature).",
      "Principle of transformation (istihalah): some scholars debate whether gelatin undergoes sufficient change; the majority view is that gelatin from pork remains impermissible.",
    ],
    islamicEvidence: [], // kept for backward compat; use scholarlyBasis
    halalAlternatives: [
      { name: "Agar Agar", ratio: "1 tablespoon gelatin -> 2 tablespoons agar agar powder", notes: "Agar agar sets at room temperature and requires boiling to activate. Setting time is typically 30-60 minutes. Creates a firmer texture than gelatin. For softer set, reduce agar agar by 25%." },
      { name: "Halal Beef Gelatin", ratio: "1:1", notes: "Must be certified halal from a trusted source. Works exactly like regular gelatin but derived from halal-slaughtered beef." },
      { name: "Pectin", ratio: "Varies by recipe", notes: "Best for jams and jellies. Derived from fruits, naturally halal. Doesn't work as a direct substitute for all gelatin applications." },
    ],
    relatedIngredients: ["soy-sauce"],
    relatedConversions: [
      { title: "Marshmallow treats", path: "/app" },
      { title: "Panna cotta", path: "/app" },
    ],
    faq: [
      { question: "Is all gelatin haram?", answer: "Not necessarily. Gelatin derived from halal-certified sources (like halal beef or fish) may be permissible. However, most commercial gelatin comes from pork or non-halal sources, making it haram. Always check for halal certification." },
      { question: "Can I use gelatin if I don't know the source?", answer: "Most scholars recommend avoiding gelatin when the source is unknown, as it's likely derived from haram sources. Use halal-certified alternatives or plant-based substitutes like agar agar." },
      { question: "What's the best halal substitute for gelatin?", answer: "Agar agar is the most popular halal substitute. It's derived from seaweed, works similarly to gelatin, and is widely available. Use 2 tablespoons of agar agar powder for every 1 tablespoon of gelatin." },
      { question: "Are marshmallows halal?", answer: "Most marshmallows contain gelatin, which is typically derived from pork. Look for halal-certified marshmallows or vegan marshmallows that use agar agar instead." },
    ],
  },
  "soy-sauce": {
    slug: "soy-sauce",
    metaTitle: "Is Soy Sauce Halal? Guide to Halal Soy Sauce & Alternatives | Halal Kitchen",
    metaDescription: "Is soy sauce halal? Many brands contain alcohol or non-halal ingredients. Learn which soy sauces are halal, what to look for on labels, and halal alternatives like tamari and coconut aminos.",
    canonical: `${BASE_URL}/is-soy-sauce-halal`,
    keywords: "is soy sauce halal, halal soy sauce, soy sauce alcohol, tamari halal, coconut aminos, Islamic dietary",
    title: "Is Soy Sauce Halal?",
    description: "Soy sauce is often conditional in Islam because many brands are fermented with alcohol or contain wheat processed with non-halal enzymes. Halal-certified soy sauce and alcohol-free alternatives are available.",
    ingredientName: "Soy Sauce",
    quickLookupIngredient: "soy sauce",
    verdict: VERDICT.CONDITIONAL,
    rulingSummary: "Soy sauce is typically conditional—permissibility depends on the scholar and the product. Many brands contain alcohol from fermentation; others are halal-certified or alcohol-free and considered permissible.",
    lastReviewed: "2025-03-01",
    warnings: [
      "Traditional soy sauce is fermented and may contain trace alcohol—some scholars permit it, others require alcohol-free or halal-certified brands.",
      "Check the label for 'alcohol,' 'wheat' (if you avoid certain processing), and look for halal certification when in doubt.",
      "Japanese shoyu and Chinese soy sauces vary by brand; always verify or choose certified halal or tamari (often gluten- and alcohol-free).",
    ],
    whyExplanation: "Soy sauce is made from soybeans, wheat, salt, and water, and is fermented. The fermentation process can produce small amounts of alcohol, which is why some scholars consider standard soy sauce makruh (discouraged) or haram. Other scholars hold that the alcohol content is minimal and transformed, making it permissible. To avoid doubt, many Muslims choose halal-certified soy sauce, tamari (which is often alcohol-free), or coconut aminos. Certification bodies such as JAKIM and IFANCA provide halal certification for products that meet their standards.",
    scholarlyBasis: [
      "Prohibition of intoxicants (e.g. Qur'an 5:90); scholars differ on trace alcohol in fermented condiments.",
      "Principle of transformation (istihalah)—some scholars argue fermentation transforms the substance; others require absence of alcohol.",
      "Avoiding doubtful matters is recommended in hadith; when in doubt, choose certified or alcohol-free options.",
    ],
    islamicEvidence: [],
    halalAlternatives: [
      { name: "Halal-certified soy sauce", ratio: "1:1", notes: "Look for brands with JAKIM, IFANCA, or other recognized halal certification on the label." },
      { name: "Tamari (gluten-free soy sauce)", ratio: "1:1", notes: "Often made without wheat and with little or no alcohol. Check label for halal or alcohol-free." },
      { name: "Coconut aminos", ratio: "1:1", notes: "Alcohol-free, gluten-free, and naturally halal. Slightly sweeter than soy sauce; works in most recipes." },
    ],
    relatedIngredients: ["gelatin"],
    relatedConversions: [{ title: "Stir-fry and marinades", path: "/app" }],
    faq: [
      { question: "Is Kikkoman soy sauce halal?", answer: "Kikkoman produces some halal-certified products in certain regions. Check the bottle for halal certification; standard Kikkoman may contain alcohol from fermentation." },
      { question: "Does soy sauce contain alcohol?", answer: "Traditional fermented soy sauce can contain trace amounts of alcohol (often under 2%). Halal-certified or alcohol-free soy sauces are available." },
      { question: "What is the best halal substitute for soy sauce?", answer: "Tamari (if alcohol-free) and coconut aminos are popular halal-friendly alternatives. Halal-certified soy sauce is a direct substitute." },
      { question: "Is light vs dark soy sauce different for halal?", answer: "Both can be halal or not depending on the brand and production. Check for halal certification or alcohol-free labeling on any variety." },
    ],
  },
};

/**
 * Get config for a URL slug (e.g. "gelatin", "soy-sauce").
 * @param {string} slug
 * @returns {Object|undefined}
 */
export function getIngredientPageBySlug(slug) {
  if (!slug || typeof slug !== "string") return undefined;
  const normalized = slug.trim().toLowerCase();
  return INGREDIENT_PAGE_CONFIG[normalized];
}

/**
 * All slugs for routing and sitemaps.
 * @returns {string[]}
 */
export function getIngredientPageSlugs() {
  return Object.keys(INGREDIENT_PAGE_CONFIG);
}
