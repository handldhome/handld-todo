-- Track tasks synced from Airtable
CREATE TABLE IF NOT EXISTS public.airtable_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  airtable_table TEXT NOT NULL,
  airtable_record_id TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- 'quote_followup', 'unscheduled_job', etc.
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(airtable_table, airtable_record_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_airtable_sync_record ON public.airtable_sync(airtable_table, airtable_record_id);
CREATE INDEX IF NOT EXISTS idx_airtable_sync_task ON public.airtable_sync(task_id);

-- Enable RLS
ALTER TABLE public.airtable_sync ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own synced tasks
CREATE POLICY "Users can view own synced tasks" ON public.airtable_sync
  FOR SELECT USING (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert synced tasks" ON public.airtable_sync
  FOR INSERT WITH CHECK (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete synced tasks" ON public.airtable_sync
  FOR DELETE USING (
    task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
  );
