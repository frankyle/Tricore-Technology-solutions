import React from "react";
import { supabase } from "../supabaseClient";
import { useLang } from "../i18n/LangContext";

export const mediaUrl = (p) => supabase.storage.from("portfolio").getPublicUrl(p).data.publicUrl;

// Shared look: roomy touch targets (44px+) so forms are easy on a phone.
export const inp =
  "w-full border border-line rounded-xl px-4 py-3 bg-white text-slate text-base placeholder:text-slateSoft/70 focus:outline-none focus:ring-2 focus:ring-signal focus:border-signal transition";
export const btn =
  "inline-flex items-center justify-center gap-2 bg-signal hover:bg-signalDark text-white rounded-xl px-5 py-3 font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 border border-line bg-white hover:bg-paper text-slate rounded-xl px-5 py-3 font-semibold disabled:opacity-50 transition";
export const card = "bg-card border border-line rounded-2xl p-4 sm:p-5";

export const MAX_IMG = 2 * 1024 * 1024;   // 2 MB
export const MAX_VID = 50 * 1024 * 1024;  // 50 MB
export const MAX_CERT = 5 * 1024 * 1024;  // 5 MB (PDF or image)
export const MAX_CV = 5 * 1024 * 1024;    // 5 MB (PDF or Word)
export const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const CERT_TYPES = [...IMG_TYPES, "application/pdf"];
export const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const BRANDS = ["Hikvision", "Dahua", "Gallagher", "IDS", "Other"];
export const MAX_PROJECTS = 5;
export const IMAGES_PER_PROJECT = 4;
export const MIN_SITE = 3;
export const MAX_SITE = 10;

export const SKILLS = [
  "CCTV", "Networking", "Access control", "Fire alarm", "Electric fence", "Intercom",
  "Structured cabling", "Gate automation", "GPS tracking", "Solar & power", "Biometrics", "Alarm systems",
];
export const SERVICES = [
  "CCTV surveillance", "Access control", "Electric fencing", "Fire alarm", "Networking & cabling",
  "Gate automation", "GPS tracking", "Alarm & panic systems", "Monitoring centre", "Security guards",
];

export const safeName = (n) => n.replace(/[^\w.-]/g, "_");

// Private buckets are opened with a short-lived link.
export async function openPrivate(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 120);
  if (error) return alert(error.message);
  window.open(data.signedUrl, "_blank", "noopener");
}
export const openCertificate = (path) => openPrivate("certificates", path);
export const openCv = (path) => openPrivate("cvs", path);

export const STATUS = {
  draft: { label: "Draft", cls: "bg-paper text-slateSoft border-line" },
  pending: { label: "Waiting for review", cls: "bg-amber-50 text-amber-800 border-amber-300" },
  approved: { label: "Approved", cls: "bg-green-50 text-green-800 border-green-300" },
  changes_requested: { label: "Changes requested", cls: "bg-red-50 text-red-800 border-red-300" },
};
export const StatusPill = ({ status }) => {
  const { t } = useLang();
  const s = STATUS[status] || STATUS.draft;
  return <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${s.cls}`}>{t(s.label)}</span>;
};

// Tap-to-toggle chips used for skills and services.
export function ChipPicker({ options, value, onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)} aria-pressed={on}
            className={`px-3.5 py-2 rounded-full text-sm font-medium border transition ${on ? "bg-signal text-white border-signal" : "bg-white text-slate border-line hover:border-signal"}`}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export const Avatar = ({ path, name = "", size = "w-12 h-12", className = "" }) =>
  path ? (
    <img src={mediaUrl(path)} alt="" className={`${size} rounded-full object-cover border border-line ${className}`} />
  ) : (
    <div className={`${size} rounded-full bg-forest text-white flex items-center justify-center font-display font-semibold ${className}`}>
      {(name.trim()[0] || "?").toUpperCase()}
    </div>
  );
