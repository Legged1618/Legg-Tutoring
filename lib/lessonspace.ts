/**
 * Lessonspace rooms for live sessions: two-way video and voice plus a
 * shared whiteboard (with math tools) that both sides can write on,
 * embedded on our own join page so clients never need a Lessonspace login.
 *
 * Each booking maps to one Space whose id is derived from the booking id,
 * so nothing needs storing: the Launch endpoint creates the Space on first
 * call and returns the existing one after that, along with a join link
 * for whoever is opening it.
 *
 * Needs LESSONSPACE_API_KEY. Without it, or if Lessonspace errors, launch
 * returns null and the join page shows a "not ready yet" notice.
 */

const LAUNCH_URL = "https://api.thelessonspace.com/v2/spaces/launch/";

// The room opens to the client this long before the start, and stays open
// this long after the scheduled end in case a session runs over.
export const JOIN_OPENS_MINUTES_BEFORE = 10;
export const JOIN_CLOSES_MINUTES_AFTER = 30;

export function isLessonspaceConfigured(): boolean {
  return Boolean(process.env.LESSONSPACE_API_KEY);
}

/** Returns this user's join link for the Space, or null if it can't be launched. */
export async function launchSpace(opts: {
  spaceId: string;
  spaceName: string;
  user: { id: string; name: string; email?: string; leader: boolean };
}): Promise<string | null> {
  if (!isLessonspaceConfigured()) return null;

  try {
    const res = await fetch(LAUNCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Organisation ${process.env.LESSONSPACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: opts.spaceId, name: opts.spaceName, user: opts.user }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("Lessonspace launch failed", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { client_url?: string };
    return data.client_url ?? null;
  } catch (err) {
    console.error("Lessonspace launch request failed", err);
    return null;
  }
}

export type JoinWindowState = "early" | "open" | "ended";

export function joinWindowState(scheduledAt: Date, durationMinutes: number, now = new Date()): JoinWindowState {
  const opensAt = scheduledAt.getTime() - JOIN_OPENS_MINUTES_BEFORE * 60000;
  const closesAt = scheduledAt.getTime() + (durationMinutes + JOIN_CLOSES_MINUTES_AFTER) * 60000;
  if (now.getTime() < opensAt) return "early";
  if (now.getTime() > closesAt) return "ended";
  return "open";
}
