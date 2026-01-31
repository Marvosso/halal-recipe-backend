import https from "https";
import http from "http";

/**
 * Shared HTTP/HTTPS agents with keep-alive enabled
 * Reuses connections to reduce SSL/TLS overhead
 */
export const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

export const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

/**
 * Get appropriate agent for URL
 * @param {string} url - URL to determine agent for
 * @returns {https.Agent|http.Agent} Appropriate agent
 */
export function getAgent(url) {
  return url.startsWith("https://") ? httpsAgent : httpAgent;
}
