// =============================================================================
// verify-pin — Supabase Edge Function
// =============================================================================
// POST { email: string, pin: string }
//
// 1. Looks up the profile by email and fetches its stored PIN hash + expiry.
// 2. Checks the PIN hasn't expired.
// 3. Hashes the submitted PIN and compares to the stored hash.
// 4. On success: clears the PIN (one-time use) and returns the full user
//    profile and assigned sites so the client can store them locally.
//
// Returns:
//   200 { user: User, sites: Site[] }
//   400 { error: "invalid_pin" }
//   400 { error: "expired_pin" }
//   500 { error: "internal_error" }
// =============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

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

    // ── 1. Fetch profile with PIN fields and site assignments ─────────────
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, name, email, role, company_id, active, pin_hash, pin_expires_at, user_sites(site_id)')
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

    // ── 5. Fetch sites for this user ──────────────────────────────────────
    const siteIds = (profile.user_sites as { site_id: string }[]).map((us) => us.site_id);

    let sites: { id: string; name: string; location: string; address: string }[] = [];
    if (siteIds.length > 0) {
      const { data, error: sitesError } = await admin
        .from('sites')
        .select('id, name, location, address')
        .in('id', siteIds);
      if (sitesError) throw sitesError;
      sites = data ?? [];
    }

    return json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        siteIds,
        companyId: profile.company_id ?? undefined,
        active: profile.active,
      },
      sites: sites ?? [],
    });
  } catch (err) {
    console.error('[verify-pin]', err);
    return json({ error: 'internal_error' }, 500);
  }
});
