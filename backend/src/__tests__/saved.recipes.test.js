/**
 * Saved halal recipes service — file fallback (no DB required).
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  saveHalalRecipe,
  listSavedHalalRecipes,
  getSavedHalalRecipe,
  removeSavedHalalRecipe,
} from "../services/savedRecipesService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_FILE = path.resolve(__dirname, "../../data/recipes.json");

const TEST_USER = "test-user-saved-recipes";

describe("Saved halal recipes service", () => {
  let backup = null;

  beforeEach(() => {
    if (fs.existsSync(RECIPES_FILE)) {
      backup = fs.readFileSync(RECIPES_FILE, "utf8");
    }
    fs.writeFileSync(RECIPES_FILE, JSON.stringify([], null, 2));
  });

  it("saves and lists a conversion", async () => {
    const saved = await saveHalalRecipe(
      {
        title: "Test Pancakes",
        originalRecipe: "2 cups flour\n1 egg\nbacon",
        convertedRecipe: "2 cups flour\n1 egg\nturkey bacon",
        confidenceScore: 90,
        substitutionsUsed: [{ ingredient: "bacon", replacement: "turkey bacon" }],
      },
      TEST_USER
    );

    assert.ok(saved.id);
    assert.strictEqual(saved.title, "Test Pancakes");
    assert.ok(saved.convertedRecipe.includes("turkey"));

    const list = await listSavedHalalRecipes(TEST_USER);
    assert.ok(list.length >= 1);
    assert.strictEqual(list[0].id, saved.id);
  });

  it("gets one saved recipe by id", async () => {
    const saved = await saveHalalRecipe(
      {
        title: "Soup",
        originalRecipe: "wine",
        convertedRecipe: "grape juice",
        confidenceScore: 80,
        substitutionsUsed: [],
      },
      TEST_USER
    );

    const one = await getSavedHalalRecipe(saved.id, TEST_USER);
    assert.ok(one);
    assert.strictEqual(one.id, saved.id);
  });

  it("deletes a saved recipe", async () => {
    const saved = await saveHalalRecipe(
      {
        title: "Delete me",
        originalRecipe: "a",
        convertedRecipe: "b",
      },
      TEST_USER
    );

    const ok = await removeSavedHalalRecipe(saved.id, TEST_USER);
    assert.strictEqual(ok, true);
    const one = await getSavedHalalRecipe(saved.id, TEST_USER);
    assert.strictEqual(one, null);
  });

  it("restores recipes file after tests", () => {
    if (backup != null) {
      fs.writeFileSync(RECIPES_FILE, backup);
    }
  });
});
