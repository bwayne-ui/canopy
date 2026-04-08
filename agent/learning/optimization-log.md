# Canopy Optimization Log

Append-only record of measured improvements. Each entry includes the metric, the before/after, and the change that produced it.

## Format

```
## YYYY-MM-DD — <change title>
**Metric:** <name>
**Before:** <value>
**After:** <value>
**Change:** <one-line summary, link to commit or proposal>
**Owner:** <human reviewer who approved>
```

---

## 2026-04-01 — Initial baseline
**Metric:** monthly-close cycle time (T-3 → T+1)
**Before:** ~5.5 business days (manual)
**After:** ~3.5 business days (with parallelized validator + reconciler)
**Change:** Adopted [agent/memory/playbooks/monthly-close.md](../memory/playbooks/monthly-close.md)
**Owner:** controller team
