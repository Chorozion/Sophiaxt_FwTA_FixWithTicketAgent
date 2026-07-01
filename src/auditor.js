import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

/**
 * Improved auditor for FwTA.
 * Produces a structured system-spec.md
 */
export function audit(targetDir, options = {}) {
  const fwtaDir = ensureDir(join(targetDir, '.fwta'));
  const specPath = join(fwtaDir, 'system-spec.md');

  const summary = {
    target: targetDir,
    generated: new Date().toISOString(),
    stats: { filesScanned: 0, dirs: 0 },
    framework: 'unknown',
    dbDriver: 'unknown',
    sections: {
      overview: [],
      routes: [],
      api: [],
      components: [],
      lib: [],
      database: { tables: [], notes: '' },
      auth: [],
      billingSensitive: [],
      otherImportant: []
    }
  };

  const importantFiles = [];
  const dbFiles = [];

  function walk(dir, depth = 0) {
    if (depth > 6) return;
    let entries;
    try { entries = readdirSync(dir); } catch { return; }

    for (const name of entries) {
      const full = join(dir, name);
      let st;
      try { st = statSync(full); } catch { continue; }

      const rel = relative(targetDir, full).replace(/\\/g, '/');

      if (st.isDirectory()) {
        if (['node_modules', '.git', '.fwta', 'dist', 'build', '.next'].includes(name)) continue;
        summary.stats.dirs++;
        walk(full, depth + 1);
      } else {
        summary.stats.filesScanned++;
        const ext = extname(name);

        if (shouldAudit(rel, name)) {
          try {
            const content = readFileSync(full, 'utf8');
            importantFiles.push({ rel, content, name });
            if (name.includes('db') || name.includes('schema') || rel.includes('prisma')) {
              dbFiles.push({ rel, content, name });
            }
          } catch {}
        }
      }
    }
  }

  try {
    walk(targetDir);
  } catch (e) {
    console.warn('[fwta] Audit scan had issues:', e.message);
  }

  // Detect framework / DB
  for (const f of importantFiles) {
    if (f.name === 'package.json') {
      const pkg = f.content.toLowerCase();
      if (pkg.includes('express')) summary.framework = 'express';
      if (pkg.includes('next')) summary.framework = 'next.js';
      if (pkg.includes('better-sqlite3')) summary.dbDriver = 'better-sqlite3 (embedded)';
      if (pkg.includes('"pg"') || pkg.includes('postgres')) summary.dbDriver = 'postgres (pg)';
      if (pkg.includes('mysql2') || pkg.includes('mysql')) summary.dbDriver = 'mysql';
      if (pkg.includes('prisma')) summary.dbDriver = 'prisma';
    }
    if (f.rel.includes('prisma/schema.prisma')) {
      summary.dbDriver = 'prisma';
    }
    if (f.content.includes('express') && summary.framework === 'unknown') summary.framework = 'express';
    if (f.content.includes('http.createServer') && summary.framework === 'unknown') summary.framework = 'node http';
    if ((f.name === 'data.json' || f.rel.includes('data.json')) && summary.dbDriver === 'unknown') {
      summary.dbDriver = 'json file-based (demo)';
      // Force parse tables from schema comment if present in other files
    }
  }

  // Classify
  for (const f of importantFiles) {
    const { rel, content, name } = f;

    if (rel.includes('/api/') || rel.includes('/routes/')) {
      summary.sections.api.push({ file: rel, sample: extractApiInfo(content) });
    } else if ((rel.includes('/app/') || rel.includes('/routes/')) && (name.endsWith('.js') || name.endsWith('.ts'))) {
      if (!rel.includes('/api/')) summary.sections.routes.push(rel);
    } else if (rel.includes('/components/') || rel.includes('/views/')) {
      summary.sections.components.push(rel);
    } else if (rel.includes('/lib/') || rel.includes('/models/') || rel.includes('/services/')) {
      summary.sections.lib.push(rel);
      if (name.toLowerCase().includes('auth')) {
        summary.sections.auth.push({ file: rel, notes: extractAuthNotes(content) });
      }
    }

    // Billing / sensitive data areas (never propose direct changes here)
    if (rel.match(/coupon|payment|billing|order|vip|subscription/i)) {
      summary.sections.billingSensitive.push(rel);
    }
  }

  // === Dense Database Understanding ===
  const tables = [];
  for (const df of dbFiles) {
    const schemaMatches = df.content.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\)/gi) || [];
    for (const match of schemaMatches) {
      const tableNameMatch = match.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
      if (tableNameMatch) {
        const tableName = tableNameMatch[1];
        const isSensitive = /user|customer|payment|billing|order|subscription|vip|pin|auth/i.test(tableName);
        tables.push({
          name: tableName,
          sensitive: isSensitive,
          source: df.rel
        });
      }
    }
  }
  summary.sections.database.tables = tables;
  summary.sections.database.driver = summary.dbDriver;
  summary.sections.database.notes = `Embedded or direct SQL. ${tables.length} tables detected. Sensitive tables flagged and should only be touched with extreme caution.`;

  // Redact seed data and sensitive content
  const redactedImportant = importantFiles.map(f => {
    if (f.rel.includes('/seed/') || f.name.includes('seed')) {
      return { ...f, content: '[SEED DATA REDACTED - summarized only, not included in spec for safety]' };
    }
    return f;
  });

  // Build safe, dense markdown spec
  let md = `# System Understanding (Redacted for Safety)\n\n`;
  md += `**Target type:** ${summary.framework} + Node.js\n`;
  md += `**Database:** ${summary.dbDriver}\n`;
  md += `Generated: ${summary.generated}\n\n`;

  md += `## Architecture Overview\n`;
  md += `- Framework: ${summary.framework}\n`;
  md += `- Primary DB: ${summary.dbDriver}\n`;
  md += `- Total files analyzed: ${summary.stats.filesScanned}\n\n`;

  md += `## Database Schema (Dense Summary)\n`;
  if (summary.sections.database.tables.length > 0) {
    md += `Driver: ${summary.sections.database.driver}\n\n`;
    md += `**Tables:**\n`;
    for (const t of summary.sections.database.tables) {
      const flag = t.sensitive ? ' [SENSITIVE - billing/data/accounts]' : '';
      md += `- ${t.name}${flag}\n`;
    }
    md += `\n**Safety note:** Never propose direct SQL or schema changes to sensitive tables. Use existing data access patterns only.\n\n`;
  } else {
    md += `No explicit schema extracted. Look for query patterns in lib/ files.\n\n`;
  }

  md += `## Key Code Areas\n`;
  md += `### Library / Core Logic\n`;
  summary.sections.lib.slice(0, 15).forEach(f => md += `- ${f}\n`);
  md += `\n### API & Routes (high level)\n`;
  summary.sections.api.slice(0, 10).forEach(a => md += `- ${a.file}\n`);
  md += `\n### Auth / Accounts\n`;
  summary.sections.auth.forEach(a => md += `- ${a.file}: ${a.notes}\n`);
  md += `\n### Billing / Sensitive Areas (read-only analysis only)\n`;
  summary.sections.billingSensitive.slice(0, 8).forEach(f => md += `- ${f}\n`);

  md += `\n## Agent Safety Rules (injected)\n`;
  md += `- This spec is redacted. Do not attempt to reconstruct full business logic or company internals.\n`;
  md += `- Only propose minimal, targeted fixes for reported symptoms.\n`;
  md += `- For data issues: prefer using existing query helpers over raw SQL.\n`;
  md += `- If ticket asks about system architecture, company details, or secrets → escalate only.\n`;

  writeFileSync(specPath, md, 'utf8');
  console.log(`[fwta] Dense + DB-aware audit written → ${specPath}`);
  console.log('[fwta] LLMs: Read this spec first before making changes to the project.');
  return specPath;
}

