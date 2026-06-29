/**
 * Guest / public POST /convert support (MVP Phase 1).
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import convertService from "../services/convertService.js";

describe("Guest recipe conversion (Phase 1)", () => {
  it("convertService runs without userId for guest conversions", async () => {
    const result = await convertService("2 slices bacon and 1 cup wine", {});
    assert.ok(typeof result.convertedText === "string");
    assert.ok(Array.isArray(result.issues));
    assert.ok(result.pipeline);
  });
});
