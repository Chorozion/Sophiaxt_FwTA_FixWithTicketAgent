# Changelog

All notable changes to FwTA will be documented in this file.

## [Unreleased]

### Added
- `fwta init <target>` — auto-configures .fwta/, config, .fwtaignore, runs initial audit, and scaffolds wiring example.
- AGENT.md — dedicated instructions for LLMs and AI agents.
- docs/integration.md — concrete wiring patterns for developers.
- Reference wired demo (demo/server.js) showing real integration.
- Dense DB understanding in auditor (table extraction + sensitive flags).
- Robust safety: redaction, propose-only default, jailbreak resistance.
- Open-source safe posture matching SophiaXT standards.

### Changed
- README updated to match style of other Chorozion/SophiaXT repos (detailed sections, honest scope, tables, quickstart, architecture, limitations).
- CLI help and docs emphasize configuration and LLM discoverability.

## [0.1.0] - Initial

- Core framework: audit, ticket store, agent simulation, minimal UI.
- skill.md constitution.
- Safety.md, SECURITY.md.
- Synthetic demo for testing.

Co-Authored-By: Sophia <sophia@sophiaxt.com>
