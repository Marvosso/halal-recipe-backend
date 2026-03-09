/**
 * Additive and E-Number Database
 * Contains halal status information for food additives and E-numbers
 * Premium feature for detailed ingredient breakdown
 */

/**
 * Additive Database Structure
 * 
 * Each additive entry contains:
 * - e_number: E-number (e.g., "E120", "E471")
 * - name: Common name
 * - category: Additive category
 * - halal_status: "halal" | "conditional" | "haram" | "questionable"
 * - source: "plant" | "animal" | "synthetic" | "microbial" | "mineral" | "unknown"
 * - explanation: Detailed explanation
 * - simple_explanation: Simplified explanation
 * - requires_verification: boolean
 * - common_in: Array of common food types
 */
export const ADDITIVE_DATABASE = {
  // Haram Additives (Pork/Alcohol Derived)
  "e120": {
    e_number: "E120",
    name: "Cochineal / Carmine",
    category: "Colorant",
    halal_status: "haram",
    source: "animal",
    explanation: "E120 (Cochineal/Carmine) is derived from crushed cochineal insects. While some scholars consider insects halal, most consider E120 haram because it's typically processed with alcohol or non-halal methods. Avoid unless halal-certified.",
    simple_explanation: "E120 is made from insects and often processed with alcohol. It's generally considered haram unless halal-certified.",
    requires_verification: true,
    common_in: ["candy", "yogurt", "beverages", "cosmetics"]
  },
  "e441": {
    e_number: "E441",
    name: "Gelatin",
    category: "Gelling Agent",
    halal_status: "haram",
    source: "animal",
    explanation: "E441 (Gelatin) is typically derived from pork or non-halal animals. Unless specifically halal-certified, gelatin is considered haram. Look for halal-certified gelatin or plant-based alternatives like agar-agar (E406).",
    simple_explanation: "E441 (Gelatin) usually comes from pork or non-halal animals. It's haram unless halal-certified.",
    requires_verification: true,
    common_in: ["marshmallows", "gummy candies", "jellies", "yogurts", "desserts"]
  },
  "e471": {
    e_number: "E471",
    name: "Mono- and Diglycerides",
    category: "Emulsifier",
    halal_status: "conditional",
    source: "unknown",
    explanation: "E471 (Mono- and Diglycerides) can be derived from plant or animal sources. Animal-derived E471 requires halal certification. Check the source or look for halal-certified products.",
    simple_explanation: "E471 can come from plants (halal) or animals (needs halal certification). Check the source.",
    requires_verification: true,
    common_in: ["bread", "margarine", "ice cream", "chocolate"]
  },
  "e472": {
    e_number: "E472",
    name: "Esters of Mono- and Diglycerides",
    category: "Emulsifier",
    halal_status: "conditional",
    source: "unknown",
    explanation: "E472 can be derived from plant or animal sources. Animal-derived E472 requires halal certification. Verify the source.",
    simple_explanation: "E472 can come from plants or animals. Check if it's halal-certified.",
    requires_verification: true,
    common_in: ["baked goods", "dairy products", "margarine"]
  },
  
  // Questionable Additives (Alcohol-Derived)
  "e150": {
    e_number: "E150",
    name: "Caramel Color",
    category: "Colorant",
    halal_status: "conditional",
    source: "synthetic",
    explanation: "E150 (Caramel Color) is generally halal when made from sugar. However, some production methods may use alcohol. Most scholars consider E150 halal, but strict interpretations may require verification.",
    simple_explanation: "E150 is usually halal, but some types may use alcohol in production. Generally considered halal.",
    requires_verification: false,
    common_in: ["cola", "sauces", "baked goods", "beer", "whiskey"]
  },
  "e160a": {
    e_number: "E160a",
    name: "Beta-Carotene",
    category: "Colorant",
    halal_status: "halal",
    source: "plant",
    explanation: "E160a (Beta-Carotene) is derived from plants (carrots, algae) or synthetically produced. It's generally considered halal.",
    simple_explanation: "E160a comes from plants and is halal.",
    requires_verification: false,
    common_in: ["margarine", "cheese", "beverages", "dairy products"]
  },
  
  // Halal Additives
  "e300": {
    e_number: "E300",
    name: "Ascorbic Acid (Vitamin C)",
    category: "Antioxidant",
    halal_status: "halal",
    source: "synthetic",
    explanation: "E300 (Ascorbic Acid) is synthetic Vitamin C and is halal. It's commonly used as an antioxidant in food products.",
    simple_explanation: "E300 is Vitamin C and is halal.",
    requires_verification: false,
    common_in: ["fruit juices", "canned foods", "baked goods"]
  },
  "e406": {
    e_number: "E406",
    name: "Agar-Agar",
    category: "Gelling Agent",
    halal_status: "halal",
    source: "plant",
    explanation: "E406 (Agar-Agar) is derived from seaweed and is halal. It's a plant-based alternative to gelatin.",
    simple_explanation: "E406 comes from seaweed and is halal. It's a plant-based gelatin alternative.",
    requires_verification: false,
    common_in: ["jellies", "desserts", "vegetarian products"]
  },
  "e322": {
    e_number: "E322",
    name: "Lecithin",
    category: "Emulsifier",
    halal_status: "conditional",
    source: "unknown",
    explanation: "E322 (Lecithin) can be derived from soy (halal) or eggs (requires halal certification). Soy lecithin is halal, but egg lecithin needs verification.",
    simple_explanation: "E322 can come from soy (halal) or eggs (needs halal certification).",
    requires_verification: true,
    common_in: ["chocolate", "margarine", "baked goods", "ice cream"]
  },
  "e621": {
    e_number: "E621",
    name: "Monosodium Glutamate (MSG)",
    category: "Flavor Enhancer",
    halal_status: "halal",
    source: "synthetic",
    explanation: "E621 (MSG) is synthetically produced and is halal. It's a flavor enhancer commonly used in processed foods.",
    simple_explanation: "E621 (MSG) is synthetic and halal.",
    requires_verification: false,
    common_in: ["snacks", "soups", "sauces", "processed foods"]
  },
  
  // Rennet and Enzymes
  "rennet": {
    e_number: null,
    name: "Rennet",
    category: "Enzyme",
    halal_status: "conditional",
    source: "animal",
    explanation: "Rennet is used in cheese making and can be animal-derived (requires halal certification) or microbial (generally halal). Check the source or look for halal-certified cheese.",
    simple_explanation: "Rennet can come from animals (needs halal certification) or microbes (halal). Check the source.",
    requires_verification: true,
    common_in: ["cheese", "dairy products"]
  },
  "enzymes": {
    e_number: null,
    name: "Enzymes",
    category: "Enzyme",
    halal_status: "conditional",
    source: "unknown",
    explanation: "Enzymes can be derived from animal, plant, or microbial sources. Animal-derived enzymes require halal certification. Microbial and plant enzymes are generally halal.",
    simple_explanation: "Enzymes can come from animals (needs halal certification), plants, or microbes (halal).",
    requires_verification: true,
    common_in: ["bread", "cheese", "juices", "processed foods"]
  }
};

