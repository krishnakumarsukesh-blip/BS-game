import * as PdfMcqCore from "./pdf-mcq-core.mjs";

const STORAGE_KEY = "bs-practical-survival-pdf-mcqs-v1";
const PDFJS_VERSION = "3.11.174";
const PDFJS_SCRIPT = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
const questionBank = window.BSGameQuestionBank;
const home = document.querySelector("#home");
if (!Array.isArray(questionBank) || !home) {
  throw new Error("The practical question bank is unavailable; PDF question tools could not start.");
}
let pages = [];
let selectedFileName = "";
let pdfJsPromise;
let savedQuestions = [];
let addedGameQuestions = [];
let storageUnavailable = false;

const styles = document.createElement("style");
styles.textContent = `
  .pdf-mcq-card{padding:12px 18px}
  .pdf-mcq-card[open]{padding:clamp(18px,4vw,26px)}
  .pdf-mcq-summary{display:flex;align-items:center;gap:10px;list-style:none;min-height:38px;cursor:pointer;font-weight:850;color:#102a43}
  .pdf-mcq-summary::-webkit-details-marker{display:none}
  .pdf-mcq-summary::after{content:"＋";margin-left:auto;color:#1769aa;font-size:20px}
  .pdf-mcq-card[open]>.pdf-mcq-summary::after{content:"−"}
  .pdf-mcq-summary-hint{color:#526477;font-size:13px;font-weight:500}
  .pdf-mcq-content{padding-top:10px}
  .pdf-mcq-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
  .pdf-mcq-field{display:grid;gap:5px}
  .pdf-mcq-field label,.pdf-mcq-question label{font-weight:800;color:#1769aa}
  .pdf-mcq-field input,.pdf-mcq-field select,.pdf-mcq-question input,.pdf-mcq-question select,.pdf-mcq-question textarea,.pdf-mcq-page textarea{width:100%;padding:10px;border:1px solid #c9dce8;border-radius:9px;background:#fff;color:#142536;font:inherit}
  .pdf-mcq-page textarea,.pdf-mcq-question textarea{resize:vertical}
  .pdf-mcq-page{margin:8px 0;border:1px solid #d8e0e8;border-radius:10px;background:#f5f8fb}
  .pdf-mcq-page summary{padding:10px 12px;cursor:pointer;font-weight:800;color:#1769aa}
  .pdf-mcq-page textarea{display:block;width:calc(100% - 24px);margin:0 12px 12px}
  .pdf-mcq-note{padding:12px;border-radius:9px;background:#f4f9fc;color:#334e62}
  .pdf-mcq-status{margin:12px 0;padding:11px 13px;border-radius:9px;background:#f4f9fc;color:#142536}
  .pdf-mcq-status[data-error="true"]{background:#fee2e2;color:#7f1d1d}
  .pdf-mcq-question{margin:12px 0;border:1px solid #d8e0e8;border-radius:12px;padding:14px;background:#fff}
  .pdf-mcq-question summary{cursor:pointer;font-weight:850;color:#102a43}
  .pdf-mcq-question .pdf-mcq-question-fields{display:grid;gap:10px;margin-top:12px}
  .pdf-mcq-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
  .pdf-mcq-evidence{padding:10px 12px;border:1px solid #e8dfba;border-radius:8px;background:#fff8dc;overflow-wrap:anywhere}
  .pdf-mcq-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .pdf-mcq-badge{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:99px;background:#eaf1f8;color:#334e62;font-size:12px}
  .pdf-mcq-count{font-weight:800;color:#1769aa}
  @media(max-width:480px){.pdf-mcq-actions button{width:100%}.pdf-mcq-summary{flex-wrap:wrap}.pdf-mcq-summary-hint{flex:1 1 100%;padding-left:30px}}
`;
document.head.append(styles);

const card = document.createElement("details");
card.id = "pdfMcq";
card.className = "card pdf-mcq-card";
card.setAttribute("aria-labelledby", "pdfMcqTitle");
card.innerHTML = `
  <summary id="pdfMcqTitle" class="pdf-mcq-summary"><span>📄 Make MCQs from a PDF</span><span class="pdf-mcq-summary-hint">Upload, review and add questions</span></summary>
  <div class="pdf-mcq-content">
  <p>Choose a text-based PDF, check the extracted pages, then generate and approve question drafts for the practical question bank.</p>
  <p class="pdf-mcq-note">Your PDF and extracted text stay in this browser; they are not uploaded or saved. The PDF reader is loaded from a pinned CDN only when you choose a file. Scanned image-only PDFs need OCR and are not supported here. Automatically generated questions are literal fill-in-the-blank drafts, so check them against the source before approving.</p>
  </div>
`;
const content = card.querySelector(".pdf-mcq-content");
const status = document.createElement("p");
status.className = "pdf-mcq-status";
status.setAttribute("role", "status");
status.setAttribute("aria-live", "polite");
content.append(status);

