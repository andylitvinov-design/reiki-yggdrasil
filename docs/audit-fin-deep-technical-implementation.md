# /audit-fin — Deep Technical Implementation Analysis

Required addendum for `/audit-fin`.

Goal: find where a number first becomes wrong in implementation.

Trace this chain before writing an issue:

```txt
visible value -> component -> state/selection -> data source -> parsing -> formula/helper -> aggregation -> hydration/cache -> formatting -> rendering -> tests
```

For finance projects also compare read-only production/debug evidence when available.

Every `/audit-fin` issue must include:

- numeric implementation trace;
- files/functions/components inspected;
- evidence for expected vs actual;
- first divergence layer;
- confirmed findings vs likely/unverified findings;
- implementation map;
- verification plan with deterministic input and expected output;
- ready-to-run `/delivery` prompt.

Use labels:

```txt
CODE VERIFIED
API VERIFIED
RUNTIME VERIFIED
DATA VERIFIED
LIKELY
NOT VERIFIED
```

Do not present guesses as facts.

The `/delivery` handoff must include exact files or APIs to inspect first, the selected first divergence layer, rejected hypotheses, protected areas not to touch, and deterministic verification data.
