import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { getUnreadCount } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: authStatus || 401 });
    }

    const unreadCount = await getUnreadCount(user.id);

    return NextResponse.json({ success: true, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}