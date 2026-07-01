/**
 * Minimal FwTA server for a target.
 * Allows viewing tickets and "agent available" status.
 */
import http from 'node:http';
import { TicketStore } from './tickets/store.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function startServer(targetDir = 'demo', port = 3777) {
  const fwtaDir = join(targetDir, '.fwta');
  const store = new TicketStore(fwtaDir);
  const specPath = join(fwtaDir, 'system-spec.md');

  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/tickets') {
      const tickets = store.list();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      let html = `
        <html><head><title>FwTA Agent — ${targetDir}</title>
        <style>body{font-family:sans-serif;max-width:900px;margin:2rem auto;padding:1rem} .banner{background:#e6f3ff;padding:1rem;border-left:5px solid #0066cc;margin-bottom:1rem} .ticket{border:1px solid #ddd;padding:1rem;margin-bottom:1rem} form{margin-top:1rem}</style>
        </head><body>
        <div class="banner">
          <h1>FwTA — Fix With Ticket Agent</h1>
          <p><strong>SAFE MODE ACTIVE</strong> — Propose-only. No system internals or company data will ever be exposed. All changes are minimal and reviewed. This agent is designed to be open-source safe.</p>
          <p>Target: <code>${targetDir}</code> | Agent monitoring this site (simulation — LLM responses provided by operator)</p>
        </div>
        <p><a href="/spec">View redacted system understanding (DB + code)</a></p>
        <h2>Submit Ticket</h2>
        <form method="POST" action="/submit">
          <input name="customer" placeholder="your@email.com" required><br>
          <input name="title" placeholder="Short title of the bug" style="width:400px" required><br>
          <textarea name="description" rows="4" style="width:400px" placeholder="Describe the problem, steps to reproduce, any error messages"></textarea><br>
          <button type="submit">Submit Ticket (creates file for agent)</button>
        </form>
        <h2>Recent Tickets</h2>`;
      tickets.forEach(t => {
        const last = (t.messages || []).slice(-1)[0] || {};
        html += `<div class="ticket"><strong>${t.id}</strong> — ${t.title || ''}<br>Status: ${t.status || 'new'}<br>Customer: ${t.customer}<br><small>${last.text || ''}</small></div>`;
      });
      html += `<p><small>Use CLI for full agent processing: <code>node src/index.js agent "${targetDir}" &lt;id&gt;</code></small></p></body></html>`;
      res.end(html);
    } else if (req.url === '/submit' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const params = new URLSearchParams(body);
        const ticket = {
          id: `t-${Date.now()}`,
          created: new Date().toISOString(),
          customer: params.get('customer') || 'anonymous',
          title: params.get('title') || 'Untitled',
          description: params.get('description') || '',
          repro: 'Submitted via web UI'
        };
        store.create(ticket);
        res.writeHead(302, { Location: '/tickets' });
        res.end();
      });
      return;
    } else if (req.url === '/spec') {
      if (existsSync(specPath)) {
        res.setHeader('Content-Type', 'text/plain');
        res.end(readFileSync(specPath, 'utf8'));
      } else {
        res.end('No spec yet. Run audit first.');
      }
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    console.log(`[fwta] Agent UI available at http://localhost:${port}`);
    console.log(`[fwta] Target: ${targetDir} — this is your simulated live prod site.`);
  });

  return server;
}
