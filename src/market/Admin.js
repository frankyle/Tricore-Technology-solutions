import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { inp, btn, card, mediaUrl, openCertificate, openCv, StatusPill, STATUS } from "./ui";

const TABS = [
  ["pending", "Waiting for review"],
  ["changes_requested", "Changes requested"],
  ["approved", "Approved"],
  ["draft", "Drafts"],
];

function Review({ id, onDecided }) {
  const [d, setD] = useState(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setD(null); setNote(""); setMsg("");
    (async () => {
      const [t, pr, c, p, r, sp] = await Promise.all([
        supabase.from("technicians").select("*").eq("id", id).maybeSingle(),
        supabase.from("profiles").select("full_name, phone").eq("id", id).maybeSingle(),
        supabase.from("certifications").select("*").eq("technician_id", id).order("created_at"),
        supabase.from("projects").select("*, project_images(*)").eq("technician_id", id).order("created_at"),
        supabase.from("technician_reviews").select("*").eq("technician_id", id).order("created_at", { ascending: false }),
        supabase.from("site_photos").select("*").eq("owner_id", id).order("created_at"),
      ]);
      setD({ t: t.data, profile: pr.data, certs: c.data || [], projects: p.data || [], reviews: r.data || [], site: sp.data || [] });
    })();
  }, [id]);

  const decide = async (decision) => {
    if (decision === "approved" && !window.confirm("Approve this technician? They will appear on the public site.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("review_technician", { tech_id: id, decision, note: note || null });
    setBusy(false);
    if (error) return setMsg(error.message);
    onDecided();
  };

  if (!d) return <p>Loading…</p>;
  const { t, profile, certs, projects, reviews, site } = d;
  if (!t) return <p>Technician not found.</p>;

  return (
    <div className="space-y-4">
      <div className={card + " flex flex-col sm:flex-row gap-4"}>
        {t.photo_path
          ? <img src={mediaUrl(t.photo_path)} alt="" className="w-32 h-32 rounded-full object-cover border border-line" />
          : <div className="w-32 h-32 rounded-full bg-paper border border-dashed border-line flex items-center justify-center text-xs text-slateSoft">No photo</div>}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-semibold">{t.display_name}</h2>
            <StatusPill status={t.status} />
          </div>
          <p className="text-slateSoft">{t.headline}</p>
          <p className="text-sm">{t.city}{t.years_experience != null && ` · ${t.years_experience} yrs experience`}</p>
          <p className="text-sm">Phone: <span className="font-medium">{profile?.phone || "not given"}</span></p>
          {t.submitted_at && <p className="text-xs text-slateSoft">Submitted {new Date(t.submitted_at).toLocaleString()}</p>}
          {t.bio && <p className="text-sm whitespace-pre-line pt-2">{t.bio}</p>}
          <div className="flex flex-wrap gap-1 pt-2">
            {(t.skills || []).map((k) => <span key={k} className="text-xs bg-paper border border-line rounded px-2 py-0.5">{k}</span>)}
          </div>
        </div>
      </div>

      <div className={card + " space-y-3"}>
        <h3 className="font-semibold">Site photos ({site.length}/10)</h3>
        {site.length < 3 && <p className="text-xs text-red-600">Fewer than 3 photos.</p>}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {site.map((p) => (
            <a key={p.id} href={mediaUrl(p.storage_path)} target="_blank" rel="noreferrer">
              <img src={mediaUrl(p.storage_path)} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-lg" />
            </a>
          ))}
        </div>
        {t.cv_path && (
          <button className="text-signal underline inline-flex items-center gap-1" onClick={() => openCv(t.cv_path)}>
            <FileText className="w-4 h-4" /> Open CV
          </button>
        )}
      </div>

      <div className={card + " space-y-2"}>
        <h3 className="font-semibold">Certifications ({certs.length})</h3>
        {!certs.length && <p className="text-sm text-slateSoft">None uploaded.</p>}
        {certs.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 border border-line rounded-lg p-2 bg-white text-sm">
            <span>
              <span className="text-xs bg-paper border border-line rounded px-2 py-0.5 mr-2">{c.brand}</span>
              <span className="font-medium">{c.title}</span>
              {c.issued_on && <span className="text-slateSoft"> · issued {c.issued_on}</span>}
            </span>
            <button className="text-signal underline inline-flex items-center gap-1 shrink-0" onClick={() => openCertificate(c.certificate_path)}>
              <FileText className="w-4 h-4" /> Open certificate
            </button>
          </div>
        ))}
      </div>

      <div className={card + " space-y-4"}>
        <h3 className="font-semibold">Projects ({projects.length}/5)</h3>
        {projects.map((p, i) => {
          const imgs = [...(p.project_images || [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
          return (
            <div key={p.id} className="border border-line rounded-lg p-3 bg-white space-y-2">
              <h4 className="font-medium">{i + 1}. {p.title}</h4>
              <div className="text-sm"><p className="text-xs uppercase text-slateSoft">Installation</p><p className="whitespace-pre-line">{p.description || "—"}</p></div>
              <div className="text-sm">
                <p className="text-xs uppercase text-slateSoft">Technologies</p>
                <div className="flex flex-wrap gap-1">
                  {(p.technologies || []).map((k) => <span key={k} className="text-xs bg-paper border border-line rounded px-2 py-0.5">{k}</span>)}
                  {!(p.technologies || []).length && "—"}
                </div>
              </div>
              <div className="text-sm"><p className="text-xs uppercase text-slateSoft">Integration</p><p className="whitespace-pre-line">{p.integrations || "—"}</p></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {imgs.map((im) => (
                  <a key={im.id} href={mediaUrl(im.storage_path)} target="_blank" rel="noreferrer">
                    <img src={mediaUrl(im.storage_path)} alt="" loading="lazy" className="w-full h-28 object-cover rounded" />
                  </a>
                ))}
              </div>
              {imgs.length !== 4 && <p className="text-xs text-red-600">Only {imgs.length} of 4 images.</p>}
            </div>
          );
        })}
      </div>

      {reviews.length > 0 && (
        <div className={card + " space-y-1"}>
          <h3 className="font-semibold">Earlier decisions</h3>
          {reviews.map((r) => (
            <p key={r.id} className="text-sm">
              <span className="text-slateSoft">{new Date(r.created_at).toLocaleDateString()}</span>{" "}
              <b>{STATUS[r.decision]?.label}</b>{r.note && `: ${r.note}`}
            </p>
          ))}
        </div>
      )}

      <div className={card + " space-y-3"}>
        <h3 className="font-semibold">Your decision</h3>
        <textarea className={inp} rows={3} placeholder="Note to the technician (required when you ask for changes, e.g. 'Project 3 needs a clearer photo of the control panel')"
          value={note} onChange={(e) => setNote(e.target.value)} />
        {msg && <p className="text-sm text-red-700">{msg}</p>}
        <div className="flex flex-wrap gap-3">
          {t.status === "pending" && <button className={btn} disabled={busy} onClick={() => decide("approved")}>Approve as Tricore technician</button>}
          {(t.status === "pending" || t.status === "approved") && (
            <button className="border border-red-300 text-red-700 rounded-lg px-4 py-2 font-medium disabled:opacity-50" disabled={busy} onClick={() => decide("changes_requested")}>
              {t.status === "approved" ? "Send back for changes (hides from site)" : "Request changes"}
            </button>
          )}
          {t.status === "draft" && <p className="text-sm text-slateSoft">This technician has not submitted yet.</p>}
          {t.status === "changes_requested" && <p className="text-sm text-slateSoft">Waiting for the technician to fix and resubmit.</p>}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, profile, loading } = useAuth();
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("technicians")
      .select("id, display_name, headline, city, status, submitted_at, photo_path")
      .order("submitted_at", { ascending: true, nullsFirst: false });
    setRows(data || []);
  }, []);
  useEffect(() => { if (profile?.is_admin) load(); }, [profile, load]);

  if (loading) return <p>Loading…</p>;
  if (!user) return <p><Link className="text-signal underline" to="/login">Sign in</Link> to continue.</p>;
  if (!profile?.is_admin) return <p>This page is for Tricore admins only.</p>;
  if (!rows) return <p>Loading…</p>;

  const list = rows.filter((r) => r.status === tab);
  const count = (s) => rows.filter((r) => r.status === s).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Review technicians</h1>
        <p className="text-slateSoft">Approve a technician to make them visible as a Tricore technician on the site.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => { setTab(k); setSelected(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm border ${tab === k ? "bg-signal text-white border-signal" : "bg-white border-line"}`}>
            {label} ({count(k)})
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {!list.length && <p className="text-sm text-slateSoft">Nobody here.</p>}
          {list.map((r) => (
            <button key={r.id} onClick={() => setSelected(r.id)}
              className={card + ` w-full text-left flex items-center gap-3 ${selected === r.id ? "ring-2 ring-signal" : "hover:shadow-md"}`}>
              {r.photo_path
                ? <img src={mediaUrl(r.photo_path)} alt="" className="w-12 h-12 rounded-full object-cover" />
                : <div className="w-12 h-12 rounded-full bg-paper border border-line" />}
              <span className="min-w-0">
                <span className="block font-medium truncate">{r.display_name}</span>
                <span className="block text-xs text-slateSoft truncate">{r.headline}{r.city && ` · ${r.city}`}</span>
                {r.submitted_at && <span className="block text-xs text-slateSoft">Submitted {new Date(r.submitted_at).toLocaleDateString()}</span>}
              </span>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selected
            ? <Review id={selected} onDecided={() => { setSelected(null); load(); }} />
            : <p className="text-slateSoft">Select a technician to review their certificates and projects.</p>}
        </div>
      </div>
    </div>
  );
}
