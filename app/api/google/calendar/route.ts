import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get('google_access_token')?.value;
  const refreshToken = cookieStore.get('google_refresh_token')?.value;

  // If no access token but have refresh token, try to refresh
  if (!accessToken && refreshToken) {
    accessToken = await refreshAccessToken(refreshToken) || undefined;
    if (accessToken) {
      // Update the cookie with new access token
      cookieStore.set('google_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600,
      });
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated', needsAuth: true }, { status: 401 });
  }

  try {
    // Get today's date in Los Angeles timezone
    const laFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' });
    const todayLA = laFormatter.format(new Date()); // YYYY-MM-DD

    const params = new URLSearchParams({
      timeMin: `${todayLA}T00:00:00`,
      timeMax: `${todayLA}T23:59:59`,
      timeZone: 'America/Los_Angeles',
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 401) {
      // Token expired, try refresh
      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          cookieStore.set('google_access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600,
          });

          // Retry with new token
          const retryResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
            {
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
              },
            }
          );

          if (retryResponse.ok) {
            const data = await retryResponse.json();
            return NextResponse.json({ events: data.items || [] });
          }
        }
      }

      // Clear expired access token but keep refresh token for next attempt
      cookieStore.delete('google_access_token');
      // Only clear refresh token if the refresh itself failed (token was revoked)
      if (refreshToken) {
        // Refresh token existed but failed — it may be revoked
        cookieStore.delete('google_refresh_token');
      }
      return NextResponse.json({ error: 'Token expired', needsAuth: true }, { status: 401 });
    }

    if (!response.ok) {
      const error = await response.text();
      console.error('Calendar API error:', error);
      return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
    }

    const data = await response.json();

    // Format events for the frontend
    const events = (data.items || []).map((event: {
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      location?: string;
      description?: string;
      hangoutLink?: string;
      conferenceData?: { entryPoints?: Array<{ uri?: string; entryPointType?: string }> };
      attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
    }) => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      description: event.description,
      meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.find(
        (e: { entryPointType?: string }) => e.entryPointType === 'video'
      )?.uri,
      attendees: event.attendees?.map((a: { email?: string; displayName?: string; responseStatus?: string }) => ({
        email: a.email,
        name: a.displayName,
        status: a.responseStatus,
      })),
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}