const formGrid = document.createElement("div");
formGrid.className = "pdf-mcq-grid";
content.append(formGrid);

function addField(labelText, control, id) {
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-mcq-field";
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = labelText;
  control.id = id;
  wrapper.append(label, control);
  formGrid.append(wrapper);
  return control;
}

const fileInput = addField("Lecture PDF (15 MB max)", document.createElement("input"), "pdfMcqFile");
fileInput.type = "file";
fileInput.accept = ".pdf,application/pdf";

const moduleInput = document.createElement("select");
["BS1030", "BS1040"].forEach(value => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  moduleInput.append(option);
});
addField("Module", moduleInput, "pdfMcqModule");

const topicInput = document.createElement("input");
topicInput.type = "text";
topicInput.maxLength = 80;
topicInput.value = "Lecture revision";
topicInput.required = true;
addField("Map to topic", topicInput, "pdfMcqTopic");

const countInput = document.createElement("input");
countInput.type = "number";
countInput.min = "1";
countInput.max = String(PdfMcqCore.MAX_QUESTIONS);
countInput.value = "10";
addField("Question drafts (up to 30)", countInput, "pdfMcqCount");

const difficultyInput = document.createElement("select");
["easy", "medium", "hard"].forEach(value => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value[0].toUpperCase() + value.slice(1);
  difficultyInput.append(option);
});
addField("Label difficulty", difficultyInput, "pdfMcqDifficulty");

const extractReview = document.createElement("section");
extractReview.hidden = true;
extractReview.setAttribute("aria-labelledby", "pdfMcqExtractTitle");
const extractTitle = document.createElement("h3");
extractTitle.id = "pdfMcqExtractTitle";
extractTitle.textContent = "Review extracted text";
const extractSummary = document.createElement("p");
const pageList = document.createElement("div");
extractReview.append(extractTitle, extractSummary, pageList);
content.append(extractReview);

const generateButton = document.createElement("button");
generateButton.className = "primary";
generateButton.type = "button";
generateButton.textContent = "Generate question drafts";
generateButton.disabled = true;
content.append(generateButton);

const reviewSection = document.createElement("section");
reviewSection.hidden = true;
reviewSection.setAttribute("aria-labelledby", "pdfMcqReviewTitle");
const reviewHeading = document.createElement("h3");
reviewHeading.id = "pdfMcqReviewTitle";
reviewHeading.textContent = "Review and save questions";
const reviewCount = document.createElement("p");
reviewCount.className = "pdf-mcq-count";
const questionList = document.createElement("div");
reviewSection.append(reviewHeading, reviewCount, questionList);
content.append(reviewSection);

const savedSummary = document.createElement("p");
savedSummary.className = "small";
savedSummary.setAttribute("aria-live", "polite");
content.append(savedSummary);

home.querySelector(".daily").after(card);

function setStatus(message, isError = false) {
  status.textContent = message;
  status.dataset.error = String(isError);
}

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfJsPromise) {
    pdfJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PDFJS_SCRIPT;
      script.async = true;
      script.dataset.pdfjsLoader = "true";
      script.onload = () => resolve(window.pdfjsLib);
      script.onerror = () => {
        script.remove();
        reject(new Error("Could not load the PDF reader from cdnjs. Check your connection and retry."));
      };
      document.head.append(script);
    }).then(pdfjs => {
      if (!pdfjs) throw new Error("The PDF reader loaded without its API.");
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return pdfjs;
    }).catch(error => {
      pdfJsPromise = null;
      throw error;
    });
  }
  return pdfJsPromise;
}

function safeFilename(name) {
  return String(name || "Uploaded PDF").replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 120);
}

function readPageEdits() {
  return [...pageList.querySelectorAll("textarea")].map((textarea, index) => ({
    pageNumber: Number(textarea.dataset.pageNumber) || index + 1,
    text: textarea.value
  }));
}

