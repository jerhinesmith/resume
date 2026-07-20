/* Scale Yourself — render from DATA (read-only, no network). */
(function () {
  "use strict";

  const C = {
    amber: "#f2a93b",
    teal: "#3fb8af",
    coral: "#e9645b",
    violet: "#9a7cf0",
    sky: "#5ba3e8",
    ink: "#eae6da",
    inkDim: "#b7bccb",
    muted: "#828ca2",
    faint: "#5b6478",
    hair: "#26314a",
    raised: "#141c2e",
  };
  const CAT_COLORS = [C.amber, C.teal, C.sky, C.violet, C.coral, C.muted, C.faint];

  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const nf = (n) => n.toLocaleString("en-US");
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const vals = (series) => series.map((d) => d.value);
  const labels = (series) => series.map((d) => d.label);

  const CATEGORY_ACCENT = {
    "Ship pipeline": C.amber,
    "Observability & incident": C.coral,
    Integrations: C.sky,
    "Dev environment": C.violet,
    "Quality & analysis": C.teal,
    "ML & data services": C.muted,
  };

  /* ---------------- HERO READOUT ---------------- */
  function heroReadout() {
    const t = DATA.tooling;
    const g = DATA.github.totals;
    const sz = DATA.pr_size;
    const gauges = [
      { num: nf(t.plugins_by_justin), unit: "", label: "Workflow tools I originated", bar: 1.0, color: C.amber },
      { num: nf(t.team_other_contributors_plugins), unit: "", label: "Teammates now build on them", bar: 0.5, color: C.coral },
      { num: nf(DATA.linear.total_completed_in_window), unit: "", label: "Linear issues shipped", bar: 0.62, color: C.sky },
      { num: nf(g.reviews_given), unit: "", label: "Reviews for teammates", bar: 0.46, color: C.violet },
      { num: sz ? nf(sz.median_lines_changed) : nf(g.prs_merged), unit: sz ? " ln" : "", label: sz ? "Median PR size (not churn)" : "Pull requests merged", bar: 0.55, color: C.teal },
    ];
    const wrap = $("#hero-readout");
    gauges.forEach((x) => {
      const gg = el("div", "gauge");
      gg.innerHTML =
        `<div class="gauge-num">${x.num}<span class="unit">${x.unit}</span></div>` +
        `<div class="gauge-label">${x.label}</div>` +
        `<div class="gauge-bar"><i style="width:${Math.round(x.bar * 100)}%;background:${x.color}"></i></div>`;
      wrap.appendChild(gg);
    });
  }

  /* ---------------- LEVERAGE ---------------- */
  function leverageStats() {
    const t = DATA.tooling;
    const cards = [
      {
        num: `${t.plugins_by_justin}<span class="sub"> / ${t.plugins_total}</span>`,
        label: "<b>plugins</b> in the team's toolkit that I originated (first-commit author)",
        accent: C.amber,
      },
      {
        num: `${t.team_other_contributors_plugins}`,
        label: "distinct <b>teammates</b> have since committed to that plugin repo",
        accent: C.teal,
      },
      {
        num: `${t.skills_by_justin}<span class="sub"> / ${t.skills_total}</span>`,
        label: "domain <b>skills</b> I authored — the rest are my teammates' work, not claimed here",
        accent: C.sky,
      },
    ];
    const wrap = $("#leverage-stats");
    cards.forEach((c) => {
      const d = el("div", "lstat");
      d.style.setProperty("--accent", c.accent);
      d.innerHTML = `<div class="lstat-num">${c.num}</div><div class="lstat-label">${c.label}</div>`;
      wrap.appendChild(d);
    });
  }

  // Hand-written, generic one-line purposes (no internal detail) so a reader can judge
  // substance, not just count. Kept in the template, not the validated data.
  const PLUGIN_PURPOSE = {
    "pr-feedback": "Works through PR review comments, merge conflicts, and CI failures",
    "pr-prep": "Runs code review + integration tests and opens a PR, auto-picking the test strategy",
    "next-ticket": "Reads the Linear backlog and recommends what to work on next",
    "standup": "Generates a daily standup from Linear + GitHub activity",
    "rca": "Blameless root-cause analysis — queries observability for evidence before reasoning",
    "sentry": "Queries and triages Sentry errors and performance data",
    "sentry-fix": "Investigates a Sentry error, classifies the cause, and opens a focused fix PR",
    "grafana": "Queries dashboards, alerts, and application logs",
    "incident-replay": "Replays a past incident against current runbooks to find documentation gaps",
    "perf": "Evidence-first perf work: baseline from telemetry, profile, measure, then ship",
    "linear": "Queries and manages Linear issues, projects, and teams",
    "slack": "Reads and searches Slack channels, threads, and files",
    "slite": "Searches and manages the Slite knowledge base",
    "postmark": "Queries email delivery data — sent, bounces, and stats",
    "ux-assistant": "Drives a flow as a first-time user and surfaces UX-friction findings",
    "ac-verify": "Drives the app against an acceptance-criteria doc and reports per-statement verdicts",
    "analyze-video": "Turns a screen recording into a timestamped log of actions and UI changes",
    "saruman": "Injects a dependency fault locally and classifies graceful degradation",
    "docker-worktree": "Manages Docker dev environments for git worktrees",
  };

  // Static grouping of the originated plugins by category (names come from DATA).
  const PLUGIN_GROUPS = [
    { cat: "Ship pipeline", items: ["pr-feedback", "pr-prep", "next-ticket", "standup"] },
    { cat: "Observability & incident", items: ["rca", "sentry", "sentry-fix", "grafana", "incident-replay", "perf"] },
    { cat: "Integrations", items: ["linear", "slack", "slite", "postmark"] },
    { cat: "Quality & analysis", items: ["ux-assistant", "ac-verify", "analyze-video", "saruman"] },
    { cat: "Dev environment", items: ["docker-worktree"] },
  ];

  function commandConsole() {
    const owned = new Set(DATA.tooling.plugin_names);
    const wrap = $("#command-console");
    PLUGIN_GROUPS.forEach((grp) => {
      const present = grp.items.filter((i) => owned.has(i));
      if (!present.length) return;
      const accent = CATEGORY_ACCENT[grp.cat] || C.amber;
      const g = el("div", "console-group");
      const head = el("div", "cg-head");
      head.innerHTML =
        `<span class="cg-name" style="color:${accent}">${grp.cat}</span>` +
        `<span class="cg-rule"></span><span class="cg-count">${present.length} cmd</span>`;
      const keys = el("div", "cg-keys");
      present.forEach((name) => {
        const c = el("div", "cmd");
        c.style.setProperty("--cmd-accent", accent);
        const purpose = PLUGIN_PURPOSE[name] || "";
        c.innerHTML =
          `<span class="cmd-name"><span class="slash">/</span>${name}</span>` +
          (purpose ? `<span class="cmd-purpose">${purpose}</span>` : "");
        keys.appendChild(c);
      });
      g.appendChild(head);
      g.appendChild(keys);
      wrap.appendChild(g);
    });
  }

  function consoleNotes() {
    const t = DATA.tooling;
    const origin = t.origin_by_month.filter((d) => d.value > 0);
    const first = origin[0], last = origin[origin.length - 1];
    $("#origin-note").innerHTML =
      `First plugin landed <b>${first.label}</b>; most originated between ` +
      `<b>Feb '26</b> and <b>Jul '26</b> — the same window my throughput ramped.`;
    $("#adoption-note").innerHTML =
      `<b>${t.team_other_contributors_plugins}</b> teammates have committed to the plugin repo I ` +
      `authored ~86% of — the tooling didn't stay mine, it became shared infrastructure.`;
    $("#skills-note").innerHTML =
      `The construction-domain skills repo is a team effort (<b>${t.team_other_contributors_skills}</b> ` +
      `other contributors); I originated <b>${t.skills_by_justin}</b> of ${t.skills_total} and don't claim the rest.`;
    const df = t.dogfooding;
    if (df) {
      const top = Object.entries(df.by_plugin).slice(0, 4).map(([k, v]) => `<b>/${k}</b> ${v}×`).join(", ");
      $("#dogfood-note").innerHTML =
        `I use my own tooling daily: <b>${df.plugins_i_used}</b> of these plugins show up <b>${nf(df.total_invocations)}</b> ` +
        `times in my own 90-day session logs (${top}…). This is my usage, not team-wide adoption.`;
    }
  }

  /* ---------------- AREA BARS ---------------- */
  function areaBars(elId, obj, colorFn) {
    const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map((e) => e[1]));
    const wrap = $(elId);
    entries.forEach(([name, val], i) => {
      const color = colorFn ? colorFn(name, i) : CAT_COLORS[i % CAT_COLORS.length];
      const row = el("div", "abar-row");
      row.innerHTML =
        `<div class="abar-top"><span class="abar-name">${name}</span><span class="abar-val">${nf(val)}</span></div>` +
        `<div class="abar-track"><span class="abar-fill" data-w="${(val / max) * 100}" style="background:${color}"></span></div>`;
      wrap.appendChild(row);
    });
  }

  /* ---------------- RANK LISTS ---------------- */
  function rankList(elId, obj, accent, formatName) {
    const entries = Object.entries(obj)
      .filter(([k]) => k !== "Other" && k !== "other-skill" && k !== "other-tool")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const max = Math.max(...entries.map((e) => e[1]));
    const wrap = $(elId);
    entries.forEach(([name, val]) => {
      const row = el("div", "rank-row");
      const nm = formatName ? formatName(name) : name;
      row.innerHTML =
        `<span class="rr-bg" data-w="${(val / max) * 100}" style="--rr-accent:${accent}"></span>` +
        `<span class="rr-name">${nm}</span><span class="rr-val">${nf(val)}</span>`;
      wrap.appendChild(row);
    });
  }

  function fmtSkill(name) {
    if (name.includes(":")) {
      const [ns, s] = name.split(":");
      return `<span class="ns">${ns}:</span>${s}`;
    }
    return name;
  }

  /* ---------------- SNAPSHOT ---------------- */
  function agentSnapshot() {
    const a = DATA.agent_usage;
    const items = [
      { num: nf(a.sessions_total), label: "coding sessions" },
      { num: nf(a.messages_total), label: "messages exchanged" },
      { num: nf(a.toolcalls_total), label: "tool calls" },
      { num: nf(a.subagent_transcripts), label: "subagent runs delegated" },
    ];
    const wrap = $("#agent-snapshot");
    items.forEach((x) => {
      const s = el("div", "snap");
      s.innerHTML = `<div class="snap-num">${x.num}</div><div class="snap-label">${x.label}</div>`;
      wrap.appendChild(s);
    });
  }

  /* ---------------- CURIOSITY ---------------- */
  function curiosity() {
    const wrap = $("#curiosity-grid");
    DATA.personal.forEach((p) => {
      const c = el("div", "cproj");
      c.innerHTML =
        `<div class="cproj-top"><span class="cproj-name">${p.name}</span>` +
        `<span class="cproj-lang">${p.lang || "—"}</span></div>` +
        `<p class="cproj-blurb">${p.blurb}</p>`;
      wrap.appendChild(c);
    });
  }

  /* ---------------- METHOD ---------------- */
  function method() {
    const cards = [
      { key: "SOURCES", title: "Six local sources", body: "GitHub (gh CLI), Claude Code transcripts, prompt history, my authored plugin/skill git repos, and Linear — all read from my own machine." },
      { key: "PIPELINE", title: "Aggregate, then validate", body: "Extractors read raw data but emit only counts and bucketed labels. A strict schema validator then refuses anything that isn't a number, a month, or an approved label." },
      { key: "LABELS", title: "Private names bucketed", body: "Every getboon repo is private, so repo and workspace names are mapped to functional buckets (Main app, Infra, ML) — no codenames, branches, or paths leave my machine." },
      { key: "ATTRIBUTION", title: "Git first-author only", body: "Tooling credit is assigned by first-commit author per directory, so I only claim what I actually originated — teammates' work stays theirs." },
    ];
    const wrap = $("#method-grid");
    cards.forEach((c) => {
      const d = el("div", "mcard");
      d.innerHTML = `<div class="mcard-key">${c.key}</div><div class="mcard-title">${c.title}</div><div class="mcard-body">${c.body}</div>`;
      wrap.appendChild(d);
    });
    $("#excluded-note").innerHTML =
      `<h4>Intentionally excluded</h4><ul>` +
      `<li><b>No message, code, prompt, PR, or ticket text</b> — not a single free-text field reaches this page.</li>` +
      `<li><b>No work-hour or time-of-day analysis</b> — cadence is measured by month only, on purpose.</li>` +
      `<li><b>Slite knowledge-sharing metric attempted but dropped</b> — no API path gave a safe, self-attributable count without reading sensitive doc titles.</li>` +
      `<li><b>Raw extraction artifacts</b> — bucket maps and scratch data never leave the local machine or enter this package.</li>` +
      `</ul>`;
  }

  /* ---------------- TIMELINE ---------------- */
  function timeline() {
    const wrap = $("#timeline-track");
    if (!wrap) return;
    const byMonth = (series, m) => (series.find((d) => d.month === m) || {}).value ?? 0;
    const prm = DATA.github.prs_merged;
    const pr = DATA.prompts.by_month;
    const t = DATA.tooling;
    // milestones grounded in real values; copy is editorial, numbers are from data
    const items = [
      {
        tag: "Baseline", accent: C.muted,
        period: "Jul – Nov '25",
        head: "Steady, hand-authored shipping",
        body: `A consistent ${byMonth(prm, "2025-10")}-PRs-in-October cadence, largely without agents — the prompt logs barely register yet. This is the "before."`,
      },
      {
        tag: "Jan '26", accent: C.sky,
        period: "Jan '26",
        head: "Agents enter the workflow",
        body: `First real month of agent use (${nf(byMonth(pr, "2026-01"))} prompts, up from single digits). I start delegating, not just typing.`,
      },
      {
        tag: "Feb '26", accent: C.amber,
        period: "Feb '26",
        head: "I start building the tooling",
        body: `Originated 7 workflow plugins in a single month. Prompts jump to ${nf(byMonth(pr, "2026-02"))}; merged PRs climb to ${byMonth(prm, "2026-02")}. The operating system starts to shift.`,
      },
      {
        tag: "Mar – Apr '26", accent: C.teal,
        period: "Mar – Apr '26",
        head: "The system compounds",
        body: `Merged PRs peak (${byMonth(prm, "2026-03")}, then ${byMonth(prm, "2026-04")}) as the tooling pays off. Reviews for teammates also peak at ${byMonth(DATA.github.reviews_given, "2026-03")} in March.`,
      },
      {
        tag: "May '26", accent: C.coral,
        period: "May '26",
        head: "Experimenting with multi-agent fleets",
        body: `A ${nf(byMonth(pr, "2026-05"))}-prompt spike — mostly hands-on-keyboard experimentation with Gastown, an open-source multi-agent workspace manager, running agents on their own rather than hand-typing. My interactive prompting stayed steady (~4k).`,
      },
      {
        tag: "Jun – Jul '26", accent: C.violet,
        period: "Jun – Jul '26",
        head: "Tooling becomes shared infrastructure",
        body: `${t.team_other_contributors_plugins} teammates now commit to the plugin repo I authored. What started as my workflow is the team's.`,
      },
    ];
    items.forEach((it, i) => {
      const node = el("div", "tl-item");
      node.style.setProperty("--tl-accent", it.accent);
      node.innerHTML =
        `<div class="tl-rail"><span class="tl-dot"></span></div>` +
        `<div class="tl-card">` +
          `<div class="tl-top"><span class="tl-tag">${it.period}</span></div>` +
          `<div class="tl-head">${it.head}</div>` +
          `<div class="tl-body">${it.body}</div>` +
        `</div>`;
      wrap.appendChild(node);
    });
  }

  /* ---------------- PR SIZE STRIP ---------------- */
  function prSizeStrip() {
    const s = DATA.pr_size;
    const wrap = $("#prsize-strip");
    if (!s || !wrap) return;
    const b = s.size_buckets;
    const total = Object.values(b).reduce((a, c) => a + c, 0);
    const order = ["≤10 lines", "11–100", "101–500", "500+"];
    const colors = { "≤10 lines": C.faint, "11–100": C.sky, "101–500": C.teal, "500+": C.amber };
    const seg = order
      .filter((k) => b[k])
      .map((k) => `<span class="pss-seg" style="width:${(b[k] / total) * 100}%;background:${colors[k]}" title="${k}: ${b[k]}"></span>`)
      .join("");
    const legend = order
      .filter((k) => b[k])
      .map((k) => `<span class="pss-leg"><i style="background:${colors[k]}"></i>${k} · ${nf(b[k])}</span>`)
      .join("");
    wrap.innerHTML =
      `<div class="pss-head">` +
        `<div class="pss-stat"><span class="pss-num">${nf(s.median_lines_changed)}</span><span class="pss-lbl">median lines / PR</span></div>` +
        `<div class="pss-stat"><span class="pss-num">${nf(s.median_files_changed)}</span><span class="pss-lbl">median files / PR</span></div>` +
        `<p class="pss-note">For context on the volume: the median merged PR changes ` +
        `<b>${nf(s.median_lines_changed)} lines</b> across <b>${nf(s.median_files_changed)} files</b>, ` +
        `and the sizes spread the way you'd expect from real feature work. Size is context, not a claim of value — that's in the PRs themselves.</p>` +
      `</div>` +
      `<div class="pss-bar">${seg}</div>` +
      `<div class="pss-legend">${legend}</div>`;
  }

  /* ---------------- TECH BREADTH ---------------- */
  function techBreadth() {
    const t = DATA.tech_breadth;
    const wrap = $("#techbreadth");
    if (!t || !wrap) return;
    const stacksEl = $("#tb-stacks"), reposEl = $("#tb-repos");
    if (stacksEl) stacksEl.textContent = t.distinct_stacks;
    if (reposEl) reposEl.textContent = t.repos_scanned;
    const entries = Object.entries(t.by_tech).sort((a, b) => b[1] - a[1]);
    // sqrt scale for bar WIDTH so the breadth is legible (Ruby dwarfs the rest on a
    // linear scale); the label always shows the true count. Point of this chart is
    // range, not ranking magnitude.
    const maxRoot = Math.sqrt(Math.max(...entries.map((e) => e[1])));
    const palette = [C.coral, C.amber, C.sky, C.teal, C.violet];
    entries.forEach(([name, val], i) => {
      // primary language (Ruby) muted so the point is the breadth, not the #1
      const color = i === 0 ? C.muted : palette[(i - 1) % palette.length];
      const w = (Math.sqrt(val) / maxRoot) * 100;
      const row = el("div", "abar-row");
      row.innerHTML =
        `<div class="abar-top"><span class="abar-name">${name}</span><span class="abar-val">${nf(val)}</span></div>` +
        `<div class="abar-track"><span class="abar-fill" data-w="${w}" style="background:${color}"></span></div>`;
      wrap.appendChild(row);
    });
    const foot = $("#tb-foot");
    if (foot) {
      const beyond = entries.slice(1, 6).map((e) => e[0]).join(", ");
      foot.innerHTML =
        `Ruby is home base, but the year's work spanned <b>${t.distinct_stacks}</b> stacks — ${beyond}, and more. ` +
        `Agent assistance is what made shipping confidently outside my strongest languages routine rather than rare.`;
    }
  }

  /* ---------------- WHAT THIS CAN'T SHOW ---------------- */
  function cantShow() {
    const wrap = $("#cantshow-note");
    if (!wrap) return;
    wrap.innerHTML =
      `<h4>What this report can't show</h4>` +
      `<p>These are <b>leverage and activity</b> signals drawn from my own machine — deliberately, so nothing sensitive leaves it. They're honest, but they aren't the whole picture. A fair read of my year also needs the things a self-report structurally can't prove:</p>` +
      `<ul>` +
      `<li><b>Outcomes</b> — what shipped, and whether it moved reliability, delivery speed, or the product.</li>` +
      `<li><b>Quality</b> — escaped bugs, rollbacks, and how my code held up in production.</li>` +
      `<li><b>Real adoption</b> — how often teammates actually reach for the tooling, beyond the ${nf(DATA.tooling.team_other_contributors_plugins)} who've committed to it.</li>` +
      `<li><b>Judgment &amp; collaboration</b> — the calls that don't show up as a count.</li>` +
      `</ul>` +
      `<p class="cs-foot">Those belong in a conversation, not a dashboard. This report is the evidence I <em>can</em> put on the table.</p>`;
  }

  window.__renderDOM = function () {
    heroReadout();
    leverageStats();
    commandConsole();
    consoleNotes();
    areaBars("#area-bars", DATA.github.prs_by_area, (n, i) => CAT_COLORS[i % CAT_COLORS.length]);
    areaBars("#workspace-bars", DATA.prompts.by_workspace, (n, i) =>
      n === "Gastown experiments" ? C.coral : CAT_COLORS[(i + 1) % CAT_COLORS.length]
    );
    rankList("#skills-rank", DATA.agent_usage.skills_used, "rgba(63,184,175,0.16)", fmtSkill);
    rankList("#tools-rank", DATA.agent_usage.tool_types, "rgba(91,163,232,0.16)");
    agentSnapshot();
    curiosity();
    method();
    throughputTable();
    prSizeStrip();
    cantShow();
    timeline();
    techBreadth();
  };

  /* ---------------- THROUGHPUT LEDGER TABLE ---------------- */
  function throughputTable() {
    const merged = DATA.github.prs_merged;
    const opened = DATA.github.prs_opened;
    const reviews = DATA.github.reviews_given;
    const linear = DATA.linear.completed_by_month;
    const head =
      `<thead><tr><th>Month</th><th>PRs opened</th><th>PRs merged</th><th>Reviews</th><th>Issues done</th></tr></thead>`;
    let rows = "";
    merged.forEach((m, i) => {
      rows +=
        `<tr><td>${m.label}</td><td>${nf(opened[i].value)}</td><td>${nf(m.value)}</td>` +
        `<td>${nf(reviews[i].value)}</td><td>${nf(linear[i].value)}</td></tr>`;
    });
    const tot =
      `<tr class="tot"><td>Year</td><td>${nf(sum(vals(opened)))}</td><td>${nf(sum(vals(merged)))}</td>` +
      `<td>${nf(sum(vals(reviews)))}</td><td>${nf(DATA.linear.total_completed_in_window)}</td></tr>`;
    $("#throughput-table").innerHTML = head + `<tbody>${rows}${tot}</tbody>`;
  }
})();
