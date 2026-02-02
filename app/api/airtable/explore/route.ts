import { NextResponse } from 'next/server';
import { fetchAirtableRecords } from '@/lib/airtable/client';

// GET /api/airtable/explore?table=Quote%20Requests
// Returns sample records to understand field structure
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('table');

  if (!tableName) {
    return NextResponse.json(
      { error: 'table parameter is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetchAirtableRecords(tableName, {
      maxRecords: 3,
    });

    // Extract field names from the records
    const fieldNames = new Set<string>();
    response.records.forEach(record => {
      Object.keys(record.fields).forEach(key => fieldNames.add(key));
    });

    return NextResponse.json({
      table: tableName,
      fieldNames: Array.from(fieldNames).sort(),
      sampleRecords: response.records,
    });
  } catch (error) {
    console.error('Airtable explore error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
