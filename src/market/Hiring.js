import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, FileText, UserRound, Building2, Briefcase } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { inp, btn, btnGhost, card, Avatar, openCv } from "./ui";
import { logoSrc } from "./Onboarding";
import { useLang } from "../i18n/LangContext";

const TYPES = [["full_time", "Full time"], ["part_time", "Part time"], ["contract", "Contract"], ["internship", "Internship"]];
const typeLabel = (v) => TYPES.find((x) => x[0] === v)?.[1] || v;
const APP_STATUS = { applied: "Applied", shortlisted: "Shortlisted", hired: "Hired", rejected: "Rejected" };
const appCls = { applied: "bg-paper text-slateSoft border-line", shortlisted: "bg-amber-50 text-amber-800 border-amber-300", hired: "bg-green-50 text-green-800 border-green-300", rejected: "bg-red-50 text-red-700 border-red-200" };
const Pill = ({ s }) => { const { t } = useLang(); return <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${appCls[s]}`}>{t(APP_STATUS[s])}</span>; };

/* ---------- company side ---------- */

function VacancyForm({ company, user, onDone }) {
  const { t } = useLang();
  const empty = { title: "", description: "", city: company?.city || "", job_type: "full_time", skills: "", contact: company?.phone || "" };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (!company) return <p className="text-sm text-slateSoft">{t("Save your company profile before posting a vacancy.")}</p>;

  const submit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("vacancies").insert({
      company_id: company.id, owner_id: user.id, title: f.title.trim(), description: f.description.trim(), city: f.city.trim(),
      job_type: f.job_type, contact: f.contact.trim() || null, skills: f.skills.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setOk(!error);
    setMsg(error ? error.message : t("Vacancy published."));
    if (!error) { setF(empty); onDone(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inp} required placeholder={t("Job title (e.g. CCTV installer)")} aria-label={t("Job title")} value={f.title} onChange={set("title")} />
      <textarea className={inp} rows={4} placeholder={t("What will they do? What do you expect?")} value={f.description} onChange={set("description")} />
      <div className="grid sm:grid-cols-2 gap-3">
        <select className={inp} value={f.job_type} onChange={set("job_type")} aria-label={t("Job type")}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
        </select>
        <input className={inp} placeholder={t("City")} value={f.city} onChange={set("city")} />
      </div>
      <input className={inp} placeholder={t("Skills wanted, separated by commas")} value={f.skills} onChange={set("skills")} />
      <input className={inp} type="tel" placeholder={t("Phone or WhatsApp for applicants")} value={f.contact} onChange={set("contact")} />
      {msg && <p role="status" className={`text-sm ${ok ? "text-green-700" : "text-red-700"}`}>{msg}</p>}
      <button className={btn}>{t("Publish vacancy")}</button>
    </form>
  );
}

function Applicants({ vacancyId }) {
  const { t } = useLang();
  const [rows, setRows] = useState(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("applications")
      .select("*, technicians(id, display_name, headline, city, photo_path, cv_path, years_experience)")
      .eq("vacancy_id", vacancyId).order("created_at", { ascending: false });
    setRows(data || []);
  }, [vacancyId]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => { await supabase.from("applications").update({ status }).eq("id", id); load(); };

  if (!rows) return <p className="text-sm text-slateSoft">{t("Loading…")}</p>;
  if (!rows.length) return <p className="text-sm text-slateSoft">{t("No applicants yet.")}</p>;
  return (
    <div className="space-y-3">
      {rows.map((a) => {
        const p = a.technicians;
        return (
          <div key={a.id} className="border border-line rounded-xl p-3 bg-white space-y-3">
            <div className="flex items-start gap-3">
              <Avatar path={p?.photo_path} name={p?.display_name || ""} size="w-12 h-12" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{p?.display_name}</span><Pill s={a.status} />
                </div>
                <p className="text-sm text-slateSoft">{p?.headline}{p?.city && ` · ${p.city}`}{p?.years_experience != null && ` · ${p.years_experience} yrs`}</p>
                {a.contact && <p className="text-sm mt-1">{a.contact}</p>}
                {a.note && <p className="text-sm mt-1 bg-paper rounded-lg p-2 whitespace-pre-line">{a.note}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={btnGhost + " !py-2 !px-3 text-sm"} to={`/technicians/${p?.id}`}><UserRound className="w-4 h-4" />{t("View profile")}</Link>
              {p?.cv_path && <button className={btnGhost + " !py-2 !px-3 text-sm"} onClick={() => openCv(p.cv_path)}><FileText className="w-4 h-4" />{t("View CV")}</button>}
              {a.status !== "shortlisted" && a.status !== "hired" && <button className={btnGhost + " !py-2 !px-3 text-sm"} onClick={() => setStatus(a.id, "shortlisted")}>{t("Shortlist")}</button>}
              {a.status !== "hired" && <button className={btn + " !py-2 !px-3 text-sm"} onClick={() => setStatus(a.id, "hired")}>{t("Hire")}</button>}
              {a.status !== "rejected" && a.status !== "hired" && <button className="text-sm text-red-600 px-2" onClick={() => setStatus(a.id, "rejected")}>{t("Reject")}</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CompanyHiring({ user, company }) {
  const { t } = useLang();
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("vacancies").select("*, applications(id)").eq("owner_id", user.id).order("created_at", { ascending: false });
    setRows(data || []);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (v) => { await supabase.from("vacancies").update({ status: v.status === "open" ? "closed" : "open" }).eq("id", v.id); load(); };

  return (
    <div className="space-y-6">
      <div className={card}>
        <h2 className="font-semibold text-lg mb-3">{t("Post a vacancy")}</h2>
        <VacancyForm company={company} user={user} onDone={load} />
      </div>
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">{t("My vacancies")}</h2>
        {!rows ? <p className="text-slateSoft">{t("Loading…")}</p> : !rows.length ? <p className="text-slateSoft">{t("No vacancies yet.")}</p> : rows.map((v) => {
          const n = (v.applications || []).length;
          return (
            <div key={v.id} className={card + " space-y-3"}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="text-sm text-slateSoft">{t(typeLabel(v.job_type))}{v.city && ` · ${v.city}`}</p>
                </div>
                <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium shrink-0 ${v.status === "open" ? "bg-green-50 text-green-800 border-green-300" : "bg-paper text-slateSoft border-line"}`}>{t(v.status === "open" ? "Open" : "Closed")}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button className="text-sm font-medium text-signal" onClick={() => setOpen(open === v.id ? null : v.id)}>
                  {n === 1 ? t("1 applicant") : t("{n} applicants", { n })}
                </button>
                <button className="text-sm text-slateSoft underline" onClick={() => toggle(v)}>{v.status === "open" ? t("Close vacancy") : t("Reopen")}</button>
              </div>
              {open === v.id && <Applicants vacancyId={v.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- technician side ---------- */

function VacancyCard({ v, user, role, myApps, onApplied }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [cv, setCv] = useState(null);
  const [msg, setMsg] = useState("");
  const applied = myApps.includes(v.id);
  const c = v.companies;

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const [pr, tech] = await Promise.all([
        supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle(),
        supabase.from("technicians").select("cv_path").eq("id", user.id).maybeSingle(),
      ]);
      setPhone(pr.data?.phone || ""); setCv(tech.data?.cv_path || null);
    })();
  }, [open, user]);

  const send = async () => {
    const { error } = await supabase.from("applications").insert({ vacancy_id: v.id, technician_id: user.id, note: note.trim() || null, contact: phone.trim() || null });
    setMsg(error ? (error.code === "23503" ? t("Save your profile before applying.") : error.message) : t("Application sent."));
    if (!error) { setOpen(false); onApplied(); }
  };

  return (
    <div className={card + " space-y-3"}>
      <div className="flex items-start gap-3">
        {c?.logo_url
          ? <img src={logoSrc(c.logo_url)} alt="" className="w-12 h-12 rounded-xl object-cover border border-line" />
          : <div className="w-12 h-12 rounded-xl bg-forest text-white flex items-center justify-center"><Building2 className="w-5 h-5" /></div>}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">{v.title}</h3>
          <p className="text-sm text-slateSoft">{c?.name}</p>
          <p className="text-xs text-slateSoft mt-1 flex flex-wrap gap-x-3">
            <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" />{t(typeLabel(v.job_type))}</span>
            {v.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{v.city}</span>}
          </p>
        </div>
      </div>
      {v.description && <p className="text-sm whitespace-pre-line">{v.description}</p>}
      {(v.skills || []).length > 0 && <div className="flex flex-wrap gap-1">{v.skills.map((k) => <span key={k} className="text-xs bg-paper border border-line rounded-full px-2.5 py-0.5">{k}</span>)}</div>}

      {applied ? <p className="text-sm font-medium text-green-700">{t("You already applied")}</p>
        : !user ? <p className="text-sm"><Link className="text-signal font-medium" to="/login?mode=signup&role=technician">{t("Sign up")}</Link> / <Link className="text-signal font-medium" to="/login">{t("Sign in")}</Link></p>
        : role !== "technician" ? <p className="text-xs text-slateSoft">{t("Only technicians can apply.")}</p>
        : !open ? <button className={btn} onClick={() => setOpen(true)}>{t("Apply")}</button>
        : (
          <div className="space-y-3 border-t border-line pt-3">
            <p className="text-sm font-medium">{t("Apply with your profile")}</p>
            <p className={`text-xs ${cv ? "text-slateSoft" : "text-amber-700"}`}>{cv ? t("Your CV will be shared with this company.") : t("You have no CV yet. Upload one in your profile so companies can read it.")}</p>
            <input className={inp} type="tel" placeholder={t("Phone / WhatsApp")} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <textarea className={inp} rows={3} placeholder={t("Add a short note (optional)")} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex gap-2">
              <button className={btn} onClick={send}>{t("Send application")}</button>
              <button className={btnGhost} onClick={() => setOpen(false)}>{t("Cancel")}</button>
            </div>
          </div>
        )}
      {msg && <p role="status" className="text-sm text-signalDark">{msg}</p>}
    </div>
  );
}

