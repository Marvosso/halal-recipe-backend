/**
 * OpenAI provider — explanation generation only.
 */

import { SYSTEM_PROMPT, JSON_RESPONSE_INSTRUCTION } from "../prompts/explanationPrompts.js";
import { parseExplanationOutput } from "../contracts/explanationContract.js";

/**
 * @param {string} userPrompt
 * @param {object} [options]
 * @returns {Promise<import("../contracts/explanationContract.js").ExplanationAIOutput|null>}
 */
export async function generateExplanationWithOpenAI(userPrompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) return null;

  const model = options.model || process.env.AI_EXPLANATION_MODEL || "gpt-4o-mini";
  const max_tokens = options.max_tokens ?? 220;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens,
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\n${JSON_RESPONSE_INSTRUCTION}` },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      console.warn("[ai-explanation] OpenAI HTTP", res.status);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    return parseExplanationOutput(content);
  } catch (err) {
    console.warn("[ai-explanation] OpenAI failed:", err.message);
    return null;
  }
}
