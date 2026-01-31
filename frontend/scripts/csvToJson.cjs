const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, '../../backend/src/data/haram_ingredients.csv');
const outputPath = path.join(__dirname, '../src/data/halal_knowledge.json');

console.log('Reading CSV from:', csvPath);
console.log('Output will be saved to:', outputPath);

const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV - handle quoted fields with commas
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

// Parse CSV
const lines = csvContent.split('\n').filter(line => line.trim());
if (lines.length === 0) {
  console.error('CSV file is empty');
  process.exit(1);
}

const headers = parseCSVLine(lines[0]);
console.log('Headers:', headers);

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  if (values.length === 0 || !values[0]) continue;
  
  const row = {};
  headers.forEach((header, idx) => {
    row[header] = values[idx] || '';
  });
  rows.push(row);
}

console.log(`Processing ${rows.length} rows...`);

// Build ingredient map
const ingredientMap = new Map();

// Helper to normalize ingredient name
function normalizeName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// Helper to map severity to confidence_score_base
function getConfidenceBase(severity) {
  const s = (severity || '').toLowerCase().trim();
  if (s === 'high') return 0.1;
  if (s === 'medium') return 0.5;
  if (s === 'low') return 1.0;
  return 0.5; // default
}

// Helper to determine inheritance from ingredient name and notes
function determineInheritance(ingredientName, notes, alternatives, aliases) {
  const name = ingredientName.toLowerCase();
  const notesLower = (notes || '').toLowerCase();
  const altsLower = (alternatives || '').toLowerCase();
  const aliasesLower = (aliases || '').toLowerCase();
  const inheritance = [];
  
  // Pork-based ingredients (skip if already has gelatin inheritance for marshmallows)
  if (!name.includes('marshmallow') && !name.includes('gummy') && !name.includes('lucky_charms')) {
    if (name.includes('pork') || name.includes('bacon') || name.includes('ham') || 
        name.includes('lard') || name.includes('sausage') || name.includes('pepperoni') ||
        name.includes('salami') || name.includes('pâté') || name.includes('hot_dog') ||
        notesLower.includes('pork') || notesLower.includes('pig')) {
      if (!name.includes('pork') || (name.includes('pork') && name !== 'pork')) {
        inheritance.push('pork');
      }
    }
  }
  
  // Gelatin-based ingredients
  if ((name.includes('gelatin') || name.includes('gelatine')) && name !== 'gelatin') {
    if (!name.includes('halal') && !name.includes('vegan')) {
      inheritance.push('gelatin');
    }
  }
  
  // Marshmallow and candy ingredients (contain gelatin) - check this BEFORE pork detection
  if ((name.includes('marshmallow') || name.includes('gummy') || name.includes('jello') || 
       name.includes('lucky_charms')) && name !== 'gelatin') {
    if (notesLower.includes('gelatin') || notesLower.includes('pork gelatin') || 
        aliasesLower.includes('gelatin')) {
      inheritance.push('gelatin');
    } else if (name === 'marshmallows' || name.includes('marshmallow')) {
      // Marshmallows typically contain gelatin
      inheritance.push('gelatin');
    }
  }
  
  // Alcohol-based ingredients
  if (name.includes('wine') || name.includes('beer') || name.includes('alcohol') ||
      name.includes('rum') || name.includes('vodka') || name.includes('whiskey') ||
      name.includes('brandy') || name.includes('mirin') || name.includes('sake') ||
      name.includes('liqueur') || name.includes('bourbon') || name.includes('cognac') ||
      notesLower.includes('alcohol') || notesLower.includes('ethanol')) {
    if (name !== 'alcohol' && name !== 'wine' && name !== 'beer') {
      inheritance.push('alcohol');
    }
  }
  
  // Vanilla extract (alcohol-based)
  if ((name.includes('vanilla') && notesLower.includes('alcohol')) || 
      name.includes('vanilla_extract') || name.includes('vanilla_extract_alcohol')) {
    inheritance.push('alcohol');
  }
  
  // Gelatin should inherit from pork (since it's pork-derived)
  // Check aliases for "pork gelatin" or notes mentioning pork
  if (name === 'gelatin' && (notesLower.includes('pork') || notesLower.includes('pig') || 
      aliasesLower.includes('pork gelatin') || aliasesLower.includes('pork'))) {
    inheritance.push('pork');
  }
  
  return inheritance;
}

