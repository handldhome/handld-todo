import { NextResponse } from 'next/server';
import { fetchAllAirtableRecords } from '@/lib/airtable/client';
import { getLocalToday } from '@/lib/dateUtils';

export interface UnscheduledJob {
  id: string;
  customerName: string;
  address: string;
  jobType: string;
  targetDate: string;
  status: string;
  airtableRecordId: string;
}

// GET /api/airtable/unscheduled-jobs
// Returns jobs where Status = "Planned" and Target Date is within ±2 weeks
export async function GET() {
  try {
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    // Format dates for Airtable formula
    const startDate = twoWeeksAgo.toISOString().split('T')[0];
    const endDate = twoWeeksFromNow.toISOString().split('T')[0];

    // Airtable formula: Status = "Planned" AND Target Date is within range
    const formula = `AND(
      {Status} = "Planned",
      {Target Date} >= "${startDate}",
      {Target Date} <= "${endDate}"
    )`.replace(/\s+/g, ' ');

    const records = await fetchAllAirtableRecords('Jobs', {
      filterByFormula: formula,
      sort: [{ field: 'Target Date', direction: 'asc' }],
    });

    const jobs: UnscheduledJob[] = records.map(record => {
      // Build address from separate fields
      const street = (record.fields['Street Address (from Quote ID) (from Quote Line Item)'] as string) || '';
      const city = (record.fields['City'] as string) || '';
      const zip = (record.fields['Zip'] as string) || '';
      const addressParts = [street, city, zip].filter(Boolean);

      return {
        id: record.id,
        customerName: (record.fields['Customer'] as string) || 'Unknown Customer',
        address: addressParts.join(', '),
        jobType: (record.fields['Service'] as string) || '',
        targetDate: (record.fields['Target Date'] as string) || '',
        status: (record.fields['Status'] as string) || '',
        airtableRecordId: record.id,
      };
    });

    return NextResponse.json({
      count: jobs.length,
      jobs,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Airtable unscheduled jobs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
