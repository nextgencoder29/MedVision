"use strict";
/* ---------- helpers ---------- */
const DAY = 86400000;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const daysAgo = n => todayStart() - n * DAY;
const daysBetween = (a, b) => Math.round((b - a) / DAY);
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = t => { const d = new Date(t); return String(d.getDate()).padStart(2, "0") + " " + MONTHS[d.getMonth()]; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round1 = v => Math.round(v * 10) / 10;
const maskAbha = a => a ? a.replace(/\s/g, "").replace(/^(\d{2})\d+(\d{4})$/, "$1xx $2") : "No ABHA";
const SITES = ["Buccal mucosa, left", "Buccal mucosa, right", "Tongue, lateral border", "Floor of mouth and palate"];
const COLOUR_RANK = { none: 0, white: 1, mixed: 2, red: 3 };
const COLOUR_NAME = { none: "None", white: "White", mixed: "White and red", red: "Red" };
const HOSPITAL = { name: "Govt. Hospital, Chengalpattu", dept: "Dental OPD · Tue and Thu" };

/* ---------- demo data ---------- */
function seed() {
  const v = (d, area, colour, tier, note, site = 0) => ({ id: "v" + Math.random().toString(36).slice(2, 9), date: daysAgo(d), site, area, colour, tier, note, synced: d > 3 });
  const P = (o) => Object.assign({ synced: true, reviewed: false, reminders: 0, referral: { status: "none" } }, o);
  return {
    version: 4, lastSync: daysAgo(2), screenedToday: 23, campSeconds: 23 * 94,
    queue: [
      { token: 64, name: "Bhavani S", kind: "New" },
      { token: 65, name: "Selvi M", kind: "Recheck", pid: "p5" },
      { token: 66, name: "Raju P", kind: "New" }
    ],
    patients: [
      P({ id: "p1", name: "Lakshmi D", age: 47, sex: "F", village: "Melmaruvathur", abha: "91 4402 8871 4412",
        habits: { tobacco: ["gutkha"], years: 11, perDay: 6, alcohol: false, mouth: 32 },
        visits: [v(222, 18.0, "white", "monitor", "Baseline, white patch"), v(140, 18.5, "white", "stable", "Stable, +3%"), v(54, 18.9, "mixed", "monitor", "Colour change noted"), v(12, 23.13, "red", "refer", "Growth since last visit")],
        referral: { status: "referred", flaggedOn: daysAgo(12), referredOn: daysAgo(12) } }),
      P({ id: "p2", name: "Murugan S", age: 52, sex: "M", village: "Acharapakkam", abha: "91 7710 2391 0087",
        habits: { tobacco: ["khaini"], years: 20, perDay: 8, alcohol: true, mouth: 38 },
        visits: [v(60, 9.3, "white", "monitor", "White patch, right cheek", 1), v(9, 9.6, "white", "monitor", "Stable, +3%", 1)],
        referral: { status: "monitor", recheckOn: daysAgo(-19) }, reviewed: true }),
      P({ id: "p3", name: "Anitha R", age: 39, sex: "F", village: "Madurantakam", abha: "91 5521 9043 2210",
        habits: { tobacco: ["betel"], years: 8, perDay: 4, alcohol: false, mouth: 41 },
        visits: [v(70, 12.0, "mixed", "refer", "Speckled patch, tongue", 2)],
        referral: { status: "biopsied", flaggedOn: daysAgo(70), referredOn: daysAgo(70), reachedOn: daysAgo(62), biopsyOn: daysAgo(55) }, reviewed: true }),
      P({ id: "p4", name: "Ravi K", age: 58, sex: "M", village: "Melmaruvathur", abha: "91 3390 6612 7741",
        habits: { tobacco: ["smoking", "betel"], years: 30, perDay: 12, alcohol: true, mouth: 34 },
        visits: [v(30, 15.6, "red", "refer", "Red patch, floor of mouth", 3)],
        referral: { status: "reached", flaggedOn: daysAgo(30), referredOn: daysAgo(30), reachedOn: daysAgo(22) }, reviewed: true }),
      P({ id: "p5", name: "Selvi M", age: 44, sex: "F", village: "Uthiramerur", abha: "91 8820 1145 6634",
        habits: { tobacco: ["gutkha"], years: 6, perDay: 3, alcohol: false, mouth: 40 },
        visits: [v(90, 6.0, "white", "monitor", "Small white patch"), v(3, 6.3, "white", "stable", "Stable, +5%")],
        referral: { status: "monitor", recheckOn: daysAgo(-25) }, reviewed: true }),
      P({ id: "p6", name: "Kannan P", age: 61, sex: "M", village: "Chengalpattu", abha: "",
        habits: { tobacco: ["khaini"], years: 35, perDay: 10, alcohol: false, mouth: 26 },
        visits: [v(15, 10.5, "white", "monitor", "Blanching, restricted opening", 1)],
        referral: { status: "monitor", recheckOn: daysAgo(-13) }, reviewed: true }),
      P({ id: "p7", name: "Meena V", age: 35, sex: "F", village: "Melmaruvathur", abha: "91 2201 4478 9903",
        habits: { tobacco: [], years: 0, perDay: 0, alcohol: false, mouth: 45 },
        visits: [v(5, 0, "none", "benign", "No lesion seen")],
        referral: { status: "clear" }, reviewed: true }),
      P({ id: "p8", name: "Arjun T", age: 50, sex: "M", village: "Acharapakkam", abha: "91 6654 3320 1189",
        habits: { tobacco: ["gutkha"], years: 15, perDay: 7, alcohol: true, mouth: 36 },
        visits: [v(100, 9.0, "white", "monitor", "Baseline, white patch", 1), v(40, 11.4, "mixed", "refer", "Growth and colour change", 1)],
        referral: { status: "referred", flaggedOn: daysAgo(40), referredOn: daysAgo(40) } }),
      P({ id: "p9", name: "Pushpa N", age: 56, sex: "F", village: "Madurantakam", abha: "91 4471 0098 5562",
        habits: { tobacco: ["betel"], years: 25, perDay: 6, alcohol: false, mouth: 33 },
        visits: [v(8, 13.2, "red", "refer", "Red velvety patch", 0)],
        referral: { status: "flagged", flaggedOn: daysAgo(8) } }),
      P({ id: "p10", name: "Gopal R", age: 49, sex: "M", village: "Uthiramerur", abha: "91 9903 2214 6670",
        habits: { tobacco: ["smoking"], years: 20, perDay: 10, alcohol: true, mouth: 39 },
        visits: [v(18, 4.5, "white", "monitor", "Faint white patch", 2)],
        referral: { status: "monitor", recheckOn: daysAgo(-10) }, reviewed: true })
    ]
  };
}

const STORE_KEY = "oral-surveillance-v4";
let S;
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const d = JSON.parse(raw); if (d && d.version === 4) return d; } } catch (e) {}
  return seed();
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {} }
S = load();
const patient = id => S.patients.find(p => p.id === id);

/* ---------- risk, change, status ---------- */
const TOBACCO = { gutkha: { label: "Gutkha", w: 3.0 }, khaini: { label: "Khaini", w: 2.5 }, betel: { label: "Betel quid", w: 2.5 }, smoking: { label: "Smoking", w: 2.0 } };
function habitRisk(h, age) {
  const parts = [];
  const ws = (h.tobacco || []).map(t => TOBACCO[t].w).sort((a, b) => b - a);
  if (ws.length) parts.push(["Tobacco type", ws[0] + 0.5 * (ws.length - 1)]);
  if (h.years > 0 && ws.length) parts.push(["Duration " + h.years + " yrs", round1(Math.min(h.years / 20, 1) * 2.5)]);
  if (h.perDay >= 10 && ws.length) parts.push(["10+ per day", 0.5]);
  if (h.alcohol) parts.push(["Alcohol", 1]);
  if (h.mouth && h.mouth < 35) parts.push(["Mouth opening " + h.mouth + " mm", h.mouth < 28 ? 2 : 1]);
  if (age >= 40) parts.push(["Age 40+", 0.5]);
  const score = round1(clamp(parts.reduce((s, p) => s + p[1], 0), 0, 10));
  const level = score >= 6.5 ? "High" : score >= 3.5 ? "Moderate" : "Low";
  return { score, level, parts };
}
function change(p, visitIdx) {
  const vs = p.visits;
  const i = visitIdx ?? vs.length - 1;
  if (i < 1 || !vs[i]) return null;
  const cur = vs[i];
  let prev = null;
  for (let k = i - 1; k >= 0; k--) if (vs[k].site === cur.site && vs[k].area > 0) { prev = vs[k]; break; }
  if (!prev || !cur.area) return null;
  const delta = (cur.area - prev.area) / prev.area * 100;
  const days = Math.max(1, daysBetween(prev.date, cur.date));
  const weeks = days / 7;
  const colourUp = COLOUR_RANK[cur.colour] > COLOUR_RANK[prev.colour];
  const escalate = delta >= 20 || (colourUp && cur.colour === "red");
  return { prev, cur, delta: round1(delta), days, weeks: round1(weeks), perWeek: round1(delta / weeks), colourUp, escalate };
}
function statusOf(p) {
  const r = p.referral;
  if (r.status === "referred" && daysBetween(r.referredOn, todayStart()) > 7) return { key: "overdue", label: "Overdue", cls: "urgent", sort: 0 };
  if (r.status === "flagged") return { key: "flagged", label: "Flagged", cls: "urgent", sort: 1 };
  if (r.status === "referred") return { key: "referred", label: "Referred", cls: "urgent", sort: 2 };
  if (r.status === "reached") return { key: "reached", label: "At hospital", cls: "info", sort: 4 };
  if (r.status === "biopsy-due") return { key: "biopsy-due", label: "Biopsy call", cls: "info", sort: 3 };
  if (r.status === "biopsied") return { key: "closed", label: "Closed", cls: "ok", sort: 7 };
  if (r.status === "clear") return { key: "clear", label: "Clear", cls: "ok", sort: 8 };
  if (r.status === "monitor") {
    if (r.recheckOn && r.recheckOn < todayStart()) return { key: "recheck-due", label: "Recheck due", cls: "watch", sort: 3 };
    return { key: "monitor", label: "Monitor", cls: "watch", sort: 5 };
  }
  return { key: "new", label: "New", cls: "plain", sort: 6 };
}
function statusLine(p) {
  const r = p.referral;
  if (r.status === "referred") return "Referred " + fmtDate(r.referredOn) + " · " + daysBetween(r.referredOn, todayStart()) + " days, not reached";
  if (r.status === "flagged") return "Flagged " + fmtDate(r.flaggedOn) + " · awaiting specialist review";
  if (r.status === "biopsy-due") return "Called for biopsy " + fmtDate(r.biopsyCalledOn);
  if (r.status === "reached") return "Reached hospital " + fmtDate(r.reachedOn);
  if (r.status === "biopsied") return "Biopsy done " + fmtDate(r.biopsyOn);
  if (r.status === "monitor") {
    const d = daysBetween(todayStart(), r.recheckOn);
    return d >= 0 ? "Recheck in " + (d >= 14 ? Math.round(d / 7) + " weeks" : d + " days") : "Recheck was due " + fmtDate(r.recheckOn);
  }
  if (r.status === "clear") return "No lesion · next yearly check";
  return p.visits.length ? "Last visit " + fmtDate(p.visits.at(-1).date) : "Registered · no visits yet";
}
const TIER = {
  refer: { label: "Refer urgently", cls: "urgent" },
  monitor: { label: "Monitor", cls: "watch" },
  stable: { label: "Stable", cls: "ok" },
  benign: { label: "Benign", cls: "ok" }
};

/* ---------- lesion drawing (for visits with no photo) ---------- */
function lesionSVG(area, colour, seedN = 1) {
  const fill = { none: "none", white: "var(--lesion-white)", mixed: "var(--lesion-mixed)", red: "var(--lesion-red)" }[colour] || "none";
  const px = Math.max(area, 0) / 100 * (Math.PI * 44.8 * 28.8);
  const k = Math.sqrt(px / (Math.PI * 1.08));
  const rx = k * 1.35, ry = k * 0.8;
  const stroke = colour === "white" ? "#D9C9B6" : "none";
  const speck = colour === "mixed" ? `<ellipse cx="${80 + rx * 0.25}" cy="${60 - ry * 0.15}" rx="${rx * 0.35}" ry="${ry * 0.4}" fill="var(--lesion-red)" opacity="0.7"/>` : "";
  return `<svg viewBox="0 0 160 120" role="img" aria-label="${esc(COLOUR_NAME[colour])} lesion, ${area}% of frame"><rect width="160" height="120" fill="var(--mucosa)"/>${area > 0 ? `<ellipse cx="80" cy="60" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${speck}` : ""}</svg>`;
}
function visitPic(v, cls = "lesion-pic") {
  return v.thumb ? `<img class="${cls}" src="${v.thumb}" alt="Photo, ${esc(SITES[v.site])}, ${fmtDate(v.date)}">` : `<div class="${cls}" style="padding:0">${lesionSVG(v.area, v.colour)}</div>`;
}