export function VacancyList() {
  const { user, profile } = useAuth();
  const { t } = useLang();
  const [rows, setRows] = useState(null);
  const [myApps, setMyApps] = useState([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("vacancies").select("*, companies(name, city, logo_url, verified)").eq("status", "open").order("created_at", { ascending: false });
    setRows(data || []);
    if (user) {
      const a = await supabase.from("applications").select("vacancy_id").eq("technician_id", user.id);
      setMyApps((a.data || []).map((x) => x.vacancy_id));
    }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  if (!rows) return <p>{t("Loading…")}</p>;
  if (!rows.length) return <p className="text-slateSoft">{t("No openings right now. Check again soon.")}</p>;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {rows.map((v) => <VacancyCard key={v.id} v={v} user={user} role={profile?.role} myApps={myApps} onApplied={load} />)}
    </div>
  );
}

export function MyApplications({ user }) {
  const { t } = useLang();
  const [rows, setRows] = useState(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("applications").select("*, vacancies(title, city, companies(name))").eq("technician_id", user.id).order("created_at", { ascending: false });
    setRows(data || []);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  if (!rows) return <p>{t("Loading…")}</p>;
  return (
    <div className="space-y-3">
      {!rows.length && (
        <div className={card + " text-center space-y-3"}>
          <p className="text-slateSoft">{t("No openings right now. Check again soon.")}</p>
          <Link to="/jobs" className={btn}>{t("Browse openings")}</Link>
        </div>
      )}
      {rows.map((a) => (
        <div key={a.id} className={card + " flex items-center justify-between gap-3"}>
          <div className="min-w-0">
            <p className="font-semibold truncate">{a.vacancies?.title}</p>
            <p className="text-sm text-slateSoft truncate">{a.vacancies?.companies?.name}{a.vacancies?.city && ` · ${a.vacancies.city}`}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Pill s={a.status} />
            {a.status === "applied" && <button className="text-xs text-red-600" onClick={async () => { await supabase.from("applications").delete().eq("id", a.id); load(); }}>{t("Withdraw")}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
