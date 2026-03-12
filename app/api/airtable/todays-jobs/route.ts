import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SCHEDULING_SUPABASE_URL = process.env.SCHEDULING_SUPABASE_URL;
const SCHEDULING_SUPABASE_ANON_KEY = process.env.SCHEDULING_SUPABASE_ANON_KEY;

// GET /api/airtable/todays-jobs
// Returns jobs scheduled for today from the scheduling Supabase (handld schema)
export async function GET() {
  if (!SCHEDULING_SUPABASE_URL || !SCHEDULING_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Scheduling database not configured' }, { status: 500 });
  }

  try {
    const supabase = createClient(SCHEDULING_SUPABASE_URL, SCHEDULING_SUPABASE_ANON_KEY, {
      db: { schema: 'handld' },
    });

    // Get today's date in LA timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    const { data, error } = await supabase
      .from('vw_jobs')
      .select('id, customer_name, service, service_detail, scheduled_time, scheduled_end, status, technician_id, confirmed')
      .eq('target_date', today)
      .neq('status', 'Cancelled')
      .order('scheduled_time', { ascending: true });

    if (error) throw error;

    const jobs = (data || []).map(job => ({
      id: job.id,
      customerName: job.customer_name || 'Unknown Customer',
      address: '',
      service: job.service || '',
      serviceDetail: job.service_detail || '',
      time: job.scheduled_time ? job.scheduled_time.slice(0, 5) : null,
      endTime: job.scheduled_end ? job.scheduled_end.slice(0, 5) : null,
      status: job.status || '',
      assignedTech: job.technician_id ? [job.technician_id] : [],
      confirmed: job.confirmed || false,
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Scheduling todays-jobs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
