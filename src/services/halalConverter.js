import { haramIngredients } from "./haramIngredients.js";

export function halalConvert(text) {
  let convertedText = text;
  const issues = [];
  let penalty = 0;

  haramIngredients.forEach(rule => {
    rule.aliases.forEach(alias => {
      const regex = new RegExp(`\\b${alias}\\b`, "gi");
      if (regex.test(convertedText)) {
        issues.push({
          ingredient: alias,
          reason: rule.reason,
          suggestion: rule.suggestion,
          severity: rule.severity
        });
        penalty += rule.severity;
        convertedText = convertedText.replace(regex, rule.suggestion);
      }
    });
  });

  let confidenceScore = Math.max(0, 100 - penalty);
  if (issues.length === 0) confidenceScore = 100;

  return { convertedText, issues, confidenceScore };
}
