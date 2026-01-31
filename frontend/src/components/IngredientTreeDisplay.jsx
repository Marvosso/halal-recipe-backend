/**
 * Ingredient Tree Display Component
 * Displays nested inheritance chains from ingredients.json
 * Used for visual documentation and understanding ingredient relationships
 */

import React, { useState } from "react";
import { formatInheritanceChain, getChildrenTree } from "../lib/ingredientsDisplay";
import { formatIngredientName } from "../lib/ingredientDisplay";
import "./IngredientTreeDisplay.css";

function IngredientTreeDisplay({ ingredientName, showTree = false }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!ingredientName) return null;
  
  const chain = formatInheritanceChain(ingredientName);
  const tree = getChildrenTree(ingredientName, 3);
  
  // If no chain or tree available, don't display
  if (!chain || chain === ingredientName) {
    return null;
  }
  
  // Render nested tree recursively
  const renderTree = (node, depth = 0) => {
    if (!node || depth > 3) return null;
    
    return (
      <div key={node.name} className={`tree-node depth-${depth}`}>
        <div className="tree-node-header">
          <span className={`tree-node-status status-${node.status}`}>
            {node.status === "haram" ? "❌" : node.status === "questionable" ? "⚠️" : "✅"}
          </span>
          <span className="tree-node-name">{node.name}</span>
        </div>
        {node.alternatives && node.alternatives.length > 0 && (
          <div className="tree-node-alternatives">
            Alternatives: {node.alternatives.map(alt => formatIngredientName(alt)).join(", ")}
          </div>
        )}
        {node.children && node.children.length > 0 && (
          <div className="tree-node-children">
            {node.children.map(child => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="ingredient-tree-display">
      <div className="tree-chain-display">
        <strong>Inheritance Chain:</strong> {chain}
      </div>
      
      {showTree && tree && (
        <details className="tree-details" open={expanded}>
          <summary 
            className="tree-summary"
            onClick={() => setExpanded(!expanded)}
          >
            Show Full Ingredient Tree
          </summary>
          <div className="tree-container">
            {renderTree(tree)}
          </div>
        </details>
      )}
    </div>
  );
}

export default IngredientTreeDisplay;
