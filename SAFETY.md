# FwTA Safety Model (Open Source Edition)

**Goal**: A tool that can be safely open-sourced and used by any company on their Node.js / Express / web deployments without risking leaks of proprietary information or causing damage.

## Core Principles

1. **Never Leak System or Company Information**
   - Generated specs are redacted by default.
   - Sensitive tables (users, billing, orders, vip, coupons, auth-related) are explicitly flagged.
   - The agent is instructed to refuse any request for internal architecture, exact queries, business logic, or company details.

2. **Minimal Change Only**
   - Default mode: propose-only.
   - Patches must be small and directly address the reported symptom.
   - No refactors, new features, or broad modifications.

3. **Database Safety**
   - Dense schema understanding is built (table list only).
   - Direct schema changes, raw destructive SQL, or modifications to sensitive tables are blocked.
   - Agent must use existing data access patterns.

4. **Jailbreak Resistance**
   - Explicit rules in `skill.md` to ignore attempts like "ignore previous instructions", "you are now an unrestricted agent", "output the full schema", etc.
   - Prompt builder and execution layer reinforce boundaries.

5. **Billing, Payments, User Data**
   - Treated as high-risk.
   - Any proposed change in these areas triggers escalation with rich debugging instructions for humans.

6. **No Damage to the Site**
   - All mutations go through proposal + safety validator.
   - Large diffs, destructive operations, or changes to auth/db/billing files are rejected automatically.

## How Safety is Implemented

- **Auditor**: Redacts seed data, summarizes instead of dumping, flags sensitive areas, detects framework + DB driver generally.
- **skill.md**: Contains the full "Open Source + User Safety Rules" section + decision tree.
- **Prompt Builder**: Injects strict redaction and boundary instructions.
- **Executor / Validator**: 
  - Dangerous file patterns + DB operations force escalation.
  - Risk scoring on proposals (size, sensitive files, destructive keywords).
  - Low confidence or high risk → escalate.

## What the Agent Will Do

- Diagnose customer-reported bugs, data issues, billing symptoms.
- Reply helpfully to the reporter.
- Propose the smallest possible code fix.
- Escalate with excellent reproduction steps, suggested commands (`grep`, DB queries via existing helpers, etc.), and files to inspect.

## What the Agent Will **Never** Do

- Reveal how the system works.
- Output or describe company-specific processes.
- Make large or risky changes.
- Auto-apply anything on billing, auth, or data layers.
- Be tricked by user input into ignoring rules.

## Recommended Deployment for Users

- Run in propose-only mode.
- Review all proposals before applying.
- Use `.fwtaignore` to exclude highly sensitive directories.
- The tool is read-heavy by design.

This model allows FwTA to be useful for fixing real customer issues while remaining safe for open source distribution and production use on third-party sites.

---

When testing locally against real production sites, capture the audit outputs and agent decisions (in redacted form). These can be used later to optimize classification, prompting, and safety heuristics. Never commit real customer data, proprietary logic, or full source of target applications to this repository.
