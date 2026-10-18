# Before Tomorrow

A curated student notebook of field notes for the next cohort. Practical tips are grouped by **module → area → task**. Advice that applies across modules lives in the **Shared field guide**, so general study tips do not crowd the practical pages.

This is a read-only, static notebook. Visitors can browse and share the published pages, but there is no public submission form or note editor. Students can keep personal annotations in their own notes; published content is added by the maintainer.

## Add a task

Edit `entries.js`. Add tasks only when there is a useful topic to browse; not every practical or piece of coursework needs a page.

```js
{
  id: "bs1030-osmosis-practical",
  module: "bs1030",
  area: "practicals",
  order: 1,
  title: "Osmosis practical",
  description: "Optional short context shown on the task card.",
  concepts: []
}
```

Available areas are listed in `BT_AREAS`: `practicals`, `essays`, `assignments`, `graphs-data`, `calculations`, `software`, and `revision-exams`. Each task ID must be unique, lower-case kebab-case. Use module IDs `bs1030` or `bs1040` for module-specific advice, and `study-skills` for the shared field guide. `order` controls the task list order within that area. Add concepts to `BT_CONCEPTS` before referencing them.

## Add a note

Every note belongs to one task. Use a `note` for a helpful tip, common trip-up, workflow, or checklist:

```js
{
  id: "bs1030-osmosis-practical-label-tip",
  type: "note",
  module: "bs1030",
  area: "practicals",
  task: "bs1030-osmosis-practical",
  concepts: [],
  confidence: "personal",
  year: 2026,
  priority: 1,
  kind: "When the samples look alike",
  title: "Keep the sample identity with the result",
  body: "Set the scene, explain the easy-to-miss risk, and give a useful next step in a few clear sentences."
}
```

Other note types:

```js
{ id: "bs1030-osmosis-question-1", type: "why", module: "bs1030", area: "practicals", task: "bs1030-osmosis-practical", concepts: [], confidence: "checked", year: 2026, priority: 1, question: "Why is this step needed?", reason: "A short explanation checked against current course material." }
```

```js
{ id: "bs1030-osmosis-tool-1", type: "tool", module: "bs1030", area: "practicals", task: "bs1030-osmosis-practical", concepts: [], confidence: "personal", year: 2026, priority: 1, name: "Tool or resource", use_when: "When it is useful", why: "Why it helps", link: "", check_ai_policy: false }
```

Set `confidence` to `personal`, `checked`, or `outdated`. Use `personal` for a practical notebook tip; use `checked` only for content verified against current course material. Set the year the note was added. Resource links must use HTTPS. Keep tips focused on one useful idea, explain why it matters, avoid names or personal criticism, and never contradict current safety instructions.

The story frames the tips as clues left for the next cohort to clear the lab's special levels. It is playful folklore, not a claim that real students were harmed. Practical tips focus on judgement and easy-to-miss data-quality details rather than repeating the protocol. Cross-module writing, referencing, calculation, and revision advice belongs in the Shared field guide. To publish a new tip, the maintainer adds it to `BT_ENTRIES` in `entries.js` and deploys the site.

## Preview and validate

Open `index.html` in a browser. Add `?debug=1` to the URL to check data relationships and counts. Check navigation, task search, mobile layout, and keyboard access before publishing. The page is static and uses no accounts or analytics.
