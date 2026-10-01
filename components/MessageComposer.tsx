"use client";

import { useState } from "react";
import { MAX_MESSAGE_LENGTH } from "@/lib/messages";

/** The reply box: Ctrl/Cmd+Enter sends, and the button locks while sending. */
export default function MessageComposer({
  action,
  sessionOptions,
  defaultSessionId,
}: {
  action: string;
  sessionOptions?: { id: string; label: string }[];
  defaultSessionId?: string;
}) {
  const [sending, setSending] = useState(false);

  return (
    <form action={action} method="post" className="message-form" onSubmit={() => setSending(true)}>
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
        <textarea
          id="body"
          name="body"
          rows={3}
          required
          maxLength={MAX_MESSAGE_LENGTH}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
      </div>
      <div className="message-form-actions">
        <span className="message-hint">Ctrl + Enter to send</span>
        <button className="btn btn-auto" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}
