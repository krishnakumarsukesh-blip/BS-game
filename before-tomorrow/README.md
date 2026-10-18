# Before Tomorrow

A friendly notebook for University of Leicester biology students to pass practical tips from one lab group to the next. Notes are student contributions, not official instructions. The current practical brief and demonstrator always come first, especially for safety.

The live notebook starts with blank pages rather than invented examples. The demonstrator-notebook story in the site is a bit of atmosphere, not a claim that entries are real demonstrator quotations.

## Add notes

Edit `entries.js`:

1. Add a concept to `BT_CONCEPTS` if students would benefit from revisiting it.
2. Add the practical to `BT_PRACTICALS`, using a unique lower-case kebab-case ID and its module ID (`bs1030` or `bs1040`).
3. Add student-contributed records to `BT_ENTRIES`, linked to that practical.
4. Only describe a tip as course-checked when it has been checked against current course material. Set its year to the year it was shared.

Practical:

```js
{ id: "bs1030-practical-name", module: "bs1030", order: 2, title: "Practical name", concepts: ["concept-id"] }
```

Concept:

```js
{ id: "concept-id", label: "Concept label", note: "Short revision note.", revise_url: "" }
```

Common trip-up:

```js
{ id: "bs1030-practical-name-tip-1", type: "mistake", module: "bs1030", practical: "bs1030-practical-name", concepts: ["concept-id"], confidence: "single", year: 2026, priority: 1, error: "What can catch people out", consequence: "What may happen", cause: "Why it can happen", prevention: "A useful thing to try" }
```

Question:

```js
{ id: "bs1030-practical-name-why-1", type: "why", module: "bs1030", practical: "bs1030-practical-name", concepts: ["concept-id"], confidence: "checked", year: 2026, priority: 1, question: "Why is this step needed?", reason: "A short explanation checked against current course material." }
```

Tool:

```js
{ id: "bs1030-tool-name", type: "tool", module: "bs1030", practical: null, concepts: [], confidence: "personal", year: 2026, priority: 1, name: "Tool name", use_when: "When it is useful", why: "Why it helps", needed_by: "Before the relevant task", link: "", check_ai_policy: false }
```

Use `practical: null` only for a module-wide tool. Resource links must use HTTPS. Set `check_ai_policy` to `true` for AI-based tools.

## Tip labels

- `checked`: matches current course material or demonstrator advice.
- `several`: independently shared by more than one student.
- `single`: one student's experience.
- `personal`: a preference, not a rule.
- `outdated`: may need checking against this year's course.

## Keep notes useful

- Share practical details, not names or criticism of individuals.
- Keep one clear idea per note and write as if helping a friend prepare.
- Check factual and safety-related advice against current practical materials.
- Do not invent student experiences or present a story as a real quotation.

## Preview and publish

Open `index.html` in a browser. For full sharing support, use HTTPS or localhost. Add `?debug=1` to the page URL to check the content for data problems. Check the page on mobile and with a keyboard before publishing.

The companion is static, uses no accounts or analytics, and is linked from the game home page. Review course-specific notes and links at least once each academic year.
