import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Circle, Plus } from "lucide-react";
import { supabase } from "../supabaseClient";
import { inp, btn, btnGhost, mediaUrl, IMG_TYPES, MAX_IMG, safeName, SKILLS, SERVICES, ChipPicker, MIN_SITE } from "./ui";
import { useLang } from "../i18n/LangContext";
import SitePhotos from "./SitePhotos";
import CvUpload from "./CvUpload";
import { CertForm } from "./TechnicianPanel";
import { technicianProgress, companyProgress } from "./progress";

export const logoSrc = (p) => (!p ? null : /^https?:/.test(p) ? p : mediaUrl(p));

// Big round picker used for the profile picture (technician) and the logo (company).
export function PhotoPicker({ src, onFile, label, changeLabel, busy }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <label className="relative cursor-pointer group">
        {src
          ? <img src={src} alt="" className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl" />
          : <div className="w-40 h-40 rounded-full border-2 border-dashed border-signal/60 bg-signal/5 flex flex-col items-center justify-center text-signalDark gap-1">
              <Camera className="w-9 h-9" /><span className="text-xs font-semibold">{label}</span>
            </div>}
        {src && <span className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-signal text-white flex items-center justify-center shadow-lg"><Camera className="w-5 h-5" /></span>}
        <input type="file" accept={IMG_TYPES.join(",")} className="sr-only" onChange={onFile} disabled={busy} />
      </label>
      {src && <span className="text-sm text-signal font-medium">{changeLabel}</span>}
    </div>
  );
}