/**
 * Get additive information by E-number or name
 * @param {string} identifier - E-number (e.g., "E120") or name (e.g., "gelatin")
 * @returns {Object|null} Additive information or null if not found
 */
export function getAdditiveInfo(identifier) {
  const normalized = identifier.toLowerCase().trim();
  
  // Try direct lookup
  if (ADDITIVE_DATABASE[normalized]) {
    return ADDITIVE_DATABASE[normalized];
  }
  
  // Try E-number lookup (e.g., "e120", "E120")
  const eNumberKey = normalized.startsWith('e') ? normalized : `e${normalized.replace(/^e/i, '')}`;
  if (ADDITIVE_DATABASE[eNumberKey]) {
    return ADDITIVE_DATABASE[eNumberKey];
  }
  
  // Try name lookup
  for (const key in ADDITIVE_DATABASE) {
    const additive = ADDITIVE_DATABASE[key];
    if (additive.name.toLowerCase().includes(normalized) || 
        normalized.includes(additive.name.toLowerCase())) {
      return additive;
    }
  }
  
  return null;
}

/**
 * Get all additives by halal status
 * @param {string} status - "halal" | "conditional" | "haram" | "questionable"
 * @returns {Array} Array of additive objects
 */
export function getAdditivesByStatus(status) {
  return Object.values(ADDITIVE_DATABASE).filter(additive => 
    additive.halal_status === status
  );
}

/**
 * Get all haram additives
 * @returns {Array} Array of haram additive objects
 */
export function getHaramAdditives() {
  return getAdditivesByStatus("haram");
}

/**
 * Get all questionable/conditional additives
 * @returns {Array} Array of conditional/questionable additive objects
 */
export function getQuestionableAdditives() {
  return [
    ...getAdditivesByStatus("conditional"),
    ...getAdditivesByStatus("questionable")
  ];
}
