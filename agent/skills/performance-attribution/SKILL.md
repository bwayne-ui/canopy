---
name: performance-attribution
description: Decompose period return into contribution by holding, sector, vintage, and currency. Used in LP letters and board decks to explain "why was the quarter what it was".
when_to_use: Quarterly LP letter prep, board deck, investor inquiry on a return number.
inputs: entity_id, period_start, period_end, dimensions[]
outputs: attribution table summing to total period return
version: 1.0.0
---

Dimensions supported: `holding`, `sector`, `vintage`, `currency`, `geography`. Multiple dimensions can be requested in one call.
