import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { btn, btnGhost, card, Avatar, StatusPill } from "./ui";
import { useLang } from "../i18n/LangContext";
import TechnicianPanel from "./TechnicianPanel";
import CompanyPanel, { useCompany } from "./CompanyPanel";
import RoleSetup from "./RoleSetup";
import Onboarding, { logoSrc } from "./Onboarding";
import { technicianProgress } from "./progress";
import { CompanyHiring, MyApplications } from "./Hiring";
import { JobForm, JobList } from "./Jobs";

const Ring = ({ percent }) => {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${percent}%`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#d9bd76" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * percent) / 100} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">{percent}%</text>
    </svg>
  );
};

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-white border border-line rounded-2xl overflow-x-auto" role="tablist">
      {tabs.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={`flex-1 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition ${value === k ? "bg-ink text-white shadow" : "text-slateSoft hover:text-slate"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Hero({ name, avatar, subtitle, percent, next, onContinue, extra }) {
  const { t } = useLang();
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink text-white p-5 sm:p-7">
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-signal/20 blur-2xl" />
      <div className="relative flex items-center gap-4">
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="text-white/60 text-sm">{subtitle}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold truncate">{t("Welcome")}{name ? `, ${name}` : ""}</h1>
          {extra}
        </div>
        {percent != null && <div className="shrink-0"><Ring percent={percent} /></div>}
      </div>
      {percent != null && percent < 100 && (
        <div className="relative mt-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-white/10 border border-white/10 rounded-2xl p-3.5">
          <p className="text-sm">{next ? t("Next up: {step}", { step: t(next) }) : t("Your profile is {n}% ready", { n: percent })}</p>
          <button onClick={onContinue} className="inline-flex items-center justify-center gap-2 bg-signal hover:bg-signalDark rounded-xl px-4 py-2.5 text-sm font-semibold">
            {t("Continue setup")}<ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function TechnicianHome({ user, profile }) {
  const { t } = useLang();
  const [tab, setTab] = useState("overview");
  const [tech, setTech] = useState(null);
  const [prog, setProg] = useState(null);
  const [wizard, setWizard] = useState(false);
  const skipKey = `tricore_onb_${user.id}`;

  const load = useCallback(async () => {
    const [{ data: row }, { data: pr }, c, p] = await Promise.all([
      supabase.from("technicians").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle(),
      supabase.from("certifications").select("id", { count: "exact", head: true }).eq("technician_id", user.id),
      supabase.from("site_photos").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    ]);
    setTech(row);
    setProg(technicianProgress({ tech: row, phone: pr?.phone, certs: c.count || 0, photos: p.count || 0, cv: row?.cv_path }));
    return row;
  }, [user.id]);

  useEffect(() => {
    load().then((row) => {
      const editable = !row || row.status === "draft" || row.status === "changes_requested";
      let skipped = false;
      try { skipped = localStorage.getItem(skipKey) === "1"; } catch { /* ignore */ }
      if (editable && !skipped) setWizard(true);
    });
  }, [load, skipKey]);

  const exit = (target) => {
    if (target === "later") { try { localStorage.setItem(skipKey, "1"); } catch { /* ignore */ } }
    setWizard(false); setTab("overview"); load();
  };

  if (wizard) return <Onboarding role="technician" user={user} profile={profile} onExit={exit} />;

  return (
    <div className="space-y-6">
      <Hero name={profile.full_name} subtitle={t("technician account")}
        avatar={<Avatar path={tech?.photo_path} name={profile.full_name || ""} size="w-16 h-16" className="!border-white/30" />}
        percent={prog?.percent} next={prog?.next} onContinue={() => setWizard(true)}
        extra={tech && <div className="mt-1"><StatusPill status={tech.status} /></div>} />
      <Tabs value={tab} onChange={setTab} tabs={[["overview", t("Overview")], ["profile", t("My profile")], ["applications", t("Applications")]]} />
      {tab === "overview" && (
        <>
          <TechnicianPanel user={user} profile={profile} section="overview" />
          <Link to="/jobs" className={btnGhost + " w-full sm:w-auto"}>{t("Browse openings")}<ArrowRight className="w-4 h-4" /></Link>
        </>
      )}
      {tab === "profile" && <TechnicianPanel user={user} profile={profile} section="profile" />}
      {tab === "applications" && <MyApplications user={user} />}
    </div>
  );
}

function CompanyHome({ user, profile }) {
  const { t } = useLang();
  const { company, photos, setPhotos, reload, progress } = useCompany(user);
  const [tab, setTab] = useState("overview");
  const [wizard, setWizard] = useState(null);
  const skipKey = `tricore_onb_${user.id}`;

  useEffect(() => {
    if (company === undefined || wizard !== null) return;
    let skipped = false;
    try { skipped = localStorage.getItem(skipKey) === "1"; } catch { /* ignore */ }
    setWizard(!progress.complete && !skipped);
  }, [company, wizard, progress.complete, skipKey]);

  if (company === undefined || wizard === null) return <p>{t("Loading…")}</p>;

  const exit = (target) => {
    if (target === "later") { try { localStorage.setItem(skipKey, "1"); } catch { /* ignore */ } }
    setWizard(false); reload();
    setTab(target === "hiring" ? "hiring" : "overview");
  };

  if (wizard) return <Onboarding role="company" user={user} profile={profile} onExit={exit} />;

  return (
    <div className="space-y-6">
      <Hero name={profile.full_name} subtitle={company?.name || t("company account")}
        avatar={company?.logo_url ? <img src={logoSrc(company.logo_url)} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/30" /> : <Avatar name={company?.name || profile.full_name || ""} size="w-16 h-16" />}
        percent={progress.percent} next={progress.next} onContinue={() => setWizard(true)}
        extra={company?.verified && <p className="text-xs text-brassLight mt-1 inline-flex items-center gap-1"><BadgeCheck className="w-4 h-4" />Verified</p>} />
      <Tabs value={tab} onChange={setTab} tabs={[["overview", t("Overview")], ["company", t("Your company")], ["hiring", t("Hiring")]]} />
      {tab === "overview" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className={card + " space-y-3"}>
            <h2 className="font-semibold text-lg">{t("Profile checklist")}</h2>
            <ul className="space-y-1.5 text-sm">
              {progress.items.map(([label, ok]) => <li key={label} className={ok ? "text-green-700" : "text-slateSoft"}>{ok ? "✓" : "○"} {t(label)}</li>)}
            </ul>
          </div>
          <div className={card + " space-y-3"}>
            <h2 className="font-semibold text-lg">{t("Hiring")}</h2>
            <p className="text-sm text-slateSoft">{t("Post a vacancy so technicians can apply with their CV.")}</p>
            <button className={btn} onClick={() => setTab("hiring")}>{t("Post a vacancy")}</button>
            <Link to="/technicians" className={btnGhost + " w-full"}>{t("Technicians")}</Link>
          </div>
        </div>
      )}
      {tab === "company" && <CompanyPanel user={user} company={company} reload={reload} setPhotos={setPhotos} />}
      {tab === "hiring" && <CompanyHiring user={user} company={company} />}
      <span className="hidden">{photos}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const { t } = useLang();
  const [key, setKey] = useState(0);

  if (loading) return <p>{t("Loading…")}</p>;
  if (!user) return <p><Link className="text-signal underline" to="/login">{t("Sign in")}</Link> {t("to open your dashboard.")}</p>;
  if (!profile) return <p>{t("Setting up your account… refresh in a moment.")}</p>;
  if (!profile.role_selected) return <RoleSetup />;

  if (profile.role === "technician") return <TechnicianHome user={user} profile={profile} />;
  if (profile.role === "company") return <CompanyHome user={user} profile={profile} />;

  return (
    <div className="space-y-6">
      <Hero name={profile.full_name} subtitle={t("requester account")} avatar={<Avatar name={profile.full_name || ""} size="w-16 h-16" />} />
      {profile.is_admin && <p><Link className="text-signal underline" to="/admin">{t("Open admin: review technicians")} →</Link></p>}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={card}>
          <h2 className="font-semibold text-lg mb-3">{t("Request a technician")}</h2>
          <JobForm onDone={() => setKey(key + 1)} />
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-3">{t("My requests")}</h2>
          <JobList mine refreshKey={key} />
        </div>
      </div>
    </div>
  );
}
