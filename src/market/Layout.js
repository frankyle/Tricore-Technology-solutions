import React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Shield, Home, Users, Building2, BriefcaseBusiness, UserRound, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { useLang, LangSwitch } from "../i18n/LangContext";

// Language switch only shows where there are forms and dashboards to translate.
const TRANSLATED = ["/login", "/reset-password", "/dashboard", "/jobs"];

export default function Layout() {
  const { user, profile } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const showLang = TRANSLATED.some((p) => pathname.startsWith(p));
  const signOut = async () => { await supabase.auth.signOut(); nav("/"); };

  const desk = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white"}`;

  // Bottom bar (phones): every important destination is one tap away.
  const tabs = [
    ["/", t("Home"), Home],
    ["/technicians", t("Technicians"), Users],
    ["/companies", t("Companies"), Building2],
    ["/jobs", t("Jobs"), BriefcaseBusiness],
    user ? ["/dashboard", t("Dashboard"), UserRound] : ["/login", t("Sign in"), LogIn],
  ];

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-ink/95 backdrop-blur-xl text-white border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-signal to-signalDark flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5" />
            </span>
            <span className="leading-none hidden sm:block">
              <span className="block font-display font-bold tracking-[0.08em]">TRICORE</span>
              <span className="hidden sm:block mt-1 text-[10px] tracking-[0.16em] text-white/55">Technician network</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink className={desk} to="/technicians">{t("Technicians")}</NavLink>
            <NavLink className={desk} to="/companies">{t("Companies")}</NavLink>
            <NavLink className={desk} to="/jobs">{t("Jobs")}</NavLink>
            {profile?.is_admin && <NavLink className={desk} to="/admin">{t("Admin")}</NavLink>}
            {user && <NavLink className={desk} to="/dashboard">{t("Dashboard")}</NavLink>}
          </nav>

          <div className="flex items-center gap-2">
            {showLang && <LangSwitch />}
            {user ? (
              <button onClick={signOut} aria-label={t("Sign out")}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white px-3 py-2 rounded-lg border border-white/15">
                <LogOut className="w-4 h-4" /><span className="hidden sm:inline">{t("Sign out")}</span>
              </button>
            ) : (
              <>
                <Link to="/login" className="whitespace-nowrap text-sm font-semibold px-3 py-2 rounded-xl border border-white/25 hover:bg-white/10">
                  {t("Sign in")}
                </Link>
                <Link to="/login?mode=signup" className="whitespace-nowrap text-sm font-semibold px-3.5 py-2 rounded-xl bg-signal hover:bg-signalDark shadow-lg shadow-black/20">
                  {t("Sign up")}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10 pb-28 md:pb-12"><Outlet /></main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ink/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {tabs.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? "text-white" : "text-white/55"}`}>
              {({ isActive }) => (
                <>
                  <span className={`w-10 h-7 rounded-full flex items-center justify-center transition ${isActive ? "bg-signal" : ""}`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
