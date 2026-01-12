import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [recipe, setRecipe] = useState("");
  const [converted, setConverted] = useState("");
  const [issues, setIssues] = useState([]);
  const [confidence, setConfidence] = useState(0);

  const handleConvert = async () => {
    try {
      const res = await axios.post("http://localhost:3000/convert", { recipe });
      setConverted(res.data?.convertedText || "");
      setIssues(Array.isArray(res.data?.issues) ? res.data.issues : []);
      setConfidence(typeof res.data?.confidenceScore === "number" ? res.data.confidenceScore : 0);
    } catch (err) {
      console.error("Conversion error:", err);
      alert("Error converting recipe. Is the backend running?");
      // Reset state on error to prevent stale data
      setConverted("");
      setIssues([]);
      setConfidence(0);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = converted || "";
    if (!textToCopy) {
      alert("No converted recipe to copy.");
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    alert("Converted recipe copied to clipboard!");
  };

  const downloadRecipe = () => {
    const textToDownload = converted || "";
    if (!textToDownload) {
      alert("No converted recipe to download.");
      return;
    }
    const blob = new Blob([textToDownload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted_recipe.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const highlightHaram = (text) => {
    if (!text || typeof text !== "string") {
      return "";
    }
    if (!Array.isArray(issues) || issues.length === 0) {
      return text;
    }
    let highlighted = text;
    issues.forEach((issue) => {
      const ingredient = issue?.ingredient;
      if (ingredient && typeof ingredient === "string") {
        try {
          const regex = new RegExp(`\\b${ingredient}\\b`, "gi");
          highlighted = highlighted.replace(
            regex,
            (match) => `<span class="haram">${match}</span>`
          );
        } catch (err) {
          // If regex fails, skip this ingredient
          console.warn("Failed to create regex for ingredient:", ingredient);
        }
      }
    });
    return highlighted;
  };

  const safeConverted = typeof converted === "string" ? converted : "";
  const safeConfidence = typeof confidence === "number" && !isNaN(confidence) ? confidence : 0;
  const safeIssues = Array.isArray(issues) ? issues : [];

  return (
    <div className="app">
      <h1>Halal Recipe Converter</h1>

      <textarea
        placeholder="Paste your recipe here..."
        value={recipe || ""}
        onChange={(e) => setRecipe(e.target?.value || "")}
      />

      <button onClick={handleConvert}>Convert</button>

      {safeConverted && (
        <div className="results">
          <div className="recipe-card">
            <h2>Converted Recipe</h2>
            <pre
              dangerouslySetInnerHTML={{ __html: highlightHaram(safeConverted) }}
            ></pre>
            <div className="recipe-actions">
              <button onClick={copyToClipboard}>Copy to Clipboard</button>
              <button onClick={downloadRecipe}>Download Recipe</button>
            </div>
          </div>

          <div className="confidence-section">
            <h3>Confidence Score: {safeConfidence}%</h3>
          </div>

          {safeIssues.length > 0 && (
            <div className="issues-section">
              <h2>Detected Haram Ingredients & Suggested Replacements</h2>
              <table>
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Replacement</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {safeIssues.map((issue, idx) => (
                    <tr key={idx}>
                      <td>{issue?.ingredient || "—"}</td>
                      <td>{issue?.replacement || "—"}</td>
                      <td>{issue?.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
