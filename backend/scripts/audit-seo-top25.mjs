import { lookupIngredient } from "../src/services/lookupService.js";
import { TOP_25_INGREDIENT_DEFINITIONS } from "../../frontend/src/data/seo/top25Ingredients.js";
import { seoVerdictAlignsWithEngine } from "../../shared/regression/seoTop25.js";

const rows = [];
let drift = 0;

for (const def of TOP_25_INGREDIENT_DEFINITIONS) {
  const api = await lookupIngredient(def.quickLookupIngredient, {
    source: "seo",
    locale: "en",
    useAiExplanation: false,
  });
  const ok = seoVerdictAlignsWithEngine(def.verdict, api.verdict);
  if (!ok) drift += 1;
  rows.push({
    slug: def.slug,
    query: def.quickLookupIngredient,
    seoVerdict: def.verdict,
    engineVerdict: api.verdict,
    ok,
  });
}

for (const r of rows) {
  console.log(
    `${r.ok ? "OK" : "DRIFT"} | ${r.slug.padEnd(16)} | seo=${r.seoVerdict.padEnd(14)} | engine=${r.engineVerdict}`
  );
}
console.log(`\n${rows.length} pages, ${drift} drift(s)`);
process.exit(drift > 0 ? 1 : 0);