function Shell({ n, total, title, hint, children, onBack, onNext, nextLabel, nextDisabled, onSkip, busy, msg, t }) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-medium text-slateSoft mb-2">
          <span>{t("Step {n} of {total}", { n, total })}</span>
          <span>{Math.round((n / total) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-line overflow-hidden" role="progressbar" aria-valuenow={n} aria-valuemin={1} aria-valuemax={total}>
          <div className="h-full bg-gradient-to-r from-signal to-brass transition-all duration-500" style={{ width: `${(n / total) * 100}%` }} />
        </div>
      </div>
      <div className="bg-card border border-line rounded-3xl p-5 sm:p-8 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">{title}</h1>
        {hint && <p className="text-slateSoft mt-2">{hint}</p>}
        <div className="mt-6">{children}</div>
        {msg && <p role="status" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{msg}</p>}
        <div className="mt-8 flex items-center gap-3">
          {onBack && <button type="button" onClick={onBack} className={btnGhost} aria-label={t("Back")}><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">{t("Back")}</span></button>}
          {onNext && (
            <button type="button" onClick={onNext} disabled={nextDisabled || busy} className={btn + " flex-1"}>
              {busy ? t("Saving…") : nextLabel || t("Save and continue")}{!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
        {onSkip && <button type="button" onClick={onSkip} className="mt-4 w-full text-sm text-slateSoft hover:text-slate">{t("Skip for now")}</button>}
      </div>
    </div>
  );
}

export default function Onboarding({ role, user, profile, onExit }) {
  const { t } = useLang();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [tech, setTech] = useState(null);
  const [company, setCompany] = useState(null);
  const [phone, setPhone] = useState(profile.phone || "");
  const [certs, setCerts] = useState(0);
  const [photos, setPhotos] = useState(0);
  const [f, setF] = useState({ city: "", headline: "", years: "", skills: [], bio: "", name: "", description: "", services: [], website: "", extra: "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const isTech = role === "technician";

  const load = useCallback(async (first = false) => {
    if (isTech) {
      let { data: row } = await supabase.from("technicians").select("*").eq("id", user.id).maybeSingle();
      if (!row) {
        await supabase.from("technicians").insert({ id: user.id, display_name: profile.full_name || "Technician" });
        ({ data: row } = await supabase.from("technicians").select("*").eq("id", user.id).maybeSingle());
      }
      const [{ data: pr }, c, p] = await Promise.all([
        supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle(),
        supabase.from("certifications").select("id", { count: "exact", head: true }).eq("technician_id", user.id),
        supabase.from("site_photos").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
      ]);
      setTech(row); setPhone(pr?.phone || ""); setCerts(c.count || 0); setPhotos(p.count || 0);
      if (first && row) setF((s) => ({ ...s, city: row.city || "", headline: row.headline || "", years: row.years_experience ?? "", skills: row.skills || [], bio: row.bio || "" }));
    } else {
      let { data: row } = await supabase.from("companies").select("*").eq("owner_id", user.id).limit(1).maybeSingle();
      if (!row) {
        await supabase.from("companies").insert({ owner_id: user.id, name: profile.full_name || "My company" });
        ({ data: row } = await supabase.from("companies").select("*").eq("owner_id", user.id).limit(1).maybeSingle());
      }
      const p = await supabase.from("site_photos").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
      setCompany(row); setPhotos(p.count || 0);
      if (first && row) setF((s) => ({ ...s, name: row.name || "", city: row.city || "", description: row.description || "", services: row.services || [], website: row.website || "", extra: row.phone || "" }));
    }
  }, [isTech, user.id, profile.full_name]);

  useEffect(() => { load(true).then(() => setReady(true)); }, [load]);

  const prog = isTech ? technicianProgress({ tech, phone, certs, photos, cv: tech?.cv_path }) : companyProgress({ company, photos });

  const upload = async (e, apply) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!IMG_TYPES.includes(file.type)) return setMsg(t("Use a JPG, PNG or WebP photo."));
    if (file.size > MAX_IMG) return setMsg(t("Photo must be under 2 MB."));
    setBusy(true); setMsg("");
    const path = `${user.id}/photo-${Date.now()}-${safeName(file.name)}`;
    const up = await supabase.storage.from("portfolio").upload(path, file);
    if (up.error) { setBusy(false); return setMsg(up.error.message); }
    const { error } = await apply(path);
    if (error) { await supabase.storage.from("portfolio").remove([path]); setBusy(false); return setMsg(error.message); }
    setBusy(false);
    load();
  };

  const run = async (fn) => {
    setBusy(true); setMsg("");
    const error = await fn();
    setBusy(false);
    if (error) return setMsg(error.message || t("Something went wrong. Try again."));
    await load();
    setStep((s) => s + 1);
  };

  const updTech = (row) => supabase.from("technicians").update(row).eq("id", user.id).then((r) => r.error);
  const updCo = (row) => supabase.from("companies").update(row).eq("id", company.id).then((r) => r.error);

  if (!ready) return <p className="text-center text-slateSoft">{t("Loading…")}</p>;

  const finishChecks = (
    <ul className="space-y-2">
      {prog.items.map(([label, ok]) => (
        <li key={label} className="flex items-center gap-2.5 text-sm">
          {ok ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" /> : <Circle className="w-5 h-5 text-slateSoft shrink-0" />}
          <span className={ok ? "" : "text-slateSoft"}>{t(label)}</span>
        </li>
      ))}
    </ul>
  );

  const techSteps = [
    { title: t("Add your profile picture"), hint: t("A clear photo of your face helps clients and companies trust you."),
      body: <PhotoPicker src={tech?.photo_path ? mediaUrl(tech.photo_path) : null} label={t("Choose a photo")} changeLabel={t("Change photo")} busy={busy}
        onFile={(e) => upload(e, async (path) => {
          const r = await supabase.from("technicians").update({ photo_path: path }).eq("id", user.id);
          if (!r.error && tech?.photo_path) await supabase.storage.from("portfolio").remove([tech.photo_path]);
          return r;
        })} />,
      next: () => setStep(step + 1), nextDisabled: !tech?.photo_path, nextLabel: t("Continue") },
    { title: t("Where can people reach you?"), hint: t("Your phone is private. Only Tricore admins and companies you apply to can see it."),
      body: (<div className="space-y-3">
        <input className={inp} type="tel" autoComplete="tel" placeholder={t("Phone / WhatsApp")} aria-label={t("Phone / WhatsApp")} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={inp} autoComplete="address-level2" placeholder={t("City")} aria-label={t("City")} value={f.city} onChange={set("city")} />
      </div>),
      next: () => run(async () => {
        const a = await supabase.from("profiles").update({ phone: phone.trim() || null }).eq("id", user.id);
        return a.error || (await updTech({ city: f.city.trim() }));
      }), nextDisabled: !phone.trim() || !f.city.trim() },
    { title: t("What do you do?"), hint: t("One short line that appears under your name."),
      body: (<div className="space-y-4">
        <input className={inp} placeholder={t("Headline (e.g. CCTV & network installer)")} aria-label={t("Headline")} value={f.headline} onChange={set("headline")} />
        <div className="flex flex-wrap gap-2">
          {["CCTV installer", "Network technician", "Access control & alarms"].map((s) => (
            <button key={s} type="button" onClick={() => setF({ ...f, headline: t(s) })} className="text-sm px-3 py-1.5 rounded-full border border-line bg-white hover:border-signal">{t(s)}</button>
          ))}
        </div>
        <label className="block text-sm font-medium">{t("Years of experience")}
          <div className="mt-2 flex items-center gap-3">
            <button type="button" className={btnGhost + " !px-4"} onClick={() => setF({ ...f, years: Math.max(0, Number(f.years || 0) - 1) })} aria-label="-1">−</button>
            <input className={inp + " text-center max-w-[6rem]"} type="number" min="0" inputMode="numeric" value={f.years} onChange={set("years")} />
            <button type="button" className={btnGhost + " !px-4"} onClick={() => setF({ ...f, years: Number(f.years || 0) + 1 })} aria-label="+1"><Plus className="w-4 h-4" /></button>
          </div>
        </label>
      </div>),
      next: () => run(() => updTech({ headline: f.headline.trim(), years_experience: f.years === "" ? null : Number(f.years) })),
      nextDisabled: !f.headline.trim() || f.years === "" },
    { title: t("Pick your skills"), hint: t("Tap everything you can do. You can add your own too."),
      body: (<div className="space-y-4">
        <ChipPicker options={SKILLS} value={f.skills} onChange={(skills) => setF({ ...f, skills })} />
        <AddOwn t={t} onAdd={(v) => setF((s) => ({ ...s, skills: s.skills.includes(v) ? s.skills : [...s.skills, v] }))} />
      </div>),
      next: () => run(() => updTech({ skills: f.skills })), nextDisabled: !f.skills.length },
    { title: t("Tell us about yourself"), hint: t("Two or three sentences: what you install, where you work, what you are proud of."),
      body: <textarea className={inp} rows={6} placeholder={t("About you and your work")} aria-label={t("About you and your work")} value={f.bio} onChange={set("bio")} />,
      next: () => run(() => updTech({ bio: f.bio.trim() })), nextDisabled: f.bio.trim().length < 20 },
    { title: t("Add a certificate"), hint: t("Upload at least one training certificate (Hikvision, Dahua, Gallagher, IDS and others)."),
      body: (<div className="space-y-3">
        {certs > 0 && <p className="text-sm text-green-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{t("Certification added.")} ({certs})</p>}
        <CertForm userId={user.id} onDone={() => load()} setMsg={setMsg} />
      </div>),
      next: () => setStep(step + 1), nextDisabled: certs < 1, nextLabel: t("Continue") },
    { title: t("Add site photos"), hint: t("Add at least {min} and at most {max} photos from real sites where you can be seen working.", { min: MIN_SITE, max: 10 }),
      body: <SitePhotos ownerId={user.id} onCount={setPhotos} />,
      next: () => setStep(step + 1), nextDisabled: photos < MIN_SITE, nextLabel: t("Continue") },
    { title: t("Upload your CV"), hint: t("Companies that are hiring will read it when you apply. PDF or Word, up to 5 MB."),
      body: <CvUpload userId={user.id} cvPath={tech?.cv_path} onChange={() => load()} />,
      next: () => setStep(step + 1), nextLabel: t("Continue") },
    { title: t("You are all set"), hint: t("Your profile is {n}% ready", { n: prog.percent }), body: finishChecks, last: true },
  ];

  const coSteps = [
    { title: t("Add your company logo"), hint: t("Your logo is the profile picture people see first."),
      body: <PhotoPicker src={logoSrc(company?.logo_url)} label={t("Choose a logo")} changeLabel={t("Change logo")} busy={busy}
        onFile={(e) => upload(e, async (path) => supabase.from("companies").update({ logo_url: path }).eq("id", company.id))} />,
      next: () => setStep(step + 1), nextDisabled: !company?.logo_url, nextLabel: t("Continue") },
    { title: t("Who are you?"), hint: null,
      body: (<div className="space-y-3">
        <input className={inp} placeholder={t("Company name")} aria-label={t("Company name")} value={f.name} onChange={set("name")} />
        <input className={inp} placeholder={t("City")} aria-label={t("City")} value={f.city} onChange={set("city")} />
        <input className={inp} type="tel" placeholder={t("Phone / WhatsApp for hiring")} aria-label={t("Phone / WhatsApp for hiring")} value={f.extra} onChange={set("extra")} />
      </div>),
      next: () => run(() => updCo({ name: f.name.trim(), city: f.city.trim(), phone: f.extra.trim() || null })), nextDisabled: !f.name.trim() || !f.city.trim() },
    { title: t("What does your company do?"), hint: null,
      body: (<div className="space-y-4">
        <textarea className={inp} rows={4} placeholder={t("What does your company do?")} aria-label={t("What does your company do?")} value={f.description} onChange={set("description")} />
        <p className="text-sm font-medium">{t("Pick your services")}</p>
        <ChipPicker options={SERVICES} value={f.services} onChange={(services) => setF({ ...f, services })} />
      </div>),
      next: () => run(() => updCo({ description: f.description.trim(), services: f.services })), nextDisabled: !f.description.trim() || !f.services.length },
    { title: t("Show your team on site"), hint: t("Add at least {min} and at most {max} photos of your team working on real sites.", { min: MIN_SITE, max: 10 }),
      body: <SitePhotos ownerId={user.id} onCount={setPhotos} />,
      next: () => setStep(step + 1), nextDisabled: photos < MIN_SITE, nextLabel: t("Continue") },
    { title: t("Ready to hire?"), hint: t("Post your first vacancy so technicians can apply with their CV."), body: finishChecks, last: true, company: true },
  ];

  const steps = isTech ? techSteps : coSteps;
  const i = Math.min(step, steps.length - 1);
  const s = steps[i];

  return (
    <Shell n={i + 1} total={steps.length} title={s.title} hint={s.hint} t={t} busy={busy} msg={msg}
      onBack={i > 0 ? () => { setMsg(""); setStep(i - 1); } : null}
      onNext={s.last ? () => onExit(s.company ? "hiring" : undefined) : s.next}
      nextLabel={s.last ? (s.company ? t("Post a vacancy") : t("Finish setup")) : s.nextLabel}
      nextDisabled={s.last ? false : s.nextDisabled}
      onSkip={s.last ? null : () => { setMsg(""); setStep(i + 1); }}>
      {s.body}
      {i === 0 && <p className="mt-6 text-center"><button type="button" onClick={() => onExit("later")} className="text-xs text-slateSoft underline">{t("Set up later")}</button></p>}
    </Shell>
  );
}

function AddOwn({ onAdd, t }) {
  const [v, setV] = useState("");
  const add = () => { const x = v.trim(); if (x) { onAdd(x); setV(""); } };
  return (
    <div className="flex gap-2">
      <input className={inp} placeholder={t("Add another skill")} aria-label={t("Add another skill")} value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
      <button type="button" className={btnGhost} onClick={add}>{t("Add")}</button>
    </div>
  );
}
