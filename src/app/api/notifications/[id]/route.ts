import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { deleteNotification } from '@/lib/notifications';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: authStatus || 401 });
    }

    const { id } = await params;
    const success = await deleteNotification(id, user.id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}