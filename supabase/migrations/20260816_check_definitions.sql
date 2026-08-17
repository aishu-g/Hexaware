-- 1. Create check_definitions table
CREATE TABLE IF NOT EXISTS public.check_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('record', 'cluster', 'aggregate')),
  type TEXT NOT NULL CHECK (type IN ('hard', 'soft')),
  check_kind TEXT NOT NULL CHECK (check_kind IN ('referential', 'existential', 'range', 'pattern')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create check_results table
CREATE TABLE IF NOT EXISTS public.check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.survey_batches(id) ON DELETE CASCADE,
  record_id TEXT NOT NULL,
  check_id UUID REFERENCES public.check_definitions(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  severity TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.check_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to check_definitions" ON public.check_definitions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to check_results" ON public.check_results FOR SELECT USING (true);

-- Insert Default Seed Checks (Range & Referential Integrity)
INSERT INTO public.check_definitions (id, name, level, type, check_kind, config, active)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Respondent Age Range Check (0 to 110)',
    'record',
    'hard',
    'range',
    '{"field": "age", "min": 0, "max": 110}'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Individual to Household Referential Integrity',
    'record',
    'hard',
    'referential',
    '{"foreign_key": "household_id", "target_table": "households"}'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Weekly Working Hours Upper Range Check (Max 84 hrs)',
    'record',
    'soft',
    'range',
    '{"field": "hours_worked", "min": 0, "max": 84}'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'PSU Identifier Format Pattern Check',
    'record',
    'soft',
    'pattern',
    '{"field": "psu_id", "pattern": "^PSU_[A-Z]{3,4}_[0-9]{1,4}$"}'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;
