"use strict";

const BT_CONFIG = { suggest_url: "" };

const BT_MODULES = [
  { id: "bs1030", title: "BS1030" },
  { id: "bs1040", title: "BS1040" }
];

const BT_PRACTICALS = [
  {
    id: "bs1030-example",
    module: "bs1030",
    order: 1,
    title: "[PLACEHOLDER] Example practical",
    concepts: ["example-concept"],
    placeholder: true
  }
];

const BT_CONCEPTS = [
  {
    id: "example-concept",
    label: "[PLACEHOLDER] Example concept",
    note: "[PLACEHOLDER] Example revision note.",
    revise_url: ""
  }
];

const BT_ENTRIES = [
  {
    id: "bs1030-example-mistake-1",
    type: "mistake",
    module: "bs1030",
    practical: "bs1030-example",
    concepts: ["example-concept"],
    confidence: "checked",
    year: 2026,
    priority: 1,
    placeholder: true,
    error: "[PLACEHOLDER] Example error one",
    consequence: "[PLACEHOLDER] What could happen after example error one.",
    cause: "[PLACEHOLDER] Why example error one could happen.",
    prevention: "[PLACEHOLDER] How to avoid example error one."
  },
  {
    id: "bs1030-example-mistake-2",
    type: "mistake",
    module: "bs1030",
    practical: "bs1030-example",
    concepts: ["example-concept"],
    confidence: "several",
    year: 2026,
    priority: 2,
    placeholder: true,
    error: "[PLACEHOLDER] Example error two",
    consequence: "[PLACEHOLDER] What could happen after example error two.",
    cause: "[PLACEHOLDER] Why example error two could happen.",
    prevention: "[PLACEHOLDER] How to avoid example error two."
  },
  {
    id: "bs1030-example-mistake-3",
    type: "mistake",
    module: "bs1030",
    practical: "bs1030-example",
    concepts: [],
    confidence: "single",
    year: 2026,
    priority: 3,
    placeholder: true,
    error: "[PLACEHOLDER] Example error three",
    consequence: "[PLACEHOLDER] What could happen after example error three.",
    cause: "[PLACEHOLDER] Why example error three could happen.",
    prevention: "[PLACEHOLDER] How to avoid example error three."
  },
  {
    id: "bs1030-example-mistake-4",
    type: "mistake",
    module: "bs1030",
    practical: "bs1030-example",
    concepts: [],
    confidence: "outdated",
    year: 2023,
    priority: 4,
    placeholder: true,
    error: "[PLACEHOLDER] Example error four",
    consequence: "[PLACEHOLDER] What could happen after example error four.",
    cause: "[PLACEHOLDER] Why example error four could happen.",
    prevention: "[PLACEHOLDER] How to avoid example error four."
  },
  {
    id: "bs1030-example-why-1",
    type: "why",
    module: "bs1030",
    practical: "bs1030-example",
    concepts: ["example-concept"],
    confidence: "checked",
    year: 2026,
    priority: 1,
    placeholder: true,
    question: "[PLACEHOLDER] Example question one?",
    reason: "[PLACEHOLDER] Example reason for question one."
  },
  {
    id: "bs1030-example-why-2",
    type: "why",
    module: "bs1030",
    practical: "bs1030-example",
    concepts: [],
    confidence: "single",
    year: 2026,
    priority: 2,
    placeholder: true,
    question: "[PLACEHOLDER] Example question two?",
    reason: "[PLACEHOLDER] Example reason for question two."
  },
  {
    id: "bs1030-example-tool-practical",
    type: "tool",
    module: "bs1030",
    practical: "bs1030-example",
    concepts: [],
    confidence: "personal",
    year: 2026,
    priority: 1,
    placeholder: true,
    name: "[PLACEHOLDER] Practical tool",
    use_when: "[PLACEHOLDER] When to use the practical tool.",
    why: "[PLACEHOLDER] Why the practical tool may help.",
    needed_by: "[PLACEHOLDER] Before the example practical",
    link: "",
    check_ai_policy: true
  },
  {
    id: "bs1030-example-tool-module",
    type: "tool",
    module: "bs1030",
    practical: null,
    concepts: [],
    confidence: "personal",
    year: 2026,
    priority: 2,
    placeholder: true,
    name: "[PLACEHOLDER] Module-wide tool",
    use_when: "[PLACEHOLDER] When to use the module-wide tool.",
    why: "[PLACEHOLDER] Why the module-wide tool may help.",
    needed_by: "[PLACEHOLDER] Before a relevant module task",
    link: "",
    check_ai_policy: false
  }
];
