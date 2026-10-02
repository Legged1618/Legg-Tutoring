/**
 * The video call link for free consultations: the tutor's own meeting room
 * (for example a Google Meet or Zoom link), set as CONSULTATION_MEETING_URL.
 * Consultations don't use Lessonspace; that room is for paid sessions only.
 * Returns null when it isn't set, so pages and emails can fall back to
 * "the link will be emailed before the call".
 */
export function consultationMeetingUrl(): string | null {
  const raw = process.env.CONSULTATION_MEETING_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
