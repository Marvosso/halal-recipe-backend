import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../../data");
const USERS_FILE = path.resolve(DATA_DIR, "users.json");
const RECIPES_FILE = path.resolve(DATA_DIR, "recipes.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(RECIPES_FILE)) {
  fs.writeFileSync(RECIPES_FILE, JSON.stringify([], null, 2));
}

/**
 * Read users from file
 */
export function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users:", error);
    return [];
  }
}

/**
 * Write users to file
 */
export function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing users:", error);
    return false;
  }
}

/**
 * Read recipes from file
 */
export function readRecipes() {
  try {
    const data = fs.readFileSync(RECIPES_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading recipes:", error);
    return [];
  }
}

/**
 * Write recipes to file
 */
export function writeRecipes(recipes) {
  try {
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing recipes:", error);
    return false;
  }
}
