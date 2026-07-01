import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function executeAction(actionResult, { fwtaDir, ticket, targetDir }) {
  const proposalsDir = ensureDir(join(fwtaDir, 'proposals'));
  const escalationsDir = ensureDir(join(fwtaDir, 'escalations'));

  const results = [];

  if (!actionResult || typeof actionResult !== 'object') {
    return [{ type: 'error', message: 'Invalid action result' }];
  }

  const { action, confidence = 0, rationale = '', reply_text = '', patch, escalation } = actionResult;

  // === Safety Guardrails ===
  const dangerousPatterns = [
    /db\.js/i, /schema/i, /auth/i, /payment/i, /billing/i, /coupon/i, /order/i, /user/i, /vip/i
  ];

  if (patch && patch.file) {
    const file = patch.file.toLowerCase();
    const isDangerous = dangerousPatterns.some(p => p.test(file));
    if (isDangerous && confidence < 0.95) {
      // Force escalation instead of patch
      return executeAction({
        action: "escalate",
        confidence: confidence,
        rationale: "Attempted change to sensitive file: " + patch.file,
        escalation: {
          title: "Sensitive file change blocked",
          repro_steps: ticket.repro || "See original ticket",
          suggested_commands: ["Review the proposed change manually"],
          files_to_inspect: [patch.file],
          notes_for_human: "The agent wanted to change a sensitive file (" + patch.file + "). This was automatically escalated for safety. " + rationale
        }
      }, { fwtaDir, ticket, targetDir });
    }
    if (file.includes('db') || file.includes('schema') || file.includes('migration')) {
      // Never allow DB changes via patch in normal flow
      return executeAction({
        action: "escalate",
        confidence: 0.9,
        rationale: "Database schema or data layer change requested",
        escalation: {
          title: "Database change requested - requires human",
          repro_steps: "See ticket",
          suggested_commands: ["Manual review of data layer required"],
          files_to_inspect: [patch.file],
          notes_for_human: "Direct changes to database files are blocked for safety. " + rationale
        }
      }, { fwtaDir, ticket, targetDir });
    }
  }

  // === Explicit Safe Proposal Validator ===
  function validateProposalSafety(actionResult, ticket) {
    let risk = 0;
    let reasons = [];
    if (actionResult.patch) {
      const f = (actionResult.patch.file || '').toLowerCase();
      if (f.includes('db') || f.includes('auth') || f.includes('payment') || f.includes('coupon') || f.includes('order')) {
        risk += 50;
        reasons.push('touches sensitive data/billing/auth area');
      }
      if (actionResult.patch.diff && actionResult.patch.diff.length > 800) {
        risk += 30;
        reasons.push('large diff size');
      }
      if (/drop|delete|truncate|alter|migration/i.test(actionResult.patch.diff || '')) {
        risk += 70;
        reasons.push('contains destructive DB operation');
      }
    }
    if (actionResult.confidence < 0.6) {
      risk += 20;
      reasons.push('low confidence');
    }
    const isSafe = risk < 40;
    return { isSafe, risk, reasons };
  }

  const validation = validateProposalSafety(actionResult, ticket);
  if (!validation.isSafe && action === 'propose_patch') {
    results.push({ type: 'safety-block', risk: validation.risk, reasons: validation.reasons });
    return executeAction({
      action: "escalate",
      confidence: actionResult.confidence || 0.5,
      rationale: `Proposal blocked by safety validator (risk ${validation.risk}): ${validation.reasons.join(', ')}`,
      escalation: {
        title: "High-risk proposal blocked - " + (actionResult.patch ? actionResult.patch.file : 'unknown'),
        repro_steps: ticket.repro || "See ticket",
        suggested_commands: ["Human review required before any change"],
        files_to_inspect: actionResult.patch ? [actionResult.patch.file] : [],
        notes_for_human: "Automated safety validator rejected the patch. Reasons: " + validation.reasons.join('; ') + ". " + (actionResult.rationale || '')
      }
    }, { fwtaDir, ticket, targetDir });
  }

  // Always record the decision
  results.push({ type: 'decision', action, confidence, rationale });

  if (reply_text) {
    // For now just log it to the ticket history conceptually
    results.push({ type: 'reply', text: reply_text });
  }

  if ((action === 'propose_patch' || action === 'apply_patch') && patch) {
    const filename = `${ticket.id || Date.now()}.patch`;
    const patchPath = join(proposalsDir, filename);

    let patchContent = '';
    if (patch.diff) {
      patchContent = patch.diff;
    } else {
      patchContent = `--- Suggested change for ${patch.file}\n+++ \n@@\n${patch.description || JSON.stringify(patch, null, 2)}\n`;
    }

    writeFileSync(patchPath, patchContent);
    results.push({ type: 'proposal', path: patchPath, risk: patch.risk || 'unknown' });
  }

  if (action === 'escalate' && escalation) {
    const escPath = join(escalationsDir, `${ticket.id || Date.now()}.md`);
    const content = `# Escalation for ${ticket.id}

**Ticket:** ${ticket.id} — ${ticket.title || ticket.description?.slice(0,60)}
**Confidence:** ${confidence}

## Rationale
${rationale}

## For Human

### Reproduction
${escalation.repro_steps || ticket.repro || 'See ticket'}

### Suggested Commands
${(escalation.suggested_commands || []).map(c => '- `' + c + '`').join('\n')}

### Files to Inspect
${(escalation.files_to_inspect || []).join('\n')}

### Notes
${escalation.notes_for_human || ''}

---
Generated by FwTA test agent simulation.
`;
    writeFileSync(escPath, content);
    results.push({ type: 'escalation', path: escPath });
  }

  return results;
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
  return p;
}
