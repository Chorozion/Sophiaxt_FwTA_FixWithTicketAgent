import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export class TicketStore {
  constructor(baseDir) {
    this.dir = join(baseDir, 'tickets');
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
  }

  create(ticket) {
    const id = ticket.id || `t-${Date.now()}`;
    const full = { id, status: 'new', created: new Date().toISOString(), ...ticket };
    const path = join(this.dir, `${id}.json`);
    writeFileSync(path, JSON.stringify(full, null, 2));
    return full;
  }

  get(id) {
    const path = join(this.dir, `${id}.json`);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8'));
  }

  list() {
    try {
      return readdirSync(this.dir)
        .filter(f => f.endsWith('.json'))
        .map(f => JSON.parse(readFileSync(join(this.dir, f), 'utf8')))
        .sort((a, b) => b.created.localeCompare(a.created));
    } catch { return []; }
  }

  update(id, patch) {
    const current = this.get(id);
    if (!current) return null;
    const updated = { ...current, ...patch, updated: new Date().toISOString() };
    writeFileSync(join(this.dir, `${id}.json`), JSON.stringify(updated, null, 2));
    return updated;
  }

  addMessage(id, message) {
    const current = this.get(id) || { id, messages: [] };
    current.messages = current.messages || [];
    current.messages.push({ ts: new Date().toISOString(), ...message });
    writeFileSync(join(this.dir, `${id}.json`), JSON.stringify(current, null, 2));
    return current;
  }
}
