"use strict";

(function () {
  const DISCLAIMER = "These tips are reminders, not official instructions. For assessment requirements, methods and safety, follow your current module brief and teaching team.";
  const CONFIDENCE = {
    checked: ["Course-checked", "Matches current course material"],
    personal: ["Notebook tip", "A practical reminder to keep in mind"],
    outdated: ["Worth rechecking", "The course or software may have changed"]
  };
  const TYPES = ["note", "why", "tool"];
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
    const areaIds = new Set();
    const taskIds = new Set();
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

    const areas = [];
    if (!Array.isArray(BT_AREAS)) {
      addProblem(problems, "data", "areas", "must be an array");
    } else {
      BT_AREAS.forEach(function (item, index) {
        const scope = item && item.id || "area " + (index + 1);
        let valid = true;
        if (!item || !isKebab(item.id)) {
          addProblem(problems, scope, "id", "must be unique kebab-case");
          valid = false;
        } else if (areaIds.has(item.id)) {
          addProblem(problems, scope, "id", "duplicate area id");
          valid = false;
        }
        if (!item || !isString(item.title) || !isString(item.description)) {
          addProblem(problems, scope, "content", "title and description are required");
          valid = false;
        }
        if (valid) {
          areaIds.add(item.id);
          areas.push(item);
        }
      });
    }

    const taskCandidates = [];
    if (!Array.isArray(BT_TASKS)) {
      addProblem(problems, "data", "tasks", "must be an array");
    } else {
      BT_TASKS.forEach(function (item, index) {
        const scope = item && item.id || "task " + (index + 1);
        let valid = true;
        if (!item || !isKebab(item.id)) {
          addProblem(problems, scope, "id", "must be unique kebab-case");
          valid = false;
        } else if (taskIds.has(item.id)) {
          addProblem(problems, scope, "id", "duplicate task id");
          valid = false;
        }
        if (!item || !moduleIds.has(item.module)) {
          addProblem(problems, scope, "module", "unknown module");
          valid = false;
        }
        if (!item || !areaIds.has(item.area)) {
          addProblem(problems, scope, "area", "unknown area");
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
        if (item && item.description !== undefined && typeof item.description !== "string") {
          addProblem(problems, scope, "description", "must be a string");
          valid = false;
        }
        if (!item || !Array.isArray(item.concepts)) {
          addProblem(problems, scope, "concepts", "must be an array");
          valid = false;
        } else if (item.concepts.some(function (id) { return !conceptIds.has(id); })) {
          addProblem(problems, scope, "concepts", "contains an unknown concept");
          valid = false;
        }
        if (valid) {
          taskIds.add(item.id);
          taskCandidates.push(item);
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
          addProblem(problems, scope, "type", "must be note, why, or tool");
          valid = false;
        }
        if (!item || !moduleIds.has(item.module)) {
          addProblem(problems, scope, "module", "unknown module");
          valid = false;
        }
        if (!item || !isString(item.task) || !taskIds.has(item.task)) {
          addProblem(problems, scope, "task", "must link to a known task");
          valid = false;
        } else {
          const task = taskCandidates.find(function (candidate) { return candidate.id === item.task; });
          if (task && task.module !== item.module) {
            addProblem(problems, scope, "module", "does not match the task's module");
            valid = false;
          }
          if (task && task.area !== item.area) {
            addProblem(problems, scope, "area", "does not match the task's area");
            valid = false;
          }
        }
        if (!item || !areaIds.has(item.area)) {
          addProblem(problems, scope, "area", "unknown area");
          valid = false;
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
        if (item && item.kind !== undefined && typeof item.kind !== "string") {
          addProblem(problems, scope, "kind", "must be a string");
          valid = false;
        }
        const requiredFields = item && item.type === "note"
          ? ["title", "body"]
          : item && item.type === "why"
            ? ["question", "reason"]
            : item && item.type === "tool"
              ? ["name", "use_when", "why"]
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

    return {
      modules: modules,
      areas: areas,
      tasks: taskCandidates,
      concepts: concepts,
      entries: entries,
      problems: problems
    };
  }

  function createDisclaimer() {
    return text("p", DISCLAIMER, "disclaimer");
  }

  function priority(item) {
    return Number.isInteger(item.priority) ? item.priority : 99;
  }

  function comparePriority(a, b) {
    return priority(a) - priority(b) || a.id.localeCompare(b.id);
  }

  function moduleTitle(id) {
    const module = state.modules.find(function (item) { return item.id === id; });
    return module ? module.title : id;
  }

  function confidenceBadge(item) {
    return text("span", CONFIDENCE[item.confidence][0], "badge");
  }

  function metadata(item) {
    const footer = element("div", { className: "card-footer" }, [
      confidenceBadge(item),
      text("span", "Notebook · " + item.year)
    ]);
    const old = item.confidence === "outdated" || new Date().getFullYear() - item.year >= 3;
    return [footer, old ? text("p", "Check that this still applies.", "stale") : null];
  }

  function areaById(id) {
    return state.areas.find(function (item) { return item.id === id; });
  }

  function areaHref(moduleId, areaId) {
    return "?module=" + encodeURIComponent(moduleId) + "&area=" + encodeURIComponent(areaId);
  }

  function taskHref(task) {
    return areaHref(task.module, task.area) + "&task=" + encodeURIComponent(task.id);
  }

  function entriesForTask(task) {
    return state.entries.filter(function (item) { return item.task === task.id; });
  }

  function renderHome(message) {
    document.title = "Before Tomorrow | Biology Study Notebook";
    const fragment = document.createDocumentFragment();
    const hero = element("section", { className: "notebook-hero" });
    const introduction = element("div", { className: "notebook-introduction" }, [
      text("p", "A NOTEBOOK FOR THE NEXT LAB", "eyebrow"),
      text("h1", "Before Tomorrow"),
      text("p", "Find a task, catch the easy-to-miss details, and carry a useful tip into your next session.", "subtitle"),
      createDisclaimer()
    ]);
    const story = notebookStoryDialog();
    const cover = element("div", { className: "notebook-cover" }, [
      text("span", "FIELD NOTES", "cover-kicker"),
      text("span", "✳", "cover-mark"),
      text("span", "For the next pair of hands", "cover-caption"),
      element("button", { type: "button", className: "notebook-open", text: "Open the notebook" })
    ]);
    cover.querySelector("button").addEventListener("click", function () {
      if (typeof story.showModal === "function") story.showModal();
    });
    hero.appendChild(introduction);
    hero.appendChild(cover);
    fragment.appendChild(hero);
    fragment.appendChild(story);
    if (message) fragment.appendChild(element("p", { className: "status", role: "status", text: message }));

    fragment.appendChild(element("div", { className: "section-heading" }, [
      text("p", "BROWSE YOUR MODULE", "eyebrow"),
      text("h2", "What are you working on?")
    ]));
    state.modules.forEach(function (module) {
      const section = element("section", { className: "module-block" });
      section.appendChild(element("div", { className: "module-heading" }, [
        text("span", "MODULE NOTEBOOK", "module-kicker"),
        text("h3", module.title)
      ]));
      const areas = element("div", { className: "area-grid" });
      state.areas.forEach(function (area) {
        const tasks = state.tasks.filter(function (task) { return task.module === module.id && task.area === area.id; });
        const noteCount = state.entries.filter(function (entry) {
          return tasks.some(function (task) { return task.id === entry.task; });
        }).length;
        areas.appendChild(element("a", {
          href: areaHref(module.id, area.id),
          className: "area-card"
        }, [
          text("span", area.mark || "•", "area-mark"),
          element("span", {}, [
            text("strong", area.title),
            text("small", area.description)
          ]),
          text("span", tasks.length
            ? tasks.length + (tasks.length === 1 ? " task" : " tasks") + (noteCount ? " · " + noteCount + (noteCount === 1 ? " tip" : " tips") : "")
            : "Start exploring", "area-count")
        ]));
      });
      section.appendChild(areas);
      fragment.appendChild(section);
    });
    replaceMain(fragment);
    renderFooter();
    showDebug();
  }

  function notebookStoryDialog() {
    const dialog = element("dialog", {
      className: "notebook-dialog",
      "aria-labelledby": "notebook-story-title"
    });
    const close = element("form", { method: "dialog", className: "dialog-actions" }, [
      element("button", { type: "submit", text: "Tuck this note away" })
    ]);
    dialog.appendChild(text("p", "A little lab folklore", "eyebrow"));
    dialog.appendChild(element("h2", {
      id: "notebook-story-title",
      tabindex: "-1",
      autofocus: true,
      text: "A notebook passed hand to hand"
    }));
    dialog.appendChild(text("p", "Imagine a notebook passed from one pair of hands to the next. Its pages are not another copy of the protocol; they hold the small moments that can change how a result reads: a late measurement, a tube that looks just like its neighbour, or one point that refuses to fit."));
    dialog.appendChild(text("p", "Each tip gives you a pause point: what might go wrong, why it matters, and what to check before you move on. Take what helps, keep your own notes however you like, and let your current module brief and demonstrator lead on methods and safety."));
    dialog.appendChild(close);
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      dialog.close();
    });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  function row(label, value, className) {
    return element("div", { className: "card-row " + (className || "") }, [
      text("strong", label),
      text("span", value)
    ]);
  }

  function noteCard(item) {
    const card = element("article", { className: "card note-card" });
    if (item.kind) card.appendChild(text("span", item.kind, "note-kind"));
    card.appendChild(text("h3", item.title));
    card.appendChild(text("p", item.body, "note-body"));
    metadata(item).forEach(function (node) { if (node) card.appendChild(node); });
    return card;
  }

  function whyEntry(item) {
    const details = element("details", { className: "entry" });
    details.appendChild(text("summary", item.question));
    details.appendChild(text("p", item.reason));
    metadata(item).forEach(function (node) { if (node) details.appendChild(node); });
    return details;
  }

  function toolCard(item) {
    const card = element("article", { className: "card" });
    card.appendChild(text("h3", item.name));
    card.appendChild(row("Use it when", item.use_when));
    card.appendChild(row("Why it helps", item.why));
    if (item.needed_by) card.appendChild(row("Learn it by", item.needed_by, "prevention"));
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

  function breadcrumb(module, area, includeTask) {
    const nav = element("nav", { className: "breadcrumbs", "aria-label": "Notebook location" });
    nav.appendChild(element("a", { href: "index.html", text: "Notebook" }));
    nav.appendChild(text("span", "›", "crumb-divider"));
    nav.appendChild(element("a", { href: areaHref(module.id, area.id), text: module.title + " · " + area.title }));
    if (includeTask) {
      nav.appendChild(text("span", "›", "crumb-divider"));
      nav.appendChild(text("span", includeTask.title, "current-crumb"));
    }
    return nav;
  }

  function renderArea(module, area) {
    document.title = area.title + " · " + module.title + " | Before Tomorrow";
    const tasks = state.tasks.filter(function (task) {
      return task.module === module.id && task.area === area.id;
    }).sort(function (a, b) { return a.order - b.order || a.title.localeCompare(b.title); });
    const fragment = document.createDocumentFragment();
    fragment.appendChild(breadcrumb(module, area, null));
    fragment.appendChild(text("p", module.title + " · NOTEBOOK SECTION", "eyebrow"));
    fragment.appendChild(text("h1", area.title));
    fragment.appendChild(text("p", area.description, "subtitle"));
    fragment.appendChild(createDisclaimer());

    if (tasks.length > 4) {
      const search = element("input", {
        type: "search",
        id: "task-search",
        className: "task-search",
        placeholder: "Search tasks in " + area.title.toLowerCase(),
        "aria-label": "Search tasks"
      });
      fragment.appendChild(element("label", { className: "search-label", for: "task-search", text: "Find a task" }));
      fragment.appendChild(search);
    }

    const list = element("div", { className: "task-grid", id: "task-list" });
    tasks.forEach(function (task) {
      const noteCount = entriesForTask(task).length;
      const card = element("a", {
        href: taskHref(task),
        className: "task-card",
        "data-search": (task.title + " " + (task.description || "")).toLowerCase()
      }, [
        text("span", task.area === "practicals" ? "LAB SESSION" : area.title.toUpperCase(), "task-kicker"),
        text("strong", task.title),
        task.description ? text("span", task.description, "task-description") : null,
        text("span", noteCount ? noteCount + (noteCount === 1 ? " tip" : " tips") : "No tips yet", "task-count")
      ]);
      list.appendChild(card);
    });

    if (!tasks.length) {
      fragment.appendChild(element("section", { className: "empty-page" }, [
        text("span", area.mark || "✎", "empty-mark"),
        text("h2", "A space for the useful bits"),
        text("p", "Add a task only when there’s something worth passing on. Some sessions are straightforward and don’t need a page of their own.")
      ]));
    } else {
      const emptySearch = element("p", { id: "task-search-empty", className: "empty-note", role: "status", hidden: true, text: "No tasks match that search." });
      fragment.appendChild(list);
      fragment.appendChild(emptySearch);
      if (tasks.length > 4) {
        const search = fragment.querySelector("#task-search");
        search.addEventListener("input", function () {
          const query = search.value.trim().toLowerCase();
          let visible = 0;
          list.querySelectorAll(".task-card").forEach(function (card) {
            card.hidden = !card.dataset.search.includes(query);
            if (!card.hidden) visible += 1;
          });
          emptySearch.hidden = visible !== 0;
        });
      }
    }
    replaceMain(fragment);
    renderFooter();
    showDebug();
  }

  function renderTask(task) {
    const area = areaById(task.area);
    const module = state.modules.find(function (item) { return item.id === task.module; });
    document.title = task.title + " | Before Tomorrow";
    const entries = entriesForTask(task).sort(comparePriority);
    const notes = entries.filter(function (item) { return item.type === "note"; });
    const questions = entries.filter(function (item) { return item.type === "why"; });
    const tools = entries.filter(function (item) { return item.type === "tool"; });
    const concepts = task.concepts.map(function (id) {
      return state.concepts.find(function (item) { return item.id === id; });
    }).filter(Boolean);
    const fragment = document.createDocumentFragment();
    fragment.appendChild(breadcrumb(module, area, task));
    fragment.appendChild(text("p", module.title + " · " + area.title.toUpperCase(), "eyebrow"));
    fragment.appendChild(text("h1", task.title));
    if (task.description) fragment.appendChild(text("p", task.description, "subtitle"));
    fragment.appendChild(createDisclaimer());

    const sections = [
      [notes, "notes", "Easy-to-miss moments"],
      [questions, "questions", "Questions to think about"],
      [tools, "tools", "Useful tools"]
    ];
    if (entries.length > 5) {
      const search = element("input", {
        type: "search",
        id: "note-search",
        className: "task-search",
        placeholder: "Search tips on this page",
        "aria-label": "Search tips on this page"
      });
      fragment.appendChild(element("label", { className: "search-label", for: "note-search", text: "Find a note" }));
      fragment.appendChild(search);
      const emptySearch = element("p", { className: "empty-note", role: "status", hidden: true, text: "No tips match that search." });
      fragment.appendChild(emptySearch);
      search.addEventListener("input", function () {
        const query = search.value.trim().toLowerCase();
        let visible = 0;
        app.querySelectorAll(".note-card, .entry, .card").forEach(function (card) {
          card.hidden = !card.textContent.toLowerCase().includes(query);
          if (!card.hidden) visible += 1;
        });
        emptySearch.hidden = visible !== 0;
      });
    }
    if (!entries.length) {
      fragment.appendChild(element("section", { className: "empty-page" }, [
        text("span", "✎", "empty-mark"),
        text("h2", "A little room to breathe"),
        text("p", "This task may be simple, and that’s perfectly fine. Keep only the tips that genuinely help.")
      ]));
    }
    sections.forEach(function (section) {
      if (!section[0].length) return;
      const content = element("section", { className: "task-notes", id: section[1] }, [text("h2", section[2])]);
      section[0].forEach(function (item) {
        content.appendChild(item.type === "note" ? noteCard(item) : item.type === "why" ? whyEntry(item) : toolCard(item));
      });
      fragment.appendChild(content);
    });
    if (concepts.length) {
      const section = element("section", { className: "task-notes", id: "concepts" }, [text("h2", "Ideas to revisit")]);
      const list = element("ul", { className: "concept-list" });
      concepts.forEach(function (concept) {
        const item = element("li", {}, [text("strong", concept.label)]);
        if (concept.note) item.appendChild(text("p", concept.note));
        if (concept.revise_url) {
          item.appendChild(element("a", {
            href: concept.revise_url,
            target: "_blank",
            rel: "noopener noreferrer",
            text: "Open revision resource"
          }));
        }
        list.appendChild(item);
      });
      section.appendChild(list);
      fragment.appendChild(section);
    }
    const share = element("button", { type: "button", text: "Share this page" });
    share.addEventListener("click", function () { sharePage(task.title); });
    fragment.appendChild(element("div", { className: "share-row" }, [share]));
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

  function renderFooter() {
    clear(siteFooter);
    siteFooter.appendChild(text("p", "Small details can make the next lab easier."));
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
    state.tasks.forEach(function (task) {
      const entries = entriesForTask(task);
      const counts = TYPES.map(function (type) {
        return type + "=" + entries.filter(function (item) { return item.type === type; }).length;
      }).join(", ");
      panel.appendChild(text("p", task.id + ": " + counts));
    });
    app.appendChild(panel);
  }

  function replaceMain(fragment) {
    clear(app);
    app.appendChild(fragment);
  }

  function route() {
    const params = new URLSearchParams(location.search);
    const taskId = params.get("task");
    const areaId = params.get("area");
    const moduleId = params.get("module");
    if (taskId) {
      const task = state.tasks.find(function (item) { return item.id === taskId; });
      if (task && (!moduleId || task.module === moduleId) && (!areaId || task.area === areaId)) renderTask(task);
      else renderHome("We couldn't find that notebook page.");
      return;
    }
    if (moduleId || areaId) {
      const module = state.modules.find(function (item) { return item.id === moduleId; });
      const area = areaById(areaId);
      if (module && area) renderArea(module, area);
      else renderHome("Choose a module and notebook section to continue.");
      return;
    }
    renderHome("");
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
