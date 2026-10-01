import { notFound, redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ensureRoom } from "@/lib/twiddla";
import SessionRoom from "@/components/SessionRoom";

export default async function SessionRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const isTutor = Boolean(process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL);

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("sessions")
    .select("*, clients(full_name, email, auth_user_id)")
    .eq("id", id)
    .maybeSingle();

  const client = session?.clients as {
    full_name: string | null;
    email: string;
    auth_user_id: string | null;
  } | null;

  // Only the client who booked it (or the tutor) can see a session's room.
  if (!session || (!isTutor && client?.auth_user_id !== user.id)) {
    notFound();
  }

  const clientLabel = client?.full_name || client?.email || "Client";
  const closedMessage =
    session.status === "pending_payment"
      ? "This session isn't paid yet, so its room isn't open."
      : session.status === "scheduled" || session.status === "completed"
        ? null
        : "This session was cancelled, so its room is closed.";
  const room = closedMessage
    ? null
    : await ensureRoom(admin, "sessions", session, `Legg Tutoring: ${clientLabel}`);

  return (
    <SessionRoom
      heading={isTutor ? `Session with ${clientLabel}` : "Your tutoring session"}
      scheduledAt={new Date(session.scheduled_at)}
      durationMinutes={session.duration_minutes}
      closedMessage={closedMessage}
      room={room}
      guestName={isTutor ? "Tutor" : clientLabel}
      isTutor={isTutor}
      backHref={isTutor ? "/portal/admin/calendar" : "/portal"}
      backLabel={isTutor ? "Back to calendar" : "Back to your sessions"}
    />
  );
}
