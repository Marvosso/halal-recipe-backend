/**
 * Convert flat halal_knowledge.json to nested ingredients.json with children structure
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../src/data/halal_knowledge.json');
const outputPath = path.join(__dirname, '../src/data/ingredients.json');

console.log('Reading halal_knowledge.json...');
const flatKnowledge = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

/**
 * Build nested structure from flat inheritance array
 */
function buildNestedStructure() {
  const nested = [];
  const processed = new Set();
  const ingredientMap = new Map();
  
  // First pass: create all entries as flat objects
  Object.entries(flatKnowledge).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().trim();
    if (!processed.has(normalizedKey)) {
      ingredientMap.set(normalizedKey, {
        name: key.replace(/_/g, " "),
        status: value.status === "haram" ? "haram" : 
                value.status === "conditional" || value.status === "questionable" ? "questionable" : "halal",
        halal_alternatives: value.alternatives || [],
        flavor_role: value.flavor_role || "",
        cuisine: value.cuisine || "",
        notes: value.notes || "",
        school_of_thought: ["Hanafi", "Shafi'i", "Maliki", "Hanbali"], // All by default
        quranic_reference: value.references?.find(r => r.toLowerCase().includes("qur'an") || r.toLowerCase().includes("quran")) || "",
        hadith_reference: value.references?.find(r => r.toLowerCase().includes("hadith") || r.toLowerCase().includes("bukhari") || r.toLowerCase().includes("muslim")) || "",
        children: [],
        _inheritance: value.inheritance || [], // Keep for building
        _key: normalizedKey
      });
      processed.add(normalizedKey);
    }
  });
  
  // Second pass: build children relationships
  const rootIngredients = [];
  
  ingredientMap.forEach((ingredient, key) => {
    if (ingredient._inheritance && ingredient._inheritance.length > 0) {
      // Has parents - will be added as child
      ingredient._isChild = true;
    } else {
      // No parents - is a root ingredient
      rootIngredients.push(ingredient);
    }
  });
  
  // Third pass: recursively build children
  function addChildren(parent, parentKey) {
    ingredientMap.forEach((ingredient, key) => {
      if (ingredient._isChild && ingredient._inheritance.includes(parentKey)) {
        // This ingredient inherits from parent
        const childCopy = { ...ingredient };
        delete childCopy._inheritance;
        delete childCopy._key;
        delete childCopy._isChild;
        
        // Recursively add its children
        addChildren(childCopy, key);
        
        parent.children.push(childCopy);
      }
    });
  }
  
  // Build tree starting from roots
  rootIngredients.forEach(root => {
    const rootKey = root._key;
    delete root._inheritance;
    delete root._key;
    delete root._isChild;
    addChildren(root, rootKey);
  });
  
  return rootIngredients;
}

console.log('Building nested structure...');
const nestedIngredients = buildNestedStructure();

// Sort by status (haram first, then questionable, then halal)
nestedIngredients.sort((a, b) => {
  const statusOrder = { haram: 0, questionable: 1, halal: 2 };
  return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
});

// Convert to object format for easier lookup
const ingredientsObject = {};
nestedIngredients.forEach(ing => {
  ingredientsObject[ing.name.toLowerCase().replace(/\s+/g, "_")] = ing;
});

console.log(`Created ${nestedIngredients.length} root ingredients`);

// Write to file
fs.writeFileSync(outputPath, JSON.stringify(ingredientsObject, null, 2), 'utf8');

console.log(`✅ Successfully created ingredients.json`);
console.log(`✅ Total entries: ${Object.keys(ingredientsObject).length}`);

// Validate JSON
try {
  JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  console.log('✅ JSON validation: PASSED');
} catch (e) {
  console.error('❌ JSON validation: FAILED', e.message);
  process.exit(1);
}