/* ---------- views ---------- */
const view = $("#view"), topbar = $("#topbar");
function setTop(title, sub = "", backHref = "", right = "") {
  topbar.innerHTML = `<div style="display:flex;gap:10px;align-items:center;min-height:16px">${backHref ? `<a class="back" href="${backHref}" aria-label="Back">‹ Back</a>` : ""}${sub ? `<span class="eyebrow">${sub}</span>` : ""}</div><div class="head"><h2>${title}</h2>${right}</div>`;
}
function setTab(name) { document.querySelectorAll("#tabs a").forEach(a => { if (a.dataset.tab === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }); }

function viewHome() {
  setTab("home");
  setTop("Your follow-ups", "ASHA Kavitha R · Melmaruvathur PHC");
  const ps = S.patients;
  const flagged = ps.filter(p => ["flagged", "referred", "reached", "biopsy-due", "biopsied"].includes(p.referral.status));
  const referred = flagged.filter(p => p.referral.referredOn);
  const reached = flagged.filter(p => p.referral.reachedOn);
  const biopsied = flagged.filter(p => p.referral.biopsyOn);
  const max = Math.max(1, flagged.length);
  const attention = ps.filter(p => ["overdue", "flagged", "recheck-due", "biopsy-due"].includes(statusOf(p).key)).sort((a, b) => statusOf(a).sort - statusOf(b).sort);
  const overdue = ps.filter(p => statusOf(p).key === "overdue");
  const reviewN = ps.filter(p => !p.reviewed && p.visits.at(-1)?.tier === "refer").length;
  view.innerHTML = `
    <div class="tiles">
      <div class="tile"><div class="label">Screened</div><div class="value">${ps.length}</div></div>
      <div class="tile"><div class="label">Flagged</div><div class="value">${flagged.length}</div></div>
      <div class="tile"><div class="label">Reached</div><div class="value">${reached.length}</div></div>
    </div>
    <section class="card" aria-labelledby="loop-h">
      <h3 id="loop-h">Referral loop</h3>
      <div class="funnel">
        ${[["Flagged", flagged.length], ["Referred", referred.length], ["Reached", reached.length], ["Biopsied", biopsied.length]].map(([l, n]) => `
          <div class="bar"><span>${l}</span><div class="track"><div class="fill" style="width:${n / max * 100}%"></div></div><span class="num" style="text-align:right">${n}</span></div>`).join("")}
      </div>
      <p class="fine">${flagged.length - reached.length} of ${flagged.length} flagged patients have not reached a hospital yet.</p>
    </section>
    <section class="card" aria-labelledby="att-h">
      <div style="display:flex;justify-content:space-between;align-items:center"><h3 id="att-h">Needs attention</h3><span class="chip urgent">${attention.length}</span></div>
      <div class="rows">${attention.map(rowHTML).join("") || `<p class="fine">Nothing needs attention today.</p>`}</div>
      <button class="btn block" id="remind-btn" ${overdue.length ? "" : "disabled"}>Send voice reminders (${overdue.length})</button>
    </section>
    <div class="btn-row"><a class="btn" href="#today">Today's visits (${worklist().length})</a><a class="btn" href="#villages">By village</a></div>
    <a class="card" href="#review" style="text-decoration:none;color:inherit;flex-direction:row;align-items:center;justify-content:space-between">
      <div><h3>Specialist review queue</h3><p class="fine">Cases flagged for a doctor's decision</p></div>
      <span class="chip ${reviewN ? "urgent" : "ok"}">${reviewN} urgent</span>
    </a>
    <p class="demo-note">Prototype with demo patients. Triage support only, not a diagnosis.</p>`;
  $("#remind-btn").onclick = () => openReminders(overdue);
}
function rowHTML(p) {
  const st = statusOf(p), last = p.visits.at(-1) || { area: 0, colour: "none" };
  return `<a class="row" href="#patient-${p.id}"><div class="swatch">${last.thumb ? `<img src="${last.thumb}" alt="">` : lesionSVG(last.area, last.colour)}</div>
    <div class="grow"><div class="title">${esc(p.name)}, ${p.age}</div><div class="meta">${esc(statusLine(p))}</div></div><span class="chip ${st.cls}">${st.label}</span></a>`;
}

let patientFilter = "all", patientQuery = "";
function viewPatients() {
  setTab("patients");
  setTop("Patients", S.patients.length + " registered", "", `<a class="btn primary" href="#intake" style="min-height:36px;padding:6px 12px">New patient</a>`);
  const filters = [["all", "All"], ["urgent", "Referral open"], ["watch", "Monitor"], ["closed", "Closed"]];
  view.innerHTML = `
    <div class="field"><label for="q">Search by name, village or ABHA</label><input type="search" id="q" value="${esc(patientQuery)}" placeholder="e.g. Lakshmi"></div>
    <div class="toggle-group" role="group" aria-label="Filter">${filters.map(([k, l]) => `<button class="toggle" data-f="${k}" aria-pressed="${patientFilter === k}">${l}</button>`).join("")}</div>
    <div class="card"><div class="rows" id="plist"></div></div>`;
  const draw = () => {
    const q = patientQuery.trim().toLowerCase();
    const list = S.patients.filter(p => {
      const st = statusOf(p);
      const f = patientFilter === "all" || (patientFilter === "urgent" && ["urgent", "info"].includes(st.cls)) || (patientFilter === "watch" && st.cls === "watch") || (patientFilter === "closed" && st.cls === "ok");
      const m = !q || (p.name + " " + p.village + " " + p.abha).toLowerCase().includes(q);
      return f && m;
    }).sort((a, b) => statusOf(a).sort - statusOf(b).sort || a.name.localeCompare(b.name));
    $("#plist").innerHTML = list.map(rowHTML).join("") || `<p class="fine">No patients match.</p>`;
  };
  draw();
  $("#q").oninput = e => { patientQuery = e.target.value; draw(); };
  view.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { patientFilter = b.dataset.f; view.querySelectorAll("[data-f]").forEach(x => x.setAttribute("aria-pressed", x === b)); draw(); });
}

