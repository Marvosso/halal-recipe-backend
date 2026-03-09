/**
 * Parse meal plan or multi-recipe text into a list of { label, text } for batch conversion.
 * Handles: day headers (Monday:, Tue, Day 1), numbered recipes (1. ... 2. ...), or double-newline blocks.
 */

const DAY_NAMES_FULL = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];
const DAY_NAMES_SHORT = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** Max recipes per batch to avoid long runs */
export const MAX_BATCH_RECIPES = 14;

/**
 * Build a regex that matches a day header at the start of a line (with optional colon/dash).
 * Captures the day label for use as recipe label.
 */
function getDayHeaderPattern() {
  const days = [
    ...DAY_NAMES_FULL,
    ...DAY_NAMES_SHORT,
    ...DAY_NAMES_FULL.map((d) => d.slice(0, 3)),
  ];
  const unique = [...new Set(days)];
  const alternation = unique
    .map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return new RegExp(
    `^\\s*(?:(${alternation})|day\\s*\\d+|week\\s*\\d+)\\s*[:\\-]?\\s*(.*)`,
    "im"
  );
}

/**
 * Split text by day-of-week or "Day N" / "Week N" headers.
 * @param {string} text
 * @returns {{ label: string, text: string }[] | null } Blocks with label (day) and text, or null if no day headers found
 */
function splitByDayHeaders(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let currentLabel = "";
  let currentLines = [];
  const dayPattern = getDayHeaderPattern();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.trim().match(dayPattern);
    if (match) {
      if (currentLines.length > 0) {
        blocks.push({
          label: currentLabel || "Recipe",
          text: currentLines.join("\n").trim(),
        });
      }
      currentLabel = match[1]
        ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
        : match[0].replace(/\s*[:\-]\s*$/, "").trim();
      if (!currentLabel) currentLabel = "Recipe";
      currentLines = [match[2] ? match[2].trim() : ""].filter(Boolean);
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    blocks.push({
      label: currentLabel || "Recipe",
      text: currentLines.join("\n").trim(),
    });
  }
  return blocks.length > 0 ? blocks : null;
}

/**
 * Split text by numbered items (1. Recipe title ... 2. Next recipe ...).
 * @param {string} text
 * @returns {{ label: string, text: string }[] | null }
 */
function splitByNumberedBlocks(text) {
  const pattern = /^\s*(\d+)\.\s*(.*)$/gm;
  const blocks = [];
  let match;
  let lastIndex = 0;
  let lastLabel = "";
  let lastStart = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (lastLabel !== "") {
      const chunk = text.slice(lastStart, match.index).trim();
      if (chunk) {
        blocks.push({ label: lastLabel, text: chunk });
      }
    }
    lastLabel = match[2].trim() || `Recipe ${match[1]}`;
    if (lastLabel.length > 60) lastLabel = lastLabel.slice(0, 57) + "...";
    lastStart = match.index;
  }
  if (lastLabel) {
    const chunk = text.slice(lastStart).trim();
    if (chunk) {
      blocks.push({ label: lastLabel, text: chunk });
    }
  }
  return blocks.length > 0 ? blocks : null;
}

/**
 * Split by double newlines; use first line of each block as label.
 * @param {string} text
 * @returns {{ label: string, text: string }[] }
 */
function splitByDoubleNewline(text) {
  const rawBlocks = text.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  return rawBlocks.map((block, i) => {
    const firstLine = block.split(/\r?\n/)[0]?.trim() || "";
    const label = firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine || `Recipe ${i + 1}`;
    return { label, text: block };
  });
}

/**
 * Parse meal plan or multi-recipe input into an array of { label, text }.
 * Tries day headers first, then numbered blocks, then double-newline. Capped at MAX_BATCH_RECIPES.
 * @param {string} input - Raw meal plan or list of recipes
 * @returns {{ label: string, text: string }[] }
 */
export function parseMealPlanInput(input) {
  if (!input || typeof input !== "string") return [];
  const trimmed = input.trim();
  if (!trimmed) return [];

  let blocks = splitByDayHeaders(trimmed);
  if (!blocks || blocks.length === 0) {
    blocks = splitByNumberedBlocks(trimmed);
  }
  if (!blocks || blocks.length === 0) {
    blocks = splitByDoubleNewline(trimmed);
  }
  const filtered = (blocks || []).filter((b) => b.text && b.text.length > 0);
  return filtered.slice(0, MAX_BATCH_RECIPES);
}
