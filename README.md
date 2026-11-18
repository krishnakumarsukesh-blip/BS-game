# Practical Survival

A biology practical revision game for BS1030 and BS1040. The demonstrator is fictional; the questions are for revision, not a substitute for course materials.

## Play

Open `index.html` in a browser to play. To use PDF question generation or Clerk sign-in and sync, serve the folder over localhost or HTTPS (for example, run `python -m http.server 8000` here and open `http://localhost:8000`); these features do not run on `file://` pages. Signing in merges progress from this browser with progress stored on your Clerk account, then syncs new practicals and revisions. This uses Clerk's user-editable metadata, so progress is for personal convenience and is not a secure or authoritative record. The game includes:

- The standard practical, a quick bench, and a daily mini practical.
- A 33-question daily challenge pool, drawn without repeats on this device; those questions also remain in the module question bank. Daily completion and question history are local and are not account-synced.
- Topic-filtered rounds with adjustable lengths.
- Study mode without Trust penalties and Expert mode with a 30-second question timer.
- A review folder for missed questions, topic feedback, achievements, and local progress transfer.
- Optional FSRS spaced reviews for missed questions. Due reviews are available in the lobby, and the schedule is stored in this browser. Loading ts-fsrs requires an internet connection; other game modes continue to work if the library cannot load.
- PDF-to-MCQ drafts: choose a text-based lecture PDF in the lobby, review or edit the extracted pages, map the questions to a module and topic, then approve each draft to add it to the practical game. PDF content is processed locally and is not saved or sent to an AI service. The PDF.js reader is fetched from cdnjs when needed, so this feature requires an internet connection; scanned image-only PDFs are not supported.
- A calmer welcome lobby, optional settings, and short demonstrator briefings and sign-offs for each mode.
- The three-chapter Missing-Label Mystery: short, repeatable investigation sessions where correct answers uncover clues and mistakes come with explanations instead of penalties. Story progress is saved locally, included in progress exports, and synced when signed in.

Sign-in and account management are provided by Clerk and are optional. Scores and revision progress sync to your account when signed in, but the leaderboard remains personal and there is no shared online leaderboard.

## Before Tomorrow

The [Before Tomorrow student notebook](./before-tomorrow/) organizes curated practical tips by module, area, and task—including practicals, essays, assignments, graphs, calculations, and software. BS1030 now includes a moles, solutions and dilutions calculation guide. It highlights easy-to-miss details, not a substitute for official course or safety guidance.

## PDF question drafts

Serve the site over localhost or HTTPS, open **Make MCQs from a PDF** in the lobby, and select a text-based PDF of up to 15 MB and 100 pages. The PDF section stays collapsed until opened so the other lobby features remain easy to reach. Review the extracted text, set its module/topic, and generate up to 30 fill-in-the-blank drafts. The generator uses only text from the PDF; every draft includes its source page and excerpt. Review the wording, options, answer, and evidence before approving it. Approved questions are saved in this browser and join the existing standard, quick, and topic-filtered game rounds; they are not synced to an account or included in progress exports. The PDF and extracted text are not persisted.

Generation is deliberately local and rule-based: it creates literal recall prompts from source sentences rather than using an AI service. This avoids sending lecture material or requiring an API key, but it does not replace human review. Image-only/scanned PDFs, OCR, and automatic topic detection are not supported. PDF.js 3.11.174 is loaded from cdnjs only when a PDF is selected; PDF.js is distributed under Apache-2.0 (see [Mozilla PDF.js](https://github.com/mozilla/pdf.js)).

## Checks

There is no package-based production build for this static site. Run the focused PDF question tests with `node --test tests/pdf-mcq.test.mjs` and syntax-check the scripts with `node --check pdf-mcq.mjs` and `node --check pdf-mcq-core.mjs`.
