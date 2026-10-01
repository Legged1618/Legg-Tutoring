import type { MessageSender, ThreadMessage } from "@/lib/messages";
import { MAX_MESSAGE_LENGTH } from "@/lib/messages";
import { formatShort } from "@/lib/format";

/**
 * One client's conversation with the tutor, plus the box to write back.
 * Used on the client's Messages page and on the tutor's client page;
 * `viewer` decides which side's bubbles sit on the right.
 */
export default function MessageThread({
  messages,
  viewer,
  action,
  otherName,
  sessionOptions,
  defaultSessionId,
  emptyText,
}: {
  messages: ThreadMessage[];
  viewer: MessageSender;
  action: string;
  otherName: string;
  /** Client side only: their bookings, so a message can be about one of them. */
  sessionOptions?: { id: string; label: string }[];
  defaultSessionId?: string;
  emptyText: string;
}) {
  return (
    <div className="message-thread">
      <div className="message-list">
        {messages.length === 0 && <p className="notice">{emptyText}</p>}
        {messages.map((m) => {
          const mine = m.sender === viewer;
          return (
            <div key={m.id} className={`message-bubble${mine ? " mine" : ""}`}>
              {m.sessionLabel && <div className="message-tag">About the {m.sessionLabel}</div>}
              <div className="message-body">{m.body}</div>
              <div className="message-meta">
                {mine ? "You" : otherName} &middot; {formatShort(new Date(m.createdAt))}
                {mine && viewer === "tutor" && m.readAt ? " · Seen" : ""}
              </div>
            </div>
          );
        })}
      </div>

      <form action={action} method="post" className="message-form">
        {sessionOptions && sessionOptions.length > 0 && (
          <div className="field">
            <label htmlFor="sessionId">About</label>
            <select id="sessionId" name="sessionId" defaultValue={defaultSessionId ?? ""}>
              <option value="">A general question</option>
              {sessionOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="body">Message</label>
          <textarea id="body" name="body" rows={4} required maxLength={MAX_MESSAGE_LENGTH} />
        </div>
        <button className="btn" type="submit" style={{ width: "auto" }}>
          Send
        </button>
      </form>
    </div>
  );
}
