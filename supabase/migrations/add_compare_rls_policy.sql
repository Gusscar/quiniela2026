-- Migration: Allow authenticated users to read predictions for finished/live matches
-- This enables the /compare feature while keeping pending predictions private.
--
-- HOW TO APPLY:
--   Supabase Dashboard → SQL Editor → paste and run this file.
--   OR: supabase db push (if using Supabase CLI with linked project)

CREATE POLICY "Authenticated read finished predictions" ON predictions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = predictions.match_id
        AND m.status IN ('finished', 'live')
    )
  );
