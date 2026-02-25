import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllAirtableRecords, updateAirtableRecord } from '@/lib/airtable/client';
import { getLocalToday } from '@/lib/dateUtils';

// Create a Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SyncResult {
  created: number;
  skipped: number;
  errors: string[];
  syncedBack: number;
}

// POST /api/airtable/sync
// Syncs pending quote follow-ups to tasks and syncs completed tasks back to Airtable
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const result: SyncResult = {
      created: 0,
      skipped: 0,
      errors: [],
      syncedBack: 0,
    };

    // Get user's "Clients" list, or fall back to Inbox
    let { data: clientsList } = await supabase
      .from('lists')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Clients')
      .single();

    // If "Clients" list doesn't exist, use Inbox instead
    if (!clientsList) {
      const { data: inboxList } = await supabase
        .from('lists')
        .select('id')
        .eq('user_id', userId)
        .eq('is_inbox', true)
        .single();

      clientsList = inboxList;
    }

    // If no Inbox exists, create one (using service role to bypass RLS)
    if (!clientsList) {
      const { data: newInbox, error: createError } = await supabase
        .from('lists')
        .insert({
          user_id: userId,
          name: 'Inbox',
          is_inbox: true,
          position: 0,
          color: '#2A54A1',
          icon: 'inbox',
        })
        .select('id')
        .single();

      if (createError) {
        return NextResponse.json(
          { error: `Failed to create Inbox: ${createError.message}` },
          { status: 500 }
        );
      }

      clientsList = newInbox;
    }

    // 1. Fetch pending quotes from Airtable (same criteria as Command Center widget)
    const formula = `AND(
      OR({Quote Approved} = FALSE(), {Quote Approved} = BLANK()),
      DATETIME_DIFF(NOW(), LAST_MODIFIED_TIME(), 'hours') >= 1,
      DATETIME_DIFF(NOW(), LAST_MODIFIED_TIME(), 'days') <= 7
    )`.replace(/\s+/g, ' ');

    type AirtableFields = Record<string, unknown>;
    let quoteRecords: { id: string; createdTime: string; fields: AirtableFields }[] = [];
    try {
      quoteRecords = await fetchAllAirtableRecords<AirtableFields>('Quote Requests', {
        filterByFormula: formula,
      });
    } catch (error) {
      result.errors.push(`Failed to fetch quotes: ${error}`);
    }

    // 2. Check which records are already synced
    const { data: existingSyncs } = await supabase
      .from('airtable_sync')
      .select('airtable_record_id')
      .eq('airtable_table', 'Quote Requests');

    const syncedRecordIds = new Set(existingSyncs?.map(s => s.airtable_record_id) || []);

    // 3. Create tasks for new pending quotes
    for (const record of quoteRecords) {
      if (syncedRecordIds.has(record.id)) {
        result.skipped++;
        continue;
      }

      const customerName = (record.fields['Customer Name'] as string) || 'Unknown Customer';
      const phoneNumber = (record.fields['Customer Phone'] as string) || '';
      const quoteLink = (record.fields['Quote Link'] as string) || '';

      // Create task in Clients list
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          list_id: clientsList.id,
          user_id: userId,
          title: `FU with ${customerName}'s Quote`,
          notes: phoneNumber || null,
          link: quoteLink || null,
          due_date: getLocalToday(),
          is_completed: false,
          is_starred: false,
          position: 0,
        })
        .select()
        .single();

      if (taskError) {
        result.errors.push(`Failed to create task for ${customerName}: ${taskError.message}`);
        continue;
      }

      // Track the sync
      const { error: syncError } = await supabase
        .from('airtable_sync')
        .insert({
          task_id: task.id,
          airtable_table: 'Quote Requests',
          airtable_record_id: record.id,
          sync_type: 'quote_followup',
        });

      if (syncError) {
        result.errors.push(`Failed to track sync for ${customerName}: ${syncError.message}`);
      } else {
        result.created++;
      }
    }

    // 4. Sync completed tasks back to Airtable
    const { data: completedSyncs } = await supabase
      .from('airtable_sync')
      .select(`
        id,
        airtable_table,
        airtable_record_id,
        task_id,
        tasks!inner(is_completed, completed_at)
      `)
      .eq('sync_type', 'quote_followup');

    for (const sync of completedSyncs || []) {
      const task = (sync as unknown as { tasks: { is_completed: boolean; completed_at: string } }).tasks;
      if (task?.is_completed) {
        try {
          // Update Airtable record to mark as followed up
          await updateAirtableRecord('Quote Requests', sync.airtable_record_id, {
            'Follow Up Completed': true,
            'Follow Up Date': task.completed_at || new Date().toISOString(),
          });
          result.syncedBack++;
        } catch (error) {
          result.errors.push(`Failed to sync back ${sync.airtable_record_id}: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Created ${result.created} tasks, skipped ${result.skipped} existing, synced ${result.syncedBack} completions back`,
    });
  } catch (error) {
    console.error('Airtable sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/airtable/sync - Get sync status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const { data: syncs, error } = await supabase
      .from('airtable_sync')
      .select(`
        id,
        airtable_table,
        airtable_record_id,
        sync_type,
        last_synced_at,
        task_id,
        tasks(id, title, is_completed)
      `)
      .order('last_synced_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      totalSynced: syncs?.length || 0,
      syncs,
    });
  } catch (error) {
    console.error('Airtable sync status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