function forecast(p, site) {
  // Least-squares line through the last three measurements of one site; projects area 4 weeks after the last visit.
  const vs = p.visits.filter(v => v.site === site && v.area > 0).slice(-3);
  if (vs.length < 2) return null;
  const xs = vs.map(v => (v.date - vs[0].date) / DAY), ys = vs.map(v => v.area);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  if (sxx === 0) return null;
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / sxx; // % of guide per day
  const last = vs.at(-1);
  const at = last.date + 28 * DAY;
  const projected = round1(Math.max(0, last.area + slope * 28));
  const threshold = round1(last.area * 1.2);
  const daysTo20 = slope > 0 ? Math.ceil((threshold - last.area) / slope) : null;
  return { slope, at, projected, threshold, daysTo20, last, n: vs.length };
}
function areaChart(p, site) {
  const vs = p.visits.filter(v => v.area > 0 && v.site === site);
  if (vs.length < 2) return "";
  const f = forecast(p, site);
  const proj = f && f.slope > 0 ? f : null;
  const W = 380, H = 140, L = 34, R = 14, T = 12, B = 24;
  const t0 = vs[0].date, t1 = proj ? proj.at : vs.at(-1).date;
  const maxA = Math.ceil(Math.max(...vs.map(v => v.area), proj ? proj.projected : 0, proj ? proj.threshold : 0) * 1.12);
  const x = t => L + (t - t0) / Math.max(1, t1 - t0) * (W - L - R);
  const y = a => T + (1 - a / maxA) * (H - T - B);
  const pts = vs.map(v => [x(v.date), y(v.area)]);
  const ticks = [0, maxA / 2, maxA];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Lesion area over ${vs.length} visits, from ${vs[0].area}% to ${vs.at(-1).area}% of frame">
    ${ticks.map(t => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 6}" y="${y(t) + 3}" text-anchor="end">${round1(t)}%</text>`).join("")}
    <path class="area" d="M${pts[0][0]},${y(0)} ${pts.map(q => "L" + q.join(",")).join(" ")} L${pts.at(-1)[0]},${y(0)}Z"/>
    <path class="line" d="M${pts.map(q => q.join(",")).join(" L")}"/>
    ${proj ? `<line class="thr" x1="${L}" x2="${W - R}" y1="${y(proj.threshold)}" y2="${y(proj.threshold)}"/><text x="${L + 4}" y="${y(proj.threshold) - 4}" style="fill:var(--urgent)">+20% from last visit</text>
    <path class="proj" d="M${pts.at(-1).join(",")} L${x(proj.at)},${y(proj.projected)}"/><circle class="proj-dot" cx="${x(proj.at)}" cy="${y(proj.projected)}" r="4"/>` : ""}
    ${pts.map((q, i) => `<circle class="dot ${i === pts.length - 1 ? "last" : ""}" cx="${q[0]}" cy="${q[1]}" r="4"/>`).join("")}
    ${pts.map((q, i) => (i === pts.length - 1 || (pts.at(-1)[0] - q[0] > 46 && (i === 0 || q[0] - pts[i - 1][0] > 46))) ? `<text x="${q[0]}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === pts.length - 1 && !proj ? "end" : "middle"}">${fmtDate(vs[i].date)}</text>` : "").join("")}
    ${proj ? `<text x="${x(proj.at)}" y="${y(proj.projected) + 16}" text-anchor="end" style="fill:var(--urgent)">trend +4 wk</text>` : ""}
  </svg>`;
}
const fmtA = a => String(round1(a));
const SHORT_COLOUR = { none: "None", white: "White", mixed: "Mixed", red: "Red" };
const fmtDateY = t => fmtDate(t) + " " + new Date(t).getFullYear();
function comp(v) {
  if (v.comp) return v.comp;
  return { none: { white: 0, red: 0 }, white: { white: 1, red: 0 }, mixed: { white: 0.62, red: 0.38 }, red: { white: 0.15, red: 0.85 } }[v.colour] || { white: 0, red: 0 };
}
function blobPath(cx, cy, k, sx, sy, s) {
  let d = "";
  for (let i = 0; i <= 48; i++) {
    const a = i / 48 * Math.PI * 2;
    const r = k * (1 + 0.08 * Math.sin(3 * a + s) + 0.05 * Math.cos(5 * a + s * 2));
    d += (i ? "L" : "M") + (cx + Math.cos(a) * r * sx).toFixed(1) + "," + (cy + Math.sin(a) * r * sy).toFixed(1);
  }
  return d + "Z";
}
function plateSVG(vs, idx, uid) {
  const W = 300, H = 210, cx = 150, cy = 105, gx = 84, gy = 50.4;
  const kOf = a => Math.sqrt(Math.max(a, 0) / 100 * Math.PI * gx * gy / (Math.PI * 1.08));
  const cur = vs[idx], prev = idx > 0 ? vs[idx - 1] : null;
  const c = comp(cur), k = kOf(cur.area);
  let grid = "";
  for (let x = 0; x <= W; x += 15) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y = 0; y <= H; y += 15) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  const growth = prev && prev.area ? (cur.area - prev.area) / prev.area * 100 : 0;
  let body = "";
  if (cur.thumb) {
    body = `<clipPath id="pc-${uid}"><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10"/></clipPath><image href="${cur.thumb}" x="6" y="6" width="${W - 12}" height="${H - 12}" preserveAspectRatio="xMidYMid slice" clip-path="url(#pc-${uid})"/>`;
  } else if (cur.area > 0) {
    const base = c.red > 0.6 ? "#C9573F" : "#EADCCB";
    body = `<path d="${blobPath(cx, cy, k * 0.98, 1.35, 0.8, 1.3)}" fill="${base}" opacity="0.9" filter="url(#soft-${uid})"/>`;
    if (c.red > 0 && c.red <= 0.6) body += `<path d="${blobPath(cx + k * 0.38, cy + k * 0.08, k * 0.55 * Math.sqrt(c.red / 0.38), 1.2, 0.85, 2.1)}" fill="#C24A37" opacity="0.85" filter="url(#soft-${uid})"/>`;
    if (c.red > 0.6) body += `<path d="${blobPath(cx - k * 0.3, cy - k * 0.15, k * 0.42, 1.2, 0.8, 0.4)}" fill="#E39C83" opacity="0.7" filter="url(#soft-${uid})"/>`;
    body += `<path d="${blobPath(cx - k * 0.2, cy + k * 0.05, k * 0.35, 1.1, 0.8, 3)}" fill="#9E7F6A" opacity="0.18" filter="url(#soft-${uid})"/>`;
  }
  const prevOutline = prev && prev.area > 0 ? `<path d="${blobPath(cx, cy, kOf(prev.area), 1.35, 0.8, 1.3)}" fill="none" stroke="var(--olive)" stroke-width="1.4" stroke-dasharray="3 4" opacity="0.9"/>` : "";
  const curOutline = cur.area > 0 ? `<path d="${blobPath(cx, cy, k * 1.06, 1.35, 0.8, 1.3)}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 5"/>` : "";
  const callout = growth >= 20 ? (() => { const a = -2.2, r = k * 1.06; const px = cx + Math.cos(a) * r * 1.35, py = cy + Math.sin(a) * r * 0.8; return `<circle cx="${px}" cy="${py}" r="24" fill="none" stroke="var(--urgent)" stroke-width="1.6" opacity="0.6"/><line x1="${px - 24}" y1="${py}" x2="${px + 24}" y2="${py}" stroke="var(--urgent)" stroke-width="1.2" opacity="0.5"/>`; })() : "";
  const empty = cur.area > 0 ? "" : `<text x="${cx}" y="${cy + 4}" text-anchor="middle" style="font: 700 11px var(--font-label); fill: var(--muted)">NO LESION SEEN</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(COLOUR_NAME[cur.colour])} lesion, ${cur.area}% of guide on ${fmtDate(cur.date)}${prev ? ", dashed outline shows " + fmtDate(prev.date) : ""}">
    <defs><filter id="soft-${uid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
    <g stroke="#E4E2D8" stroke-width="0.8">${grid}</g>
    <line x1="${cx}" y1="8" x2="${cx}" y2="${H - 8}" stroke="#B9B7AC" stroke-width="1"/><line x1="8" y1="${cy}" x2="${W - 8}" y2="${cy}" stroke="#B9B7AC" stroke-width="1"/>
    ${body}${prevOutline}${curOutline}${callout}${empty}
  </svg>`;
}
function miniBars(vals, flagLast, w = 46, h = 26) {
  const v = vals.slice(-5), max = Math.max(...v, 0.001), bw = 6, gap = (w - bw * v.length) / Math.max(v.length - 1, 1);
  return `<svg width="${w}" height="${h}" aria-hidden="true">${v.map((x, i) => { const bh = Math.max(3, x / max * h); return `<rect x="${i * (bw + gap)}" y="${h - bh}" width="${bw}" height="${bh}" rx="1.5" fill="${flagLast && i === v.length - 1 ? "var(--urgent)" : i === v.length - 1 ? "var(--olive)" : "var(--olive-soft)"}"/>`; }).join("")}</svg>`;
}
function miniSteps(vals, w = 58, h = 22) {
  if (vals.length < 2) return "";
  const min = Math.min(...vals), max = Math.max(...vals), rng = Math.max(max - min, 0.001);
  let d = "";
  vals.forEach((v, i) => { const x = i / (vals.length - 1) * w, y = h - 2 - (v - min) / rng * (h - 4); d += i ? ` H${x.toFixed(1)} V${y.toFixed(1)}` : `M0,${y.toFixed(1)}`; });
  return `<svg width="${w}" height="${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="var(--olive)" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
function miniDots(colours) {
  const fill = { none: "#DDD9CF", white: "#E9DCCB", mixed: "#D9927A", red: "#C24A37" };
  return `<svg width="${colours.slice(-4).length * 14}" height="14" aria-hidden="true">${colours.slice(-4).map((c, i) => `<circle cx="${7 + i * 14}" cy="7" r="6.5" fill="${fill[c]}" stroke="#CBBFAE" stroke-width="${c === "white" ? 1 : 0}"/>`).join("")}</svg>`;
}
function siteVisits(p, site) { return p.visits.filter(v => v.site === site); }
function analysisTop(p, vs, idx) {
  const cur = vs[idx], prev = idx > 0 ? vs[idx - 1] : null;
  const c = comp(cur);
  const delta = prev && prev.area ? round1((cur.area - prev.area) / prev.area * 100) : null;
  const days = prev ? Math.max(1, daysBetween(prev.date, cur.date)) : 0;
  const weeks = round1(days / 7);
  const colourUp = prev && COLOUR_RANK[cur.colour] > COLOUR_RANK[prev.colour];
  const escalate = delta !== null && (delta >= 20 || (colourUp && cur.colour === "red"));
  const level = escalate || cur.tier === "refer" ? "urgent" : cur.tier === "monitor" ? "watch" : "ok";
  const word = { urgent: "Review", watch: "Watch", ok: cur.area > 0 ? "Stable" : "Clear" }[level];
  const why = level === "urgent"
    ? (delta !== null ? `Flagged: ${delta > 0 ? "+" : ""}${delta}% area in ${days >= 14 ? Math.round(weeks) + " wks" : days + " days"}${colourUp ? " · colour → " + COLOUR_NAME[cur.colour].toLowerCase() : ""} (limit +20%)` : `Flagged at screening · ${COLOUR_NAME[cur.colour].toLowerCase()} lesion`)
    : level === "watch" ? `${delta !== null ? (delta > 0 ? "+" : "") + delta + "% since " + fmtDate(prev.date) + " · " : ""}recheck in 4 weeks` : cur.area > 0 ? `${delta !== null ? (delta > 0 ? "+" : "") + delta + "% · " : ""}within normal variation` : "No lesion seen at this site";
  const upto = vs.slice(0, idx + 1);
  const areas = upto.filter(v => v.area > 0).map(v => v.area);
  const risk = habitRisk(p.habits, p.age);
  const perWeek = delta !== null ? round1(delta / Math.max(weeks, 0.14)) : null;
  const redPct = Math.round(c.red * 100), whitePct = Math.round(c.white * 100);
  return `
    <div class="plate">
      <div class="plate-head"><span class="eyebrow">Series S${cur.site + 1} · Frame ${String(idx + 1).padStart(2, "0")}/${String(vs.length).padStart(2, "0")}</span><span class="view-tag">Change view</span></div>
      <div class="plate-body"><div class="holes" aria-hidden="true">${"<i></i>".repeat(7)}</div>${plateSVG(vs, idx, p.id + idx)}</div>
      <div class="plate-cap">${cur.area > 0 ? `${whitePct}% white patch · ${redPct >= 10 ? `<b>${redPct}% red-tinged</b>` : redPct + "% red-tinged"}${prev && prev.area ? " · dashed: " + fmtDate(prev.date) : ""}` : "No lesion inside the guide"}</div>
    </div>
    <div class="measure">
      <div><span class="big">${fmtA(cur.area)}</span><span class="unit">%</span><div class="eyebrow" style="margin-top:6px">of capture guide</div></div>
      <div class="right"><div class="when">${delta !== null ? `Δ ${delta > 0 ? "+" : ""}${delta}% · ${days >= 14 ? Math.round(weeks) + " wks" : days + " d"}` : fmtDate(cur.date)}</div><div class="fine">Screening aid · not a diagnosis</div></div>
    </div>
    <div class="verdict ${level}"><strong>${word}</strong><span>${esc(why)}</span></div>
    <div class="metrics">
      <div class="metric"><span class="label">Area</span><span class="dotflag ${delta !== null && delta >= 20 ? "red" : ""}"></span><span class="val">${fmtA(cur.area)}%${delta !== null ? ` · Δ ${delta > 0 ? "+" : ""}${delta}%` : " · baseline"}</span>${miniBars(areas, delta !== null && delta >= 20)}</div>
      <div class="metric"><span class="label">Colour</span><span class="dotflag ${redPct >= 10 ? "red" : ""}"></span><span class="val">${prev && prev.colour !== cur.colour ? SHORT_COLOUR[prev.colour] + " → " + SHORT_COLOUR[cur.colour].toLowerCase() : SHORT_COLOUR[cur.colour]} · red ${redPct}%</span>${miniDots(upto.map(v => v.colour))}</div>
      <div class="metric"><span class="label">Growth rate</span><span class="dotflag ${perWeek !== null && perWeek >= 3 ? "red" : ""}"></span><span class="val">${perWeek !== null ? (perWeek > 0 ? "+" : "") + perWeek + "% / wk" : "Needs 2 visits"}</span>${miniSteps(areas)}</div>
      <div class="metric"><span class="label">Habit risk</span><span class="dotflag ${risk.score >= 6.5 ? "red" : ""}"></span><span class="val">${risk.score} / 10 · ${risk.level.toLowerCase()}</span>${miniBars([risk.score], risk.score >= 6.5, 10, 26)}</div>
    </div>`;
}
function loopHTML(p) {
  const r = p.referral; const st = statusOf(p).key;
  const steps = [["Flagged", r.flaggedOn], ["Referred", r.referredOn], ["Reached", r.reachedOn], ["Biopsied", r.biopsyOn]];
  let stuckSet = false;
  return `<div class="loop">${steps.map(([l, d]) => { let c = d ? "done" : ""; if (!d && !stuckSet && r.flaggedOn) { stuckSet = true; if (st === "overdue") c = "stuck"; } return `<div class="${c}">${l}${d ? `<br><span class="num">${fmtDate(d)}</span>` : ""}</div>`; }).join("")}</div>`;
}
function timelineHTML(p) {
  const seen = {};
  const rows = p.visits.map(v => {
    const prev = seen[v.site]; seen[v.site] = v.area > 0 ? v : prev;
    const d = prev && v.area > 0 ? round1((v.area - prev.area) / prev.area * 100) : null;
    let chip = ["plain", "Change"];
    if (v.area === 0) chip = ["ok", "Clear"];
    else if (!prev) chip = ["plain", "Baseline"];
    if (v.tier === "refer") chip = ["urgent", "Review"];
    else if (d !== null && Math.abs(d) < 5 && v.colour === prev.colour) chip = ["ok", "Stable"];
    return { v, d, chip };
  }).reverse();
  return rows.map(({ v, d, chip }) => `<div class="tl-row"><span class="d">${fmtDateY(v.date)}</span><span class="m">${fmtA(v.area)}%${d !== null ? ` · Δ ${d > 0 ? "+" : ""}${d}%` : v.area > 0 ? " · baseline" : ""}<br><span class="fine">${esc(SITES[v.site])}</span></span><span class="chip ${chip[0]}">${chip[1]}</span></div>`).join("");
}
function viewPatient(id) {
  const p = patient(id);
  if (!p) { location.hash = "patients"; return; }
  setTab("patients");
  const st = statusOf(p), risk = habitRisk(p.habits, p.age), r = p.referral;
  const lastLesion = [...p.visits].reverse().find(v => v.area > 0) || p.visits.at(-1);
  const site = lastLesion ? lastLesion.site : 0;
  const vs = siteVisits(p, site);
  const since = vs.length ? MONTHS[new Date(vs[0].date).getMonth()] + " " + new Date(vs[0].date).getFullYear() : "";
  setTop(`${esc(p.name)}, ${p.age}`, `${esc(SITES[site])} · S${site + 1}${since ? " · since " + since : ""}`, "#patients", `<span class="chip ${st.cls}">${st.label}</span>`);
  const actions = [];
  if (r.status === "flagged") actions.push(`<button class="btn" data-act="refer">Mark referred</button>`);
  if (r.status === "referred") actions.push(`<button class="btn" data-act="reached">Reached hospital</button>`, `<button class="btn" data-act="remind">Voice reminder</button>`);
  if (r.status === "reached" || r.status === "biopsy-due") actions.push(`<button class="btn" data-act="biopsied">Biopsy done</button>`);
  const idx = vs.length - 1;
  const f = vs.length ? forecast(p, site) : null;
  const newest = vs.at(-1);
  view.innerHTML = `
    <p class="eyebrow" style="margin:0">ABHA <span class="num">${esc(maskAbha(p.abha))}</span> · ${esc(p.village)} · ${p.visits.length} visit${p.visits.length === 1 ? "" : "s"}</p>
    ${vs.length ? `<div id="ana-top" style="display:flex;flex-direction:column;gap:14px">${analysisTop(p, vs, idx)}</div>
    ${vs.length > 1 ? `<div class="replay">
      <span class="eyebrow" style="font-size:9.5px">Then / now · drag to replay</span>
      <div class="ends"><span>${fmtDate(vs[0].date)}</span><input type="range" id="replay" min="0" max="${vs.length - 1}" value="${idx}" aria-label="Visit shown"><span style="color:var(--urgent)">${fmtDate(newest.date)}</span></div>
      <div class="thumbs" role="group" aria-label="Visits">${vs.map((v, i) => `<button class="thumb" data-i="${i}" aria-pressed="${i === idx}">${fmtA(v.area)}%<span class="mini">${v.thumb ? `<img src="${v.thumb}" alt="">` : lesionSVG(v.area, v.colour)}</span>${i === vs.length - 1 && daysBetween(v.date, Date.now()) <= 21 ? `<span class="new">NEW</span>` : ""}</button>`).join("")}</div>
    </div>` : ""}` : `<section class="card"><h3>No visits yet</h3><p class="fine">Capture the first photo series to start tracking.</p></section>`}
    ${r.flaggedOn ? `<button class="btn primary cta block" data-act="note">Create referral note →</button>` : `<a class="btn primary cta block" href="#capture-${p.id}">Capture follow-up →</a>`}
    ${r.flaggedOn ? `<section class="card"><div class="card-head"><span class="section-title">Referral loop</span><span class="chip ${st.cls}">${st.label}</span></div>${loopHTML(p)}<p class="fine">${esc(statusLine(p))}${p.reminders ? ` · ${p.reminders} reminder${p.reminders > 1 ? "s" : ""} sent` : ""}</p>${actions.length ? `<div class="btn-row">${actions.join("")}</div>` : ""}</section>` : ""}
    ${p.visits.length ? `<section class="card"><div class="card-head"><span class="section-title">Timeline · ${p.visits.length} visits</span></div>
      <div class="dots-strip" aria-hidden="true">${p.visits.map((v, i) => `${i ? "<span></span>" : ""}<i class="${v.tier === "refer" ? "red" : ""}"></i>`).join("")}</div>
      <div>${timelineHTML(p)}</div></section>` : ""}
    ${vs.filter(v => v.area > 0).length > 1 ? `<section class="card"><div class="card-head"><span class="section-title">Trend</span>${f && f.slope > 0 ? `<span class="chip urgent">+${round1(f.projected - f.last.area)} in 4 wk</span>` : `<span class="chip ok">Not growing</span>`}</div>
      ${areaChart(p, site)}
      <p class="fine">Escalates when area rises 20% or more, or colour turns red, between visits of one site. The dashed line is a straight-line trend through the last ${Math.min(3, vs.filter(v => v.area > 0).length)} visits: a scheduling aid, not a prediction of cancer.</p></section>` : ""}
    <section class="card"><span class="section-title">Habit risk</span>
      <div class="riskbox ${risk.level === "High" ? "high" : risk.level === "Low" ? "low" : ""}"><span>Habit risk score</span><strong>${risk.level} · ${risk.score} / 10</strong>
        <div class="breakdown">${risk.parts.map(([l, w]) => `<span>${esc(l)}</span><span class="num">+${w}</span>`).join("") || "<span>No risk habits recorded</span><span></span>"}</div></div>
    </section>
    <div class="btn-row">${r.flaggedOn ? `<a class="btn" href="#capture-${p.id}">Capture follow-up</a>` : `<button class="btn" data-act="note-any">Visit summary</button>`}<a class="btn" href="#result-${p.id}">Patient's result</a></div>`;
  const rng = $("#replay");
  const show = i => { $("#ana-top").innerHTML = analysisTop(p, vs, i); view.querySelectorAll(".thumb").forEach(t => t.setAttribute("aria-pressed", +t.dataset.i === i)); if (rng) rng.value = i; };
  if (rng) rng.oninput = () => show(+rng.value);
  view.querySelectorAll(".thumb").forEach(t => t.onclick = () => show(+t.dataset.i));
  view.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
    const a = b.dataset.act;
    if (a === "refer") { r.status = "referred"; r.referredOn = todayStart(); toast("Marked referred to " + HOSPITAL.name); }
    if (a === "reached") { r.status = "reached"; r.reachedOn = todayStart(); toast("Marked as reached hospital"); }
    if (a === "biopsied") { r.status = "biopsied"; r.biopsyOn = todayStart(); toast("Biopsy recorded. Referral loop closed."); }
    if (a === "remind") { openReminders([p]); return; }
    if (a === "note" || a === "note-any") { openReferralNote(p); return; }
    p.synced = false; save(); render();
  });
}
function updateFloats() {
  const f1 = $("#float-1"), f2 = $("#float-2");
  if (!f1) return;
  let best = null;
  S.patients.forEach(p => { const c = change(p); if (c && (!best || c.delta > best.c.delta)) best = { p, c }; });
  if (best) {
    const vs = siteVisits(best.p, best.c.cur.site).filter(v => v.area > 0).map(v => v.area);
    f1.innerHTML = `<span class="eyebrow">Delta · ${esc(best.p.name)} · ${Math.round(best.c.weeks)} wks</span><div class="big">Δ ${best.c.delta > 0 ? "+" : ""}${best.c.delta}%</div>${miniSteps(vs, 200, 28)}`;
  } else f1.innerHTML = `<span class="eyebrow">Delta</span><div class="big">No series yet</div>`;
  const overdue = S.patients.filter(p => statusOf(p).key === "overdue").length;
  const flagged = S.patients.filter(p => p.referral.flaggedOn).length;
  const reached = S.patients.filter(p => p.referral.reachedOn).length;
  f2.innerHTML = `<span class="eyebrow">Referral loop</span><div class="big">${overdue} overdue</div><p class="fine">${flagged} flagged · ${reached} reached hospital</p>`;
}

