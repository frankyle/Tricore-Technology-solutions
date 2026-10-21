import React, { useState } from "react";
import { FileText, Upload, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { CV_TYPES, MAX_CV, safeName, openCv, btnGhost } from "./ui";
import { useLang } from "../i18n/LangContext";

// Technician CV: private file, shared only with companies they apply to and Tricore admins.
export default function CvUpload({ userId, cvPath, onChange }) {
  const { t } = useLang();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!CV_TYPES.includes(file.type)) return setMsg(t("CV must be a PDF or Word file."));
    if (file.size > MAX_CV) return setMsg(t("CV must be under 5 MB."));
    setBusy(true); setMsg("");
    const path = `${userId}/cv-${Date.now()}-${safeName(file.name)}`;
    const up = await supabase.storage.from("cvs").upload(path, file);
    if (up.error) { setBusy(false); return setMsg(up.error.message); }
    const { error } = await supabase.from("technicians").update({ cv_path: path }).eq("id", userId);
    if (error) { await supabase.storage.from("cvs").remove([path]); setBusy(false); return setMsg(error.message); }
    if (cvPath) await supabase.storage.from("cvs").remove([cvPath]);
    setBusy(false); setMsg(t("CV saved."));
    onChange && onChange(path);
  };

  const remove = async () => {
    await supabase.storage.from("cvs").remove([cvPath]);
    await supabase.from("technicians").update({ cv_path: null }).eq("id", userId);
    onChange && onChange(null);
  };

  return (
    <div className="space-y-3">
      {cvPath && (
        <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
          <span className="flex items-center gap-2 text-sm font-medium text-green-800"><FileText className="w-5 h-5" />{t("CV uploaded")}</span>
          <span className="flex items-center gap-3">
            <button type="button" className="text-sm text-signal font-medium" onClick={() => openCv(cvPath)}>{t("View CV")}</button>
            <button type="button" className="text-red-600 p-1" onClick={remove} aria-label={t("Remove CV")}><Trash2 className="w-4 h-4" /></button>
          </span>
        </div>
      )}
      <label className={btnGhost + " cursor-pointer w-full sm:w-auto"}>
        <Upload className="w-4 h-4" />{busy ? t("Uploading…") : cvPath ? t("Replace CV") : t("Choose CV file")}
        <input type="file" accept=".pdf,.doc,.docx" className="sr-only" disabled={busy} onChange={pick} />
      </label>
      {msg && <p role="status" className="text-sm text-slateSoft">{msg}</p>}
    </div>
  );
}
