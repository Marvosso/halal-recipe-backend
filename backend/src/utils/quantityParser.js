// Parses each ingredient line into quantity, unit, ingredient
export function parseIngredientLine(line) {
  const regex =
    /(\d+(\.\d+)?)\s*(g|kg|oz|lb|tsp|tbsp|cup)?\s+(.*)/i;

  const match = line.match(regex);

  if (!match) return null;

  return {
    quantity: parseFloat(match[1]),
    unit: match[3] || "",
    ingredient: match[4].toLowerCase().trim()
  };
}
