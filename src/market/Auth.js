import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Wrench, Building2, Search, FileText, Users, BadgeCheck } from "lucide-react";
import { supabase } from "../supabaseClient";
import { inp, btn } from "./ui";
import { useLang } from "../i18n/LangContext";
import heroImg from "../assets/hero-security.jpg";

const GoogleMark = () => (
  <svg className="w-5 h-5" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.59 8.59 0 0 0 9 0 9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
  </svg>
);

const ROLES = [
  ["technician", "Technician", "Find work and get hired", Wrench],
  ["company", "Company", "Hire people and list your company", Building2],
  ["requester", "Client", "Request a technician", Search],
];

// Brand side of the split screen (full panel on desktop, compact banner on phones).
export function BrandPanel() {
  const { t } = useLang();
  const perks = [
    [Users, "Get found by clients who need CCTV, access control and networks."],
    [FileText, "Upload your CV and apply to companies that are hiring."],
    [BadgeCheck, "Every technician is checked by Tricore before they go public."],
  ];
  return (
    <aside className="relative overflow-hidden bg-ink text-white lg:w-[46%] lg:min-h-[calc(100vh-4rem)]">
      <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/90 to-forest/80" />
      <div className="relative px-6 py-6 lg:px-12 lg:py-16 flex flex-col gap-6 lg:gap-10 h-full">
        <h2 className="font-display font-semibold text-xl sm:text-2xl lg:text-4xl leading-tight max-w-md">
          {t("Where installers get found and companies find installers.")}
        </h2>
        <ul className="hidden lg:block space-y-5 max-w-md">
          {perks.map(([Icon, text]) => (
            <li key={text} className="flex gap-4">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-brassLight">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-white/80 leading-relaxed">{t(text)}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function Auth() {
  const nav = useNavigate();
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode") === "signup" ? "signup" : params.get("mode") === "forgot" ? "forgot" : "login";
  const [f, setF] = useState({ email: "", password: "", full_name: "", role: params.get("role") || "technician" });
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (m) => { setMsg(""); setOk(false); setParams(m === "login" ? {} : { mode: m }); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(""); setOk(false);
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      setOk(!error);
      return setMsg(error ? error.message : t("Check your email for the reset link."));
    }
    const r = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      : await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { role: f.role, full_name: f.full_name } } });
    setBusy(false);
    if (r.error) return setMsg(r.error.message);
    if (r.data.session) nav("/dashboard");
    else { setOk(true); setMsg(t("Check your email to confirm your account, then sign in.")); }
  };

  const withGoogle = async () => {
    setMsg(""); setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
    if (error) { setBusy(false); setMsg(error.message); }
  };

  return (
    <div className="-mx-4 -mt-6 md:-mt-10 -mb-28 md:-mb-12 lg:flex bg-paper">
      <BrandPanel />
      <section className="flex-1 flex items-start lg:items-center justify-center px-4 py-8 lg:py-12 pb-32 lg:pb-12">
        <div className="w-full max-w-md">
          {mode !== "forgot" && (
            <div className="grid grid-cols-2 p-1 bg-white border border-line rounded-2xl mb-6" role="tablist">
              {[["login", "Sign in"], ["signup", "Sign up"]].map(([m, label]) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => go(m)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition ${mode === m ? "bg-ink text-white shadow" : "text-slateSoft hover:text-slate"}`}>
                  {t(label)}
                </button>
              ))}
            </div>
          )}

          <h1 className="font-display text-2xl sm:text-3xl font-semibold">
            {mode === "forgot" ? t("Reset your password") : mode === "login" ? t("Welcome back") : t("Create account")}
          </h1>
          <p className="text-slateSoft mt-1 mb-6">
            {mode === "forgot" ? t("Enter your email and we will send you a link to choose a new password.")
              : mode === "login" ? t("Sign in to continue your profile, job requests and applications.")
              : t("Join Tricore in two minutes. Free while we launch.")}
          </p>

          {mode !== "forgot" && (
            <>
              <button type="button" onClick={withGoogle} disabled={busy}
                className="w-full flex items-center justify-center gap-3 border border-line rounded-xl px-4 py-3 font-semibold bg-white hover:bg-paper disabled:opacity-50 transition">
                <GoogleMark /> {t("Continue with Google")}
              </button>
              <div className="flex items-center gap-3 text-xs text-slateSoft my-5">
                <div className="h-px bg-line flex-1" /> {t("or with email")} <div className="h-px bg-line flex-1" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <fieldset>
                  <legend className="text-sm font-medium mb-2">{t("I am a")}</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(([value, label, hint, Icon]) => (
                      <button key={value} type="button" onClick={() => setF({ ...f, role: value })} aria-pressed={f.role === value} title={t(hint)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-semibold transition ${f.role === value ? "border-signal bg-signal/10 text-signalDark ring-2 ring-signal" : "border-line bg-white hover:border-signal"}`}>
                        <Icon className="w-5 h-5" />{t(label)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slateSoft mt-2">{t(ROLES.find((r) => r[0] === f.role)[2])}</p>
                </fieldset>
                <input className={inp} placeholder={t("Full name")} aria-label={t("Full name")} required autoComplete="name" value={f.full_name} onChange={set("full_name")} />
              </>
            )}
            <input className={inp} type="email" placeholder={t("Email")} aria-label={t("Email")} required autoComplete="email" value={f.email} onChange={set("email")} />
            {mode !== "forgot" && (
              <div className="relative">
                <input className={inp + " pr-12"} type={show ? "text" : "password"} placeholder={t("Password (min 6 characters)")} aria-label={t("Password")}
                  required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={set("password")} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? t("Hide password") : t("Show password")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slateSoft p-1">
                  {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}
            {msg && <p role="status" className={`text-sm rounded-xl px-3 py-2 border ${ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>{msg}</p>}
            <button className={btn + " w-full"} disabled={busy}>
              {busy ? t("Please wait…") : mode === "forgot" ? t("Send reset link") : mode === "login" ? t("Sign in") : t("Sign up")}
            </button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-2 text-sm">
            {mode === "login" && <button type="button" className="text-signal font-medium" onClick={() => go("forgot")}>{t("Forgot password?")}</button>}
            {mode === "forgot" && <button type="button" className="text-signal font-medium" onClick={() => go("login")}>{t("Back to sign in")}</button>}
            {mode === "login" && <button type="button" className="text-slateSoft" onClick={() => go("signup")}>{t("New here? Create an account")}</button>}
            {mode === "signup" && <button type="button" className="text-slateSoft" onClick={() => go("login")}>{t("Already registered? Sign in")}</button>}
            {mode === "signup" && <p className="text-xs text-slateSoft text-center mt-2">{t("Signing up with Google? You will pick technician, company or client right after you continue.")}</p>}
          </div>
          <p className="text-center mt-8"><Link to="/" className="text-xs text-slateSoft underline">{t("Back to website")}</Link></p>
        </div>
      </section>
    </div>
  );
}
