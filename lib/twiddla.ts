/**
 * Twiddla rooms for live sessions -- one private room per booking, created
 * with the tutor's Twiddla account through Twiddla's CreateMeeting API and
 * embedded on our own join page, so clients never need a Twiddla login.
 *
 * Needs TWIDDLA_USERNAME and TWIDDLA_PASSWORD (a Pro account -- free
 * meetings stop at 20 minutes). Without them, or if Twiddla errors, room
 * creation quietly returns null and the join page shows a "not ready yet"
 * notice; the room is retried the next time anyone opens that page.
 */

import { randomBytes } from "crypto";

const CREATE_MEETING_URL = "https://www.twiddla.com/API/CreateMeeting.aspx";
const EMBED_BASE_URL = "https://www.twiddla.com/api/start.aspx";

// The join button goes live this long before the start, and stays live
// this long after the scheduled end in case a session runs over.
export const JOIN_OPENS_MINUTES_BEFORE = 10;
export const JOIN_CLOSES_MINUTES_AFTER = 30;

export type RoomTable = "sessions" | "consultations";

export type TwiddlaRoom = { meetingId: string; password: string };

export function isTwiddlaConfigured(): boolean {
  return Boolean(process.env.TWIDDLA_USERNAME && process.env.TWIDDLA_PASSWORD);
}

async function createTwiddlaMeeting(title: string): Promise<TwiddlaRoom | null> {
  if (!isTwiddlaConfigured()) return null;

  const password = randomBytes(9).toString("base64url");
  const body = new URLSearchParams({
    username: process.env.TWIDDLA_USERNAME!,
    password: process.env.TWIDDLA_PASSWORD!,
    meetingtitle: title,
    meetingpassword: password,
  });

  try {
    const res = await fetch(CREATE_MEETING_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const text = (await res.text()).trim();
    // Success is a bare numeric meeting id; failure is "-1" plus a message.
    if (!res.ok || !/^\d+$/.test(text)) {
      console.error("Twiddla CreateMeeting failed", res.status, text.slice(0, 200));
      return null;
    }
    return { meetingId: text, password };
  } catch (err) {
    console.error("Twiddla CreateMeeting request failed", err);
    return null;
  }
}

/**
 * Returns the booking's room, creating and saving one first if it doesn't
 * have one yet. Safe to call repeatedly (webhook retries, page reloads).
 */
export async function ensureRoom(
  admin: any,
  table: RoomTable,
  row: { id: string; twiddla_meeting_id?: string | null; twiddla_meeting_password?: string | null },
  title: string
): Promise<TwiddlaRoom | null> {
  if (row.twiddla_meeting_id && row.twiddla_meeting_password) {
    return { meetingId: row.twiddla_meeting_id, password: row.twiddla_meeting_password };
  }

  const room = await createTwiddlaMeeting(title);
  if (!room) return null;

  // Only fill an empty slot, so two simultaneous callers can't overwrite
  // each other's room; whoever loses re-reads the winner's.
  const { data: updated } = await admin
    .from(table)
    .update({ twiddla_meeting_id: room.meetingId, twiddla_meeting_password: room.password })
    .eq("id", row.id)
    .is("twiddla_meeting_id", null)
    .select("twiddla_meeting_id, twiddla_meeting_password")
    .maybeSingle();

  if (updated) return room;

  const { data: existing } = await admin
    .from(table)
    .select("twiddla_meeting_id, twiddla_meeting_password")
    .eq("id", row.id)
    .maybeSingle();
  return existing?.twiddla_meeting_id
    ? { meetingId: existing.twiddla_meeting_id, password: existing.twiddla_meeting_password }
    : null;
}

export function roomEmbedUrl(room: TwiddlaRoom, guestName: string): string {
  const params = new URLSearchParams({
    sessionid: room.meetingId,
    guestname: guestName,
    password: room.password,
    autostart: "true",
  });
  return `${EMBED_BASE_URL}?${params.toString()}`;
}

export type JoinWindowState = "early" | "open" | "ended";

export function joinWindowState(scheduledAt: Date, durationMinutes: number, now = new Date()): JoinWindowState {
  const opensAt = scheduledAt.getTime() - JOIN_OPENS_MINUTES_BEFORE * 60000;
  const closesAt = scheduledAt.getTime() + (durationMinutes + JOIN_CLOSES_MINUTES_AFTER) * 60000;
  if (now.getTime() < opensAt) return "early";
  if (now.getTime() > closesAt) return "ended";
  return "open";
}