function renderPages(extractedPages) {
  pages = extractedPages;
  pageList.replaceChildren();
  pages.forEach(page => {
    const details = document.createElement("details");
    details.className = "pdf-mcq-page";
    details.open = page.pageNumber === 1;
    const summary = document.createElement("summary");
    summary.textContent = `Page ${page.pageNumber}${page.text ? "" : " · no selectable text"}`;
    const textarea = document.createElement("textarea");
    textarea.rows = 5;
    textarea.value = page.text;
    textarea.dataset.pageNumber = String(page.pageNumber);
    textarea.setAttribute("aria-label", `Review extracted text from page ${page.pageNumber}`);
    details.append(summary, textarea);
    pageList.append(details);
  });
  const readablePages = pages.filter(page => page.text.trim()).length;
  const characters = pages.reduce((total, page) => total + page.text.length, 0);
  extractSummary.textContent = `${pages.length} pages · ${readablePages} with selectable text · ${characters.toLocaleString()} characters. Edit any page before generating.`;
  extractReview.hidden = false;
  generateButton.disabled = false;
}

function saveQuestions() {
  if (storageUnavailable) {
    throw new Error("The existing PDF question bank could not be read, so this session cannot overwrite it.");
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedQuestions));
  } catch (error) {
    throw new Error("Could not save your PDF questions in this browser. Check available local storage space.", { cause: error });
  }
}

function refreshSavedSummary() {
  const approved = savedQuestions.filter(question => question.reviewStatus === "approved").length;
  const pending = savedQuestions.filter(question => question.reviewStatus === "pending").length;
  const rejected = savedQuestions.filter(question => question.reviewStatus === "rejected").length;
  savedSummary.textContent = savedQuestions.length
    ? `Saved locally: ${approved} approved for the game, ${pending} drafts to review, ${rejected} rejected.`
    : "Approved questions are saved only in this browser and appear in the practical question bank.";
}

function syncQuestionBank() {
  addedGameQuestions.forEach(question => {
    const index = questionBank.indexOf(question);
    if (index >= 0) questionBank.splice(index, 1);
  });
  addedGameQuestions = savedQuestions
    .filter(question => question.reviewStatus === "approved")
    .map(PdfMcqCore.toGameQuestion);
  questionBank.push(...addedGameQuestions);
  document.querySelector("#qcount").textContent = String(questionBank.length);
  window.dispatchEvent(new Event("bs-game-question-bank-updated"));
  if (typeof window.renderBoard === "function") window.renderBoard();
}

function makeReviewField(labelText, value, type = "textarea") {
  const wrapper = document.createElement("div");
  const label = document.createElement("label");
  const control = type === "textarea" ? document.createElement("textarea") : document.createElement("input");
  const id = `pdf-review-${Math.random().toString(36).slice(2)}`;
  label.htmlFor = id;
  label.textContent = labelText;
  control.id = id;
  if (type === "textarea") {
    control.rows = labelText === "Question" ? 3 : 2;
    control.maxLength = 600;
  } else {
    control.maxLength = labelText === "Topic" ? 80 : 300;
  }
  control.value = value;
  wrapper.append(label, control);
  return { wrapper, control };
}

