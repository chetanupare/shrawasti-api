import { Expo } from 'expo-server-sdk';
import * as webPush from 'web-push';
import { supabaseAdmin } from './supabase';

const expo = new Expo();
const pwaOrigin = (process.env.PWA_ORIGIN || 'https://shrawasti-pwa.vercel.app').replace(/\/$/, '');

function clickAction(actionUrl?: string) {
  if (!actionUrl) return `${pwaOrigin}/bookings/latest`;
  if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) return actionUrl;
  return `${pwaOrigin}${actionUrl.startsWith('/') ? actionUrl : `/${actionUrl}`}`;
}

function pushFields(params: SendNotificationParams, ntfId?: string) {
  const kind = params.data?.type || (params.type === 'order' ? 'booking_update' : params.type || 'general');
  return {
    ...(params.data || {}),
    title: params.title,
    body: params.body,
    click_action: clickAction(params.actionUrl),
    ntf_id: ntfId || params.data?.ntf_id || '',
    type: kind,
  };
}

// Initialize Web Push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:notifications@shrawasti.com';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

type NotificationType = 'general' | 'system' | 'order' | 'payment' | 'security' | 'announcement';
type NotificationEvent = 'BOOKING_CONFIRMED' | 'TECHNICIAN_ASSIGNED' | 'TECHNICIAN_ARRIVED' | 'SERVICE_STARTED' | 'SERVICE_COMPLETED' | 'BOOKING_CANCELLED' | 'NEW_JOB_ASSIGNED' | 'PAYMENT_RECEIVED' | 'PROMOTIONAL' | 'SYSTEM_ALERT';

interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type?: NotificationType;
  actionUrl?: string;
}

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an in-app notification in the database
 */
export async function createNotification({
  userId,
  title,
  message,
  type = 'general',
  actionUrl,
  metadata = {},
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createNotification:', err);
    return null;
  }
}

/**
 * Send Expo push notification (for mobile app)
 */
export async function sendExpoPushNotification({
  userId,
  title,
  body,
  data,
  actionUrl,
}: SendNotificationParams) {
  try {
    const { data: tokens, error } = await supabaseAdmin
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !tokens || tokens.length === 0) {
      return;
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
        data: pushFields({ userId, title, body, data, actionUrl }),
      });
    }

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending Expo push notification chunk:', error);
      }
    }
  } catch (err) {
    console.error('Error in sendExpoPushNotification:', err);
  }
}

/**
 * Send Web Push notification (for PWA/desktop)
 */
export async function sendWebPushNotification({
  userId,
  title,
  body,
  data,
  actionUrl,
}: SendNotificationParams) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured, skipping Web Push');
    return { attempted: 0, sent: 0, failed: 0 };
  }

  try {
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return { attempted: 0, sent: 0, failed: 0 };
    }

    const fields = pushFields({ userId, title, body, data, actionUrl });
    const payload = JSON.stringify({
      title,
      body,
      url: actionUrl || '/bookings/latest',
      click_action: fields.click_action,
      ntf_id: fields.ntf_id,
      type: fields.type,
      data: fields,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });

    let sent = 0;
    let failed = 0;
    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webPush.sendNotification(pushSubscription, payload);
        sent += 1;
      } catch (err: any) {
        failed += 1;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await removeExpiredSubscription(sub.endpoint);
        } else {
          console.error('Web Push send error:', err?.statusCode || err?.message || err);
        }
      }
    }

    return { attempted: subscriptions.length, sent, failed };
  } catch (err) {
    console.error('Error in sendWebPushNotification:', err);
    return { attempted: 0, sent: 0, failed: 0 };
  }
}

/**
 * Send both in-app notification and push notifications
 */
