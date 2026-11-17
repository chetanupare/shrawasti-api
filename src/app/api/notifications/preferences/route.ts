import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: authStatus || 401 });
    }

    const preferences = await getNotificationPreferences(user.id);

    return NextResponse.json({ success: true, preferences });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: authStatus || 401 });
    }

    const body = await request.json();
    const preferences = await updateNotificationPreferences(user.id, body);

    if (!preferences) {
      return NextResponse.json({ error: 'Failed to update notification preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true, preferences });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}