import Link from "next/link";
import {
  JOIN_OPENS_MINUTES_BEFORE,
  joinWindowState,
  roomEmbedUrl,
  type TwiddlaRoom,
} from "@/lib/twiddla";
import { TUTOR_TIMEZONE } from "@/lib/availability";

/**
 * The live session page body: the embedded Twiddla room (whiteboard, chat
 * and voice) once the join window is open, or a notice saying when it
 * opens. The tutor can open the room any time to set up the board.
 */
export default function SessionRoom({
  heading,
  scheduledAt,
  durationMinutes,
  closedMessage,
  room,
  guestName,
  isTutor,
  backHref,
  backLabel,
}: {
  heading: string;
  scheduledAt: Date;
  durationMinutes: number;
  /** Set when the booking can't be joined at all (cancelled, unpaid). */
  closedMessage: string | null;
  room: TwiddlaRoom | null;
  guestName: string;
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
  const windowState = joinWindowState(scheduledAt, durationMinutes);
  const showRoom = !closedMessage && room && (isTutor || windowState === "open");

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
          Your room opens {JOIN_OPENS_MINUTES_BEFORE} minutes before the start time. Come back to
          this page then &mdash; no download or account needed.
        </p>
      ) : !isTutor && windowState === "ended" ? (
        <p className="notice">This session has ended.</p>
      ) : !room ? (
        <p className="notice">
          {isTutor
            ? "The Twiddla room couldn't be created. Check TWIDDLA_USERNAME and TWIDDLA_PASSWORD in Vercel, then reload."
            : "Your room isn't ready yet. Please reload in a minute."}
        </p>
      ) : null}

      {showRoom && (
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
              src={roomEmbedUrl(room!, guestName)}
              title="Session whiteboard"
              allow="microphone; camera; display-capture; autoplay; clipboard-read; clipboard-write; fullscreen"
            />
          </div>
          <p className="notice">
            Allow microphone access when your browser asks. Headphones help prevent echo.
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
