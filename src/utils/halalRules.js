export const HALAL_RULES = {
  strictness: {
    strict: {
      alcohol: "haram",
      gelatin_unknown: "haram",
      enzymes_unknown: "haram",
      cross_contamination: "haram"
    },
    standard: {
      alcohol: "haram",
      gelatin_unknown: "questionable",
      enzymes_unknown: "questionable",
      cross_contamination: "questionable"
    },
    flexible: {
      alcohol_trace: "questionable",
      gelatin_unknown: "questionable",
      enzymes_unknown: "halal",
      cross_contamination: "halal"
    }
  },

  madhab: {
    hanafi: {
      seafood_shellfish: "haram"
    },
    shafii: {
      seafood_shellfish: "halal"
    },
    maliki: {
      seafood_shellfish: "halal"
    },
    hanbali: {
      seafood_shellfish: "halal"
    }
  }
};
