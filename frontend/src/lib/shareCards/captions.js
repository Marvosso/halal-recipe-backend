import { getShareText, getShareUrl } from "../shareUtils.js";
import { HK_BRAND } from "./brand.js";

/**
 * Instagram / TikTok caption for ingredient card.
 */
export function getIngredientShareCaption(data) {
  const lines = [
    `Is ${data.ingredientName} halal?`,
    `${data.statusLabel} — checked with ${HK_BRAND.name}`,
    "",
    data.statusSummary,
    "",
    `${HK_BRAND.disclaimer}`,
    `https://${HK_BRAND.url}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/**
 * WhatsApp-friendly short text for ingredient.
 */
export function getIngredientWhatsAppText(data) {
  return [
    `🥘 ${data.ingredientName}`,
    `Verdict: ${data.statusLabel}`,
    data.confidenceScore > 0 ? `Confidence: ${data.confidenceScore}%` : "",
    "",
    `Checked on ${HK_BRAND.name} ✨`,
    `https://${HK_BRAND.url}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getIngredientWhatsAppUrl(data) {
  return `https://wa.me/?text=${encodeURIComponent(getIngredientWhatsAppText(data))}`;
}

/**
 * Recipe conversion captions (reuse shareUtils link flow).
 */
export function getRecipeShareCaption(payload) {
  return getShareText(payload);
}

export function getRecipeWhatsAppUrl(payload) {
  const text = getShareText(payload);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getRecipeShareLink(payload) {
  return getShareUrl(payload);
}
