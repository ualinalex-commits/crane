-- =============================================================================
-- Crane App — Supabase Schema
-- =============================================================================
-- HOW TO USE:
--   1. Create a new Supabase project at https://supabase.com
--   2. Go to SQL Editor → New Query
--   3. Paste this entire file and click Run
--
-- SEED DATA NOTE:
--   The profiles (users) seed uses placeholder UUIDs (c0000000-...).
--   These must match real Supabase auth user UUIDs to enforce the FK.
--   The SET session_replication_role = replica trick below lets you run
--   the seed immediately without real auth accounts (great for testing).
--   When you create real users later, update the c0000000-... UUIDs to match.
--
-- VERCEL ENV VARS:
--   Add these in Vercel → Project → Settings → Environment Variables:
--     EXPO_PUBLIC_SUPABASE_URL      = https://<project-ref>.supabase.co
--     EXPO_PUBLIC_SUPABASE_ANON_KEY = <anon-public-key>
--   (The EXPO_PUBLIC_ prefix is required for Expo web client bundles)
-- =============================================================================


-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'Appointed_Person',
  'Crane_Supervisor',
  'Crane_Operator',
  'Slinger_Signaller',
  'Subcontractor'
);

CREATE TYPE booking_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE crane_log_status AS ENUM (
  'working',
  'breaking_down',
  'service',
  'thorough_examination',
  'wind_off'
);


-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- sites
-- -----------------------------------------------------------------------------
CREATE TABLE public.sites (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      text NOT NULL,
  location  text NOT NULL,
  address   text NOT NULL
);

-- -----------------------------------------------------------------------------
-- companies
-- -----------------------------------------------------------------------------
CREATE TABLE public.companies (
  id              uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text    NOT NULL,
  contact_name    text    NOT NULL,
  contact_email   text    NOT NULL,
  contact_phone   text,                         -- optional
  active          boolean NOT NULL DEFAULT true
);

-- -----------------------------------------------------------------------------
-- profiles  (one row per Supabase auth account)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          uuid      PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text      NOT NULL,
  email       text      NOT NULL,
  role        user_role NOT NULL,
  company_id  uuid      REFERENCES public.companies(id) ON DELETE SET NULL,  -- Subcontractors only
  active      boolean   NOT NULL DEFAULT true
);

-- -----------------------------------------------------------------------------
-- user_sites  (many-to-many: profiles <-> sites)
-- Represents the User.siteIds[] array from the TypeScript model.
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_sites (
  user_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  site_id  uuid NOT NULL REFERENCES public.sites(id)    ON DELETE CASCADE,
  PRIMARY KEY (user_id, site_id)
);

-- -----------------------------------------------------------------------------
-- cranes
-- -----------------------------------------------------------------------------
CREATE TABLE public.cranes (
  id                   uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id              uuid         NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name                 text         NOT NULL,
  model                text         NOT NULL,
  max_capacity_tonnes  numeric(8,2) NOT NULL,
  active               boolean      NOT NULL DEFAULT true,
  colour               text         NOT NULL  -- hex e.g. '#3B82F6'
);

-- -----------------------------------------------------------------------------
-- bookings
-- ON DELETE RESTRICT on site/crane/company/requested_by:
--   safety-critical records must never be silently deleted.
-- -----------------------------------------------------------------------------
CREATE TABLE public.bookings (
  id               uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id          uuid           NOT NULL REFERENCES public.sites(id)     ON DELETE RESTRICT,
  crane_id         uuid           NOT NULL REFERENCES public.cranes(id)    ON DELETE RESTRICT,
  company_id       uuid           NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  requested_by_id  uuid           NOT NULL REFERENCES public.profiles(id)  ON DELETE RESTRICT,
  job_details      text           NOT NULL,
  date             date           NOT NULL,
  start_time       time           NOT NULL,   -- local site time, no timezone
  end_time         time           NOT NULL,
  status           booking_status NOT NULL DEFAULT 'pending',
  rejection_reason text,                      -- null unless rejected
  created_at       timestamptz    NOT NULL DEFAULT now(),
  approved_at      timestamptz,               -- null while pending
  approved_by_id   uuid           REFERENCES public.profiles(id) ON DELETE SET NULL  -- person who approved OR rejected
);

