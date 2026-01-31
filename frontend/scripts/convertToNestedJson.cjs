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
 * Creates root ingredients with children arrays for inheritance chains
 */
function buildNestedStructure() {
  const ingredientMap = new Map();
  const processed = new Set();
  
  // First pass: create all entries with normalized structure
  Object.entries(flatKnowledge).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().trim();
    
    // Only process main entries (skip aliases)
    // Aliases are handled by checking if they point back to a main entry
    if (value.aliases && value.aliases.length > 0) {
      // Check if this is an alias entry (points back to main)
      const isAlias = value.aliases.some(alias => {
        const aliasKey = alias.toLowerCase().trim().replace(/\s+/g, "_");
        return flatKnowledge[aliasKey] && flatKnowledge[aliasKey].aliases && 
               flatKnowledge[aliasKey].aliases.includes(key);
      });
      
      // Skip duplicate alias entries
      if (isAlias && processed.has(key)) return;
    }
    
    if (!processed.has(normalizedKey)) {
      // Map severity to confidence
      const severity = value.confidence_score_base === 0.1 ? "high" : 
                       value.confidence_score_base === 0.5 ? "medium" : "low";
      
      // Extract references
      const quranRef = value.references?.find(r => 
        r.toLowerCase().includes("qur'an") || 
        r.toLowerCase().includes("quran") ||
        r.toLowerCase().includes("surah")
      ) || "";
      
      const hadithRef = value.references?.find(r => 
        r.toLowerCase().includes("hadith") || 
        r.toLowerCase().includes("bukhari") || 
        r.toLowerCase().includes("muslim")
      ) || "";
      
      ingredientMap.set(normalizedKey, {
        name: key.replace(/_/g, " "),
        status: value.status === "haram" ? "haram" : 
                value.status === "conditional" || value.status === "questionable" ? "questionable" : "halal",
        halal_alternatives: value.alternatives || [],
        flavor_role: value.flavor_role || "",
        cuisine: value.cuisine || "",
        notes: value.notes || value.eli5 || "",
        school_of_thought: ["Hanafi", "Shafi'i", "Maliki", "Hanbali"],
        quranic_reference: quranRef,
        hadith_reference: hadithRef,
        children: [],
        _inheritance: value.inheritance || [],
        _key: normalizedKey,
        _severity: severity
      });
      processed.add(normalizedKey);
    }
  });
  
  // Second pass: identify root ingredients (no inheritance)
  const rootIngredients = [];
  const childIngredients = [];
  
  ingredientMap.forEach((ingredient, key) => {
    if (ingredient._inheritance && ingredient._inheritance.length > 0) {
      childIngredients.push({ ingredient, key });
    } else {
      rootIngredients.push({ ingredient, key });
    }
  });
  
  // Third pass: build children relationships
  function addChildren(parent, parentKey) {
    childIngredients.forEach(({ ingredient, key }) => {
      // Check if this ingredient inherits from the parent
      if (ingredient._inheritance.includes(parentKey)) {
        // Create child entry
        const child = {
          name: ingredient.name,
          status: ingredient.status,
          halal_alternatives: ingredient.halal_alternatives,
          flavor_role: ingredient.flavor_role,
          cuisine: ingredient.cuisine,
          notes: ingredient.notes,
          school_of_thought: ingredient.school_of_thought,
          quranic_reference: ingredient.quranic_reference,
          hadith_reference: ingredient.hadith_reference,
          children: []
        };
        
        // Recursively add this child's children
        addChildren(child, key);
        
        parent.children.push(child);
      }
    });
  }
  
  // Build trees starting from roots
  const nestedRoots = [];
  rootIngredients.forEach(({ ingredient, key }) => {
    const root = {
      name: ingredient.name,
      status: ingredient.status,
      halal_alternatives: ingredient.halal_alternatives,
      flavor_role: ingredient.flavor_role,
      cuisine: ingredient.cuisine,
      notes: ingredient.notes,
      school_of_thought: ingredient.school_of_thought,
      quranic_reference: ingredient.quranic_reference,
      hadith_reference: ingredient.hadith_reference,
      children: []
    };
    
    addChildren(root, key);
    nestedRoots.push(root);
  });
  
  return nestedRoots;
}

console.log('Building nested structure...');
const nestedIngredients = buildNestedStructure();

// Sort by status (haram first, then questionable, then halal)
nestedIngredients.sort((a, b) => {
  const statusOrder = { haram: 0, questionable: 1, halal: 2 };
  return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
});

// Convert to object format for easier lookup (key by normalized name)
const ingredientsObject = {};
nestedIngredients.forEach(ing => {
  const key = ing.name.toLowerCase().replace(/\s+/g, "_");
  ingredientsObject[key] = ing;
});

console.log(`Created ${nestedIngredients.length} root ingredients`);
console.log(`Total entries: ${Object.keys(ingredientsObject).length}`);

// Write to file
fs.writeFileSync(outputPath, JSON.stringify(ingredientsObject, null, 2), 'utf8');

console.log(`✅ Successfully created ingredients.json`);
console.log(`✅ Output path: ${outputPath}`);

// Validate JSON
try {
  const validation = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  console.log('✅ JSON validation: PASSED');
  
  // Check sample entry
  const sampleKey = Object.keys(validation)[0];
  if (sampleKey) {
    console.log(`Sample entry: ${sampleKey}`);
    console.log(`  Status: ${validation[sampleKey].status}`);
    console.log(`  Children: ${validation[sampleKey].children.length}`);
  }
} catch (e) {
  console.error('❌ JSON validation: FAILED', e.message);
  process.exit(1);
}
