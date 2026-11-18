import test from "node:test";
import assert from "node:assert/strict";
import * as PdfMcqCore from "../pdf-mcq-core.mjs";

const pages = [
  {
    pageNumber: 3,
    text: [
      "Photosynthesis converts light energy into chemical energy in plants and algae. Chlorophyll absorbs light within photosynthetic tissues.",
      "Cellular respiration releases energy from glucose through a series of biochemical reactions. Mitochondria perform cellular respiration in many eukaryotic cells.",
      "Osmosis describes the movement of water across a selectively permeable membrane. Water movement depends on differences in solute concentration.",
      "Enzymes are biological catalysts that increase reaction rates without being consumed. Enzyme activity changes with temperature and pH."
    ].join(" ")
  }
];

test("rejects non-PDF files and files over the size limit", () => {
  assert.throws(() => PdfMcqCore.assertPdfFile({
    name: "notes.txt",
    type: "text/plain",
    size: 12,
    async arrayBuffer() { return new ArrayBuffer(12); }
  }), /does not look like a PDF/);
  assert.throws(() => PdfMcqCore.assertPdfFile({
    name: "lecture.pdf",
    type: "application/pdf",
    size: PdfMcqCore.MAX_FILE_BYTES + 1,
    async arrayBuffer() { return new ArrayBuffer(0); }
  }), /15 MB or smaller/);
});

test("extracts page text and destroys the PDF document", async () => {
  const calls = [];
  const pdfjs = {
    getDocument({ data }) {
      assert.equal(data.byteLength, 2);
      return {
        promise: Promise.resolve({
          numPages: 2,
          async getPage(pageNumber) {
            return {
              async getTextContent() {
                return { items: [{ str: `Text on page ${pageNumber}` }, { str: "continues." }] };
              }
            };
          },
          async destroy() { calls.push("destroy"); }
        })
      };
    }
  };
  const file = {
    name: "lecture.pdf",
    type: "application/pdf",
    size: 2,
    async arrayBuffer() { return new Uint8Array([1, 2]).buffer; }
  };
  assert.deepEqual(await PdfMcqCore.extractPdfPages(pdfjs, file), [
    { pageNumber: 1, text: "Text on page 1 continues." },
    { pageNumber: 2, text: "Text on page 2 continues." }
  ]);
  assert.deepEqual(calls, ["destroy"]);
});

test("enforces the page limit and still releases the PDF document", async () => {
  let destroyed = false;
  const pdfjs = {
    getDocument() {
      return {
        promise: Promise.resolve({
          numPages: PdfMcqCore.MAX_PAGES + 1,
          async destroy() { destroyed = true; }
        })
      };
    }
  };
  await assert.rejects(PdfMcqCore.extractPdfPages(pdfjs, {
    name: "large.pdf",
    type: "application/pdf",
    size: 12,
    async arrayBuffer() { return new ArrayBuffer(12); }
  }), /limit is 100/);
  assert.equal(destroyed, true);
});

test("generates four-option, source-cited drafts with one marked answer", () => {
  const questions = PdfMcqCore.generateQuestions(pages, {
    module: "BS1030",
    topic: "Cell biology",
    count: 4,
    difficulty: "medium",
    sourceFilename: "lecture.pdf"
  }, () => 0.4);
  assert.equal(questions.length, 4);
  for (const question of questions) {
    assert.equal(PdfMcqCore.isValidQuestion(question), true);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map(option => option.toLowerCase())).size, 4);
    assert.ok(question.sourceEvidence.toLowerCase().includes(question.options[question.correctOption].toLowerCase()));
    assert.ok(question.stem.includes("_____"));
    assert.doesNotMatch(question.stem.toLowerCase(), new RegExp(`\\b${question.options[question.correctOption].toLowerCase()}\\b`));
    assert.equal(question.reviewStatus, "pending");
    assert.equal(question.pageNumber, 3);
    assert.ok(question.distractorExplanations.every(Boolean));
  }
  const gameQuestion = PdfMcqCore.toGameQuestion(questions[0]);
  assert.equal(gameQuestion.length, 5);
  assert.equal(gameQuestion[2].length, 4);
  assert.match(gameQuestion[0], /^BS1030 · PDF · Cell biology$/);
  assert.match(gameQuestion[4], /page 3/);
});

test("rejects scanned, short, ungroundable and invalid-topic inputs", () => {
  assert.throws(() => PdfMcqCore.generateQuestions([{ pageNumber: 1, text: "" }], { topic: "Biology", count: 1 }), /image-only/);
  assert.throws(() => PdfMcqCore.generateQuestions([{ pageNumber: 1, text: "A short note." }], { topic: "Biology", count: 1 }), /not enough readable/);
  assert.throws(() => PdfMcqCore.generateQuestions(pages, { topic: "", count: 1 }), /Enter a topic/);
  assert.throws(() => PdfMcqCore.generateQuestions(pages, { topic: "Biology", count: 31 }), /between 1 and 30/);
});

test("validates persisted questions and detects repeated stems", () => {
  const question = PdfMcqCore.generateQuestions(pages, {
    topic: "Cell biology",
    count: 1,
    sourceFilename: "lecture.pdf"
  })[0];
  assert.deepEqual(PdfMcqCore.readSavedQuestions(JSON.stringify([question])), [question]);
  assert.throws(() => PdfMcqCore.readSavedQuestions("{"), /unreadable/);
  assert.throws(() => PdfMcqCore.readSavedQuestions(JSON.stringify([{ ...question, options: ["a"] }])), /invalid data/);
  assert.equal(PdfMcqCore.questionSignature(question.stem), PdfMcqCore.questionSignature(question.stem.toUpperCase()));
});

test("escapes PDF-derived evidence before it reaches the game's HTML feedback", () => {
  const question = PdfMcqCore.generateQuestions(pages, {
    topic: "Cell biology",
    count: 1,
    sourceFilename: "lecture.pdf"
  })[0];
  question.sourceEvidence = "<img src=x onerror=alert(1)> Photosynthesis converts light energy into chemical energy in plants and algae.";
  const gameQuestion = PdfMcqCore.toGameQuestion(question);
  assert.match(gameQuestion[4], /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(gameQuestion[4], /<img/);
});
