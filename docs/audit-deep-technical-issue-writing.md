# /audit — Deep Technical Issue Writing Gate

Status: required addendum for `/audit`.

Use this document before creating a GitHub issue or `/delivery` handoff from `/audit`.

## Core rule

An audit issue must be technical enough that another agent can implement the fix without rediscovering the whole codebase.

Do not create vague issues like “improve mobile UX” or “fix cabinet”. The issue must map symptoms to likely files, components, state/data paths, and verification steps.

## Required code-trace chain

Before writing the issue, inspect and document the likely chain:

```txt
route/page -> layout shell -> visible component -> child component -> state/store -> data/API/persistence -> formatting/rendering -> styles/responsive rules -> tests/checks
```

For each inspected file, record:

```txt
File:
Why relevant:
What it controls:
Evidence found:
Risk if changed:
```

## Required issue sections

Every `/audit` GitHub issue must include:

```md
## Technical code trace
| Layer | File/function/component | Evidence | What likely needs to change | Risk |
|---|---|---|---|---|

## Confirmed vs suspected
### Confirmed from code
- ...

### Suspected / needs verification
- ...

## Implementation map
| Step | File/function/component | Change | Why | Verification |
|---|---|---|---|---|

## Do-not-touch
- Auth boundaries
- Production data
- Unrelated routes/components
- Existing saved/history data

## Verification plan
- Build/check commands
- Route(s) to open
- Mobile viewport
- Desktop viewport
- Data/auth-safe proof
- Regression checks

## Ready-to-run /delivery prompt
/delivery
Task:
...
```

## Evidence standard

Use labels:

- `CODE VERIFIED` — actual file/function inspected.
- `RUNTIME VERIFIED` — checked via local/live endpoint/screenshot/tool.
- `LIKELY` — inferred from names/imports but not fully verified.
- `NOT VERIFIED` — unknown or blocked.

Do not present guesses as facts.

## Handoff quality bar

The final `/delivery` prompt must include:

- repo and local path if known;
- exact target branch suggestion;
- route/page/component target;
- files/functions to inspect first;
- root-cause hypothesis ranked by confidence;
- implementation steps in order;
- do-not-touch rules;
- tests/checks;
- mobile/desktop/design proof when UI is affected;
- auth-safe proof rules when relevant.

If code access was unavailable, say so clearly and produce an issue marked `PARTIAL_CODE_LIMITATION` instead of pretending the code was inspected.
