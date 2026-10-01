import Link from "next/link";
import { JOIN_OPENS_MINUTES_BEFORE, type JoinWindowState } from "@/lib/lessonspace";
import { TUTOR_TIMEZONE } from "@/lib/availability";

/**
 * The live session page body: the embedded Lessonspace room (video, voice
 * and shared whiteboard) once the join window is open, or a notice saying
 * when it opens. The tutor can open the room any time to set up the board.
 */
export default function SessionRoom({
  heading,
  scheduledAt,
  durationMinutes,
  closedMessage,
  windowState,
  clientUrl,
  isTutor,
  backHref,
  backLabel,
}: {
  heading: string;
  scheduledAt: Date;
  durationMinutes: number;
  /** Set when the booking can't be joined at all (cancelled, unpaid). */
  closedMessage: string | null;
  windowState: JoinWindowState;
  /** This viewer's join link, or null if the room couldn't be launched. */
  clientUrl: string | null;
  isTutor: boolean;
  backHref: string;
  backLabel: string;
}) {
  const when = scheduledAt.toLocaleString("en-US", {
    timeZone: TUTOR_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="portal-shell wrap session-room">
      <div className="section-head">
        <h2>{heading}</h2>
        <p>
          {when} &middot; {durationMinutes} min
        </p>
      </div>

      {closedMessage ? (
        <p className="notice">{closedMessage}</p>
      ) : !isTutor && windowState === "early" ? (
        <p className="notice">
          This room opens {JOIN_OPENS_MINUTES_BEFORE} minutes before the session begins. Come back
          to this page then to join the session.
        </p>
      ) : !isTutor && windowState === "ended" ? (
        <p className="notice">This session has ended.</p>
      ) : !clientUrl ? (
        <p className="notice">
          {isTutor
            ? "The Lessonspace room couldn't be opened. Check LESSONSPACE_API_KEY in Vercel, then reload."
            : "Your room isn't ready yet. Please reload in a minute."}
        </p>
      ) : (
        <>
          {isTutor && windowState !== "open" && (
            <p className="notice" style={{ marginTop: 0, marginBottom: 16 }}>
              {windowState === "early"
                ? `The client can join ${JOIN_OPENS_MINUTES_BEFORE} minutes before the start. You can set up the board now.`
                : "This session's join window has closed for the client."}
            </p>
          )}
          <div className="session-room-frame">
            <iframe
              src={clientUrl}
              title="Live session room"
              allow="camera; microphone; display-capture; autoplay; fullscreen; clipboard-read; clipboard-write"
              allowFullScreen
            />
          </div>
          <p className="notice">
            Allow camera and microphone access when your browser asks. Headphones help prevent echo.
          </p>
        </>
      )}

      <p style={{ textAlign: "center", marginTop: 20 }}>
        <Link href={backHref} className="cal-today-link">
          &larr; {backLabel}
        </Link>
      </p>
    </div>
  );
}
