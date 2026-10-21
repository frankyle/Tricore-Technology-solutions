import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { inp, btn } from "./ui";
import { useLang } from "../i18n/LangContext";
import { BrandPanel } from "./Auth";

// Supabase signs the person in from the emailed link; here they choose a new password.
export default function ResetPassword() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg(error.message);
    setOk(true); setMsg(t("Password updated. Taking you to your dashboard…"));
    setTimeout(() => nav("/dashboard"), 1200);
  };

  return (
    <div className="-mx-4 -mt-6 md:-mt-10 -mb-28 md:-mb-12 lg:flex bg-paper">
      <BrandPanel />
      <section className="flex-1 flex items-start lg:items-center justify-center px-4 py-8 lg:py-12 pb-32 lg:pb-12">
        <form onSubmit={save} className="w-full max-w-md space-y-4">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">{t("Choose a new password")}</h1>
          {!loading && !user ? (
            <p className="text-sm bg-amber-50 border border-amber-300 text-amber-800 rounded-xl p-3">
              {t("Open the reset link from your email again. This page needs it to work.")}
            </p>
          ) : (
            <>
              <input className={inp} type="password" required minLength={6} autoComplete="new-password"
                placeholder={t("New password")} aria-label={t("New password")} value={pw} onChange={(e) => setPw(e.target.value)} />
              {msg && <p role="status" className={`text-sm rounded-xl px-3 py-2 border ${ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>{msg}</p>}
              <button className={btn + " w-full"} disabled={busy}>{busy ? t("Please wait…") : t("Save new password")}</button>
            </>
          )}
        </form>
      </section>
    </div>
  );
}
