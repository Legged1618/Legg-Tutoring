import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProblemShuffle from "@/components/ProblemShuffle";
import HeroSlideshow from "@/components/HeroSlideshow";
import ProfileAvatar from "@/components/ProfileAvatar";
import ArticleArt, { type ArticleArtKind } from "@/components/ArticleArt";
import Reveal from "@/components/Reveal";
import { createClient } from "@/lib/supabase/server";
import { PRICING, CANCELLATION_WINDOW_HOURS, sessionPriceCents } from "@/lib/pricing";
import { BOOKING_WINDOW_DAYS, SESSION_MIN_NOTICE_HOURS } from "@/lib/availability";

const STEPS = [
  {
    title: "Book a free call",
    short: "Pick a 15-minute slot, no payment needed.",
    body: "Pick a 15-minute slot. No account or payment needed. We'll talk about the class, the goals and what's been getting in the way.",
  },
  {
    title: "Book paid sessions",
    short: "Pick open times in your portal and pay when you book.",
    body: "After the call you can sign in to your portal, see open times on a calendar and book 30-minute, 1-hour or 2-hour sessions. Sessions are paid when you book.",
  },
  {
    title: "Meet online",
    short: "Live video and a shared whiteboard.",
    body: "Join from your portal with one click. Live video, voice and a shared whiteboard, with nothing to install.",
  },
];

const LEVELS = [
  {
    title: "Middle School",
    accent: "teal",
    body: "Build the foundations that everything later depends on, and the confidence to go with them.",
    topics: ["Pre-algebra", "Fractions & ratios", "Integers", "Intro to equations", "Math 7 & 8"],
  },
  {
    title: "High School",
    accent: "brass",
    body: "Keep up in class, close the gaps, and get ready for tests that count.",
    topics: ["Algebra I & II", "Geometry", "Trigonometry", "Precalculus", "Calculus", "SAT / ACT math"],
  },
  {
    title: "College",
    accent: "ink",
    body: "Work through the courses that weed people out, one concept at a time.",
    topics: ["College algebra", "Calculus I–III", "Statistics", "Linear algebra"],
  },
];

const ARTICLES = [
  {
    tag: "Mindset",
    title: "There's no such thing as a “math person”",
    body: "Research from Stanford's youcubed team on how mistakes and effort grow math ability, and what parents can say to help.",
    href: "https://www.youcubed.org/",
    source: "youcubed.org",
    art: "youcubed" as ArticleArtKind,
  },
  {
    tag: "Study skills",
    title: "Practice that actually sticks",
    body: "Spaced practice and quizzing yourself beat rereading notes. The Learning Scientists explain six strategies in plain language.",
    href: "https://www.learningscientists.org/",
    source: "learningscientists.org",
    art: "learningscientists" as ArticleArtKind,
  },
  {
    tag: "Tools",
    title: "See the graph, not just the formula",
    body: "Desmos is a free graphing calculator that makes functions click. Students can use it at home to see what an equation really does.",
    href: "https://www.desmos.com/calculator",
    source: "desmos.com",
    art: "desmos" as ArticleArtKind,
  },
  {
    tag: "Practice",
    title: "Free practice between sessions",
    body: "Khan Academy has a lesson and practice set for nearly every topic from pre-algebra through calculus.",
    href: "https://www.khanacademy.org/math",
    source: "khanacademy.org",
    art: "khan" as ArticleArtKind,
  },
  {
    tag: "Geometry",
    title: "Move the shapes yourself",
    body: "GeoGebra lets students drag points and watch angles, areas and proofs change in real time.",
    href: "https://www.geogebra.org/",
    source: "geogebra.org",
    art: "geogebra" as ArticleArtKind,
  },
  {
    tag: "Test prep",
    title: "Retrieval practice before a big test",
    body: "Why pulling information out of memory beats putting it back in, with quick ideas to try the week of an exam.",
    href: "https://www.retrievalpractice.org/",
    source: "retrievalpractice.org",
    art: "retrieval" as ArticleArtKind,
  },
];

