"use strict";

(function () {
  const DISCLAIMER = "Student-written tips, not official guidance. Your practical handout, risk assessment and demonstrator always come first, especially for safety.";
  const CONFIDENCE = {
    checked: ["✔ Checked", "Matches course material or demonstrator advice"],
    several: ["👥 Several students", "Reported by more than one student"],
    single: ["🟡 One student", "A single student's experience"],
    personal: ["🔵 Personal tip", "A preference, not a rule"],
    outdated: ["⚠ May be outdated", "The course or software may have changed"]
  };
  const TYPES = ["mistake", "why", "tool"];
  const app = document.getElementById("app");
  const siteFooter = document.getElementById("site-footer");
  const liveStatus = document.getElementById("live-status");
  let state;

  function element(tag, attributes, children) {
    const node = document.createElement(tag);
    const options = attributes || {};
    Object.keys(options).forEach(function (key) {
      if (key === "className") node.className = options[key];
      else if (key === "text") node.textContent = options[key];
      else if (key === "hidden" || key === "open") node[key] = options[key];
      else node.setAttribute(key, options[key]);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function text(tag, value, className) {
    return element(tag, { text: value, className: className || "" });
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function isString(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function isKebab(value) {
    return isString(value) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  }

  function validHttps(value) {
    if (value === "") return true;
    if (typeof value !== "string") return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch (error) {
      return false;
    }
  }

  function addProblem(problems, scope, field, message) {
    problems.push(scope + ": " + field + " — " + message);
  }

  function validateData() {
    const problems = [];
    const moduleIds = new Set();
    const practicalIds = new Set();
    const conceptIds = new Set();
    const entryIds = new Set();

    const modules = [];
    if (!Array.isArray(BT_MODULES)) {
      addProblem(problems, "data", "modules", "must be an array");
    } else {
      BT_MODULES.forEach(function (item, index) {
        const scope = item && item.id || "module " + (index + 1);
        if (!item || !isKebab(item.id) || !isString(item.title)) {
          addProblem(problems, scope, "record", "a kebab-case id and title are required");
        } else if (moduleIds.has(item.id)) {
          addProblem(problems, scope, "id", "duplicate module id");
        } else {
          moduleIds.add(item.id);
          modules.push(item);
        }
      });
    }

    const concepts = [];
    if (!Array.isArray(BT_CONCEPTS)) {
      addProblem(problems, "data", "concepts", "must be an array");
    } else {
      BT_CONCEPTS.forEach(function (item, index) {
        const scope = item && item.id || "concept " + (index + 1);
        let valid = true;
        if (!item || !isKebab(item.id)) {
          addProblem(problems, scope, "id", "must be unique kebab-case");
          valid = false;
        } else if (conceptIds.has(item.id)) {
          addProblem(problems, scope, "id", "duplicate concept id");
          valid = false;
        }
        if (!item || !isString(item.label)) {
          addProblem(problems, scope, "label", "is required");
          valid = false;
        }
        if (item && item.note !== undefined && typeof item.note !== "string") {
          addProblem(problems, scope, "note", "must be a string");
          valid = false;
        }
        if (item && item.revise_url !== undefined && !validHttps(item.revise_url)) {
          addProblem(problems, scope, "revise_url", "must be empty or a safe HTTPS URL");
          valid = false;
        }
        if (valid) {
          conceptIds.add(item.id);
          concepts.push(item);
        }
      });
    }

    const practicalCandidates = [];
    if (!Array.isArray(BT_PRACTICALS)) {
      addProblem(problems, "data", "practicals", "must be an array");
    } else {
      BT_PRACTICALS.forEach(function (item, index) {
        const scope = item && item.id || "practical " + (index + 1);
        let valid = true;
        if (!item || !isKebab(item.id)) {
          addProblem(problems, scope, "id", "must be unique kebab-case");
          valid = false;
        } else if (practicalIds.has(item.id)) {
          addProblem(problems, scope, "id", "duplicate practical id");
          valid = false;
        }
        if (!item || !moduleIds.has(item.module)) {
          addProblem(problems, scope, "module", "unknown module");
          valid = false;
        }
        if (!item || !Number.isInteger(item.order)) {
          addProblem(problems, scope, "order", "must be an integer");
          valid = false;
        }
        if (!item || !isString(item.title)) {
          addProblem(problems, scope, "title", "is required");
          valid = false;
        }
        if (!item || !Array.isArray(item.concepts)) {
          addProblem(problems, scope, "concepts", "must be an array");
          valid = false;
        } else if (item.concepts.some(function (id) { return !conceptIds.has(id); })) {
          addProblem(problems, scope, "concepts", "contains an unknown concept");
          valid = false;
        }
        if (item && item.placeholder !== undefined && typeof item.placeholder !== "boolean") {
          addProblem(problems, scope, "placeholder", "must be a boolean");
          valid = false;
        }
        if (valid) {
          practicalIds.add(item.id);
          practicalCandidates.push(item);
        }
      });
    }

    const entries = [];
    if (!Array.isArray(BT_ENTRIES)) {
      addProblem(problems, "data", "entries", "must be an array");
    } else {
      BT_ENTRIES.forEach(function (item, index) {
        const scope = item && item.id || "entry " + (index + 1);
        let valid = true;
        if (!item || !isKebab(item.id)) {
          addProblem(problems, scope, "id", "must be unique kebab-case");
          valid = false;
        } else if (entryIds.has(item.id)) {
          addProblem(problems, scope, "id", "duplicate entry id");
          valid = false;
        }
        if (!item || !TYPES.includes(item.type)) {
          addProblem(problems, scope, "type", "must be mistake, why, or tool");
          valid = false;
        }
        if (!item || !moduleIds.has(item.module)) {
          addProblem(problems, scope, "module", "unknown module");
          valid = false;
        }
        if (!item || !Object.prototype.hasOwnProperty.call(item, "practical")) {
          addProblem(problems, scope, "practical", "is required; use null only for module-wide tools");
          valid = false;
        } else if (item.practical === null) {
          if (item.type !== "tool") {
            addProblem(problems, scope, "practical", "only tools can be module-wide");
            valid = false;
          }
        } else if (!practicalIds.has(item.practical)) {
          addProblem(problems, scope, "practical", "unknown practical");
          valid = false;
        } else {
          const practical = practicalCandidates.find(function (candidate) { return candidate.id === item.practical; });
          if (practical && practical.module !== item.module) {
            addProblem(problems, scope, "module", "does not match the practical's module");
            valid = false;
          }
        }
        if (!item || !Array.isArray(item.concepts)) {
          addProblem(problems, scope, "concepts", "must be an array");
          valid = false;
        } else if (item.concepts.some(function (id) { return !conceptIds.has(id); })) {
          addProblem(problems, scope, "concepts", "contains an unknown concept");
          valid = false;
        }
        if (!item || !Object.prototype.hasOwnProperty.call(CONFIDENCE, item.confidence)) {
          addProblem(problems, scope, "confidence", "invalid label");
          valid = false;
        }
        if (!item || !Number.isInteger(item.year) || item.year < 2000 || item.year > 2100) {
          addProblem(problems, scope, "year", "must be a four-digit year");
          valid = false;
        }
        if (item && item.priority !== undefined && !Number.isInteger(item.priority)) {
          addProblem(problems, scope, "priority", "must be an integer");
          valid = false;
        }
        if (item && item.placeholder !== undefined && typeof item.placeholder !== "boolean") {
          addProblem(problems, scope, "placeholder", "must be a boolean");
          valid = false;
        }

        const requiredFields = item && item.type === "mistake"
          ? ["error", "consequence", "cause", "prevention"]
          : item && item.type === "why"
            ? ["question", "reason"]
            : item && item.type === "tool"
              ? ["name", "use_when", "why", "needed_by"]
              : [];
        requiredFields.forEach(function (field) {
          if (!isString(item[field])) {
            addProblem(problems, scope, field, "is required");
            valid = false;
          }
        });
        if (item && item.type === "tool" && item.link !== undefined && !validHttps(item.link)) {
          addProblem(problems, scope, "link", "must be empty or a safe HTTPS URL");
          valid = false;
        }
        if (item && item.type === "tool" && item.check_ai_policy !== undefined && typeof item.check_ai_policy !== "boolean") {
          addProblem(problems, scope, "check_ai_policy", "must be a boolean");
          valid = false;
        }
        if (valid) {
          entryIds.add(item.id);
          entries.push(item);
        }
      });
    }

    let config = { suggest_url: "" };
    if (typeof BT_CONFIG !== "undefined") {
      if (!BT_CONFIG || (BT_CONFIG.suggest_url !== undefined && !validHttps(BT_CONFIG.suggest_url))) {
        addProblem(problems, "config", "suggest_url", "must be empty or a safe HTTPS URL");
      } else {
        config = { suggest_url: BT_CONFIG.suggest_url || "" };
      }
    }

    return {
      modules: modules,
      practicals: practicalCandidates,
      concepts: concepts,
      entries: entries,
      config: config,
      problems: problems
    };
  }

  function createDisclaimer() {
    return text("p", DISCLAIMER, "disclaimer");
  }

  function placeholderBanner() {
    const hasPlaceholders = state.practicals.some(function (item) { return item.placeholder === true; })
      || state.entries.some(function (item) { return item.placeholder === true; });
    return hasPlaceholders
      ? text("p", "Demo only: the labelled examples below are fictional placeholders, not student advice. No real student submissions have been added yet.", "banner")
      : null;
  }

  function addPageCommon(container) {
    const banner = placeholderBanner();
    if (banner) container.appendChild(banner);
  }

  function placeholderRibbon(item) {
    return item.placeholder === true ? text("span", "Fictional example · not real advice", "ribbon") : null;
  }

  function priority(item) {
    return Number.isInteger(item.priority) ? item.priority : 99;
  }

  function comparePriority(a, b) {
    return priority(a) - priority(b) || a.id.localeCompare(b.id);
  }

  function confidenceBadge(item) {
    return text("span", CONFIDENCE[item.confidence][0], "badge");
  }

  function metadata(item) {
    if (item.placeholder === true) {
      return [text("p", "Fictional demonstration only; not checked or reported by students.", "muted")];
    }
    const footer = element("div", { className: "card-footer" }, [
      confidenceBadge(item),
      text("span", "Written " + item.year)
    ]);
    const old = item.confidence === "outdated" || new Date().getFullYear() - item.year >= 3;
    return [footer, old ? text("p", "Check that this still applies.", "stale") : null];
  }

  function labelLegend() {
    const details = element("details", { id: "labels" });
    details.appendChild(text("summary", "What do the labels mean?"));
    const list = element("ul", { className: "legend-list" });
    Object.keys(CONFIDENCE).forEach(function (key) {
      list.appendChild(text("li", CONFIDENCE[key][0] + ": " + CONFIDENCE[key][1]));
    });
    details.appendChild(list);
    return details;
  }

  function entryCount(practical, type) {
    return state.entries.filter(function (item) {
      return item.type === type && (item.practical === practical.id || (type === "tool" && item.practical === null && item.module === practical.module));
    }).length;
  }

  function practicalCounts(practical) {
    function count(type, one, many) {
      const amount = entryCount(practical, type);
      return amount + " " + (amount === 1 ? one : many);
    }
    return count("mistake", "mistake", "mistakes")
      + " · " + count("why", "question", "questions")
      + " · " + count("tool", "tool", "tools");
  }

  function renderHome(message) {
    document.title = "Before Tomorrow | Biology Practical Companion";
    const fragment = document.createDocumentFragment();
    fragment.appendChild(text("p", "BIOLOGY PRACTICAL COMPANION", "eyebrow"));
    fragment.appendChild(text("h1", "Before Tomorrow"));
    fragment.appendChild(text("p", "What biology students discover too late.", "subtitle"));
    fragment.appendChild(createDisclaimer());
    addPageCommon(fragment);
    if (message) fragment.appendChild(element("p", { className: "status", role: "status", text: message }));
    if (!state.practicals.length) {
      fragment.appendChild(text("p", "No practical notes are available yet. Example content will only be shown when it is clearly labelled as fictional.", "status"));
    }

    let lastPracticalId = "";
    try {
      lastPracticalId = localStorage.getItem("bt:lastPractical") || "";
    } catch (error) {
      console.warn("Could not read the last practical from browser storage.", error);
    }
    const lastPractical = state.practicals.find(function (item) { return item.id === lastPracticalId; });
    if (lastPractical) {
      fragment.appendChild(element("a", {
        href: "?practical=" + encodeURIComponent(lastPractical.id),
        className: "button",
        text: "Continue: " + lastPractical.title
      }));
    }

    fragment.appendChild(text("h2", "Pick your practical"));
    state.modules.forEach(function (module) {
      const section = element("section", { className: "module-block" });
      section.appendChild(text("h2", module.title));
      const practicals = state.practicals.filter(function (item) { return item.module === module.id; })
        .sort(function (a, b) { return a.order - b.order || a.title.localeCompare(b.title); });
      if (!practicals.length) {
        section.appendChild(text("p", "No practical notes added yet.", "muted"));
      } else {
        const list = element("ul", { className: "practical-list" });
        practicals.forEach(function (practical) {
          const link = element("a", {
            href: "?practical=" + encodeURIComponent(practical.id),
            className: "practical-link"
          }, [
            text("span", practical.title, "practical-title"),
            text("span", practicalCounts(practical), "counts")
          ]);
          const item = element("li");
          const ribbon = placeholderRibbon(practical);
          if (ribbon) item.appendChild(ribbon);
          item.appendChild(link);
          list.appendChild(item);
        });
        section.appendChild(list);
      }
      fragment.appendChild(section);
    });
    fragment.appendChild(element("a", {
      href: "?view=tools",
      className: "secondary-link",
      text: "Tools students wish they'd found earlier"
    }));
    replaceMain(fragment);
    renderFooter();
    showDebug();
  }

  function row(label, value, className) {
    return element("div", { className: "card-row " + (className || "") }, [
      text("strong", label),
      text("span", value)
    ]);
  }

  function practicalEntries(practical) {
    return state.entries.filter(function (item) {
      return item.practical === practical.id
        || (item.type === "tool" && item.practical === null && item.module === practical.module);
    });
  }

  function mistakeCard(item, hidden) {
    const card = element("article", { className: "card" + (hidden ? " hidden extra-mistake" : "") });
    const ribbon = placeholderRibbon(item);
    if (ribbon) card.appendChild(ribbon);
    card.appendChild(text("h3", item.error));
    card.appendChild(row("What happens", item.consequence));
    card.appendChild(row("Why it happens", item.cause));
    card.appendChild(row("How to avoid it", item.prevention, "prevention"));
    metadata(item).forEach(function (node) { if (node) card.appendChild(node); });
    return card;
  }

  function whyEntry(item) {
    const details = element("details", { className: "entry" });
    const ribbon = placeholderRibbon(item);
    if (ribbon) details.appendChild(ribbon);
    details.appendChild(text("summary", item.question));
    details.appendChild(text("p", item.reason));
    metadata(item).forEach(function (node) { if (node) details.appendChild(node); });
    return details;
  }

  function toolCard(item) {
    const card = element("article", { className: "card" });
    const ribbon = placeholderRibbon(item);
    if (ribbon) card.appendChild(ribbon);
    card.appendChild(text("h3", item.name));
    card.appendChild(row("Use it when", item.use_when));
    card.appendChild(row("Why it helps", item.why));
    card.appendChild(row("Learn it by", item.needed_by, "prevention"));
    if (item.link) {
      card.appendChild(element("a", {
        href: item.link,
        target: "_blank",
        rel: "noopener noreferrer",
        text: "Open official resource"
      }));
    }
    if (item.check_ai_policy) {
      card.appendChild(text("p", "Check your module handbook's AI policy before using this for assessed work.", "ai-note"));
    }
    metadata(item).forEach(function (node) { if (node) card.appendChild(node); });
    return card;
  }

  function renderPractical(practical) {
    document.title = practical.title + " | Before Tomorrow";
    try {
      localStorage.setItem("bt:lastPractical", practical.id);
    } catch (error) {
      console.warn("Could not save the last practical in browser storage.", error);
    }

    const entries = practicalEntries(practical);
    const mistakes = entries.filter(function (item) { return item.type === "mistake"; }).sort(comparePriority);
    const questions = entries.filter(function (item) { return item.type === "why"; }).sort(comparePriority);
    const tools = entries.filter(function (item) { return item.type === "tool"; }).sort(comparePriority);
    const concepts = practical.concepts.map(function (id) {
      return state.concepts.find(function (item) { return item.id === id; });
    }).filter(Boolean);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(element("a", { href: "index.html", className: "back-link", text: "← All practicals" }));
    fragment.appendChild(element("div", { className: "title-line" }, [
      element("h1", { text: practical.title }),
      text("span", practical.module, "chip")
    ]));
    const practicalRibbon = placeholderRibbon(practical);
    if (practicalRibbon) fragment.appendChild(practicalRibbon);
    fragment.appendChild(createDisclaimer());
    addPageCommon(fragment);

    const sections = [
      [mistakes, "mistakes", "Top mistakes"],
      [questions, "questions", "Questions"],
      [tools, "tools", "Tools"],
      [concepts, "concepts", "Concepts"]
    ];
    const jumps = element("nav", { className: "jump-links", "aria-label": "On this page" });
    sections.forEach(function (section) {
      if (section[0].length) {
        jumps.appendChild(element("a", { href: "#" + section[1], text: section[2] }));
      }
    });
    jumps.appendChild(element("a", { href: "#labels", text: "Labels explained" }));
    fragment.appendChild(jumps);

    if (!entries.length) fragment.appendChild(text("p", "Nothing added for this practical yet.", "status"));
    if (mistakes.length) {
      const section = element("section", { id: "mistakes" });
      section.appendChild(text("h2", "Top mistakes"));
      mistakes.forEach(function (item, index) { section.appendChild(mistakeCard(item, index >= 3)); });
      if (mistakes.length > 3) {
        const button = element("button", {
          type: "button",
          "aria-expanded": "false",
          "aria-controls": "extra-mistakes",
          text: "Show " + (mistakes.length - 3) + " more"
        });
        const wrapper = element("div", { id: "extra-mistakes" });
        Array.from(section.querySelectorAll(".extra-mistake")).forEach(function (card) { wrapper.appendChild(card); });
        button.addEventListener("click", function () {
          const expanded = button.getAttribute("aria-expanded") === "true";
          wrapper.querySelectorAll(".extra-mistake").forEach(function (card) { card.classList.toggle("hidden", expanded); });
          button.setAttribute("aria-expanded", String(!expanded));
          button.textContent = expanded ? "Show " + (mistakes.length - 3) + " more" : "Show fewer";
        });
        section.appendChild(wrapper);
        section.appendChild(button);
      }
      fragment.appendChild(section);
    }
    if (questions.length) {
      const section = element("section", { id: "questions" }, [
        text("h2", "Questions worth being able to answer"),
        text("p", "Be ready to explain why, not just how. Open a question to check yourself.")
      ]);
      questions.forEach(function (item) { section.appendChild(whyEntry(item)); });
      fragment.appendChild(section);
    }
    if (tools.length) {
      const section = element("section", { id: "tools" }, [text("h2", "Tools worth knowing")]);
      tools.forEach(function (item) { section.appendChild(toolCard(item)); });
      fragment.appendChild(section);
    }
    if (concepts.length) {
      const section = element("section", { id: "concepts" }, [text("h2", "Concepts worth revising")]);
      const list = element("ul", { className: "concept-list" });
      concepts.forEach(function (concept) {
        const item = element("li", {}, [text("strong", concept.label)]);
        if (concept.note) item.appendChild(text("p", concept.note));
        if (concept.revise_url) {
          item.appendChild(element("a", {
            href: concept.revise_url,
            target: "_blank",
            rel: "noopener noreferrer",
            text: "Revise"
          }));
        }
        list.appendChild(item);
      });
      section.appendChild(list);
      fragment.appendChild(section);
    }
    const share = element("button", { type: "button", text: "Share this page" });
    share.addEventListener("click", function () { sharePage(practical.title); });
    fragment.appendChild(element("div", { className: "share-row" }, [share]));
    fragment.appendChild(labelLegend());
    replaceMain(fragment);
    renderFooter();
    showDebug();
  }

  async function sharePage(title) {
    const data = { title: title + " | Before Tomorrow", url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
        announce("Page shared.");
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(data.url);
        announce("Link copied.");
        return;
      }
      if (fallbackCopy(data.url)) {
        announce("Link copied.");
        return;
      }
      announce("Copy the page address from your browser to share it.");
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.error("Could not share or copy the page link.", error);
      announce("Could not copy the link. Copy the page address from your browser instead.");
    }
  }

  function fallbackCopy(value) {
    const input = element("textarea", { "aria-label": "Page link" });
    input.value = value;
    document.body.appendChild(input);
    input.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      console.warn("Clipboard fallback could not copy the page link.", error);
    } finally {
      input.remove();
    }
    return copied;
  }

  function announce(message) {
    liveStatus.textContent = "";
    window.setTimeout(function () { liveStatus.textContent = message; }, 10);
  }

  function renderTools(moduleId) {
    document.title = "Tools students wish they'd found earlier | Before Tomorrow";
    const validModule = state.modules.some(function (item) { return item.id === moduleId; }) ? moduleId : "";
    const fragment = document.createDocumentFragment();
    fragment.appendChild(element("a", { href: "index.html", className: "back-link", text: "← All practicals" }));
    fragment.appendChild(element("h1", { text: "Tools students wish they'd found earlier" }));
    fragment.appendChild(text("p", "Student-reported tools, not official recommendations.", "subtitle"));
    fragment.appendChild(createDisclaimer());
    addPageCommon(fragment);

    const filters = element("nav", { className: "filters", "aria-label": "Filter tools by module" });
    [{ id: "", title: "All modules" }].concat(state.modules).forEach(function (module) {
      const href = module.id ? "?view=tools&module=" + encodeURIComponent(module.id) : "?view=tools";
      filters.appendChild(element("a", {
        href: href,
        className: "filter-button",
        "aria-current": module.id === validModule ? "page" : "false",
        text: module.title
      }));
    });
    fragment.appendChild(filters);

    const tools = state.entries.filter(function (item) {
      return item.type === "tool" && (!validModule || item.module === validModule);
    }).sort(function (a, b) {
      return a.module.localeCompare(b.module) || comparePriority(a, b) || a.name.localeCompare(b.name);
    });
    if (!tools.length) fragment.appendChild(text("p", "No tools have been added yet.", "status"));
    tools.forEach(function (item) {
      const section = element("section");
      section.appendChild(text("p", item.module, "chip"));
      section.appendChild(toolCard(item));
      fragment.appendChild(section);
    });
    fragment.appendChild(labelLegend());
    replaceMain(fragment);
    renderFooter();
    showDebug();
  }

  function renderFooter() {
    clear(siteFooter);
    siteFooter.appendChild(text("p", "Student-written. Not official."));
    if (state.config.suggest_url) {
      siteFooter.appendChild(element("a", {
        href: state.config.suggest_url,
        target: "_blank",
        rel: "noopener noreferrer",
        text: "Suggest an entry"
      }));
    }
  }

  function showDebug() {
    if (new URLSearchParams(location.search).get("debug") !== "1") return;
    const panel = element("section", { className: "debug-panel" }, [text("h2", "Debug information")]);
    panel.appendChild(text("p", state.problems.length
      ? state.problems.length + " data problem(s) found."
      : "No data problems found."));
    if (state.problems.length) {
      const list = element("ul");
      state.problems.forEach(function (problem) { list.appendChild(text("li", problem)); });
      panel.appendChild(list);
    }
    state.practicals.forEach(function (practical) {
      const entries = practicalEntries(practical);
      const counts = TYPES.map(function (type) {
        return type + "=" + entries.filter(function (item) { return item.type === type; }).length;
      }).join(", ");
      panel.appendChild(text("p", practical.id + ": " + counts));
    });
    app.appendChild(panel);
  }

  function replaceMain(fragment) {
    clear(app);
    app.appendChild(fragment);
  }

  function route() {
    const params = new URLSearchParams(location.search);
    const practicalId = params.get("practical");
    if (practicalId) {
      const practical = state.practicals.find(function (item) { return item.id === practicalId; });
      if (practical) renderPractical(practical);
      else renderHome("We couldn't find that practical.");
    } else if (params.get("view") === "tools") {
      renderTools(params.get("module") || "");
    } else {
      renderHome("");
    }
  }

  function fatal(error) {
    console.error("Before Tomorrow could not load.", error);
    clear(app);
    app.appendChild(element("p", {
      className: "fatal",
      role: "alert",
      text: "Something went wrong loading this page. Refresh to try again; if the problem continues, check the practical data."
    }));
  }

  try {
    if (!app || !siteFooter || !liveStatus) throw new Error("Required page containers are missing.");
    state = validateData();
    window.addEventListener("popstate", route);
    route();
  } catch (error) {
    fatal(error);
  }
}());
