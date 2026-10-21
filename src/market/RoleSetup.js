import React, { useState } from "react";
import { Wrench, Building2, Search } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { btn } from "./ui";
import { useLang } from "../i18n/LangContext";

const OPTIONS = [
  ["technician", "I'm a technician", "List your certifications and photos, upload your CV, get found and hired.", Wrench],
  ["company", "I'm a company", "List your company, post vacancies and hire technicians.", Building2],
  ["requester", "I need a technician", "Browse technicians and companies and send job requests.", Search],
];

export default function RoleSetup() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLang();
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const confirm = async () => {
    if (!picked) return;
    setBusy(true);
    const { error } = await supabase.rpc("choose_role", { new_role: picked });
    setBusy(false);
    if (error) return setMsg(error.message);
    refreshProfile();
  };

  return (
    <div className="max-w-lg mx-auto bg-card border border-line rounded-3xl p-5 sm:p-8 space-y-5 shadow-sm">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">{t("Welcome")}{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
        <p className="text-slateSoft mt-1">{t("One quick thing before your dashboard. What brings you to Tricore?")}</p>
      </div>
      <div className="space-y-3">
        {OPTIONS.map(([value, label, desc, Icon]) => (
          <button key={value} type="button" onClick={() => setPicked(value)} aria-pressed={picked === value}
            className={`w-full text-left flex gap-4 items-start border rounded-2xl p-4 transition ${picked === value ? "border-signal ring-2 ring-signal bg-signal/5" : "border-line bg-white hover:border-signal"}`}>
            <span className="shrink-0 w-11 h-11 rounded-xl bg-ink text-white flex items-center justify-center"><Icon className="w-5 h-5" /></span>
            <span>
              <span className="font-semibold block">{t(label)}</span>
              <span className="text-sm text-slateSoft">{t(desc)}</span>
            </span>
          </button>
        ))}
      </div>
      {msg && <p role="status" className="text-sm text-red-700">{msg}</p>}
      <button className={btn + " w-full"} disabled={!picked || busy} onClick={confirm}>
        {busy ? t("Saving…") : t("Continue")}
      </button>
    </div>
  );
}
