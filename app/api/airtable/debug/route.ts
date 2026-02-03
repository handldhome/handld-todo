import { NextResponse } from 'next/server';

// Debug endpoint to check Airtable configuration
export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  // Check if env vars exist (don't expose full values)
  const hasApiKey = !!apiKey;
  const apiKeyPrefix = apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET';
  const hasBaseId = !!baseId;
  const baseIdValue = baseId || 'NOT SET';

  // Try a simple Airtable request
  let airtableTest = { success: false, error: '', statusCode: 0 };

  if (hasApiKey && hasBaseId) {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Jobs?maxRecords=1`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      airtableTest.statusCode = response.status;

      if (response.ok) {
        airtableTest.success = true;
        const data = await response.json();
        airtableTest.error = `Found ${data.records?.length || 0} records`;
      } else {
        const errorText = await response.text();
        airtableTest.error = errorText;
      }
    } catch (error) {
      airtableTest.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  return NextResponse.json({
    envVars: {
      AIRTABLE_API_KEY: { exists: hasApiKey, preview: apiKeyPrefix },
      AIRTABLE_BASE_ID: { exists: hasBaseId, value: baseIdValue },
    },
    airtableTest,
    timestamp: new Date().toISOString(),
  });
}
