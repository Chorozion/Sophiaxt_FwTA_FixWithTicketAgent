/**
 * Robust config system for FwTA.
 * Priority:
 *   1. .fwta/config.json (in target)
 *   2. fwta.config.js (in target, for advanced)
 *   3. Environment variables
 *
 * This makes configuration visible and easy for humans + LLMs.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_CONFIG = {
  provider: "xai",
  model: "grok-4",
  autonomy: "propose-only",
  maxPatchSize: 2000,          // lines
  allowedPaths: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx", "**/*.md", "**/*.json"],
  ignorePatterns: ["node_modules/**", ".git/**", ".fwta/**", "dist/**", "build/**"],
  notes: "Configure provider, model, and autonomy. Never commit secrets."
};

export async function loadConfig(cwd = process.cwd()) {
  const fwtaDir = join(cwd, '.fwta');
  const cfgPath = join(fwtaDir, 'config.json');
  let fileCfg = { ...DEFAULT_CONFIG };

  // Load JSON config
  if (existsSync(cfgPath)) {
    try {
      const loaded = JSON.parse(readFileSync(cfgPath, 'utf8'));
      fileCfg = { ...fileCfg, ...loaded };
    } catch (e) {
      console.warn('[fwta] Warning: Could not parse .fwta/config.json');
    }
  }

  // Load JS config if present (more powerful for LLMs/devs)
  const jsCfgPath = join(cwd, 'fwta.config.js');
  if (existsSync(jsCfgPath)) {
    try {
      // Advanced: use dynamic import in async contexts. For CLI we stick to JSON.
      console.log('[fwta] Note: fwta.config.js detected — consider using .fwta/config.json for simplicity');
    } catch (e) {}
  }

  const env = {
    provider: process.env.FWTA_PROVIDER || fileCfg.provider,
    model: process.env.FWTA_MODEL || fileCfg.model,
    autonomy: process.env.FWTA_AUTONOMY || fileCfg.autonomy,
  };

  const keys = {
    xai: process.env.XAI_API_KEY || process.env.GROK_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  };

  return {
    ...fileCfg,
    ...env,
    keys,
    fwtaDir,
    cwd,
  };
}

export function ensureDefaultConfig(cwd = process.cwd(), force = false) {
  const fwtaDir = join(cwd, '.fwta');
  if (!existsSync(fwtaDir)) {
    mkdirSync(fwtaDir, { recursive: true });
  }

  const cfgPath = join(fwtaDir, 'config.json');
  if (force || !existsSync(cfgPath)) {
    const starter = { ...DEFAULT_CONFIG };
    writeFileSync(cfgPath, JSON.stringify(starter, null, 2));
    console.log(`[fwta] Created default config at ${cfgPath}`);
  }

  // Also ensure .fwtaignore for robustness
  const ignorePath = join(cwd, '.fwtaignore');
  if (!existsSync(ignorePath)) {
    const defaultIgnore = `# FwTA ignore patterns (in addition to .gitignore)
node_modules/
.git/
.fwta/
dist/
build/
*.min.js
coverage/
`;
    writeFileSync(ignorePath, defaultIgnore);
    console.log(`[fwta] Created .fwtaignore`);
  }

  return cfgPath;
}
