import React, { createContext, useCallback, useContext, useState } from "react";
import sw from "./sw";

// Swahili applies to forms and dashboards only. The English text IS the key,
// so a missing translation simply stays in English.
const Ctx = createContext({ lang: "en", setLang: () => {}, t: (s) => s });
export const useLang = () => useContext(Ctx);

const KEY = "tricore_lang";

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem(KEY) === "sw" ? "sw" : "en"; } catch { return "en"; }
  });

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem(KEY, l); } catch { /* storage blocked: stay in memory */ }
  }, []);

  const t = useCallback((s, vars) => {
    let out = lang === "sw" && sw[s] ? sw[s] : s;
    if (vars) Object.keys(vars).forEach((k) => { out = out.split(`{${k}}`).join(vars[k]); });
    return out;
  }, [lang]);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function LangSwitch({ className = "", dark = true }) {
  const { lang, setLang } = useLang();
  const base = dark ? "bg-white/10 border-white/15 text-white" : "bg-white border-line text-slate";
  const on = "bg-signal text-white";
  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-full border p-0.5 text-xs font-semibold ${base} ${className}`}>
      {[["en", "EN"], ["sw", "SW"]].map(([code, label]) => (
        <button key={code} type="button" onClick={() => setLang(code)} aria-pressed={lang === code}
          className={`px-2.5 py-1 rounded-full transition-colors ${lang === code ? on : "opacity-70 hover:opacity-100"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}
