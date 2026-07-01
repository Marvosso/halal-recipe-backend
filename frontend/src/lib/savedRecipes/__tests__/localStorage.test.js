/**
 * Saved recipe localStorage migration (Phase 4).
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  migrateLegacyHalalRecipes,
  loadLocalSavedRecipes,
  addLocalSavedRecipe,
} from "../localStorage.js";

const storage = new Map();

function mockLocalStorage() {
  global.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };
}

describe("savedRecipes localStorage", () => {
  beforeEach(() => {
    storage.clear();
    mockLocalStorage();
  });

  afterEach(() => {
    delete global.localStorage;
  });

  it("migrates legacy halalRecipes into halalSavedRecipes once", () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([{ id: "legacy-1", title: "Old Save", original: "a", converted: "b" }])
    );

    const migrated = migrateLegacyHalalRecipes();
    assert.strictEqual(migrated.length, 1);
    assert.strictEqual(localStorage.getItem(LEGACY_STORAGE_KEY), null);
    assert.strictEqual(loadLocalSavedRecipes().length, 1);
    assert.strictEqual(localStorage.getItem(STORAGE_KEY)?.includes("legacy-1"), true);
  });

  it("addLocalSavedRecipe uses canonical storage key", () => {
    addLocalSavedRecipe({
      title: "Test",
      original: "pork",
      converted: "turkey",
    });
    const list = loadLocalSavedRecipes();
    assert.strictEqual(list.length, 1);
    assert.ok(localStorage.getItem(STORAGE_KEY));
    assert.strictEqual(localStorage.getItem(LEGACY_STORAGE_KEY), null);
  });
});
