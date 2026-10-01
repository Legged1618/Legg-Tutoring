import { NextResponse, after } from "next/server";
import { notifyTutor } from "@/lib/push";
import { formatShort } from "@/lib/format";
import { safeNext } from "@/lib/safeNext";
import { isTutorRequest } from "@/lib/tutorAuth";
import { createAdminClient } from "@/lib/supabase/server";

// Public on purpose -- consultations don't require login, so the cancel
// link in the confirmation email (keyed by the consultation's own
// unguessable id) is the only "auth" needed. No policy/fee applies here;
// that only kicks in once someone is a paying client (see api/sessions).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: consultation } = await admin
    .from("consultations")
    .select("id, status, full_name, scheduled_at")
    .eq("id", id)
    .maybeSingle();

  if (!consultation) {
    return NextResponse.json({ error: "Consultation not found." }, { status: 404 });
  }

  if (consultation.status !== "scheduled") {
    return NextResponse.json(
      { error: "This consultation can't be cancelled." },
      { status: 400 }
    );
  }

  await admin.from("consultations").update({ status: "cancelled" }).eq("id", id);

  // Only alert when the client cancelled from their email link, not when
  // the tutor cancelled from the admin calendar.
  if (!(await isTutorRequest())) {
    after(() =>
      notifyTutor({
        title: "Consultation cancelled",
        body: `${consultation.full_name}, was ${formatShort(new Date(consultation.scheduled_at))}`,
        url: "/portal/admin/calendar",
      })
    );
  }

  const next = new URL(request.url).searchParams.get("next");
  const redirectUrl = new URL(safeNext(next, `/consultation/cancel/${id}?cancelled=1`), request.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
