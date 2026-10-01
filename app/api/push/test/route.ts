import { NextResponse } from "next/server";
import { isTutorRequest } from "@/lib/tutorAuth";
import { isPushConfigured, notifyTutor } from "@/lib/push";

// "Send a test alert" button on the Notifications tab.
export async function POST() {
  if (!(await isTutorRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Desktop alerts aren't set up on the server yet." }, { status: 503 });
  }
  await notifyTutor({
    title: "Desktop alerts are on",
    body: "New bookings, cancellations and messages will show up here.",
    url: "/portal/admin/notifications",
    tag: "test",
  });
  return NextResponse.json({ ok: true });
}