function referralNote(p) {
  const v = p.visits.at(-1), c = change(p), risk = habitRisk(p.habits, p.age), f = v ? forecast(p, v.site) : null;
  const lines = [
    "REFERRAL · Oral lesion surveillance",
    "To: " + HOSPITAL.name + " (" + HOSPITAL.dept + ")",
    "From: ASHA Kavitha R, Melmaruvathur PHC",
    "Date: " + new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    "",
    "Patient: " + p.name + ", " + p.age + (p.sex === "F" ? " F" : p.sex === "M" ? " M" : ""),
    "ABHA: " + (p.abha || "not available") + " · Village: " + p.village,
    "",
    "Finding: " + (v ? COLOUR_NAME[v.colour] + " lesion, " + SITES[v.site].toLowerCase() + ", " + v.area + "% of capture guide (" + fmtDate(v.date) + ")" : "none recorded"),
    c ? "Change: " + (c.delta > 0 ? "+" : "") + c.delta + "% area in " + (c.days >= 14 ? Math.round(c.weeks) + " weeks" : c.days + " days") + "; colour " + (c.prev.colour === c.cur.colour ? "unchanged" : COLOUR_NAME[c.prev.colour].toLowerCase() + " to " + COLOUR_NAME[c.cur.colour].toLowerCase()) : "Change: first visit for this site",
    f && f.slope > 0 ? "Trend: " + f.projected + "% of guide in 4 weeks if growth continues" : "",
    "Screening tier: " + (v ? TIER[v.tier].label : "-"),
    "Habits: " + (p.habits.tobacco.map(t => TOBACCO[t].label).join(", ") || "no tobacco") + (p.habits.years ? " for " + p.habits.years + " years" : "") + (p.habits.alcohol ? "; alcohol" : "") + "; mouth opening " + p.habits.mouth + " mm",
    "Habit risk score: " + risk.score + " / 10",
    "",
    "Visits on record: " + p.visits.map(x => fmtDate(x.date) + " " + x.area + "%").join(" · "),
    "",
    "Request: clinical examination and biopsy decision.",
    "Triage support only. Not a diagnosis."
  ].filter((l, i, arr) => !(l === "" && arr[i - 1] === ""));
  return lines.join("\n");
}
function openReferralNote(p) {
  const text = referralNote(p);
  openModal(`<h3 id="modal-title">Referral note</h3><p class="fine">A summary for the hospital, built from the visit record. Copy it into WhatsApp, SMS or the hospital's system.</p><pre class="note-box" id="note-text">${esc(text)}</pre><div class="btn-row"><button class="btn" id="m-close">Close</button><button class="btn primary" id="m-copy">Copy note</button></div>`);
  $("#m-close").onclick = closeModal;
  $("#m-copy").onclick = async () => {
    try { await navigator.clipboard.writeText(text); toast("Referral note copied"); }
    catch (e) { const r = document.createRange(); r.selectNodeContents($("#note-text")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast("Copy blocked here. The note is selected; press Ctrl+C or ⌘C."); }
  };
}

/* ---------- intake ---------- */
let draft = null;
function viewIntake(prefillName) {
  setTab("patients");
  setTop("New patient", "Registration and habit risk", "#patients");
  if (!draft) draft = { name: prefillName || "", age: 45, sex: "F", village: "Melmaruvathur", abha: "", habits: { tobacco: [], years: 0, perDay: 5, alcohol: false, mouth: 40 } };
  const d = draft;
  view.innerHTML = `
    <form id="intake" class="card" novalidate>
      <div class="field"><label for="f-name">Full name</label><input type="text" id="f-name" value="${esc(d.name)}" required autocomplete="off"></div>
      <div class="field-row">
        <div class="field"><label for="f-age">Age</label><input type="number" id="f-age" min="12" max="110" value="${d.age}"></div>
        <div class="field"><label for="f-sex">Sex</label><select id="f-sex"><option value="F" ${d.sex === "F" ? "selected" : ""}>Female</option><option value="M" ${d.sex === "M" ? "selected" : ""}>Male</option><option value="O" ${d.sex === "O" ? "selected" : ""}>Other</option></select></div>
      </div>
      <div class="field"><label for="f-village">Village</label><input type="text" id="f-village" value="${esc(d.village)}"></div>
      <div class="field"><label for="f-abha">ABHA number (14 digits, optional)</label><input type="text" id="f-abha" inputmode="numeric" class="mono" value="${esc(d.abha)}" placeholder="91 4402 8871 4412"></div>
      <div class="field"><span class="label" id="tob-l">Tobacco habit</span><div class="toggle-group" role="group" aria-labelledby="tob-l">${Object.entries(TOBACCO).map(([k, t]) => `<button type="button" class="toggle" data-t="${k}" aria-pressed="${d.habits.tobacco.includes(k)}">${t.label}</button>`).join("")}</div></div>
      <div class="field"><label for="f-years">Duration: <span id="years-v" class="num">${d.habits.years}</span> years</label><input type="range" id="f-years" min="0" max="40" value="${d.habits.years}"></div>
      <div class="field-row">
        <div class="field"><label for="f-perday">Uses per day</label><input type="number" id="f-perday" min="0" max="60" value="${d.habits.perDay}"></div>
        <div class="field"><label for="f-mouth">Mouth opening (mm)</label><input type="number" id="f-mouth" min="10" max="70" value="${d.habits.mouth}"></div>
      </div>
      <div class="field"><span class="label" id="alc-l">Alcohol</span><div class="toggle-group" role="group" aria-labelledby="alc-l"><button type="button" class="toggle" data-alc="1" aria-pressed="${d.habits.alcohol}">Drinks alcohol</button></div></div>
      <div id="risk-out"></div>
      <p class="fine">Mouth opening under 35 mm can mean oral submucous fibrosis. Risk weights are illustrative, not clinically validated.</p>
      <p class="fine" id="form-err" role="alert" style="color:var(--urgent)"></p>
      <div class="btn-row"><button type="submit" class="btn" data-next="patient">Save</button><button type="submit" class="btn primary" data-next="capture">Save and capture</button></div>
    </form>`;
  const sync = () => {
    d.name = $("#f-name").value; d.age = +$("#f-age").value || 0; d.sex = $("#f-sex").value; d.village = $("#f-village").value; d.abha = $("#f-abha").value;
    d.habits.years = +$("#f-years").value; d.habits.perDay = +$("#f-perday").value || 0; d.habits.mouth = +$("#f-mouth").value || 0;
    $("#years-v").textContent = d.habits.years;
    const r = habitRisk(d.habits, d.age);
    $("#risk-out").innerHTML = `<div class="riskbox ${r.level === "High" ? "high" : r.level === "Low" ? "low" : ""}"><span>Habit risk score</span><strong>${r.level} · ${r.score} / 10</strong><div class="breakdown">${r.parts.map(([l, w]) => `<span>${esc(l)}</span><span class="num">+${w}</span>`).join("") || "<span>No risk habits</span><span></span>"}</div></div>`;
  };
  view.querySelectorAll("input,select").forEach(i => i.addEventListener("input", sync));
  view.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { const k = b.dataset.t, t = d.habits.tobacco; const i = t.indexOf(k); i >= 0 ? t.splice(i, 1) : t.push(k); b.setAttribute("aria-pressed", i < 0); sync(); });
  $("[data-alc]").onclick = e => { d.habits.alcohol = !d.habits.alcohol; e.target.setAttribute("aria-pressed", d.habits.alcohol); sync(); };
  sync();
  $("#intake").onsubmit = e => {
    e.preventDefault(); sync();
    const digits = d.abha.replace(/\D/g, "");
    if (!d.name.trim()) { $("#form-err").textContent = "Enter the patient's name."; $("#f-name").focus(); return; }
    if (digits && digits.length !== 14) { $("#form-err").textContent = "ABHA numbers have 14 digits. Leave it blank if the patient has none."; $("#f-abha").focus(); return; }
    const id = "p" + Date.now().toString(36);
    S.patients.push({ id, name: d.name.trim(), age: d.age, sex: d.sex, village: d.village.trim() || "Unknown", abha: digits ? digits.replace(/^(\d{2})(\d{4})(\d{4})(\d{4})$/, "$1 $2 $3 $4") : "", habits: JSON.parse(JSON.stringify(d.habits)), visits: [], referral: { status: "none" }, synced: false, reviewed: true, reminders: 0 });
    if (campToken) { S.queue = S.queue.filter(q => q.token !== campToken); campToken = null; }
    save(); draft = null;
    location.hash = e.submitter?.dataset.next === "patient" ? "patient-" + id : "capture-" + id;
  };
}

/* ---------- capture + quality gate + demo triage ---------- */
let cap = null; // { pid, idx, shots: [ {thumb, q, a} ], start }
function newCapture(pid) { cap = { pid, idx: 0, shots: [null, null, null, null], start: Date.now() }; }
function viewCapturePick() {
  setTab("capture");
  setTop("Capture", "Choose who you are screening");
  const ps = [...S.patients].sort((a, b) => statusOf(a).sort - statusOf(b).sort);
  view.innerHTML = `<a class="btn primary block" href="#intake">New patient</a>
    <section class="card"><h3>Follow-up visit</h3><div class="rows">${ps.map(p => `<a class="row" href="#capture-${p.id}"><div class="grow"><div class="title">${esc(p.name)}, ${p.age}</div><div class="meta">${esc(p.village)} · ${p.visits.length} visit${p.visits.length === 1 ? "" : "s"}</div></div><span class="chip ${statusOf(p).cls}">${statusOf(p).label}</span></a>`).join("")}</div></section>`;
}

