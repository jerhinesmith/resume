/* Scale Yourself — Chart.js configs (dataviz: shared system, legible, honest). */
(function () {
  "use strict";

  const C = {
    amber: "#f2a93b", teal: "#3fb8af", coral: "#e9645b",
    violet: "#9a7cf0", sky: "#5ba3e8",
    ink: "#eae6da", inkDim: "#b7bccb", muted: "#828ca2",
    grid: "rgba(38,49,74,0.6)", hair: "#26314a",
  };
  const FONT_MONO = "'IBM Plex Mono', monospace";
  const FONT_SANS = "'IBM Plex Sans', sans-serif";
  const vals = (s) => s.map((d) => d.value);
  const labs = (s) => s.map((d) => d.label);

  Chart.defaults.font.family = FONT_SANS;
  Chart.defaults.color = C.muted;

  const baseScales = (yTitle) => ({
    x: {
      grid: { color: "transparent", drawBorder: false },
      ticks: { font: { family: FONT_MONO, size: 11 }, color: C.muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 13 },
      border: { color: C.hair },
    },
    y: {
      grid: { color: C.grid, drawBorder: false },
      ticks: { font: { family: FONT_MONO, size: 11 }, color: C.muted, precision: 0 },
      border: { display: false },
      title: yTitle ? { display: true, text: yTitle, color: C.muted, font: { family: FONT_MONO, size: 11 } } : undefined,
      beginAtZero: true,
    },
  });

  const tooltip = {
    backgroundColor: "#0c1220",
    borderColor: C.hair,
    borderWidth: 1,
    titleColor: C.ink,
    titleFont: { family: FONT_MONO, size: 12 },
    bodyColor: C.inkDim,
    bodyFont: { family: FONT_MONO, size: 12 },
    padding: 12,
    cornerRadius: 4,
    displayColors: true,
    boxWidth: 10,
    boxHeight: 10,
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const anim = reduceMotion ? false : { duration: 900, easing: "easeOutQuart" };

  const charts = [];

  function shippedChart() {
    const g = DATA.github, l = DATA.linear;
    const ctx = document.getElementById("chart-shipped");
    charts.push(new Chart(ctx, {
      type: "bar",
      data: {
        labels: labs(g.prs_merged),
        datasets: [
          { label: "PRs merged", data: vals(g.prs_merged), backgroundColor: C.amber, borderRadius: 3, maxBarThickness: 30 },
          { label: "Issues completed", data: vals(l.completed_by_month), backgroundColor: C.teal, borderRadius: 3, maxBarThickness: 30 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: anim,
        scales: baseScales(),
        plugins: {
          legend: { labels: { color: C.inkDim, font: { family: FONT_MONO, size: 12 }, usePointStyle: true, pointStyle: "rectRounded", padding: 18 } },
          tooltip,
        },
      },
    }));
  }

  function reviewsChart() {
    const g = DATA.github;
    const ctx = document.getElementById("chart-reviews");
    charts.push(new Chart(ctx, {
      type: "line",
      data: {
        labels: labs(g.reviews_given),
        datasets: [{
          label: "Reviews", data: vals(g.reviews_given),
          borderColor: C.violet, backgroundColor: "rgba(154,124,240,0.14)",
          fill: true, tension: 0.35, borderWidth: 2,
          pointRadius: 3, pointBackgroundColor: C.violet, pointBorderColor: "#0c1220", pointBorderWidth: 1.5,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: anim,
        scales: baseScales(),
        plugins: { legend: { display: false }, tooltip },
      },
    }));
  }

  function promptsChart() {
    const p = DATA.prompts;
    const ctx = document.getElementById("chart-prompts");
    charts.push(new Chart(ctx, {
      type: "bar",
      data: {
        labels: labs(p.by_month),
        datasets: [{
          label: "Prompts", data: vals(p.by_month),
          backgroundColor: (c) => {
            // highlight the May spike (mostly Gastown multi-agent experiments)
            return p.by_month[c.dataIndex] && p.by_month[c.dataIndex].month === "2026-05" ? C.coral : C.sky;
          },
          borderRadius: 3, maxBarThickness: 46,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: anim,
        scales: baseScales(),
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltip,
            callbacks: {
              afterLabel: (c) =>
                p.by_month[c.dataIndex].month === "2026-05"
                  ? "↳ mostly Gastown multi-agent experiments" : "",
            },
          },
        },
      },
    }));
    document.getElementById("prompts-foot").innerHTML =
      "The May spike is mostly experimentation with Gastown, an open-source multi-agent workspace manager — agents looping on their own, not hand-typing — see the workspace split below, where “Gastown experiments” dominates. My hands-on prompting stayed steady (~4k).";
  }

  function modelsChart() {
    const m = DATA.agent_usage.model_mix;
    const entries = Object.entries(m).sort((a, b) => b[1] - a[1]);
    const palette = { Opus: C.amber, Sonnet: C.sky, Haiku: C.teal };
    const ctx = document.getElementById("chart-models");
    charts.push(new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: entries.map((e) => e[0]),
        datasets: [{
          data: entries.map((e) => e[1]),
          backgroundColor: entries.map((e) => palette[e[0]] || C.muted),
          borderColor: "#0c1220", borderWidth: 2, hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: anim,
        cutout: "62%",
        plugins: {
          legend: { position: "right", labels: { color: C.inkDim, font: { family: FONT_MONO, size: 12 }, usePointStyle: true, pointStyle: "circle", padding: 14 } },
          tooltip: {
            ...tooltip,
            callbacks: {
              label: (c) => {
                const tot = c.dataset.data.reduce((a, b) => a + b, 0);
                const pct = Math.round((c.parsed / tot) * 100);
                return ` ${c.label}: ${c.parsed.toLocaleString()} turns (${pct}%)`;
              },
            },
          },
        },
      },
    }));
  }

  window.__renderCharts = function () {
    shippedChart();
    reviewsChart();
    promptsChart();
    modelsChart();
  };
})();
