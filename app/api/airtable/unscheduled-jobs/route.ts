import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SCHEDULING_SUPABASE_URL = process.env.SCHEDULING_SUPABASE_URL;
const SCHEDULING_SUPABASE_ANON_KEY = process.env.SCHEDULING_SUPABASE_ANON_KEY;

export interface UnscheduledJob {
  id: string;
  customerName: string;
  address: string;
  jobType: string;
  targetDate: string;
  status: string;
}

// GET /api/airtable/unscheduled-jobs
// Returns jobs where Status = "Planned" and Target Date is within ±2 weeks
export async function GET() {
  if (!SCHEDULING_SUPABASE_URL || !SCHEDULING_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Scheduling database not configured' }, { status: 500 });
  }

  try {
    const supabase = createClient(SCHEDULING_SUPABASE_URL, SCHEDULING_SUPABASE_ANON_KEY, {
      db: { schema: 'handld' },
    });

    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    const startDate = twoWeeksAgo.toISOString().split('T')[0];
    const endDate = twoWeeksFromNow.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('vw_jobs')
      .select('id, customer_name, service, target_date, status, address, city, zip_code')
      .eq('status', 'Planned')
      .gte('target_date', startDate)
      .lte('target_date', endDate)
      .order('target_date', { ascending: true });

    if (error) throw error;

    const jobs: UnscheduledJob[] = (data || []).map(job => {
      const addressParts = [job.address, job.city, job.zip_code].filter(Boolean);
      return {
        id: job.id,
        customerName: job.customer_name || 'Unknown Customer',
        address: addressParts.join(', '),
        jobType: job.service || '',
        targetDate: job.target_date || '',
        status: job.status || '',
      };
    });

    return NextResponse.json({
      count: jobs.length,
      jobs,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Supabase unscheduled jobs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
