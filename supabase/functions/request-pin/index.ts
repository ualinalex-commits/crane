// =============================================================================
// request-pin — Supabase Edge Function
// =============================================================================
// POST { email: string }
//
// 1. Checks the email exists in public.profiles (and is active).
// 2. Generates a cryptographically random 8-digit PIN.
// 3. Hashes it with SHA-256 and stores the hash + 10-minute expiry.
// 4. Sends the plain PIN to the user via Resend HTTP API.
//
// Returns:
//   200 { success: true }
//   400 { error: "email_required" }
//   404 { error: "not_found" }   — email not in profiles or inactive
//   500 { error: "internal_error" }
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (auto-injected by Supabase)
//   RESEND_API_KEY
//   RESEND_FROM  (e.g. "Crane App <noreply@yourdomain.com>")
// =============================================================================

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
  console.log('[request-pin] handler called');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const body = await req.json();
    const email = body?.email;

    if (!email || typeof email !== 'string') {
      return json({ error: 'email_required' }, 400);
    }

    const normalised = email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const dbHeaders: Record<string, string> = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    };

    // ── 1. Check email exists in profiles ─────────────────────────────────
    console.log('[request-pin] looking up profile for:', normalised);

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(normalised)}&select=id,email,active`,
      { headers: { ...dbHeaders, 'Accept': 'application/vnd.pgrst.object+json' } },
    );

    console.log('[request-pin] profile lookup status:', profileRes.status);

    if (!profileRes.ok) {
      const text = await profileRes.text();
      console.error('[request-pin] profile lookup failed:', profileRes.status, text);
      return json({ error: 'not_found' }, 404);
    }

    const profile = await profileRes.json();

    if (!profile || !profile.active) {
      console.log('[request-pin] profile not found or inactive');
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

    console.log('[request-pin] storing PIN hash for profile:', profile.id);

    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profile.id)}`,
      {
        method: 'PATCH',
        headers: dbHeaders,
        body: JSON.stringify({ pin_hash: pinHash, pin_expires_at: expiresAt }),
      },
    );

    if (!updateRes.ok) {
      const text = await updateRes.text();
      console.error('[request-pin] profile update failed:', updateRes.status, text);
      throw new Error(`Profile update failed (${updateRes.status}): ${text}`);
    }

    console.log('[request-pin] PIN stored, sending email');

    // ── 4. Send email via Resend HTTP API ─────────────────────────────────
    const resendKey = Deno.env.get('RESEND_API_KEY')!;
    const fromEmail = Deno.env.get('RESEND_FROM') ?? 'Crane App <noreply@example.com>';

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [normalised],
        subject: 'Your Crane App login PIN',
        text: `Your login PIN is: ${pin}\n\nThis PIN expires in 10 minutes.`,
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px">
            <h2 style="color:#1a1a1a;margin-bottom:8px">Your Crane App login PIN</h2>
            <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#f97316;margin:24px 0">${pin}</p>
            <p style="color:#6b7280">This PIN expires in 10 minutes.</p>
            <p style="color:#9ca3af;font-size:12px">If you did not request this PIN, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    console.log('[request-pin] Resend status:', emailRes.status);

    if (!emailRes.ok) {
      const text = await emailRes.text();
      console.error('[request-pin] email send failed:', emailRes.status, text);
      throw new Error(`Email send failed (${emailRes.status}): ${text}`);
    }

    console.log('[request-pin] success');
    return json({ success: true });
  } catch (err) {
    console.error('[request-pin] unhandled error:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
