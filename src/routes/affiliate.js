/**
 * Affiliate / monetization API.
 * Returns normalized affiliate data (provider display_name, etc.) for frontend; no hardcoded retailer names.
 */

import express from "express";
import {
  getActiveProviders,
  getLinksForSubstitute,
  getLinksForSubstitutes,
} from "../db/monetization.js";

const router = express.Router();

/**
 * GET /api/affiliate/providers?region=US
 * List active providers for region (enabled + in regions). Fallback: empty array if DB unavailable.
 */
router.get("/providers", async (req, res) => {
  try {
    const regionCode = req.query.region || null;
    const providers = await getActiveProviders(regionCode);
    res.json({ providers });
  } catch (err) {
    console.error("[affiliate] GET /providers error:", err);
    res.status(500).json({ providers: [] });
  }
});

/**
 * GET /api/affiliate/links?substitute=agar_agar&region=US&limit=3
 * Get ranked affiliate links for one substitute. Fallback: [] when provider unavailable or no links.
 */
router.get("/links", async (req, res) => {
  try {
    const substitute = req.query.substitute;
    const regionCode = req.query.region || null;
    const limit = Math.min(parseInt(req.query.limit, 10) || 3, 10);
    if (!substitute || typeof substitute !== "string") {
      return res.json({ links: [] });
    }
    const links = await getLinksForSubstitute(substitute.trim(), regionCode, limit);
    res.json({ links });
  } catch (err) {
    console.error("[affiliate] GET /links error:", err);
    res.status(500).json({ links: [] });
  }
});

/**
 * POST /api/affiliate/links/batch
 * Body: { substituteIds: string[], regionCode?: string, limitPerSubstitute?: number }
 * Returns: { linksBySubstitute: Record<string, Array> } — normalized link objects per substitute.
 * Fallback: missing substitute => [] for that key.
 */
router.post("/links/batch", async (req, res) => {
  try {
    const { substituteIds = [], regionCode = null, limitPerSubstitute = 3 } = req.body || {};
    const slugs = Array.isArray(substituteIds) ? substituteIds.filter((s) => typeof s === "string" && s.trim()) : [];
    const limit = Math.min(parseInt(limitPerSubstitute, 10) || 3, 10);
    const linksBySubstitute = await getLinksForSubstitutes(slugs, regionCode || null, limit);
    res.json({ linksBySubstitute });
  } catch (err) {
    console.error("[affiliate] POST /links/batch error:", err);
    res.status(500).json({ linksBySubstitute: {} });
  }
});

export default router;
