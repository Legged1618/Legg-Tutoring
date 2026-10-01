import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CONSULTATION_DURATION_MINUTES } from "@/lib/availability";
import { joinWindowState, launchSpace } from "@/lib/lessonspace";
import SiteHeader from "@/components/SiteHeader";
import SessionRoom from "@/components/SessionRoom";

// Like the one-click cancel link, the consultation's own (unguessable) id
// is the key to its room, so someone who booked without an account can
// join straight from their confirmation email.
export default async function ConsultationRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isTutor = Boolean(user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL);

  const admin = createAdminClient();
  const { data: consultation } = await admin
    .from("consultations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!consultation) {
    notFound();
  }

  const scheduledAt = new Date(consultation.scheduled_at);
  const windowState = joinWindowState(scheduledAt, CONSULTATION_DURATION_MINUTES);
  const closedMessage =
    consultation.status === "cancelled"
      ? "This consultation was cancelled, so its room is closed."
      : null;

  const clientUrl =
    !closedMessage && (isTutor || windowState === "open")
      ? await launchSpace({
          spaceId: `consultation-${consultation.id}`,
          spaceName: `Legg Tutoring consultation: ${consultation.full_name}`,
          user: isTutor
            ? { id: "tutor", name: "Tutor", email: user!.email, leader: true }
            : {
                id: `consultation-${consultation.id}`,
                name: consultation.full_name,
                email: consultation.email,
                leader: false,
              },
        })
      : null;

  return (
    <>
      <SiteHeader />
      <SessionRoom
        heading={isTutor ? `Consultation with ${consultation.full_name}` : "Your free consultation"}
        scheduledAt={scheduledAt}
        durationMinutes={CONSULTATION_DURATION_MINUTES}
        closedMessage={closedMessage}
        windowState={windowState}
        clientUrl={clientUrl}
        isTutor={isTutor}
        backHref={isTutor ? "/portal/admin/calendar" : "/"}
        backLabel={isTutor ? "Back to calendar" : "Back to home"}
      />
    </>
  );
}