/* ---------- reference images: benign / monitor / refer ---------- */
const REF = {
  benign: { label: "Benign", cls: "ok", action: "No action · yearly check", cues: ["Even pink colour across the area", "Smooth, moist surface", "No patch, ulcer or lump"] },
  monitor: { label: "Monitor", cls: "watch", action: "Recheck in 4 weeks", cues: ["White patch that does not rub off", "Flat, even, thin surface", "No red areas, no ulcer, no hardness"] },
  refer: { label: "Refer urgently", cls: "urgent", action: "Doctor within 7 days", cues: ["Red, or speckled red and white patch", "Ulcer that has not healed in 2 weeks", "Lump, hard area, bleeding or growth since last visit"] }
};
const refReal = {}, refCache = {};
// If real photos are placed at images/reference/<kind>.jpg (see README), they replace the drawn illustrations.
function loadRealRefs() {
  Object.keys(REF).forEach(k => {
    const im = new Image();
    im.onload = () => { refReal[k] = im; if (/^#capture-/.test(location.hash)) render(); };
    im.src = `images/reference/${k}.jpg`;
  });
}
function drawMucosa(g, W, H) {
  const grd = g.createRadialGradient(W * 0.5, H * 0.45, 20, W * 0.5, H * 0.5, W * 0.75);
  grd.addColorStop(0, "#F3BFAA"); grd.addColorStop(0.6, "#DE9D88"); grd.addColorStop(1, "#B9705F");
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 7000; k++) { g.fillStyle = `rgba(${150 + Math.random() * 70},${60 + Math.random() * 50},${60 + Math.random() * 40},0.3)`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  g.strokeStyle = "rgba(170,60,60,0.25)"; g.lineWidth = 1.2;
  for (let v = 0; v < 9; v++) { g.beginPath(); let x = Math.random() * W, y = Math.random() * H; g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (Math.random() - 0.5) * 70; y += (Math.random() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
  for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(255,245,240,0.35)"; g.beginPath(); g.ellipse(Math.random() * W, Math.random() * H, 3 + Math.random() * 6, 1.5, Math.random() * 3, 0, Math.PI * 2); g.fill(); }
}
function blob(g, cx, cy, r, sx, sy, seed) {
  g.beginPath();
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.12) { const rr = r * (1 + 0.1 * Math.sin(a * 3 + seed) + 0.06 * Math.cos(a * 7 + seed)); g.lineTo(cx + Math.cos(a) * rr * sx, cy + Math.sin(a) * rr * sy); }
  g.closePath();
}
function drawRef(kind) {
  if (refCache[kind]) return refCache[kind];
  const c = document.createElement("canvas"); c.width = 480; c.height = 360;
  const g = c.getContext("2d"), W = 480, H = 360, cx = W / 2, cy = H / 2;
  drawMucosa(g, W, H);
  if (kind === "monitor") {
    g.save(); blob(g, cx, cy, 70, 1.4, 0.75, 1); g.fillStyle = "#F4EEE6"; g.shadowColor = "rgba(255,255,255,0.6)"; g.shadowBlur = 10; g.fill(); g.restore();
    g.save(); blob(g, cx, cy, 70, 1.4, 0.75, 1); g.clip();
    for (let k = 0; k < 2500; k++) { g.fillStyle = `rgba(${215 + Math.random() * 30},${200 + Math.random() * 30},${190 + Math.random() * 30},0.35)`; g.fillRect(cx - 110 + Math.random() * 220, cy - 60 + Math.random() * 120, 2, 2); }
    g.strokeStyle = "rgba(190,165,150,0.55)"; g.lineWidth = 1;
    for (let f = 0; f < 7; f++) { g.beginPath(); let x = cx - 80 + Math.random() * 160, y = cy - 40 + Math.random() * 80; g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (Math.random() - 0.5) * 30; y += (Math.random() - 0.5) * 16; g.lineTo(x, y); } g.stroke(); }
    g.restore();
  }
  if (kind === "refer") {
    g.save(); blob(g, cx, cy, 78, 1.35, 0.8, 2.2); g.fillStyle = "#B8321F"; g.shadowColor = "rgba(150,20,10,0.5)"; g.shadowBlur = 14; g.fill(); g.restore();
    g.save(); blob(g, cx, cy, 78, 1.35, 0.8, 2.2); g.clip();
    for (let k = 0; k < 3000; k++) { g.fillStyle = `rgba(${150 + Math.random() * 60},${20 + Math.random() * 30},${15 + Math.random() * 25},0.45)`; g.fillRect(cx - 120 + Math.random() * 240, cy - 70 + Math.random() * 140, 2, 2); }
    for (let k = 0; k < 26; k++) { g.fillStyle = "rgba(248,238,228,0.9)"; g.beginPath(); g.ellipse(cx - 90 + Math.random() * 180, cy - 45 + Math.random() * 90, 3 + Math.random() * 7, 2 + Math.random() * 4, Math.random() * 3, 0, Math.PI * 2); g.fill(); }
    g.beginPath(); g.ellipse(cx + 30, cy + 8, 22, 14, 0.3, 0, Math.PI * 2); g.fillStyle = "#E8D29A"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#8E1E12"; g.stroke();
    g.restore();
  }
  refCache[kind] = c;
  return c;
}
function refSrc(kind) { return refReal[kind] ? refReal[kind].src : (drawRef(kind).__url ||= drawRef(kind).toDataURL("image/jpeg", 0.85)); }
function refSourceEl(kind) { return refReal[kind] || drawRef(kind); }
function closestRef(shot) {
  if (!shot || !shot.a) return null;
  const a = shot.a;
  if (a.area < 0.8) return "benign";
  return a.colour === "white" ? "monitor" : "refer";
}
function refGrid(shot) {
  const near = closestRef(shot);
  return `<section class="refs" aria-labelledby="ref-h">
    <div class="card-head"><span class="section-title" id="ref-h">Reference · what to look for</span><span class="fine">${Object.keys(refReal).length ? "Reference photos" : "Illustrations"}</span></div>
    <div class="ref-grid">${Object.entries(REF).map(([k, r]) => `<button class="ref-card ${near === k ? "near" : ""}" data-ref="${k}" aria-label="${r.label} reference${near === k ? ", closest to your photo" : ""}">
      <span class="ref-img"><img src="${refSrc(k)}" alt=""></span>
      <span class="chip ${r.cls}">${r.label}</span>
      <span class="ref-sub">${r.action}</span>
      ${near === k ? `<span class="ref-near">Closest</span>` : ""}
    </button>`).join("")}</div>
    ${near ? `<p class="fine">Your photo looks closest to <b>${REF[near].label}</b> by colour and area. This is a visual guide, not the triage result.</p>` : `<p class="fine">Tap a card to see the signs to look for.</p>`}
  </section>`;
}
function openRef(kind, onUse) {
  const r = REF[kind];
  openModal(`<div class="card-head"><h3 id="modal-title">${r.label}</h3><span class="chip ${r.cls}">${r.action}</span></div>
    <div class="ref-big"><img src="${refSrc(kind)}" alt="${r.label} reference ${refReal[kind] ? "photo" : "illustration"}"></div>
    <ul class="cue-list">${r.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
    <p class="fine">${refReal[kind] ? "Reference photo from a public dataset. See README for the source and licence." : "Drawn illustration. Add real reference photos in images/reference/ to replace it (see README)."}</p>
    <div class="btn-row"><button class="btn" id="m-close">Close</button><button class="btn primary" id="m-use">Use as sample photo</button></div>`);
  $("#m-close").onclick = closeModal;
  $("#m-use").onclick = () => { closeModal(); onUse(refSourceEl(kind)); };
}

let ghostOn = true, ghostOpacity = 0.4, liveStream = null;
function prevForSite(p, site) {
  // Latest earlier photo of this site: either the visit's main photo, or one of the other sites photographed that day.
  for (const v of [...p.visits].reverse()) {
    if (v.site === site && (v.thumb || v.area > 0)) return v;
    if (v.sitePhotos && v.sitePhotos[site]) return { date: v.date, thumb: v.sitePhotos[site], area: 0, colour: "none", site };
  }
  return null;
}
function ghostSVG(v) {
  // Outline of the previous visit's lesion at true scale inside the guide, for visits recorded without a photo.
  const px = Math.max(v.area, 0) / 100 * (Math.PI * 44.8 * 28.8);
  const k = Math.sqrt(px / (Math.PI * 1.08));
  return `<svg class="ghost" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${v.area > 0 ? `<path d="${blobPath(80, 60, k, 1.35, 0.8, 1.3)}" fill="rgb(255 255 255 / 0.25)" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 3"/>` : ""}</svg>`;
}
function stopLive() { if (liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; } }
async function startLive() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
    liveStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false });
    render();
  } catch (e) {
    toast("Live camera is blocked in this preview. Use Take or upload photo; the ghost guide still applies.");
  }
}
function alignRing(score) {
  const r = 22, c = 2 * Math.PI * r, col = score >= 0.8 ? "var(--ok)" : score >= 0.6 ? "var(--watch)" : "var(--urgent)";
  return `<svg class="ring" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="${r}" fill="none" stroke="var(--sunk)" stroke-width="6"/><circle cx="26" cy="26" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c * score} ${c}" transform="rotate(-90 26 26)"/><text x="26" y="30" text-anchor="middle" style="font: 800 13px var(--font-label); fill: var(--ink)">${Math.round(score * 100)}</text></svg>`;
}
function alignHint(al) {
  if (!al) return "";
  const parts = [];
  if (Math.abs(al.dx) >= 0.04) parts.push(`${Math.round(Math.abs(al.dx) * 100)}% ${al.dx > 0 ? "right" : "left"}`);
  if (Math.abs(al.dy) >= 0.04) parts.push(`${Math.round(Math.abs(al.dy) * 100)}% ${al.dy > 0 ? "lower" : "higher"}`);
  const move = [];
  if (Math.abs(al.dx) >= 0.04) move.push(al.dx > 0 ? "right" : "left");
  if (Math.abs(al.dy) >= 0.04) move.push(al.dy > 0 ? "down" : "up");
  if (parts.length) return `Compared with last visit the lesion sits ${parts.join(" and ")}. Move the phone slightly ${move.join(" and ")} and retake for the best comparison.`;
  return al.score >= 0.6 ? "Framing matches the last visit." : "Position matches, but the photo looks different from last time. Check the lighting and camera angle, or the lesion itself may have changed.";
}
function grayGrid(src, W = 64, H = 48) {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  const sw = src.naturalWidth || src.videoWidth || src.width, sh = src.naturalHeight || src.videoHeight || src.height;
  const k = Math.max(W / sw, H / sh); g.drawImage(src, (W - sw * k) / 2, (H - sh * k) / 2, sw * k, sh * k);
  const d = g.getImageData(0, 0, W, H).data, out = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  // Two passes of a 3x3 box blur, so fine texture and sensor noise don't dominate the comparison; shapes and layout do.
  for (let pass = 0; pass < 2; pass++) {
    const src2 = out.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      let t = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) t += src2[(y + j) * W + x + i];
      out[y * W + x] = t / 9;
    }
  }
  return out;
}
function alignScore(prevSrc, curSrc) {
  // Normalised cross-correlation over shifts of up to ±12% of the frame; the best shift says how far the framing moved.
  const W = 64, H = 48, a = grayGrid(prevSrc, W, H), b = grayGrid(curSrc, W, H);
  let best = { s: -1, dx: 0, dy: 0 };
  for (let dy = -6; dy <= 6; dy++) for (let dx = -8; dx <= 8; dx++) {
    let sa = 0, sb = 0, n = 0;
    for (let y = 6; y < H - 6; y++) for (let x = 8; x < W - 8; x++) { sa += a[y * W + x]; sb += b[(y + dy) * W + x + dx]; n++; }
    const ma = sa / n, mb = sb / n; let num = 0, da = 0, db = 0;
    for (let y = 6; y < H - 6; y++) for (let x = 8; x < W - 8; x++) { const u = a[y * W + x] - ma, v = b[(y + dy) * W + x + dx] - mb; num += u * v; da += u * u; db += v * v; }
    const s = num / Math.sqrt(da * db + 1e-6);
    if (s > best.s) best = { s, dx, dy };
  }
  const shiftPenalty = Math.hypot(best.dx / W, best.dy / H);
  return { score: clamp(best.s * (1 - shiftPenalty * 2.5), 0, 1), dx: best.dx / W, dy: best.dy / H };
}
function viewCapture(pid) {
  const p = patient(pid);
  if (!p) { location.hash = "capture"; return; }
  if (!cap || cap.pid !== pid) newCapture(pid);
  setTab("capture");
  const i = cap.idx, shot = cap.shots[i];
  const prev = prevForSite(p, i);
  setTop(`Site ${i + 1} of 4`, `${esc(SITES[i])} · ${esc(p.name)}`, "#patient-" + pid);
  const q = shot?.q;
  const chips = q ? `<span class="chip ${q.focusOk ? "ok" : "urgent"}">${q.focusOk ? "Focus ok" : "Too blurry"}</span><span class="chip ${q.lightOk ? "ok" : "watch"}">${q.lightOk ? "Light ok" : q.brightness < 70 ? "Too dark" : "Too bright"}</span>${q.glareOk ? "" : `<span class="chip urgent">Glare</span>`}` : `<span class="chip plain">${liveStream ? "Live" : "No photo yet"}</span>`;
  const ghost = prev && ghostOn ? `<div id="ghost" style="opacity:${ghostOpacity};position:absolute;inset:0">${prev.thumb ? `<img class="ghost" src="${prev.thumb}" alt="">` : ghostSVG(prev)}</div>` : "";
  const media = shot ? `<img src="${shot.thumb}" alt="Captured photo of ${esc(SITES[i])}">` : liveStream ? `<video id="live" autoplay playsinline muted></video>` : "";
  const al = shot?.align;
  view.innerHTML = `
    <div class="steps" aria-label="Progress">${SITES.map((_, k) => `<span class="${cap.shots[k] ? "done" : k === i ? "now" : ""}"></span>`).join("")}</div>
    <div class="viewfinder">${media}${ghost}<div class="guide"></div><div class="qchips">${chips}</div><div class="hint">${shot ? (q.ok ? "Photo passed the quality gate" : "Retake: the photo failed the quality gate") : prev ? "Line the lesion up with the ghost of the last visit" : "Align the lesion inside the guide"}</div></div>
    ${prev ? `<div class="ghost-ctl"><button class="toggle" id="ghost-on" aria-pressed="${ghostOn}">Ghost · ${fmtDate(prev.date)}</button><input type="range" id="ghost-op" min="10" max="80" value="${Math.round(ghostOpacity * 100)}" aria-label="Ghost opacity" ${ghostOn ? "" : "disabled"}><span class="pct" id="ghost-pct">${Math.round(ghostOpacity * 100)}%</span></div>` : `<p class="fine">First photo of this site. Later visits will show it as a ghost overlay for alignment.</p>`}
    ${al ? `<div class="align">${alignRing(al.score)}<div><div class="label">Alignment with ${fmtDate(prev.date)}</div><div class="val">${al.score >= 0.8 ? "Good match" : al.score >= 0.6 ? "Usable, could be closer" : "Poor match, retake"}</div><p class="fine">${esc(alignHint(al))}</p></div></div>` : ""}
    ${refGrid(shot)}
    ${q ? `<dl class="kv"><dt>Brightness</dt><dd>${Math.round(q.brightness)} <span class="fine">(70 to 225)</span></dd><dt>Sharpness</dt><dd>${Math.round(q.sharp)} <span class="fine">(40+)</span></dd><dt>Glare</dt><dd>${q.glare}% <span class="fine">(under 6%)</span></dd><dt>Colour correction</dt><dd class="mono">R×${q.gains[0]} G×${q.gains[1]} B×${q.gains[2]}</dd></dl>` : ""}
    ${liveStream && !shot ? `<button class="btn primary block" id="snap">Capture frame</button>` : ""}
    <div class="btn-row">${liveStream ? `<button class="btn" id="live-stop">Stop camera</button>` : `<button class="btn" id="live-start">Live camera</button>`}<label class="btn" for="file-input" id="take">${shot ? "Retake or upload" : "Take or upload photo"}</label></div>
    <div class="btn-row"><button class="btn" id="sample">Use sample photo</button><button class="btn" id="skip">No lesion here</button></div>
    <button class="btn primary block" id="next" ${shot && q.ok ? "" : "disabled"}>${i < 3 ? "Accept, next site →" : "Accept and analyse →"}</button>
    <p class="fine">Four sites in about 90 seconds. Photos stay on this phone. The sample photo is a drawn test image, placed slightly off-centre each time so you can see the alignment check work.</p>`;
  const vid = $("#live"); if (vid && liveStream) { vid.srcObject = liveStream; vid.play?.().catch(() => {}); }
  const gOn = $("#ghost-on"), gOp = $("#ghost-op");
  if (gOn) gOn.onclick = () => { ghostOn = !ghostOn; render(); };
  if (gOp) gOp.oninput = () => { ghostOpacity = +gOp.value / 100; const g = $("#ghost"); if (g) g.style.opacity = ghostOpacity; $("#ghost-pct").textContent = gOp.value + "%"; };
  $("#file-input").onchange = e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; const img = new Image(); img.onload = () => { takeShot(img); URL.revokeObjectURL(img.src); }; img.onerror = () => toast("That file could not be read as an image."); img.src = URL.createObjectURL(f); };
  $("#sample").onclick = () => takeShot(sampleImage(p, i));
  view.querySelectorAll("[data-ref]").forEach(b => b.onclick = () => openRef(b.dataset.ref, el => takeShot(el)));
  $("#skip").onclick = () => { cap.shots[i] = { thumb: null, q: { ok: true }, a: { area: 0, colour: "none", red: 0, white: 0 }, skipped: true }; advance(); };
  $("#next").onclick = () => { stopLive(); advance(); };
  const ls = $("#live-start"); if (ls) ls.onclick = startLive;
  const lx = $("#live-stop"); if (lx) lx.onclick = () => { stopLive(); render(); };
  const sn = $("#snap"); if (sn) sn.onclick = () => { const v = $("#live"); if (!v.videoWidth) { toast("Camera is still starting."); return; } const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); stopLive(); takeShot(c); };
}
function advance() {
  if (cap.idx < 3) { cap.idx++; render(); } else { analyse(); }
}
function sampleImage(p, site) {
  // Draws a synthetic mucosa photo. The lesion follows the patient's last recorded state, grown a little, so follow-ups show change.
  const c = document.createElement("canvas"); c.width = 320; c.height = 240;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(160, 120, 20, 160, 120, 220); grd.addColorStop(0, "#F1BBA6"); grd.addColorStop(1, "#C98572");
  g.fillStyle = grd; g.fillRect(0, 0, 320, 240);
  for (let k = 0; k < 5000; k++) { g.fillStyle = `rgba(${140 + Math.random() * 70},${60 + Math.random() * 50},${60 + Math.random() * 40},0.35)`; g.fillRect(Math.random() * 320, Math.random() * 240, 2, 2); }
  const last = [...p.visits].reverse().find(v => v.site === site && v.area > 0);
  const primary = p.visits.length ? (p.visits.at(-1).site) : 0;
  let area = last ? last.area * 1.12 : (site === primary && p.habits.tobacco.length ? 10 : 0);
  let colour = last ? (last.colour === "white" && p.habits.years > 10 ? "mixed" : last.colour) : "white";
  if (area > 0) {
    // 1.24 compensates for edge pixels the colour mask misses, so the measured area matches the drawn one.
    const r = Math.sqrt(1.24 * area / 100 * (Math.PI * 89.6 * 57.6) / (Math.PI * 1.08));
    const ox = (Math.random() - 0.5) * 36, oy = (Math.random() - 0.5) * 24;
    g.save(); g.translate(160 + ox, 120 + oy); g.scale(1.35, 0.8);
    g.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.2) { const rr = r * (0.9 + 0.12 * Math.sin(a * 3 + site)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = colour === "red" ? "#C2321F" : "#F7F1EA"; g.fill();
    if (colour === "mixed") { g.beginPath(); g.ellipse(r * 0.3, -r * 0.1, r * 0.45, r * 0.5, 0, 0, Math.PI * 2); g.fillStyle = "#C2321F"; g.fill(); }
    g.restore();
  }
  return c;
}
function measure(src) {
  const W = 160, H = 120;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
  const s = Math.max(W / sw, H / sh), dw = sw * s, dh = sh * s;
  g.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const id = g.getImageData(0, 0, W, H), d = id.data;
  // Glare: share of blown-out pixels inside the guide, measured before any correction.
  let glare = 0, gIn = 0, rawSum = 0;
  for (let k = 0; k < d.length; k += 4) rawSum += 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];
  const rawBrightness = rawSum / (W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ex = (x - W / 2) / (W * 0.28), ey = (y - H / 2) / (H * 0.24); if (ex * ex + ey * ey > 1) continue; gIn++; const k = (y * W + x) * 4; if (d[k] > 250 && d[k + 1] > 250 && d[k + 2] > 250) glare++; }
  // Colour constancy: scale each channel so the mucosa outside the guide matches a reference mucosa colour,
  // so photos from different phones and lighting are measured on the same scale.
  const REF = [226, 160, 142];
  let mr = 0, mg = 0, mb = 0, mn = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ex = (x - W / 2) / (W * 0.28), ey = (y - H / 2) / (H * 0.24); if (ex * ex + ey * ey <= 1.3) continue; const k = (y * W + x) * 4; mr += d[k]; mg += d[k + 1]; mb += d[k + 2]; mn++; }
  const gains = mn ? [REF[0] / Math.max(mr / mn, 1), REF[1] / Math.max(mg / mn, 1), REF[2] / Math.max(mb / mn, 1)].map(v => clamp(v, 0.6, 1.7)) : [1, 1, 1];
  for (let k = 0; k < d.length; k += 4) { d[k] = clamp(d[k] * gains[0], 0, 255); d[k + 1] = clamp(d[k + 1] * gains[1], 0, 255); d[k + 2] = clamp(d[k + 2] * gains[2], 0, 255); }
  const gray = new Float32Array(W * H);
  let sum = 0;
  // (brightness and sharpness use the corrected image; the lighting check below uses the raw mean saved earlier)
  for (let k = 0; k < W * H; k++) { const y = 0.299 * d[k * 4] + 0.587 * d[k * 4 + 1] + 0.114 * d[k * 4 + 2]; gray[k] = y; sum += y; }
  const brightness = rawBrightness;
  let lm = 0, lv = 0, n = 0; const lap = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const k = y * W + x; const v = gray[k - 1] + gray[k + 1] + gray[k - W] + gray[k + W] - 4 * gray[k]; lap.push(v); lm += v; n++; }
  lm /= n; for (const v of lap) lv += (v - lm) * (v - lm); lv /= n;
  // Lesion mask inside the guide ellipse: red-dominant or near-white pixels relative to the mucosa.
  let inside = 0, red = 0, white = 0;
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ex = (x - W / 2) / (W * 0.28), ey = (y - H / 2) / (H * 0.24);
    if (ex * ex + ey * ey > 1) continue;
    inside++; const k = (y * W + x) * 4, R = d[k], G = d[k + 1], B = d[k + 2];
    if (R > 120 && R - G > 95 && R - B > 80) { red++; mask[y * W + x] = 2; }
    else if (R > 215 && G > 205 && B > 195 && Math.abs(R - G) < 28) { white++; mask[y * W + x] = 1; }
  }
  const rf = red / inside, wf = white / inside, area = round1((rf + wf) * 100);
  const colour = area < 0.8 ? "none" : rf > wf * 1.5 ? "red" : wf > rf * 4 ? "white" : "mixed";
  const t = document.createElement("canvas"); t.width = 240; t.height = 180; t.getContext("2d").drawImage(src, (240 - sw * Math.max(240 / sw, 180 / sh)) / 2, (180 - sh * Math.max(240 / sw, 180 / sh)) / 2, sw * Math.max(240 / sw, 180 / sh), sh * Math.max(240 / sw, 180 / sh));
  const thumb = t.toDataURL("image/jpeg", 0.72);
  const q = { brightness, sharp: lv, glare: round1(glare / Math.max(gIn, 1) * 100), lightOk: brightness >= 70 && brightness <= 225, focusOk: lv >= 40, gains: gains.map(v => Math.round(v * 100) / 100) };
  q.glareOk = q.glare < 6;
  q.ok = q.lightOk && q.focusOk && q.glareOk;
  return { thumb, q, a: { area, colour, red: rf, white: wf, mask: Array.from(mask), W, H } };
}
function takeShot(src) {
  const shot = measure(src);
  cap.shots[cap.idx] = shot;
  const prev = prevForSite(patient(cap.pid), cap.idx);
  if (prev && prev.thumb) {
    const im = new Image();
    im.onload = () => { try { shot.align = alignScore(im, src); } catch (e) {} render(); };
    im.onerror = () => render();
    im.src = prev.thumb;
  } else render();
}

