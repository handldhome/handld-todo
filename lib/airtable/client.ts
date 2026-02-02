// Airtable API client

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

if (!AIRTABLE_API_KEY) {
  console.warn('AIRTABLE_API_KEY is not set');
}

interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  createdTime: string;
  fields: T;
}

interface AirtableResponse<T = Record<string, unknown>> {
  records: AirtableRecord<T>[];
  offset?: string;
}

export async function fetchAirtableRecords<T = Record<string, unknown>>(
  tableName: string,
  options?: {
    filterByFormula?: string;
    maxRecords?: number;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
    fields?: string[];
    offset?: string;
  }
): Promise<AirtableResponse<T>> {
  const params = new URLSearchParams();

  if (options?.filterByFormula) {
    params.append('filterByFormula', options.filterByFormula);
  }
  if (options?.maxRecords) {
    params.append('maxRecords', options.maxRecords.toString());
  }
  if (options?.sort) {
    options.sort.forEach((s, i) => {
      params.append(`sort[${i}][field]`, s.field);
      params.append(`sort[${i}][direction]`, s.direction);
    });
  }
  if (options?.fields) {
    options.fields.forEach(f => params.append('fields[]', f));
  }
  if (options?.offset) {
    params.append('offset', options.offset);
  }

  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?${params}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function getAirtableRecord<T = Record<string, unknown>>(
  tableName: string,
  recordId: string
): Promise<AirtableRecord<T>> {
  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function updateAirtableRecord<T = Record<string, unknown>>(
  tableName: string,
  recordId: string,
  fields: Partial<T>
): Promise<AirtableRecord<T>> {
  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function createAirtableRecord<T = Record<string, unknown>>(
  tableName: string,
  fields: Partial<T>
): Promise<AirtableRecord<T>> {
  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Helper to fetch all records (handles pagination)
export async function fetchAllAirtableRecords<T = Record<string, unknown>>(
  tableName: string,
  options?: {
    filterByFormula?: string;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
    fields?: string[];
  }
): Promise<AirtableRecord<T>[]> {
  const allRecords: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const response = await fetchAirtableRecords<T>(tableName, {
      ...options,
      offset,
    });
    allRecords.push(...response.records);
    offset = response.offset;
  } while (offset);

  return allRecords;
}
