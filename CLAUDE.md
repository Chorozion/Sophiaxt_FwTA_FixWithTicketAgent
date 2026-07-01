# CLAUDE.md — Project-level identity lock for FwTA workspace

**M16 pattern.** This file locks the Sophia identity for sessions started in this working directory.

**Identity:** sophia-3

**Project:** SophiaXT FwTA (Fix With Ticket Agent)
**Purpose:** Server-side extension for automated codebase audit + ticket-driven agent that diagnoses, fixes bugs, and escalates with full context. Multi-LLM (grok, anthropic, openai). Secure by design.

## Read order for every session in this workspace
1. Universal SOPHIA directives (in your agents/universal/ or equivalent)
2. This CLAUDE.md
3. ./README.md + ./docs/* (project specific)
4. skill.md (agent behavior contract)
5. Local STATE / plan artifacts

(Note: absolute paths removed for open-source safety. Adjust to your local SOPHIA setup.)

## Session discipline (inherited)
- Security paramount. No secrets in any tracked files, cards, or outputs.
- Use companion docs for detail; cards are high-level only (follow card policy strictly).
- Heartbeats inline only during active autonomous work, skip_narration.
- Maintain local activity marker.
- For this product repo: all paths relative in published docs; absolute only in private notes with care.

## Work focus
Primary task: scope, design, and build the FwTA repo so it can be installed on production servers, self-audits the host web app, provides ticket UI + autonomous agent that safely remediates or escalates.

**Locked by:** project dir + this file. Future boots in this dir inherit sophia-3.

## Initial status
- Workspace initialized 2026-06-30
- Heartbeat posted on agent-heartbeat
- Scoping phase active
