import { supabaseAdmin } from "./supabase";

interface ExpoPushMessage {
  to: string;
  sound?: "default" | null;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Sends a list of Expo push messages to Expo's Push API server
 */
export async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<boolean> {
  if (!messages || messages.length === 0) return true;

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.warn("Expo Push API HTTP error:", response.status);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("Failed to send Expo push notifications:", error.message);
    return false;
  }
}

/**
 * Dispatches push alerts to all active, online providers when a new job is created
 */
export async function notifyOnlineProvidersNewJob(booking: any): Promise<void> {
  try {
    // 1. Fetch active online providers
    const { data: onlineProviders } = await supabaseAdmin
      .from("providers")
      .select("id")
      .eq("is_online", true)
      .eq("status", "active");

    if (!onlineProviders || onlineProviders.length === 0) return;

    const providerIds = onlineProviders.map((p) => p.id);

    // 2. Fetch device tokens for online providers
    const { data: deviceTokens } = await supabaseAdmin
      .from("user_device_tokens")
      .select("token")
      .in("user_id", providerIds)
      .eq("is_active", true);

    if (!deviceTokens || deviceTokens.length === 0) return;

    const vehicleInfo = booking.vehicleSnapshot
      ? `${booking.vehicleSnapshot.make || ""} ${booking.vehicleSnapshot.model || ""}`.trim()
      : "Vehicle";

    const locationInfo = booking.locationSnapshot?.address || "Nearby Location";

    const messages: ExpoPushMessage[] = deviceTokens.map((t) => ({
      to: t.token,
      sound: "default",
      title: "🚗 New Service Request Nearby!",
      body: `${vehicleInfo} service requested at ${locationInfo}. Tap to accept job!`,
      data: {
        type: "NEW_JOB",
        bookingId: booking.id,
      },
    }));

    await sendExpoPushNotifications(messages);
  } catch (error: any) {
    console.error("Error in notifyOnlineProvidersNewJob:", error.message);
  }
}

/**
 * Dispatches push alert to assigned provider when a job is assigned
 */
export async function notifyProviderJobAssigned(providerId: string, booking: any): Promise<void> {
  try {
    const { data: deviceTokens } = await supabaseAdmin
      .from("user_device_tokens")
      .select("token")
      .eq("user_id", providerId)
      .eq("is_active", true);

    if (!deviceTokens || deviceTokens.length === 0) return;

    const vehicleInfo = booking.vehicleSnapshot
      ? `${booking.vehicleSnapshot.make || ""} ${booking.vehicleSnapshot.model || ""}`.trim()
      : "Vehicle";

    const messages: ExpoPushMessage[] = deviceTokens.map((t) => ({
      to: t.token,
      sound: "default",
      title: "🔧 New Job Assigned to You!",
      body: `You have been assigned the service job for ${vehicleInfo}. Tap to view details!`,
      data: {
        type: "ASSIGNED_JOB",
        bookingId: booking.id,
      },
    }));

    await sendExpoPushNotifications(messages);
  } catch (error: any) {
    console.error("Error in notifyProviderJobAssigned:", error.message);
  }
}
