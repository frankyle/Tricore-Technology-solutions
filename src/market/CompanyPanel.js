import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { inp, btn, card, IMG_TYPES, MAX_IMG, safeName, SERVICES, ChipPicker } from "./ui";
import { useLang } from "../i18n/LangContext";
import SitePhotos from "./SitePhotos";
import { PhotoPicker, logoSrc } from "./Onboarding";
import { companyProgress } from "./progress";

export function useCompany(user) {
  const [company, setCompany] = useState(undefined);
  const [photos, setPhotos] = useState(0);
  const load = async () => {
    const { data } = await supabase.from("companies").select("*").eq("owner_id", user.id).limit(1).maybeSingle();
    const p = await supabase.from("site_photos").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
    setCompany(data || null); setPhotos(p.count || 0);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);
  return { company, photos, setPhotos, reload: load, progress: companyProgress({ company, photos }) };
}

export default function CompanyPanel({ user, company, reload, setPhotos }) {
  const { t } = useLang();
  const [f, setF] = useState({ name: "", description: "", city: "", phone: "", website: "", services: [] });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (company) setF({ name: company.name || "", description: company.description || "", city: company.city || "", phone: company.phone || "", website: company.website || "", services: company.services || [] });
  }, [company]);

  const save = async (e) => {
    e.preventDefault();
    const row = { name: f.name.trim(), description: f.description.trim(), city: f.city.trim(), phone: f.phone.trim() || null, website: f.website.trim() || null, services: f.services };
    const { error } = company
      ? await supabase.from("companies").update(row).eq("id", company.id)
      : await supabase.from("companies").insert({ ...row, owner_id: user.id });
    setMsg(error ? error.message : t("Company saved."));
    reload();
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !company) return;
    if (!IMG_TYPES.includes(file.type)) return setMsg(t("Use a JPG, PNG or WebP photo."));
    if (file.size > MAX_IMG) return setMsg(t("Photo must be under 2 MB."));
    setBusy(true);
    const path = `${user.id}/logo-${Date.now()}-${safeName(file.name)}`;
    const up = await supabase.storage.from("portfolio").upload(path, file);
    if (up.error) { setBusy(false); return setMsg(up.error.message); }
    const { error } = await supabase.from("companies").update({ logo_url: path }).eq("id", company.id);
    if (error) await supabase.storage.from("portfolio").remove([path]);
    setBusy(false);
    setMsg(error ? error.message : t("Logo saved."));
    reload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className={card + " space-y-4"}>
        <h2 className="font-semibold text-lg">{t("Your company")}</h2>
        <div className="flex justify-center sm:justify-start">
          {company
            ? <PhotoPicker src={logoSrc(company.logo_url)} label={t("Choose a logo")} changeLabel={t("Change logo")} onFile={uploadLogo} busy={busy} />
            : <p className="text-sm text-slateSoft">{t("Save your company details first, then add your logo.")}</p>}
        </div>
        <input className={inp} placeholder={t("Company name")} required value={f.name} onChange={set("name")} />
        <textarea className={inp} rows={3} placeholder={t("What does your company do?")} value={f.description} onChange={set("description")} />
        <div className="grid sm:grid-cols-3 gap-3">
          <input className={inp} placeholder={t("City")} value={f.city} onChange={set("city")} />
          <input className={inp} type="tel" placeholder={t("Phone / WhatsApp for hiring")} value={f.phone} onChange={set("phone")} />
          <input className={inp} type="url" placeholder={t("Website (optional)")} value={f.website} onChange={set("website")} />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">{t("Services we offer")}</p>
          <ChipPicker options={SERVICES} value={f.services} onChange={(services) => setF({ ...f, services })} />
        </div>
        {msg && <p role="status" className="text-sm text-signalDark">{msg}</p>}
        <button className={btn}>{t("Save company")}</button>
      </form>

      <div className={card + " space-y-3"}>
        <h2 className="font-semibold text-lg">{t("Team photos")}</h2>
        {company ? <SitePhotos ownerId={user.id} onCount={setPhotos} /> : <p className="text-sm text-slateSoft">{t("Save your company details first, then add your logo.")}</p>}
      </div>
    </div>
  );
}
