# FwTA Integration Guide (How Developers Wire It In)

FwTA is a **framework**, not magic. You (the developer) must integrate it into your Node.js / Express application.

This guide shows the recommended patterns.

## 1. Minimal Sidecar (Recommended for Most Teams)

Run FwTA as a separate process next to your app (Docker sidecar or systemd).

### Directory structure
```
your-app/
├── src/
├── package.json
└── .fwta/                 # created by FwTA
    ├── system-spec.md
    ├── tickets/
    └── proposals/
```

### Run the auditor periodically or on deploy
```bash
# In your Dockerfile or deploy script
npx fix-with-ticket-agent audit /app
```

### Run the agent worker
```bash
# Background process or cron
fwta agent /app --poll 300   # every 5 minutes
```

### Expose ticket creation (optional but powerful)
Add a simple endpoint in your app so support systems or the public can file tickets:

```js
// routes/fwta.js
import { TicketStore } from 'fix-with-ticket-agent/src/tickets/store.js';

export function mountFwtaTickets(app, basePath = '/_fwta') {
  const store = new TicketStore(process.cwd());

  app.post(`${basePath}/ticket`, (req, res) => {
    const ticket = store.create({
      customer: req.body.email,
      title: req.body.title,
      description: req.body.description,
      repro: req.body.repro
    });
    res.json({ id: ticket.id });
  });
}
```

Then in your main app:
```js
import { mountFwtaTickets } from './routes/fwta.js';
mountFwtaTickets(app);
```

### Mount the UI (for internal use)
```js
import { startServer } from 'fix-with-ticket-agent/src/server.js';

if (process.env.NODE_ENV !== 'production' || process.env.FWTA_UI) {
  startServer(process.cwd(), 3888);
}
```

## 2. In-Process Library Usage (More Advanced)

You can call pieces directly:

```js
import { audit } from 'fix-with-ticket-agent/src/auditor.js';
import { TicketStore } from 'fix-with-ticket-agent/src/tickets/store.js';

// On startup or background job
await audit(process.cwd());

// When you receive a support ticket from your own system
const store = new TicketStore(process.cwd());
const ticket = store.create({ ... });

// Later, an LLM or worker can call the agent logic
// (the agent entrypoint is currently CLI-first; library usage coming)
```

## 3. Making the Agent Actually Run

The `fwta agent` command is the heart. In production you will usually run it as a worker:

```bash
# example worker script
while true; do
  for ticket in $(ls .fwta/tickets/*.json); do
    node src/index.js agent . $(basename $ticket .json)
  done
  sleep 60
done
```

In the future we will add a proper library API for this loop.

## 4. LLM Integration (How AI Agents Use FwTA)

See the root `AGENT.md` file. It is written specifically so future LLMs can discover and use FwTA.

Typical LLM workflow:

1. `fwta audit .`
2. Read `.fwta/system-spec.md`
3. File or pick up a ticket
4. Run `fwta agent . <id>`
5. Review the proposal in `.fwta/proposals/`
6. Apply the diff (git apply or manually)

## 5. Real Production Example (Patterns)

A typical real deployment looks like this:

- App runs on port 3000 (Express)
- FwTA UI on port 3888 (internal only)
- Auditor runs on every deploy + nightly
- Agent worker runs as a separate container or PM2 process
- Tickets created from your existing support form or Zendesk/HubSpot webhook → POST to `/_fwta/ticket`
- LLM (Claude / Grok / Cursor) is told: "Use FwTA. Start by auditing and reading the system spec."

## Security When Wiring

- Never give the FwTA process write access to production except inside `.fwta/`
- Run it as a low-privilege user
- Review all proposals before applying (this is the default)
- Use `.fwtaignore` to exclude sensitive directories from audit

## Next Steps for Robust Wiring

- Add FwTA to your `package.json` scripts:
  ```json
  "scripts": {
    "fwta:audit": "fwta audit .",
    "fwta:agent": "fwta agent ."
  }
  ```
- Docker example (sidecar) is in `docs/setup.md`
- For full "one-command" experience in the future we will provide a small Express plugin.

---

This document exists so that both humans and LLMs know exactly how to integrate FwTA instead of guessing.
