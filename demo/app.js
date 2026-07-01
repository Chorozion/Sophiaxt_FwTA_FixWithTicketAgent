// Small realistic demo Express-style site for FwTA testing
// This is a safe, minimal synthetic app (not a real production site).
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dataFile = join(process.cwd(), 'demo', 'data.json');

function loadData() {
  if (!existsSync(dataFile)) {
    const initial = {
      products: [{ id: 1, name: "Item A", price: 10 }, { id: 2, name: "Item B", price: 25 }],
      orders: [],
      reviews: [],
      coupons: [{ code: "SAVE10", discount: 10, active: true }]
    };
    writeFileSync(dataFile, JSON.stringify(initial, null, 2));
  }
  return JSON.parse(readFileSync(dataFile, 'utf8'));
}

function saveData(data) {
  writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  const data = loadData();

  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('content-type', 'text/html');
    res.end(`<html><head><title>Demo Store</title></head>
<body>
<h1>Demo Store</h1>
<p>Cart total calculation may have issues.</p>
<form action="/apply-coupon" method="post">
  <input name="code" placeholder="Coupon code">
  <button>Apply</button>
</form>
</body></html>`);
  } else if (req.url === '/apply-coupon' && req.method === 'POST') {
    // Intentionally buggy coupon logic for testing FwTA
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const code = params.get('code');
      const coupon = data.coupons.find(c => c.code === code && c.active);
      if (coupon) {
        // BUG: doesn't actually update any order total
        data.reviews.push({ type: 'coupon-used', code, ts: Date.now() });
        saveData(data);
        res.end('Coupon applied (but total not updated - known data bug)');
      } else {
        res.end('Invalid coupon');
      }
    });
  } else if (req.url === '/reviews' && req.method === 'POST') {
    // Simple review endpoint
    res.end('Review received');
  } else {
    res.statusCode = 404;
    res.end('not found');
  }
});

server.listen(3456, () => {
  console.log('Demo site running on http://localhost:3456 (safe synthetic app for FwTA testing)');
});