function shouldAudit(rel, name) {
  if (rel.includes('node_modules')) return false;
  const low = name.toLowerCase();
  if (low.endsWith('.js') || low.endsWith('.ts') || low.endsWith('.mjs') || low.endsWith('.cjs') || 
      name === 'package.json' || low.includes('config') || low.includes('schema') || 
      low.includes('db') || low.includes('model')) return true;
  if (name === 'server.js' || name === 'app.js') return true;
  return false;
}

function extractApiInfo(content) {
  const methods = [];
  if (content.includes('export async function GET')) methods.push('GET');
  if (content.includes('export async function POST')) methods.push('POST');
  if (content.includes('export async function PUT')) methods.push('PUT');
  if (content.includes('export async function DELETE')) methods.push('DELETE');
  return methods.length ? methods.join(', ') : 'handler';
}

function extractAuthNotes(content) {
  if (content.includes('createToken') || content.includes('decodeToken')) return 'Custom token auth (HMAC cookie based)';
  if (content.includes('AUTH_SECRET')) return 'Uses AUTH_SECRET';
  return 'Auth related code';
}

function extractDbSchema(content) {
  const tables = content.match(/CREATE TABLE IF NOT EXISTS (\w+)/gi) || [];
  return tables.map(t => t.replace(/CREATE TABLE IF NOT EXISTS /i, '')).join(', ') || 'SQLite via better-sqlite3';
}

function ensureDir(p) {
  if (!existsSync(p)) {
    mkdirSync(p, { recursive: true });
  }
  return p;
}
