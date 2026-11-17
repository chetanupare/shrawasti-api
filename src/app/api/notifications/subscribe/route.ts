import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { updatePushSubscription, getVapidPublicKey } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: authStatus || 401 });
    }

    const body = await request.json();
    const { endpoint, p256dh, auth, deviceName, platform } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: 'endpoint, p256dh, and auth are required' },
        { status: 400 }
      );
    }

    const subscription = await updatePushSubscription(user.id, { endpoint, p256dh, auth }, { deviceName, platform });

    if (!subscription) {
      return NextResponse.json({ error: 'Failed to save push subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: authStatus || 401 });
    }

    const vapidPublicKey = getVapidPublicKey();

    return NextResponse.json({ success: true, vapidPublicKey });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}