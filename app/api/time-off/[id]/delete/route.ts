import { NextResponse } from "next/server";
import { safeNext } from "@/lib/safeNext";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isTutor = Boolean(
    user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );
  if (!isTutor) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  await admin.from("time_off").delete().eq("id", id);

  const next = new URL(request.url).searchParams.get("next");
  return NextResponse.redirect(new URL(safeNext(next, "/portal/admin/calendar"), request.url), {
    status: 303,
  });
}
