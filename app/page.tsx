import Link from "next/link";
import ConsultationBooking from "@/components/ConsultationBooking";

export default function HomePage() {
  return (
    <>
      <header>
        <nav className="nav" style={{ justifyContent: "space-between" }}>
          <div className="wordmark">Legg Tutoring</div>
          <Link href="/portal" style={{ fontSize: "0.9rem" }}>
            Client portal
          </Link>
        </nav>
      </header>

      <section className="slide slide-hero" id="hero">
        <div className="wrap hero-columns">
          <h1 className="hero-feature">Mathematics, Personalized</h1>
          <p className="lede">
            With Legg Tutoring, receive help that suits your needs. I work on
            areas that students are struggling in. Catch up and show out.
          </p>
          <div className="contact-card">
            <div className="img-placeholder avatar-placeholder">Your photo</div>
            <h3>Get in touch</h3>
            <div className="contact-line">
              <span className="label">Email</span>
              <span className="value">ed@leggtutoring.com</span>
            </div>
          </div>
          <div className="booking-card">
            <h3>Book a free 15-minute consultation call</h3>
            <ConsultationBooking />
          </div>
        </div>
        <div className="scroll-cue">
          <svg
            width="14"
            height="9"
            viewBox="0 0 16 10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1l7 7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Subjects &amp; levels
        </div>
      </section>

      <section className="slide" id="media">
        <div className="wrap">
          <div className="section-head">
            <h2>Math &amp; Education, Worth a Look</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </div>
          <div className="media-grid">
            <div className="media-card">
              <div className="img-placeholder">Media image</div>
              <div className="media-card-body">
                <h3>Lorem ipsum dolor sit</h3>
                <p>
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo.
                </p>
              </div>
            </div>
            <div className="media-card">
              <div className="img-placeholder">Media image</div>
              <div className="media-card-body">
                <h3>Consectetur adipiscing</h3>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit
                  esse cillum dolore eu fugiat nulla.
                </p>
              </div>
            </div>
            <div className="media-card">
              <div className="img-placeholder">Media image</div>
              <div className="media-card-body">
                <h3>Sed do eiusmod tempor</h3>
                <p>
                  Excepteur sint occaecat cupidatat non proident, sunt in
                  culpa qui officia deserunt mollit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="slide" id="subjects">
        <div className="wrap">
          <div className="section-head">
            <span className="section-number">01</span>
            <h2>Subjects &amp; levels</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </div>
          <div className="subject-grid">
            <div className="subject-card">
              <h3>Middle School</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                do eiusmod tempor.
              </p>
            </div>
            <div className="subject-card">
              <h3>High School</h3>
              <p>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip.
              </p>
            </div>
            <div className="subject-card">
              <h3>College</h3>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit
                esse cillum dolore.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="slide" id="about">
        <div className="wrap">
          <div className="section-head">
            <span className="section-number">02</span>
            <h2>About your tutor</h2>
          </div>
          <div className="img-placeholder about-photo-placeholder">Your photo</div>
          <div className="about-box">
            <p>
              <strong>Lorem ipsum dolor sit amet.</strong> Consectetur
              adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris.
            </p>
          </div>
        </div>
      </section>

      <footer>&copy; 2026 Legg Tutoring</footer>
    </>
  );
}
