import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CheckCircle2, Circle, FileText, Trash2, Plus } from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  inp, btn, card, mediaUrl, MAX_IMG, MAX_CERT, IMG_TYPES, CERT_TYPES, BRANDS,
  MAX_PROJECTS, IMAGES_PER_PROJECT, safeName, openCertificate, StatusPill, Avatar,
} from "./ui";
import { useLang } from "../i18n/LangContext";
import SitePhotos from "./SitePhotos";
import CvUpload from "./CvUpload";
import { technicianProgress } from "./progress";

const projectComplete = (p) =>
  !!p.description?.trim() && (p.technologies || []).length > 0 &&
  !!p.integrations?.trim() && (p.project_images || []).length === IMAGES_PER_PROJECT;

/* ---------- certifications ---------- */

export function CertForm({ userId, onDone, setMsg }) {
  const { t } = useLang();
  const [brand, setBrand] = useState(BRANDS[0]);
  const [title, setTitle] = useState("");
  const [issued, setIssued] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setMsg(t("Choose the certificate file (PDF, JPG, PNG or WebP)."));
    if (!CERT_TYPES.includes(file.type)) return setMsg(t("Certificate must be a PDF, JPG, PNG or WebP file."));
    if (file.size > MAX_CERT) return setMsg(t("Certificate file must be under 5 MB."));
    setBusy(true);
    const path = `${userId}/${Date.now()}-${safeName(file.name)}`;
    const up = await supabase.storage.from("certificates").upload(path, file);
    if (up.error) { setBusy(false); return setMsg(up.error.message); }
    const { error } = await supabase.from("certifications").insert({
      technician_id: userId, brand, title: title.trim(), issued_on: issued || null, certificate_path: path,
    });
    if (error) await supabase.storage.from("certificates").remove([path]);
    setBusy(false);
    if (error) return setMsg(error.message);
    setTitle(""); setIssued(""); setFile(null); e.target.reset();
    setMsg(t("Certification added."));
    onDone();
  };

  return (
    <form onSubmit={submit} className="border border-line rounded-2xl p-4 space-y-3 bg-white">
      <p className="text-sm font-semibold">{t("Add a certification")}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <select className={inp} value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Brand">
          {BRANDS.map((b) => <option key={b}>{b}</option>)}
        </select>
        <input className={inp} type="date" value={issued} onChange={(e) => setIssued(e.target.value)} title="Date issued" />
      </div>
      <input className={inp} required placeholder={t("Certificate name (e.g. Hikvision Certified Security Associate)")}
        value={title} onChange={(e) => setTitle(e.target.value)} />
      <input type="file" accept={CERT_TYPES.join(",")} className="text-sm w-full" onChange={(e) => setFile(e.target.files[0] || null)} />
      <p className="text-xs text-slateSoft">{t("Upload the certificate as PDF or image, up to 5 MB. Only you and Tricore admins can open the file.")}</p>
      <button className={btn} disabled={busy}>{busy ? t("Uploading…") : t("Add certification")}</button>
    </form>
  );
}

