import { jsx as e, jsxs as i, Fragment as v } from "react/jsx-runtime";
import { ContentSkeleton as y, Btn as S } from "@kirocrew/app-sdk/ui";
import { useState as x } from "react";
import { T as b, u as M, o as j, E as k, v as E, J as P, K as z, L as B, M as C, $ as N, S as O, N as T, P as $, F as w } from "./chunks/Theme-DcgEAU_h.mjs";
const A = 3e4, D = { padding: 12, fontSize: 13 };
function H({
  repo: s,
  projects: l,
  choose: r,
  reload: c
}) {
  const { overview: t, error: d } = j(s), [f, u] = x(null), m = k(f, s), o = E("/worktrees", s, A).value, g = ((o == null ? void 0 : o.overlaps) ?? []).filter((n) => n.severity === "high" || n.severity === "medium"), a = t == null ? void 0 : t.freshness, p = a ? P(z(a), a.commits_behind, a.ref) : null, h = B({ projects: l, activeKey: s, compact: !0, onPick: r, onReload: () => void c() });
  return /* @__PURE__ */ i("div", { style: { padding: 12, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", minHeight: 0 }, children: [
    h.menu,
    h.dialogs,
    d && !t && /* @__PURE__ */ e("p", { style: { fontSize: 13 }, children: d }),
    !t && !d && /* @__PURE__ */ e(y, { rows: 6 }),
    t && /* @__PURE__ */ i(v, { children: [
      /* @__PURE__ */ i("p", { style: { ...C, fontSize: 13, margin: "4px 0 8px" }, "data-testid": "panel-summary", children: [
        N(t.tables.length, "table"),
        t.manifest.commit ? ` at ${t.manifest.commit.slice(0, 7)}` : "",
        ". ",
        p == null ? void 0 : p.label
      ] }),
      g.map((n) => /* @__PURE__ */ i(
        "p",
        {
          "data-testid": "panel-collision",
          style: { display: "flex", gap: 6, alignItems: "flex-start", fontSize: 13, margin: "0 0 8px", overflowWrap: "anywhere" },
          children: [
            /* @__PURE__ */ e(O, { severity: n.severity }),
            /* @__PURE__ */ e("span", { children: n.summary })
          ]
        },
        `${n.a}|${n.b}`
      )),
      m ? /* @__PURE__ */ i("div", { style: { overflowY: "auto", minHeight: 0, flex: 1 }, children: [
        /* @__PURE__ */ i("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }, children: [
          /* @__PURE__ */ e(S, { onClick: () => u(null), children: "Back" }),
          /* @__PURE__ */ e("span", { style: { fontWeight: 600 }, children: m.name })
        ] }),
        /* @__PURE__ */ e(T, { node: m })
      ] }) : /* @__PURE__ */ e($, { tables: t.tables, selected: f, working: w(o), onSelect: u })
    ] })
  ] });
}
function F() {
  return /* @__PURE__ */ e(b, { style: { height: "100%" }, children: /* @__PURE__ */ e(K, {}) });
}
function K() {
  const { active: s, loaded: l, repos: r, choose: c, reload: t } = M();
  return l ? s ? /* @__PURE__ */ e(H, { repo: s, projects: r, choose: c, reload: t }, s) : /* @__PURE__ */ e("p", { style: D, children: "No projects yet. Open System Map from Apps to add one." }) : /* @__PURE__ */ e(y, { rows: 6 });
}
export {
  F as default
};
