// =============================================================================
// verify-pin — Supabase Edge Function
// =============================================================================
// POST { email: string, pin: string }
//
// 1. Looks up the profile by email and fetches its stored PIN hash + expiry.
// 2. Checks the PIN hasn't expired.
// 3. Hashes the submitted PIN and compares to the stored hash.
// 4. On success: clears the PIN (one-time use) and generates a magic-link
//    token so the client can establish a Supabase session.
//
// Returns:
//   200 { token: string, email: string }  — client calls verifyOtp with these
//   400 { error: "invalid_pin" }
//   400 { error: "expired_pin" }
//   500 { error: "internal_error" }
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { email, pin } = await req.json();
    if (!email || !pin || typeof email !== 'string' || typeof pin !== 'string') {
      return json({ error: 'invalid_pin' }, 400);
    }

    const normalised = email.toLowerCase().trim();

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── 1. Fetch stored hash + expiry ─────────────────────────────────────
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, pin_hash, pin_expires_at')
      .eq('email', normalised)
      .single();

    if (profileError || !profile || !profile.pin_hash) {
      return json({ error: 'invalid_pin' }, 400);
    }

    // ── 2. Check expiry ───────────────────────────────────────────────────
    if (!profile.pin_expires_at || new Date(profile.pin_expires_at) < new Date()) {
      return json({ error: 'expired_pin' }, 400);
    }

    // ── 3. Compare hashes ─────────────────────────────────────────────────
    const submittedHash = await sha256hex(pin.trim());
    if (submittedHash !== profile.pin_hash) {
      return json({ error: 'invalid_pin' }, 400);
    }

    // ── 4. Invalidate PIN (one-time use) ──────────────────────────────────
    await admin
      .from('profiles')
      .update({ pin_hash: null, pin_expires_at: null })
      .eq('id', profile.id);

    // ── 5. Generate magic-link token for client session creation ──────────
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      throw linkError ?? new Error('generateLink returned no token');
    }

    return json({
      token: linkData.properties.hashed_token,
      email: profile.email,
    });
  } catch (err) {
    console.error('[verify-pin]', err);
    return json({ error: 'internal_error' }, 500);
  }
});
