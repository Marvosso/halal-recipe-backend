export const haramIngredients = [
  {
    aliases: ["pork", "pork belly"],
    reason: "Pork is not halal",
    suggestion: "beef or chicken",
    severity: 40
  },
  {
    aliases: ["bacon", "pancetta", "prosciutto"],
    reason: "Pork-based cured meat",
    suggestion: "halal beef bacon or turkey bacon",
    severity: 30
  },
  {
    aliases: ["ham"],
    reason: "Ham is typically pork-based",
    suggestion: "halal turkey or beef slices",
    severity: 30
  },
  {
    aliases: ["lard", "shortening"],
    reason: "Rendered pork fat",
    suggestion: "vegetable oil or halal beef fat",
    severity: 25
  },
  {
    aliases: ["gelatin"],
    reason: "Gelatin is often derived from pork",
    suggestion: "halal beef gelatin or agar-agar",
    severity: 20
  },
  {
    aliases: ["chorizo"],
    reason: "Chorizo is commonly made with pork",
    suggestion: "halal beef chorizo",
    severity: 30
  },
  {
    aliases: ["wine", "beer", "rum", "vodka", "whiskey"],
    reason: "Alcohol is not halal",
    suggestion: "vinegar, broth, or grape juice",
    severity: 50
  }
];
