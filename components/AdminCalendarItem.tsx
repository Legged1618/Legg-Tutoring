"use client";

import { useState } from "react";

export default function AdminCalendarItem({
  type,
  time,
  title,
  checklist,
}: {
  type: "consultation" | "session";
  time: string;
  title: string;
  checklist: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`calendar-item type-${type}`}>
      <button
        type="button"
        className="calendar-item-summary"
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <strong>{time}</strong> &middot; {title}
        </span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="calendar-item-detail">{checklist}</div>}
    </div>
  );
}