export async function sendToUser(params: SendNotificationParams & { type?: NotificationType }) {
  const {
    userId,
    title,
    body,
    data,
    type = 'general',
    actionUrl,
  } = params;

  const notification = await createNotification({ userId, title, message: body, type, actionUrl, metadata: data });
  const ntfId = notification?.id ? String(notification.id) : '';
  const fields = pushFields({ userId, title, body, data, type, actionUrl }, ntfId);
  const [, webPushResult] = await Promise.all([
    sendExpoPushNotification({ userId, title, body, data: fields, type, actionUrl }),
    sendWebPushNotification({ userId, title, body, data: fields, type, actionUrl }),
  ]);
  return webPushResult;
}

/**
 * Send notification to multiple users
 */
export async function sendToMultipleUsers(
  userIds: string[],
  params: Omit<SendNotificationParams, 'userId'>
) {
  const results = await Promise.all(
    userIds.map((userId) => sendToUser({ ...params, userId }))
  );
  return results.reduce(
    (total, item) => ({
      attempted: total.attempted + (item?.attempted || 0),
      sent: total.sent + (item?.sent || 0),
      failed: total.failed + (item?.failed || 0),
    }),
    { attempted: 0, sent: 0, failed: 0 }
  );
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking notification as read:', error);
  }
  return !error;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
  }
  return !error;
}

/**
 * Get notifications for a user with pagination
 */
export async function getNotifications(
  userId: string,
  options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
) {
  const { limit = 20, offset = 0, unreadOnly = false } = options;

  let query = supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], total: 0 };
  }

  return { notifications: data || [], total: count || 0 };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting notification:', error);
  }
  return !error;
}

/**
 * Update push subscription (for PWA)
 */
export async function updatePushSubscription(
  userId: string,
  subscription: { endpoint: string; p256dh: string; auth: string },
  deviceInfo?: { deviceName?: string; platform?: string }
) {
  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        device_name: deviceInfo?.deviceName,
        platform: deviceInfo?.platform || 'web',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, endpoint' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error updating push subscription:', error);
    return null;
  }

  return data;
}

/**
 * Remove expired push subscription
 */
export async function removeExpiredSubscription(endpoint: string) {
  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Error removing expired subscription:', error);
  }
  return !error;
}

/**
 * Get user's push subscriptions
 */
export async function getPushSubscriptions(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching push subscriptions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }

  // Return defaults if not found
  if (!data) {
    return {
      push_enabled: true,
      general_enabled: true,
      security_enabled: true,
      marketing_enabled: false,
      order_enabled: true,
      payment_enabled: true,
    };
  }

  return data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<{
    push_enabled: boolean;
    general_enabled: boolean;
    security_enabled: boolean;
    marketing_enabled: boolean;
    order_enabled: boolean;
    payment_enabled: boolean;
  }>
) {
  const { data, error } = await supabaseAdmin
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error updating notification preferences:', error);
    return null;
  }

  return data;
}

/**
 * Pre-defined event templates
 */
export async function notifyBookingEvent(
  userId: string,
  event: NotificationEvent,
  bookingId: string,
  additionalInfo?: any
) {
  let title = '';
  let body = '';
  let type: NotificationType = 'order';
  let actionUrl = `/bookings/${bookingId}`;

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
      type = 'order';
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
      type = 'order';
      break;
    case 'PAYMENT_RECEIVED':
      title = 'Payment Received';
      body = `Payment of ₹${additionalInfo?.amount || ''} received for your booking.`;
      type = 'payment';
      break;
    case 'PROMOTIONAL':
      title = additionalInfo?.title || 'Special Offer';
      body = additionalInfo?.body || 'Check out our latest offers!';
      type = 'announcement';
      actionUrl = additionalInfo?.actionUrl || '/offers';
      break;
    case 'SYSTEM_ALERT':
      title = additionalInfo?.title || 'System Alert';
      body = additionalInfo?.body || 'An important system update is available.';
      type = 'system';
      break;
  }

  await sendToUser({
    userId,
    title,
    body,
    data: { type: event, bookingId, ...additionalInfo },
    type,
    actionUrl,
  });
}

/**
 * Get VAPID public key for frontend subscription
 */
export function getVapidPublicKey(): string | null {
  return vapidPublicKey || null;
}