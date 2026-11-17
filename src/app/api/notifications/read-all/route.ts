import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { markAllAsRead } from '@/lib/notifications';

export async function PATCH(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: authStatus || 401 });
    }

    const success = await markAllAsRead(user.id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}