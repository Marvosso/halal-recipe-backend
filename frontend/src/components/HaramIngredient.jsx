import React from "react";
import "./HaramIngredient.css";

// Helper function to generate simple explanations
const getSimpleExplanation = (name, quranRef, hadithRef) => {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes("pork") || nameLower.includes("bacon")) {
    return "In simple terms: this is made from pork, which is prohibited in Islam.";
  }
  if (nameLower.includes("wine") || nameLower.includes("alcohol")) {
    return "In simple terms: this contains alcohol, which is prohibited in Islam.";
  }
  if (nameLower.includes("gelatin")) {
    return "In simple terms: this might come from pork or non-halal sources, so it's best to avoid it.";
  }
  
  // Generic explanation
  return "In simple terms: this ingredient is not halal (permitted) according to Islamic dietary laws.";
};

function HaramIngredient({ name, quranRef, hadithRef, useSimpleExplanation = false }) {
  // Only show tooltip if at least one reference exists
  const hasReference = quranRef || hadithRef;

  return (
    <span className={`haram-ingredient ${hasReference ? "haram-ingredient-with-tooltip" : ""}`}>
      <strong>{name}</strong>
      {hasReference && (
        <span className="haram-tooltip-content">
          {useSimpleExplanation ? (
            <div className="tooltip-reference">
              <span className="tooltip-text">{getSimpleExplanation(name, quranRef, hadithRef)}</span>
            </div>
          ) : (
            <>
              {quranRef && (
                <div className="tooltip-reference">
                  <span className="tooltip-label">Quran reference:</span>
                  <span className="tooltip-text">{quranRef}</span>
                </div>
              )}
              {hadithRef && (
                <div className="tooltip-reference">
                  <span className="tooltip-label">Hadith reference:</span>
                  <span className="tooltip-text">{hadithRef}</span>
                </div>
              )}
            </>
          )}
        </span>
      )}
    </span>
  );
}

export default HaramIngredient;
