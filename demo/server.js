/**
 * Reference "wired" example for FwTA.
 * This shows one realistic way developers integrate the framework.
 *
 * In a real app you would:
 *   - Call audit on deploy / in a job
 *   - Mount ticket creation + UI
 *   - Run the agent worker separately
 */

import http from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// === FwTA Wiring ===
import { audit } from '../src/auditor.js';
import { TicketStore } from '../src/tickets/store.js';
import { startServer as startFwtaUi } from '../src/server.js';

const ROOT = process.cwd();
const DEMO_DATA = join(ROOT, 'demo', 'data.json');

// Run audit at startup (in real life: on deploy or nightly)
audit(ROOT);

// Optional: start FwTA UI on a separate port for humans
if (process.env.FWTA_UI) {
  startFwtaUi(ROOT, 3888);
}

const store = new TicketStore(ROOT);

function loadData() {
  if (!existsSync(DEMO_DATA)) {
    const initial = {
      products: [{ id: 1, name: "Item A", price: 10 }, { id: 2, name: "Item B", price: 25 }],
      orders: [{ id: 'o1', total: 100, status: 'new' }],
      reviews: [],
      coupons: [{ code: "SAVE10", discount: 10, active: true }]
    };
    writeFileSync(DEMO_DATA, JSON.stringify(initial, null, 2));
  }
  return JSON.parse(readFileSync(DEMO_DATA, 'utf8'));
}

function saveData(data) {
  writeFileSync(DEMO_DATA, JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  const data = loadData();

  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('content-type', 'text/html');
    res.end(`<html><head><title>Demo Store (FwTA Wired)</title></head>
<body>
<h1>Demo Store</h1>
<p>This is a synthetic app with FwTA wired in for testing.</p>
<form action="/apply-coupon" method="post">
  <input name="code" placeholder="Coupon code (try SAVE10)">
  <button>Apply</button>
</form>
<p><a href="http://localhost:3888" target="_blank">Open FwTA Ticket UI</a></p>
</body></html>`);

  } else if (req.url === '/apply-coupon' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const code = params.get('code');
      const coupon = data.coupons.find(c => c.code === code && c.active);

      if (coupon) {
        // BUG: intentionally incomplete update (for FwTA to discover)
        data.reviews.push({ type: 'coupon-used', code, ts: Date.now() });
        saveData(data);

        // In a real wired app you might also create a ticket automatically
        // store.create({ title: `Coupon ${code} used`, ... });

        res.end('Coupon applied (but order total may not be updated — known demo bug)');
      } else {
        res.end('Invalid coupon');
      }
    });
  } else if (req.url === '/_fwta/ticket' && req.method === 'POST') {
    // Example of wiring ticket creation
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const ticket = store.create(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: ticket.id }));
      } catch {
        res.writeHead(400);
        res.end('bad request');
      }
    });
  } else {
    res.statusCode = 404;
    res.end('not found');
  }
});

const PORT = process.env.PORT || 3456;
server.listen(PORT, () => {
  console.log(`Demo app (with FwTA wiring) running on http://localhost:${PORT}`);
  console.log('FwTA UI available at http://localhost:3888 (if FWTA_UI=1)');
});
