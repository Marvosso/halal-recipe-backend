const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, '../../../backend/src/data/haram_ingredients.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = lines[0].split(',').map(h => h.trim());

// Parse CSV rows (handle quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse all rows
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  const row = {};
  headers.forEach((header, idx) => {
    row[header] = values[idx] || '';
  });
  rows.push(row);
}

// Build ingredient map and inheritance chains
const ingredientMap = new Map();
const aliasMap = new Map();

// First pass: Create base entries
rows.forEach(row => {
  const mainIngredient = row.haram_ingredient?.toLowerCase().trim().replace(/\s+/g, '_');
  if (!mainIngredient) return;
  
  // Parse aliases
  const aliases = row.aliases 
    ? row.aliases.split(',').map(a => a.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean)
    : [];
  
  // Parse alternatives
  const alternatives = row.halal_alternative
    ? row.halal_alternative.split(',').map(a => a.trim()).filter(Boolean)
    : [];
  
  // Parse references
  const references = [];
  if (row.quran_reference) references.push(row.quran_reference.trim());
  if (row.hadith_reference) references.push(row.hadith_reference.trim());
  
  // Map severity to confidence_score_base
  const severity = row.severity?.toLowerCase().trim() || 'medium';
  let confidence_score_base = 0.5; // default medium
  if (severity === 'high') confidence_score_base = 0.1;
  else if (severity === 'low') confidence_score_base = 1.0;
  
  // Determine inheritance from ingredient name and notes
  const inheritance = [];
  const notes = row.notes || '';
  const ingredientName = mainIngredient.toLowerCase();
  
  // Detect inheritance patterns
  if (ingredientName.includes('gelatin') || notes.includes('gelatin')) {
    if (!ingredientName.includes('pork') && !ingredientName.includes('pork')) {
      inheritance.push('gelatin');
    }
  }
  if (ingredientName.includes('pork') || notes.includes('pork')) {
    inheritance.push('pork');
  }
  if (ingredientName.includes('alcohol') || ingredientName.includes('wine') || 
      ingredientName.includes('beer') || ingredientName.includes('rum') ||
      ingredientName.includes('vodka') || ingredientName.includes('whiskey') ||
      ingredientName.includes('brandy') || notes.includes('alcohol')) {
    if (!ingredientName.includes('alcohol')) {
      inheritance.push('alcohol');
    }
  }
  if ((ingredientName.includes('marshmallow') || notes.includes('marshmallow')) && 
      !ingredientName.includes('gelatin')) {
    inheritance.push('marshmallow');
  }
  
  // Create entry
  const entry = {
    status: 'haram',
    inheritance: inheritance.length > 0 ? inheritance : [],
    alternatives: alternatives,
    notes: notes,
    references: references,
    aliases: aliases,
    confidence_score_base: confidence_score_base
  };
  
  ingredientMap.set(mainIngredient, entry);
  
  // Map aliases to main ingredient
  aliases.forEach(alias => {
    const normalizedAlias = alias.replace(/\s+/g, '_');
    if (!ingredientMap.has(normalizedAlias) && normalizedAlias !== mainIngredient) {
      aliasMap.set(normalizedAlias, mainIngredient);
    }
  });
});

// Second pass: Build full inheritance chains
function buildInheritanceChain(ingredient, visited = new Set()) {
  if (visited.has(ingredient)) return []; // Prevent cycles
  visited.add(ingredient);
  
  const entry = ingredientMap.get(ingredient);
  if (!entry || entry.inheritance.length === 0) return [];
  
  const chain = [];
  entry.inheritance.forEach(parent => {
    const parentChain = buildInheritanceChain(parent, new Set(visited));
    if (parentChain.length > 0) {
      chain.push(...parentChain);
    } else {
      chain.push(parent);
    }
  });
  
  return chain;
}

// Update entries with full inheritance chains
ingredientMap.forEach((entry, ingredient) => {
  if (entry.inheritance.length > 0) {
    const fullChain = buildInheritanceChain(ingredient);
    entry.inheritance = [...new Set([...entry.inheritance, ...fullChain])];
  }
});

// Convert Map to Object
const jsonOutput = {};
ingredientMap.forEach((value, key) => {
  jsonOutput[key] = value;
});

// Add alias entries pointing to main ingredients
aliasMap.forEach((mainIngredient, alias) => {
  if (!jsonOutput[alias]) {
    const mainEntry = jsonOutput[mainIngredient];
    if (mainEntry) {
      jsonOutput[alias] = {
        ...mainEntry,
        aliases: [mainIngredient] // Point back to main
      };
    }
  }
});

// Write JSON file
const outputPath = path.join(__dirname, '../src/data/halal_knowledge.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf8');

console.log(`✅ Converted ${rows.length} CSV rows to JSON`);
console.log(`✅ Created ${Object.keys(jsonOutput).length} JSON entries`);
console.log(`✅ Saved to: ${outputPath}`);
