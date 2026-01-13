import React, { useState, useEffect } from "react";
import "./App.css";
import { getAxiosInstance } from "./api/axiosConfig";
import halalArabicImage from "./assets/halal-arabic.png";
import halalInputIcon from "./assets/halal-input.png";
import halalOutputIcon from "./assets/halal-output.png";
import halalSavedIcon from "./assets/halal-saved.png";
import { RefreshCw, ClipboardCopy, Download, Bookmark, Star } from "lucide-react";
import HaramIngredient from "./components/HaramIngredient";

function App() {
  const [recipe, setRecipe] = useState("");
  const [converted, setConverted] = useState("");
  const [issues, setIssues] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState("");
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [openIngredientCards, setOpenIngredientCards] = useState(new Set());
  const [openReferences, setOpenReferences] = useState(new Set());
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [publicRecipes, setPublicRecipes] = useState([]);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  
  // Form state for recipe submission
  const [formData, setFormData] = useState({
    title: "",
    ingredients: "",
    instructions: "",
    notes: "",
    isPublic: false,
  });
  const [showForm, setShowForm] = useState(false);

  // Load saved recipes from localStorage on mount
  useEffect(() => {
    try {
      if (typeof Storage !== "undefined") {
        const saved = localStorage.getItem("halalRecipes");
        const publicRecipesData = localStorage.getItem("halalPublicRecipes");
        
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setSavedRecipes(parsed);
          }
        }
        
        if (publicRecipesData) {
          const parsed = JSON.parse(publicRecipesData);
          if (Array.isArray(parsed)) {
            setPublicRecipes(parsed);
          }
        }
      }
    } catch (err) {
      console.error("Error loading saved recipes:", err);
    }
  }, []);

  // Handle mobile tap to show/hide tooltips
  useEffect(() => {
    if (converted) {
      const recipePre = document.querySelector(".recipe-card pre");
      if (recipePre) {
        const handleTouchStart = (e) => {
          const target = e.target;
          if (target.classList.contains("haram-tooltip")) {
            // Toggle tooltip on mobile tap
            target.classList.toggle("tooltip-active");
            // Close other tooltips
            document.querySelectorAll(".haram-tooltip.tooltip-active").forEach((el) => {
              if (el !== target) {
                el.classList.remove("tooltip-active");
              }
            });
          }
        };

        const handleClickOutside = (e) => {
          if (!e.target.closest(".haram-tooltip")) {
            document.querySelectorAll(".haram-tooltip.tooltip-active").forEach((el) => {
              el.classList.remove("tooltip-active");
            });
          }
        };

        recipePre.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("click", handleClickOutside);

        return () => {
          recipePre.removeEventListener("touchstart", handleTouchStart);
          document.removeEventListener("click", handleClickOutside);
        };
      }
    }
  }, [converted]);

  const handleConvert = async (recipeText = null, isAutoConvert = false) => {
    // Determine which recipe text to use
    // If recipeText is provided (from saved recipe), use it
    // Otherwise, use the current recipe state
    const recipeToConvert = recipeText !== null && recipeText !== undefined 
      ? recipeText 
      : recipe;
    
    // Defensive validation - only alert if truly empty and manual conversion
    if (recipeToConvert === null || recipeToConvert === undefined) {
      if (!isAutoConvert) {
        alert("Please enter a recipe to convert.");
      }
      return;
    }

    // Convert to string if not already
    const recipeString = typeof recipeToConvert === "string" 
      ? recipeToConvert 
      : String(recipeToConvert || "");

    // Trim and check if empty
    const trimmedRecipe = recipeString.trim();
    
    if (trimmedRecipe === "") {
      if (!isAutoConvert) {
        alert("Please enter a recipe to convert.");
      }
      return;
    }

    // Clear any previous errors
    setError("");
    
    try {
      const api = await getAxiosInstance();
      const res = await api.post("/convert", { recipe: trimmedRecipe });
      
      // Check if the response contains an error
      if (res.data?.error) {
        setError(res.data.error);
        setConverted("");
        setIssues([]);
        setConfidence(0);
        setIsAccordionOpen(false);
        setOpenIngredientCards(new Set());
        return;
      }
      
      // Update state with response data
      setConverted(res.data?.convertedText || "");
      setIssues(Array.isArray(res.data?.issues) ? res.data.issues : []);
      setConfidence(typeof res.data?.confidenceScore === "number" ? res.data.confidenceScore : 0);
      
      // Reset accordion state when new conversion happens
      setIsAccordionOpen(false);
      setOpenIngredientCards(new Set());
      
      // Only reset viewingRecipe if this is a manual conversion
      if (!isAutoConvert) {
        setViewingRecipe(null);
      }
    } catch (err) {
      console.error("Conversion error:", err);
      
      // Determine error message based on error type
      let errorMessage = "Conversion failed. Please try again later.";
      
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // Request was made but no response received (network error)
        errorMessage = "Network error. Please check your connection and ensure the backend server is running.";
      } else if (err.message) {
        // Something else happened
        errorMessage = err.message;
      }
      
      // Set error state and clear converted recipe
      setError(errorMessage);
      setConverted("");
      setIssues([]);
      setConfidence(0);
      setIsAccordionOpen(false);
      setOpenIngredientCards(new Set());
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

  const saveRecipe = () => {
    const originalText = recipe || "";
    const convertedText = converted || "";
    
    if (!originalText || !convertedText) {
      alert("No recipe to save. Please convert a recipe first.");
      return;
    }

    try {
      if (typeof Storage !== "undefined") {
        const newRecipe = {
          id: Date.now().toString(),
          original: originalText,
          converted: convertedText,
          savedAt: new Date().toISOString(),
          isPublic: false,
        };

        const updated = [...savedRecipes, newRecipe];
        setSavedRecipes(updated);
        localStorage.setItem("halalRecipes", JSON.stringify(updated));
        alert("Recipe saved successfully!");
      } else {
        alert("LocalStorage is not available in your browser.");
      }
    } catch (err) {
      console.error("Error saving recipe:", err);
      alert("Error saving recipe. Please try again.");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    const { title, ingredients, instructions, notes, isPublic } = formData;
    
    if (!title || !ingredients || !instructions) {
      alert("Please fill in at least title, ingredients, and instructions.");
      return;
    }

    try {
      if (typeof Storage !== "undefined") {
        const newRecipe = {
          id: Date.now().toString(),
          title: title.trim(),
          ingredients: ingredients.trim(),
          instructions: instructions.trim(),
          notes: notes.trim() || "",
          savedAt: new Date().toISOString(),
          isPublic: isPublic || false,
        };

        if (isPublic) {
          const updated = [...publicRecipes, newRecipe];
          setPublicRecipes(updated);
          localStorage.setItem("halalPublicRecipes", JSON.stringify(updated));
        } else {
          const updated = [...savedRecipes, newRecipe];
          setSavedRecipes(updated);
          localStorage.setItem("halalRecipes", JSON.stringify(updated));
        }

        // Reset form
        setFormData({
          title: "",
          ingredients: "",
          instructions: "",
          notes: "",
          isPublic: false,
        });
        setShowForm(false);
        alert(`Recipe ${isPublic ? "published" : "saved"} successfully!`);
      } else {
        alert("LocalStorage is not available in your browser.");
      }
    } catch (err) {
      console.error("Error submitting recipe:", err);
      alert("Error submitting recipe. Please try again.");
    }
  };

  const loadSavedRecipe = async (savedRecipe) => {
    // Defensive checks
    if (!savedRecipe || typeof savedRecipe !== "object") {
      alert("Invalid recipe data.");
      return;
    }

    let recipeText = "";

    // Handle both old format (original/converted) and new format (title/ingredients/instructions)
    if (savedRecipe.original && typeof savedRecipe.original === "string") {
      // Old format: use original text for conversion
      recipeText = savedRecipe.original.trim();
    } else if (
      savedRecipe.ingredients &&
      typeof savedRecipe.ingredients === "string" &&
      savedRecipe.instructions &&
      typeof savedRecipe.instructions === "string"
    ) {
      // New format: combine into recipe text
      const title = savedRecipe.title && typeof savedRecipe.title === "string" 
        ? savedRecipe.title.trim() 
        : "";
      const ingredients = savedRecipe.ingredients.trim();
      const instructions = savedRecipe.instructions.trim();
      const notes = savedRecipe.notes && typeof savedRecipe.notes === "string"
        ? savedRecipe.notes.trim()
        : "";
      
      recipeText = `${title ? `${title}\n\n` : ""}Ingredients:\n${ingredients}\n\nInstructions:\n${instructions}${notes ? `\n\nNotes:\n${notes}` : ""}`;
    } else {
      alert("Invalid recipe format. Recipe data is missing required fields.");
      return;
    }

    // Validate that we have recipe text
    if (!recipeText || recipeText.trim() === "") {
      alert("Recipe text is empty. Cannot load recipe.");
      return;
    }

    // Set recipe state first to update the input field
    setRecipe(recipeText);

    // Set viewing recipe ID
    setViewingRecipe(savedRecipe.id || null);
    
    // Automatically trigger conversion with the recipe text
    // Pass isAutoConvert=true to prevent alert from showing
    await handleConvert(recipeText, true);
    
    // Scroll to top to show the loaded recipe
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSavedRecipe = (id, isPublic = false) => {
    if (!id) return;

    try {
      if (typeof Storage !== "undefined") {
        if (isPublic) {
          const updated = publicRecipes.filter((r) => r?.id !== id);
          setPublicRecipes(updated);
          localStorage.setItem("halalPublicRecipes", JSON.stringify(updated));
        } else {
          const updated = savedRecipes.filter((r) => r?.id !== id);
          setSavedRecipes(updated);
          localStorage.setItem("halalRecipes", JSON.stringify(updated));
        }
        
        // If viewing the deleted recipe, clear the view
        if (viewingRecipe === id) {
          setViewingRecipe(null);
          setRecipe("");
          setConverted("");
          setIssues([]);
          setConfidence(0);
        }
      }
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Error deleting recipe. Please try again.");
    }
  };

  const highlightHaram = (text) => {
    if (!text || typeof text !== "string") {
      return [text];
    }
    if (!Array.isArray(issues) || issues.length === 0) {
      return [text];
    }

    // Create a map of haram ingredients (case insensitive)
    const haramList = new Map();
    issues.forEach((issue) => {
      const ingredient = issue?.ingredient;
      if (ingredient && typeof ingredient === "string") {
        const key = ingredient.toLowerCase();
        haramList.set(key, {
          name: ingredient,
          quranRef: issue?.quranReference || "",
          hadithRef: issue?.hadithReference || "",
        });
      }
    });

    // Process text word by word using regex to find word boundaries
    const elements = [];
    let lastIndex = 0;
    let keyIndex = 0;

    // Create a regex pattern for all haram ingredients
    const haramPatterns = Array.from(haramList.keys()).map(key => 
      key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    
    if (haramPatterns.length === 0) {
      return [text];
    }

    // Match all haram ingredients with word boundaries
    const regex = new RegExp(`\\b(${haramPatterns.join('|')})\\b`, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }

      // Add the haram ingredient component
      const matchedWord = match[0].toLowerCase();
      const haramData = haramList.get(matchedWord);
      if (haramData) {
        elements.push(
          <HaramIngredient
            key={`haram-${keyIndex++}-${match.index}`}
            name={haramData.name}
            quranRef={haramData.quranRef}
            hadithRef={haramData.hadithRef}
          />
        );
      } else {
        // Fallback: add as text if data not found
        elements.push(match[0]);
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    // If no matches found, return original text
    if (elements.length === 0) {
      return [text];
    }

    return elements;
  };

  const toggleAccordion = () => {
    setIsAccordionOpen((prev) => !prev);
  };

  const toggleIngredientCard = (ingredientName) => {
    setOpenIngredientCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientName)) {
        newSet.delete(ingredientName);
      } else {
        newSet.add(ingredientName);
      }
      return newSet;
    });
  };

  const toggleReferences = (ingredientName) => {
    setOpenReferences((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientName)) {
        newSet.delete(ingredientName);
      } else {
        newSet.add(ingredientName);
      }
      return newSet;
    });
  };

  const safeConverted = typeof converted === "string" ? converted : "";
  const safeConfidence = typeof confidence === "number" && !isNaN(confidence) ? confidence : 0;
  const safeIssues = Array.isArray(issues) ? issues : [];
  const safeSavedRecipes = Array.isArray(savedRecipes) ? savedRecipes : [];
  const safePublicRecipes = Array.isArray(publicRecipes) ? publicRecipes : [];

  const renderRecipeCard = (recipeItem, isPublic = false) => {
    if (!recipeItem || !recipeItem.id) return null;
    
    const savedDate = recipeItem.savedAt 
      ? new Date(recipeItem.savedAt).toLocaleDateString()
      : "Unknown date";
    
    // Handle both old and new formats
    let title = recipeItem.title || "Untitled Recipe";
    let preview = "";
    
    if (recipeItem.converted && typeof recipeItem.converted === "string") {
      // Old format
      preview = recipeItem.converted.length > 100 
        ? recipeItem.converted.substring(0, 100) + "..." 
        : recipeItem.converted;
    } else if (recipeItem.ingredients && typeof recipeItem.ingredients === "string") {
      // New format
      preview = recipeItem.ingredients.length > 100 
        ? recipeItem.ingredients.substring(0, 100) + "..." 
        : recipeItem.ingredients;
    } else {
      preview = "No preview available";
    }

    return (
      <div 
        key={recipeItem.id} 
        className={`saved-recipe-item ${viewingRecipe === recipeItem.id ? "active" : ""}`}
      >
        <div 
          className="saved-recipe-content"
          onClick={() => loadSavedRecipe(recipeItem)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              loadSavedRecipe(recipeItem);
            }
          }}
        >
          <div className="saved-recipe-preview">
            <strong>{title}</strong>
            <span className="recipe-date">{savedDate}</span>
            <p>{preview}</p>
          </div>
        </div>
        <button
          className="delete-recipe-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Are you sure you want to delete this recipe?")) {
              deleteSavedRecipe(recipeItem.id, isPublic);
            }
          }}
          aria-label="Delete recipe"
        >
          Delete
        </button>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="header-section">
        <img src={halalArabicImage} alt="Halal" className="halal-arabic" />
        <h1>Halal Kitchen</h1>
      </div>

      <div className="form-toggle-section">
        <button 
          className="toggle-form-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hide Recipe Form" : "Submit New Recipe"}
        </button>
      </div>

      {showForm && (
        <div className="recipe-form-section">
          <h2>Submit Recipe</h2>
          <form onSubmit={handleFormSubmit} className="recipe-form">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
                placeholder="Enter recipe title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ingredients">Ingredients *</label>
              <textarea
                id="ingredients"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleFormChange}
                required
                placeholder="List ingredients (one per line or comma-separated)"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="instructions">Instructions *</label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleFormChange}
                required
                placeholder="Enter step-by-step instructions"
                rows="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Additional notes or tips"
                rows="3"
              />
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="isPublic" className="checkbox-label">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleFormChange}
                />
                <span>Make this recipe public</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {formData.isPublic ? "Publish Recipe" : "Save Recipe"}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    title: "",
                    ingredients: "",
                    instructions: "",
                    notes: "",
                    isPublic: false,
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="input-section">
        <label htmlFor="recipe-input" className="input-label">
          <img src={halalInputIcon} alt="Recipe Input" className="section-icon" />
          <span>Recipe Input</span>
        </label>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        <textarea
          id="recipe-input"
          placeholder="Paste your recipe here..."
          value={recipe || ""}
          onChange={(e) => {
            const newValue = e.target?.value || "";
            setRecipe(newValue);
            // Clear error when user starts typing
            if (error) {
              setError("");
            }
          }}
        />
      </div>

      <button onClick={() => handleConvert()} className="convert-btn" aria-label="Convert recipe">
        <RefreshCw className="button-icon-inline" aria-hidden="true" />
        <span>Convert</span>
      </button>

      {safeConverted && (
        <div className="results fade-in">
          <div className="recipe-card">
            <h2>
              <img src={halalOutputIcon} alt="Converted Recipe" className="section-icon" />
              <span>Converted Recipe</span>
            </h2>
            <pre className="recipe-output">
              {highlightHaram(safeConverted)}
            </pre>
            <div className="recipe-actions">
              <button onClick={copyToClipboard} aria-label="Copy to clipboard">
                <ClipboardCopy className="button-icon-inline" aria-hidden="true" />
                <span>Copy</span>
              </button>
              <button onClick={downloadRecipe} aria-label="Download recipe">
                <Download className="button-icon-inline" aria-hidden="true" />
                <span>Download</span>
              </button>
              <button onClick={saveRecipe} aria-label="Save recipe">
                <Bookmark className="button-icon-inline" aria-hidden="true" />
                <span>Save Recipe</span>
              </button>
            </div>
          </div>

          <div className="confidence-section">
            <h3>Confidence Score: {safeConfidence}%</h3>
            <div className="confidence-progress">
              <div 
                className="confidence-bar" 
                style={{ width: `${safeConfidence}%` }}
              ></div>
            </div>
          </div>

          <div className="issues-section">
            <div 
              className="accordion-header" 
              onClick={toggleAccordion}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleAccordion();
                }
              }}
            >
              <h2>Why were ingredients changed?</h2>
              <span className="accordion-icon">
                {isAccordionOpen ? "−" : "+"}
              </span>
            </div>
            
            {isAccordionOpen && (
              <div className="accordion-content">
                {safeIssues.length > 0 ? (
                  <div className="ingredient-cards">
                    {safeIssues.map((issue, idx) => {
                      const ingredientName = issue?.ingredient || `ingredient-${idx}`;
                      const isOpen = openIngredientCards.has(ingredientName);
                      
                      return (
                        <div key={idx} className="ingredient-card">
                          <div 
                            className="ingredient-card-header"
                            onClick={() => toggleIngredientCard(ingredientName)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleIngredientCard(ingredientName);
                              }
                            }}
                          >
                            <div className="ingredient-card-title">
                              <strong>{issue?.ingredient || "—"}</strong>
                              <span className="ingredient-replacement-preview">
                                → {issue?.replacement || "—"}
                              </span>
                            </div>
                            <span className="ingredient-card-icon">
                              {isOpen ? "−" : "+"}
                            </span>
                          </div>
                          
                          {isOpen && (
                            <div className="ingredient-card-content">
                              <div className="ingredient-detail-row">
                                <span className="detail-label">Original:</span>
                                <span className="detail-value">{issue?.ingredient || "—"}</span>
                              </div>
                              <div className="ingredient-detail-row">
                                <span className="detail-label">Halal Replacement:</span>
                                <span className="detail-value">{issue?.replacement || "—"}</span>
                              </div>
                              {(issue?.quranReference || issue?.hadithReference) && (
                                <div className="references-accordion">
                                  <div 
                                    className="references-accordion-header"
                                    onClick={() => toggleReferences(ingredientName)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleReferences(ingredientName);
                                      }
                                    }}
                                  >
                                    <span className="references-accordion-title">Quranic & Hadith References</span>
                                    <span className="references-accordion-icon">
                                      {openReferences.has(ingredientName) ? "−" : "+"}
                                    </span>
                                  </div>
                                  {openReferences.has(ingredientName) && (
                                    <div className="references-accordion-content">
                                      {issue?.quranReference && (
                                        <div className="reference-item">
                                          <span className="reference-label">Qur'an Reference:</span>
                                          <span className="reference-value quran-text">{issue.quranReference}</span>
                                        </div>
                                      )}
                                      {issue?.hadithReference && (
                                        <div className="reference-item">
                                          <span className="reference-label">Hadith Reference:</span>
                                          <span className="reference-value hadith-text">{issue.hadithReference}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {issue?.flavor && (
                                <div className="ingredient-detail-row">
                                  <span className="detail-label">Flavor Note:</span>
                                  <span className="detail-value">{issue.flavor || "—"}</span>
                                </div>
                              )}
                              {issue?.notes && (
                                <div className="ingredient-detail-row">
                                  <span className="detail-label">Additional Notes:</span>
                                  <span className="detail-value">{issue.notes || "—"}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-issues-message">
                    No haram ingredients were detected in this recipe. All ingredients are halal-compliant!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {safePublicRecipes.length > 0 && (
        <div className="public-recipes-section">
          <h2>
            <Star className="section-icon-inline" aria-hidden="true" />
            <span>Public Recipes</span>
          </h2>
          <div className="saved-recipes-list">
            {safePublicRecipes.map((recipeItem) => renderRecipeCard(recipeItem, true))}
          </div>
        </div>
      )}

      {safeSavedRecipes.length > 0 && (
        <div className="saved-recipes-section">
          <h2>
            <Star className="section-icon-inline" aria-hidden="true" />
            <span>Saved Recipes</span>
          </h2>
          <div className="saved-recipes-list">
            {safeSavedRecipes.map((recipeItem) => renderRecipeCard(recipeItem, false))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