let lastResult = null;
function analyse() {
  const p = patient(cap.pid);
  const shots = cap.shots.map((s, k) => s ? { ...s, site: k } : null).filter(Boolean);
  const index = shots.reduce((best, s) => (s.a.area > (best?.a.area ?? -1) ? s : best), null);
  const a = index.a;
  // Demo stand-in for the on-device classifier: a colour heuristic. Not a trained model.
  const imageScore = a.area < 0.8 ? 0.08 : clamp(0.2 + Math.min(a.area, 10) / 10 * 0.35 + (a.red / Math.max(a.red + a.white, 1e-6)) * 0.45, 0, 1);
  const risk = habitRisk(p.habits, p.age);
  const composite = round1(imageScore * 10 * 0.6 + risk.score * 0.4);
  let tier = a.area < 0.8 ? "benign" : composite >= 6 ? "refer" : composite >= 3.5 ? "monitor" : "benign";
  const prevSame = [...p.visits].reverse().find(v => v.site === index.site && v.area > 0);
  const tot = (a.red || 0) + (a.white || 0);
  const visit = { id: "v" + Date.now().toString(36), date: Date.now(), site: index.site, area: a.area, colour: a.colour, comp: tot ? { red: round1(a.red / tot * 100) / 100, white: round1(a.white / tot * 100) / 100 } : { red: 0, white: 0 }, tier, note: "", thumb: index.thumb, sitePhotos: Object.fromEntries(shots.filter(x => x.thumb).map(x => [x.site, x.thumb])), synced: false, imageScore: round1(imageScore * 100) / 100, composite };
  p.visits.push(visit);
  const c = prevSame ? change(p) : null;
  if (c && c.escalate && tier !== "refer") { tier = "refer"; visit.escalated = true; }
  visit.tier = tier;
  visit.note = a.area < 0.8 ? "No lesion seen" : c ? (c.delta >= 1 ? `+${Math.round(c.delta)}% growth` : c.delta <= -1 ? `${Math.round(c.delta)}% smaller` : "Stable") + (c.colourUp ? ", colour change" : "") : `${COLOUR_NAME[a.colour]} patch`;
  if (tier === "refer" && !["referred", "reached", "biopsy-due"].includes(p.referral.status)) { p.referral = { status: "flagged", flaggedOn: todayStart() }; p.reviewed = false; }
  else if (tier === "monitor" && ["none", "clear", "monitor"].includes(p.referral.status)) p.referral = { status: "monitor", recheckOn: daysAgo(-28) };
  else if (tier === "benign" && ["none", "clear"].includes(p.referral.status)) p.referral = { status: "clear" };
  p.synced = false;
  S.screenedToday++; S.campSeconds += Math.round((Date.now() - cap.start) / 1000);
  lastResult = { pid: p.id, vid: visit.id, mask: a.mask, W: a.W, H: a.H, imageScore, composite, risk };
  save(); cap = null;
  location.hash = "triage";
}
function viewTriage() {
  if (!lastResult) { location.hash = "capture"; return; }
  const p = patient(lastResult.pid); const v = p.visits.find(x => x.id === lastResult.vid);
  setTab("capture");
  setTop("Screening result", `${esc(p.name)}, ${p.age} · ${esc(SITES[v.site])}`, "#patient-" + p.id);
  const T = TIER[v.tier];
  const c = change(p);
  const sameSite = !!c;
  view.innerHTML = `
    <div class="viewfinder" style="background:var(--mucosa)">${v.thumb ? `<img src="${v.thumb}" alt="Index photo">` : lesionSVG(0, "none")}<canvas id="heat" width="${lastResult.W || 160}" height="${lastResult.H || 120}" aria-hidden="true"></canvas><div class="qchips" style="justify-content:flex-end"><span class="chip plain" style="background:rgb(255 255 255 / 0.9)">Lesion map (demo)</span></div></div>
    <div class="verdict ${T.cls}"><strong>${T.label}</strong><span>${v.escalated ? "Escalated by change detection" : v.colour === "none" ? "No lesion seen" : COLOUR_NAME[v.colour] + " lesion pattern"} · image score ${lastResult.imageScore.toFixed(2)}</span></div>
    <dl class="kv">
      <dt>Lesion area</dt><dd>${v.area}% of guide</dd>
      <dt>Habit risk</dt><dd>${lastResult.risk.score} / 10 · ${esc(p.habits.tobacco.map(t => TOBACCO[t].label).join(", ") || "none")}${p.habits.years ? ", " + p.habits.years + " yrs" : ""}</dd>
      <dt>Mouth opening</dt><dd>${p.habits.mouth} mm</dd>
      <dt>Composite risk</dt><dd>${lastResult.composite} / 10</dd>
      ${sameSite ? `<dt>Since ${fmtDate(c.prev.date)}</dt><dd>${c.delta > 0 ? "+" : ""}${c.delta}% area · ${c.colourUp ? "colour shift" : "same colour"}</dd>` : ""}
    </dl>
    <p class="demo-note">The image score comes from a colour heuristic standing in for the trained on-device model. Composite = 60% image score + 40% habit risk. Triage support only, not a diagnosis.</p>
    <div class="btn-row"><a class="btn primary" href="#result-${p.id}">Show patient their result</a><a class="btn" href="#patient-${p.id}">Open record</a></div>`;
  if (!lastResult.mask) return;
  const cv = $("#heat"), g = cv.getContext("2d"), img = g.createImageData(lastResult.W, lastResult.H);
  lastResult.mask.forEach((m, k) => { if (m) { img.data[k * 4] = 255; img.data[k * 4 + 1] = m === 2 ? 40 : 200; img.data[k * 4 + 2] = 0; img.data[k * 4 + 3] = 120; } });
  g.putImageData(img, 0, 0);
}

