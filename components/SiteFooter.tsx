import Link from "next/link";
import LogoMark from "@/components/LogoMark";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-inner">
        <div className="site-footer-brand">
          <Link href="/" className="wordmark">
            <LogoMark size={30} tone="dark" />
            Legg Tutoring
          </Link>
          <p>Virtual math tutoring from Roanoke, Virginia, for students anywhere in the U.S.</p>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/#pricing">Pricing &amp; policies</Link>
          <Link href="/consultation">Book a free consultation</Link>
          <Link href="/portal/login">Client login</Link>
        </nav>
      </div>
      <div className="wrap site-footer-legal">&copy; {new Date().getFullYear()} Legg Tutoring</div>
    </footer>
  );
}
