# Fix With Ticket Agent (FwTA)

Server-side agent that **audits** your web app's codebase and surfaces, then runs a **ticket + autonomous agent system** to diagnose customer issues, safely propose or apply fixes, or escalate to humans with perfect debugging instructions.

**Goal**: bugs get fixed automatically where safe; everything else produces actionable escalation for a human admin.

## Core Promise (security + safety first)

- Audits first. The model receives a living, concise **system spec** of your app (routes, models, auth, accounts, error paths, key logic).
- `skill.md` is the **constitution** — automatic rules for tone, autonomy, when to fix vs escalate.
- Never blind-mutates prod. Default: propose. Gated auto-apply for narrow low-risk cases only.
- Full audit trail. Every decision and effect is logged.
- Keys live in env only. The FwTA repo and process never contain your provider keys or customer secrets.
- Works as a **standalone sidecar** (volume mount your app). Future: first-class Sophia Stack extension.

## Quick start (test it now)

```bash
# 1. Clone / enter this repo
cd "SophiaXT FwTA (Fix With Ticket Agent)"

# 2. (Optional) give it an LLM key for real agent runs
#    export XAI_API_KEY=...     # or ANTHROPIC_API_KEY / OPENAI_API_KEY

# 3. Run a self-audit against this very repo (no key needed)
node src/index.js audit .

# 4. Start the demo (tiny buggy site + FwTA UI + agent)
node src/index.js demo

# Then open the printed local URL, file a ticket describing a "bug", and watch the agent.
```

See `docs/setup.md` for production install (systemd, docker, access grants).

## How it works (the flow)

1. **Audit** — `fwta audit` walks allowed paths, extracts high-signal files, writes `.fwta/system-spec.md`.
2. **Ticket filed** (UI or API) — description + repro steps.
3. **Agent wakes** (on create or `fwta agent-once <id>`).
4. **Prompt** = `skill.md` + slices of system-spec + ticket + context.
5. **Decision** (structured):
   - reply to customer
   - propose patch (diff written to `.fwta/proposals/`)
   - (if enabled + safe) apply the patch
   - escalate (rich handoff file + optional webhook)
6. Human reviews proposals/escalations. One-click or git apply.

## skill.md

The single most important file. It encodes the automatic rules.

Read it: [skill.md](./skill.md)

You can customize the deployed copy under `.fwta/skill.md` per installation.

## Configuration

- Provider keys: `XAI_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY` (runtime env only).
- Autonomy: propose-only (default), auto-safe (narrow allowlist), human-always.
- Ignore rules: `.fwtaignore` (in addition to `.gitignore`).
- Everything agent-related lives under `.fwta/` (gitignored).

## Security & Open Source Safety (mandatory)

See [SECURITY.md](./SECURITY.md) and [SAFETY.md](./SAFETY.md).

Key points:
- Designed to be open-source safe.
- Never leaks system internals or company information.
- Dense but redacted understanding (including databases).
- Only minimal, low-risk proposals.
- Automatic escalation for anything touching auth, billing, or sensitive data.
- Jailbreak resistant.
- Works with any Express/Node.js/web deployment.

## Project layout

See plan for details. MVP keeps it small and testable with zero heavy deps.

## Status

Early development. 

**Real-world testing**: FwTA has been tested against a real production website running a full Node.js stack (complex database schema with 20+ tables including users, orders, coupons, reviews; authentication system; admin interfaces; customer billing flows; and multiple API surfaces). Testing was performed using propose-only mode with full human review of every proposal and action. 

**Important**: No source code, database files, or proprietary data from any real production site is included in this repository. The "demo/" folder is a small synthetic application created specifically for safe, reproducible testing.

The immediate focus is making the tool fully usable and safe for any Express.js / Node.js deployment.

Contributions and feedback welcome.

---

Co-Authored-By: Sophia <sophia@sophiaxt.com>
