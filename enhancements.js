(() => {
  const originalBegin = begin;
  const originalShow = show;
  const originalAnswer = answer;
  const originalFinish = finish;
  const originalTrack = track;
  const originalSaveRun = saveRun;
  let roundStyle = "survival";
  let quickBench = false;
  let reviewStudyNext = false;
  let activeChallenge = "standard";
  let campaignActive = false;
  let campaignRoundChapter = 0;
  let clock = null;
  let remainingSeconds = 0;

  const homeCard = document.querySelector("#home");
  const welcome = document.createElement("header");
  welcome.className = "welcome-banner";
  Array.from(homeCard.children).slice(0, 3).forEach(child => welcome.append(child));
  const homeDescription = welcome.querySelector("p");
  const questionCount = welcome.querySelector("#qcount");
  homeDescription.replaceChildren(questionCount, document.createTextNode(" practical questions to explore, plus a fresh daily mini practical."));
  const reassurance = document.createElement("div");
  reassurance.className = "demonstrator-note";
  reassurance.innerHTML = '<span aria-hidden="true">🥼</span><p><b>The demonstrator says:</b> New here? Every answer includes an explanation. Choose Study mode in optional settings to practise without Trust penalties. Goggles remain non-negotiable, apparently.</p>';
  welcome.append(reassurance);
  const lobbyContent = document.createElement("div");
  lobbyContent.className = "lobby-content";
  while (homeCard.firstChild) lobbyContent.append(homeCard.firstChild);
  homeCard.append(welcome, lobbyContent);

  const controls = document.createElement("section");
  controls.className = "round-settings";
  controls.innerHTML = `
    <details>
      <summary>⚙️ Make this practical yours <span>Optional settings · the default is ready to go</span></summary>
      <div class="round-controls">
        <div class="round-control">
          <label for="topicChoice">Choose a bench</label>
          <select id="topicChoice" aria-label="Choose a question topic"></select>
        </div>
        <div class="round-control">
          <label for="lengthChoice">Round length</label>
          <select id="lengthChoice" aria-label="Choose the number of questions">
            <option value="10">10 questions · quick bench</option>
            <option value="20">20 questions · steady shift</option>
            <option value="40">40 questions · demonstrator endurance test</option>
            <option value="all" selected>All questions · the demonstrator's whole afternoon</option>
          </select>
        </div>
        <div class="round-control">
          <label for="styleChoice">How spicy?</label>
          <select id="styleChoice" aria-label="Choose a challenge mode">
            <option value="survival">Survival · standard Trust rules</option>
            <option value="study">Study · no Trust penalties</option>
            <option value="expert">Expert · 30 seconds per question</option>
          </select>
        </div>
        <p class="round-note">No wrong door here. Pick a topic, set your pace, and let the demonstrator worry about the clipboard.</p>
        <button id="reviewMissed" class="next" type="button">📁 Review missed questions · no Trust penalties</button>
      </div>
    </details>`;
  const styles = document.createElement("style");
  styles.textContent = `
    #home.lobby{padding:0;overflow:hidden;background:#fffdf7;border-color:#d8e0e8;border-bottom:6px solid #f5c451;color:#142536}
    .welcome-banner{position:relative;padding:clamp(24px,6vw,46px);background:linear-gradient(135deg,#102a43,#1d4964);color:#fff}
    .welcome-banner>.eyebrow{color:#f5c451}
    .welcome-banner h1{color:#fff;font-size:clamp(32px,7vw,48px);letter-spacing:-.035em}
    .welcome-banner>p{max-width:40rem;margin:10px 0 0;color:#e5f1fa;font-size:1.05rem}
    .demonstrator-note{display:flex;align-items:flex-start;gap:12px;max-width:42rem;margin-top:22px;padding:13px 16px;border:1px solid #ffffff35;border-radius:14px;background:#ffffff10}
    .demonstrator-note>span{font-size:26px;line-height:1.2}
    .demonstrator-note p{margin:0;color:#e5f1fa}
    .demonstrator-note b{color:#f5c451}
    .lobby-content{padding:clamp(18px,4vw,30px)}
    .lobby-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
    #start{min-width:min(100%,230px);font-size:1.08rem}
    #quick{margin:0}
    .daily{margin:16px 0 14px;padding:clamp(18px,4vw,24px);border:2px solid #f5c451;box-shadow:0 7px 22px #102a4315}
    .daily>p{margin:8px 0 14px}
    .daily>.eyebrow{font-size:14px}
    .daily #dailyStart{min-height:46px;padding:12px 20px;font-size:1.02rem}
    .before-tomorrow-link{display:flex;align-items:center;gap:12px;margin:12px 0;padding:14px 16px;border:1px solid #c9dce8;border-radius:12px;background:#f4f9fc;color:#102a43;text-decoration:none;transition:border-color .15s ease,transform .15s ease}
    .before-tomorrow-link:hover{border-color:#1769aa;transform:translateY(-1px)}
    .before-tomorrow-link>span:first-child{font-size:24px}
    .before-tomorrow-link>span:last-child{margin-left:auto;color:#1769aa;font-size:20px}
    .before-tomorrow-link b,.before-tomorrow-link small{display:block}
    .before-tomorrow-link small{margin-top:2px;color:#526477}
    @media(prefers-reduced-motion:reduce){.before-tomorrow-link{transition:none}}
    .campaign-details{margin:10px 0;border:1px solid #d8e0e8;border-radius:13px;background:#f5f8fb}
    .campaign-details>summary{cursor:pointer;list-style:none;padding:12px 15px;color:#1769aa;font-weight:850}
    .campaign-details>summary::-webkit-details-marker{display:none}
    .campaign-details>summary::after{content:"＋";float:right}
    .campaign-details[open]>summary::after{content:"−"}
    .campaign-details>summary:focus-visible{outline:3px solid #f5c451;outline-offset:2px;border-radius:12px}
    .campaign-card{display:grid;grid-template-columns:1fr auto;gap:6px 16px;align-items:center;margin:18px 0;padding:17px 19px;border:1px solid #c9dce8;border-left:5px solid #1769aa;border-radius:14px;background:linear-gradient(110deg,#f4f9fc,#fffdf7)}
    .campaign-card h2{margin:2px 0;font-size:clamp(18px,3vw,22px);color:#102a43}
    .campaign-card p{margin:0;color:#526477}
    .campaign-kicker{font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#1769aa}
    .campaign-card button{grid-column:2;grid-row:1/4}
    .campaign-progress{font-size:14px;font-weight:800;color:#1769aa!important}
    .campaign-meter{height:6px;margin-top:8px;border-radius:9px;background:#dce4eb;overflow:hidden}
    .campaign-meter i{display:block;width:0;height:100%;background:#147d64;transition:width .25s ease}
    .campaign-clue{margin-top:13px;padding:12px 14px;border-radius:10px;background:#f5f8fb;color:#334e62}
    .campaign-clue b{display:block;margin-bottom:3px;color:#1769aa}
    @media(prefers-reduced-motion:reduce){.campaign-meter i{transition:none}}
    @media(max-width:480px){.campaign-card{grid-template-columns:1fr;margin:8px;padding:14px}.campaign-card button{grid-column:1;grid-row:auto;justify-self:start}}
    .home-details{border-color:#d8e0e8}
    .home-details summary{color:#1769aa}
    .home-details summary::after{color:#1769aa}
    .home-details summary:hover{background:#1769aa0a}
    .home-details .attendance{color:#1769aa}
    .round-settings{margin:16px 0 8px;border:1px solid #d8e0e8;border-radius:13px;background:#f5f8fb}
    .round-settings>details>summary{cursor:pointer;list-style:none;padding:13px 15px;color:#1769aa;font-weight:850}
    .round-settings>details>summary::-webkit-details-marker{display:none}
    .round-settings>details>summary::after{content:"＋";float:right}
    .round-settings>details[open]>summary::after{content:"−"}
    .round-settings>details>summary span{display:block;color:#526477;font-size:13px;font-weight:500}
    .round-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;padding:0 15px 15px}
    .round-control label{display:block;margin-bottom:5px;color:#1769aa;font-size:14px;font-weight:850}
    .round-control select{width:100%;min-height:44px;padding:9px;border:1px solid #d8e0e8;border-radius:9px;background:#fff;color:#142536;font:inherit}
    .round-note{grid-column:1/-1;margin:0;color:#526477}
    #reviewMissed{grid-column:1/-1;justify-self:start}
    #roundClock{margin:0 0 10px;padding:9px 12px;border-radius:9px;background:#fff8dc;color:#142536;font-weight:850}
    #roundClock[hidden]{display:none}
    .demonstrator-verdict{padding:14px 16px;border-left:4px solid #f5c451;border-radius:0 10px 10px 0;background:#f5f8fb;color:#334e62}
    .demonstrator-verdict b{display:block;margin-bottom:3px;color:#1769aa}
    .mode-briefing{border-left:6px solid #f5c451}
    .mode-briefing h2{color:#102a43}
    .mode-briefing-copy{max-width:42rem}
    @media(prefers-reduced-motion:no-preference){.welcome-banner,.daily,.round-settings{animation:lobby-arrive .45s ease-out both}@keyframes lobby-arrive{from{opacity:.65;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}}
    @media(max-width:480px){.round-controls{grid-template-columns:1fr}.round-control select{font-size:16px}}
    @media(max-width:480px){.lobby-actions>*{width:100%;margin:0}.welcome-banner{padding:23px 20px}.demonstrator-note{font-size:14px}}
  `;
  homeCard.classList.remove("hero");
  homeCard.classList.add("lobby");
  document.head.append(styles);
  document.querySelector(".daily").after(controls);
  const launchActions = document.createElement("div");
  launchActions.className = "lobby-actions";
  document.querySelector("#start").before(launchActions);
  launchActions.append(document.querySelector("#start"), document.querySelector("#quick"));

  const campaignKey = "bs-practical-survival-story-v1";
  const campaignChapters = [
    {
      title: "Chapter 1 · The Great Label Mix-up",
      intro: "Every tube in the sample rack has lost its label. The demonstrator insists the tubes were like this when they arrived. The permanent marker is still warm.",
      clues: [
        "The marker lid is missing. It has been promoted to acting lab manager.",
        "A neat row of ink dots leads away from the sample rack.",
        "The dots stop beside the centrifuge. It denies everything."
      ],
      ending: "The centrifuge is innocent. Mostly. A strip of labels is stuck to its lid, pointing toward the microscope room."
    },
    {
      title: "Chapter 2 · The Slide That Knew Too Much",
      intro: "The trail ends at a microscope slide and one extremely suspicious cover slip. The demonstrator has put the microscope away facing the wall.",
      clues: [
        "The slide is upside down. So is the demonstrator's map.",
        "A label is being used as a bookmark in the microscope manual.",
        "The bookmark has a smudge of cold-room frost on it."
      ],
      ending: "The mystery has gone cold. Literally. Frosty footprints lead to the sample fridge, where someone has left a very apologetic note."
    },
    {
      title: "Chapter 3 · A Cold Case",
      intro: "The labels are frozen to the inside of the fridge door. The demonstrator says they were keeping them safe. The labels say nothing; they are labels.",
      clues: [
        "The note reads: 'Do not put labels in the fridge.' It is written in the demonstrator's handwriting.",
        "The marker has been recovered. It would like a desk away from the centrifuge.",
        "All samples are relabelled, and the marker has been given a tiny lanyard."
      ],
      ending: "Case closed: the labels were refrigerated for safekeeping. The samples are identified, the marker has a lanyard, and the demonstrator has been gently banned from organizing stationery."
    }
  ];

  function normalizeCampaign(value) {
    if (!value || !Number.isInteger(value.chapter) || !Number.isInteger(value.clues) || !Number.isInteger(value.totalClues)) return null;
    if (value.chapter < 0 || value.chapter > campaignChapters.length || value.clues < 0 || value.clues > 2 || value.totalClues < 0) return null;
    if (value.chapter === campaignChapters.length && value.clues !== 0) return null;
    return { chapter: value.chapter, clues: value.clues, totalClues: value.totalClues };
  }

  function readCampaign() {
    try {
      const saved = localStorage.getItem(campaignKey);
      if (!saved) return { chapter: 0, clues: 0, totalClues: 0 };
      const progress = normalizeCampaign(JSON.parse(saved));
      if (progress) return progress;
      throw new Error("Saved story progress is invalid.");
    } catch (error) {
      console.error("Could not read the lab mystery progress.", error);
      return { chapter: 0, clues: 0, totalClues: 0 };
    }
  }

  let campaignProgress = readCampaign();
  let campaignStorageError = false;
  const campaignDetails = document.createElement("details");
  campaignDetails.className = "campaign-details";
  campaignDetails.innerHTML = `<summary id="campaignSummary"></summary>`;
  const campaignCard = document.createElement("section");
  campaignCard.className = "campaign-card";
  campaignCard.setAttribute("aria-labelledby", "campaignTitle");
  campaignCard.innerHTML = `
    <div class="campaign-kicker">🕵️ An ongoing lab mystery · no Trust penalties</div>
    <h2 id="campaignTitle"></h2>
    <p id="campaignCopy"></p>
    <p id="campaignProgress" class="campaign-progress" aria-live="polite"></p>
    <div class="campaign-meter" role="progressbar" aria-label="Story clue progress" aria-valuemin="0" aria-valuemax="3">
      <i id="campaignMeter"></i>
    </div>
    <button id="campaignStart" class="primary" type="button"></button>`;
  campaignDetails.append(campaignCard);
  const dailyChallenge = document.querySelector(".daily");
  dailyChallenge.after(campaignDetails);
  campaignDetails.after(controls);
  const campaignSummary = campaignDetails.querySelector("#campaignSummary");
  const campaignTitle = campaignCard.querySelector("#campaignTitle");
  const campaignCopy = campaignCard.querySelector("#campaignCopy");
  const campaignProgressText = campaignCard.querySelector("#campaignProgress");
  const campaignMeter = campaignCard.querySelector(".campaign-meter");
  const campaignMeterFill = campaignCard.querySelector("#campaignMeter");
  const campaignStart = campaignCard.querySelector("#campaignStart");

  function paintCampaign() {
    const complete = campaignProgress.chapter >= campaignChapters.length;
    const chapter = campaignChapters[Math.min(campaignProgress.chapter, campaignChapters.length - 1)];
    campaignTitle.textContent = complete ? "Case closed · stationery is under supervision" : chapter.title;
    campaignCopy.textContent = complete
      ? "The labels are back where they belong. The marker has requested a quieter desk."
      : chapter.intro;
    campaignProgressText.textContent = campaignStorageError
      ? "This browser could not save progress. The case file is still open on this visit."
      : complete
        ? `${campaignProgress.totalClues} clues found · the demonstrator has been gently reassigned from fridge duty`
        : `${campaignProgress.clues} of 3 clues found · mistakes are leads, not penalties`;
    const storySummary = complete
      ? "🕵️ Story mode · Case closed"
      : `🕵️ Story mode · Chapter ${campaignProgress.chapter + 1} · ${campaignProgress.clues} of 3 clues`;
    campaignSummary.textContent = campaignStorageError ? `${storySummary} · progress not saved` : storySummary;
    campaignMeterFill.style.width = complete ? "100%" : `${campaignProgress.clues / 3 * 100}%`;
    campaignMeter.setAttribute("aria-valuenow", String(complete ? 3 : campaignProgress.clues));
    campaignStart.textContent = complete ? "Read the case ending" : "Continue the mystery";
    campaignStart.setAttribute("aria-label", complete ? "Read the lab mystery ending" : `Continue ${chapter.title}`);
  }

  function saveCampaign() {
    try {
      localStorage.setItem(campaignKey, JSON.stringify(campaignProgress));
      campaignStorageError = false;
    } catch (error) {
      console.error("Could not save the lab mystery progress.", error);
      campaignStorageError = true;
    }
    paintCampaign();
  }

  paintCampaign();
  if (Array.isArray(TRANSFER_KEYS) && !TRANSFER_KEYS.includes(campaignKey)) TRANSFER_KEYS.push(campaignKey);
  saveRun = function () {
    if (!campaignActive) originalSaveRun();
  };

  const originalMergeProgress = mergeProgress;
  mergeProgress = function (incoming) {
    originalMergeProgress(incoming);
    if (!(campaignKey in incoming)) return;
    let imported;
    try {
      imported = normalizeCampaign(JSON.parse(incoming[campaignKey]));
    } catch (error) {
      console.error("Could not import the lab mystery progress.", error);
      throw error;
    }
    if (!imported) throw new Error("The imported lab mystery progress is invalid.");
    if (imported.chapter > campaignProgress.chapter) {
      campaignProgress = {
        ...imported,
        totalClues: Math.max(campaignProgress.totalClues, imported.totalClues)
      };
    } else if (imported.chapter === campaignProgress.chapter) {
      campaignProgress = {
        chapter: campaignProgress.chapter,
        clues: Math.max(campaignProgress.clues, imported.clues),
        totalClues: Math.max(campaignProgress.totalClues, imported.totalClues)
      };
    } else {
      campaignProgress.totalClues = Math.max(campaignProgress.totalClues, imported.totalClues);
    }
    saveCampaign();
  };

  const topicChoice = controls.querySelector("#topicChoice");
  const allTopics = [...new Set(Q.map(question => {
    const parts = question[0].split(" · ").slice(1);
    return parts.join(" · ") || "General lab skills";
  }))].sort((a, b) => a.localeCompare(b));
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All benches";
  topicChoice.append(allOption);
  allTopics.forEach(topic => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    topicChoice.append(option);
  });

  const clockDisplay = document.createElement("p");
  clockDisplay.id = "roundClock";
  clockDisplay.setAttribute("role", "timer");
  clockDisplay.setAttribute("aria-live", "off");
  clockDisplay.hidden = true;
  document.querySelector("#game").prepend(clockDisplay);

  track = function (question, correct) {
    const oldTopic = question[0].split(" · ")[1] || question[0];
    const topic = question[0].split(" · ").slice(1).join(" · ") || question[0];
    originalTrack(question, correct);
    if (oldTopic !== topic && topicRes[oldTopic]) {
      const result = topicRes[oldTopic];
      delete topicRes[oldTopic];
      const aggregate = topicRes[topic] || (topicRes[topic] = { ok: 0, n: 0 });
      aggregate.ok += result.ok;
      aggregate.n += result.n;
    }
  };

  function clearClock() {
    if (clock !== null) {
      window.clearInterval(clock);
      clock = null;
    }
    clockDisplay.hidden = true;
  }

  function paintClock() {
    clockDisplay.textContent = `⏱ ${remainingSeconds}s left · the demonstrator has started tapping their clipboard`;
  }

  function startClock() {
    clearClock();
    if (roundStyle !== "expert" || mode !== "standard" || n >= run.length) return;
    remainingSeconds = 30;
    paintClock();
    clockDisplay.hidden = false;
    clock = window.setInterval(() => {
      remainingSeconds -= 1;
      paintClock();
      if (remainingSeconds <= 0) {
        clearClock();
        if (!locked) answer(document.createElement("button"), "", run[n]);
      }
    }, 1000);
  }

  function updateRoundControls() {
    const missed = resit().length;
    const review = controls.querySelector("#reviewMissed");
    review.disabled = missed === 0;
    review.textContent = missed
      ? `📁 Review missed questions · ${missed} awaiting redemption`
      : "📁 Review missed questions · folder empty, suspiciously";
  }

  updateRoundControls();

  const originalHome = home;
  const originalShowStory = showStory;
  const storyEyebrow = document.querySelector("#story .eyebrow");
  const storyTitle = document.querySelector("#story h2");
  const storyCopy = document.querySelector("#story > p");
  const goggles = document.querySelector("#goggles");
  const noGoggles = document.querySelector("#nogoggles");
  const storyContinue = document.querySelector("#storyContinue");

  function setStoryText(eyebrow, title, copy) {
    storyEyebrow.textContent = eyebrow;
    storyTitle.textContent = title;
    storyCopy.textContent = copy;
  }

  showStory = function () {
    originalShowStory();
    document.querySelector("#story").classList.add("mode-briefing");
    const selectedStyle = controls.querySelector("#styleChoice").value;
    if (quickBench) {
      const quickIntro = {
        survival: "Ten questions under standard Trust rules. No need to sprint; get one wrong and the explanation will help next time.",
        study: "Ten questions, no Trust penalties, and no need to sprint. The demonstrator is practising a supportive nod.",
        expert: "Ten questions, standard Trust rules, and 30 seconds each. The demonstrator says this is not a race, while visibly holding a stopwatch."
      };
      setStoryText(
        "THE QUICK BENCH",
        "A short shift. A very long clipboard.",
        quickIntro[selectedStyle]
      );
    } else if (selectedStyle === "study") {
      setStoryText(
        "THE STUDY BENCH",
        "Welcome. Take a breath; the pipettes are.",
        "Explore at your own pace. Wrong answers cost no Trust; skipping goggles still costs 20, because even this demonstrator takes lab safety seriously."
      );
    } else if (selectedStyle === "expert") {
      setStoryText(
        "THE EXPERT BENCH",
        "The stopwatch is nervous. You should be fine.",
        "You have 30 seconds per question. The demonstrator says this is not a race, while visibly holding a stopwatch."
      );
    } else {
      setStoryText(
        "THE PRACTICAL BEGINS",
        "Welcome to the lab. Your coat looks very official.",
        "Survival mode uses Trust penalties for wrong answers; Study mode switches them off. Every answer still comes with an explanation. Goggles are worth 20 Trust, because this demonstrator does take one thing seriously."
      );
    }
    goggles.textContent = "🥽 Goggles on · start with full Trust";
    noGoggles.textContent = "😎 Skip goggles · the demonstrator sighs (−20 Trust)";
  };

  function showChallengeIntro(challenge) {
    clearClock();
    if (challenge === "resit") reviewStudyNext = true;
    document.querySelector("#home").classList.add("hidden");
    document.querySelector("#play").classList.remove("hidden");
    document.querySelector("#score").parentElement.parentElement.classList.add("hidden");
    document.querySelector("#bar").classList.add("hidden");
    document.querySelector("#story").classList.remove("hidden");
    document.querySelector("#story").classList.add("mode-briefing");
    document.querySelector("#game").classList.add("hidden");
    document.querySelector("#finish").classList.add("hidden");
    document.querySelector("#eject").classList.add("hidden");
    document.querySelector("#storyPenalty").classList.add("hidden");
    goggles.classList.add("hidden");
    noGoggles.classList.add("hidden");
    storyContinue.classList.remove("hidden");
    if (challenge === "daily") {
      setStoryText(
        "TODAY'S MINI PRACTICAL",
        "Five questions. One tiny lab coat.",
        "Today's challenge is the same for everyone. Correct answers earn double competence; the demonstrator has hidden the answer key under a mug."
      );
      storyContinue.textContent = "🧠 Start today's challenge";
      storyContinue.onclick = () => begin("daily");
    } else if (challenge === "resit") {
      setStoryText(
        "THE RE-SIT ROOM",
        "The Concerning folder has requested a meeting.",
        "These are questions you missed before. Take your time: this is a study bench, not a disciplinary hearing. The folder has no legal representation."
      );
      storyContinue.textContent = "📁 Review my missed questions";
      storyContinue.onclick = () => begin("resit");
    } else if (campaignProgress.chapter >= campaignChapters.length) {
      setStoryText(
        "CASE FILE · CLOSED",
        "The labels have been found. The stationery has been contained.",
        campaignChapters[campaignChapters.length - 1].ending
      );
      storyContinue.textContent = "Back to the lab lobby";
      storyContinue.onclick = home;
    } else {
      const chapter = campaignChapters[campaignProgress.chapter];
      setStoryText(
        `THE MISSING-LABEL MYSTERY · CHAPTER ${campaignProgress.chapter + 1} OF ${campaignChapters.length}`,
        chapter.title,
        `${chapter.intro} Find three clues by answering questions correctly. Wrong answers cost no Trust; the demonstrator's filing system is the only thing at risk.`
      );
      storyContinue.textContent = "🔎 Investigate · no Trust penalties";
      storyContinue.onclick = () => {
        campaignActive = true;
        campaignRoundChapter = campaignProgress.chapter;
        begin("standard");
      };
    }
  }

  home = function () {
    clearClock();
    campaignActive = false;
    originalHome();
    updateRoundControls();
  };

  begin = function (which, initialRep = 100) {
    clearClock();
    if (which !== "standard") {
      activeChallenge = which;
      roundStyle = which === "resit" && reviewStudyNext ? "study" : "survival";
      reviewStudyNext = false;
      return originalBegin(which, initialRep);
    }

    roundStyle = campaignActive ? "study" : controls.querySelector("#styleChoice").value;
    activeChallenge = campaignActive
      ? "story"
      : quickBench && roundStyle === "expert"
        ? "expert"
        : quickBench
          ? "quick"
          : roundStyle;
    const topic = campaignActive ? "all" : topicChoice.value;
    const selected = topic === "all"
      ? Q.slice()
      : Q.filter(question => {
          const parts = question[0].split(" · ").slice(1);
          return (parts.join(" · ") || "General lab skills") === topic;
        });
    if (!selected.length) {
      throw new Error(`No questions are available for the selected bench: ${topic}`);
    }

    const requestedLength = campaignActive
      ? 5
      : quickBench
        ? 10
        : controls.querySelector("#lengthChoice").value;
    limit = requestedLength === "all"
      ? (topic === "all" ? 0 : selected.length)
      : Math.min(Number(requestedLength), selected.length);
    const savedQuestions = Q.slice();
    Q.splice(0, Q.length, ...selected);
    try {
      originalBegin(
        roundStyle === "study" ? "practice" : "standard",
        initialRep
      );
    } finally {
      Q.splice(0, Q.length, ...savedQuestions);
      quickBench = false;
    }
    startClock();
  };

  show = function () {
    clearClock();
    originalShow();
    if (campaignActive) {
      document.querySelector("#risk").classList.add("hidden");
      document.querySelector("#meta").textContent = `MISSING-LABEL MYSTERY · CHAPTER ${campaignRoundChapter + 1} · QUESTION ${n + 1} OF ${run.length}`;
    } else if (mode === "practice" || (mode === "resit" && roundStyle === "study")) {
      document.querySelector("#risk").classList.add("hidden");
      document.querySelector("#meta").textContent = `STUDY MODE · no Trust penalties · ${document.querySelector("#meta").textContent}`;
    } else if (roundStyle === "expert" && mode === "standard") {
      document.querySelector("#meta").textContent = `EXPERT TIMER · ${document.querySelector("#meta").textContent}`;
    }
    const progress = document.querySelector("#bar");
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", "Practical progress");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", String(run.length));
    progress.setAttribute("aria-valuenow", String(Math.min(n, run.length)));
    startClock();
  };

  answer = function (button, text, question) {
    clearClock();
    const inCampaign = campaignActive;
    const isStudy = mode === "practice" || (mode === "resit" && roundStyle === "study");
    const isCorrect = text === question[3];
    const reputationBeforeAnswer = rep;
    const streakBeforeAnswer = streak;
    const mistakeDebtBeforeAnswer = mistakeDebt;
    if (isStudy) {
      risk = false;
      rep = Math.max(rep, 100);
    }
    originalAnswer(button, text, question);
    if (isStudy) {
      rep = reputationBeforeAnswer;
      document.querySelector("#rep").textContent = String(rep);
      if (!isCorrect && !inCampaign) {
        const feedback = document.querySelector("#feedback");
        feedback.replaceChildren();
        const message = document.createElement("b");
        message.textContent = "📚 No Trust lost in Study mode. The demonstrator has merely sighed.";
        feedback.append(message, document.createTextNode(` ${question[4]}`));
      }
    }
    if (inCampaign) {
      if (!isCorrect) {
        streak = streakBeforeAnswer;
        mistakeDebt = mistakeDebtBeforeAnswer;
        document.querySelector("#streak").textContent = String(streak);
      }
      const feedback = document.querySelector("#feedback");
      const message = document.createElement("b");
      let campaignSolved = false;
      if (isCorrect && campaignProgress.chapter === campaignRoundChapter && campaignProgress.clues < 3) {
        const clue = campaignChapters[campaignRoundChapter].clues[campaignProgress.clues];
        campaignProgress.clues += 1;
        campaignProgress.totalClues += 1;
        if (campaignProgress.clues === 3) {
          campaignProgress.chapter += 1;
          campaignProgress.clues = 0;
          campaignSolved = true;
        }
        saveCampaign();
        message.textContent = `🔎 Clue found: ${clue}`;
      } else if (isCorrect) {
        message.textContent = "🧪 Correct! The demonstrator's notes are now legible, which is a separate mystery.";
      } else {
        const mishaps = [
          "The demonstrator has labelled the clipboard 'specimen'. No Trust lost; here's the clue in the explanation:",
          "A tube has rolled under the bench. The demonstrator says it is 'part of the investigation'. No Trust lost; here's why:",
          "The marker has written on the demonstrator's sleeve again. No Trust lost; let's look at the science:"
        ];
        message.textContent = `📎 ${mishaps[(campaignRoundChapter + n) % mishaps.length]}`;
      }
      feedback.replaceChildren(message, document.createTextNode(` ${question[4]}`));
      if (campaignSolved) {
        run.length = n + 1;
        document.querySelector("#next").textContent = "Read the chapter report";
        document.querySelector("#bar").setAttribute("aria-valuemax", String(run.length));
      }
    }
    updateRoundControls();
  };

  finish = function () {
    clearClock();
    const isCampaign = campaignActive;
    const chapterIndex = campaignRoundChapter;
    originalFinish();
    const card = document.querySelector("#finish");
    if (card.classList.contains("hidden")) return;

    if (isCampaign) {
      const completedChapter = campaignProgress.chapter > chapterIndex;
      const closing = document.createElement("section");
      closing.className = "campaign-clue";
      const closingTitle = document.createElement("b");
      const closingCopy = document.createElement("p");
      closingCopy.className = "mode-briefing-copy";
      if (completedChapter) {
        closingTitle.textContent = "🗂️ Case notes · three clues, no casualties";
        closingCopy.textContent = campaignChapters[chapterIndex].ending;
      } else {
        closingTitle.textContent = `🔍 Case notes · ${campaignProgress.clues} of 3 clues found`;
        closingCopy.textContent = "Nothing lost and no progress erased. Continue this chapter whenever you're ready; the demonstrator is still looking for the marker lid.";
      }
      closing.append(closingTitle, closingCopy);
      const nextChapter = document.createElement("p");
      nextChapter.textContent = campaignProgress.chapter >= campaignChapters.length
        ? campaignChapters[campaignChapters.length - 1].ending
        : completedChapter
          ? `Next up: ${campaignChapters[campaignProgress.chapter].title}. The demonstrator has packed a lunch and is emotionally prepared.`
          : "You can finish the chapter in another short shift. The case file stays open.";
      closing.append(nextChapter);
      card.prepend(closing);
      const topicReport = card.querySelector(".report");
      const resultHeading = card.querySelector("#finish h2");
      if (resultHeading) resultHeading.textContent = completedChapter
        ? "Case progress! The marker has been promoted to evidence."
        : "Shift complete. The mystery is still open; so is the kettle.";
      if (topicReport) {
        const topicHeading = topicReport.querySelector("b");
        topicReport.replaceChildren(topicHeading);
        topicHeading.textContent = "🧫 Topic notes · useful leads, zero judgement";
        const reviewTopics = Object.entries(topicRes)
          .map(([name, result]) => ({ name, ...result }))
          .filter(result => result.ok < result.n)
          .sort((a, b) => a.ok / a.n - b.ok / b.n)
          .slice(0, 3);
        if (reviewTopics.length) {
          const list = document.createElement("ul");
          reviewTopics.forEach(result => {
            const item = document.createElement("li");
            item.textContent = `${result.name}: ${result.ok}/${result.n} correct. A useful lead for next time; the demonstrator has written it on a sticky note, not your permanent record.`;
            list.append(item);
          });
          topicReport.append(list);
        } else {
          const note = document.createElement("p");
          note.textContent = "No review flags. The demonstrator has found nothing to circle except a tea stain.";
          topicReport.append(note);
        }
      }
      const replay = card.querySelector("#again");
      if (replay) replay.classList.add("hidden");
      const continueButton = document.createElement("button");
      continueButton.className = "next";
      continueButton.textContent = campaignProgress.chapter >= campaignChapters.length
        ? "Read the case ending"
        : completedChapter
          ? "Continue to the next chapter"
          : "Try this chapter again";
      continueButton.onclick = () => showChallengeIntro("campaign");
      const homeButton = card.querySelector("#finishHome");
      if (homeButton) homeButton.before(continueButton);
      campaignActive = false;
      paintCampaign();
      return;
    }

    const verdicts = {
      story: "The case file is open. The demonstrator has labelled the folder 'definitely not a mess'.",
      daily: "Daily challenge filed. The demonstrator awards you one imaginary sticker and keeps the real ones for the pipettes.",
      resit: "The Concerning folder is lighter. The demonstrator is pretending this was all part of the plan.",
      practice: "Curiosity: excellent. Trust: untouched. The demonstrator has put the whistle away.",
      expert: "You faced the stopwatch and it blinked first. The demonstrator would like the stopwatch back.",
      quick: roundStyle === "study"
        ? "Ten questions explored, no Trust lost. The demonstrator calls that a very civilised little shift."
        : "Ten questions survived. The demonstrator calls that a productive little shift.",
      survival: "You made it through the practical. The lab coat is still yours; the pipettes are discussing it."
    };
    let verdictMode = activeChallenge;
    if (mode === "standard" && activeChallenge === "study") verdictMode = "practice";
    const verdict = document.createElement("aside");
    verdict.className = "demonstrator-verdict";
    const verdictTitle = document.createElement("b");
    verdictTitle.textContent = "🥼 The demonstrator's sign-off";
    verdict.append(verdictTitle, document.createTextNode(verdicts[verdictMode] || verdicts.survival));
    const resultHeading = card.querySelector("h2");
    if (resultHeading) resultHeading.after(verdict);

    const topics = Object.entries(topicRes)
      .map(([name, result]) => ({ name, ...result, accuracy: result.ok / result.n }))
      .sort((a, b) => b.accuracy - a.accuracy);
    const summary = document.createElement("section");
    summary.className = "report";
    const heading = document.createElement("b");
    heading.textContent = "🧫 Bench notes (the clipboard has opinions)";
    summary.append(heading);
    const details = document.createElement("p");
    if (!topics.length) {
      details.textContent = "No topic data today. The demonstrator has nothing to annotate.";
    } else if (topics.length === 1) {
      const only = topics[0];
      details.textContent = `${only.name}: ${only.ok}/${only.n}. ${
        only.accuracy < 1
          ? "Worth another look. The pipette is available for emotional support."
          : "All recorded answers correct. The demonstrator is checking the marking scheme."
      }`;
    } else {
      const strongest = topics[0];
      const weakest = topics[topics.length - 1];
      details.textContent = `Strongest: ${strongest.name} (${strongest.ok}/${strongest.n}). ${
        weakest.accuracy < 1
          ? `Worth another look: ${weakest.name} (${weakest.ok}/${weakest.n}). The pipette is available for emotional support.`
          : "Every recorded answer was correct. The demonstrator is checking the marking scheme."
      }`;
    }
    summary.append(details);
    card.prepend(summary);
    updateRoundControls();
  };

  document.querySelector("#quick").onclick = () => {
    quickBench = true;
    showStory();
  };
  document.querySelector("#dailyStart").onclick = () => showChallengeIntro("daily");
  document.querySelector("#resitBtn").onclick = () => showChallengeIntro("resit");
  campaignStart.onclick = () => showChallengeIntro("campaign");
  controls.querySelector("#reviewMissed").onclick = () => {
    limit = 0;
    reviewStudyNext = true;
    showChallengeIntro("resit");
  };

  const accountStyles = document.createElement("style");
  accountStyles.textContent = `
    .account-toolbar{position:sticky;top:8px;z-index:1000;display:flex;justify-content:flex-end;align-items:center;gap:10px;min-height:40px;margin:-10px 0 8px;pointer-events:none}
    .account-toolbar .account-actions,.account-toolbar #account-user-button{display:flex;align-items:center;gap:8px;pointer-events:auto}
    .account-toolbar [hidden]{display:none!important}
    .account-toolbar button{min-height:38px;padding:7px 12px;border:1px solid #c9dce8;border-radius:10px;background:#fff;color:#102a43;font:inherit;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 3px 12px #102a4315}
    .account-toolbar button:disabled{opacity:.65;cursor:wait}
    .account-toolbar button:hover{border-color:#1769aa;background:#f4f9fc}
    .account-toolbar button:focus-visible{outline:3px solid #f5c451;outline-offset:2px}
    .account-toolbar .account-status{position:static;max-width:min(44vw,420px);padding:5px 9px;border-radius:8px;background:#102a43;color:#fff;font-size:12px;text-align:right;box-shadow:0 3px 12px #102a4325}
    .account-toolbar .account-status:empty{display:none}
    .account-toolbar .account-status[data-error="true"]{background:#8b2424}
    @media(max-width:480px){.account-toolbar{top:4px;margin:-8px 0 6px}.account-toolbar button{min-height:36px;padding:6px 9px;font-size:12px}.account-toolbar .account-actions{gap:5px}.account-toolbar .account-status{max-width:32vw;padding:4px 6px;font-size:10px}}
  `;
  document.head.append(accountStyles);

  const accountToolbar = document.createElement("nav");
  accountToolbar.className = "account-toolbar";
  accountToolbar.setAttribute("aria-label", "Learning account");
  accountToolbar.innerHTML = `
    <div class="account-actions">
      <button id="account-open-sign-in" type="button" disabled>Back for another practical?</button>
      <button id="account-open-sign-up" type="button" disabled>New here? Sign up before the pipettes notice</button>
    </div>
    <div id="account-user-button" hidden></div>
    <span id="account-status" class="account-status" role="status" aria-live="polite">Connecting to Clerk…</span>
  `;
  homeCard.before(accountToolbar);

  const accountStatus = accountToolbar.querySelector("#account-status");
  const accountActions = accountToolbar.querySelector(".account-actions");
  const signInButton = accountToolbar.querySelector("#account-open-sign-in");
  const signUpButton = accountToolbar.querySelector("#account-open-sign-up");
  const userButtonContainer = accountToolbar.querySelector("#account-user-button");
  const publishableKey = "pk_test_aWRlYWwtcHVtYS0zNDcwLmNsZXJrLmFjY291bnRzLmRldiQ";
  const clerkOrigin = "https://ideal-puma-3470.clerk.accounts.dev";
  const syncedProgressField = "practicalSurvivalProgress";
  const maxSyncedMetadataBytes = 7500;
  let clerk;
  let userButtonMounted = false;
  let activeUser = null;
  let applyingSyncedProgress = false;
  let syncTimer = 0;
  let syncRunning = false;
  let syncPending = false;
  let lastCloudWriteAt = 0;
  let accountStatusTimer = 0;
  const minCloudWriteInterval = 5000;
  const progressKeys = new Set(TRANSFER_KEYS);

  function showAccountError(error) {
    window.clearTimeout(accountStatusTimer);
    accountStatus.dataset.error = "true";
    const reason = (error.message || "check your connection and try again").replace(/[.!?]+$/, "");
    accountStatus.textContent = `Account or progress sync problem: ${reason}. Your local progress is still here.`;
    console.error("Clerk account or progress sync failed.", error);
  }

  function loadClerkScript(src, key) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      if (key) script.dataset.clerkPublishableKey = key;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load Clerk script: ${src}`));
      document.head.append(script);
    });
  }

  function showAccountStatus(message) {
    window.clearTimeout(accountStatusTimer);
    accountStatus.dataset.error = "false";
    accountStatus.textContent = message;
    if (message) {
      accountStatusTimer = window.setTimeout(() => {
        accountStatus.textContent = "";
      }, 4500);
    }
  }

  function renderAccount(user) {
    try {
      if (user) {
        const newUser = activeUser?.id !== user.id;
        activeUser = user;
        accountActions.hidden = true;
        userButtonContainer.hidden = false;
        if (!userButtonMounted) {
          clerk.mountUserButton(userButtonContainer);
          userButtonMounted = true;
        }
        if (newUser) {
          lastCloudWriteAt = 0;
          showAccountStatus("Signed in. The demonstrator is checking your clipboard…");
          queueProgressSync();
        }
        return;
      }

      activeUser = null;
      if (userButtonMounted) {
        clerk.unmountUserButton(userButtonContainer);
        userButtonMounted = false;
      }
      userButtonContainer.hidden = true;
      accountActions.hidden = false;
      showAccountStatus("");
    } catch (error) {
      showAccountError(error);
    }
  }

  signInButton.addEventListener("click", async () => {
    try {
      await clerk.openSignIn();
    } catch (error) {
      showAccountError(error);
    }
  });

  signUpButton.addEventListener("click", async () => {
    try {
      await clerk.openSignUp();
    } catch (error) {
      showAccountError(error);
    }
  });

  function parseCloudProgress(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("The saved Clerk progress has an invalid format.");
    }
    if (new TextEncoder().encode(JSON.stringify(value)).length > maxSyncedMetadataBytes) {
      throw new Error("The saved Clerk progress is larger than the supported sync limit.");
    }

    const clean = {};
    for (const key of TRANSFER_KEYS) {
      if (!(key in value)) continue;
      const item = value[key];
      const isRecord = item !== null && typeof item === "object" && !Array.isArray(item);
      const valid = key === STORE
        ? Array.isArray(item) && item.length <= 10 && item.every(run => run && typeof run === "object" && Number.isFinite(run.score) && Number.isFinite(run.streak) && typeof run.date === "string" && typeof run.mode === "string")
        : key === ACH
          ? isRecord && Object.values(item).every(date => typeof date === "string")
          : key === STATS
            ? isRecord && Object.values(item).every(stat => ["string", "number", "boolean"].includes(typeof stat) && (typeof stat !== "number" || Number.isFinite(stat)))
            : key === DAILYDONE
              ? typeof item === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item)
              : key === RESIT
                ? Array.isArray(item) && item.length <= 200 && item.every(question => typeof question === "string" && question.length <= 500)
                : key === ATT
                  ? isRecord && ["n", "best", "cl"].every(field => item[field] === undefined || Number.isFinite(item[field])) && (item.last === undefined || typeof item.last === "string")
                  : key === campaignKey
                    ? isRecord && Number.isInteger(item.chapter) && item.chapter >= 0 && item.chapter <= 3 && Number.isInteger(item.clues) && item.clues >= 0 && item.clues <= 3 && Number.isInteger(item.totalClues) && item.totalClues >= 0 && item.totalClues <= 9
                    : false;
      if (!valid) {
        console.warn(`Ignoring invalid Clerk progress field "${key}".`);
        continue;
      }
      clean[key] = item;
    }
    return clean;
  }

  function readLocalProgress() {
    const progress = {};
    for (const key of TRANSFER_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try {
        progress[key] = JSON.parse(raw);
      } catch (error) {
        throw new Error(`Could not sync "${key}" because its local saved data is invalid.`, { cause: error });
      }
    }
    return progress;
  }

  function questionIdHash(questionId) {
    let hash = 2166136261;
    for (let i = 0; i < questionId.length; i++) {
      hash = Math.imul(hash ^ questionId.charCodeAt(i), 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function compactResit(questionIds) {
    const questionIdsByHash = new Map();
    ALL().forEach(question => {
      const hash = questionIdHash(question[1]);
      const matches = questionIdsByHash.get(hash) || new Set();
      matches.add(question[1]);
      questionIdsByHash.set(hash, matches);
    });

    return questionIds.map(questionId => {
      const hash = questionIdHash(questionId);
      const matchingQuestions = questionIdsByHash.get(hash);
      return matchingQuestions?.size === 1 && matchingQuestions.has(questionId)
        ? `@${hash}`
        : `!${encodeURIComponent(questionId)}`;
    });
  }

  function expandResit(questionRefs) {
    const questionIdsByHash = new Map();
    ALL().forEach(question => questionIdsByHash.set(questionIdHash(question[1]), question[1]));
    return questionRefs.flatMap(reference => {
      if (reference.startsWith("!")) {
        try {
          return [decodeURIComponent(reference.slice(1))];
        } catch (error) {
          console.warn("Ignoring a malformed saved re-sit question reference.", error);
          return [];
        }
      }
      if (!reference.startsWith("@")) return [reference];
      const questionId = questionIdsByHash.get(reference.slice(1));
      if (!questionId) {
        console.warn(`Ignoring a saved re-sit question that is not in the current question bank: "${reference}".`);
        return [];
      }
      return [questionId];
    });
  }

  function compactProgress(progress) {
    return {
      ...progress,
      ...(Array.isArray(progress[RESIT]) ? { [RESIT]: compactResit(progress[RESIT]) } : {})
    };
  }

  function queueProgressSync() {
    if (!activeUser) return;
    syncPending = true;
    if (lastCloudWriteAt && !syncRunning) {
      showAccountStatus("Progress saved. The demonstrator will file it after a short pause…");
    }
    window.clearTimeout(syncTimer);
    const throttleDelay = Math.max(0, minCloudWriteInterval - (Date.now() - lastCloudWriteAt));
    syncTimer = window.setTimeout(runProgressSync, Math.max(1000, throttleDelay));
  }

  async function runProgressSync() {
    if (!activeUser || syncRunning) return;
    syncRunning = true;
    syncPending = false;
    const user = activeUser;
    try {
      const remote = user.unsafeMetadata?.[syncedProgressField];
      if (remote !== undefined) {
        const cleanedRemote = parseCloudProgress(remote);
        if (Array.isArray(cleanedRemote[RESIT])) {
          cleanedRemote[RESIT] = expandResit(cleanedRemote[RESIT]);
        }
        applyingSyncedProgress = true;
        try {
          mergeProgress(Object.fromEntries(Object.entries(cleanedRemote).map(([key, value]) => [key, JSON.stringify(value)])));
        } finally {
          applyingSyncedProgress = false;
        }
      }

      const progress = parseCloudProgress(readLocalProgress());
      const cloudProgress = compactProgress(progress);
      const progressSize = new TextEncoder().encode(JSON.stringify(cloudProgress)).length;
      if (progressSize > maxSyncedMetadataBytes) {
        throw new Error("Your progress is too large to fit in Clerk's 8 KB metadata limit. It remains saved in this browser.");
      }

      const updatedMetadata = { ...user.unsafeMetadata, [syncedProgressField]: cloudProgress };
      if (new TextEncoder().encode(JSON.stringify(updatedMetadata)).length > maxSyncedMetadataBytes) {
        throw new Error("Your Clerk account's metadata is too close to its 8 KB limit to sync this progress.");
      }

      if (JSON.stringify(remote) !== JSON.stringify(cloudProgress)) {
        await user.updateMetadata({ unsafeMetadata: { [syncedProgressField]: cloudProgress } });
        lastCloudWriteAt = Date.now();
      }
      showAccountStatus("Progress synced. The demonstrator has filed your clipboard under “not lost this time”.");
    } catch (error) {
      showAccountError(error);
    } finally {
      syncRunning = false;
      if (syncPending) queueProgressSync();
    }
  }

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this === window.localStorage && progressKeys.has(String(key)) && !applyingSyncedProgress) {
      queueProgressSync();
    }
  };

  window.addEventListener("storage", event => {
    if (event.storageArea === window.localStorage && progressKeys.has(event.key)) {
      queueProgressSync();
    }
  });

  async function initializeClerk() {
    if (location.protocol === "file:") {
      accountActions.hidden = false;
      showAccountStatus("Sign-in needs localhost or HTTPS; the practical still works from this file.");
      return;
    }

    await loadClerkScript(`${clerkOrigin}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadClerkScript(`${clerkOrigin}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, publishableKey);
    clerk = window.Clerk;
    if (!clerk) throw new Error("The Clerk JavaScript SDK did not initialize.");

    await clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
    signInButton.disabled = false;
    signUpButton.disabled = false;
    renderAccount(clerk.user);
    clerk.addListener(({ user }) => renderAccount(user === undefined ? clerk.user : user), { skipInitialEmit: true });
  }

  initializeClerk().catch(showAccountError);
})();
