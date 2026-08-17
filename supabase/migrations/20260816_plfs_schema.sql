-- 1. Create Surveys Metadata Table
CREATE TABLE IF NOT EXISTS public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Survey Batches Table (Ingestion Runs)
CREATE TABLE IF NOT EXISTS public.survey_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  survey_type TEXT DEFAULT 'PLFS',
  survey_round TEXT DEFAULT '2023-Q4',
  status TEXT DEFAULT 'completed',
  total_raw_records INT DEFAULT 0,
  total_households INT DEFAULT 0,
  total_individuals INT DEFAULT 0,
  total_anomalies INT DEFAULT 0,
  ingested_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Raw Records Staging Table
CREATE TABLE IF NOT EXISTS public.raw_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.survey_batches(id) ON DELETE CASCADE,
  record_index INT,
  raw_json JSONB NOT NULL,
  status TEXT DEFAULT 'staged', -- 'staged' | 'promoted' | 'error'
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Normalized Households Table
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.survey_batches(id) ON DELETE CASCADE,
  hh_id TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  psu_id TEXT NOT NULL,
  sector TEXT CHECK (sector IN ('rural', 'urban')) DEFAULT 'rural',
  hh_size INT DEFAULT 1,
  religion TEXT,
  social_group TEXT,
  monthly_expenditure NUMERIC(12, 2) DEFAULT 0,
  land_owned_hectares NUMERIC(8, 3) DEFAULT 0,
  enumerator_id TEXT,
  response_time_seconds INT DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Normalized Individuals Roster Table
CREATE TABLE IF NOT EXISTS public.individuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.survey_batches(id) ON DELETE CASCADE,
  person_id TEXT NOT NULL,
  age INT NOT NULL,
  sex INT NOT NULL CHECK (sex IN (1, 2, 3)), -- 1: Male, 2: Female, 3: Transgender
  general_education INT DEFAULT 1,
  marital_status INT DEFAULT 1,
  principal_activity_status INT DEFAULT 31,
  subsidiary_activity_status INT,
  weekly_earnings NUMERIC(12, 2) DEFAULT 0,
  hours_worked INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Visits / Schedules Table
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  visit_number INT DEFAULT 1,
  visit_date DATE DEFAULT CURRENT_DATE,
  enumerator_id TEXT,
  status TEXT DEFAULT 'completed', -- 'scheduled' | 'completed' | 'rescheduled' | 'refused'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users & service roles full access (RLS policies)
CREATE POLICY "Allow public read access to surveys" ON public.surveys FOR SELECT USING (true);
CREATE POLICY "Allow public read access to survey_batches" ON public.survey_batches FOR SELECT USING (true);
CREATE POLICY "Allow public read access to raw_records" ON public.raw_records FOR SELECT USING (true);
CREATE POLICY "Allow public read access to households" ON public.households FOR SELECT USING (true);
CREATE POLICY "Allow public read access to individuals" ON public.individuals FOR SELECT USING (true);
CREATE POLICY "Allow public read access to schedules" ON public.schedules FOR SELECT USING (true);

-- Insert Default PLFS Metadata Record
INSERT INTO public.surveys (code, name, description)
VALUES ('PLFS', 'Periodic Labour Force Survey', 'NSSO Annual and Quarterly Household Labour Force Survey Microdata')
ON CONFLICT (code) DO NOTHING;
