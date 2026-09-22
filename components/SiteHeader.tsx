import Link from "next/link";

export default function SiteHeader() {
  return (
    <header>
      <nav className="nav" style={{ justifyContent: "space-between" }}>
        <Link href="/" className="wordmark">
          Legg Tutoring
        </Link>
        <div style={{ display: "flex", gap: 20, fontSize: "0.9rem" }}>
          <Link href="/consultation">Book a consultation</Link>
          <Link href="/portal/login">Client login</Link>
        </div>
      </nav>
    </header>
  );
}
