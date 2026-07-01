# Getting Started with FwTA

This guide walks you through setting up and using Fix With Ticket Agent in a Node.js/Express project.

## 1. Install / Clone

Clone the repo or install via npm (once published):

```bash
git clone https://github.com/Chorozion/Sophiaxt_FwTA_FixWithTicketAgent.git
cd Sophiaxt_FwTA_FixWithTicketAgent
```

Or use npx for init without cloning the whole thing (recommended for new projects).

## 2. Configure with init

The magic command:

```bash
npx fix-with-ticket-agent init .
```

This:
- Creates `.fwta/` directory
- Sets up `config.json` with safe defaults (xai/grok by default)
- Creates `.fwtaignore`
- Runs initial audit to build `system-spec.md` (with DB understanding from your code)
- Scaffolds a wiring example file

## 3. Set your LLM keys

```bash
export XAI_API_KEY=your_grok_key
# or
export ANTHROPIC_API_KEY=your_claude_key
# or
export OPENAI_API_KEY=your_openai_key
```

Edit `.fwta/config.json` to change provider/model/autonomy if needed.

## 4. Basic usage

```bash
# Re-audit after changes
fwta audit .

# File a ticket (from CLI or your app's form)
fwta ticket . customer@example.com "Login fails for new users"

# Run the agent (in simulation here, or with real LLM)
fwta agent . t-1234567890

# Start the ticket UI for humans
fwta serve .
```

## 5. Wire into your app

See [docs/integration.md](./integration.md) for how to add ticket creation endpoints, run the agent as a worker, etc.

Example in the `demo/` folder.

## 6. Next

- Read [AGENT.md](../AGENT.md) if you're an LLM or using one.
- Customize `.fwta/skill.md` copy for your project's rules (optional).
- Review proposals before applying.
- Use in CI or as sidecar.

See the main README for more and [SAFETY.md](../SAFETY.md) for security model.

Contributions and feedback welcome!

Co-Authored-By: Sophia <sophia@sophiaxt.com>
