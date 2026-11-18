import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
} from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: authStatus || 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const { notifications, total } = await getNotifications(user.id, { limit, offset, unreadOnly });
    const unreadCount = await getUnreadCount(user.id);

    return NextResponse.json({
      success: true,
      notifications,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: authStatus || 401 });
    }

    const body = await request.json();
    const { title, message, type, actionUrl, metadata } = body;

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'title, message, and type are required' },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      userId: user.id,
      title,
      message,
      type,
      actionUrl,
      metadata,
    });

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}