// Process each row
rows.forEach((row, idx) => {
  const mainIngredient = row.haram_ingredient?.trim();
  if (!mainIngredient) return;
  
  const normalizedName = normalizeName(mainIngredient);
  
  // Parse aliases
  const aliases = row.aliases
    ? row.aliases.split(',').map(a => normalizeName(a.trim())).filter(a => a && a !== normalizedName)
    : [];
  
  // Parse alternatives
  const alternatives = row.halal_alternative
    ? row.halal_alternative.split(',').map(a => a.trim()).filter(Boolean)
    : [];
  
  // Parse references
  const references = [];
  if (row.quran_reference) references.push(row.quran_reference.trim());
  if (row.hadith_reference) references.push(row.hadith_reference.trim());
  
  // Determine inheritance
  const inheritance = determineInheritance(normalizedName, row.notes, row.halal_alternative, row.aliases);
  
  // Determine status
  let status = 'haram'; // Default for CSV entries
  if (normalizedName.includes('questionable') || 
      row.notes?.toLowerCase().includes('check') ||
      row.notes?.toLowerCase().includes('may contain') ||
      row.notes?.toLowerCase().includes('verify')) {
    status = 'questionable';
  }
  
  // Get confidence base
  const confidence_score_base = getConfidenceBase(row.severity);
  
  // Create entry
  const entry = {
    status: status,
    inheritance: inheritance.length > 0 ? inheritance : [],
    alternatives: alternatives.length > 0 ? alternatives : [],
    notes: row.notes?.trim() || '',
    references: references.length > 0 ? references : [],
    aliases: aliases.length > 0 ? aliases : [],
    confidence_score_base: confidence_score_base
  };
  
  // Add ELI5 if applicable
  if (normalizedName.includes('gelatin') || normalizedName.includes('marshmallow')) {
    entry.eli5 = normalizedName.includes('gelatin') 
      ? "Gelatin is made from animal parts, so whether it's halal depends on the animal."
      : "Marshmallows often contain gelatin, which may come from pork.";
  }
  if (normalizedName.includes('vanilla')) {
    entry.eli5 = "Vanilla extract often has a little bit of alcohol in it, so check if it's alcohol-free.";
  }
  
  ingredientMap.set(normalizedName, entry);
  
  // Add aliases pointing to main ingredient
  aliases.forEach(alias => {
    if (!ingredientMap.has(alias)) {
      ingredientMap.set(alias, {
        ...entry,
        aliases: [normalizedName] // Point back to main
      });
    }
  });
});

// Build full inheritance chains (resolve nested inheritance)
function buildFullChain(ingredient, visited = new Set()) {
  if (visited.has(ingredient)) return []; // Prevent cycles
  visited.add(ingredient);
  
  const entry = ingredientMap.get(ingredient);
  if (!entry || !entry.inheritance || entry.inheritance.length === 0) return [];
  
  const fullChain = [];
  entry.inheritance.forEach(parent => {
    if (!ingredientMap.has(parent) || parent === ingredient) return; // Skip self-references
    const parentChain = buildFullChain(parent, new Set(visited));
    if (parentChain.length > 0) {
      fullChain.push(...parentChain);
    } else {
      fullChain.push(parent);
    }
  });
  
  return [...new Set(fullChain)]; // Remove duplicates
}

// Update entries with full inheritance chains
ingredientMap.forEach((entry, ingredient) => {
  // Remove self-references
  if (entry.inheritance && entry.inheritance.includes(ingredient)) {
    entry.inheritance = entry.inheritance.filter(parent => parent !== ingredient);
  }
  
  if (entry.inheritance && entry.inheritance.length > 0) {
    const fullChain = buildFullChain(ingredient);
    // Merge with existing, preserving order, removing duplicates
    entry.inheritance = [...new Set([...entry.inheritance, ...fullChain])];
  }
});

// Convert Map to Object
const jsonOutput = {};
ingredientMap.forEach((value, key) => {
  jsonOutput[key] = value;
});

// Write JSON file
fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf8');

console.log(`✅ Successfully converted ${rows.length} CSV rows`);
console.log(`✅ Created ${Object.keys(jsonOutput).length} JSON entries`);
console.log(`✅ Saved to: ${outputPath}`);

// Validate JSON
try {
  JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  console.log('✅ JSON validation: PASSED');
} catch (e) {
  console.error('❌ JSON validation: FAILED', e.message);
  process.exit(1);
}
