-- Create anomaly_scores Table
CREATE TABLE IF NOT EXISTS public.anomaly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.survey_batches(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('record', 'cluster', 'aggregate')),
  entity_id TEXT NOT NULL,
  score NUMERIC(6, 4) NOT NULL,
  method TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.anomaly_scores ENABLE ROW LEVEL SECURITY;

-- Allow public read access to anomaly_scores
CREATE POLICY "Allow public read access to anomaly_scores" ON public.anomaly_scores FOR SELECT USING (true);
