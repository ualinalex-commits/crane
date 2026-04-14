-- =============================================================================
-- Migration: Add PIN authentication columns to profiles
-- =============================================================================
-- Run this in Supabase SQL Editor to add PIN-based login support.
-- pin_hash        — SHA-256 hex of the 8-digit PIN (NULL when no active PIN)
-- pin_expires_at  — UTC timestamp when the PIN becomes invalid (NULL when no active PIN)
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin_hash       text,
  ADD COLUMN IF NOT EXISTS pin_expires_at timestamptz;
