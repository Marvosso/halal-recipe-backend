/**
 * Social sharing utilities for Halal Kitchen recipe conversions.
 * Generates shareable payload, URL, and platform-specific share text.
 */

const APP_BASE = typeof window !== "undefined" ? `${window.location.origin}` : "https://halalkitchen.app";
const SHARE_PATH = "/share";

/**
 * Build a compact share payload from conversion result.
 * @param {{ recipeTitle: string, issues: Array<{ ingredient?: string, ingredient_id?: string, replacement_id?: string, replacement?: string, wasReplaced?: boolean }>, convertedSnippet?: string }} params
 * @returns {{ title: string, haram: string[], replacements: string[] }}
 */
import { v1ToShareUrlPayload } from "./formatters/ingredientEvaluationFormatters.js";

/**
 * Build ingredient share payload for URL encoding.
 */
export function buildIngredientSharePayload(data) {
  const fromV1 = v1ToShareUrlPayload(data);
  if (fromV1) return fromV1;
  return {
    type: "ingredient",
    contract_version: "1",
    ingredientName: data.ingredientName,
    query: data.query,
    statusLabel: data.statusLabel,
    statusClass: data.statusClass,
    statusSummary: data.statusSummary,
    confidenceScore: data.confidenceScore,
    modifiers: data.modifiers || [],
    warnings: data.warnings || [],
    substitutes: data.substitutes || [],
    verdict: data.verdict,
  };
}

export function buildSharePayload({ recipeTitle, issues = [], convertedSnippet = "" }) {
  const title =
    (recipeTitle || "").trim().split("\n")[0]?.trim() || "Halal Recipe";
  const haram = [];
  const replacements = [];

  (issues || []).forEach((issue) => {
    const name = issue?.ingredient || issue?.ingredient_id;
    const repl = issue?.replacement_id || issue?.replacement;
    if (name) haram.push(String(name).trim());
    if (repl && repl !== "Halal alternative needed") replacements.push(String(repl).trim());
  });

  return {
    type: "recipe",
    title: title.slice(0, 120),
    haram: [...new Set(haram)].slice(0, 20),
    replacements: [...new Set(replacements)].slice(0, 20),
    snippet: (convertedSnippet || "").slice(0, 200),
  };
}

/**
 * Encode payload to a shareable query string (base64 JSON).
 * @param {ReturnType<typeof buildSharePayload>} payload
 * @returns {string}
 */
export function encodeSharePayload(payload) {
  try {
    const json = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return "";
  }
}

/**
 * Decode share payload from query string.
 * @param {string} encoded
 * @returns {ReturnType<typeof buildSharePayload> | null}
 */
export function decodeSharePayload(encoded) {
  if (!encoded || typeof encoded !== "string") return null;
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json);
    return {
      type: data?.type || "recipe",
      contract_version: data?.contract_version || (data?.type === "ingredient" ? "1" : undefined),
      title: data?.title || data?.ingredientName || "Halal Kitchen",
      ingredientName: data?.ingredientName,
      query: data?.query,
      verdict: data?.verdict,
      statusLabel: data?.statusLabel,
      statusClass: data?.statusClass,
      statusSummary: data?.statusSummary,
      confidenceScore: data?.confidenceScore,
      modifiers: Array.isArray(data?.modifiers) ? data.modifiers : [],
      warnings: Array.isArray(data?.warnings) ? data.warnings : [],
      substitutes: Array.isArray(data?.substitutes) ? data.substitutes : [],
      haram: Array.isArray(data?.haram) ? data.haram : [],
      replacements: Array.isArray(data?.replacements) ? data.replacements : [],
      snippet: data?.snippet || "",
    };
  } catch {
    return null;
  }
}

/**
 * Get the full shareable URL for this conversion (opens card on /share).
 * @param {ReturnType<typeof buildSharePayload>} payload
 * @returns {string}
 */
export function getShareUrl(payload) {
  const encoded = encodeSharePayload(payload);
  if (!encoded) return `${APP_BASE}/app`;
  return `${APP_BASE}${SHARE_PATH}?d=${encodeURIComponent(encoded)}`;
}

/**
 * Build share text for WhatsApp / copy (title, swaps, branding, link).
 * @param {ReturnType<typeof buildSharePayload>} payload
 * @param {string} [shareUrl]
 * @returns {string}
 */
export function getShareText(payload, shareUrl) {
  const url = shareUrl || getShareUrl(payload);
  const lines = [
    `🍽️ ${payload.title}`,
    "",
    "Halal version:",
  ];
  if (payload.haram.length > 0 && payload.replacements.length > 0) {
    lines.push(`Swapped: ${payload.haram.join(", ")} → ${payload.replacements.join(", ")}`);
  } else if (payload.haram.length > 0) {
    lines.push(`Ingredients checked: ${payload.haram.join(", ")}`);
  }
  lines.push("", "Converted with Halal Kitchen ✨", url);
  return lines.join("\n");
}

/**
 * WhatsApp share URL (wa.me with text query).
 * @param {ReturnType<typeof buildSharePayload>} payload
 * @returns {string}
 */
export function getWhatsAppShareUrl(payload) {
  const text = getShareText(payload);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Copy share link to clipboard; returns Promise<boolean>.
 * @param {ReturnType<typeof buildSharePayload>} payload
 * @returns {Promise<boolean>}
 */
export async function copyShareLink(payload) {
  const url = getShareUrl(payload);
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy full share text (for Instagram caption / paste elsewhere).
 * @param {ReturnType<typeof buildSharePayload>} payload
 * @returns {Promise<boolean>}
 */
export async function copyShareText(payload) {
  const text = getShareText(payload);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
