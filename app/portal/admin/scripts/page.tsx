import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalHeader from "@/components/PortalHeader";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminScriptsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isTutor = Boolean(
    user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );

  if (!user) {
    redirect("/portal/login");
  }

  if (!isTutor) {
    return (
      <>
        <PortalHeader />
        <div className="portal-shell wrap">
          <p className="notice error">This page is only for the tutor account.</p>
        </div>
      </>
    );
  }

  const scriptUrl = process.env.CALL_SCRIPT_URL;

  return (
    <>
      <PortalHeader />
      <div className="portal-shell wrap">
        <AdminTabs />
        <div className="section-head">
          <h2>Scripts</h2>
          <p>Writing the real scripts is next phase &mdash; this is just a placeholder for now.</p>
        </div>
        <div className="portal-card" style={{ maxWidth: 520, margin: "0 auto" }}>
          {scriptUrl ? (
            <p className="notice">
              Working draft lives in the shared doc:{" "}
              <a href={scriptUrl} target="_blank" rel="noreferrer">
                {scriptUrl}
              </a>
            </p>
          ) : (
            <p className="notice">
              No script doc linked yet. Set <code>CALL_SCRIPT_URL</code> in your environment to
              show it here automatically.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