const SESSION_PLAN = [
  { time: "0:00", title: "Check in", body: "What's due, what's coming up, what's confusing." },
  { time: "0:05", title: "Warm up", body: "A quick problem or two from last time." },
  { time: "0:15", title: "Work through it together", body: "New material, step by step on the whiteboard." },
  { time: "0:40", title: "Your turn", body: "You solve, I coach and catch the gaps." },
  { time: "0:55", title: "Wrap up", body: "What to practice before next time." },
];

const SHOW_REVIEWS = false;

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const isTutor = Boolean(
    user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );

  const secondCta = user
    ? isTutor
      ? { href: "/portal/admin", label: "Go to admin portal" }
      : { href: "/portal", label: "Go to client portal" }
    : { href: "/portal/login", label: "Existing client? Log in" };

  const hourly = PRICING.virtualHourlyRateCents;

  return (
    <>
      <SiteHeader />

      <section className="hero" id="hero">
        <div className="wrap">
          <HeroSlideshow
            slides={[
              {
                id: "welcome",
                label: "Welcome",
                content: (
                  <div className="hero-grid">
                    <div className="hero-copy">
                      <span className="eyebrow">Virtual math tutoring &middot; Nationwide</span>
                      <h1 className="hero-title">Mathematics, Personalized</h1>
                      <p className="lede">
                        Welcome to Legg Tutoring! Work on your weaknesses, polish your strengths, and
                        perform academically!
                      </p>
                      <div className="hero-cta-row">
                        <Link href="/consultation" className="btn">
                          New client? Book a free consultation
                        </Link>
                        <Link href={secondCta.href} className="btn btn-secondary">
                          {secondCta.label}
                        </Link>
                      </div>
                    </div>
                    <ProblemShuffle />
                  </div>
                ),
              },
              {
                id: "how",
                label: "How it works",
                content: (
                  <div className="hero-grid">
                    <div className="hero-copy">
                      <span className="eyebrow">How it works</span>
                      <h2 className="hero-title">From first call to first session</h2>
                      <p className="lede">
                        A free video call, a calendar to pick your times, and a private online room
                        for every session.
                      </p>
                      <div className="hero-cta-row">
                        <a href="#how" className="btn btn-secondary">
                          See the three steps
                        </a>
                      </div>
                    </div>
                    <ol className="slide-steps">
                      {STEPS.map((step, i) => (
                        <li key={step.title}>
                          <span className="step-number">{i + 1}</span>
                          <div>
                            <strong>{step.title}</strong>
                            <span>{step.short}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ),
              },
              {
                id: "subjects",
                label: "Subjects",
                content: (
                  <div className="hero-grid">
                    <div className="hero-copy">
                      <span className="eyebrow">Subjects and Levels</span>
                      <h2 className="hero-title">Middle school through undergraduate</h2>
                      <p className="lede">
                        From pre-algebra foundations to calculus, statistics and linear algebra.
                      </p>
                      <div className="hero-cta-row">
                        <a href="#subjects" className="btn btn-secondary">
                          See all subjects
                        </a>
                      </div>
                    </div>
                    <div className="slide-levels">
                      {LEVELS.map((level) => (
                        <div className={`slide-level accent-${level.accent}`} key={level.title}>
                          <strong>{level.title}</strong>
                          <span>{level.topics.slice(0, 4).join(" · ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                id: "pricing",
                label: "Pricing",
                content: (
                  <div className="hero-grid">
                    <div className="hero-copy">
                      <span className="eyebrow">Pricing &amp; policies</span>
                      <h2 className="hero-title">Free call, paid sessions</h2>
                      <p className="lede">
                        The consultation call is always free. Tutoring sessions are {dollars(hourly)} an hour, paid when you book, with a full refund
                        if you cancel at least {CANCELLATION_WINDOW_HOURS} hours ahead.
                      </p>
                      <div className="hero-cta-row">
                        <a href="#pricing" className="btn btn-secondary">
                          See pricing &amp; policies
                        </a>
                      </div>
                    </div>
                    <div className="slide-prices">
                      {[30, 60, 120].map((m) => (
                        <div className={`slide-price${m === 60 ? " featured" : ""}`} key={m}>
                          <span>{m === 30 ? "30 min" : m === 60 ? "1 hour" : "2 hours"}</span>
                          <strong>{dollars(sessionPriceCents(m))}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                id: "tutor",
                label: "Your tutor",
                content: (
                  <div className="hero-grid">
                    <div className="hero-copy">
                      <span className="eyebrow">Meet your tutor</span>
                      <h2 className="hero-title">Hi, I&apos;m Ed Legg</h2>
                      <p className="lede">
                        Applied mathematics graduate, four years of tutoring, and a firm believer that
                        anyone willing can learn math.
                      </p>
                      <div className="hero-cta-row">
                        <Link href="/about" className="btn btn-secondary">
                          More about me
                        </Link>
                      </div>
                    </div>
                    <div className="slide-portrait">
                      <ProfileAvatar size={260} />
                    </div>
                  </div>
                ),
              },
            ]}
          />
          <ul className="hero-facts">
            <li>
              <strong>Free</strong> 15-minute consultation call
            </li>
            <li>
              <strong>{dollars(hourly)}</strong> per hour for sessions
            </li>
            <li>
              <strong>Online</strong> from anywhere in the U.S.
            </li>
          </ul>
        </div>
        <a href="#how" className="scroll-cue">
          <svg width="14" height="9" viewBox="0 0 16 10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M1 1l7 7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          How it works
        </a>
      </section>

      <section className="band" id="how">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="section-number">01</span>
            <h2>How it works</h2>
            <p>From first call to first session in three steps.</p>
          </Reveal>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <Reveal as="li" className="step-card" key={step.title} delay={i * 90}>
                <span className="step-number">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="band band-tint" id="subjects">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="section-number">02</span>
            <h2>Subjects and Levels</h2>
            <p>From middle school foundations through undergraduate specialties.</p>
          </Reveal>
          <div className="subject-grid">
            {LEVELS.map((level, i) => (
              <Reveal className={`subject-card accent-${level.accent}`} key={level.title} delay={i * 90}>
                <h3>{level.title}</h3>
                <p>{level.body}</p>
                <ul className="topic-chips">
                  {level.topics.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="band band-dark" id="sessions">
        <div className="wrap split">
          <Reveal className="split-copy">
            <span className="section-number">03</span>
            <h2>What a session looks like</h2>
            <p>
              Every session happens in a private online room built for math. We see and hear each
              other, and we both write on the same whiteboard, with graphs, equation tools and room
              to work problems out step by step.
            </p>
            <ul className="check-list">
              <li>Join from your portal, starting 10 minutes before the session</li>
              <li>Works in a web browser on a laptop or tablet, nothing to install</li>
              <li>Bring homework, a study guide or a test that&apos;s coming up</li>
              <li>Message your tutor in the portal between sessions</li>
            </ul>
          </Reveal>
          <Reveal className="split-media" delay={120}>
            <div className="session-plan">
              <div className="session-plan-head">
                <span>A typical hour</span>
                <strong>60 min</strong>
              </div>
              <ol>
                {SESSION_PLAN.map((s) => (
                  <li key={s.time}>
                    <span className="session-plan-time">{s.time}</span>
                    <div>
                      <strong>{s.title}</strong>
                      <p>{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="band" id="pricing">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="section-number">04</span>
            <h2>Pricing &amp; policies</h2>
            <p>The consultation call is free. Tutoring sessions are paid, at one flat hourly rate, when you book.</p>
          </Reveal>
          <div className="pricing-grid">
            <Reveal className="price-card">
              <span className="price-label">Consultation</span>
              <div className="price-amount">Free</div>
              <p className="price-sub">15-minute video call</p>
              <ul className="check-list">
                <li>Talk through goals and where things stand</li>
                <li>See if we&apos;re a good fit</li>
                <li>Always free, no payment details needed</li>
              </ul>
              <Link href="/consultation" className="btn btn-secondary">
                Book a free call
              </Link>
            </Reveal>
            <Reveal className="price-card featured" delay={90}>
              <span className="price-label">Paid tutoring session</span>
              <div className="price-amount">
                {dollars(hourly)}
                <span>/hour</span>
              </div>
              <p className="price-sub">Live online, one-on-one, paid when you book</p>
              <ul className="price-options">
                <li>
                  <span>30 minutes</span>
                  <strong>{dollars(sessionPriceCents(30))}</strong>
                </li>
                <li>
                  <span>1 hour</span>
                  <strong>{dollars(sessionPriceCents(60))}</strong>
                </li>
                <li>
                  <span>2 hours</span>
                  <strong>{dollars(sessionPriceCents(120))}</strong>
                </li>
              </ul>
              <Link href="/consultation" className="btn">
                Get started
              </Link>
            </Reveal>
          </div>

          <Reveal className="policy-grid">
            <div className="policy-item">
              <h3>Cancel {CANCELLATION_WINDOW_HOURS}+ hours ahead</h3>
              <p>Full refund, automatically.</p>
            </div>
            <div className="policy-item">
              <h3>Cancel inside {CANCELLATION_WINDOW_HOURS} hours</h3>
              <p>Full refund minus a {dollars(PRICING.lateCancelFlatFeeCents)} cancellation fee.</p>
            </div>
            <div className="policy-item">
              <h3>If your tutor cancels</h3>
              <p>Full refund, automatically.</p>
            </div>
            <div className="policy-item">
              <h3>Booking</h3>
              <p>
                Book {SESSION_MIN_NOTICE_HOURS / 24} to {BOOKING_WINDOW_DAYS} days ahead. Sessions run
                1 PM to 9 PM Eastern, every day.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="band band-tint" id="about">
        <div className="wrap about-teaser">
          <Reveal className="about-teaser-photo">
            <ProfileAvatar size={240} />
          </Reveal>
          <Reveal className="about-teaser-copy" delay={90}>
            <span className="section-number">05</span>
            <h2>About your tutor</h2>
            <p>
              I&apos;m Ed Legg. I tutor math online from Roanoke, Virginia, and I work with
              students wherever they are. My job is to find the exact spot where things stopped
              making sense and rebuild from there, at a pace that fits the student.
            </p>
            <Link href="/about" className="text-link">
              More about me &rarr;
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Reviews board: hidden until there are real reviews. Flip SHOW_REVIEWS to bring it back. */}
      {SHOW_REVIEWS && (
      <section className="band" id="reviews">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="section-number">06</span>
            <h2>What families say</h2>
            <p>Reviews from students and parents will appear here.</p>
          </Reveal>
          <div className="review-grid">
            {[0, 1, 2].map((i) => (
              <Reveal className="review-card placeholder" key={i} delay={i * 90}>
                <div className="review-stars" aria-hidden="true">
                  ★★★★★
                </div>
                <span className="review-line w90" />
                <span className="review-line w80" />
                <span className="review-line w60" />
                <div className="review-author">
                  <span className="review-avatar" />
                  <span className="review-line w40" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      <section className="band band-tint" id="media">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="section-number">06</span>
            <h2>Math &amp; Education, Worth a Look</h2>
            <p>Free tools and reading for students and parents.</p>
          </Reveal>
          <div className="article-grid">
            {ARTICLES.map((a, i) => (
              <Reveal as="article" className="article-card" key={a.title} delay={(i % 3) * 90}>
                <a href={a.href} target="_blank" rel="noopener noreferrer">
                  <div className="article-image">
                    <ArticleArt kind={a.art} />
                  </div>
                  <div className="article-body">
                    <span className="article-tag">{a.tag}</span>
                    <h3>{a.title}</h3>
                    <p>{a.body}</p>
                    <span className="article-source">{a.source} &#8599;</span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <Reveal className="wrap cta-band-inner">
          <h2>Ready to get unstuck?</h2>
          <p>Book a free 15-minute call and we&apos;ll make a plan together.</p>
          <Link href="/consultation" className="btn btn-light">
            Book a free consultation
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </>
  );
}
