import { Expo } from 'expo-server-sdk';
import { supabaseAdmin } from './supabase';

const expo = new Expo();

type NotificationEvent = 'BOOKING_CONFIRMED' | 'TECHNICIAN_ASSIGNED' | 'TECHNICIAN_ARRIVED' | 'SERVICE_STARTED' | 'SERVICE_COMPLETED' | 'BOOKING_CANCELLED' | 'NEW_JOB_ASSIGNED';

interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendPushNotification({ userId, title, body, data }: SendNotificationParams) {
  try {
    // 1. Get user's device tokens
    const { data: tokens, error } = await supabaseAdmin
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !tokens || tokens.length === 0) {
      return; // No tokens found, just return silently
    }

    const messages = [];
    for (const { token } of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        console.warn(`Push token ${token} is not a valid Expo push token`);
        continue;
      }
      messages.push({
        to: token,
        sound: 'default' as const,
        title,
        body,
        data,
      });
    }

    if (messages.length === 0) return;

    // 2. Send messages via Expo
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }
  } catch (err) {
    console.error('Error in sendPushNotification utility:', err);
  }
}

// Pre-defined event templates
export async function notifyBookingEvent(userId: string, event: NotificationEvent, bookingId: string, additionalInfo?: any) {
  let title = '';
  let body = '';

  switch (event) {
    case 'BOOKING_CONFIRMED':
      title = 'Booking Confirmed';
      body = 'Your service booking has been confirmed and scheduled.';
      break;
    case 'TECHNICIAN_ASSIGNED':
      title = 'Technician Assigned';
      body = `Technician ${additionalInfo?.techName || ''} has been assigned to your booking.`;
      break;
    case 'NEW_JOB_ASSIGNED':
      title = 'New Job Assigned';
      body = 'You have been assigned a new service booking.';
      break;
    case 'TECHNICIAN_ARRIVED':
      title = 'Technician Arrived';
      body = 'Your technician has arrived at the service location.';
      break;
    case 'SERVICE_STARTED':
      title = 'Service Started';
      body = 'Your vehicle service is now in progress.';
      break;
    case 'SERVICE_COMPLETED':
      title = 'Service Completed';
      body = 'Your vehicle service has been completed successfully!';
      break;
    case 'BOOKING_CANCELLED':
      title = 'Booking Cancelled';
      body = 'Your booking has been cancelled.';
      break;
  }

  // Fire and forget - don't await this so it doesn't block API responses
  sendPushNotification({
    userId,
    title,
    body,
    data: { type: event, bookingId },
  }).catch(console.error);
}
