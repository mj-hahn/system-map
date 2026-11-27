import { jsxs as m, jsx as l, Fragment as U } from "react/jsx-runtime";
import { SearchInput as H, Badge as we, Modal as ye, Input as Re, Btn as A } from "@kirocrew/app-sdk/ui";
import { useState as g, useCallback as _, useEffect as x, useRef as W } from "react";
import { useAppApi as $, useTheme as Oe } from "@kirocrew/app-sdk";
const le = "system-map-chrome-css", Pe = `
.sm-page { padding: 0 16px; }
@media (min-width: 768px) { .sm-page { padding: 0 24px; } }
.sm-plain { background: none; border: 0; margin: 0; padding: 0; color: inherit; font: inherit; cursor: pointer; }
.sm-plain:disabled { cursor: default; opacity: .6; }
.sm-plain:focus-visible, .sm-focus:focus-visible { outline: 2px solid var(--accent, #2f7d5c); outline-offset: 2px; }
.sm-project { display: inline-flex; align-items: center; gap: 6px; min-width: 0; padding: 2px 8px; margin-left: -2px; border-radius: 8px; }
.sm-project:hover, .sm-project[aria-expanded="true"] { background: var(--bg-hover, #f4f4f5); }
.sm-project.sm-compact { font-size: 13px; font-weight: 600; padding: 3px 6px; margin-left: -6px; max-width: 100%; }
.sm-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.sm-pop {
  position: absolute; z-index: 60; box-sizing: border-box; padding: 6px; border-radius: 10px; outline: none;
  background: var(--bg-elevated, #fff); color: var(--text, #18181b); border: 1px solid var(--border-strong, #a1a1aa);
  box-shadow: 0 10px 28px rgba(0, 0, 0, .22); font-size: 13px; font-weight: 400; letter-spacing: normal; line-height: 1.35;
}
.sm-list { list-style: none; margin: 6px 0 0; padding: 0; max-height: 260px; overflow-y: auto; }
.sm-row { display: flex; align-items: center; gap: 8px; box-sizing: border-box; width: 100%; padding: 7px 9px; border-radius: 6px; text-align: left; font-size: 13px; cursor: pointer; }
.sm-row:hover, .sm-row[data-active="true"] { background: var(--bg-hover, #f4f4f5); }
.sm-row[aria-selected="true"] { background: var(--accent-subtle, rgba(47, 125, 92, .18)); }
.sm-rule { height: 1px; margin: 6px 2px; background: var(--border, #e4e4e7); }
.sm-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--muted, #71717a); }
.sm-dot[data-tone="ok"] { background: var(--ok, #16a34a); }
.sm-dot[data-tone="warn"] { background: var(--warn, #d97706); }
.sm-dot[data-tone="err"] { background: var(--danger, #dc2626); }
.sm-bar { display: flex; align-items: stretch; gap: 16px; border-bottom: 1px solid var(--border, #e4e4e7); min-height: 34px; }
.sm-tabs { display: flex; gap: 16px; align-items: stretch; min-width: 0; }
.sm-tab { display: inline-flex; align-items: center; gap: 5px; padding: 6px 1px 5px; margin-bottom: -1px; font-size: 13px; color: var(--muted, #71717a); border-bottom: 2px solid transparent; white-space: nowrap; }
.sm-tab:hover { color: var(--text, #18181b); }
.sm-tab[aria-selected="true"] { color: var(--text-strong, var(--text, #18181b)); font-weight: 600; border-bottom-color: var(--accent, #2f7d5c); }
.sm-tab-probe { position: absolute; visibility: hidden; height: 0; overflow: hidden; display: flex; gap: 16px; pointer-events: none; }
.sm-tab-probe .sm-tab { font-weight: 600; }
.sm-count { display: inline-block; min-width: 8px; padding: 0 5px; border-radius: 9px; font-size: 11px; font-weight: 500; text-align: center; background: var(--bg-hover, #f4f4f5); color: var(--muted, #71717a); }
.sm-chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 1px solid var(--border, #e4e4e7); border-radius: 14px; background: var(--card, #fff); color: var(--text, #18181b); font-size: 13px; white-space: nowrap; }
.sm-chip:hover, .sm-chip[aria-expanded="true"] { border-color: var(--border-strong, #a1a1aa); }
.sm-tools { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.sm-layers { display: flex; align-items: center; gap: 3px; padding: 3px 4px; border: 1px solid var(--border, #e4e4e7); border-radius: 8px; background: var(--bg-elevated, #fff); color: var(--text, #18181b); font-size: 12px; }
.sm-layers-label { padding: 0 5px; color: var(--muted, #71717a); }
.sm-layer { padding: 3px 8px; border-radius: 6px; color: var(--muted, #71717a); white-space: nowrap; }
.sm-layer:hover { background: var(--bg-hover, #f4f4f5); }
.sm-layer[aria-pressed="true"] { background: var(--accent-subtle, rgba(47, 125, 92, .18)); color: var(--text, #18181b); }
.sm-layer:disabled, .sm-layer:disabled:hover { background: none; color: var(--muted, #71717a); opacity: .5; cursor: default; }
.sm-tool-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.sm-show-list { padding: 5px 10px; white-space: nowrap; color: var(--muted, #71717a); }
.sm-show-list:hover { color: var(--text, #18181b); border-color: var(--border-strong, #a1a1aa); }
.sm-list-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.sm-hide-list { padding: 1px 6px; border-radius: 6px; font-size: 12px; color: var(--muted, #71717a); }
.sm-hide-list:hover { background: var(--bg-hover, #f4f4f5); color: var(--text, #18181b); }
.sm-notice { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid var(--border, #e4e4e7); border-radius: 8px; background: var(--bg-elevated, #fff); color: var(--text, #18181b); font-size: 13px; }
.sm-manage { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.sm-manage-row { padding: 10px 12px; border: 1px solid var(--border, #e4e4e7); border-radius: 8px; font-size: 13px; }
.sm-mono { font-family: var(--mono, ui-monospace, Menlo, monospace); font-size: 12px; }
.sm-link { color: var(--accent, #2f7d5c); font-size: 13px; white-space: nowrap; }
.sm-link:hover { text-decoration: underline; }
.sm-add-list { max-height: min(340px, 46vh); margin: 0; }
.sm-add-head { padding: 8px 9px 2px; font-size: 12px; color: var(--muted, #71717a); }
.sm-row[aria-disabled="true"] { cursor: default; opacity: .6; }
.sm-row-action { display: none; color: var(--accent, #2f7d5c); font-weight: 600; white-space: nowrap; }
.sm-row[data-active="true"] .sm-row-action { display: inline; }
.sm-swatch { display: inline-flex; flex: none; width: 30px; height: 14px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-strong, #a1a1aa); }
.sm-swatch i { flex: 1; }
.sm-row[aria-checked="true"] { font-weight: 600; }
.sm-check { margin-left: auto; color: var(--accent, #2f7d5c); }
.sm-add-empty { display: grid; justify-items: center; gap: 10px; padding: 24px 12px; text-align: center; font-weight: 600; }
`;
if (!document.getElementById(le)) {
  const e = document.createElement("style");
  e.id = le, e.textContent = Pe, document.head.appendChild(e);
}
const Fe = /^API (\d{3}): ([\s\S]*)$/;
function Be(e) {
  const t = e ?? {};
  if (typeof t.status == "number") return { status: t.status, body: t.body ?? "" };
  const r = Fe.exec(typeof t.message == "string" ? t.message : "");
  return r ? { status: Number(r[1]), body: r[2] } : { status: null, body: "" };
}
function Ue(e) {
  try {
    const t = JSON.parse(e);
    return typeof t.error == "string" && t.error ? t.error : null;
  } catch {
    return null;
  }
}
function j(e, t) {
  const { status: r, body: s } = Be(e);
  if (r === null) return `Couldn't ${t}. Check the dashboard is still connected, then try again.`;
  if (r === 400 || r === 404 || r === 500) {
    const a = Ue(s);
    if (a) return a;
  }
  return r === 401 || r === 403 ? `Couldn't ${t}, because System Map isn't allowed to. Check its permissions on its Details page.` : r >= 500 ? `Couldn't ${t}, because System Map's backend isn't answering. Try again in a moment.` : `Couldn't ${t}. Try again.`;
}
const k = "/apps/system-map/api";
function O(e, t) {
  return t ? `${k}${e}${e.includes("?") ? "&" : "?"}repo=${encodeURIComponent(t)}` : `${k}${e}`;
}
const q = "system-map.repo", Q = "system-map:project";
function Mt() {
  var f, u;
  const e = $(), [t, r] = g([]), [s, a] = g(!1), [n, c] = g(() => localStorage.getItem(q)), i = _(async () => {
    try {
      const p = await e.get(`${k}/repos`);
      r(p.repos);
    } catch {
      r([]);
    } finally {
      a(!0);
    }
  }, [e]);
  x(() => {
    i();
  }, [i]), x(() => {
    const p = () => {
      c(localStorage.getItem(q)), i();
    };
    return window.addEventListener(Q, p), () => window.removeEventListener(Q, p);
  }, [i]);
  const o = _((p) => {
    localStorage.setItem(q, p), window.dispatchEvent(new Event(Q));
  }, []), d = ((f = t.find((p) => p.repo_key === n)) == null ? void 0 : f.repo_key) ?? ((u = t[0]) == null ? void 0 : u.repo_key) ?? null;
  return { repos: t, active: d, loaded: s, choose: o, reload: i };
}
function zt(e) {
  const t = $(), [r, s] = g(null), [a, n] = g(null), c = W(e);
  c.current = e;
  const i = _(async () => {
    if (!e) {
      s(null);
      return;
    }
    try {
      const o = await t.get(O("/overview", e));
      if (c.current !== e) return;
      s(o), n(null);
    } catch (o) {
      if (c.current !== e) return;
      s(null), n(j(o, "load this project"));
    }
  }, [t, e]);
  return x(() => {
    n(null), i();
  }, [i]), { overview: (r == null ? void 0 : r.manifest.repo_key) === e ? r : null, error: a, refresh: i };
}
function Rt(e, t, r) {
  const s = $(), [a, n] = g({ repo: t, value: null, failed: !1 });
  return x(() => {
    if (!r) return;
    let c = !0;
    return s.get(O(e, t)).then((i) => {
      c && n({ repo: t, value: i, failed: !1 });
    }).catch(() => {
      c && n({ repo: t, value: null, failed: !0 });
    }), () => {
      c = !1;
    };
  }, [s, e, t, r]), a.repo === t ? { value: a.value, failed: a.failed } : { value: null, failed: !1 };
}
function Ot(e, t, r) {
  const s = $(), [a, n] = g(null);
  return x(() => {
    if (!e) {
      n(null);
      return;
    }
    let c = !0;
    return s.get(O(`/proposal?id=${encodeURIComponent(e)}`, t)).then((i) => {
      c && n(i);
    }).catch(() => {
      c && n(null);
    }), () => {
      c = !1;
    };
  }, [s, e, t, r]), a;
}
function Pt(e, t, r) {
  const s = $(), [a, n] = g({ repo: t, value: null, failed: !1 }), [c, i] = g(null), o = W(t);
  o.current = t;
  const d = _(async () => {
    if (!t) return null;
    try {
      const u = await s.get(O(e, t));
      return o.current !== t ? null : (n({ repo: t, value: u, failed: !1 }), i(Date.now()), u);
    } catch {
      return o.current === t && n({ repo: t, value: null, failed: !0 }), null;
    }
  }, [s, e, t]);
  x(() => {
    d();
    const u = window.setInterval(() => {
      document.visibilityState === "visible" && d();
    }, r);
    return () => window.clearInterval(u);
  }, [d, r]);
  const f = a.repo === t;
  return { value: f ? a.value : null, failed: f && a.failed, checkedAt: c, refresh: d };
}
function Ft(e, t = null, r) {
  const s = $(), [a, n] = g(null);
  return x(() => {
    if (!e) {
      n(null);
      return;
    }
    let c = !0;
    return s.get(O(`/node?id=${encodeURIComponent(e)}`, t)).then((i) => {
      c && n(i);
    }).catch(() => {
      c && n(null);
    }), () => {
      c = !1;
    };
  }, [s, e, t, r]), a;
}
const Bt = 200, Ut = 58, ve = /* @__PURE__ */ new Set(["starts", "hands_off_to", "uses_model"]), He = /* @__PURE__ */ new Set(["planned", "partial"]), ne = "group:tables", I = "group:routes", T = "group:jobs", R = (e, t, r) => `${e} ${e === 1 ? t : r}`;
function de(e) {
  const t = e.files ?? 0, r = e.test_files ?? 0;
  return t === 0 && r > 0 ? { count: r, title: R(r, "test file", "test files") } : { count: t, title: R(t, "file", "files") };
}
function ce(e) {
  const t = e.files ?? 0, r = e.test_files ?? 0;
  return t === 0 && r > 0 ? R(r, "test file", "test files") : `${R(t, "file", "files")}, ${R(e.lines ?? 0, "line", "lines")}`;
}
function B(e) {
  return e === "." ? "root files" : e.replace(/^src\//, "");
}
const Ke = {
  "@openai/agents": "OpenAI Agents",
  "@mastra/core": "Mastra",
  "@anthropic-ai/claude-agent-sdk": "Claude Agent SDK"
};
function Ve(e) {
  var r;
  if (e.source === "sdk" && e.sdk) return Ke[e.sdk] ?? e.sdk;
  const t = ((r = e.jobs) == null ? void 0 : r.length) ?? 0;
  return `${t} ${t === 1 ? "job" : "jobs"}`;
}
function Z(e) {
  var t;
  if (e.status === "proposed")
    return { id: e.id, kind: e.kind, title: e.kind === "module" ? e.name : B(e.path ?? e.name), subtitle: "proposed", status: "proposed" };
  switch (e.kind) {
    case "area":
      return { id: e.id, kind: "area", title: B(e.path ?? e.name), subtitle: ce(e) };
    case "module": {
      const r = e.area === `area:${e.path}`;
      return {
        id: e.id,
        kind: "module",
        title: r ? `${e.name} (top level)` : e.name,
        subtitle: ce(e)
      };
    }
    case "plan":
      return { id: e.id, kind: "plan", title: e.name, subtitle: `${e.missing} of ${(e.found ?? 0) + (e.missing ?? 0)} missing`, status: e.status };
    case "route":
      return { id: e.id, kind: "route", title: e.name, subtitle: e.route_kind === "api" ? "API" : "page" };
    case "job":
      return { id: e.id, kind: "job", title: e.name, subtitle: e.schedule };
    case "service":
      return { id: e.id, kind: "service", title: e.name, subtitle: "outside" };
    case "agent":
      return {
        id: e.id,
        kind: "agent",
        title: e.label ?? e.name,
        subtitle: Ve(e),
        status: e.status === "built" ? void 0 : e.status,
        badge: (t = e.asks_you) != null && t.length ? "asks you" : void 0
      };
    default:
      return { id: e.id, kind: e.kind, title: e.name };
  }
}
function K(e, t) {
  const r = e.nodes.filter((c) => c.kind === "route"), s = r.filter((c) => c.route_kind === "api").length, a = e.nodes.filter((c) => c.kind === "job").length, n = [];
  return r.length && n.push({ id: I, kind: "group", title: "Routes", subtitle: `${r.length - s} pages, ${s} API` }), t && n.push({ id: ne, kind: "group", title: "Database", subtitle: `${t} ${t === 1 ? "table" : "tables"}` }), a && n.push({ id: T, kind: "group", title: "Scheduled jobs", subtitle: `${a} jobs` }), n;
}
function Ge(e) {
  return { id: e, kind: "table", title: e.replace(/^table:(public\.)?/, "") };
}
const Ye = 3, qe = 24;
function xe(e, t) {
  return !!(e && t && (e === t || e.startsWith(`${t}/`)));
}
function ue(e, t) {
  if (e.startsWith("table:")) return ne;
  const r = t.byId.get(e);
  return r ? r.status === "proposed" ? e : (r.kind === "module" || r.kind === "area") && xe(r.path, t.routesDir) ? I : r.kind === "module" ? r.area === t.open ? e : r.area ?? e : r.kind === "route" ? t.expanded === I ? e : I : r.kind === "job" ? t.expanded === T ? e : T : e : null;
}
function ke(e, t) {
  return (e == null ? void 0 : e.kind) === "plan" && (!t || !He.has(e.status));
}
function re(e, t, r, s) {
  const a = /* @__PURE__ */ new Map();
  for (const n of e.edges) {
    if (ke(t.byId.get(n.source), r)) continue;
    const c = ue(n.source, t), i = ue(n.target, t);
    if (!c || !i || c === i || !s(c, i)) continue;
    const o = `${c}|${i}|${n.kind}`, d = a.get(o);
    d ? d.count += n.count : a.set(o, { id: o, source: c, target: i, kind: n.kind, count: n.count, proposed: n.proposed });
  }
  return [...a.values()];
}
function P(e, t, r) {
  const s = [];
  for (const a of e) {
    const n = r.find((i) => i.id === a), c = t.byId.get(a);
    n ? s.push(n) : c ? s.push(Z(c)) : a.startsWith("table:") && s.push(Ge(a));
  }
  return s;
}
function Qe(e, t, r, s) {
  const a = K(e, r), n = re(e, t, s, () => !0), c = n.length <= qe ? n : n.filter((o) => o.kind !== "imports" || o.count >= Ye), i = new Set(a.map((o) => o.id));
  for (const o of e.nodes)
    o.kind === "area" && !xe(o.path, t.routesDir) && i.add(o.id), o.kind === "service" && i.add(o.id), o.kind === "plan" && !ke(o, s) && i.add(o.id), o.status === "proposed" && i.add(o.id);
  return { cards: P(i, t, a), lines: c.filter((o) => i.has(o.source) && i.has(o.target)), hidden: n.length - c.length };
}
function Je(e, t, r, s) {
  const a = new Set(e.nodes.filter((i) => i.area === t.open && i.kind === "module").map((i) => i.id)), n = re(
    e,
    t,
    s,
    (i, o) => (a.has(i) || a.has(o)) && !i.startsWith("area:") && !o.startsWith("area:")
  ), c = new Set(a);
  for (const i of n)
    c.add(i.source), c.add(i.target);
  return { cards: P(c, t, K(e, r)), lines: n };
}
function Xe(e, t, r, s) {
  const a = t.expanded === I ? "route" : "job", n = new Set(e.nodes.filter((o) => o.kind === a).map((o) => o.id)), c = re(e, t, s, (o, d) => n.has(o) || n.has(d)), i = new Set(n);
  for (const o of c)
    i.add(o.source), i.add(o.target);
  return { cards: P(i, t, K(e, r)), lines: c };
}
function Ze(e, t, r) {
  const s = [], a = /* @__PURE__ */ new Set([r]);
  for (const n of e.edges)
    n.source !== r && n.target !== r || (a.add(n.source), a.add(n.target), s.push({ id: `${n.source}|${n.target}|${n.kind}`, source: n.source, target: n.target, kind: n.kind, count: n.count }));
  return { cards: P(a, t, []), lines: s };
}
function Ht(e, t, r) {
  const s = new Map(e.nodes.map((i) => [i.id, i])), a = new Set(t), n = /* @__PURE__ */ new Map();
  for (const i of e.edges) {
    if (!a.has(i.source) || !a.has(i.target)) continue;
    const o = `${i.source}|${i.target}|${i.kind}`;
    n.set(o, { id: o, source: i.source, target: i.target, kind: i.kind, count: i.count, proposed: i.proposed });
  }
  return { cards: P(a, { byId: s }, K(e, r)), lines: [...n.values()] };
}
function Se(e) {
  if (e.routes_dir) return e.routes_dir;
  const t = e.nodes.find((s) => s.kind === "route"), r = t == null ? void 0 : t.evidence[0];
  return r ? r.slice(0, r.lastIndexOf("/")) : null;
}
function et(e) {
  const t = new Set(e.nodes.filter((s) => s.kind === "agent").map((s) => s.id));
  if (t.size === 0) return e;
  const r = (s) => !ve.has(s.kind) && !t.has(s.source) && !t.has(s.target);
  return { ...e, nodes: e.nodes.filter((s) => !t.has(s.id)), edges: e.edges.filter(r) };
}
function tt(e, t) {
  return e.trim().toLowerCase() === t.trim().toLowerCase();
}
function nt(e) {
  const t = new Map(e.nodes.map((d) => [d.id, d])), r = e.nodes.filter((d) => d.kind === "agent").map((d) => d.id), s = new Set(r), a = /* @__PURE__ */ new Map();
  for (const d of e.edges) {
    if (!ve.has(d.kind) || !(t.has(d.source) && t.has(d.target)) || !r.includes(d.source) && !r.includes(d.target)) continue;
    s.add(d.source), s.add(d.target);
    const f = `${d.source}|${d.target}|${d.kind}`, u = a.get(f);
    u ? u.count += d.count : a.set(f, { id: f, source: d.source, target: d.target, kind: d.kind, count: d.count, leaves: d.leaves_region || void 0 });
  }
  const n = e.home_region ?? null, c = /* @__PURE__ */ new Map(), i = [...s].map((d) => {
    const f = t.get(d);
    if (f.kind !== "service") return Z(f);
    if (f.region) {
      const u = f.region.trim().toLowerCase(), p = c.get(u) ?? { region: f.region.trim(), members: [] };
      c.set(u, { ...p, members: [...p.members, d] });
    }
    return { ...Z(f), subtitle: f.region ?? "no region set", strong: !0 };
  }), o = [...c].map(([d, { region: f, members: u }]) => {
    const p = n ? tt(f, n) ? "home" : "away" : "unknown";
    return { id: `band:${d}`, label: p === "home" ? `${f} · home` : f, tone: p, members: u };
  });
  return { cards: i, lines: [...a.values()], bands: o };
}
function Kt(e, t, r, s, a = !1) {
  if (a) return nt(e);
  e = et(e);
  const n = new Map(e.nodes.map((u) => [u.id, u])), c = Se(e), i = t === `area:${c}` ? I : t, o = i != null && i.startsWith("area:") ? i : null, d = i === I || i === T ? i : null, f = { byId: n, open: o, expanded: d, routesDir: c };
  return i ? o ? Je(e, f, r, s) : d ? Xe(e, f, r, s) : Ze(e, f, i) : Qe(e, f, r, s);
}
function Vt(e, t, r = !1) {
  const s = [{ id: null, label: r ? "Agents" : "System" }];
  if (!t) return s;
  if (r) {
    const n = e.nodes.find((c) => c.id === t);
    return n ? [...s, { id: t, label: n.label ?? n.name }] : s;
  }
  if (t === I || t === `area:${Se(e)}`) return [...s, { id: t, label: "Routes" }];
  if (t === T) return [...s, { id: t, label: "Scheduled jobs" }];
  if (t.startsWith("table:")) return [...s, { id: t, label: t.replace(/^table:(public\.)?/, "") }];
  const a = e.nodes.find((n) => n.id === t);
  if (!a) return s;
  if (a.kind === "area") return [...s, { id: t, label: B(a.path ?? a.name) }];
  if (a.kind === "module") {
    const n = e.nodes.find((c) => c.id === a.area);
    return [
      ...s,
      { id: a.area ?? null, label: B((n == null ? void 0 : n.path) ?? "") },
      { id: t, label: a.name }
    ];
  }
  return a.kind === "route" ? [...s, { id: I, label: "Routes" }, { id: t, label: a.name }] : a.kind === "job" ? [...s, { id: T, label: "Scheduled jobs" }, { id: t, label: a.name }] : [...s, { id: t, label: a.name }];
}
const J = { fontFamily: "var(--mono, ui-monospace, monospace)" }, w = { color: "var(--muted, #71717a)" }, rt = {
  high: "err",
  medium: "warn",
  low: "muted",
  info: "aim"
};
function at({ severity: e }) {
  return /* @__PURE__ */ l("span", { style: { flexShrink: 0 }, children: /* @__PURE__ */ l(we, { variant: rt[e], children: e }) });
}
function Gt({
  tables: e,
  selected: t,
  flagged: r,
  working: s,
  onSelect: a
}) {
  const [n, c] = g(""), i = e.filter((o) => o.name.includes(n.trim().toLowerCase()));
  return /* @__PURE__ */ m("div", { style: { display: "flex", flexDirection: "column", minHeight: 0, flex: 1, gap: 8 }, children: [
    /* @__PURE__ */ l(
      H,
      {
        "aria-label": "Filter tables",
        placeholder: "Filter tables",
        value: n,
        onChange: (o) => c(o.target.value)
      }
    ),
    /* @__PURE__ */ l("div", { style: { overflowY: "auto", minHeight: 0, flex: 1 }, children: i.map((o) => /* @__PURE__ */ m(
      "button",
      {
        onClick: () => a(o.id),
        style: {
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          width: "100%",
          boxSizing: "border-box",
          padding: "4px 8px",
          border: 0,
          borderRadius: 6,
          cursor: "pointer",
          textAlign: "left",
          fontSize: 13,
          color: "var(--text, inherit)",
          background: o.id === t ? "var(--bg-hover, rgba(127,127,127,.2))" : "transparent"
        },
        children: [
          /* @__PURE__ */ l("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: o.name }),
          /* @__PURE__ */ m("span", { style: { ...w, display: "flex", gap: 6, flexShrink: 0 }, children: [
            s != null && s.get(o.id) ? /* @__PURE__ */ m(
              "span",
              {
                title: "Worktrees changing this table or its code",
                style: { color: (s.get(o.id) ?? 0) > 1 ? "var(--warn-text, #b45309)" : "var(--accent, #2563eb)" },
                children: [
                  s.get(o.id),
                  " at work"
                ]
              }
            ) : null,
            r != null && r.get(o.id) ? /* @__PURE__ */ l("span", { title: `${r.get(o.id)} findings`, style: { color: "var(--warn-text, #b45309)" }, children: r.get(o.id) }) : null,
            /* @__PURE__ */ l("span", { title: `${o.columns} columns`, children: o.columns })
          ] })
        ]
      },
      o.id
    )) })
  ] });
}
function E({ title: e, children: t }) {
  return /* @__PURE__ */ m("div", { style: { marginBottom: 12 }, children: [
    /* @__PURE__ */ l("p", { style: { margin: "0 0 4px", fontWeight: 600 }, children: e }),
    t
  ] });
}
const z = { margin: 0, paddingLeft: 16 };
function Yt({
  nodes: e,
  focus: t,
  onSelect: r
}) {
  const [s, a] = g(""), n = s.trim().toLowerCase(), c = e.filter((d) => d.kind === "area").sort((d, f) => (f.lines ?? 0) - (d.lines ?? 0)), i = e.filter((d) => d.kind === "module"), o = (d, f, u) => /* @__PURE__ */ m(
    "button",
    {
      onClick: () => r(d.id),
      style: {
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        width: "100%",
        padding: `3px 8px 3px ${8 + f * 14}px`,
        border: 0,
        borderRadius: 6,
        cursor: "pointer",
        textAlign: "left",
        fontSize: 13,
        fontWeight: f === 0 ? 600 : 400,
        color: "var(--text, inherit)",
        background: d.id === t ? "var(--bg-hover, rgba(127,127,127,.2))" : "transparent"
      },
      children: [
        /* @__PURE__ */ l("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: u }),
        /* @__PURE__ */ l("span", { style: { ...w, fontWeight: 400, flexShrink: 0 }, title: de(d).title, children: de(d).count })
      ]
    },
    d.id
  );
  return /* @__PURE__ */ m("div", { style: { display: "flex", flexDirection: "column", minHeight: 0, flex: 1, gap: 8 }, children: [
    /* @__PURE__ */ l(H, { "aria-label": "Filter modules", placeholder: "Filter modules", value: s, onChange: (d) => a(d.target.value) }),
    /* @__PURE__ */ l("div", { style: { overflowY: "auto", minHeight: 0, flex: 1 }, children: c.map((d) => {
      const f = i.filter((h) => h.area === d.id && h.path !== d.path), u = f.filter((h) => h.name.toLowerCase().includes(n)), p = n !== "" || t === d.id || f.some((h) => h.id === t);
      return n && u.length === 0 && !d.name.toLowerCase().includes(n) ? null : /* @__PURE__ */ m("div", { children: [
        o(d, 0, d.path === "." ? d.name : (d.path ?? d.name).replace(/^src\//, "")),
        p && u.map((h) => o(h, 1, h.name))
      ] }, d.id);
    }) })
  ] });
}
function st({ findings: e, onAsk: t }) {
  return /* @__PURE__ */ l(U, { children: e.map((r) => /* @__PURE__ */ m("div", { style: { display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }, children: [
    /* @__PURE__ */ l(at, { severity: r.severity }),
    /* @__PURE__ */ l("span", { style: { flex: 1 }, children: r.title }),
    t && /* @__PURE__ */ l("button", { onClick: () => t(r), style: it, children: "Ask" })
  ] }, r.id)) });
}
const it = {
  background: "transparent",
  border: 0,
  padding: 0,
  cursor: "pointer",
  fontSize: 12,
  color: "var(--accent, #2563eb)",
  flexShrink: 0
};
function qt({ node: e, onAsk: t }) {
  const r = e.constraints.filter((a) => a.kind !== "check"), s = e.constraints.filter((a) => a.kind === "check");
  return /* @__PURE__ */ m("div", { style: { fontSize: 13, color: "var(--text, inherit)" }, children: [
    /* @__PURE__ */ l("p", { style: { ...w, ...J, fontSize: 12, margin: "0 0 8px", overflowWrap: "anywhere" }, children: e.source }),
    e.findings.length > 0 && /* @__PURE__ */ l(E, { title: "Findings", children: /* @__PURE__ */ l(st, { findings: e.findings, onAsk: t }) }),
    /* @__PURE__ */ l(E, { title: `Columns (${e.columns.length})`, children: /* @__PURE__ */ l("table", { style: { width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ l("tbody", { children: e.columns.map((a) => /* @__PURE__ */ m("tr", { title: a.source, children: [
      /* @__PURE__ */ l("td", { style: { padding: "2px 8px 2px 0", overflowWrap: "anywhere" }, children: a.name }),
      /* @__PURE__ */ l("td", { style: { ...w, ...J, fontSize: 12, padding: "2px 8px", overflowWrap: "anywhere" }, children: a.type }),
      /* @__PURE__ */ l("td", { style: { ...w, fontSize: 12, padding: "2px 0", whiteSpace: "nowrap" }, children: a.nullable ? "null" : "not null" })
    ] }, a.name)) }) }) }),
    r.length > 0 && /* @__PURE__ */ l(E, { title: "Keys", children: /* @__PURE__ */ l("ul", { style: z, children: r.map((a) => /* @__PURE__ */ m("li", { title: a.source, children: [
      a.kind.replace("_", " "),
      " (",
      a.columns.join(", "),
      ")",
      a.references ? ` to ${a.references}, on delete ${a.on_delete}` : ""
    ] }, a.name)) }) }),
    s.length > 0 && /* @__PURE__ */ l(E, { title: "Checks", children: /* @__PURE__ */ l("ul", { style: z, children: s.map((a) => /* @__PURE__ */ l("li", { title: a.source, style: { ...J, fontSize: 12, overflowWrap: "anywhere" }, children: a.expression }, a.name)) }) }),
    e.indexes.length > 0 && /* @__PURE__ */ l(E, { title: "Indexes", children: /* @__PURE__ */ l("ul", { style: z, children: e.indexes.map((a) => /* @__PURE__ */ m("li", { title: a.source, children: [
      a.name,
      " (",
      a.columns.join(", "),
      ")",
      a.unique ? ", unique" : "",
      a.partial ? ", partial" : ""
    ] }, a.name)) }) }),
    e.schema !== "main" && /* @__PURE__ */ l(E, { title: `Row level security: ${e.rls ? "on" : "off"}`, children: /* @__PURE__ */ l("ul", { style: z, children: e.policies.map((a) => /* @__PURE__ */ m("li", { title: a.source, children: [
      a.name,
      ": ",
      a.command,
      " for ",
      a.roles.join(", ")
    ] }, a.name)) }) }),
    e.triggers.length > 0 && /* @__PURE__ */ l(E, { title: "Triggers", children: /* @__PURE__ */ l("ul", { style: z, children: e.triggers.map((a) => /* @__PURE__ */ m("li", { title: a.source, children: [
      a.name,
      ": ",
      a.timing,
      " ",
      a.events.join(", ")
    ] }, a.name)) }) }),
    e.reads.length > 0 && /* @__PURE__ */ l(E, { title: "Notes", children: e.reads.map((a, n) => /* @__PURE__ */ l("p", { style: { margin: "0 0 6px" }, children: a.text }, n)) })
  ] });
}
const ot = ["map", "data", "plan", "risk", "worktrees", "findings", "agents", "explore"];
function Qt(e) {
  return e.missing ? "missing" : e.error ? "unknown" : e.stale || e.map_stale ? "stale" : e.commits_behind > 0 ? "behind" : "current";
}
function ae(e, t, r) {
  switch (e) {
    case "current":
      return { tone: "ok", label: "Current", detail: `Current with ${r}`, rebuild: !1 };
    case "behind":
      return {
        tone: "muted",
        label: `${t} behind`,
        detail: `${t} ${t === 1 ? "commit" : "commits"} behind ${r}, and none change the model`,
        rebuild: !1
      };
    case "stale":
      return { tone: "warn", label: "Out of date", detail: `${r} has changes the model doesn't show yet`, rebuild: !0 };
    case "missing":
      return { tone: "err", label: "Folder missing", detail: "The folder for this project is gone", rebuild: !1 };
    case "unknown":
      return { tone: "muted", label: "Can't check", detail: `Couldn't compare the model with ${r}`, rebuild: !1 };
  }
}
function L(e, t) {
  return `${e} ${t}${e === 1 ? "" : "s"}`;
}
const lt = { postgres: "Postgres", sqlite: "SQLite" };
function Jt(e) {
  const t = [
    e.tables ? `${L(e.tables, "table")} from ${lt[e.engine ?? ""] ?? e.engine}` : "No tables found",
    e.routes ? `${L(e.routes, "route")}, ${e.route_style}` : "No routes found",
    `${L(e.code_files, "code file")}, ${L(e.links, "link")}`
  ];
  return e.git || t.push("No git history, so no churn or worktrees"), t;
}
function Xt(e) {
  return `Couldn't read ${e.file}, so it was set aside as ${e.kept_as}.`;
}
function dt(e) {
  return e.status === "current" ? L(e.tables, "table") : ae(e.status, e.behind, e.ref).label;
}
function $e(e, t) {
  return t.filter((s) => s.name === e.name).length > 1 ? e.parent : null;
}
function ct(e, t) {
  const r = t.trim().toLowerCase();
  return r ? e.filter((s) => s.name.toLowerCase().includes(r) || s.repo.toLowerCase().includes(r)) : e;
}
function ut(e) {
  return e.length > 1 ? e.replace(/\/+$/, "") : e;
}
function ft(e) {
  const t = /* @__PURE__ */ new Map();
  for (const a of e) {
    const n = ut(a), c = n.lastIndexOf("/");
    c > 0 && t.set(n.slice(0, c), (t.get(n.slice(0, c)) ?? 0) + 1);
  }
  let r = null, s = 0;
  for (const [a, n] of t)
    n > s && (r = a, s = n);
  return r;
}
function Ce(e, t, r) {
  const s = r.trim().toLowerCase(), a = new Set(t.map((c) => c.repo_key)), n = e.filter((c) => c.name.toLowerCase().includes(s));
  return { toAdd: n.filter((c) => !a.has(c.key)), added: n.filter((c) => a.has(c.key)) };
}
function Ie(e, t = 40) {
  return e.length > t ? `…${e.slice(1 - t)}` : e;
}
function pt(e, t) {
  const r = Ce(e, t, "").toAdd.length;
  return r ? `Search ${L(r, "workspace")}` : "Search workspaces";
}
function ht(e) {
  const r = [
    [e.proposals, "proposal", "proposals"],
    [e.use_cases, "use case", "use cases"],
    [e.views, "saved view", "saved views"]
  ].filter(([s]) => s > 0).map(([s, a, n]) => `${s} ${s === 1 ? a : n}`);
  return r.length === 0 ? "" : r.length === 1 ? r[0] : `${r.slice(0, -1).join(", ")} and ${r[r.length - 1]}`;
}
function Ne(e, t) {
  const r = Math.max(0, t - e);
  return r < 60 ? "just now" : r < 3600 ? `${Math.floor(r / 60)}m ago` : r < 86400 ? `${Math.floor(r / 3600)}h ago` : `${Math.floor(r / 86400)}d ago`;
}
const _e = (e) => `system-map.view.${e}`;
function Zt(e, t) {
  if (!t) return "map";
  const r = e.getItem(_e(t));
  return ot.find((s) => s === r) ?? "map";
}
function en(e, t, r) {
  e.setItem(_e(t), r);
}
const Ee = "system-map.side-list";
function tn(e) {
  return e === "map" || e === "data";
}
function nn(e) {
  return e.getItem(Ee) !== "hidden";
}
function rn(e, t) {
  e.setItem(Ee, t ? "shown" : "hidden");
}
function mt(e) {
  return `system-map-design-${e}`;
}
const Ae = (e) => `system-map.chat.${e}`;
function an(e, t) {
  return e.getItem(Ae(t)) === "started";
}
function sn(e, t) {
  e.setItem(Ae(t), "started");
}
function on(e, t) {
  if (!Array.isArray(e)) return !1;
  const r = mt(t);
  return e.some((s) => (s == null ? void 0 : s.key) === r && typeof s.messages == "number" && s.messages > 0);
}
const gt = 600, fe = "system-map-workspace-list", ee = (e) => `system-map-workspace-${e.key}`;
function te() {
  return /* @__PURE__ */ l(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinejoin: "round",
      style: { ...w, flex: "none" },
      "aria-hidden": "true",
      children: /* @__PURE__ */ l("path", { d: "M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" })
    }
  );
}
function bt(e) {
  const t = $(), [r, s] = g(null), [a, n] = g(null);
  x(() => {
    if (s(null), n(null), !e) return;
    let i = !0;
    return (async () => {
      const d = await t.get(`${k}/workspaces`);
      if (d.folder !== null) return { ...d, suggested: !1 };
      const f = await t.get("/api/recent-projects").catch(() => ({ dirs: [] })), u = Array.isArray(f.dirs) ? f.dirs.filter((y) => typeof y == "string") : [], p = ft(u);
      if (p === null) return { ...d, suggested: !1 };
      const h = await t.get(`${k}/workspaces?folder=${encodeURIComponent(p)}`).catch(() => null);
      return h ? { ...h, suggested: !0 } : { ...d, suggested: !1 };
    })().then((d) => {
      i && s(d);
    }).catch((d) => {
      i && n(j(d, "read your default folder"));
    }), () => {
      i = !1;
    };
  }, [t, e]);
  const c = _(
    async (i) => {
      n(null);
      try {
        await t.post(`${k}/default-folder`, { folder: i }), s({ ...await t.get(`${k}/workspaces`), suggested: !1 });
      } catch (o) {
        n(j(o, "save this folder"));
      }
    },
    [t]
  );
  return { list: r, error: a, saveDefault: c };
}
function wt(e, t, r) {
  const s = $(), [a, n] = g(!1), c = W(!1), i = W({ onPicked: t, onUsePage: r });
  i.current = { onPicked: t, onUsePage: r };
  const o = _((u) => {
    c.current = u, n(u);
  }, []), d = _(() => {
    c.current && (o(!1), s.post(`${k}/folder-window-close`, {}).catch(() => {
    }));
  }, [s, o]);
  return x(() => {
    if (!a) return;
    const u = window.setInterval(() => {
      s.get(`${k}/folder-window`).then((p) => {
        !c.current || p.status === "open" || (o(!1), p.status === "picked" ? i.current.onPicked(p.path) : p.status === "failed" && i.current.onUsePage(p.message));
      }).catch(() => {
        o(!1), i.current.onUsePage(null);
      });
    }, gt);
    return () => window.clearInterval(u);
  }, [s, a, o]), x(() => e ? d : void 0, [e, d]), { waiting: a, openWindow: async (u) => {
    try {
      (await s.post(`${k}/folder-window`, { start: u })).status === "open" ? o(!0) : i.current.onUsePage(null);
    } catch {
      i.current.onUsePage(null);
    }
  }, closeWindow: d };
}
function yt({
  start: e,
  note: t,
  onUse: r,
  onCancel: s
}) {
  const a = $(), [n, c] = g(null), [i, o] = g(null), d = _(
    async (f) => {
      o(null);
      try {
        return c(await a.get(`${k}/browse?path=${encodeURIComponent(f)}`)), !0;
      } catch (u) {
        return o(j(u, "open this folder")), !1;
      }
    },
    [a]
  );
  return x(() => {
    d(e ?? "~").then((f) => {
      !f && e !== null && d("~");
    });
  }, [d, e]), /* @__PURE__ */ m("div", { style: { display: "grid", gap: 12, padding: 16 }, "data-testid": "folder-list", children: [
    /* @__PURE__ */ m("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }, children: [
      /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-link", disabled: !(n != null && n.parent), onClick: () => (n == null ? void 0 : n.parent) && void d(n.parent), children: "‹ Up" }),
      /* @__PURE__ */ l("span", { className: "sm-mono sm-ellipsis", title: n == null ? void 0 : n.path, "data-testid": "folder-list-path", children: n && Ie(n.display, 56) })
    ] }),
    /* @__PURE__ */ m("div", { className: "sm-list sm-add-list", children: [
      n == null ? void 0 : n.dirs.map((f) => /* @__PURE__ */ m("button", { type: "button", className: "sm-plain sm-row", title: f.path, onClick: () => void d(f.path), children: [
        /* @__PURE__ */ l(te, {}),
        /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: { fontWeight: 600 }, children: f.name })
      ] }, f.path)),
      (n == null ? void 0 : n.dirs.length) === 0 && /* @__PURE__ */ l("p", { style: { ...w, margin: 0, padding: "8px 9px" }, children: "No folders in here." })
    ] }),
    (t ?? i) && /* @__PURE__ */ l("p", { role: "status", style: { margin: 0, fontSize: 13 }, children: i ?? t }),
    /* @__PURE__ */ m("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
      /* @__PURE__ */ l(A, { onClick: s, children: "Cancel" }),
      /* @__PURE__ */ l(A, { primary: !0, disabled: !n, onClick: () => n && r(n.path), children: "Use this folder" })
    ] })
  ] });
}
function vt({
  workspace: e,
  added: t,
  active: r,
  busy: s,
  now: a,
  onHover: n,
  onPick: c
}) {
  return /* @__PURE__ */ m(
    "li",
    {
      id: ee(e),
      role: "option",
      className: "sm-row",
      "aria-selected": !1,
      "aria-disabled": s,
      "data-active": r && !s,
      "data-testid": "workspace-row",
      title: e.path,
      onMouseEnter: n,
      onClick: () => {
        s || c();
      },
      children: [
        /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: t ? w : { fontWeight: 600 }, children: e.name }),
        e.worktrees > 0 && /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: L(e.worktrees, "worktree") }),
        !e.git && /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: "no git" }),
        /* @__PURE__ */ l("span", { style: { flex: 1 } }),
        /* @__PURE__ */ l("span", { className: "sm-row-action", children: t ? "Open" : "Add" }),
        !t && e.touched > 0 && /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: Ne(e.touched, a) })
      ]
    }
  );
}
function xt({
  list: e,
  projects: t,
  busy: r,
  onAdd: s,
  onOpen: a
}) {
  const [n, c] = g(""), [i, o] = g(0), d = W(!1), { toAdd: f, added: u } = Ce(e.repos, t, n), p = [...f, ...u], h = Math.min(i, p.length - 1), y = Date.now() / 1e3, S = (b) => u.includes(b) ? a(b) : s(b);
  x(() => {
    var b;
    d.current && (d.current = !1, p[h] && ((b = document.getElementById(ee(p[h]))) == null || b.scrollIntoView({ block: "nearest" })));
  });
  const C = (b) => {
    if (b.key === "ArrowDown" || b.key === "ArrowUp") {
      if (b.preventDefault(), p.length === 0) return;
      d.current = !0, o((h + (b.key === "ArrowDown" ? 1 : -1) + p.length) % p.length);
    } else b.key === "Enter" && p[h] && !r && (b.preventDefault(), S(p[h]));
  }, D = (b, N, M) => /* @__PURE__ */ l(
    vt,
    {
      workspace: b,
      added: N,
      active: M === h,
      busy: r,
      now: y,
      onHover: () => o(M),
      onPick: () => S(b)
    },
    b.path
  );
  return /* @__PURE__ */ m(U, { children: [
    /* @__PURE__ */ l(
      H,
      {
        autoFocus: !0,
        role: "combobox",
        "aria-label": "Search workspaces",
        "aria-expanded": !0,
        "aria-controls": fe,
        "aria-activedescendant": p[h] ? ee(p[h]) : void 0,
        placeholder: pt(e.repos, t),
        value: n,
        disabled: r,
        onKeyDown: C,
        onChange: (b) => {
          c(b.target.value), o(0);
        }
      }
    ),
    /* @__PURE__ */ m("ul", { id: fe, className: "sm-list sm-add-list", role: "listbox", "aria-label": "Workspaces", children: [
      f.map((b, N) => D(b, !1, N)),
      u.length > 0 && /* @__PURE__ */ l("li", { role: "presentation", className: "sm-add-head", children: "Already added" }),
      u.map((b, N) => D(b, !0, f.length + N))
    ] }),
    p.length === 0 && /* @__PURE__ */ l("p", { style: { ...w, margin: 0, padding: "0 9px" }, children: "No workspace matches that. Only folders with git or a package.json show here." }),
    e.truncated && /* @__PURE__ */ l("p", { style: { ...w, margin: 0, fontSize: 12 }, children: "This folder is too big to search all of it. Pick a smaller one." })
  ] });
}
function kt({
  open: e,
  projects: t,
  onClose: r,
  onBuilt: s
}) {
  const a = $(), { list: n, error: c, saveDefault: i } = bt(e), [o, d] = g("workspaces"), [f, u] = g(null), [p, h] = g(!1), [y, S] = g(""), [C, D] = g(null), [b, N] = g(null), M = (v) => {
    u(v), d("folders");
  }, { waiting: V, openWindow: De, closeWindow: Me } = wt(e, (v) => void i(v), M);
  x(() => {
    e && (d("workspaces"), u(null), h(!1), S(""), N(null), D(null));
  }, [e]);
  const ie = async (v, ze) => {
    D(v), N(null);
    try {
      ze && (n != null && n.suggested) && n.folder && await a.post(`${k}/default-folder`, { folder: n.folder });
      const Y = await a.post(`${k}/build`, { repo_path: v });
      s(Y.repo_key);
    } catch (Y) {
      N(j(Y, "add this project"));
    } finally {
      D(null);
    }
  }, oe = () => void De((n == null ? void 0 : n.folder) ?? null), G = (v) => /* @__PURE__ */ m("div", { className: "sm-add-empty", "data-testid": "add-empty", children: [
    /* @__PURE__ */ l(te, {}),
    /* @__PURE__ */ l("span", { children: v }),
    /* @__PURE__ */ l(A, { primary: !0, disabled: V, onClick: oe, children: "Browse…" })
  ] });
  return /* @__PURE__ */ l(ye, { open: e, onClose: r, title: o === "folders" ? "Choose folder" : "Add project", maxWidth: 520, dismissDisabled: C !== null, children: o === "folders" ? /* @__PURE__ */ l(
    yt,
    {
      start: (n == null ? void 0 : n.folder) ?? null,
      note: f,
      onCancel: () => d("workspaces"),
      onUse: (v) => {
        d("workspaces"), i(v);
      }
    }
  ) : /* @__PURE__ */ m("div", { style: { display: "grid", gap: 12, padding: 16 }, "data-testid": "add-project", children: [
    (n == null ? void 0 : n.folder) && /* @__PURE__ */ m("div", { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 }, "data-testid": "default-folder", children: [
      /* @__PURE__ */ l(te, {}),
      /* @__PURE__ */ l("span", { className: "sm-mono sm-ellipsis", style: { fontSize: 13 }, title: n.folder, children: n.display && Ie(n.display) }),
      n.suggested ? /* @__PURE__ */ l(we, { variant: "aim", children: "Suggested" }) : /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12 }, children: "Default" }),
      /* @__PURE__ */ l("span", { style: { flex: 1 } }),
      /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-link", disabled: V || C !== null, onClick: oe, children: "Browse…" })
    ] }),
    V && /* @__PURE__ */ m("div", { role: "status", className: "sm-notice", "data-testid": "window-open", children: [
      /* @__PURE__ */ l("span", { style: { flex: 1 }, children: "Pick a folder in the window that just opened." }),
      /* @__PURE__ */ l(
        "button",
        {
          type: "button",
          className: "sm-plain sm-link",
          onClick: () => {
            Me(), M(null);
          },
          children: "Pick here instead"
        }
      )
    ] }),
    n && n.folder === null && G("Pick the folder that holds your projects"),
    (n == null ? void 0 : n.missing) && G(`${n.display} isn't there any more`),
    (n == null ? void 0 : n.folder) && !n.missing && n.repos.length === 0 && G(`No projects in ${n.display}`),
    (n == null ? void 0 : n.folder) && n.repos.length > 0 && /* @__PURE__ */ l(
      xt,
      {
        list: n,
        projects: t,
        busy: C !== null,
        onAdd: (v) => void ie(v.path, !0),
        onOpen: (v) => s(v.key)
      },
      n.folder
    ),
    p ? /* @__PURE__ */ m(
      "form",
      {
        onSubmit: (v) => {
          v.preventDefault(), y.trim() && ie(y.trim(), !1);
        },
        children: [
          /* @__PURE__ */ l("label", { style: { display: "block", ...w, fontSize: 12, marginBottom: 4 }, htmlFor: "system-map-path", children: "Full path to a project" }),
          /* @__PURE__ */ m("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ l(
              Re,
              {
                id: "system-map-path",
                placeholder: "/path/to/project",
                value: y,
                disabled: C !== null,
                autoFocus: !0,
                onChange: (v) => S(v.target.value),
                style: { flex: 1, minWidth: 0 }
              }
            ),
            /* @__PURE__ */ l(A, { primary: !0, type: "submit", disabled: C !== null || !y.trim(), children: "Add" })
          ] })
        ]
      }
    ) : /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-link", style: { justifySelf: "start" }, disabled: C !== null, onClick: () => h(!0), children: "Use a full path" }),
    /* @__PURE__ */ l("div", { role: "status", "aria-live": "polite", style: { fontSize: 13, minHeight: 18 }, "data-testid": "add-status", children: C !== null ? `Building ${C.split("/").pop()}. This can take a minute.` : b ?? c })
  ] }) });
}
const St = {
  [ne]: "table:",
  [I]: "route:",
  [T]: "job:"
};
function ln(e, t) {
  const r = new Set(t[e] ?? []), s = St[e];
  if (s)
    for (const [a, n] of Object.entries(t))
      a.startsWith(s) && n.forEach((c) => r.add(c));
  return [...r].sort();
}
function dn(e) {
  return new Map([...(e == null ? void 0 : e.modules) ?? [], ...(e == null ? void 0 : e.areas) ?? []].map((t) => [t.id ?? t.path, t]));
}
function cn(e) {
  return e != null && e.hot ? e.untested ? "hot-untested" : "hot" : null;
}
function un(e, t) {
  return t ? t.overlaps.filter((r) => [...r.schema, ...r.schema_and_code, ...r.code, ...r.modules].includes(e)) : [];
}
function fn(e) {
  const t = /* @__PURE__ */ new Map();
  for (const [r, s] of Object.entries((e == null ? void 0 : e.by_node) ?? {}))
    r.startsWith("table:") && t.set(r, s.length);
  return t;
}
function pn(e, t) {
  return t ? { ...e, nodes: [...e.nodes, ...t.overlay.nodes], edges: [...e.edges, ...t.overlay.edges] } : e;
}
function hn(e, t) {
  const r = new Set(t);
  return {
    tables: e.tables.filter((s) => r.has(s.id)),
    edges: e.edges.filter((s) => r.has(s.source) && r.has(s.target))
  };
}
function mn(e) {
  return e == null ? "none" : `${Math.round(e * 100)}%`;
}
function Le({
  trigger: e,
  children: t,
  width: r,
  align: s = "left",
  popup: a = "dialog",
  label: n,
  block: c = !1
}) {
  const [i, o] = g(!1), d = W(null), f = W(null), u = _(() => {
    var p;
    o(!1), (p = f.current) == null || p.focus();
  }, []);
  return x(() => {
    if (!i) return;
    const p = (h) => {
      var y;
      (y = d.current) != null && y.contains(h.target) || o(!1);
    };
    return document.addEventListener("pointerdown", p), () => document.removeEventListener("pointerdown", p);
  }, [i]), /* @__PURE__ */ m(
    "span",
    {
      ref: d,
      style: { position: "relative", display: c ? "block" : "inline-flex", minWidth: 0, maxWidth: "100%" },
      onKeyDown: (p) => {
        p.key === "Escape" && i && (p.stopPropagation(), u());
      },
      onBlur: (p) => {
        var y;
        const h = p.relatedTarget;
        h && !((y = d.current) != null && y.contains(h)) && o(!1);
      },
      children: [
        e({
          ref: f,
          onClick: () => o((p) => !p),
          onKeyDown: (p) => {
            p.key === "ArrowDown" && !i && (p.preventDefault(), o(!0));
          },
          "aria-expanded": i,
          "aria-haspopup": a
        }),
        i && // The host's main can take focus, so a click on anything here that can't would land
        // there and close this before the click arrives. Focus stops here instead.
        /* @__PURE__ */ l(
          "div",
          {
            className: "sm-pop",
            tabIndex: -1,
            role: a === "dialog" ? "dialog" : void 0,
            "aria-label": a === "dialog" ? n : void 0,
            style: { top: "calc(100% + 6px)", [s]: 0, width: `min(${r}px, calc(100vw - 24px))` },
            children: t(u)
          }
        )
      ]
    }
  );
}
const pe = '[role="menuitem"], [role="menuitemradio"]';
function $t({ label: e, children: t }) {
  const r = W(null);
  return x(() => {
    var a, n;
    (n = (a = r.current) == null ? void 0 : a.querySelector(pe)) == null || n.focus();
  }, []), /* @__PURE__ */ l("div", { ref: r, role: "menu", "aria-label": e, onKeyDown: (a) => {
    var o;
    const n = [...((o = r.current) == null ? void 0 : o.querySelectorAll(pe)) ?? []], c = n.indexOf(document.activeElement), i = a.key === "ArrowDown" ? c + 1 : a.key === "ArrowUp" ? c - 1 : null;
    i === null || n.length === 0 || (a.preventDefault(), n[(i + n.length) % n.length].focus());
  }, children: t });
}
function We() {
  return /* @__PURE__ */ l("svg", { width: "12", height: "12", viewBox: "0 0 12 12", "aria-hidden": "true", style: { flex: "none" }, children: /* @__PURE__ */ l("path", { d: "M2.5 4.5 6 8l3.5-3.5", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) });
}
function Ct({
  project: e,
  hint: t,
  onBuilt: r,
  onRemove: s
}) {
  const a = $(), [n, c] = g(!1), [i, o] = g(null), [d, f] = g(null), u = ae(e.status, e.behind, e.ref), p = ht(e.intent), h = async () => {
    o("Rebuilding"), f(null);
    try {
      await a.post(`${k}/build`, { repo: e.repo_key }), r();
    } catch (S) {
      f(j(S, "rebuild this project"));
    } finally {
      o(null);
    }
  }, y = async () => {
    o("Removing"), f(null);
    try {
      await s(e.repo_key);
    } catch (S) {
      f(j(S, "remove this project")), o(null);
    }
  };
  return /* @__PURE__ */ m("div", { className: "sm-manage-row", "data-testid": "manage-row", children: [
    /* @__PURE__ */ m("div", { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 }, children: [
      /* @__PURE__ */ l("span", { className: "sm-dot", "data-tone": u.tone }),
      /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: { fontWeight: 600 }, title: e.repo, children: e.name }),
      t && /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: t }),
      /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: u.label }),
      /* @__PURE__ */ l("span", { style: { flex: 1 } }),
      /* @__PURE__ */ l(A, { disabled: i !== null || e.status === "missing", onClick: () => void h(), children: i === "Rebuilding" ? "Rebuilding" : "Rebuild" }),
      /* @__PURE__ */ l(A, { danger: !0, disabled: i !== null, onClick: () => c(!0), children: "Remove" })
    ] }),
    /* @__PURE__ */ l("div", { className: "sm-mono sm-ellipsis", style: { ...w, marginTop: 4 }, title: e.repo, children: e.repo }),
    /* @__PURE__ */ m("div", { style: { ...w, fontSize: 12, marginTop: 2 }, children: [
      L(e.tables, "table"),
      ", built ",
      Ne(e.built_at, Date.now() / 1e3)
    ] }),
    n && /* @__PURE__ */ m("div", { role: "alert", style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border, #e4e4e7)" }, "data-testid": "confirm-remove", children: [
      /* @__PURE__ */ m("p", { style: { margin: "0 0 8px" }, children: [
        "Remove ",
        e.name,
        " from System Map? This deletes its model",
        p ? ` and ${p}` : "",
        " for good. The repo itself isn't touched."
      ] }),
      /* @__PURE__ */ m("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ l(A, { danger: !0, disabled: i !== null, onClick: () => void y(), autoFocus: !0, children: i === "Removing" ? "Removing" : "Remove project" }),
        /* @__PURE__ */ l(A, { disabled: i !== null, onClick: () => c(!1), children: "Keep it" })
      ] })
    ] }),
    d && /* @__PURE__ */ l("p", { style: { margin: "8px 0 0" }, children: d })
  ] });
}
function It({
  open: e,
  projects: t,
  onClose: r,
  onBuilt: s,
  onRemoved: a
}) {
  const n = $(), c = async (i) => {
    await n.post(`${k}/repo-remove`, { repo: i }), a(i);
  };
  return /* @__PURE__ */ l(ye, { open: e, onClose: r, title: "Manage projects", maxWidth: 620, children: /* @__PURE__ */ m("div", { className: "sm-manage", style: { padding: 16, maxHeight: "60vh", overflowY: "auto" }, "data-testid": "manage-projects", children: [
    t.map((i) => /* @__PURE__ */ l(Ct, { project: i, hint: $e(i, t), onBuilt: s, onRemove: c }, i.repo_key)),
    t.length === 0 && /* @__PURE__ */ l("p", { style: { ...w, margin: 0 }, children: "No projects yet." })
  ] }) });
}
const he = (e) => `system-map-project-${e}`;
function Nt({
  projects: e,
  activeKey: t,
  close: r,
  onPick: s,
  onAdd: a,
  onManage: n
}) {
  const [c, i] = g(""), o = ct(e, c), [d, f] = g(() => Math.max(0, o.findIndex((h) => h.repo_key === t))), u = Math.min(d, o.length - 1), p = (h) => {
    if (h.key === "ArrowDown" || h.key === "ArrowUp") {
      if (h.preventDefault(), o.length === 0) return;
      f((u + (h.key === "ArrowDown" ? 1 : -1) + o.length) % o.length);
    } else h.key === "Enter" && o[u] && (h.preventDefault(), r(), s(o[u].repo_key));
  };
  return /* @__PURE__ */ m(U, { children: [
    /* @__PURE__ */ l(
      H,
      {
        autoFocus: !0,
        role: "combobox",
        "aria-label": "Find a project",
        "aria-expanded": !0,
        "aria-controls": "system-map-project-list",
        "aria-activedescendant": o[u] ? he(o[u].repo_key) : void 0,
        placeholder: "Find a project",
        value: c,
        onKeyDown: p,
        onChange: (h) => {
          i(h.target.value), f(0);
        }
      }
    ),
    /* @__PURE__ */ l("ul", { id: "system-map-project-list", className: "sm-list", role: "listbox", "aria-label": "Projects", children: o.map((h, y) => {
      const S = $e(h, e);
      return /* @__PURE__ */ m(
        "li",
        {
          id: he(h.repo_key),
          role: "option",
          className: "sm-row",
          "aria-selected": h.repo_key === t,
          "data-active": y === u,
          title: h.repo,
          onMouseEnter: () => f(y),
          onClick: () => {
            r(), s(h.repo_key);
          },
          children: [
            /* @__PURE__ */ l("span", { className: "sm-dot", "data-tone": ae(h.status, h.behind, h.ref).tone }),
            /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: { fontWeight: 600 }, children: h.name }),
            S && /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: { ...w, fontSize: 12 }, children: S }),
            /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, marginLeft: "auto", whiteSpace: "nowrap", paddingLeft: 8 }, children: dt(h) })
          ]
        },
        h.repo_key
      );
    }) }),
    o.length === 0 && /* @__PURE__ */ l("p", { style: { ...w, margin: 0, padding: "8px 9px" }, children: "No project matches that." }),
    /* @__PURE__ */ l("div", { className: "sm-rule" }),
    /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-row", onClick: a, children: "Add project" }),
    /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-row", onClick: n, children: "Manage projects" })
  ] });
}
function gn({
  projects: e,
  activeKey: t,
  compact: r = !1,
  onPick: s,
  onReload: a
}) {
  const n = e.find((u) => u.repo_key === t), [c, i] = g(null), o = () => i(null);
  return { menu: /* @__PURE__ */ l(
    Le,
    {
      width: 340,
      label: "Projects",
      block: r,
      trigger: (u) => /* @__PURE__ */ m(
        "button",
        {
          type: "button",
          className: `sm-plain sm-project sm-focus${r ? " sm-compact" : ""}`,
          title: n == null ? void 0 : n.repo,
          "aria-label": `Project: ${(n == null ? void 0 : n.name) ?? ""}. Change project`,
          "data-testid": "project-menu",
          ...u,
          children: [
            /* @__PURE__ */ l("span", { className: "sm-ellipsis", children: n == null ? void 0 : n.name }),
            /* @__PURE__ */ l(We, {})
          ]
        }
      ),
      children: (u) => /* @__PURE__ */ l(
        Nt,
        {
          projects: e,
          activeKey: t,
          close: u,
          onPick: s,
          onAdd: () => {
            u(), i("add");
          },
          onManage: () => {
            u(), i("manage");
          }
        }
      )
    }
  ), dialogs: /* @__PURE__ */ m(U, { children: [
    /* @__PURE__ */ l(
      kt,
      {
        open: c === "add",
        projects: e,
        onClose: o,
        onBuilt: (u) => {
          o(), a(), s(u);
        }
      }
    ),
    /* @__PURE__ */ l(
      It,
      {
        open: c === "manage",
        projects: e,
        onClose: o,
        onBuilt: a,
        onRemoved: (u) => {
          const p = e.find((h) => h.repo_key !== u);
          p || o(), u === t && p && s(p.repo_key), a();
        }
      }
    )
  ] }) };
}
const me = "host", F = [
  { id: "host", name: "Kiro Crew", swatch: ["#fafafa", "#2f7d5c", "#18181b"] },
  { id: "blueprint", name: "Blueprint", swatch: ["#eef3f9", "#1d5fa8", "#0f2742"] },
  { id: "paper", name: "Paper", swatch: ["#f6f1e7", "#9c3d27", "#2b2118"] },
  { id: "contrast", name: "High contrast", swatch: ["#ffffff", "#0040c1", "#000000"] }
], _t = {
  blueprint: {
    light: {
      "--bg": "#eef3f9",
      "--bg-elevated": "#ffffff",
      "--bg-hover": "#e1eaf4",
      "--card": "#f8fbfe",
      "--text": "#0f2742",
      "--text-strong": "#071a30",
      "--muted": "#4a6380",
      "--border": "#c9d7e6",
      "--border-strong": "#8aa3be",
      "--accent": "#1d5fa8",
      "--accent-fg": "#ffffff",
      "--accent-subtle": "rgba(29, 95, 168, 0.16)",
      "--danger": "#b42318",
      "--warn": "#b54708",
      "--warn-text": "#9a4a06",
      "--ok": "#157347",
      "--info": "#1d5fa8"
    },
    dark: {
      "--bg": "#0c1d33",
      "--bg-elevated": "#13294a",
      "--bg-hover": "#1a3358",
      "--card": "#102440",
      "--text": "#e6eef8",
      "--text-strong": "#ffffff",
      "--muted": "#9db3cc",
      "--border": "#24406a",
      "--border-strong": "#4d6d96",
      "--accent": "#6cb4ff",
      "--accent-fg": "#06182c",
      "--accent-subtle": "rgba(108, 180, 255, 0.2)",
      "--danger": "#ff8a80",
      "--warn": "#f5b14c",
      "--warn-text": "#f5b14c",
      "--ok": "#5fd39a",
      "--info": "#6cb4ff"
    }
  },
  paper: {
    light: {
      "--bg": "#f6f1e7",
      "--bg-elevated": "#fffdf8",
      "--bg-hover": "#ede5d6",
      "--card": "#fffaf0",
      "--text": "#2b2118",
      "--text-strong": "#1a120b",
      "--muted": "#6b5d4d",
      "--border": "#e0d5c1",
      "--border-strong": "#a8977d",
      "--accent": "#9c3d27",
      "--accent-fg": "#ffffff",
      "--accent-subtle": "rgba(156, 61, 39, 0.14)",
      "--danger": "#a61b1b",
      "--warn": "#a85d00",
      "--warn-text": "#8a4b00",
      "--ok": "#3f6b2a",
      "--info": "#2f5d7c"
    },
    dark: {
      "--bg": "#1f1a15",
      "--bg-elevated": "#2a231c",
      "--bg-hover": "#332a21",
      "--card": "#262019",
      "--text": "#efe6d8",
      "--text-strong": "#fffaf0",
      "--muted": "#b3a48f",
      "--border": "#3e3428",
      "--border-strong": "#6e604e",
      "--accent": "#e0896b",
      "--accent-fg": "#23120b",
      "--accent-subtle": "rgba(224, 137, 107, 0.2)",
      "--danger": "#f28b82",
      "--warn": "#e3a857",
      "--warn-text": "#e3a857",
      "--ok": "#9cc47e",
      "--info": "#8fb8d6"
    }
  },
  contrast: {
    light: {
      "--bg": "#ffffff",
      "--bg-elevated": "#ffffff",
      "--bg-hover": "#ececec",
      "--card": "#ffffff",
      "--text": "#000000",
      "--text-strong": "#000000",
      "--muted": "#333333",
      "--border": "#595959",
      "--border-strong": "#000000",
      "--accent": "#0040c1",
      "--accent-fg": "#ffffff",
      "--accent-subtle": "rgba(0, 64, 193, 0.16)",
      "--danger": "#b00000",
      "--warn": "#8a4500",
      "--warn-text": "#7a3d00",
      "--ok": "#005a1f",
      "--info": "#0040c1"
    },
    dark: {
      "--bg": "#000000",
      "--bg-elevated": "#0d0d0d",
      "--bg-hover": "#1f1f1f",
      "--card": "#000000",
      "--text": "#ffffff",
      "--text-strong": "#ffffff",
      "--muted": "#d0d0d0",
      "--border": "#a6a6a6",
      "--border-strong": "#ffffff",
      "--accent": "#ffd60a",
      "--accent-fg": "#000000",
      "--accent-subtle": "rgba(255, 214, 10, 0.22)",
      "--danger": "#ff6b6b",
      "--warn": "#ffb020",
      "--warn-text": "#ffb020",
      "--ok": "#4ade80",
      "--info": "#7cc4ff"
    }
  }
};
function Et(e, t) {
  return e === "host" ? null : _t[e][t];
}
const se = "system-map.theme";
function At(e) {
  var t;
  try {
    const r = e.getItem(se);
    return ((t = F.find((s) => s.id === r)) == null ? void 0 : t.id) ?? me;
  } catch {
    return me;
  }
}
function Lt(e, t) {
  try {
    e.setItem(se, t);
  } catch {
  }
}
const X = /* @__PURE__ */ new Set();
function je() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function ge() {
  const e = je();
  return e ? At(e) : "host";
}
function Te() {
  const [e, t] = g(ge);
  return x(() => {
    X.add(t);
    const s = (a) => {
      (a.key === null || a.key === se) && t(ge());
    };
    return window.addEventListener("storage", s), () => {
      X.delete(t), window.removeEventListener("storage", s);
    };
  }, []), [e, (s) => {
    const a = je();
    a && Lt(a, s), X.forEach((n) => n(s));
  }];
}
function bn({ children: e, style: t }) {
  const [r] = Te(), { mode: s } = Oe(), a = Et(r, s), n = a ? { ...a, background: "var(--bg)", color: "var(--text)" } : {};
  return /* @__PURE__ */ l("div", { "data-theme": r, style: { display: "flow-root", boxSizing: "border-box", ...t, ...n }, children: e });
}
function be({ theme: e }) {
  return /* @__PURE__ */ l("span", { className: "sm-swatch", "aria-hidden": "true", children: e.swatch.map((t) => /* @__PURE__ */ l("i", { style: { background: t } }, t)) });
}
function wn() {
  const [e, t] = Te(), r = F.find((s) => s.id === e) ?? F[0];
  return /* @__PURE__ */ l(
    Le,
    {
      width: 230,
      align: "right",
      popup: "menu",
      label: "Theme",
      trigger: (s) => /* @__PURE__ */ m("button", { type: "button", className: "sm-plain sm-chip", "data-testid": "theme-chip", "aria-label": `Theme: ${r.name}`, ...s, children: [
        /* @__PURE__ */ l(be, { theme: r }),
        "Theme",
        /* @__PURE__ */ l(We, {})
      ] }),
      children: (s) => /* @__PURE__ */ l($t, { label: "Theme", children: F.map((a) => /* @__PURE__ */ m(
        "button",
        {
          type: "button",
          role: "menuitemradio",
          "aria-checked": a.id === e,
          className: "sm-plain sm-row",
          onClick: () => {
            t(a.id), s();
          },
          children: [
            /* @__PURE__ */ l(be, { theme: a }),
            /* @__PURE__ */ l("span", { className: "sm-ellipsis", children: a.name }),
            a.id === e && /* @__PURE__ */ l("span", { className: "sm-check", "aria-hidden": "true", children: "✓" })
          ]
        },
        a.id
      )) })
    }
  );
}
export {
  L as $,
  it as A,
  Ft as B,
  We as C,
  Le as D,
  fn as E,
  pn as F,
  ne as G,
  hn as H,
  ae as I,
  Qt as J,
  gn as K,
  wn as L,
  w as M,
  qt as N,
  Yt as O,
  Gt as P,
  un as Q,
  mt as R,
  at as S,
  bn as T,
  j as U,
  k as V,
  tn as W,
  rn as X,
  an as Y,
  on as Z,
  sn as _,
  J as a,
  Ne as b,
  Xt as c,
  Ut as d,
  Bt as e,
  Ht as f,
  Kt as g,
  dn as h,
  cn as i,
  I as j,
  T as k,
  $t as l,
  kt as m,
  zt as n,
  Rt as o,
  mn as p,
  Pt as q,
  Jt as r,
  B as s,
  Vt as t,
  Mt as u,
  Ot as v,
  ln as w,
  Zt as x,
  nn as y,
  en as z
};
