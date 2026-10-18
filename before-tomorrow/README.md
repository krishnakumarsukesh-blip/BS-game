# Before Tomorrow

A small practical-preparation companion for University of Leicester biology students. Choose a practical to browse common mistakes, questions worth answering, useful tools, and concepts to revise.

Advice should be student-written, labelled by confidence, and is not official guidance. The practical handout, risk assessment, and demonstrator always take precedence.

## Preview

Open `index.html` in a browser. The page is static and does not need a server. For full browser share support, use HTTPS or localhost.

## Current content status

The included practical and advice are explicitly marked as fictional placeholders to demonstrate the page. They are not real student experiences or course advice. Do not remove their placeholder flags or present them as factual. Replace or remove the sample records when verified student contributions are available.

## Add a practical

Edit `entries.js`:

1. Add a concept to `BT_CONCEPTS` if it is useful.
2. Add a practical to `BT_PRACTICALS` with a unique lower-case kebab-case ID.
3. Add one or more records to `BT_ENTRIES`, linked to that practical.
4. Remove `"placeholder": true` only after replacing the sample with a real, checked contribution.

Practical template:

```js
{ id: "bs1030-practical-name", module: "bs1030", order: 2, title: "Practical name", concepts: ["concept-id"], placeholder: false }
```

Concept template:

```js
{ id: "concept-id", label: "Concept label", note: "Short revision note.", revise_url: "" }
```

Mistake template:

```js
{ id: "bs1030-practical-name-mistake-1", type: "mistake", module: "bs1030", practical: "bs1030-practical-name", concepts: ["concept-id"], confidence: "single", year: 2026, priority: 1, placeholder: false, error: "Short description of the error", consequence: "What happens", cause: "Why it happens", prevention: "How to avoid it" }
```

Question template:

```js
{ id: "bs1030-practical-name-why-1", type: "why", module: "bs1030", practical: "bs1030-practical-name", concepts: ["concept-id"], confidence: "checked", year: 2026, priority: 1, placeholder: false, question: "Why is this step needed?", reason: "Short explanation checked against course material." }
```

Tool template:

```js
{ id: "bs1030-tool-name", type: "tool", module: "bs1030", practical: null, concepts: [], confidence: "personal", year: 2026, priority: 1, placeholder: false, name: "Tool name", use_when: "When it is useful", why: "Why it helps", needed_by: "Before the relevant task", link: "", check_ai_policy: false }
```

Set `practical` to `null` only for a module-wide tool. Links must be HTTPS. Set `check_ai_policy` to `true` for AI-based tools.

## Confidence labels

- `checked`: matches course material or demonstrator advice.
- `several`: the same point was independently reported by multiple students.
- `single`: one student's experience.
- `personal`: a preference or productivity tip, not a rule.
- `outdated`: the course, practical, or software may have changed.

## Content safeguards

- Never name staff or students or criticise individuals.
- Never contradict safety instructions, the risk assessment, or the practical handout.
- Keep entries concise and about one specific idea.
- Check factual advice against the current practical material.
- Do not present invented or AI-generated advice as student experience.
- Keep the placeholder flag on examples until they have been replaced with real content.

## Validate and publish

Open `/before-tomorrow/?debug=1` after deployment (or `index.html?debug=1` locally). Fix all reported data problems and check the page on mobile and with a keyboard.

The page lives in its own folder and is linked from the main game. It uses no accounts, submission form, backend, or analytics. When the site is hosted from this repository's `main` branch, the route is `/before-tomorrow/`.

At least once each academic year, check practical names, review checked entries against current handouts, verify links, and remove outdated advice. Arrange a student maintainer before the current owner graduates.