function renderReview() {
  reviewSection.hidden = savedQuestions.length === 0;
  questionList.replaceChildren();
  const approved = savedQuestions.filter(question => question.reviewStatus === "approved").length;
  const pending = savedQuestions.filter(question => question.reviewStatus === "pending").length;
  reviewCount.textContent = `${savedQuestions.length} questions · ${pending} awaiting review · ${approved} in the game`;

  savedQuestions.forEach((question, index) => {
    const details = document.createElement("details");
    details.className = "pdf-mcq-question";
    const summary = document.createElement("summary");
    const summaryText = document.createElement("span");
    summaryText.textContent = `${index + 1}. ${question.stem}`;
    const badge = document.createElement("span");
    badge.className = "pdf-mcq-badge";
    badge.textContent = question.reviewStatus;
    summary.append(summaryText, badge);
    details.append(summary);

    const fields = document.createElement("div");
    fields.className = "pdf-mcq-question-fields";
    const topic = makeReviewField("Topic", question.topic, "input");
    const stem = makeReviewField("Question", question.stem);
    fields.append(topic.wrapper, stem.wrapper);

    const options = document.createElement("div");
    options.className = "pdf-mcq-options";
    const optionFields = question.options.map((value, optionIndex) => {
      const field = makeReviewField(`Option ${String.fromCharCode(65 + optionIndex)}`, value, "input");
      options.append(field.wrapper);
      return field.control;
    });
    fields.append(options);

    const correctLabel = document.createElement("label");
    correctLabel.textContent = "Correct option";
    const correct = document.createElement("select");
    correct.setAttribute("aria-label", `Correct option for question ${index + 1}`);
    question.options.forEach((optionText, optionIndex) => {
      const option = document.createElement("option");
      option.value = String(optionIndex);
      option.textContent = `${String.fromCharCode(65 + optionIndex)} · ${optionText}`;
      correct.append(option);
    });
    correct.value = String(question.correctOption);
    const correctField = document.createElement("div");
    correctField.className = "pdf-mcq-field";
    correctField.append(correctLabel, correct);
    fields.append(correctField);

    const explanation = makeReviewField("Why this answer is correct", question.explanation);
    fields.append(explanation.wrapper);
    const evidence = document.createElement("blockquote");
    evidence.className = "pdf-mcq-evidence";
    evidence.textContent = `Source · ${question.sourceFilename}, page ${question.pageNumber}: “${question.sourceEvidence}”`;
    fields.append(evidence);

    const distractorList = document.createElement("ul");
    question.distractorExplanations.forEach((text, optionIndex) => {
      const item = document.createElement("li");
      item.textContent = `${String.fromCharCode(65 + optionIndex)} · ${text}`;
      distractorList.append(item);
    });
    fields.append(distractorList);

    const actions = document.createElement("div");
    actions.className = "pdf-mcq-actions";
    const approve = document.createElement("button");
    approve.className = question.reviewStatus === "approved" ? "next" : "primary";
    approve.type = "button";
    approve.textContent = question.reviewStatus === "approved" ? "Remove from game" : "Approve for game";
    const reject = document.createElement("button");
    reject.className = "next";
    reject.type = "button";
    reject.textContent = question.reviewStatus === "rejected" ? "Restore draft" : "Reject";
    actions.append(approve, reject);
    fields.append(actions);
    details.append(fields);
    questionList.append(details);

    const editableFields = [topic.control, stem.control, ...optionFields, correct, explanation.control];
    if (question.reviewStatus === "approved") editableFields.forEach(control => { control.disabled = true; });

    function restoreQuestion(previous) {
      Object.assign(question, previous);
      topic.control.value = question.topic;
      stem.control.value = question.stem;
      optionFields.forEach((control, optionIndex) => {
        control.value = question.options[optionIndex];
      });
      correct.value = String(question.correctOption);
      correct.querySelectorAll("option").forEach((option, optionIndex) => {
        option.textContent = `${String.fromCharCode(65 + optionIndex)} · ${question.options[optionIndex]}`;
      });
      explanation.control.value = question.explanation;
      summaryText.textContent = `${index + 1}. ${question.stem}`;
      distractorList.replaceChildren();
      question.distractorExplanations.forEach((text, optionIndex) => {
        const item = document.createElement("li");
        item.textContent = `${String.fromCharCode(65 + optionIndex)} · ${text}`;
        distractorList.append(item);
      });
    }

    function updateQuestion() {
      const previous = {
        topic: question.topic,
        stem: question.stem,
        options: question.options.slice(),
        correctOption: question.correctOption,
        explanation: question.explanation,
        distractorExplanations: question.distractorExplanations.slice()
      };
      question.topic = topic.control.value.trim();
      question.stem = stem.control.value.trim();
      question.options = optionFields.map(control => control.value.trim());
      question.correctOption = Number(correct.value);
      question.explanation = explanation.control.value.trim();
      const answer = question.options[question.correctOption];
      question.distractorExplanations = question.options.map(option =>
        option === answer
          ? `This is the answer identified in the source excerpt: “${question.sourceEvidence}”`
          : `The source excerpt identifies “${answer}”, not “${option}”. Check the cited passage before accepting this draft.`
      );
      if (!PdfMcqCore.isValidQuestion(question)) {
        restoreQuestion(previous);
        setStatus("The edit was not saved. Keep a topic, question, explanation and four distinct options.", true);
        return false;
      }
      summaryText.textContent = `${index + 1}. ${question.stem}`;
      correct.querySelectorAll("option").forEach((option, optionIndex) => {
        option.textContent = `${String.fromCharCode(65 + optionIndex)} · ${question.options[optionIndex]}`;
      });
      distractorList.replaceChildren();
      question.distractorExplanations.forEach((text, optionIndex) => {
        const item = document.createElement("li");
        item.textContent = `${String.fromCharCode(65 + optionIndex)} · ${text}`;
        distractorList.append(item);
      });
      try {
        saveQuestions();
        if (question.reviewStatus === "approved") syncQuestionBank();
        refreshSavedSummary();
        return true;
      } catch (error) {
        restoreQuestion(previous);
        setStatus(error.message, true);
        return false;
      }
    }

    editableFields.forEach(control => {
      control.addEventListener("change", updateQuestion);
    });

    approve.addEventListener("click", () => {
      const previousStatus = question.reviewStatus;
      if (question.reviewStatus === "approved") {
        question.reviewStatus = "pending";
      } else {
        if (!updateQuestion()) return;
        if (!PdfMcqCore.isValidQuestion(question)) {
          setStatus("This question needs a topic, question, four distinct options and an explanation before it can be approved.", true);
          return;
        }
        const signature = PdfMcqCore.questionSignature(question.stem);
        const duplicate = [...questionBank, ...savedQuestions
          .filter(candidate => candidate !== question && candidate.reviewStatus === "approved")
          .map(candidate => candidate.stem)]
          .some(candidate => PdfMcqCore.questionSignature(Array.isArray(candidate) ? candidate[1] : candidate) === signature);
        if (duplicate) {
          setStatus("This question duplicates an existing game question. Edit it or leave it as a draft.", true);
          return;
        }
        question.reviewStatus = "approved";
      }
      try {
        saveQuestions();
        syncQuestionBank();
        renderReview();
        refreshSavedSummary();
        setStatus(question.reviewStatus === "approved" ? "Question approved and added to the game." : "Question returned to drafts and removed from the game.");
      } catch (error) {
        question.reviewStatus = previousStatus;
        renderReview();
        setStatus(error.message, true);
      }
    });

    reject.addEventListener("click", () => {
      const previousStatus = question.reviewStatus;
      question.reviewStatus = question.reviewStatus === "rejected" ? "pending" : "rejected";
      try {
        saveQuestions();
        syncQuestionBank();
        renderReview();
        refreshSavedSummary();
        setStatus(question.reviewStatus === "rejected" ? "Question rejected and kept in your local review list." : "Question restored to drafts.");
      } catch (error) {
        question.reviewStatus = previousStatus;
        renderReview();
        setStatus(error.message, true);
      }
    });
  });
  refreshSavedSummary();
}

