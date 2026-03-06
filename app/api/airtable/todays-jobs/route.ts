import { NextResponse } from 'next/server';
import { fetchAllAirtableRecords } from '@/lib/airtable/client';

export const dynamic = 'force-dynamic';

// GET /api/airtable/todays-jobs
// Returns jobs scheduled for today (Target Date = today, Status != "Cancelled")
export async function GET() {
  try {
    // Use Airtable's TODAY() function for timezone-consistent filtering
    const formula = `AND(
      IS_SAME({Target Date}, TODAY()),
      {Status} != "Cancelled"
    )`.replace(/\s+/g, ' ');

    const records = await fetchAllAirtableRecords('Jobs', {
      filterByFormula: formula,
      sort: [{ field: 'Scheduled Time', direction: 'asc' }],
    });

    // Helper to extract first value from Airtable linked record fields (which are arrays)
    const first = (val: unknown): string => {
      if (Array.isArray(val)) return (val[0] as string) || '';
      return (val as string) || '';
    };

    const jobs = records.map(record => {
      const street = first(record.fields['Street Address (from Quote ID) (from Quote Line Item)']) ||
                     first(record.fields['Property Address']);
      const city = first(record.fields['City']);

      return {
        id: record.id,
        customerName: first(record.fields['Customer']) || 'Unknown Customer',
        address: [street, city].filter(Boolean).join(', '),
        service: (record.fields['Service'] as string) || '',
        serviceDetail: (record.fields['Service Detail'] as string) || '',
        time: (record.fields['Scheduled Time'] as string) || null,
        endTime: (record.fields['Scheduled End'] as string) || null,
        status: (record.fields['Status'] as string) || '',
        assignedTech: (record.fields['Assigned Technician'] as string[]) || [],
        confirmed: (record.fields['Confirmed'] as boolean) || false,
      };
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Airtable todays-jobs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
