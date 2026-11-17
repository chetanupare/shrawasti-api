import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/notifications';

export async function GET() {
  try {
    const vapidPublicKey = getVapidPublicKey();
    return NextResponse.json({ vapidPublicKey });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}