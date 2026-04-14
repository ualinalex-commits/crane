// =============================================================================
// request-pin — Supabase Edge Function
// =============================================================================
// POST { email: string }
//
// 1. Checks the email exists in public.profiles (and is active).
// 2. Generates a cryptographically random 8-digit PIN.
// 3. Hashes it with SHA-256 and stores the hash + 10-minute expiry.
// 4. Sends the plain PIN to the user via SMTP.
//
// Returns:
//   200 { success: true }
//   404 { error: "not_found" }        — email not in profiles or inactive
//   500 { error: "internal_error" }
//
// Required env vars (set in Supabase Dashboard → Project Settings → Edge Functions):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return json({ error: 'email_required' }, 400);
    }

    const normalised = email.toLowerCase().trim();

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── 1. Check the email exists in profiles ─────────────────────────────
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, active')
      .eq('email', normalised)
      .single();

    if (profileError || !profile || !profile.active) {
      return json({ error: 'not_found' }, 404);
    }

    // ── 2. Generate 8-digit PIN ────────────────────────────────────────────
    const rand = new Uint32Array(1);
    crypto.getRandomValues(rand);
    // Modulo gives uniform distribution over [0, 99_999_999]
    const pin = String(rand[0] % 100_000_000).padStart(8, '0');

    // ── 3. Hash and store ─────────────────────────────────────────────────
    const pinHash = await sha256hex(pin);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updateError } = await admin
      .from('profiles')
      .update({ pin_hash: pinHash, pin_expires_at: expiresAt })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    // ── 4. Send email via SMTP ─────────────────────────────────────────────
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') ?? '587', 10);
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    });

    await transporter.sendMail({
      from: Deno.env.get('SMTP_FROM'),
      to: normalised,
      subject: 'Your Crane App login PIN',
      text: `Your login PIN is: ${pin}. This PIN expires in 10 minutes.`,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto">
          <h2 style="color:#1a1a1a">Your Crane App login PIN</h2>
          <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#f97316">${pin}</p>
          <p style="color:#6b7280">This PIN expires in 10 minutes.</p>
          <p style="color:#6b7280;font-size:12px">If you did not request this PIN, you can safely ignore this email.</p>
        </div>
      `,
    });

    return json({ success: true });
  } catch (err) {
    console.error('[request-pin]', err);
    return json({ error: 'internal_error' }, 500);
  }
});
