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
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (auto-injected by Supabase)
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
  console.log('[verify-pin] handler called');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const body = await req.json();
    const { email, pin } = body ?? {};

    if (!email || !pin || typeof email !== 'string' || typeof pin !== 'string') {
      return json({ error: 'invalid_pin' }, 400);
    }

    const normalised = email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const dbHeaders: Record<string, string> = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    };

    // ── 1. Fetch profile with PIN fields ──────────────────────────────────
    console.log('[verify-pin] looking up profile for:', normalised);

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(normalised)}&select=id,name,email,role,company_id,active,pin_hash,pin_expires_at`,
      { headers: { ...dbHeaders, 'Accept': 'application/vnd.pgrst.object+json' } },
    );

    console.log('[verify-pin] profile lookup status:', profileRes.status);

    if (!profileRes.ok) {
      const text = await profileRes.text();
      console.error('[verify-pin] profile lookup failed:', profileRes.status, text);
      return json({ error: 'invalid_pin' }, 400);
    }

    const profile = await profileRes.json();

    if (!profile || !profile.pin_hash) {
      console.log('[verify-pin] no profile or no pin_hash');
      return json({ error: 'invalid_pin' }, 400);
    }

    // ── 2. Check expiry ───────────────────────────────────────────────────
    if (!profile.pin_expires_at || new Date(profile.pin_expires_at) < new Date()) {
      console.log('[verify-pin] PIN expired');
      return json({ error: 'expired_pin' }, 400);
    }

    // ── 3. Compare hashes ─────────────────────────────────────────────────
    const submittedHash = await sha256hex(pin.trim());
    if (submittedHash !== profile.pin_hash) {
      console.log('[verify-pin] PIN hash mismatch');
      return json({ error: 'invalid_pin' }, 400);
    }

    console.log('[verify-pin] PIN valid, invalidating');

    // ── 4. Invalidate PIN (one-time use) ──────────────────────────────────
    const invalidateRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profile.id)}`,
      {
        method: 'PATCH',
        headers: dbHeaders,
        body: JSON.stringify({ pin_hash: null, pin_expires_at: null }),
      },
    );

    if (!invalidateRes.ok) {
      // Log but don't fail — the PIN was valid, let the user in
      const text = await invalidateRes.text();
      console.error('[verify-pin] PIN invalidation failed (non-fatal):', invalidateRes.status, text);
    }

    // ── 5. Fetch site assignments for this user ───────────────────────────
    console.log('[verify-pin] fetching user_sites for profile:', profile.id);

    const userSitesRes = await fetch(
      `${supabaseUrl}/rest/v1/user_sites?user_id=eq.${encodeURIComponent(profile.id)}&select=site_id`,
      { headers: dbHeaders },
    );

    let siteIds: string[] = [];
    if (userSitesRes.ok) {
      const userSites: { site_id: string }[] = await userSitesRes.json();
      siteIds = userSites.map((us) => us.site_id);
    } else {
      const text = await userSitesRes.text();
      console.error('[verify-pin] user_sites lookup failed:', userSitesRes.status, text);
    }

    console.log('[verify-pin] siteIds:', siteIds);

    // ── 6. Fetch site details ─────────────────────────────────────────────
    let sites: { id: string; name: string; location: string; address: string }[] = [];
    if (siteIds.length > 0) {
      const sitesRes = await fetch(
        `${supabaseUrl}/rest/v1/sites?id=in.(${siteIds.join(',')})&select=id,name,location,address`,
        { headers: dbHeaders },
      );

      if (sitesRes.ok) {
        sites = await sitesRes.json();
      } else {
        const text = await sitesRes.text();
        console.error('[verify-pin] sites lookup failed:', sitesRes.status, text);
      }
    }

    console.log('[verify-pin] success, returning user + sites');

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
      sites,
    });
  } catch (err) {
    console.error('[verify-pin] unhandled error:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