try {
  savedQuestions = PdfMcqCore.readSavedQuestions(localStorage.getItem(STORAGE_KEY));
  syncQuestionBank();
} catch (error) {
  storageUnavailable = true;
  generateButton.disabled = true;
  setStatus(error.message, true);
}
renderReview();

fileInput.addEventListener("change", async () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  pages = [];
  selectedFileName = safeFilename(file.name);
  extractReview.hidden = true;
  generateButton.disabled = true;
  renderPages([]);
  extractReview.hidden = true;
  setStatus(`Reading ${selectedFileName}…`);
  try {
    PdfMcqCore.assertPdfFile(file);
    const pdfjs = await loadPdfJs();
    const extractedPages = await PdfMcqCore.extractPdfPages(pdfjs, file);
    renderPages(extractedPages);
    topicInput.value = selectedFileName.replace(/\.pdf$/i, "").slice(0, 80) || "Lecture revision";
    setStatus(extractedPages.some(page => page.text.trim())
      ? "Text extracted. Review or edit the pages, choose a topic, and generate drafts."
      : "This PDF has no selectable text. Scanned image-only PDFs need OCR and cannot be used here.", !extractedPages.some(page => page.text.trim()));
    generateButton.disabled = !extractedPages.some(page => page.text.trim());
  } catch (error) {
    setStatus(error.message || "Could not read the selected PDF.", true);
  }
});

generateButton.addEventListener("click", () => {
  try {
    const generated = PdfMcqCore.generateQuestions(readPageEdits(), {
      module: moduleInput.value,
      topic: topicInput.value,
      count: countInput.value,
      difficulty: difficultyInput.value,
      sourceFilename: selectedFileName
    });
    if (!generated.length) {
      setStatus("The reviewed pages did not contain enough distinct repeated terms to build reliable answer choices. Try a more text-rich lecture PDF.", true);
      return;
    }
    const known = new Set([
      ...questionBank.map(question => PdfMcqCore.questionSignature(question[1])),
      ...savedQuestions.map(question => PdfMcqCore.questionSignature(question.stem))
    ]);
    const unique = generated.filter(question => {
      const signature = PdfMcqCore.questionSignature(question.stem);
      if (!signature || known.has(signature)) return false;
      known.add(signature);
      return true;
    });
    if (!unique.length) {
      setStatus("No new questions were created; the available statements are duplicates or do not have enough distinct source terms.", true);
      return;
    }
    savedQuestions.push(...unique);
    try {
      saveQuestions();
    } catch (error) {
      savedQuestions.splice(-unique.length, unique.length);
      throw error;
    }
    renderReview();
    setStatus(`${unique.length} draft${unique.length === 1 ? "" : "s"} saved locally. Review the source evidence, edit if needed, then approve questions for the game.`);
  } catch (error) {
    setStatus(error.message || "Could not generate questions from the reviewed text.", true);
  }
});
