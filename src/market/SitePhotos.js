import React, { useCallback, useEffect, useState } from "react";
import { Camera, Trash2, Plus } from "lucide-react";
import { supabase } from "../supabaseClient";
import { mediaUrl, IMG_TYPES, MAX_IMG, MIN_SITE, MAX_SITE, safeName } from "./ui";
import { useLang } from "../i18n/LangContext";

// 3 to 10 photos of real sites, with the person visible at work.
// Works for technicians and companies (owner_id is the signed-in profile id).
export default function SitePhotos({ ownerId, editable = true, onCount, hint = true }) {
  const { t } = useLang();
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_photos").select("*").eq("owner_id", ownerId).order("created_at");
    setRows(data || []);
    onCount && onCount((data || []).length);
  }, [ownerId, onCount]);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setMsg(""); setBusy(true);
    let count = rows.length;
    for (const file of files) {
      if (count >= MAX_SITE) { setMsg(t("Maximum reached.")); break; }
      if (!IMG_TYPES.includes(file.type)) { setMsg(t("Use JPG, PNG or WebP images.")); continue; }
      if (file.size > MAX_IMG) { setMsg(t("Images must be under 2 MB.")); continue; }
      const path = `${ownerId}/site/${Date.now()}-${safeName(file.name)}`;
      const up = await supabase.storage.from("portfolio").upload(path, file);
      if (up.error) { setMsg(up.error.message); continue; }
      const { error } = await supabase.from("site_photos").insert({ owner_id: ownerId, storage_path: path });
      if (error) { await supabase.storage.from("portfolio").remove([path]); setMsg(error.message); continue; }
      count += 1;
    }
    setBusy(false);
    load();
  };

  const remove = async (p) => {
    await supabase.storage.from("portfolio").remove([p.storage_path]);
    const { error } = await supabase.from("site_photos").delete().eq("id", p.id);
    if (error) setMsg(error.message);
    load();
  };

  if (!rows) return <p className="text-sm text-slateSoft">{t("Loading…")}</p>;
  const n = rows.length;
  const need = Math.max(0, MIN_SITE - n);
  const status = need > 0 ? t("Add {n} more to reach the minimum.", { n: need })
    : n >= MAX_SITE ? t("Maximum reached.") : t("Minimum reached. You can add up to {n} more.", { n: MAX_SITE - n });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{t("{n} of {min} to {max} photos", { n, min: MIN_SITE, max: MAX_SITE })}</p>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: MAX_SITE }).map((_, i) => (
            <span key={i} className={`h-1.5 w-3 sm:w-4 rounded-full ${i < n ? (n >= MIN_SITE ? "bg-green-500" : "bg-signal") : i < MIN_SITE ? "bg-brass/50" : "bg-line"}`} />
          ))}
        </div>
      </div>
      <p className={`text-sm ${need > 0 ? "text-amber-700" : "text-green-700"}`}>{status}</p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {rows.map((p) => (
          <div key={p.id} className="relative aspect-square">
            <img src={mediaUrl(p.storage_path)} alt="" loading="lazy" className="w-full h-full object-cover rounded-xl border border-line" />
            {editable && (
              <button type="button" onClick={() => remove(p)} aria-label={t("Delete photo")}
                className="absolute top-1.5 right-1.5 bg-white/95 text-red-600 rounded-lg p-1.5 shadow">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {editable && n < MAX_SITE && (
          <label className="aspect-square border-2 border-dashed border-signal/50 bg-signal/5 hover:bg-signal/10 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-semibold text-signalDark cursor-pointer text-center px-1">
            {busy ? t("Uploading…") : (<><Plus className="w-5 h-5" />{t("Add photo")}</>)}
            <input type="file" multiple accept={IMG_TYPES.join(",")} className="sr-only" disabled={busy} onChange={add} />
          </label>
        )}
      </div>
      {hint && editable && (
        <p className="text-xs text-slateSoft flex items-start gap-1.5">
          <Camera className="w-4 h-4 shrink-0" />
          <span>{t("Show yourself in the photo: at the rack, on the ladder, at the gate.")} {t("JPG, PNG or WebP up to 2 MB each.")}</span>
        </p>
      )}
      {!editable && <p className="text-xs text-slateSoft">{t("Photos are locked while your profile is under review or approved.")}</p>}
      {msg && <p role="status" className="text-sm text-red-700">{msg}</p>}
    </div>
  );
}
