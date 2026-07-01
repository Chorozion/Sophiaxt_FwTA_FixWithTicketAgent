# Demo / Reference Wired App

This folder contains a **minimal reference implementation** showing how developers wire FwTA into a real Node.js application.

See `server.js` for the actual wiring points (audit on start, ticket creation endpoint, UI mounting).

## Run the reference app

```bash
node demo/server.js
# Visit http://localhost:3456
# Visit http://localhost:3888 for FwTA UI (set FWTA_UI=1)
```

## Test the full FwTA flow

```bash
node src/index.js audit demo
node src/index.js ticket demo test@example.com "Coupon not updating order total"
node src/index.js agent demo t-...
```

The bugs in this demo are intentional so LLMs + humans can exercise the audit + proposal + safety system.
