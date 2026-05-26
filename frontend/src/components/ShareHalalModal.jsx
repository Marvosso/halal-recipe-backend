import React, { useMemo } from "react";
import { buildRecipeShareData } from "../lib/shareCards/buildRecipeShareData";
import ShareResultModal from "./share/ShareResultModal";

/**
 * Recipe conversion share — uses ShareResultModal + RecipeConversionShareCard.
 */
function ShareHalalModal({ isOpen, onClose, recipe = "", converted = "", issues = [], confidence = 0 }) {
  const data = useMemo(
    () =>
      buildRecipeShareData({
        recipe,
        converted,
        issues,
        confidence,
      }),
    [recipe, converted, issues, confidence]
  );

  return (
    <ShareResultModal
      isOpen={isOpen}
      onClose={onClose}
      cardType="recipe"
      data={data}
    />
  );
}

export default ShareHalalModal;
