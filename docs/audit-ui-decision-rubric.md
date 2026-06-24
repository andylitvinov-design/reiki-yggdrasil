# /audit-ui — Decision Rubric And Output Template

Status: shared scoring and output standard for `/audit-ui`.

Use this after `docs/audit-ui-expert-frameworks.md` and before choosing the recommended concept.

## 1. UI anti-pattern checklist

Flag these when present:

- unclear primary action;
- too many equal-priority buttons/chips/tabs;
- duplicated navigation rows;
- debug-looking or raw technical UI;
- dense text blocks on mobile;
- first screen has no clear focal point;
- accidental cut of next section at bottom of mobile screen;
- cramped top area;
- weak contrast or weak typography hierarchy;
- cards with inconsistent spacing/radius/shadows;
- hidden state changes after save/click;
- empty/loading/error states that look broken;
- filters or tabs without clear active state;
- desktop layout stretched or under-composed;
- mobile layout that feels like squeezed desktop.

## 2. Concept scoring rubric

Score each top concept from 1 to 5:

```txt
clarity
visual quality
mobile first-screen quality
CTA/action clarity
information architecture
accessibility basics
implementation effort
regression risk
product fit
```

For effort and risk, higher score means better:

```txt
5 = low effort / low risk
1 = high effort / high risk
```

## 3. Required comparison table

Every issue should include:

```md
| Concept | Clarity | Visual | Mobile | CTA | IA | A11y | Effort | Risk | Product fit | Total | Verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| A | | | | | | | | | | | |
| B | | | | | | | | | | | |
| C | | | | | | | | | | | |
```

## 4. Sketch output template

For each of the 3 concepts, provide:

```md
### Concept A — <name>

Core idea:

Best for:

Layout sketch:
```txt
[Top / hero]
[Primary content]
[Secondary actions]
[Footer / next step]
```

Mobile behavior:

Desktop behavior:

Main CTA:

What changes visually:

Implementation notes:

Risks:
```

If visual generation tools are available and the user asked for visual sketches, create 3 low/mid-fidelity mockup images. If not, use the layout sketch template above.

## 5. Recommendation rule

Choose the concept with the best balance of:

```txt
highest user clarity + strongest visual quality + acceptable implementation effort + lowest regression risk
```

Do not automatically choose the most visually ambitious concept if it risks breaking existing flows.

Do not choose the lowest-effort concept if it does not solve the core UI problem.

## 6. Final chat template

When issue exists, chat output should be short:

```txt
STATUS: AUDIT_UI_COMPLETE

3 best concepts:
1. Concept A — ...
2. Concept B — ...
3. Concept C — ...

Recommended: Concept X
Why: ...

Sketches:
- A: ...
- B: ...
- C: ...

GitHub issue:
<url>

Prompt:
/delivery
Task:
Implement Concept X from <url>. Keep Concepts A/B/C as alternatives if user chooses another option. Follow the UI decision rubric, design quality gate, and do not touch unrelated flows.
```

## 7. Hard rule

`/audit-ui` is decision support. It should help the user choose between 3 design directions before coding.

Do not implement until the user explicitly invokes `/delivery` or chooses a concept for implementation.
