import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountMenu from "@/components/AccountMenu";

/**
 * The one header for the whole site -- marketing homepage and portal
 * alike. It determines its own auth state (rather than taking props) so
 * every page just renders <SiteHeader /> and gets the right thing:
 * logged out, "Book a consultation / Client login"; logged in, the
 * account menu, on every page including the homepage.
 */
export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <header>
        <nav className="nav" style={{ justifyContent: "space-between" }}>
          <Link href="/" className="wordmark">
            Legg Tutoring
          </Link>
          <div className="nav-links">
            <Link href="/consultation">Book a consultation</Link>
            <Link href="/portal/login">Client login</Link>
          </div>
        </nav>
      </header>
    );
  }

  const isTutor = Boolean(
    process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );

  let displayName = "";
  if (!isTutor) {
    // RLS-scoped: "clients read own row" lets a signed-in user read only
    // their own row directly, no service-role client needed just to show
    // a name in the header.
    const { data: client } = await supabase
      .from("clients")
      .select("full_name")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    displayName = client?.full_name ?? "";
  }

  return (
    <header>
      <nav className="nav" style={{ justifyContent: "space-between" }}>
        <Link href="/" className="wordmark">
          Legg Tutoring
        </Link>
        <AccountMenu email={user.email ?? ""} displayName={displayName} isTutor={isTutor} />
      </nav>
    </header>
  );
}
