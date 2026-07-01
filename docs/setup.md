# Setup & Giving Access (the secure way)

## 1. Install / run

Options:
- Clone the repo and run with node.
- (Soon) Docker image.
- (Future) npm package.

## 2. Grant the agent access

**Recommended (container or dedicated user):**
- Mount or give read access only to the code you want audited.
- Give write **only** to a `.fwta` directory (or equivalent isolated volume).
- Never give write to the live application source unless you have reviewed the proposal and are doing the apply yourself.

Example docker-compose snippet (future):

```yaml
services:
  fwta:
    image: sophiaxt/fix-with-ticket-agent
    volumes:
      - /path/to/your/app:/app:ro          # read only
      - fwta-data:/app/.fwta               # agent writes here
    environment:
      - XAI_API_KEY=...
```

## 3. Configure autonomy

See `.fwta/config.json` (created on first run) or env.

Start with the default (`propose-only`).

## 4. .fwtaignore

Create a `.fwtaignore` at the root of the target (similar to .gitignore) for paths you explicitly do **not** want the auditor or agent to read.

## 5. Revocation

Stop the process and remove the mounted volume / change the OS permissions. All history remains in `.fwta/` for your review.

Co-Authored-By: Sophia <sophia@sophiaxt.com>