-- -----------------------------------------------------------------------------
-- crane_logs
-- Intentionally no FK to bookings — separate entities per app design.
-- -----------------------------------------------------------------------------
CREATE TABLE public.crane_logs (
  id             uuid             PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id        uuid             NOT NULL REFERENCES public.sites(id)    ON DELETE RESTRICT,
  crane_id       uuid             NOT NULL REFERENCES public.cranes(id)   ON DELETE RESTRICT,
  company_id     uuid             REFERENCES public.companies(id) ON DELETE SET NULL,  -- only when status = 'working'
  status         crane_log_status NOT NULL,
  job_details    text             NOT NULL,
  image_uri      text,                        -- Supabase Storage URL, nullable
  start_time     timestamptz      NOT NULL,
  end_time       timestamptz,                 -- null while is_open = true
  is_open        boolean          NOT NULL DEFAULT true,
  created_by_id  uuid             NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at     timestamptz      NOT NULL DEFAULT now()
);


-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_user_sites_user_id    ON public.user_sites(user_id);
CREATE INDEX idx_user_sites_site_id    ON public.user_sites(site_id);

CREATE INDEX idx_cranes_site_id        ON public.cranes(site_id);

CREATE INDEX idx_bookings_site_id      ON public.bookings(site_id);
CREATE INDEX idx_bookings_crane_id     ON public.bookings(crane_id);
CREATE INDEX idx_bookings_date         ON public.bookings(date);
CREATE INDEX idx_bookings_status       ON public.bookings(status);
CREATE INDEX idx_bookings_company_id   ON public.bookings(company_id);
CREATE INDEX idx_bookings_requested_by ON public.bookings(requested_by_id);
CREATE INDEX idx_bookings_site_date    ON public.bookings(site_id, date);   -- timeline view

CREATE INDEX idx_crane_logs_site_id    ON public.crane_logs(site_id);
CREATE INDEX idx_crane_logs_crane_id   ON public.crane_logs(crane_id);
CREATE INDEX idx_crane_logs_is_open    ON public.crane_logs(is_open);
CREATE INDEX idx_crane_logs_start_time ON public.crane_logs(start_time);
CREATE INDEX idx_crane_logs_created_by ON public.crane_logs(created_by_id);
CREATE INDEX idx_crane_logs_site_crane ON public.crane_logs(site_id, crane_id);


-- =============================================================================
-- HELPER FUNCTIONS  (SECURITY DEFINER — bypass RLS for internal lookups)
-- Must be created AFTER tables so Postgres can resolve the references.
-- =============================================================================

-- Returns the role of the current auth user.
-- Used in RLS policies to avoid recursive evaluation on the profiles table.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Returns true if the current user is assigned to the given site.
CREATE OR REPLACE FUNCTION public.user_is_on_site(p_site_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_sites
    WHERE user_id = auth.uid() AND site_id = p_site_id
  )
$$;

-- Returns the company_id of the current user (Subcontractors only).
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.sites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cranes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crane_logs ENABLE ROW LEVEL SECURITY;

-- ── sites ─────────────────────────────────────────────────────────────────────

CREATE POLICY "sites_select" ON public.sites
  FOR SELECT USING (public.user_is_on_site(id));

CREATE POLICY "sites_manage" ON public.sites
  FOR ALL USING (public.current_user_role() = 'Appointed_Person');

-- ── companies ─────────────────────────────────────────────────────────────────

CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "companies_manage" ON public.companies
  FOR ALL USING (public.current_user_role() = 'Appointed_Person');

-- ── profiles ──────────────────────────────────────────────────────────────────

-- Users can always read/update their own profile
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (id = auth.uid());

-- Users can read profiles of anyone on a shared site
CREATE POLICY "profiles_shared_site" ON public.profiles
  FOR SELECT USING (
    id IN (
      SELECT us.user_id FROM public.user_sites us
      WHERE us.site_id IN (
        SELECT site_id FROM public.user_sites WHERE user_id = auth.uid()
      )
    )
  );

-- Appointed_Person can manage all profiles
CREATE POLICY "profiles_manage" ON public.profiles
  FOR ALL USING (public.current_user_role() = 'Appointed_Person');

-- ── user_sites ────────────────────────────────────────────────────────────────

CREATE POLICY "user_sites_own_select" ON public.user_sites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_sites_manage" ON public.user_sites
  FOR ALL USING (public.current_user_role() = 'Appointed_Person');

