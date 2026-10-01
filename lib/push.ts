import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Desktop push alerts for the tutor: new bookings, cancellations and
 * client messages show up as system notifications on any browser where
 * the tutor turned alerts on (Notifications tab), even with the site closed.
 *
 * Needs NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY. Without them,
 * notifyTutor() quietly does nothing.
 */

export type TutorAlert = {
  title: string;
  body: string;
  /** Where clicking the notification takes you, e.g. "/portal/admin/messages". */
  url: string;
  /** Alerts with the same tag replace each other instead of stacking. */
  tag?: string;
};

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || `mailto:${process.env.TUTOR_EMAIL || "admin@leggtutoring.com"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

/** Sends to every registered device. Never throws: an alert is never worth failing a booking over. */
export async function notifyTutor(alert: TutorAlert): Promise<void> {
  if (!isPushConfigured()) return;
  try {
    configure();
    const admin = createAdminClient();
    const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth");
    await Promise.all(
      ((subs ?? []) as { id: string; endpoint: string; p256dh: string; auth: string }[]).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(alert),
            { TTL: 60 * 60 * 24 }
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          // 404/410: the browser dropped this subscription, so forget it.
          if (status === 404 || status === 410) {
            await admin.from("push_subscriptions").delete().eq("id", s.id);
          } else {
            console.error("Push send failed", status, err);
          }
        }
      })
    );
  } catch (err) {
    console.error("notifyTutor failed", err);
  }
}
