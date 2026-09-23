import Link from "next/link";

export default function SiteHeader() {
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
