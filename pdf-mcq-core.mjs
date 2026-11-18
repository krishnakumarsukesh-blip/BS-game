const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_PAGES = 100;
const MAX_QUESTIONS = 30;
const STOP_WORDS = new Set(
  "about after again against also although always among another any are around because been before being between both but can could did does doing during each either enough every few for from further had has have having here how into its itself just may more most much must neither not once only other our out over same should since some such than that the their them then there these they this those through under until upon very was were what when where which while who will with within without would you your a an and as at be by do if in is it of on or per the to we".split(" ")
);

function assertPdfFile(file) {
  if (!file || typeof file.name !== "string" || typeof file.size !== "number") {
    throw new Error("Choose a PDF file to continue.");
  }
  if (typeof file.arrayBuffer !== "function") {
    throw new Error("This browser cannot read the selected file. Try a current browser.");
  }
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
    throw new Error("This file does not look like a PDF. Choose a .pdf file.");
  }
  if (file.size <= 0) throw new Error("The selected PDF is empty.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("PDFs must be 15 MB or smaller.");
  }
}

async function extractPdfPages(pdfjs, file) {
  assertPdfFile(file);
  if (!pdfjs || typeof pdfjs.getDocument !== "function") {
    throw new Error("The PDF reader did not load. Check your connection and try again.");
  }
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const document = await task.promise;
  try {
    if (!Number.isInteger(document.numPages) || document.numPages < 1) {
      throw new Error("The PDF does not contain any readable pages.");
    }
    if (document.numPages > MAX_PAGES) {
      throw new Error(`This PDF has ${document.numPages} pages; the limit is ${MAX_PAGES}.`);
    }
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map(item => typeof item.str === "string" ? item.str : "")
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      pages.push({ pageNumber, text });
    }
    return pages;
  } finally {
    await document.destroy();
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordsIn(text) {
  return text.match(/\b[A-Za-z][A-Za-z0-9-]{2,}\b/g) || [];
}

function collectTerms(text) {
  const counts = new Map();
  for (const word of wordsIn(text)) {
    const normalized = word.toLocaleLowerCase();
    if (STOP_WORDS.has(normalized) || word.length > 30) continue;
    const entry = counts.get(normalized) || { term: word, count: 0, acronym: false };
    entry.count += 1;
    entry.acronym ||= word.length > 1 && word === word.toLocaleUpperCase();
    counts.set(normalized, entry);
  }
  return [...counts.values()]
    .filter(entry => entry.count >= 2 || entry.acronym)
    .sort((a, b) => b.count - a.count || b.term.length - a.term.length)
    .map(entry => entry.term);
}

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
}