function Certifications({ userId, certs, editable, reload, setMsg }) {
  const { t } = useLang();
  const remove = async (c) => {
    if (!window.confirm(`${t("Delete")} "${c.title}"?`)) return;
    await supabase.storage.from("certificates").remove([c.certificate_path]);
    const { error } = await supabase.from("certifications").delete().eq("id", c.id);
    if (error) setMsg(error.message);
    reload();
  };
  return (
    <div className={card + " space-y-3"}>
      <h2 className="font-semibold text-lg">{t("Certifications")}</h2>
      {certs.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-3 border border-line rounded-xl p-3 bg-white">
          <div className="text-sm min-w-0">
            <span className="text-xs bg-paper border border-line rounded px-2 py-0.5 mr-2">{c.brand}</span>
            <span className="font-medium">{c.title}</span>
            {c.issued_on && <span className="text-slateSoft"> · {c.issued_on.slice(0, 4)}</span>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" className="text-sm text-signal font-medium inline-flex items-center gap-1" onClick={() => openCertificate(c.certificate_path)}>
              <FileText className="w-4 h-4" /> {t("View file")}
            </button>
            {editable && (
              <button type="button" className="text-red-600 p-1" onClick={() => remove(c)} aria-label={t("Delete")}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      {editable ? <CertForm userId={userId} onDone={reload} setMsg={setMsg} />
        : <p className="text-xs text-slateSoft">{t("Certifications are locked while your profile is under review or approved.")}</p>}
    </div>
  );
}

/* ---------- Section 3: projects ---------- */

function ProjectCard({ p, index, userId, editable, reload, setMsg }) {
  const { t } = useLang();
  const [f, setF] = useState({
    title: p.title || "", description: p.description || "",
    technologies: (p.technologies || []).join(", "), integrations: p.integrations || "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const images = [...(p.project_images || [])].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const save = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("projects").update({
      title: f.title.trim() || `Project ${index + 1}`,
      description: f.description,
      technologies: f.technologies.split(",").map((s) => s.trim()).filter(Boolean),
      integrations: f.integrations,
    }).eq("id", p.id);
    setMsg(error ? error.message : `Project ${index + 1} saved.`);
    reload();
  };

  const addImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!IMG_TYPES.includes(file.type)) return setMsg("Use JPG, PNG or WebP images.");
    if (file.size > MAX_IMG) return setMsg("Images must be under 2 MB.");
    setMsg("Uploading…");
    const path = `${userId}/projects/${p.id}/${Date.now()}-${safeName(file.name)}`;
    const up = await supabase.storage.from("portfolio").upload(path, file);
    if (up.error) return setMsg(up.error.message);
    const { error } = await supabase.from("project_images").insert({ project_id: p.id, technician_id: userId, storage_path: path });
    if (error) await supabase.storage.from("portfolio").remove([path]);
    setMsg(error ? error.message : "Image added.");
    reload();
  };

  const removeImage = async (img) => {
    await supabase.storage.from("portfolio").remove([img.storage_path]);
    await supabase.from("project_images").delete().eq("id", img.id);
    reload();
  };

  const removeProject = async () => {
    if (!window.confirm("Delete this project and its images?")) return;
    const paths = images.map((i) => i.storage_path);
    if (paths.length) await supabase.storage.from("portfolio").remove(paths);
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) setMsg(error.message);
    reload();
  };

  return (
    <form onSubmit={save} className="border border-line rounded-lg p-3 space-y-3 bg-white">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium flex items-center gap-2">
          Project {index + 1}
          {projectComplete(p) ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4 text-slateSoft" />}
        </h3>
        {editable && (
          <button type="button" className="text-red-600 text-sm inline-flex items-center gap-1" onClick={removeProject}>
            <Trash2 className="w-4 h-4" /> {t("Delete project")}
          </button>
        )}
      </div>
      <fieldset disabled={!editable} className="space-y-3">
        <input className={inp} required placeholder="Project title (e.g. 32-camera CCTV for a warehouse)" value={f.title} onChange={set("title")} />
        <textarea className={inp} rows={4} placeholder="Describe the installation you did in this project" value={f.description} onChange={set("description")} />
        <input className={inp} placeholder="Technologies / equipment used, separated by commas (e.g. Hikvision NVR, PoE switches, Cat6)" value={f.technologies} onChange={set("technologies")} />
        <textarea className={inp} rows={3} placeholder="Integration you did (e.g. access control linked to CCTV and alarm, remote viewing on mobile)" value={f.integrations} onChange={set("integrations")} />
      </fieldset>
      <div>
        <p className="text-sm font-medium mb-2">Project images ({images.length}/{IMAGES_PER_PROJECT})</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: IMAGES_PER_PROJECT }).map((_, i) => {
            const img = images[i];
            return img ? (
              <div key={img.id} className="relative">
                <img src={mediaUrl(img.storage_path)} alt="" className="w-full h-24 object-cover rounded" />
                {editable && (
                  <button type="button" onClick={() => removeImage(img)} aria-label="Delete image"
                    className="absolute top-1 right-1 bg-white/90 text-red-600 rounded p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ) : (
              <label key={i} className={`h-24 border border-dashed border-line rounded flex flex-col items-center justify-center text-xs text-slateSoft ${editable ? "cursor-pointer hover:bg-paper" : "opacity-50"}`}>
                <Plus className="w-4 h-4" /> Add image
                <input type="file" accept={IMG_TYPES.join(",")} className="hidden" disabled={!editable} onChange={addImage} />
              </label>
            );
          })}
        </div>
        <p className="text-xs text-slateSoft mt-1">JPG, PNG or WebP up to 2 MB each. Exactly {IMAGES_PER_PROJECT} images per project.</p>
      </div>
      {editable && <button className={btn}>{t("Save project")} {index + 1}</button>}
    </form>
  );
}