/* ---------- patient-facing result + voice ---------- */
const MSG = {
  refer: {
    en: ["See a doctor within 7 days", "We found a patch in your mouth that has changed. Please visit the Government Hospital Chengalpattu dental department within 7 days. It is open on Tuesday and Thursday. Treatment works best when it starts early."],
    ta: ["7 நாட்களுக்குள் மருத்துவரைப் பாருங்கள்", "உங்கள் வாயில் மாற்றம் அடைந்த ஒரு திட்டு உள்ளது. தயவுசெய்து 7 நாட்களுக்குள் செங்கல்பட்டு அரசு மருத்துவமனை பல் பிரிவுக்குச் செல்லுங்கள். செவ்வாய் மற்றும் வியாழன் அன்று திறந்திருக்கும். ஆரம்பத்திலேயே சிகிச்சை பெற்றால் நன்றாக குணமாகும்."],
    hi: ["7 दिनों के अंदर डॉक्टर को दिखाएँ", "आपके मुँह में एक धब्बा है जिसमें बदलाव आया है। कृपया 7 दिनों के अंदर चेंगलपट्टू सरकारी अस्पताल के दंत विभाग में जाएँ। यह मंगलवार और गुरुवार को खुला रहता है। जल्दी इलाज शुरू करने से सबसे अच्छा फ़ायदा होता है।"]
  },
  monitor: {
    en: ["Come back for a check in 4 weeks", "We saw a patch in your mouth that we want to watch. Your health worker will check it again in 4 weeks. Stopping tobacco helps it heal."],
    ta: ["4 வாரங்களில் மீண்டும் பரிசோதனைக்கு வாருங்கள்", "உங்கள் வாயில் கவனிக்க வேண்டிய ஒரு திட்டு உள்ளது. 4 வாரங்களில் உங்கள் சுகாதார ஊழியர் மீண்டும் பரிசோதிப்பார். புகையிலையை நிறுத்தினால் குணமாக உதவும்."],
    hi: ["4 हफ़्ते बाद दोबारा जाँच के लिए आएँ", "आपके मुँह में एक धब्बा है जिस पर नज़र रखनी है। आपकी आशा कार्यकर्ता 4 हफ़्ते बाद फिर जाँच करेंगी। तंबाकू छोड़ने से यह ठीक होने में मदद मिलती है।"]
  },
  benign: {
    en: ["No warning signs today", "We did not see any warning signs today. Come back for your yearly check, or sooner if a patch or sore does not heal in two weeks."],
    ta: ["இன்று எச்சரிக்கை அறிகுறிகள் இல்லை", "இன்று எந்த எச்சரிக்கை அறிகுறிகளும் தெரியவில்லை. ஆண்டுதோறும் பரிசோதனைக்கு வாருங்கள். இரண்டு வாரங்களில் ஆறாத புண் அல்லது திட்டு இருந்தால் முன்னதாகவே வாருங்கள்."],
    hi: ["आज कोई चेतावनी के लक्षण नहीं हैं", "आज कोई चेतावनी के लक्षण नहीं दिखे। हर साल जाँच के लिए आएँ, और अगर कोई छाला या धब्बा दो हफ़्ते में ठीक न हो तो पहले ही आ जाएँ।"]
  }
};
const LANGS = { en: ["English", "en-IN"], ta: ["தமிழ்", "ta-IN"], hi: ["हिन्दी", "hi-IN"] };
let lang = "ta";
function speak(text, code) {
  if (!("speechSynthesis" in window)) { toast("This browser cannot speak. The message is shown on screen."); return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = code; u.rate = 0.92;
    const voice = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(code.slice(0, 2)));
    if (voice) u.voice = voice; else toast("No " + code.slice(0, 2).toUpperCase() + " voice on this device. Using the default voice.");
    speechSynthesis.speak(u);
  } catch (e) { toast("Speech playback was blocked."); }
}
function viewResult(pid) {
  const p = patient(pid); if (!p) { location.hash = "home"; return; }
  setTab("patients");
  const tierRaw = p.visits.at(-1)?.tier || "benign";
  const tier = tierRaw === "stable" ? "monitor" : tierRaw;
  const cls = TIER[tier].cls;
  setTop("Your result", esc(p.name), "#patient-" + p.id, `<select id="lang" aria-label="Language" class="btn" style="min-height:34px;padding:4px 8px">${Object.entries(LANGS).map(([k, [n]]) => `<option value="${k}" ${k === lang ? "selected" : ""}>${n}</option>`).join("")}</select>`);
  const [head, body] = MSG[tier][lang];
  view.innerHTML = `
    <div class="verdict ${cls}" style="text-align:center;padding:20px 14px"><strong style="font-size:22px">${head}</strong><span>Delivered as audio in the patient's language</span></div>
    <button class="btn block primary" id="play">Play spoken explanation</button>
    <p style="margin:0">${body}</p>
    ${tier === "refer" ? `<section class="card sunk"><span class="fine">Referred to</span><h3>${HOSPITAL.name}</h3><p class="fine">${HOSPITAL.dept}</p>
      <div class="btn-row"><a class="btn" href="https://www.google.com/maps/search/?api=1&query=Government+Hospital+Chengalpattu" target="_blank" rel="noopener">Directions</a><button class="btn" id="remind-me">${p.remindMe ? "Reminder set" : "Remind me"}</button></div></section>` : ""}
    <p class="fine">Translations are drafts. Have a native speaker check them before field use.</p>`;
  $("#lang").onchange = e => { lang = e.target.value; viewResult(pid); };
  $("#play").onclick = () => speak(head + ". " + body, LANGS[lang][1]);
  const rm = $("#remind-me"); if (rm) rm.onclick = () => { p.remindMe = true; save(); rm.textContent = "Reminder set"; toast("Voice reminder scheduled for 3 days from now"); };
}

