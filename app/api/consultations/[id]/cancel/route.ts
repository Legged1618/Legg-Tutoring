import { NextResponse } from "next/server";
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
    .select("id, status")
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

  const redirectUrl = new URL(`/consultation/cancel/${id}?cancelled=1`, request.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
