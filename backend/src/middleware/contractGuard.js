/**
 * Runtime contract guards at API boundaries.
 * Logs violations by default; set CONTRACT_GUARD_STRICT=true to fail requests.
 */

import {
  validateLookupApiEnvelope,
  validateScanApiEnvelope,
  validateConvertApiEnvelope,
  validateLegacyClassifyShape,
} from "../../../shared/regression/contractValidators.js";

function handleViolation(context, errors) {
  const msg = `[contract-guard] ${context}: ${errors.join("; ")}`;
  if (process.env.CONTRACT_GUARD_STRICT === "true") {
    const err = new Error(msg);
    err.code = "contract_violation";
    throw err;
  }
  console.error(msg);
}

/**
 * @param {object} api - lookup envelope
 * @returns {object}
 */
export function assertLookupResponse(api) {
  const errors = validateLookupApiEnvelope(api);
  if (errors.length) handleViolation("lookup", errors);
  return api;
}

/**
 * @param {object} scan
 * @returns {object}
 */
export function assertScanResponse(scan) {
  const errors = validateScanApiEnvelope(scan);
  if (errors.length) handleViolation("scan", errors);
  return scan;
}

/**
 * @param {object} result
 * @returns {object}
 */
export function assertConvertResponse(result) {
  const errors = validateConvertApiEnvelope(result);
  if (errors.length) handleViolation("convert", errors);
  return result;
}

/**
 * @param {object} result - classify-ingredient response
 * @returns {object}
 */
export function assertClassifyResponse(result) {
  const errors = validateLegacyClassifyShape(result);
  if (errors.length) handleViolation("classify-ingredient", errors);
  return result;
}
