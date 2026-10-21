import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, MapPin } from "lucide-react";
import { supabase } from "../supabaseClient";
import { inp, card, mediaUrl } from "./ui";
import { logoSrc } from "./Onboarding";
import { JobForm } from "./Jobs";

const Verified = () => <BadgeCheck className="inline w-4 h-4 text-signal ml-1" />;

export function Technicians() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("technicians")
      .select("id, display_name, headline, city, skills, verified, photo_path, created_at, certifications(brand)")
      .eq("is_public", true)
      .eq("status", "approved")
      .order("verified", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => { setRows(data || []); setLoading(false); });
  }, []);

  const term = q.toLowerCase();
  const list = rows.filter((t) =>
    [t.display_name, t.headline, t.city, ...(t.skills || []), ...(t.certifications || []).map((c) => c.brand)]
      .join(" ").toLowerCase().includes(term));

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-4">Find a technician</h1>
      <input className={inp + " mb-6"} placeholder="Search by name, skill, brand or city (CCTV, Hikvision, Dar es Salaam…)"
        value={q} onChange={(e) => setQ(e.target.value)} />
      {loading ? <p>Loading…</p> : !list.length ? <p className="text-slateSoft">No technicians found yet.</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((t) => {
            const brands = [...new Set((t.certifications || []).map((c) => c.brand))];
            return (
              <Link key={t.id} to={`/technicians/${t.id}`} className={card + " block hover:shadow-md"}>
                <div className="flex items-center gap-3 mb-3">
                  {t.photo_path
                    ? <img src={mediaUrl(t.photo_path)} alt="" loading="lazy" className="w-16 h-16 rounded-full object-cover border border-line" />
                    : <div className="w-16 h-16 rounded-full bg-paper border border-line" />}
                  <div className="min-w-0">
                    <h3 className="font-semibold">{t.display_name}{t.verified && <Verified />}</h3>
                    <p className="text-sm text-slateSoft">{t.headline}</p>
                    {t.city && <p className="text-xs mt-1"><MapPin className="inline w-3 h-3" /> {t.city}</p>}
                  </div>
                </div>
                {brands.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {brands.map((b) => <span key={b} className="text-xs bg-signal/10 text-signalDark border border-signal/30 rounded px-2 py-0.5">{b} certified</span>)}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {(t.skills || []).slice(0, 4).map((k) => (
                    <span key={k} className="text-xs bg-paper border border-line rounded px-2 py-0.5">{k}</span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TechnicianDetail() {
  const { id } = useParams();
  const [t, setT] = useState(undefined);
  const [site, setSite] = useState([]);

  useEffect(() => {
    supabase.from("technicians")
      .select("*, certifications(*), projects(*, project_images(*))")
      .eq("id", id).maybeSingle()
      .then(({ data }) => setT(data));
    supabase.from("site_photos").select("*").eq("owner_id", id).order("created_at")
      .then(({ data }) => setSite(data || []));
  }, [id]);

  if (t === undefined) return <p>Loading…</p>;
  if (!t) return <p>Technician not found.</p>;

  const certs = [...(t.certifications || [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const projects = [...(t.projects || [])].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {t.status !== "approved" && (
          <p className="text-sm bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-2">
            Preview only: this profile is not visible to visitors until Tricore approves it.
          </p>
        )}
        <div className={card + " flex flex-col sm:flex-row gap-4"}>
          {t.photo_path
            ? <img src={mediaUrl(t.photo_path)} alt={t.display_name} className="w-32 h-32 rounded-full object-cover border border-line" />
            : <div className="w-32 h-32 rounded-full bg-paper border border-line" />}
          <div>
            <h1 className="font-display text-3xl font-semibold">{t.display_name}{t.verified && <Verified />}</h1>
            {t.verified && <p className="text-xs text-signalDark font-medium">Verified Tricore technician</p>}
            <p className="text-slateSoft">{t.headline}</p>
            <p className="text-sm mt-2">
              {t.city}{t.years_experience != null && ` · ${t.years_experience} yrs experience`}
            </p>
            {t.bio && <p className="mt-3 whitespace-pre-line">{t.bio}</p>}
            <div className="flex flex-wrap gap-1 mt-3">
              {(t.skills || []).map((k) => <span key={k} className="text-xs bg-paper border border-line rounded px-2 py-0.5">{k}</span>)}
            </div>
          </div>
        </div>

        {site.length > 0 && (
          <div className={card}>
            <h2 className="font-semibold text-lg mb-3">On site</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {site.map((p) => (
                <a key={p.id} href={mediaUrl(p.storage_path)} target="_blank" rel="noreferrer">
                  <img src={mediaUrl(p.storage_path)} alt={`${t.display_name} on site`} loading="lazy" className="w-full aspect-square object-cover rounded-xl" />
                </a>
              ))}
            </div>
          </div>
        )}

        {certs.length > 0 && (
          <div className={card}>
            <h2 className="font-semibold text-lg mb-3">Certifications</h2>
            <ul className="space-y-2">
              {certs.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="w-4 h-4 text-signal shrink-0" />
                  <span className="text-xs bg-paper border border-line rounded px-2 py-0.5">{c.brand}</span>
                  <span className="font-medium">{c.title}</span>
                  {c.issued_on && <span className="text-slateSoft">· {c.issued_on.slice(0, 4)}</span>}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slateSoft mt-3">Certificates checked by Tricore.</p>
          </div>
        )}

        {projects.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Projects</h2>
            {projects.map((p) => {
              const imgs = [...(p.project_images || [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
              return (
                <div key={p.id} className={card + " space-y-3"}>
                  <h3 className="font-semibold">{p.title}</h3>
                  {imgs.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {imgs.map((im) => (
                        <img key={im.id} src={mediaUrl(im.storage_path)} alt={p.title} loading="lazy" className="w-full h-40 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                  {p.description && <div><p className="text-xs uppercase text-slateSoft">Installation</p><p className="text-sm whitespace-pre-line">{p.description}</p></div>}
                  {(p.technologies || []).length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-slateSoft mb-1">Technologies used</p>
                      <div className="flex flex-wrap gap-1">
                        {p.technologies.map((k) => <span key={k} className="text-xs bg-paper border border-line rounded px-2 py-0.5">{k}</span>)}
                      </div>
                    </div>
                  )}
                  {p.integrations && <div><p className="text-xs uppercase text-slateSoft">Integration</p><p className="text-sm whitespace-pre-line">{p.integrations}</p></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className={card + " h-fit"}>
        <h2 className="font-semibold mb-3">Request {t.display_name.split(" ")[0]}</h2>
        <JobForm technicianId={t.id} />
      </div>
    </div>
  );
}

export function Companies() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    supabase.from("companies").select("*").order("verified", { ascending: false })
      .then(({ data }) => setRows(data || []));
  }, []);
  if (!rows) return <p>Loading…</p>;
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-4">Companies</h1>
      {!rows.length ? <p className="text-slateSoft">No companies registered yet.</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((c) => (
            <div key={c.id} className={card}>
              <div className="flex items-center gap-3 mb-2">
                {c.logo_url
                  ? <img src={logoSrc(c.logo_url)} alt="" loading="lazy" className="w-14 h-14 rounded-xl object-cover border border-line" />
                  : <div className="w-14 h-14 rounded-xl bg-forest text-white flex items-center justify-center font-display font-semibold">{c.name?.[0]}</div>}
                <div className="min-w-0">
                  <h3 className="font-semibold">{c.name}{c.verified && <Verified />}</h3>
                  {c.city && <p className="text-xs text-slateSoft"><MapPin className="inline w-3 h-3" /> {c.city}</p>}
                </div>
              </div>
              <p className="text-sm">{c.description}</p>
              {(c.services || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {c.services.slice(0, 4).map((k) => <span key={k} className="text-xs bg-paper border border-line rounded-full px-2.5 py-0.5">{k}</span>)}
                </div>
              )}
              <Link to="/jobs" className="inline-block mt-3 text-sm font-medium text-signal">See openings</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
