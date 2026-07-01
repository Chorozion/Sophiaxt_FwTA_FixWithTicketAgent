/**
 * Minimal config loader for FwTA (MVP).
 * Looks for:
 *   - .fwta/config.json
 *   - env vars (XAI_API_KEY etc.)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function loadConfig(cwd = process.cwd()) {
  const fwtaDir = join(cwd, '.fwta');
  const cfgPath = join(fwtaDir, 'config.json');
  let fileCfg = {};
  if (existsSync(cfgPath)) {
    try {
      fileCfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
    } catch {}
  }

  const env = {
    provider: process.env.FWTA_PROVIDER || fileCfg.provider || 'xai',
    model: process.env.FWTA_MODEL || fileCfg.model,
    autonomy: process.env.FWTA_AUTONOMY || fileCfg.autonomy || 'propose-only',
  };

  const keys = {
    xai: process.env.XAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  };

  return {
    ...fileCfg,
    ...env,
    keys,
    fwtaDir,
  };
}

export function ensureDefaultConfig(cwd = process.cwd()) {
  const fwtaDir = join(cwd, '.fwta');
  const cfgPath = join(fwtaDir, 'config.json');
  if (!existsSync(cfgPath)) {
    const starter = {
      provider: "xai",
      model: "grok-4",
      autonomy: "propose-only",
      notes: "Edit this or use env vars. Never commit secrets."
    };
    try {
      import('node:fs').then(fs => fs.writeFileSync(cfgPath, JSON.stringify(starter, null, 2)));
    } catch {}
  }
}
