# FwTA Architecture

See the approved plan (session plan.md) for the full rationale.

High level:
- Audit → living system-spec (Markdown + future index)
- Tickets + minimal UI
- LLM (multi-provider, OpenAI-compat for Grok) + skill.md as the constitution
- Structured actions only
- Safe propose / gated apply + excellent escalation

Non-destructive by default (inspired by owner-safe-editing in sibling projects).

Everything the agent touches stays under `.fwta/` except when the operator explicitly enables narrow auto-apply.

Co-Authored-By: Sophia <sophia@sophiaxt.com>
