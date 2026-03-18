import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SCHEDULING_SUPABASE_URL = process.env.SCHEDULING_SUPABASE_URL;
const SCHEDULING_SUPABASE_ANON_KEY = process.env.SCHEDULING_SUPABASE_ANON_KEY;

export interface PendingQuote {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  quoteLink: string;
  lastModified: string;
  hoursAgo: number;
  createdTime: string;
  airtableRecordId: string;
}

// GET /api/airtable/pending-quotes
// Returns quote requests where quote_approved is false/null, updated within last 7 days
export async function GET() {
  if (!SCHEDULING_SUPABASE_URL || !SCHEDULING_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Scheduling database not configured' }, { status: 500 });
  }

  try {
    const supabase = createClient(SCHEDULING_SUPABASE_URL, SCHEDULING_SUPABASE_ANON_KEY, {
      db: { schema: 'handld' },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data, error } = await supabase
      .from('vw_quote_requests')
      .select('id, quote_id, quote_approved, customer_name, customer_phone, customer_email, quote_link, updated_at')
      .or('quote_approved.is.null,quote_approved.eq.false')
      .gte('updated_at', sevenDaysAgo.toISOString())
      .lte('updated_at', oneHourAgo.toISOString())
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const quotes: PendingQuote[] = (data || []).map(record => {
      const lastModified = record.updated_at || '';
      const lastModifiedDate = new Date(lastModified);
      const hoursAgo = Math.floor((now.getTime() - lastModifiedDate.getTime()) / (1000 * 60 * 60));

      return {
        id: record.id,
        customerName: record.customer_name || 'Unknown Customer',
        phoneNumber: record.customer_phone || '',
        email: record.customer_email || '',
        quoteLink: record.quote_link || record.quote_id || '',
        lastModified,
        hoursAgo,
        createdTime: record.updated_at || '',
        airtableRecordId: record.id,
      };
    });

    return NextResponse.json({
      count: quotes.length,
      quotes,
    });
  } catch (error) {
    console.error('Supabase pending quotes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
