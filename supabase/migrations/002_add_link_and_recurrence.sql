-- Add link column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS link TEXT;

-- Add recurrence column to tasks (stored as JSONB)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence JSONB;

-- Create index for recurring tasks
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON public.tasks USING gin (recurrence) WHERE recurrence IS NOT NULL;
