// Supabase Edge Function: welcome-email
//
// Fired by a Database Webhook on INSERT into public.profiles (one row is
// created per sign-up, by the handle_new_user trigger, whether the person
// used Google or email/password — so this one function covers both).
//
// Deploy:   supabase functions deploy welcome-email
// Secrets:  supabase secrets set RESEND_API_KEY=... FROM_EMAIL="Tricore Technology Solutions <hello@yourdomain.com>" WEBHOOK_SECRET=some-long-random-string APP_URL=https://yourdomain.com
// Wiring:   Supabase Dashboard -> Database -> Webhooks -> New webhook
//             Table: public.profiles   Event: Insert   Type: HTTP Request
//             URL: <this function's URL>   Header: x-webhook-secret: <same WEBHOOK_SECRET>
//
// Swap the "RESEND" block for any other email API (SendGrid, Postmark, etc.)
// if you'd rather use one of those — only that one block needs to change.

// @ts-ignore Deno is the edge runtime global; no types needed at deploy time.
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // @ts-ignore
  const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Database Webhook payload shape: { type: "INSERT", table: "profiles", record: {...}, ... }
  const row = payload?.record;
  if (!row?.id) return new Response("Ignored (no row)", { status: 200 });

  // @ts-ignore
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  // @ts-ignore
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Tricore Technology Solutions <onboarding@resend.dev>";
  // @ts-ignore
  const APP_URL = Deno.env.get("APP_URL") || "https://tricore.example.com";
  // @ts-ignore
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  // @ts-ignore
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!RESEND_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing RESEND_API_KEY, SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY secret.");
    return new Response("Server not configured", { status: 500 });
  }

  // profiles has no email column (it lives on auth.users), so look it up with
  // the service-role key, which only this function holds.
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${row.id}`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!authRes.ok) {
    console.error("Could not look up the new user:", await authRes.text());
    return new Response("Lookup failed", { status: 500 });
  }
  const authUser = await authRes.json();
  const email = authUser?.email;
  if (!email) return new Response("No email on account", { status: 200 });

  const name = row.full_name || "there";
  const roleLabel: Record<string, string> = {
    technician: "technician",
    company: "company",
    requester: "client",
  };
  const role = roleLabel[row.role] || "member";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#eef1f6;padding:24px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d7dde6;">
      <div style="background:#0b1524;padding:20px 24px;">
        <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:.3px;">TRICORE</span>
        <div style="color:#d9bd76;font-size:11px;letter-spacing:1px;margin-top:2px;">SECURE · CONNECT · INTEGRATE · SUPPORT</div>
      </div>
      <div style="padding:28px 24px;color:#2b3646;">
        <h1 style="font-size:20px;margin:0 0 12px;">Welcome to Tricore, ${name}!</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">
          Thanks for creating your account as a ${role}. This is just a quick note to
          confirm your registration went through.
        </p>
        ${row.role === "technician" ? `
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">
          Next step: complete your technician profile — certifications, phone number and
          5 projects — and submit it for review. Once Tricore approves it, you'll be
          visible to everyone searching the directory.
        </p>` : row.role === "company" ? `
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">
          Next step: add your company details from your dashboard so clients can find you.
        </p>` : `
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">
          You can now browse technicians and companies and send a job request straight
          from their profile.
        </p>`}
        <a href="${APP_URL}/dashboard"
           style="display:inline-block;background:#2f6fed;color:#ffffff;text-decoration:none;
                  padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;margin-top:4px;">
          Open my dashboard
        </a>
        <p style="font-size:12px;color:#5b6779;margin-top:28px;">
          If you didn't create this account, you can ignore this email.
        </p>
      </div>
    </div>
  </div>`;

  const send = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: "Welcome to Tricore Technology Solutions",
      html,
    }),
  });

  if (!send.ok) {
    console.error("Resend error:", await send.text());
    return new Response("Email send failed", { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
