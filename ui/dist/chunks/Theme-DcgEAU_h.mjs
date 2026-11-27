import { jsxs as h, jsx as l, Fragment as K } from "react/jsx-runtime";
import { SearchInput as V, Badge as xe, Modal as ke, Input as Be, Btn as T } from "@kirocrew/app-sdk/ui";
import { useState as g, useCallback as _, useEffect as x, useRef as W, useSyncExternalStore as He } from "react";
import { useAppApi as $, useTheme as Se } from "@kirocrew/app-sdk";
const ue = "system-map-chrome-css", Ue = `
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
if (!document.getElementById(ue)) {
  const e = document.createElement("style");
  e.id = ue, e.textContent = Ue, document.head.appendChild(e);
}
const Ke = /^API (\d{3}): ([\s\S]*)$/;
function Ve(e) {
  const t = e ?? {};
  if (typeof t.status == "number") return { status: t.status, body: t.body ?? "" };
  const n = Ke.exec(typeof t.message == "string" ? t.message : "");
  return n ? { status: Number(n[1]), body: n[2] } : { status: null, body: "" };
}
function Ge(e) {
  try {
    const t = JSON.parse(e);
    return typeof t.error == "string" && t.error ? t.error : null;
  } catch {
    return null;
  }
}
function j(e, t) {
  const { status: n, body: s } = Ve(e);
  if (n === null) return `Couldn't ${t}. Check the dashboard is still connected, then try again.`;
  if (n === 400 || n === 404 || n === 500) {
    const a = Ge(s);
    if (a) return a;
  }
  return n === 401 || n === 403 ? `Couldn't ${t}, because System Map isn't allowed to. Check its permissions on its Details page.` : n >= 500 ? `Couldn't ${t}, because System Map's backend isn't answering. Try again in a moment.` : `Couldn't ${t}. Try again.`;
}
const k = "/apps/system-map/api";
function F(e, t) {
  return t ? `${k}${e}${e.includes("?") ? "&" : "?"}repo=${encodeURIComponent(t)}` : `${k}${e}`;
}
const J = "system-map.repo", X = "system-map:project";
function Kt() {
  var f, u;
  const e = $(), [t, n] = g([]), [s, a] = g(!1), [r, d] = g(() => localStorage.getItem(J)), i = _(async () => {
    try {
      const p = await e.get(`${k}/repos`);
      n(p.repos);
    } catch {
      n([]);
    } finally {
      a(!0);
    }
  }, [e]);
  x(() => {
    i();
  }, [i]), x(() => {
    const p = () => {
      d(localStorage.getItem(J)), i();
    };
    return window.addEventListener(X, p), () => window.removeEventListener(X, p);
  }, [i]);
  const o = _((p) => {
    localStorage.setItem(J, p), window.dispatchEvent(new Event(X));
  }, []), c = ((f = t.find((p) => p.repo_key === r)) == null ? void 0 : f.repo_key) ?? ((u = t[0]) == null ? void 0 : u.repo_key) ?? null;
  return { repos: t, active: c, loaded: s, choose: o, reload: i };
}
function Vt(e) {
  const t = $(), [n, s] = g(null), [a, r] = g(null), d = W(e);
  d.current = e;
  const i = _(async () => {
    if (!e) {
      s(null);
      return;
    }
    try {
      const o = await t.get(F("/overview", e));
      if (d.current !== e) return;
      s(o), r(null);
    } catch (o) {
      if (d.current !== e) return;
      s(null), r(j(o, "load this project"));
    }
  }, [t, e]);
  return x(() => {
    r(null), i();
  }, [i]), { overview: (n == null ? void 0 : n.manifest.repo_key) === e ? n : null, error: a, refresh: i };
}
function Gt(e, t, n) {
  const s = $(), [a, r] = g({ repo: t, value: null, failed: !1 });
  return x(() => {
    if (!n) return;
    let d = !0;
    return s.get(F(e, t)).then((i) => {
      d && r({ repo: t, value: i, failed: !1 });
    }).catch(() => {
      d && r({ repo: t, value: null, failed: !0 });
    }), () => {
      d = !1;
    };
  }, [s, e, t, n]), a.repo === t ? { value: a.value, failed: a.failed } : { value: null, failed: !1 };
}
function qt(e, t, n) {
  const s = $(), [a, r] = g(null);
  return x(() => {
    if (!e) {
      r(null);
      return;
    }
    let d = !0;
    return s.get(F(`/proposal?id=${encodeURIComponent(e)}`, t)).then((i) => {
      d && r(i);
    }).catch(() => {
      d && r(null);
    }), () => {
      d = !1;
    };
  }, [s, e, t, n]), a;
}
function Yt(e, t, n) {
  const s = $(), [a, r] = g({ repo: t, value: null, failed: !1 }), [d, i] = g(null), o = W(t);
  o.current = t;
  const c = _(async () => {
    if (!t) return null;
    try {
      const u = await s.get(F(e, t));
      return o.current !== t ? null : (r({ repo: t, value: u, failed: !1 }), i(Date.now()), u);
    } catch {
      return o.current === t && r({ repo: t, value: null, failed: !0 }), null;
    }
  }, [s, e, t]);
  x(() => {
    c();
    const u = window.setInterval(() => {
      document.visibilityState === "visible" && c();
    }, n);
    return () => window.clearInterval(u);
  }, [c, n]);
  const f = a.repo === t;
  return { value: f ? a.value : null, failed: f && a.failed, checkedAt: d, refresh: c };
}
function Qt(e, t = null, n) {
  const s = $(), [a, r] = g(null);
  return x(() => {
    if (!e) {
      r(null);
      return;
    }
    let d = !0;
    return s.get(F(`/node?id=${encodeURIComponent(e)}`, t)).then((i) => {
      d && r(i);
    }).catch(() => {
      d && r(null);
    }), () => {
      d = !1;
    };
  }, [s, e, t, n]), a;
}
const Jt = 200, Xt = 58, $e = /* @__PURE__ */ new Set(["starts", "hands_off_to", "uses_model"]), qe = /* @__PURE__ */ new Set(["planned", "partial"]), se = "group:tables", I = "group:routes", M = "group:jobs", R = (e, t, n) => `${e} ${e === 1 ? t : n}`;
function fe(e) {
  const t = e.files ?? 0, n = e.test_files ?? 0;
  return t === 0 && n > 0 ? { count: n, title: R(n, "test file", "test files") } : { count: t, title: R(t, "file", "files") };
}
function pe(e) {
  const t = e.files ?? 0, n = e.test_files ?? 0;
  return t === 0 && n > 0 ? R(n, "test file", "test files") : `${R(t, "file", "files")}, ${R(e.lines ?? 0, "line", "lines")}`;
}
function H(e) {
  return e === "." ? "root files" : e.replace(/^src\//, "");
}
const Ye = {
  "@openai/agents": "OpenAI Agents",
  "@mastra/core": "Mastra",
  "@anthropic-ai/claude-agent-sdk": "Claude Agent SDK"
};
function Qe(e) {
  var n;
  if (e.source === "sdk" && e.sdk) return Ye[e.sdk] ?? e.sdk;
  const t = ((n = e.jobs) == null ? void 0 : n.length) ?? 0;
  return `${t} ${t === 1 ? "job" : "jobs"}`;
}
function te(e) {
  var t;
  if (e.status === "proposed")
    return { id: e.id, kind: e.kind, title: e.kind === "module" ? e.name : H(e.path ?? e.name), subtitle: "proposed", status: "proposed" };
  switch (e.kind) {
    case "area":
      return { id: e.id, kind: "area", title: H(e.path ?? e.name), subtitle: pe(e) };
    case "module": {
      const n = e.area === `area:${e.path}`;
      return {
        id: e.id,
        kind: "module",
        title: n ? `${e.name} (top level)` : e.name,
        subtitle: pe(e)
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
        subtitle: Qe(e),
        status: e.status === "built" ? void 0 : e.status,
        badge: (t = e.asks_you) != null && t.length ? "asks you" : void 0
      };
    default:
      return { id: e.id, kind: e.kind, title: e.name };
  }
}
function G(e, t) {
  const n = e.nodes.filter((d) => d.kind === "route"), s = n.filter((d) => d.route_kind === "api").length, a = e.nodes.filter((d) => d.kind === "job").length, r = [];
  return n.length && r.push({ id: I, kind: "group", title: "Routes", subtitle: `${n.length - s} pages, ${s} API` }), t && r.push({ id: se, kind: "group", title: "Database", subtitle: `${t} ${t === 1 ? "table" : "tables"}` }), a && r.push({ id: M, kind: "group", title: "Scheduled jobs", subtitle: `${a} jobs` }), r;
}
function Je(e) {
  return { id: e, kind: "table", title: e.replace(/^table:(public\.)?/, "") };
}
const Xe = 3, Ze = 24;
function Ce(e, t) {
  return !!(e && t && (e === t || e.startsWith(`${t}/`)));
}
function me(e, t) {
  if (e.startsWith("table:")) return se;
  const n = t.byId.get(e);
  return n ? n.status === "proposed" ? e : (n.kind === "module" || n.kind === "area") && Ce(n.path, t.routesDir) ? I : n.kind === "module" ? n.area === t.open ? e : n.area ?? e : n.kind === "route" ? t.expanded === I ? e : I : n.kind === "job" ? t.expanded === M ? e : M : e : null;
}
function Ee(e, t) {
  return (e == null ? void 0 : e.kind) === "plan" && (!t || !qe.has(e.status));
}
function ie(e, t, n, s) {
  const a = /* @__PURE__ */ new Map();
  for (const r of e.edges) {
    if (Ee(t.byId.get(r.source), n)) continue;
    const d = me(r.source, t), i = me(r.target, t);
    if (!d || !i || d === i || !s(d, i)) continue;
    const o = `${d}|${i}|${r.kind}`, c = a.get(o);
    c ? c.count += r.count : a.set(o, { id: o, source: d, target: i, kind: r.kind, count: r.count, proposed: r.proposed });
  }
  return [...a.values()];
}
function P(e, t, n) {
  const s = [];
  for (const a of e) {
    const r = n.find((i) => i.id === a), d = t.byId.get(a);
    r ? s.push(r) : d ? s.push(te(d)) : a.startsWith("table:") && s.push(Je(a));
  }
  return s;
}
function et(e, t, n, s) {
  const a = G(e, n), r = ie(e, t, s, () => !0), d = r.length <= Ze ? r : r.filter((o) => o.kind !== "imports" || o.count >= Xe), i = new Set(a.map((o) => o.id));
  for (const o of e.nodes)
    o.kind === "area" && !Ce(o.path, t.routesDir) && i.add(o.id), o.kind === "service" && i.add(o.id), o.kind === "plan" && !Ee(o, s) && i.add(o.id), o.status === "proposed" && i.add(o.id);
  return { cards: P(i, t, a), lines: d.filter((o) => i.has(o.source) && i.has(o.target)), hidden: r.length - d.length };
}
function tt(e, t, n, s) {
  const a = new Set(e.nodes.filter((i) => i.area === t.open && i.kind === "module").map((i) => i.id)), r = ie(
    e,
    t,
    s,
    (i, o) => (a.has(i) || a.has(o)) && !i.startsWith("area:") && !o.startsWith("area:")
  ), d = new Set(a);
  for (const i of r)
    d.add(i.source), d.add(i.target);
  return { cards: P(d, t, G(e, n)), lines: r };
}
function nt(e, t, n, s) {
  const a = t.expanded === I ? "route" : "job", r = new Set(e.nodes.filter((o) => o.kind === a).map((o) => o.id)), d = ie(e, t, s, (o, c) => r.has(o) || r.has(c)), i = new Set(r);
  for (const o of d)
    i.add(o.source), i.add(o.target);
  return { cards: P(i, t, G(e, n)), lines: d };
}
function rt(e, t, n) {
  const s = [], a = /* @__PURE__ */ new Set([n]);
  for (const r of e.edges)
    r.source !== n && r.target !== n || (a.add(r.source), a.add(r.target), s.push({ id: `${r.source}|${r.target}|${r.kind}`, source: r.source, target: r.target, kind: r.kind, count: r.count }));
  return { cards: P(a, t, []), lines: s };
}
function Zt(e, t, n) {
  const s = new Map(e.nodes.map((i) => [i.id, i])), a = new Set(t), r = /* @__PURE__ */ new Map();
  for (const i of e.edges) {
    if (!a.has(i.source) || !a.has(i.target)) continue;
    const o = `${i.source}|${i.target}|${i.kind}`;
    r.set(o, { id: o, source: i.source, target: i.target, kind: i.kind, count: i.count, proposed: i.proposed });
  }
  return { cards: P(a, { byId: s }, G(e, n)), lines: [...r.values()] };
}
function Ie(e) {
  if (e.routes_dir) return e.routes_dir;
  const t = e.nodes.find((s) => s.kind === "route"), n = t == null ? void 0 : t.evidence[0];
  return n ? n.slice(0, n.lastIndexOf("/")) : null;
}
function at(e) {
  const t = new Set(e.nodes.filter((s) => s.kind === "agent").map((s) => s.id));
  if (t.size === 0) return e;
  const n = (s) => !$e.has(s.kind) && !t.has(s.source) && !t.has(s.target);
  return { ...e, nodes: e.nodes.filter((s) => !t.has(s.id)), edges: e.edges.filter(n) };
}
function st(e, t) {
  return e.trim().toLowerCase() === t.trim().toLowerCase();
}
function it(e) {
  const t = new Map(e.nodes.map((c) => [c.id, c])), n = e.nodes.filter((c) => c.kind === "agent").map((c) => c.id), s = new Set(n), a = /* @__PURE__ */ new Map();
  for (const c of e.edges) {
    if (!$e.has(c.kind) || !(t.has(c.source) && t.has(c.target)) || !n.includes(c.source) && !n.includes(c.target)) continue;
    s.add(c.source), s.add(c.target);
    const f = `${c.source}|${c.target}|${c.kind}`, u = a.get(f);
    u ? u.count += c.count : a.set(f, { id: f, source: c.source, target: c.target, kind: c.kind, count: c.count, leaves: c.leaves_region || void 0 });
  }
  const r = e.home_region ?? null, d = /* @__PURE__ */ new Map(), i = [...s].map((c) => {
    const f = t.get(c);
    if (f.kind !== "service") return te(f);
    if (f.region) {
      const u = f.region.trim().toLowerCase(), p = d.get(u) ?? { region: f.region.trim(), members: [] };
      d.set(u, { ...p, members: [...p.members, c] });
    }
    return { ...te(f), subtitle: f.region ?? "no region set", strong: !0 };
  }), o = [...d].map(([c, { region: f, members: u }]) => {
    const p = r ? st(f, r) ? "home" : "away" : "unknown";
    return { id: `band:${c}`, label: p === "home" ? `${f} · home` : f, tone: p, members: u };
  });
  return { cards: i, lines: [...a.values()], bands: o };
}
function en(e, t, n, s, a = !1) {
  if (a) return it(e);
  e = at(e);
  const r = new Map(e.nodes.map((u) => [u.id, u])), d = Ie(e), i = t === `area:${d}` ? I : t, o = i != null && i.startsWith("area:") ? i : null, c = i === I || i === M ? i : null, f = { byId: r, open: o, expanded: c, routesDir: d };
  return i ? o ? tt(e, f, n, s) : c ? nt(e, f, n, s) : rt(e, f, i) : et(e, f, n, s);
}
function tn(e, t, n = !1) {
  const s = [{ id: null, label: n ? "Agents" : "System" }];
  if (!t) return s;
  if (n) {
    const r = e.nodes.find((d) => d.id === t);
    return r ? [...s, { id: t, label: r.label ?? r.name }] : s;
  }
  if (t === I || t === `area:${Ie(e)}`) return [...s, { id: t, label: "Routes" }];
  if (t === M) return [...s, { id: t, label: "Scheduled jobs" }];
  if (t.startsWith("table:")) return [...s, { id: t, label: t.replace(/^table:(public\.)?/, "") }];
  const a = e.nodes.find((r) => r.id === t);
  if (!a) return s;
  if (a.kind === "area") return [...s, { id: t, label: H(a.path ?? a.name) }];
  if (a.kind === "module") {
    const r = e.nodes.find((d) => d.id === a.area);
    return [
      ...s,
      { id: a.area ?? null, label: H((r == null ? void 0 : r.path) ?? "") },
      { id: t, label: a.name }
    ];
  }
  return a.kind === "route" ? [...s, { id: I, label: "Routes" }, { id: t, label: a.name }] : a.kind === "job" ? [...s, { id: M, label: "Scheduled jobs" }, { id: t, label: a.name }] : [...s, { id: t, label: a.name }];
}
const Z = { fontFamily: "var(--mono, ui-monospace, monospace)" }, w = { color: "var(--muted, #71717a)" }, ot = {
  high: "err",
  medium: "warn",
  low: "muted",
  info: "aim"
};
function lt({ severity: e }) {
  return /* @__PURE__ */ l("span", { style: { flexShrink: 0 }, children: /* @__PURE__ */ l(xe, { variant: ot[e], children: e }) });
}
function nn({
  tables: e,
  selected: t,
  flagged: n,
  working: s,
  onSelect: a
}) {
  const [r, d] = g(""), i = e.filter((o) => o.name.includes(r.trim().toLowerCase()));
  return /* @__PURE__ */ h("div", { style: { display: "flex", flexDirection: "column", minHeight: 0, flex: 1, gap: 8 }, children: [
    /* @__PURE__ */ l(
      V,
      {
        "aria-label": "Filter tables",
        placeholder: "Filter tables",
        value: r,
        onChange: (o) => d(o.target.value)
      }
    ),
    /* @__PURE__ */ l("div", { style: { overflowY: "auto", minHeight: 0, flex: 1 }, children: i.map((o) => /* @__PURE__ */ h(
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
          /* @__PURE__ */ h("span", { style: { ...w, display: "flex", gap: 6, flexShrink: 0 }, children: [
            s != null && s.get(o.id) ? /* @__PURE__ */ h(
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
            n != null && n.get(o.id) ? /* @__PURE__ */ l("span", { title: `${n.get(o.id)} findings`, style: { color: "var(--warn-text, #b45309)" }, children: n.get(o.id) }) : null,
            /* @__PURE__ */ l("span", { title: `${o.columns} columns`, children: o.columns })
          ] })
        ]
      },
      o.id
    )) })
  ] });
}
function A({ title: e, children: t }) {
  return /* @__PURE__ */ h("div", { style: { marginBottom: 12 }, children: [
    /* @__PURE__ */ l("p", { style: { margin: "0 0 4px", fontWeight: 600 }, children: e }),
    t
  ] });
}
const O = { margin: 0, paddingLeft: 16 };
function rn({
  nodes: e,
  focus: t,
  onSelect: n
}) {
  const [s, a] = g(""), r = s.trim().toLowerCase(), d = e.filter((c) => c.kind === "area").sort((c, f) => (f.lines ?? 0) - (c.lines ?? 0)), i = e.filter((c) => c.kind === "module"), o = (c, f, u) => /* @__PURE__ */ h(
    "button",
    {
      onClick: () => n(c.id),
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
        background: c.id === t ? "var(--bg-hover, rgba(127,127,127,.2))" : "transparent"
      },
      children: [
        /* @__PURE__ */ l("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: u }),
        /* @__PURE__ */ l("span", { style: { ...w, fontWeight: 400, flexShrink: 0 }, title: fe(c).title, children: fe(c).count })
      ]
    },
    c.id
  );
  return /* @__PURE__ */ h("div", { style: { display: "flex", flexDirection: "column", minHeight: 0, flex: 1, gap: 8 }, children: [
    /* @__PURE__ */ l(V, { "aria-label": "Filter modules", placeholder: "Filter modules", value: s, onChange: (c) => a(c.target.value) }),
    /* @__PURE__ */ l("div", { style: { overflowY: "auto", minHeight: 0, flex: 1 }, children: d.map((c) => {
      const f = i.filter((m) => m.area === c.id && m.path !== c.path), u = f.filter((m) => m.name.toLowerCase().includes(r)), p = r !== "" || t === c.id || f.some((m) => m.id === t);
      return r && u.length === 0 && !c.name.toLowerCase().includes(r) ? null : /* @__PURE__ */ h("div", { children: [
        o(c, 0, c.path === "." ? c.name : (c.path ?? c.name).replace(/^src\//, "")),
        p && u.map((m) => o(m, 1, m.name))
      ] }, c.id);
    }) })
  ] });
}
function dt({ findings: e, onAsk: t }) {
  return /* @__PURE__ */ l(K, { children: e.map((n) => /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }, children: [
    /* @__PURE__ */ l(lt, { severity: n.severity }),
    /* @__PURE__ */ l("span", { style: { flex: 1 }, children: n.title }),
    t && /* @__PURE__ */ l("button", { onClick: () => t(n), style: ct, children: "Ask" })
  ] }, n.id)) });
}
const ct = {
  background: "transparent",
  border: 0,
  padding: 0,
  cursor: "pointer",
  fontSize: 12,
  color: "var(--accent, #2563eb)",
  flexShrink: 0
};
function an({ node: e, onAsk: t }) {
  const n = e.constraints.filter((a) => a.kind !== "check"), s = e.constraints.filter((a) => a.kind === "check");
  return /* @__PURE__ */ h("div", { style: { fontSize: 13, color: "var(--text, inherit)" }, children: [
    /* @__PURE__ */ l("p", { style: { ...w, ...Z, fontSize: 12, margin: "0 0 8px", overflowWrap: "anywhere" }, children: e.source }),
    e.findings.length > 0 && /* @__PURE__ */ l(A, { title: "Findings", children: /* @__PURE__ */ l(dt, { findings: e.findings, onAsk: t }) }),
    /* @__PURE__ */ l(A, { title: `Columns (${e.columns.length})`, children: /* @__PURE__ */ l("table", { style: { width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ l("tbody", { children: e.columns.map((a) => /* @__PURE__ */ h("tr", { title: a.source, children: [
      /* @__PURE__ */ l("td", { style: { padding: "2px 8px 2px 0", overflowWrap: "anywhere" }, children: a.name }),
      /* @__PURE__ */ l("td", { style: { ...w, ...Z, fontSize: 12, padding: "2px 8px", overflowWrap: "anywhere" }, children: a.type }),
      /* @__PURE__ */ l("td", { style: { ...w, fontSize: 12, padding: "2px 0", whiteSpace: "nowrap" }, children: a.nullable ? "null" : "not null" })
    ] }, a.name)) }) }) }),
    n.length > 0 && /* @__PURE__ */ l(A, { title: "Keys", children: /* @__PURE__ */ l("ul", { style: O, children: n.map((a) => /* @__PURE__ */ h("li", { title: a.source, children: [
      a.kind.replace("_", " "),
      " (",
      a.columns.join(", "),
      ")",
      a.references ? ` to ${a.references}, on delete ${a.on_delete}` : ""
    ] }, a.name)) }) }),
    s.length > 0 && /* @__PURE__ */ l(A, { title: "Checks", children: /* @__PURE__ */ l("ul", { style: O, children: s.map((a) => /* @__PURE__ */ l("li", { title: a.source, style: { ...Z, fontSize: 12, overflowWrap: "anywhere" }, children: a.expression }, a.name)) }) }),
    e.indexes.length > 0 && /* @__PURE__ */ l(A, { title: "Indexes", children: /* @__PURE__ */ l("ul", { style: O, children: e.indexes.map((a) => /* @__PURE__ */ h("li", { title: a.source, children: [
      a.name,
      " (",
      a.columns.join(", "),
      ")",
      a.unique ? ", unique" : "",
      a.partial ? ", partial" : ""
    ] }, a.name)) }) }),
    e.schema !== "main" && /* @__PURE__ */ l(A, { title: `Row level security: ${e.rls ? "on" : "off"}`, children: /* @__PURE__ */ l("ul", { style: O, children: e.policies.map((a) => /* @__PURE__ */ h("li", { title: a.source, children: [
      a.name,
      ": ",
      a.command,
      " for ",
      a.roles.join(", ")
    ] }, a.name)) }) }),
    e.triggers.length > 0 && /* @__PURE__ */ l(A, { title: "Triggers", children: /* @__PURE__ */ l("ul", { style: O, children: e.triggers.map((a) => /* @__PURE__ */ h("li", { title: a.source, children: [
      a.name,
      ": ",
      a.timing,
      " ",
      a.events.join(", ")
    ] }, a.name)) }) }),
    e.reads.length > 0 && /* @__PURE__ */ l(A, { title: "Notes", children: e.reads.map((a, r) => /* @__PURE__ */ l("p", { style: { margin: "0 0 6px" }, children: a.text }, r)) })
  ] });
}
const ut = ["map", "data", "plan", "risk", "worktrees", "findings", "agents", "explore"];
function sn(e) {
  return e.missing ? "missing" : e.error ? "unknown" : e.stale || e.map_stale ? "stale" : e.commits_behind > 0 ? "behind" : "current";
}
function oe(e, t, n) {
  switch (e) {
    case "current":
      return { tone: "ok", label: "Current", detail: `Current with ${n}`, rebuild: !1 };
    case "behind":
      return {
        tone: "muted",
        label: `${t} behind`,
        detail: `${t} ${t === 1 ? "commit" : "commits"} behind ${n}, and none change the model`,
        rebuild: !1
      };
    case "stale":
      return { tone: "warn", label: "Out of date", detail: `${n} has changes the model doesn't show yet`, rebuild: !0 };
    case "missing":
      return { tone: "err", label: "Folder missing", detail: "The folder for this project is gone", rebuild: !1 };
    case "unknown":
      return { tone: "muted", label: "Can't check", detail: `Couldn't compare the model with ${n}`, rebuild: !1 };
  }
}
function L(e, t) {
  return `${e} ${t}${e === 1 ? "" : "s"}`;
}
const ft = { postgres: "Postgres", sqlite: "SQLite" };
function on(e) {
  const t = [
    e.tables ? `${L(e.tables, "table")} from ${ft[e.engine ?? ""] ?? e.engine}` : "No tables found",
    e.routes ? `${L(e.routes, "route")}, ${e.route_style}` : "No routes found",
    `${L(e.code_files, "code file")}, ${L(e.links, "link")}`
  ];
  return e.git || t.push("No git history, so no churn or worktrees"), t;
}
function ln(e) {
  return `Couldn't read ${e.file}, so it was set aside as ${e.kept_as}.`;
}
function pt(e) {
  return e.status === "current" ? L(e.tables, "table") : oe(e.status, e.behind, e.ref).label;
}
function Ne(e, t) {
  return t.filter((s) => s.name === e.name).length > 1 ? e.parent : null;
}
function mt(e, t) {
  const n = t.trim().toLowerCase();
  return n ? e.filter((s) => s.name.toLowerCase().includes(n) || s.repo.toLowerCase().includes(n)) : e;
}
function ht(e) {
  return e.length > 1 ? e.replace(/\/+$/, "") : e;
}
function gt(e) {
  const t = /* @__PURE__ */ new Map();
  for (const a of e) {
    const r = ht(a), d = r.lastIndexOf("/");
    d > 0 && t.set(r.slice(0, d), (t.get(r.slice(0, d)) ?? 0) + 1);
  }
  let n = null, s = 0;
  for (const [a, r] of t)
    r > s && (n = a, s = r);
  return n;
}
function _e(e, t, n) {
  const s = n.trim().toLowerCase(), a = new Set(t.map((d) => d.repo_key)), r = e.filter((d) => d.name.toLowerCase().includes(s));
  return { toAdd: r.filter((d) => !a.has(d.key)), added: r.filter((d) => a.has(d.key)) };
}
function Ae(e, t = 40) {
  return e.length > t ? `…${e.slice(1 - t)}` : e;
}
function bt(e, t) {
  const n = _e(e, t, "").toAdd.length;
  return n ? `Search ${L(n, "workspace")}` : "Search workspaces";
}
function wt(e) {
  const n = [
    [e.proposals, "proposal", "proposals"],
    [e.use_cases, "use case", "use cases"],
    [e.views, "saved view", "saved views"]
  ].filter(([s]) => s > 0).map(([s, a, r]) => `${s} ${s === 1 ? a : r}`);
  return n.length === 0 ? "" : n.length === 1 ? n[0] : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}
function Te(e, t) {
  const n = Math.max(0, t - e);
  return n < 60 ? "just now" : n < 3600 ? `${Math.floor(n / 60)}m ago` : n < 86400 ? `${Math.floor(n / 3600)}h ago` : `${Math.floor(n / 86400)}d ago`;
}
const Le = (e) => `system-map.view.${e}`;
function dn(e, t) {
  if (!t) return "map";
  const n = e.getItem(Le(t));
  return ut.find((s) => s === n) ?? "map";
}
function cn(e, t, n) {
  e.setItem(Le(t), n);
}
const We = "system-map.side-list";
function un(e) {
  return e === "map" || e === "data";
}
function fn(e) {
  return e.getItem(We) !== "hidden";
}
function pn(e, t) {
  e.setItem(We, t ? "shown" : "hidden");
}
function vt(e) {
  return `system-map-design-${e}`;
}
const je = (e) => `system-map.chat.${e}`;
function mn(e, t) {
  return e.getItem(je(t)) === "started";
}
function hn(e, t) {
  e.setItem(je(t), "started");
}
function gn(e, t) {
  if (!Array.isArray(e)) return !1;
  const n = vt(t);
  return e.some((s) => (s == null ? void 0 : s.key) === n && typeof s.messages == "number" && s.messages > 0);
}
const yt = 600, he = "system-map-workspace-list", ne = (e) => `system-map-workspace-${e.key}`;
function re() {
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
function xt(e) {
  const t = $(), [n, s] = g(null), [a, r] = g(null);
  x(() => {
    if (s(null), r(null), !e) return;
    let i = !0;
    return (async () => {
      const c = await t.get(`${k}/workspaces`);
      if (c.folder !== null) return { ...c, suggested: !1 };
      const f = await t.get("/api/recent-projects").catch(() => ({ dirs: [] })), u = Array.isArray(f.dirs) ? f.dirs.filter((v) => typeof v == "string") : [], p = gt(u);
      if (p === null) return { ...c, suggested: !1 };
      const m = await t.get(`${k}/workspaces?folder=${encodeURIComponent(p)}`).catch(() => null);
      return m ? { ...m, suggested: !0 } : { ...c, suggested: !1 };
    })().then((c) => {
      i && s(c);
    }).catch((c) => {
      i && r(j(c, "read your default folder"));
    }), () => {
      i = !1;
    };
  }, [t, e]);
  const d = _(
    async (i) => {
      r(null);
      try {
        await t.post(`${k}/default-folder`, { folder: i }), s({ ...await t.get(`${k}/workspaces`), suggested: !1 });
      } catch (o) {
        r(j(o, "save this folder"));
      }
    },
    [t]
  );
  return { list: n, error: a, saveDefault: d };
}
function kt(e, t, n) {
  const s = $(), [a, r] = g(!1), d = W(!1), i = W({ onPicked: t, onUsePage: n });
  i.current = { onPicked: t, onUsePage: n };
  const o = _((u) => {
    d.current = u, r(u);
  }, []), c = _(() => {
    d.current && (o(!1), s.post(`${k}/folder-window-close`, {}).catch(() => {
    }));
  }, [s, o]);
  return x(() => {
    if (!a) return;
    const u = window.setInterval(() => {
      s.get(`${k}/folder-window`).then((p) => {
        !d.current || p.status === "open" || (o(!1), p.status === "picked" ? i.current.onPicked(p.path) : p.status === "failed" && i.current.onUsePage(p.message));
      }).catch(() => {
        o(!1), i.current.onUsePage(null);
      });
    }, yt);
    return () => window.clearInterval(u);
  }, [s, a, o]), x(() => e ? c : void 0, [e, c]), { waiting: a, openWindow: async (u) => {
    try {
      (await s.post(`${k}/folder-window`, { start: u })).status === "open" ? o(!0) : i.current.onUsePage(null);
    } catch {
      i.current.onUsePage(null);
    }
  }, closeWindow: c };
}
function St({
  start: e,
  note: t,
  onUse: n,
  onCancel: s
}) {
  const a = $(), [r, d] = g(null), [i, o] = g(null), c = _(
    async (f) => {
      o(null);
      try {
        return d(await a.get(`${k}/browse?path=${encodeURIComponent(f)}`)), !0;
      } catch (u) {
        return o(j(u, "open this folder")), !1;
      }
    },
    [a]
  );
  return x(() => {
    c(e ?? "~").then((f) => {
      !f && e !== null && c("~");
    });
  }, [c, e]), /* @__PURE__ */ h("div", { style: { display: "grid", gap: 12, padding: 16 }, "data-testid": "folder-list", children: [
    /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }, children: [
      /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-link", disabled: !(r != null && r.parent), onClick: () => (r == null ? void 0 : r.parent) && void c(r.parent), children: "‹ Up" }),
      /* @__PURE__ */ l("span", { className: "sm-mono sm-ellipsis", title: r == null ? void 0 : r.path, "data-testid": "folder-list-path", children: r && Ae(r.display, 56) })
    ] }),
    /* @__PURE__ */ h("div", { className: "sm-list sm-add-list", children: [
      r == null ? void 0 : r.dirs.map((f) => /* @__PURE__ */ h("button", { type: "button", className: "sm-plain sm-row", title: f.path, onClick: () => void c(f.path), children: [
        /* @__PURE__ */ l(re, {}),
        /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: { fontWeight: 600 }, children: f.name })
      ] }, f.path)),
      (r == null ? void 0 : r.dirs.length) === 0 && /* @__PURE__ */ l("p", { style: { ...w, margin: 0, padding: "8px 9px" }, children: "No folders in here." })
    ] }),
    (t ?? i) && /* @__PURE__ */ l("p", { role: "status", style: { margin: 0, fontSize: 13 }, children: i ?? t }),
    /* @__PURE__ */ h("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
      /* @__PURE__ */ l(T, { onClick: s, children: "Cancel" }),
      /* @__PURE__ */ l(T, { primary: !0, disabled: !r, onClick: () => r && n(r.path), children: "Use this folder" })
    ] })
  ] });
}
function $t({
  workspace: e,
  added: t,
  active: n,
  busy: s,
  now: a,
  onHover: r,
  onPick: d
}) {
  return /* @__PURE__ */ h(
    "li",
    {
      id: ne(e),
      role: "option",
      className: "sm-row",
      "aria-selected": !1,
      "aria-disabled": s,
      "data-active": n && !s,
      "data-testid": "workspace-row",
      title: e.path,
      onMouseEnter: r,
      onClick: () => {
        s || d();
      },
      children: [
        /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: t ? w : { fontWeight: 600 }, children: e.name }),
        e.worktrees > 0 && /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: L(e.worktrees, "worktree") }),
        !e.git && /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: "no git" }),
        /* @__PURE__ */ l("span", { style: { flex: 1 } }),
        /* @__PURE__ */ l("span", { className: "sm-row-action", children: t ? "Open" : "Add" }),
        !t && e.touched > 0 && /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: Te(e.touched, a) })
      ]
    }
  );
}
function Ct({
  list: e,
  projects: t,
  busy: n,
  onAdd: s,
  onOpen: a
}) {
  const [r, d] = g(""), [i, o] = g(0), c = W(!1), { toAdd: f, added: u } = _e(e.repos, t, r), p = [...f, ...u], m = Math.min(i, p.length - 1), v = Date.now() / 1e3, S = (b) => u.includes(b) ? a(b) : s(b);
  x(() => {
    var b;
    c.current && (c.current = !1, p[m] && ((b = document.getElementById(ne(p[m]))) == null || b.scrollIntoView({ block: "nearest" })));
  });
  const E = (b) => {
    if (b.key === "ArrowDown" || b.key === "ArrowUp") {
      if (b.preventDefault(), p.length === 0) return;
      c.current = !0, o((m + (b.key === "ArrowDown" ? 1 : -1) + p.length) % p.length);
    } else b.key === "Enter" && p[m] && !n && (b.preventDefault(), S(p[m]));
  }, D = (b, N, z) => /* @__PURE__ */ l(
    $t,
    {
      workspace: b,
      added: N,
      active: z === m,
      busy: n,
      now: v,
      onHover: () => o(z),
      onPick: () => S(b)
    },
    b.path
  );
  return /* @__PURE__ */ h(K, { children: [
    /* @__PURE__ */ l(
      V,
      {
        autoFocus: !0,
        role: "combobox",
        "aria-label": "Search workspaces",
        "aria-expanded": !0,
        "aria-controls": he,
        "aria-activedescendant": p[m] ? ne(p[m]) : void 0,
        placeholder: bt(e.repos, t),
        value: r,
        disabled: n,
        onKeyDown: E,
        onChange: (b) => {
          d(b.target.value), o(0);
        }
      }
    ),
    /* @__PURE__ */ h("ul", { id: he, className: "sm-list sm-add-list", role: "listbox", "aria-label": "Workspaces", children: [
      f.map((b, N) => D(b, !1, N)),
      u.length > 0 && /* @__PURE__ */ l("li", { role: "presentation", className: "sm-add-head", children: "Already added" }),
      u.map((b, N) => D(b, !0, f.length + N))
    ] }),
    p.length === 0 && /* @__PURE__ */ l("p", { style: { ...w, margin: 0, padding: "0 9px" }, children: "No workspace matches that. Only folders with git or a package.json show here." }),
    e.truncated && /* @__PURE__ */ l("p", { style: { ...w, margin: 0, fontSize: 12 }, children: "This folder is too big to search all of it. Pick a smaller one." })
  ] });
}
function Et({
  open: e,
  projects: t,
  onClose: n,
  onBuilt: s
}) {
  const a = $(), { list: r, error: d, saveDefault: i } = xt(e), [o, c] = g("workspaces"), [f, u] = g(null), [p, m] = g(!1), [v, S] = g(""), [E, D] = g(null), [b, N] = g(null), z = (y) => {
    u(y), c("folders");
  }, { waiting: q, openWindow: Re, closeWindow: Fe } = kt(e, (y) => void i(y), z);
  x(() => {
    e && (c("workspaces"), u(null), m(!1), S(""), N(null), D(null));
  }, [e]);
  const de = async (y, Pe) => {
    D(y), N(null);
    try {
      Pe && (r != null && r.suggested) && r.folder && await a.post(`${k}/default-folder`, { folder: r.folder });
      const Q = await a.post(`${k}/build`, { repo_path: y });
      s(Q.repo_key);
    } catch (Q) {
      N(j(Q, "add this project"));
    } finally {
      D(null);
    }
  }, ce = () => void Re((r == null ? void 0 : r.folder) ?? null), Y = (y) => /* @__PURE__ */ h("div", { className: "sm-add-empty", "data-testid": "add-empty", children: [
    /* @__PURE__ */ l(re, {}),
    /* @__PURE__ */ l("span", { children: y }),
    /* @__PURE__ */ l(T, { primary: !0, disabled: q, onClick: ce, children: "Browse…" })
  ] });
  return /* @__PURE__ */ l(ke, { open: e, onClose: n, title: o === "folders" ? "Choose folder" : "Add project", maxWidth: 520, dismissDisabled: E !== null, children: o === "folders" ? /* @__PURE__ */ l(
    St,
    {
      start: (r == null ? void 0 : r.folder) ?? null,
      note: f,
      onCancel: () => c("workspaces"),
      onUse: (y) => {
        c("workspaces"), i(y);
      }
    }
  ) : /* @__PURE__ */ h("div", { style: { display: "grid", gap: 12, padding: 16 }, "data-testid": "add-project", children: [
    (r == null ? void 0 : r.folder) && /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 }, "data-testid": "default-folder", children: [
      /* @__PURE__ */ l(re, {}),
      /* @__PURE__ */ l("span", { className: "sm-mono sm-ellipsis", style: { fontSize: 13 }, title: r.folder, children: r.display && Ae(r.display) }),
      r.suggested ? /* @__PURE__ */ l(xe, { variant: "aim", children: "Suggested" }) : /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12 }, children: "Default" }),
      /* @__PURE__ */ l("span", { style: { flex: 1 } }),
      /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-link", disabled: q || E !== null, onClick: ce, children: "Browse…" })
    ] }),
    q && /* @__PURE__ */ h("div", { role: "status", className: "sm-notice", "data-testid": "window-open", children: [
      /* @__PURE__ */ l("span", { style: { flex: 1 }, children: "Pick a folder in the window that just opened." }),
      /* @__PURE__ */ l(
        "button",
        {
          type: "button",
          className: "sm-plain sm-link",
          onClick: () => {
            Fe(), z(null);
          },
          children: "Pick here instead"
        }
      )
    ] }),
    r && r.folder === null && Y("Pick the folder that holds your projects"),
    (r == null ? void 0 : r.missing) && Y(`${r.display} isn't there any more`),
    (r == null ? void 0 : r.folder) && !r.missing && r.repos.length === 0 && Y(`No projects in ${r.display}`),
    (r == null ? void 0 : r.folder) && r.repos.length > 0 && /* @__PURE__ */ l(
      Ct,
      {
        list: r,
        projects: t,
        busy: E !== null,
        onAdd: (y) => void de(y.path, !0),
        onOpen: (y) => s(y.key)
      },
      r.folder
    ),
    p ? /* @__PURE__ */ h(
      "form",
      {
        onSubmit: (y) => {
          y.preventDefault(), v.trim() && de(v.trim(), !1);
        },
        children: [
          /* @__PURE__ */ l("label", { style: { display: "block", ...w, fontSize: 12, marginBottom: 4 }, htmlFor: "system-map-path", children: "Full path to a project" }),
          /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ l(
              Be,
              {
                id: "system-map-path",
                placeholder: "/path/to/project",
                value: v,
                disabled: E !== null,
                autoFocus: !0,
                onChange: (y) => S(y.target.value),
                style: { flex: 1, minWidth: 0 }
              }
            ),
            /* @__PURE__ */ l(T, { primary: !0, type: "submit", disabled: E !== null || !v.trim(), children: "Add" })
          ] })
        ]
      }
    ) : /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-link", style: { justifySelf: "start" }, disabled: E !== null, onClick: () => m(!0), children: "Use a full path" }),
    /* @__PURE__ */ l("div", { role: "status", "aria-live": "polite", style: { fontSize: 13, minHeight: 18 }, "data-testid": "add-status", children: E !== null ? `Building ${E.split("/").pop()}. This can take a minute.` : b ?? d })
  ] }) });
}
const It = {
  [se]: "table:",
  [I]: "route:",
  [M]: "job:"
};
function bn(e, t) {
  const n = new Set(t[e] ?? []), s = It[e];
  if (s)
    for (const [a, r] of Object.entries(t))
      a.startsWith(s) && r.forEach((d) => n.add(d));
  return [...n].sort();
}
function wn(e) {
  return new Map([...(e == null ? void 0 : e.modules) ?? [], ...(e == null ? void 0 : e.areas) ?? []].map((t) => [t.id ?? t.path, t]));
}
function vn(e) {
  return e != null && e.hot ? e.untested ? "hot-untested" : "hot" : null;
}
function yn(e, t) {
  return t ? t.overlaps.filter((n) => [...n.schema, ...n.schema_and_code, ...n.code, ...n.modules].includes(e)) : [];
}
function xn(e) {
  const t = /* @__PURE__ */ new Map();
  for (const [n, s] of Object.entries((e == null ? void 0 : e.by_node) ?? {}))
    n.startsWith("table:") && t.set(n, s.length);
  return t;
}
function kn(e, t) {
  return t ? { ...e, nodes: [...e.nodes, ...t.overlay.nodes], edges: [...e.edges, ...t.overlay.edges] } : e;
}
function Sn(e, t) {
  const n = new Set(t);
  return {
    tables: e.tables.filter((s) => n.has(s.id)),
    edges: e.edges.filter((s) => n.has(s.source) && n.has(s.target))
  };
}
function $n(e) {
  return e == null ? "none" : `${Math.round(e * 100)}%`;
}
function Me({
  trigger: e,
  children: t,
  width: n,
  align: s = "left",
  popup: a = "dialog",
  label: r,
  block: d = !1
}) {
  const [i, o] = g(!1), c = W(null), f = W(null), u = _(() => {
    var p;
    o(!1), (p = f.current) == null || p.focus();
  }, []);
  return x(() => {
    if (!i) return;
    const p = (m) => {
      var v;
      (v = c.current) != null && v.contains(m.target) || o(!1);
    };
    return document.addEventListener("pointerdown", p), () => document.removeEventListener("pointerdown", p);
  }, [i]), /* @__PURE__ */ h(
    "span",
    {
      ref: c,
      style: { position: "relative", display: d ? "block" : "inline-flex", minWidth: 0, maxWidth: "100%" },
      onKeyDown: (p) => {
        p.key === "Escape" && i && (p.stopPropagation(), u());
      },
      onBlur: (p) => {
        var v;
        const m = p.relatedTarget;
        m && !((v = c.current) != null && v.contains(m)) && o(!1);
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
            "aria-label": a === "dialog" ? r : void 0,
            style: { top: "calc(100% + 6px)", [s]: 0, width: `min(${n}px, calc(100vw - 24px))` },
            children: t(u)
          }
        )
      ]
    }
  );
}
const ge = '[role="menuitem"], [role="menuitemradio"]';
function Nt({ label: e, children: t }) {
  const n = W(null);
  return x(() => {
    var r, d;
    const a = ((r = n.current) == null ? void 0 : r.querySelector('[aria-checked="true"]')) ?? ((d = n.current) == null ? void 0 : d.querySelector(ge));
    a == null || a.focus();
  }, []), /* @__PURE__ */ l("div", { ref: n, role: "menu", "aria-label": e, onKeyDown: (a) => {
    var o;
    const r = [...((o = n.current) == null ? void 0 : o.querySelectorAll(ge)) ?? []], d = r.indexOf(document.activeElement), i = a.key === "ArrowDown" ? d + 1 : a.key === "ArrowUp" ? d - 1 : null;
    i === null || r.length === 0 || (a.preventDefault(), r[(i + r.length) % r.length].focus());
  }, children: t });
}
function De() {
  return /* @__PURE__ */ l("svg", { width: "12", height: "12", viewBox: "0 0 12 12", "aria-hidden": "true", style: { flex: "none" }, children: /* @__PURE__ */ l("path", { d: "M2.5 4.5 6 8l3.5-3.5", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) });
}
function _t({
  project: e,
  hint: t,
  onBuilt: n,
  onRemove: s
}) {
  const a = $(), [r, d] = g(!1), [i, o] = g(null), [c, f] = g(null), u = oe(e.status, e.behind, e.ref), p = wt(e.intent), m = async () => {
    o("Rebuilding"), f(null);
    try {
      await a.post(`${k}/build`, { repo: e.repo_key }), n();
    } catch (S) {
      f(j(S, "rebuild this project"));
    } finally {
      o(null);
    }
  }, v = async () => {
    o("Removing"), f(null);
    try {
      await s(e.repo_key);
    } catch (S) {
      f(j(S, "remove this project")), o(null);
    }
  };
  return /* @__PURE__ */ h("div", { className: "sm-manage-row", "data-testid": "manage-row", children: [
    /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 }, children: [
      /* @__PURE__ */ l("span", { className: "sm-dot", "data-tone": u.tone }),
      /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: { fontWeight: 600 }, title: e.repo, children: e.name }),
      t && /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: t }),
      /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, whiteSpace: "nowrap" }, children: u.label }),
      /* @__PURE__ */ l("span", { style: { flex: 1 } }),
      /* @__PURE__ */ l(T, { disabled: i !== null || e.status === "missing", onClick: () => void m(), children: i === "Rebuilding" ? "Rebuilding" : "Rebuild" }),
      /* @__PURE__ */ l(T, { danger: !0, disabled: i !== null, onClick: () => d(!0), children: "Remove" })
    ] }),
    /* @__PURE__ */ l("div", { className: "sm-mono sm-ellipsis", style: { ...w, marginTop: 4 }, title: e.repo, children: e.repo }),
    /* @__PURE__ */ h("div", { style: { ...w, fontSize: 12, marginTop: 2 }, children: [
      L(e.tables, "table"),
      ", built ",
      Te(e.built_at, Date.now() / 1e3)
    ] }),
    r && /* @__PURE__ */ h("div", { role: "alert", style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border, #e4e4e7)" }, "data-testid": "confirm-remove", children: [
      /* @__PURE__ */ h("p", { style: { margin: "0 0 8px" }, children: [
        "Remove ",
        e.name,
        " from System Map? This deletes its model",
        p ? ` and ${p}` : "",
        " for good. The repo itself isn't touched."
      ] }),
      /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ l(T, { danger: !0, disabled: i !== null, onClick: () => void v(), autoFocus: !0, children: i === "Removing" ? "Removing" : "Remove project" }),
        /* @__PURE__ */ l(T, { disabled: i !== null, onClick: () => d(!1), children: "Keep it" })
      ] })
    ] }),
    c && /* @__PURE__ */ l("p", { style: { margin: "8px 0 0" }, children: c })
  ] });
}
function At({
  open: e,
  projects: t,
  onClose: n,
  onBuilt: s,
  onRemoved: a
}) {
  const r = $(), d = async (i) => {
    await r.post(`${k}/repo-remove`, { repo: i }), a(i);
  };
  return /* @__PURE__ */ l(ke, { open: e, onClose: n, title: "Manage projects", maxWidth: 620, children: /* @__PURE__ */ h("div", { className: "sm-manage", style: { padding: 16, maxHeight: "60vh", overflowY: "auto" }, "data-testid": "manage-projects", children: [
    t.map((i) => /* @__PURE__ */ l(_t, { project: i, hint: Ne(i, t), onBuilt: s, onRemove: d }, i.repo_key)),
    t.length === 0 && /* @__PURE__ */ l("p", { style: { ...w, margin: 0 }, children: "No projects yet." })
  ] }) });
}
const be = (e) => `system-map-project-${e}`;
function Tt({
  projects: e,
  activeKey: t,
  close: n,
  onPick: s,
  onAdd: a,
  onManage: r
}) {
  const [d, i] = g(""), o = mt(e, d), [c, f] = g(() => Math.max(0, o.findIndex((m) => m.repo_key === t))), u = Math.min(c, o.length - 1), p = (m) => {
    if (m.key === "ArrowDown" || m.key === "ArrowUp") {
      if (m.preventDefault(), o.length === 0) return;
      f((u + (m.key === "ArrowDown" ? 1 : -1) + o.length) % o.length);
    } else m.key === "Enter" && o[u] && (m.preventDefault(), n(), s(o[u].repo_key));
  };
  return /* @__PURE__ */ h(K, { children: [
    /* @__PURE__ */ l(
      V,
      {
        autoFocus: !0,
        role: "combobox",
        "aria-label": "Find a project",
        "aria-expanded": !0,
        "aria-controls": "system-map-project-list",
        "aria-activedescendant": o[u] ? be(o[u].repo_key) : void 0,
        placeholder: "Find a project",
        value: d,
        onKeyDown: p,
        onChange: (m) => {
          i(m.target.value), f(0);
        }
      }
    ),
    /* @__PURE__ */ l("ul", { id: "system-map-project-list", className: "sm-list", role: "listbox", "aria-label": "Projects", children: o.map((m, v) => {
      const S = Ne(m, e);
      return /* @__PURE__ */ h(
        "li",
        {
          id: be(m.repo_key),
          role: "option",
          className: "sm-row",
          "aria-selected": m.repo_key === t,
          "data-active": v === u,
          title: m.repo,
          onMouseEnter: () => f(v),
          onClick: () => {
            n(), s(m.repo_key);
          },
          children: [
            /* @__PURE__ */ l("span", { className: "sm-dot", "data-tone": oe(m.status, m.behind, m.ref).tone }),
            /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: { fontWeight: 600 }, children: m.name }),
            S && /* @__PURE__ */ l("span", { className: "sm-ellipsis", style: { ...w, fontSize: 12 }, children: S }),
            /* @__PURE__ */ l("span", { style: { ...w, fontSize: 12, marginLeft: "auto", whiteSpace: "nowrap", paddingLeft: 8 }, children: pt(m) })
          ]
        },
        m.repo_key
      );
    }) }),
    o.length === 0 && /* @__PURE__ */ l("p", { style: { ...w, margin: 0, padding: "8px 9px" }, children: "No project matches that." }),
    /* @__PURE__ */ l("div", { className: "sm-rule" }),
    /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-row", onClick: a, children: "Add project" }),
    /* @__PURE__ */ l("button", { type: "button", className: "sm-plain sm-row", onClick: r, children: "Manage projects" })
  ] });
}
function Cn({
  projects: e,
  activeKey: t,
  compact: n = !1,
  onPick: s,
  onReload: a
}) {
  const r = e.find((u) => u.repo_key === t), [d, i] = g(null), o = () => i(null);
  return { menu: /* @__PURE__ */ l(
    Me,
    {
      width: 340,
      label: "Projects",
      block: n,
      trigger: (u) => /* @__PURE__ */ h(
        "button",
        {
          type: "button",
          className: `sm-plain sm-project sm-focus${n ? " sm-compact" : ""}`,
          title: r == null ? void 0 : r.repo,
          "aria-label": `Project: ${(r == null ? void 0 : r.name) ?? ""}. Change project`,
          "data-testid": "project-menu",
          ...u,
          children: [
            /* @__PURE__ */ l("span", { className: "sm-ellipsis", children: r == null ? void 0 : r.name }),
            /* @__PURE__ */ l(De, {})
          ]
        }
      ),
      children: (u) => /* @__PURE__ */ l(
        Tt,
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
  ), dialogs: /* @__PURE__ */ h(K, { children: [
    /* @__PURE__ */ l(
      Et,
      {
        open: d === "add",
        projects: e,
        onClose: o,
        onBuilt: (u) => {
          o(), a(), s(u);
        }
      }
    ),
    /* @__PURE__ */ l(
      At,
      {
        open: d === "manage",
        projects: e,
        onClose: o,
        onBuilt: a,
        onRemoved: (u) => {
          const p = e.find((m) => m.repo_key !== u);
          p || o(), u === t && p && s(p.repo_key), a();
        }
      }
    )
  ] }) };
}
const U = "host", B = [
  { id: "host", name: "Kiro Crew" },
  { id: "blueprint", name: "Blueprint" },
  { id: "paper", name: "Paper" },
  { id: "contrast", name: "High contrast" }
], Lt = {
  blueprint: {
    light: {
      bg: "#eef3f9",
      elevated: "#ffffff",
      hover: "#e1eaf4",
      card: "#f8fbfe",
      text: "#0f2742",
      strong: "#071a30",
      muted: "#455d79",
      border: "#c9d7e6",
      borderStrong: "#8aa3be",
      accent: "#1d5fa8",
      accentFg: "#ffffff",
      danger: "#b42318",
      warn: "#b54708",
      warnText: "#8f4405",
      ok: "#10663e",
      info: "#1d5fa8"
    },
    dark: {
      bg: "#0c1d33",
      elevated: "#13294a",
      hover: "#1a3358",
      card: "#102440",
      text: "#e6eef8",
      strong: "#ffffff",
      muted: "#a3b8d0",
      border: "#24406a",
      borderStrong: "#4d6d96",
      accent: "#7dbdff",
      accentFg: "#06182c",
      danger: "#ff8a80",
      warn: "#f5b14c",
      warnText: "#f5b14c",
      ok: "#5fd39a",
      info: "#7dbdff"
    }
  },
  paper: {
    light: {
      bg: "#f6f1e7",
      elevated: "#fffdf8",
      hover: "#ede5d6",
      card: "#fffaf0",
      text: "#2b2118",
      strong: "#1a120b",
      muted: "#64564a",
      border: "#e0d5c1",
      borderStrong: "#a8977d",
      accent: "#9c3d27",
      accentFg: "#ffffff",
      danger: "#a61b1b",
      warn: "#a85d00",
      warnText: "#8a4b00",
      ok: "#386024",
      info: "#2f5d7c"
    },
    dark: {
      bg: "#1f1a15",
      elevated: "#2a231c",
      hover: "#332a21",
      card: "#262019",
      text: "#efe6d8",
      strong: "#fffaf0",
      muted: "#b8a994",
      border: "#3e3428",
      borderStrong: "#6e604e",
      accent: "#eb9a7d",
      accentFg: "#23120b",
      danger: "#f28b82",
      warn: "#e3a857",
      warnText: "#e3a857",
      ok: "#9cc47e",
      info: "#8fb8d6"
    }
  },
  contrast: {
    light: {
      bg: "#ffffff",
      elevated: "#ffffff",
      hover: "#ececec",
      card: "#ffffff",
      text: "#000000",
      strong: "#000000",
      muted: "#333333",
      border: "#595959",
      borderStrong: "#000000",
      accent: "#0040c1",
      accentFg: "#ffffff",
      danger: "#b00000",
      warn: "#8a4500",
      warnText: "#7a3d00",
      ok: "#005a1f",
      info: "#0040c1"
    },
    dark: {
      bg: "#000000",
      elevated: "#0d0d0d",
      hover: "#1f1f1f",
      card: "#000000",
      text: "#ffffff",
      strong: "#ffffff",
      muted: "#d0d0d0",
      border: "#a6a6a6",
      borderStrong: "#ffffff",
      accent: "#ffd60a",
      accentFg: "#000000",
      danger: "#ff6b6b",
      warn: "#ffb020",
      warnText: "#ffb020",
      ok: "#4ade80",
      info: "#7cc4ff"
    }
  }
};
function ae(e) {
  if (!/^#[0-9a-f]{6}$/i.test(e)) throw new Error(`A palette colour must be #rrggbb, not ${e}`);
  return [1, 3, 5].map((t) => parseInt(e.slice(t, t + 2), 16));
}
function C(e, t) {
  const [n, s, a] = ae(e);
  return `rgba(${n}, ${s}, ${a}, ${t})`;
}
function Wt(e, t, n) {
  const s = ae(t);
  return `#${ae(e).map((a, r) => Math.round(a + (s[r] - a) * n).toString(16).padStart(2, "0")).join("")}`;
}
function jt(e, t) {
  const n = t === "light" ? "#ffffff" : "#000000";
  return {
    "--bg": e.bg,
    "--bg-accent": e.hover,
    "--bg-elevated": e.elevated,
    "--bg-hover": e.hover,
    "--card": e.card,
    "--card-fg": e.text,
    "--panel": e.bg,
    "--panel-strong": e.elevated,
    "--chrome": e.bg,
    "--text": e.text,
    "--text-strong": e.strong,
    "--muted": e.muted,
    "--muted-strong": e.muted,
    "--muted-fg": n,
    "--border": e.border,
    "--border-strong": e.borderStrong,
    "--border-hover": e.borderStrong,
    // Hover moves away from the background: darker on light, lighter on dark.
    "--accent": e.accent,
    "--accent-fg": e.accentFg,
    "--accent-hover": Wt(e.accent, t === "light" ? "#000000" : "#ffffff", 0.15),
    "--accent-subtle": C(e.accent, 0.16),
    "--accent-glow": C(e.accent, 0.3),
    "--ring": e.accent,
    "--aim": e.accent,
    "--aim-fg": e.accentFg,
    "--aim-subtle": C(e.accent, 0.16),
    "--ok": e.ok,
    "--ok-fg": n,
    "--ok-subtle": C(e.ok, 0.14),
    "--ok-text": e.ok,
    "--warn": e.warn,
    "--warn-fg": n,
    "--warn-subtle": C(e.warn, 0.14),
    "--warn-text": e.warnText,
    "--danger": e.danger,
    "--danger-fg": n,
    "--danger-subtle": C(e.danger, 0.14),
    "--danger-text": e.danger,
    "--info": e.info,
    "--info-fg": n,
    "--info-text": e.info,
    "--glass-tint-ultrathin": C(e.bg, 0.3),
    "--glass-tint-thin": C(e.bg, 0.4),
    "--glass-tint-regular": C(e.bg, 0.5),
    "--glass-tint-thick": C(e.bg, 0.6),
    "--glass-tint-ultrathick": C(e.bg, 0.8)
  };
}
function ze(e, t) {
  return e === "host" ? null : jt(Lt[e][t], t);
}
function Mt(e, t) {
  const n = ze(e, t);
  return n && [n["--bg"], n["--accent"], n["--text"]];
}
const le = "system-map.theme";
function we(e) {
  var t;
  try {
    const n = e.getItem(le);
    return ((t = B.find((s) => s.id === n)) == null ? void 0 : t.id) ?? U;
  } catch {
    return U;
  }
}
function Dt(e, t) {
  try {
    e.setItem(le, t);
  } catch {
  }
}
function zt(e) {
  let t = e ? we(e) : U;
  const n = /* @__PURE__ */ new Set(), s = () => n.forEach((a) => a());
  return {
    get: () => t,
    set(a) {
      t = a, e && Dt(e, a), s();
    },
    /** Another document changed storage. A null key means it was cleared. */
    heard(a) {
      a !== null && a !== le || (t = e ? we(e) : U, s());
    },
    subscribe(a) {
      return n.add(a), () => {
        n.delete(a);
      };
    }
  };
}
function Ot() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
let ee = null;
function Rt() {
  if (!ee) {
    const e = Ot(), t = zt(e);
    window.addEventListener("storage", (n) => {
      n.storageArea === e && t.heard(n.key);
    }), ee = t;
  }
  return ee;
}
function Oe() {
  const { subscribe: e, get: t, set: n } = Rt();
  return [He(e, t), n];
}
function En({ children: e, style: t }) {
  const [n] = Oe(), { mode: s } = Se(), a = ze(n, s), r = a ? { ...a, background: "var(--bg)", color: "var(--text)" } : {};
  return /* @__PURE__ */ l("div", { "data-sm-theme": n, style: { display: "flow-root", boxSizing: "border-box", ...t, ...r }, children: e });
}
function ve() {
  const e = getComputedStyle(document.documentElement);
  return ["--bg", "--accent", "--text"].map((t) => e.getPropertyValue(t).trim() || "transparent");
}
function Ft() {
  const [e, t] = g(ve);
  return x(() => {
    const n = new MutationObserver(() => t(ve()));
    return n.observe(document.documentElement, { attributes: !0, attributeFilter: ["class", "style", "data-theme", "data-mode"] }), () => n.disconnect();
  }, []), e;
}
function ye({ id: e, mode: t }) {
  const n = Ft(), s = Mt(e, t) ?? n;
  return /* @__PURE__ */ l("span", { className: "sm-swatch", "aria-hidden": "true", children: s.map((a, r) => /* @__PURE__ */ l("i", { style: { background: a } }, r)) });
}
function In() {
  const [e, t] = Oe(), { mode: n } = Se(), s = B.find((a) => a.id === e) ?? B[0];
  return /* @__PURE__ */ l(
    Me,
    {
      width: 230,
      align: "right",
      popup: "menu",
      label: "Theme",
      trigger: (a) => /* @__PURE__ */ h("button", { type: "button", className: "sm-plain sm-chip", "data-testid": "theme-chip", "aria-label": `Theme: ${s.name}`, ...a, children: [
        /* @__PURE__ */ l(ye, { id: s.id, mode: n }),
        "Theme",
        /* @__PURE__ */ l(De, {})
      ] }),
      children: (a) => /* @__PURE__ */ l(Nt, { label: "Theme", children: B.map((r) => /* @__PURE__ */ h(
        "button",
        {
          type: "button",
          role: "menuitemradio",
          "aria-checked": r.id === e,
          className: "sm-plain sm-row",
          onClick: () => {
            t(r.id), a();
          },
          children: [
            /* @__PURE__ */ l(ye, { id: r.id, mode: n }),
            /* @__PURE__ */ l("span", { className: "sm-ellipsis", children: r.name }),
            r.id === e && /* @__PURE__ */ l("span", { className: "sm-check", "aria-hidden": "true", children: "✓" })
          ]
        },
        r.id
      )) })
    }
  );
}
export {
  L as $,
  ct as A,
  cn as B,
  De as C,
  Me as D,
  Qt as E,
  xn as F,
  se as G,
  kn as H,
  Sn as I,
  oe as J,
  sn as K,
  Cn as L,
  w as M,
  an as N,
  rn as O,
  nn as P,
  yn as Q,
  vt as R,
  lt as S,
  En as T,
  j as U,
  k as V,
  un as W,
  pn as X,
  mn as Y,
  gn as Z,
  hn as _,
  Z as a,
  Te as b,
  ln as c,
  Xt as d,
  Jt as e,
  Zt as f,
  en as g,
  wn as h,
  vn as i,
  I as j,
  M as k,
  Nt as l,
  In as m,
  Et as n,
  Vt as o,
  $n as p,
  Gt as q,
  on as r,
  H as s,
  tn as t,
  Kt as u,
  Yt as v,
  bn as w,
  qt as x,
  dn as y,
  fn as z
};
