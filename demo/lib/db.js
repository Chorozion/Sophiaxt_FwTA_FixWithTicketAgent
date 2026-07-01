// Fake DB helper for demo (simulates better-sqlite3 style)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dataPath = join(process.cwd(), 'demo', 'data.json');

export function q(sql, params = []) {
  // Very simplified for demo
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  if (sql.includes('SELECT')) {
    return data.orders || [];
  }
  return { insertId: Date.now(), affectedRows: 1 };
}

// Schema for auditor detection
/*
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  total REAL,
  coupon_code TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  discount INTEGER,
  active INTEGER
);
*/
