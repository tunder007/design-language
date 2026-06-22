// Shared helpers (standalone so the skill is portable). Deterministic: no random, no time.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const here = path.dirname(fileURLToPath(import.meta.url));
export const readText = (abs) => { try { return fs.readFileSync(abs, "utf8"); } catch { return null; } };
export const readJSON = (abs) => JSON.parse(fs.readFileSync(abs, "utf8"));

// Load the canonical tokens.json relative to scripts/lib/.
export function loadTokens() {
  return readJSON(path.join(here, "..", "..", "design", "tokens.json"));
}

export { fs, path };