-- ── cranes ────────────────────────────────────────────────────────────────────

CREATE POLICY "cranes_select" ON public.cranes
  FOR SELECT USING (public.user_is_on_site(site_id));

CREATE POLICY "cranes_manage" ON public.cranes
  FOR ALL USING (public.current_user_role() = 'Appointed_Person');

-- ── bookings ──────────────────────────────────────────────────────────────────

-- Appointed_Person: full access on their sites
CREATE POLICY "bookings_ap_all" ON public.bookings
  FOR ALL USING (
    public.current_user_role() = 'Appointed_Person'
    AND public.user_is_on_site(site_id)
  );

-- Crane staff: read all bookings on their sites
CREATE POLICY "bookings_staff_select" ON public.bookings
  FOR SELECT USING (
    public.current_user_role() IN ('Crane_Supervisor', 'Crane_Operator', 'Slinger_Signaller')
    AND public.user_is_on_site(site_id)
  );

-- Subcontractor: read their company's bookings on their sites
CREATE POLICY "bookings_sub_select" ON public.bookings
  FOR SELECT USING (
    public.current_user_role() = 'Subcontractor'
    AND company_id = public.current_user_company_id()
    AND public.user_is_on_site(site_id)
  );

-- Subcontractor: create bookings for their company
CREATE POLICY "bookings_sub_insert" ON public.bookings
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'Subcontractor'
    AND company_id       = public.current_user_company_id()
    AND requested_by_id  = auth.uid()
    AND public.user_is_on_site(site_id)
  );

