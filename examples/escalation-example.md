# Escalation Example (produced by FwTA)

**Ticket:** t-demo-001  
**Autonomy:** propose-only  
**Agent confidence:** 0.87

## Summary for human
Cart total calculation is missing tax and rounding. Homepage is missing `<title>`.

## Files to inspect
- demo/app.js (the HTML response builder)

## Exact repro
1. GET /
2. Observe `<h1>Demo</h1>` and text "Cart: 42.0 (bug: no tax)"

## Suggested human commands
```bash
curl -i http://localhost:3456/
grep -n "Cart" demo/app.js
```

## Notes
The auditor spec captured the literal buggy string. A minimal patch would add a proper title and compute total with tax.

**Next action for human:** review the proposal in .fwta/proposals/ or apply manually.
