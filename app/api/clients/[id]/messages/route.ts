import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MAX_MESSAGE_LENGTH } from "@/lib/messages";
import { sendNewMessageToClient } from "@/lib/email";

// The tutor replying to a client. The client also gets a short email
// saying there's a new message waiting in their portal.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isTutor = Boolean(user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL);
  if (!isTutor) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const formData = await request.formData();
  const body = String(formData.get("body") || "").trim().slice(0, MAX_MESSAGE_LENGTH);
  const back = new URL(`/portal/admin/clients/${id}#messages`, request.url);

  if (!body) {
    return NextResponse.redirect(back, { status: 303 });
  }

  const admin = createAdminClient();
  const { data: client } = await admin.from("clients").select("id, email, full_name").eq("id", id).maybeSingle();
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  await admin.from("messages").insert({ client_id: client.id, sender: "tutor", body });

  try {
    await sendNewMessageToClient(
      { clientName: client.full_name, clientEmail: client.email },
      new URL(request.url).origin
    );
  } catch (err) {
    // The message is saved either way; the email is just a heads-up.
    console.error("New-message email failed", err);
  }

  return NextResponse.redirect(back, { status: 303 });
}
