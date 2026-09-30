import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import SiteHeader from "@/components/SiteHeader";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const isTutor = Boolean(
    process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );

  if (isTutor) {
    return (
      <>
        <SiteHeader />
        <div className="portal-shell wrap">
          <div className="section-head">
            <h2>Profile</h2>
          </div>
          <div className="portal-card" style={{ maxWidth: 480, margin: "0 auto" }}>
            <p className="notice">
              Signed in as <strong>{user.email}</strong> (Admin) &mdash; this account doesn&apos;t
              have a client profile.
            </p>
          </div>
        </div>
      </>
    );
  }

  const admin = createAdminClient();
  const client = await getOrCreateClientForUser(admin, user);

  return (
    <>
      <SiteHeader />
      <div className="portal-shell wrap">
        <div className="section-head">
          <h2>Profile</h2>
          <p>Your contact info &mdash; used for session reminders and the occasional message.</p>
        </div>
        <form
          action="/api/profile"
          method="post"
          className="portal-card"
          style={{ maxWidth: 480, margin: "0 auto" }}
        >
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" value={client.email} disabled />
          </div>
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" defaultValue={client.full_name ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              defaultValue={client.phone ?? ""}
              placeholder="(optional)"
            />
          </div>
          <button className="btn" type="submit">
            Save
          </button>
        </form>
      </div>
    </>
  );
}