function shuffled(values, random) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createId() {
  return `pdf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function questionSignature(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function isValidQuestion(question) {
  return Boolean(
    question &&
    typeof question.id === "string" && question.id &&
    typeof question.module === "string" && question.module &&
    typeof question.lecture === "string" &&
    typeof question.sourceFilename === "string" &&
    Number.isInteger(question.pageNumber) && question.pageNumber > 0 &&
    typeof question.topic === "string" && question.topic.trim() &&
    ["easy", "medium", "hard"].includes(question.difficulty) &&
    typeof question.cognitiveLevel === "string" &&
    typeof question.stem === "string" && question.stem.trim() &&
    Array.isArray(question.options) && question.options.length === 4 &&
    question.options.every(option => typeof option === "string" && option.trim()) &&
    new Set(question.options.map(option => option.trim().toLocaleLowerCase())).size === 4 &&
    Number.isInteger(question.correctOption) &&
    question.correctOption >= 0 && question.correctOption < 4 &&
    typeof question.explanation === "string" && question.explanation.trim() &&
    Array.isArray(question.distractorExplanations) && question.distractorExplanations.length === 4 &&
    question.distractorExplanations.every(explanation => typeof explanation === "string") &&
    typeof question.sourceEvidence === "string" && question.sourceEvidence.trim() &&
    typeof question.sourceChunkId === "string" &&
    question.groundingStatus === "grounded" &&
    ["pending", "approved", "rejected"].includes(question.reviewStatus) &&
    typeof question.createdAt === "string" &&
    typeof question.generationVersion === "string" &&
    Number.isInteger(question.timesShown) && question.timesShown >= 0 &&
    Number.isInteger(question.attempts) && question.attempts >= 0 &&
    Number.isInteger(question.correctAttempts) && question.correctAttempts >= 0 &&
    Number.isInteger(question.incorrectAttempts) && question.incorrectAttempts >= 0 &&
    (question.lastAttemptedDate === null || typeof question.lastAttemptedDate === "string") &&
    (question.nextReviewDate === null || typeof question.nextReviewDate === "string")
  );
}

function readSavedQuestions(serialized) {
  if (!serialized) return [];
  let questions;
  try {
    questions = JSON.parse(serialized);
  } catch (error) {
    throw new Error("The saved PDF question bank is unreadable. It has not been overwritten.", { cause: error });
  }
  if (!Array.isArray(questions) || !questions.every(isValidQuestion)) {
    throw new Error("The saved PDF question bank has invalid data. It has not been overwritten.");
  }
  if (new Set(questions.map(question => question.id)).size !== questions.length) {
    throw new Error("The saved PDF question bank contains duplicate IDs. It has not been overwritten.");
  }
  return questions;
}

function generateQuestions(pages, settings, random = Math.random) {
  if (!Array.isArray(pages) || !pages.some(page => typeof page?.text === "string" && page.text.trim())) {
    throw new Error("No selectable text was found. Scanned image-only PDFs are not supported.");
  }
  const topic = String(settings?.topic || "").trim();
  if (!topic) throw new Error("Enter a topic to map these questions to.");
  const count = Number(settings?.count);
  if (!Number.isInteger(count) || count < 1 || count > MAX_QUESTIONS) {
    throw new Error(`Choose between 1 and ${MAX_QUESTIONS} questions.`);
  }

  const cleanPages = pages
    .filter(page => typeof page?.text === "string" && page.text.trim())
    .map((page, index) => ({
      pageNumber: Number.isInteger(page.pageNumber) && page.pageNumber > 0 ? page.pageNumber : index + 1,
      text: page.text.replace(/\s+/g, " ").trim()
    }));
  const documentText = cleanPages.map(page => page.text).join(" ");
  if (documentText.length < 100) {
    throw new Error("There is not enough readable lecture text to create a question.");
  }
  const terms = collectTerms(documentText);
  if (terms.length < 4) {
    throw new Error("The PDF needs at least four distinct subject terms to create grounded answer choices.");
  }

  const candidates = [];
  const seen = new Set();
  cleanPages.forEach(page => {
    splitSentences(page.text).forEach((rawSentence, sentenceIndex) => {
      const sentence = rawSentence.replace(/\s+/g, " ").trim();
      if (sentence.length < 40 || sentence.length > 320 || wordsIn(sentence).length < 7) return;
      const signature = questionSignature(sentence);
      if (!signature || seen.has(signature)) return;
      const sentenceTerms = terms.filter(term => new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(sentence));
      const answer = sentenceTerms.find(term => {
        const answerMatches = sentence.match(new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi")) || [];
        if (answerMatches.length !== 1) return false;
        const remaining = terms.filter(candidate =>
          candidate.toLocaleLowerCase() !== term.toLocaleLowerCase() &&
          !new RegExp(`\\b${escapeRegExp(candidate)}\\b`, "i").test(sentence)
        );
        return remaining.length >= 3;
      });
      if (!answer) return;
      const blank = new RegExp(`\\b${escapeRegExp(answer)}\\b`, "i");
      const stem = `Complete the statement from the PDF: ${sentence.replace(blank, "_____")}`;
      const distractors = terms.filter(term =>
        term.toLocaleLowerCase() !== answer.toLocaleLowerCase() &&
        !new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(sentence)
      ).slice(0, 3);
      if (distractors.length !== 3) return;
      const options = shuffled([answer, ...distractors], random);
      const correctOption = options.findIndex(option => option.toLocaleLowerCase() === answer.toLocaleLowerCase());
      const distractorExplanations = options.map(option =>
        option.toLocaleLowerCase() === answer.toLocaleLowerCase()
          ? `This is the term used in the cited sentence: “${sentence}”`
          : `The cited sentence uses “${answer}”, not “${option}”. Check the source passage before accepting this draft.`
      );
      candidates.push({
        id: createId(),
        module: String(settings.module || "BS1030"),
        lecture: String(settings.sourceFilename || "Uploaded PDF"),
        sourceFilename: String(settings.sourceFilename || "Uploaded PDF").replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 120),
        pageNumber: page.pageNumber,
        topic,
        difficulty: ["easy", "medium", "hard"].includes(settings.difficulty) ? settings.difficulty : "medium",
        cognitiveLevel: "recall",
        stem,
        options,
        correctOption,
        explanation: `The PDF states: “${sentence}”`,
        distractorExplanations,
        sourceEvidence: sentence,
        sourceChunkId: `page-${page.pageNumber}-sentence-${sentenceIndex + 1}`,
        groundingStatus: "grounded",
        reviewStatus: "pending",
        createdAt: new Date().toISOString(),
        generationVersion: "pdf-grounded-cloze-v1",
        timesShown: 0,
        attempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        lastAttemptedDate: null,
        nextReviewDate: null
      });
      seen.add(signature);
    });
  });
  return candidates.slice(0, count);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function toGameQuestion(question) {
  if (!isValidQuestion(question)) throw new Error("This saved MCQ is invalid and cannot be added to the game.");
  const correctAnswer = question.options[question.correctOption];
  const evidence = escapeHtml(question.sourceEvidence);
  const filename = escapeHtml(question.sourceFilename);
  const topic = escapeHtml(question.topic);
  const module = escapeHtml(question.module);
  return [
    `${module} · PDF · ${topic}`,
    question.stem,
    question.options.slice(),
    correctAnswer,
    `${escapeHtml(question.explanation)}<br><b>Source:</b> ${filename}, page ${question.pageNumber}.<br><b>Evidence:</b> “${evidence}”`
  ];
}

export {
  MAX_FILE_BYTES,
  MAX_PAGES,
  MAX_QUESTIONS,
  assertPdfFile,
  extractPdfPages,
  generateQuestions,
  isValidQuestion,
  questionSignature,
  readSavedQuestions,
  toGameQuestion
};