function Projects({ tech, projects, userId, editable, reload, setMsg }) {
  const { t } = useLang();
  const add = async () => {
    const { error } = await supabase.from("projects").insert({ technician_id: userId, title: `Project ${projects.length + 1}` });
    if (error) setMsg(error.message);
    reload();
  };
  return (
    <div className={card + " space-y-3"}>
      <h2 className="font-semibold text-lg">{t("Projects (optional)")} ({projects.length}/{MAX_PROJECTS})</h2>
      <p className="text-sm text-slateSoft">{t("Extra detail for clients: describe an installation, the equipment used and the integration you did.")}</p>
      {!tech ? <p className="text-sm text-slateSoft">{t("Save basic information")}</p> : (
        <>
          {projects.map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i} userId={userId} editable={editable} reload={reload} setMsg={setMsg} />
          ))}
          {editable && projects.length < MAX_PROJECTS && (
            <button type="button" className={btn} onClick={add}>
              <Plus className="w-4 h-4" /> {t("Add project")}
            </button>
          )}
          {!editable && <p className="text-xs text-slateSoft">{t("Photos are locked while your profile is under review or approved.")}</p>}
        </>
      )}
    </div>
  );
}

/* ---------- Panel ---------- */

export default function TechnicianPanel({ user, profile, section = "all" }) {
  const { t } = useLang();
  const [tech, setTech] = useState(null);
  const [certs, setCerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [review, setReview] = useState(null);
  const [savedPhone, setSavedPhone] = useState(profile.phone || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    display_name: profile.full_name || "", headline: "", bio: "", skills: "",
    city: "", years_experience: "", is_public: true,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // syncForm=true copies saved values into the basic-info form; other reloads leave unsaved typing alone
  const load = async (syncForm = false) => {
    const { data: row } = await supabase.from("technicians").select("*").eq("id", user.id).maybeSingle();
    const { data: pr } = await supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle();
    setSavedPhone(pr?.phone || "");
    setTech(row);
    if (!row) return;
    if (syncForm) setF({ ...row, skills: (row.skills || []).join(", "), years_experience: row.years_experience ?? "" });
    const [c, p, r, sp] = await Promise.all([
      supabase.from("certifications").select("*").eq("technician_id", user.id).order("created_at"),
      supabase.from("projects").select("*, project_images(*)").eq("technician_id", user.id).order("created_at"),
      supabase.from("technician_reviews").select("*").eq("technician_id", user.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("site_photos").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    ]);
    setPhotoCount(sp.count || 0);
    setCerts(c.data || []);
    setProjects(p.data || []);
    setReview(r.data?.[0] || null);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(true); }, []);

  const status = tech?.status || "draft";
  const editable = !!tech && (status === "draft" || status === "changes_requested");
  const basicLocked = status === "pending";

  const saveBasic = async (e) => {
    e.preventDefault();
    const row = {
      display_name: f.display_name, headline: f.headline, bio: f.bio, city: f.city, is_public: f.is_public,
      skills: f.skills.split(",").map((s) => s.trim()).filter(Boolean),
      years_experience: f.years_experience === "" ? null : Number(f.years_experience),
    };
    const ph = await supabase.from("profiles").update({ phone: phone.trim() || null }).eq("id", user.id);
    if (ph.error) return setMsg(ph.error.message);
    const { error } = tech
      ? await supabase.from("technicians").update(row).eq("id", user.id)
      : await supabase.from("technicians").insert({ ...row, id: user.id });
    setMsg(error ? error.message : t("Basic information saved."));
    load(true);
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!IMG_TYPES.includes(file.type)) return setMsg(t("Use a JPG, PNG or WebP photo."));
    if (file.size > MAX_IMG) return setMsg(t("Photo must be under 2 MB."));
    setMsg(t("Uploading…"));
    const path = `${user.id}/photo-${Date.now()}-${safeName(file.name)}`;
    const up = await supabase.storage.from("portfolio").upload(path, file);
    if (up.error) return setMsg(up.error.message);
    const { error } = await supabase.from("technicians").update({ photo_path: path }).eq("id", user.id);
    if (error) {
      await supabase.storage.from("portfolio").remove([path]);
      return setMsg(error.message);
    }
    if (tech.photo_path) await supabase.storage.from("portfolio").remove([tech.photo_path]);
    setMsg(t("Photo saved."));
    load(false);
  };

  const submitForReview = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("submit_technician_for_review");
    setBusy(false);
    setMsg(error ? error.message : t("Submitted. Tricore will review your profile."));
    load(true);
  };

  const prog = technicianProgress({ tech, phone: savedPhone, certs: certs.length, photos: photoCount, cv: tech?.cv_path });
  const showProfile = section === "all" || section === "profile";
  const showSubmit = section === "all" || section === "overview";

  return (
    <div className="space-y-6">
      {/* status */}
      {showSubmit && (
        <div className={card + " space-y-3"}>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-semibold text-lg">{t("Tricore technician verification")}</h2>
            <StatusPill status={status} />
          </div>
          {status === "draft" && <p className="text-sm text-slateSoft">{t("Complete the sections below and submit. Only technicians approved by Tricore appear on the site.")}</p>}
          {status === "pending" && <p className="text-sm text-slateSoft">{t("Your profile is with Tricore for review. You cannot edit it until the review is done.")}</p>}
          {status === "approved" && (
            <p className="text-sm text-green-800">
              <BadgeCheck className="inline w-4 h-4 mr-1" />{t("You are a verified Tricore technician and visible on the platform.")}
              {" "}<Link className="text-signal underline" to={`/technicians/${user.id}`}>{t("View public page")}</Link>
            </p>
          )}
          {status === "changes_requested" && (
            <div className="text-sm">
              <p className="text-red-800 font-medium">{t("Tricore asked you to make changes:")}</p>
              {review?.note && <p className="mt-1 whitespace-pre-line bg-red-50 border border-red-200 rounded-xl p-3">{review.note}</p>}
              <p className="text-slateSoft mt-1">{t("Fix them below, then submit again.")}</p>
            </div>
          )}
          {(status === "draft" || status === "changes_requested") && (
            <>
              <ul className="space-y-1.5 text-sm">
                {prog.items.map(([label, ok]) => (
                  <li key={label} className="flex items-start gap-2">
                    {ok ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slateSoft mt-0.5 shrink-0" />}
                    <span className={ok ? "" : "text-slateSoft"}>{t(label)}</span>
                  </li>
                ))}
              </ul>
              <button className={btn} disabled={!prog.complete || busy || !tech} onClick={submitForReview}>
                {busy ? t("Submitting…") : status === "changes_requested" ? t("Submit again for review") : t("Submit for review")}
              </button>
            </>
          )}
        </div>
      )}

      {showProfile && (
        <>
          {/* basic info */}
          <form onSubmit={saveBasic} className={card + " space-y-3"}>
            <h2 className="font-semibold text-lg">{t("Basic information")}</h2>
            <fieldset disabled={basicLocked} className="space-y-3">
              <div className="flex items-center gap-4">
                <Avatar path={tech?.photo_path} name={f.display_name} size="w-20 h-20" />
                <div className="text-sm">
                  <p className="font-medium">{t("Profile photo")}</p>
                  {tech && (
                    <input type="file" accept={IMG_TYPES.join(",")} onChange={uploadPhoto} disabled={status === "pending" || status === "approved"} className="text-sm max-w-[13rem] sm:max-w-none" />
                  )}
                  <p className="text-xs text-slateSoft">{t("JPG, PNG or WebP up to 2 MB each.")}</p>
                </div>
              </div>
              <input className={inp} placeholder={t("Display name")} required value={f.display_name} onChange={set("display_name")} />
              <input className={inp} placeholder={t("Headline (e.g. CCTV & network installer)")} value={f.headline} onChange={set("headline")} />
              <textarea className={inp} rows={4} placeholder={t("About you and your work")} value={f.bio} onChange={set("bio")} />
              <input className={inp} placeholder={t("Skills, separated by commas")} value={f.skills} onChange={set("skills")} />
              <div className="grid sm:grid-cols-3 gap-3">
                <input className={inp} placeholder={t("City")} value={f.city} onChange={set("city")} />
                <input className={inp} type="number" min="0" placeholder={t("Years of experience")} value={f.years_experience} onChange={set("years_experience")} />
                <input className={inp} type="tel" placeholder={t("Phone / WhatsApp")} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="w-4 h-4" checked={f.is_public} onChange={(e) => setF({ ...f, is_public: e.target.checked })} />
                {t("Show my profile publicly once approved")}
              </label>
              <button className={btn}>{t("Save basic information")}</button>
            </fieldset>
          </form>

          {/* site photos */}
          <div className={card + " space-y-3"}>
            <h2 className="font-semibold text-lg">{t("Site photos")}</h2>
            {tech ? <SitePhotos ownerId={user.id} editable={editable} onCount={setPhotoCount} /> : <p className="text-sm text-slateSoft">{t("Save basic information")}</p>}
          </div>

          {/* CV */}
          <div className={card + " space-y-3"}>
            <h2 className="font-semibold text-lg">{t("Upload your CV")}</h2>
            <p className="text-sm text-slateSoft">{t("Companies that are hiring will read it when you apply. PDF or Word, up to 5 MB.")}</p>
            {tech && <CvUpload userId={user.id} cvPath={tech.cv_path} onChange={() => load(false)} />}
          </div>

          <Certifications userId={user.id} certs={certs} editable={editable} reload={() => load(false)} setMsg={setMsg} />
          <Projects tech={tech} projects={projects} userId={user.id} editable={editable} reload={() => load(false)} setMsg={setMsg} />
        </>
      )}

      {msg && <p role="status" className="text-sm text-signalDark">{msg}</p>}
    </div>
  );
}