/* ---------- reminders modal ---------- */
function openReminders(list) {
  openModal(`<h3 id="modal-title">Send voice reminders</h3>
    <p class="fine">Each patient gets a call in their language. Feature phones get an IVR call. In this prototype the call is simulated; you can play the message here.</p>
    <div class="rows">${list.map(p => `<div class="row"><div class="grow"><div class="title">${esc(p.name)}</div><div class="meta">${esc(statusLine(p))}</div></div><span class="chip plain">${p.reminders || 0} sent</span></div>`).join("")}</div>
    <button class="btn" id="m-play">Play sample message (Tamil)</button>
    <div class="btn-row"><button class="btn" id="m-cancel">Cancel</button><button class="btn primary" id="m-send">Send ${list.length}</button></div>`);
  $("#m-play").onclick = () => speak(MSG.refer.ta[1], "ta-IN");
  $("#m-cancel").onclick = closeModal;
  $("#m-send").onclick = () => { list.forEach(p => { p.reminders = (p.reminders || 0) + 1; p.synced = false; }); save(); closeModal(); toast(list.length + " reminder" + (list.length > 1 ? "s" : "") + " queued"); render(); };
}
const modalBack = $("#modal-back");
function openModal(html) { $("#modal").innerHTML = html; modalBack.classList.add("open"); $("#modal").querySelector("button")?.focus(); }
function closeModal() { modalBack.classList.remove("open"); try { speechSynthesis.cancel(); } catch (e) {} }
modalBack.addEventListener("click", e => { if (e.target === modalBack) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }

/* ---------- camp mode ---------- */
let campToken = null;
function viewCamp() {
  setTab("camp");
  setTop("Camp · Melmaruvathur", fmtDate(Date.now()), "", `<span class="chip ${navigator.onLine ? "ok" : "watch"}">${navigator.onLine ? "Online" : "Offline"}</span>`);
  const avg = S.screenedToday ? Math.round(S.campSeconds / S.screenedToday) : 0;
  const nextToken = Math.max(63, ...S.queue.map(q => q.token)) + 1;
  view.innerHTML = `
    <div class="tiles" style="grid-template-columns:1fr 1fr"><div class="tile"><div class="label">Screened today</div><div class="value">${S.screenedToday}</div></div><div class="tile"><div class="label">Avg time</div><div class="value">${avg} s</div></div></div>
    <section class="card"><h3>Waiting</h3><div class="rows">${S.queue.map(q => `<div class="row"><div class="grow"><div class="title">Token ${q.token} · ${esc(q.name)}</div></div><span class="chip ${q.kind === "New" ? "plain" : "watch"}">${q.kind}</span></div>`).join("") || `<p class="fine">Queue is empty.</p>`}</div>
      <button class="btn primary block" id="next-p" ${S.queue.length ? "" : "disabled"}>Start next screening</button></section>
    <form class="card" id="add-q"><h3>Add to queue</h3><div class="field"><label for="q-name">Name</label><input type="text" id="q-name" placeholder="Token ${nextToken}" autocomplete="off"></div>
      <div class="btn-row"><button class="btn" type="submit" data-k="New">Add new patient</button><button class="btn" type="submit" data-k="Recheck">Add recheck</button></div></form>`;
  $("#next-p").onclick = () => {
    const q = S.queue[0];
    const existing = q.pid ? patient(q.pid) : S.patients.find(p => p.name.toLowerCase() === q.name.toLowerCase());
    if (existing) { S.queue.shift(); save(); location.hash = "capture-" + existing.id; }
    else { campToken = q.token; draft = null; viewIntakeName = q.name; location.hash = "intake"; }
  };
  $("#add-q").onsubmit = e => { e.preventDefault(); const n = $("#q-name").value.trim(); if (!n) { $("#q-name").focus(); return; } S.queue.push({ token: nextToken, name: n, kind: e.submitter?.dataset.k || "New" }); save(); render(); };
}
let viewIntakeName = "";

/* ---------- today's worklist ---------- */
function worklist() {
  const items = [];
  const t = todayStart();
  S.patients.forEach(p => {
    const r = p.referral, st = statusOf(p).key, risk = habitRisk(p.habits, p.age).score;
    if (st === "overdue") { const d = daysBetween(r.referredOn, t); items.push({ p, score: 60 + Math.min(d, 30) + risk, why: `Referral ${d} days old, not reached. Call or visit and arrange transport.`, kind: "Overdue referral", cls: "urgent" }); }
    else if (st === "flagged") items.push({ p, score: 55 + risk, why: "New urgent flag. Explain the result and confirm the hospital visit.", kind: "New referral", cls: "urgent" });
    else if (st === "biopsy-due") items.push({ p, score: 50 + risk, why: "Specialist asked for a biopsy. Confirm the appointment.", kind: "Biopsy call", cls: "info" });
    else if (r.status === "monitor" && r.recheckOn) { const d = daysBetween(t, r.recheckOn); if (d <= 7) items.push({ p, score: 30 + (7 - d) * 2 + risk, why: d < 0 ? `Recheck was due ${-d} days ago. Capture a follow-up photo.` : d === 0 ? "Recheck due today. Capture a follow-up photo." : `Recheck due in ${d} days. Capture a follow-up photo.`, kind: "Recheck", cls: "watch" }); }
    else if (!p.visits.length) items.push({ p, score: 20 + risk, why: "Registered but not screened yet.", kind: "First screening", cls: "plain" });
  });
  return items.sort((a, b) => b.score - a.score);
}
function viewToday() {
  setTab("home");
  const items = worklist();
  setTop("Today's visits", items.length + " patients, highest priority first", "#home");
  view.innerHTML = `<section class="card"><div class="rows">${items.map((it, i) => `
    <a class="row" href="#patient-${it.p.id}"><div class="prio chip ${it.cls}" aria-label="Priority ${i + 1}">${i + 1}</div>
      <div class="grow"><div class="title">${esc(it.p.name)}, ${it.p.age} · <span class="meta">${esc(it.p.village)}</span></div><div class="meta">${esc(it.why)}</div></div>
      <span class="chip ${it.cls}">${it.kind}</span></a>`).join("") || `<p class="fine">No visits due today.</p>`}</div></section>
    <p class="fine">Order: overdue referrals first (older and higher habit risk rank higher), then new flags, biopsy calls, and rechecks due within 7 days.</p>`;
}

/* ---------- villages ---------- */
function viewVillages() {
  setTab("home");
  setTop("Follow-up by village", "Where referrals are getting stuck", "#home");
  const by = {};
  S.patients.forEach(p => { const v = (by[p.village] ||= { n: 0, overdue: 0, open: 0, reached: 0, flagged: 0 }); v.n++; const st = statusOf(p).key; if (p.referral.flaggedOn) v.flagged++; if (p.referral.reachedOn) v.reached++; if (st === "overdue") v.overdue++; else if (["flagged", "referred"].includes(st)) v.open++; });
  const rows = Object.entries(by).sort((a, b) => b[1].overdue - a[1].overdue || b[1].open - a[1].open || b[1].n - a[1].n);
  const maxN = Math.max(...rows.map(r => r[1].flagged), 1);
  view.innerHTML = `<section class="card"><h3>Flagged patients per village</h3>
    <div class="legend"><span><i style="background:var(--urgent)"></i>Overdue</span><span><i style="background:var(--watch)"></i>Open, within 7 days</span><span><i style="background:var(--ok)"></i>Reached hospital</span></div>
    <div>${rows.map(([name, v]) => `<div class="vbar"><span>${esc(name)}</span>
      <div class="stack" style="width:${v.flagged / maxN * 100}%;min-width:${v.flagged ? 8 : 0}px" role="img" aria-label="${v.overdue} overdue, ${v.open} open, ${v.reached} reached">
        <span style="flex:${v.overdue};background:var(--urgent)"></span><span style="flex:${v.open};background:var(--watch)"></span><span style="flex:${v.reached};background:var(--ok)"></span></div>
      <span class="num fine">${v.reached}/${v.flagged} reached</span></div>`).join("")}</div></section>
    <section class="card"><h3>Screening coverage</h3><dl class="kv">${rows.map(([name, v]) => `<dt>${esc(name)}</dt><dd>${v.n} screened · ${v.flagged} flagged</dd>`).join("")}</dl></section>
    <p class="fine">A village with several overdue referrals may need transport support or a camp visit by the PHC team.</p>`;
}

/* ---------- specialist review ---------- */
function viewReview() {
  setTab("home");
  const list = S.patients.filter(p => !p.reviewed && p.visits.at(-1)?.tier === "refer");
  setTop("Review queue", "Specialist · Chengalpattu", "#home", `<span class="chip ${list.length ? "urgent" : "ok"}">${list.length} urgent</span>`);
  view.innerHTML = list.map(p => {
    const v = p.visits.at(-1), c = change(p), r = habitRisk(p.habits, p.age);
    return `<section class="card">
      <figure style="margin:0;position:relative">${visitPic(v)}<span class="chip plain" style="position:absolute;left:8px;bottom:8px;background:rgb(255 255 255 / 0.9)">Site ${v.site + 1} · ${fmtDate(v.date)}</span></figure>
      <div><h3>${esc(p.name)}, ${p.age} · ${esc(p.village)}</h3><p class="fine">Flagged by ASHA Kavitha R</p></div>
      <dl class="kv"><dt>Model tier</dt><dd style="color:var(--urgent)">Refer urgently</dd>
        ${c ? `<dt>Growth</dt><dd>${c.delta > 0 ? "+" : ""}${c.delta}% in ${Math.round(c.weeks)} wk</dd><dt>Colour</dt><dd>${COLOUR_NAME[c.prev.colour]} to ${COLOUR_NAME[c.cur.colour].toLowerCase()}</dd>` : `<dt>Colour</dt><dd>${COLOUR_NAME[v.colour]}</dd>`}
        <dt>Habit risk</dt><dd>${r.score} / 10</dd></dl>
      <div class="btn-row"><button class="btn danger" data-biopsy="${p.id}">Call for biopsy</button><button class="btn" data-recheck="${p.id}">Recheck 4 wk</button></div>
      <a class="fine" href="#patient-${p.id}">Open full record</a>
    </section>`;
  }).join("") || `<section class="card"><h3>Queue is clear</h3><p class="fine">Every urgent case has a decision.</p></section>`;
  view.querySelectorAll("[data-biopsy]").forEach(b => b.onclick = () => { const p = patient(b.dataset.biopsy); p.reviewed = true; p.referral = Object.assign(p.referral, { status: "biopsy-due", referredOn: p.referral.referredOn || todayStart(), reachedOn: p.referral.reachedOn || todayStart(), biopsyCalledOn: todayStart() }); p.synced = false; save(); toast(p.name + " called for biopsy"); render(); });
  view.querySelectorAll("[data-recheck]").forEach(b => b.onclick = () => { const p = patient(b.dataset.recheck); p.reviewed = true; p.referral = { status: "monitor", recheckOn: daysAgo(-28), flaggedOn: p.referral.flaggedOn }; p.synced = false; save(); toast(p.name + " set to recheck in 4 weeks"); render(); });
}

/* ---------- sync ---------- */
function viewSync() {
  setTab("sync");
  setTop("Sync", "Offline-first data");
  const visits = S.patients.flatMap(p => p.visits.map(v => ({ v, p })));
  const pendV = visits.filter(x => !x.v.synced);
  const pendImg = pendV.filter(x => x.v.thumb);
  const pendP = S.patients.filter(p => !p.synced);
  const bytes = pendImg.reduce((s, x) => s + x.v.thumb.length * 0.75, 0) + pendV.length * 600;
  const online = navigator.onLine;
  const ago = S.lastSync ? daysBetween(S.lastSync, todayStart()) : null;
  view.innerHTML = `
    <div class="verdict ${online ? "ok" : "watch"}"><strong>${online ? "Connected" : "No connection"}</strong><span>All screening works offline</span></div>
    <dl class="kv card">
      <dt>Visits queued</dt><dd>${pendV.length}</dd>
      <dt>Images pending</dt><dd>${pendImg.length}</dd>
      <dt>Patient records changed</dt><dd>${pendP.length}</dd>
      <dt>Queue size</dt><dd>${bytes > 1e6 ? round1(bytes / 1e6) + " MB" : Math.round(bytes / 1e3) + " KB"}</dd>
      <dt>Last sync</dt><dd>${ago === null ? "Never" : ago === 0 ? "Today" : ago + " day" + (ago > 1 ? "s" : "") + " ago"}</dd>
      <dt>Model</dt><dd>MobileNetV3-Small <span class="chip watch" style="margin-left:4px">Not loaded</span></dd>
      <dt>Scoring now</dt><dd>Colour heuristic (demo)</dd>
    </dl>
    <div class="progress" aria-hidden="true"><div id="bar"></div></div>
    <button class="btn primary block" id="sync-now" ${pendV.length + pendP.length ? "" : "disabled"}>Sync now</button>
    <p class="fine">Only de-identified records leave the phone: no names, ABHA numbers or photos unless the PHC asks for a specialist review. This prototype has no server, so sync is simulated.</p>
    <section class="card sunk"><h3>Demo data</h3><p class="fine">Data stays in this browser. Reset restores the ten demo patients.</p><button class="btn" id="reset">Reset demo data</button></section>`;
  $("#sync-now").onclick = () => {
    if (!navigator.onLine) { toast("No connection. Records stay queued and upload when a network is found."); return; }
    const bar = $("#bar"); let w = 0; $("#sync-now").disabled = true;
    const t = setInterval(() => { w += 20; bar.style.width = w + "%"; if (w >= 100) { clearInterval(t); S.patients.forEach(p => { p.synced = true; p.visits.forEach(v => v.synced = true); }); S.lastSync = Date.now(); save(); toast("Synced " + pendV.length + " visits"); render(); } }, 180);
  };
  $("#reset").onclick = () => {
    openModal(`<h3 id="modal-title">Reset demo data?</h3><p class="fine">This removes patients and visits you added and restores the demo patients.</p><div class="btn-row"><button class="btn" id="m-no">Cancel</button><button class="btn danger" id="m-yes">Reset</button></div>`);
    $("#m-no").onclick = closeModal;
    $("#m-yes").onclick = () => { S = seed(); save(); cap = null; lastResult = null; closeModal(); toast("Demo data restored"); location.hash = "home"; render(); };
  };
}

/* ---------- router ---------- */
function render() {
  const h = (location.hash || "#home").slice(1);
  let m;
  if (h === "home" || h === "") viewHome();
  else if (h === "patients") viewPatients();
  else if ((m = h.match(/^patient-(p[\w]+)$/))) viewPatient(m[1]);
  else if (h === "intake") { const n = viewIntakeName; viewIntakeName = ""; viewIntake(n); }
  else if (h === "capture") viewCapturePick();
  else if ((m = h.match(/^capture-(p[\w]+)$/))) viewCapture(m[1]);
  else if (h === "triage") viewTriage();
  else if ((m = h.match(/^result-(p[\w]+)$/))) viewResult(m[1]);
  else if (h === "camp") viewCamp();
  else if (h === "review") viewReview();
  else if (h === "today") viewToday();
  else if (h === "villages") viewVillages();
  else if (h === "sync") viewSync();
  else viewHome();
  document.body.classList.toggle("is-offline", !navigator.onLine);
  updateFloats();
  const ck = $("#clock"); if (ck) { const d = new Date(); ck.textContent = d.getHours() % 12 + (d.getHours() % 12 === 0 ? 12 : 0) + ":" + String(d.getMinutes()).padStart(2, "0"); }
}
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#capture-")) stopLive(); if (location.hash !== "#intake") draft = null; render(); view.scrollTop = 0; window.scrollTo(0, 0); });
window.addEventListener("online", render);
window.addEventListener("offline", render);
try { speechSynthesis.getVoices(); } catch (e) {}
loadRealRefs();
render();
