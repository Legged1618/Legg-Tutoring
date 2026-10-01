import type { MessageSender, ThreadMessage } from "@/lib/messages";
import { formatDay, formatTime } from "@/lib/format";
import ThreadScroller from "@/components/ThreadScroller";
import MessageComposer from "@/components/MessageComposer";

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
  let lastDay = "";

  return (
    <div className="message-thread">
      <ThreadScroller count={messages.length}>
        {messages.length === 0 && <p className="empty-state">{emptyText}</p>}
        {messages.map((m) => {
          const mine = m.sender === viewer;
          const at = new Date(m.createdAt);
          const day = formatDay(at);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id} className="message-item">
              {showDay && <div className="message-day">{day}</div>}
              <div className={`message-bubble${mine ? " mine" : ""}`}>
                {m.sessionLabel && <div className="message-tag">About the {m.sessionLabel}</div>}
                <div className="message-body">{m.body}</div>
                <div className="message-meta">
                  {mine ? "You" : otherName} &middot; {formatTime(at)}
                  {mine && viewer === "tutor" && m.readAt ? " · Seen" : ""}
                </div>
              </div>
            </div>
          );
        })}
      </ThreadScroller>

      <MessageComposer action={action} sessionOptions={sessionOptions} defaultSessionId={defaultSessionId} />
    </div>
  );
}
