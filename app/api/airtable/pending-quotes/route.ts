import { NextResponse } from 'next/server';
import { fetchAllAirtableRecords } from '@/lib/airtable/client';

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
// Returns quote requests where Quote Approved = false and Last Modified > 1 hour ago
export async function GET() {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Airtable formula: Quote Approved is false/empty AND Last Modified within past week but > 1 hour ago
    // Note: Airtable's LAST_MODIFIED_TIME() returns the record's last modified time
    const formula = `AND(
      OR({Quote Approved} = FALSE(), {Quote Approved} = BLANK()),
      DATETIME_DIFF(NOW(), LAST_MODIFIED_TIME(), 'hours') >= 1,
      DATETIME_DIFF(NOW(), LAST_MODIFIED_TIME(), 'days') <= 7
    )`.replace(/\s+/g, ' ');

    const records = await fetchAllAirtableRecords('Quote Requests', {
      filterByFormula: formula,
      sort: [{ field: 'Last Modified', direction: 'desc' }],
    });

    const now = new Date();
    const quotes: PendingQuote[] = records.map(record => {
      const lastModified = (record.fields['Last Modified'] as string) || record.createdTime;
      const lastModifiedDate = new Date(lastModified);
      const hoursAgo = Math.floor((now.getTime() - lastModifiedDate.getTime()) / (1000 * 60 * 60));

      return {
        id: record.id,
        customerName: (record.fields['Customer Name'] as string) || 'Unknown Customer',
        phoneNumber: (record.fields['Customer Phone'] as string) || '',
        email: (record.fields['Email'] as string) || '',
        quoteLink: (record.fields['Quote Link'] as string) || '',
        lastModified,
        hoursAgo,
        createdTime: record.createdTime,
        airtableRecordId: record.id,
      };
    });

    return NextResponse.json({
      count: quotes.length,
      quotes,
    });
  } catch (error) {
    console.error('Airtable pending quotes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
