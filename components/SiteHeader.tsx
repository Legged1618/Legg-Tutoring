import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountMenu from "@/components/AccountMenu";
import LogoMark from "@/components/LogoMark";

/**
 * The one header for the whole site -- marketing homepage and portal
 * alike. It determines its own auth state (rather than taking props) so
 * every page just renders <SiteHeader /> and gets the right thing:
 * logged out, "Book a consultation / Client login"; logged in, the
 * account menu, on every page including the homepage.
 */
export default async function SiteHeader() {
  const supabase = await createClient();
  // getSession() here, not getUser(): the proxy middleware already runs
  // supabase.auth.getUser() (a real network round-trip to revalidate the
  // token) on every request before this ever renders, so the cookies are
  // already server-verified by the time we get here. This is purely
  // display logic (which menu to show) -- every actual access-control
  // decision still uses its own getUser() call, unchanged. Avoiding a
  // second redundant auth round-trip on every single page load was a
  // real, measurable chunk of the portal feeling slow.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return (
      <header>
        <nav className="nav nav-split">
          <Link href="/" className="wordmark">
            <LogoMark size={30} />
            Legg Tutoring
          </Link>
          <div className="nav-links">
            <Link href="/about" className="nav-hide-sm">
              About
            </Link>
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
      <nav className="nav nav-split">
        <Link href="/" className="wordmark">
          <LogoMark size={30} />
          Legg Tutoring
        </Link>
        <div className="nav-links">
          <Link href="/about" className="nav-hide-sm">
            About
          </Link>
          <AccountMenu email={user.email ?? ""} displayName={displayName} isTutor={isTutor} />
        </div>
      </nav>
    </header>
  );
}
