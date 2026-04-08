---
name: waterfall-modeling
description: Model the distribution waterfall (European or American) to compute LP/GP splits given a hypothetical exit or actual distribution. Used by NAV calc for carry accrual and by capital-call-prep for distributions.
when_to_use: Distribution event, hypothetical exit modeling, GP carry accrual.
inputs: entity_id, distributable_amount_mm, scenario
outputs: tier-by-tier breakdown of LP and GP shares
version: 1.0.0
---

Supports European, American, deal-by-deal, and modified-American waterfalls. Reads the entity's `waterfallType` and the LPA terms from memory.