-- Subcontractor: edit only their own pending bookings
CREATE POLICY "bookings_sub_update_pending" ON public.bookings
  FOR UPDATE
  USING (
    public.current_user_role() = 'Subcontractor'
    AND requested_by_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (company_id = public.current_user_company_id());

-- ── crane_logs ────────────────────────────────────────────────────────────────

-- Appointed_Person: full access on their sites
CREATE POLICY "crane_logs_ap_all" ON public.crane_logs
  FOR ALL USING (
    public.current_user_role() = 'Appointed_Person'
    AND public.user_is_on_site(site_id)
  );

-- Crane staff: read all logs on their sites
CREATE POLICY "crane_logs_staff_select" ON public.crane_logs
  FOR SELECT USING (
    public.current_user_role() IN ('Crane_Supervisor', 'Crane_Operator', 'Slinger_Signaller')
    AND public.user_is_on_site(site_id)
  );

-- Crane staff: create logs on their sites
CREATE POLICY "crane_logs_staff_insert" ON public.crane_logs
  FOR INSERT WITH CHECK (
    public.current_user_role() IN ('Crane_Supervisor', 'Crane_Operator', 'Slinger_Signaller')
    AND created_by_id = auth.uid()
    AND public.user_is_on_site(site_id)
  );

-- Crane staff: update (close) their own logs
CREATE POLICY "crane_logs_staff_update_own" ON public.crane_logs
  FOR UPDATE USING (
    public.current_user_role() IN ('Crane_Supervisor', 'Crane_Operator', 'Slinger_Signaller')
    AND created_by_id = auth.uid()
    AND public.user_is_on_site(site_id)
  );

-- Subcontractor: read their company's crane logs on their sites
CREATE POLICY "crane_logs_sub_select" ON public.crane_logs
  FOR SELECT USING (
    public.current_user_role() = 'Subcontractor'
    AND company_id = public.current_user_company_id()
    AND public.user_is_on_site(site_id)
  );


-- =============================================================================
-- SEED DATA
-- =============================================================================
-- UUID namespace:
--   a000...N = sites      (N = 1–2)
--   b000...N = companies  (N = 1–4)
--   c000...N = profiles   (N = 1–8)  ← replace with real auth.users UUIDs
--   d000...N = cranes     (N = 1–7)
--   e000...N = bookings   (N = 1–22)
--   f000...N = crane_logs (N = 1–5)
-- =============================================================================

-- ── sites ─────────────────────────────────────────────────────────────────────

INSERT INTO public.sites (id, name, location, address) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Canary Wharf Tower',  'London Docklands',       'Bank Street, Canary Wharf, London E14 5JP'),
  ('a0000000-0000-0000-0000-000000000002', 'Manchester City Hub', 'Manchester City Centre', 'Deansgate, Manchester M3 4LZ');

-- ── companies ─────────────────────────────────────────────────────────────────

INSERT INTO public.companies (id, name, contact_name, contact_email, contact_phone, active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Apex Steelworks Ltd',      'Dave Flanagan', 'dave@apexsteel.co.uk',        '07700 900123', true),
  ('b0000000-0000-0000-0000-000000000002', 'BrightBuild Contractors',  'Sarah Okonkwo', 'sarah@brightbuild.co.uk',     '07700 900456', true),
  ('b0000000-0000-0000-0000-000000000003', 'Northern Formwork Ltd',    'Tom Ashworth',  'tom@northernformwork.co.uk',  '07700 900789', true),
  ('b0000000-0000-0000-0000-000000000004', 'Midland Cladding Systems', 'Priya Sharma',  'priya@midlandcladding.co.uk', '07700 900321', false);

-- ── profiles ──────────────────────────────────────────────────────────────────
-- session_replication_role = replica bypasses the FK to auth.users so the seed
-- works before real auth accounts exist. Remove these two lines once you've
-- replaced the c0000000-... UUIDs with your real Supabase auth user UUIDs.

SET session_replication_role = replica;

INSERT INTO public.profiles (id, name, email, role, company_id, active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'James Whitfield', 'j.whitfield@sitemanagement.co.uk', 'Appointed_Person',  NULL,                                   true),
  ('c0000000-0000-0000-0000-000000000002', 'Karen Hughes',    'k.hughes@sitemanagement.co.uk',    'Crane_Supervisor',  NULL,                                   true),
  ('c0000000-0000-0000-0000-000000000003', 'Liam O''Brien',   'l.obrien@sitemanagement.co.uk',    'Crane_Operator',    NULL,                                   true),
  ('c0000000-0000-0000-0000-000000000004', 'Mo Patel',        'm.patel@sitemanagement.co.uk',     'Slinger_Signaller', NULL,                                   true),
  ('c0000000-0000-0000-0000-000000000005', 'Dave Flanagan',   'dave@apexsteel.co.uk',             'Subcontractor',     'b0000000-0000-0000-0000-000000000001', true),
  ('c0000000-0000-0000-0000-000000000006', 'Sarah Okonkwo',   'sarah@brightbuild.co.uk',          'Subcontractor',     'b0000000-0000-0000-0000-000000000002', true),
  ('c0000000-0000-0000-0000-000000000007', 'Tom Ashworth',    'tom@northernformwork.co.uk',       'Subcontractor',     'b0000000-0000-0000-0000-000000000003', true),
  ('c0000000-0000-0000-0000-000000000008', 'Donna Reeves',    'd.reeves@sitemanagement.co.uk',    'Crane_Supervisor',  NULL,                                   false);

SET session_replication_role = DEFAULT;

-- ── user_sites ────────────────────────────────────────────────────────────────

INSERT INTO public.user_sites (user_id, site_id) VALUES
  -- James Whitfield (AP): site-1 + site-2
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'),
  -- Karen Hughes (CS): site-1
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
  -- Liam O'Brien (CO): site-1 + site-2
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002'),
  -- Mo Patel (SS): site-1
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001'),
  -- Dave Flanagan (sub-1, Apex): site-1
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001'),
  -- Sarah Okonkwo (sub-2, BrightBuild): site-1 + site-2
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002'),
  -- Tom Ashworth (sub-3, Northern): site-2
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002'),
  -- Donna Reeves (CS-2, inactive): site-2
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002');

-- ── cranes ────────────────────────────────────────────────────────────────────

INSERT INTO public.cranes (id, site_id, name, model, max_capacity_tonnes, active, colour) VALUES
  -- Site 1
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Tower Crane 1', 'Liebherr 380 EC-B',     16,  true,  '#3B82F6'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Luffing Jib A', 'Potain MR 295',          12,  true,  '#8B5CF6'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Mobile Crane 1','Liebherr LTM 1100-4.2', 100,  true,  '#F97316'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Tower Crane 2', 'Terex CTT 332',          18,  false, '#06B6D4'),
  -- Site 2
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Tower Crane 1', 'Potain MDT 389',         20,  true,  '#22C55E'),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Tower Crane 2', 'Liebherr 200 EC-H',      10,  true,  '#EAB308'),
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'Mobile Crane 1','Grove GMK5150L',         150, true,  '#EC4899');

-- ── bookings ─────────────────────────────────────────────────────────────────
-- 22 rows: 15 approved, 5 pending, 2 rejected

INSERT INTO public.bookings (
  id, site_id, crane_id, company_id, requested_by_id,
  job_details, date, start_time, end_time,
  status, rejection_reason, created_at, approved_at, approved_by_id
) VALUES

  -- ── Approved — Site 1 ───────────────────────────────────────────────────
  ('e0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Lift structural steel sections to level 12 — column splices and beams. Approx 8 lifts required.',
   '2026-04-12', '07:00', '10:00', 'approved', NULL,
   '2026-04-08T09:00:00Z', '2026-04-08T14:30:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
   'Hoist pre-cast concrete panels to floors 8–10. Ground-floor delivery via HGV 07:00.',
   '2026-04-12', '10:30', '14:00', 'approved', NULL,
   '2026-04-09T10:00:00Z', '2026-04-09T15:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
   'Plant delivery — 2× concrete pumps to roof plant area. Requires banksman.',
   '2026-04-12', '14:30', '16:30', 'approved', NULL,
   '2026-04-09T11:00:00Z', '2026-04-09T16:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Lift temporary works falsework frames — 6 bays at grid lines A–F.',
   '2026-04-14', '07:30', '11:30', 'approved', NULL,
   '2026-04-10T08:00:00Z', '2026-04-10T12:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007',
   'Cladding panel installation — east elevation, floors 5–8. Panels arriving 06:30.',
   '2026-04-14', '07:00', '13:00', 'approved', NULL,
   '2026-04-10T09:00:00Z', '2026-04-10T13:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Structural steel to level 14 — continuation of phase 3B erection sequence.',
   '2026-04-15', '07:00', '12:00', 'approved', NULL,
   '2026-04-10T10:00:00Z', '2026-04-10T15:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000007',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
   'Mechanical plant hoisting — AHU units to roof. 4 units, each approx 1.8t.',
   '2026-04-15', '13:00', '16:00', 'approved', NULL,
   '2026-04-10T11:00:00Z', '2026-04-10T16:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000008',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
   'Glazing unit lift — curtain wall panels, north elevation.',
   '2026-04-16', '08:00', '11:00', 'approved', NULL,
   '2026-04-11T08:00:00Z', '2026-04-11T12:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000009',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007',
   'Scaffold lift: tube and fittings to floor 16 working platform.',
   '2026-04-16', '12:00', '15:00', 'approved', NULL,
   '2026-04-11T09:00:00Z', '2026-04-11T13:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000010',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Steel erection — top-out sequence, floors 18–20. Final phase.',
   '2026-04-17', '07:00', '16:00', 'approved', NULL,
   '2026-04-11T10:00:00Z', '2026-04-11T14:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  -- ── Approved — Site 2 ───────────────────────────────────────────────────
  ('e0000000-0000-0000-0000-000000000011',
   'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
   'Pre-cast floor units — grid D, levels 3–5. Delivery 06:45 from Halifax yard.',
   '2026-04-12', '07:00', '12:00', 'approved', NULL,
   '2026-04-09T08:00:00Z', '2026-04-09T12:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000012',
   'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006',
   'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007',
   'Timber frame panels — residential block B, floors 1–3.',
   '2026-04-13', '08:00', '14:00', 'approved', NULL,
   '2026-04-09T09:00:00Z', '2026-04-09T13:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  -- ── Past approved (calendar history) ────────────────────────────────────
  ('e0000000-0000-0000-0000-000000000013',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Foundation beam lifts — raft slab preparation.',
   '2026-04-03', '07:00', '11:00', 'approved', NULL,
   '2026-03-30T08:00:00Z', '2026-03-30T14:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000014',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
   'Rebar bundles to floor 6 pour preparation.',
   '2026-04-07', '09:00', '13:00', 'approved', NULL,
   '2026-04-03T09:00:00Z', '2026-04-03T14:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000015',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Steel delivery — unloading from articulated lorry, 14 sections.',
   '2026-04-09', '07:00', '10:00', 'approved', NULL,
   '2026-04-05T08:00:00Z', '2026-04-05T12:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  -- ── Pending ──────────────────────────────────────────────────────────────
  ('e0000000-0000-0000-0000-000000000016',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Level 22 steel — final topping-out sequence, cantilever sections at gridlines 8–10.',
   '2026-04-18', '07:00', '14:00', 'pending', NULL,
   '2026-04-12T08:00:00Z', NULL, NULL),

  ('e0000000-0000-0000-0000-000000000017',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
   'Façade panel installation — south elevation, levels 10–14. 3 panels per bay.',
   '2026-04-18', '09:00', '16:00', 'pending', NULL,
   '2026-04-12T09:00:00Z', NULL, NULL),

  ('e0000000-0000-0000-0000-000000000018',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007',
   'Scaffold strike — removing platform at level 12 and lowering to ground.',
   '2026-04-19', '07:30', '11:00', 'pending', NULL,
   '2026-04-12T10:00:00Z', NULL, NULL),

  ('e0000000-0000-0000-0000-000000000019',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
   'Roof plant — CRAC units x4, each 2.2t. Requires spreader beam.',
   '2026-04-21', '08:00', '12:00', 'pending', NULL,
   '2026-04-12T11:00:00Z', NULL, NULL),

  ('e0000000-0000-0000-0000-000000000020',
   'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007',
   'Precast stair flights — blocks A and B, levels 4–7.',
   '2026-04-20', '07:00', '13:00', 'pending', NULL,
   '2026-04-12T12:00:00Z', NULL, NULL),

  -- ── Rejected ─────────────────────────────────────────────────────────────
  ('e0000000-0000-0000-0000-000000000021',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
   'Window unit installation — west elevation, all floors.',
   '2026-04-17', '07:00', '16:00', 'rejected',
   'Crane 1 is already fully booked on this date for the steel top-out. Please reschedule to 21 April or later.',
   '2026-04-10T14:00:00Z', '2026-04-11T09:00:00Z', 'c0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000022',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Emergency rebar delivery uplift — urgent request.',
   '2026-04-12', '06:00', '07:00', 'rejected',
   'Lifts cannot commence before 07:00 on this site. Working hours 07:00–17:00 Mon–Fri.',
   '2026-04-11T20:00:00Z', '2026-04-12T06:30:00Z', 'c0000000-0000-0000-0000-000000000001');

-- ── crane_logs ────────────────────────────────────────────────────────────────
-- 5 rows: 3 closed, 2 open

INSERT INTO public.crane_logs (
  id, site_id, crane_id, company_id,
  status, job_details,
  start_time, end_time, is_open,
  created_by_id, created_at
) VALUES
  -- log-001: closed, working, crane-1a, Apex, Liam
  ('f0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'working', 'Steel erection to level 12 — all lifts completed without incident.',
   '2026-04-11T07:05:00Z', '2026-04-11T10:02:00Z', false,
   'c0000000-0000-0000-0000-000000000003', '2026-04-11T07:05:00Z'),

  -- log-002: closed, service, crane-1b, no company, Karen
  ('f0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   NULL,
   'service', 'Routine monthly service — oil change, brake inspection, limit switch check.',
   '2026-04-11T08:00:00Z', '2026-04-11T11:30:00Z', false,
   'c0000000-0000-0000-0000-000000000002', '2026-04-11T08:00:00Z'),

  -- log-003: OPEN, working, crane-1a, BrightBuild, Liam
  ('f0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'working', 'Pre-cast concrete panels to floors 8–10.',
   '2026-04-12T07:02:00Z', NULL, true,
   'c0000000-0000-0000-0000-000000000003', '2026-04-12T07:02:00Z'),

  -- log-004: closed, thorough_examination, crane-1c, no company, Karen
  ('f0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003',
   NULL,
   'thorough_examination', '6-monthly thorough examination by CPCS-certified examiner. Certificate TE-2026-041.',
   '2026-04-12T06:30:00Z', '2026-04-12T07:45:00Z', false,
   'c0000000-0000-0000-0000-000000000002', '2026-04-12T06:30:00Z'),

  -- log-005: OPEN, working, crane-2a, BrightBuild, Liam — site-2
  ('f0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000002',
   'working', 'Pre-cast floor units — grid D, levels 3–5.',
   '2026-04-12T07:00:00Z', NULL, true,
   'c0000000-0000-0000-0000-000000000003', '2026-04-12T07:00:00Z');

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
