import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProfileAvatar from "@/components/ProfileAvatar";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Ed Legg | Legg Tutoring",
  description: "Meet Ed Legg, the math tutor behind Legg Tutoring.",
};

const PRINCIPLES = [
  {
    title: "Find the real gap",
    body: "A struggle with today's homework usually starts a few topics back. We find that spot first, so new material has something solid to stand on.",
  },
  {
    title: "Understand, then practice",
    body: "Knowing why a step works makes it stick. Once it makes sense, we practice until it's automatic.",
  },
  {
    title: "Mistakes are information",
    body: "A wrong answer shows exactly what to work on next. Students should feel safe getting things wrong in a session.",
  },
];

const BACKGROUND = [
  { label: "Education", value: "Placeholder: degree, school, year" },
  { label: "Experience", value: "Placeholder: years tutoring, number of students" },
  { label: "Specialties", value: "Placeholder: Algebra, Calculus, test prep" },
  { label: "Based in", value: "Roanoke, Virginia" },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <section className="about-hero">
        <div className="wrap about-hero-grid">
          <div className="about-hero-photo">
            <ProfileAvatar size={280} />
          </div>
          <div className="about-hero-copy">
            <span className="eyebrow">About your tutor</span>
            <h1>Hi, I&apos;m Ed Legg.</h1>
            <p className="lede">
              I help students get unstuck in math, from middle school through college, in live
              one-on-one sessions online.
            </p>
            <div className="hero-cta-row">
              <Link href="/consultation" className="btn">
                Book a free consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap prose-block">
          <Reveal>
            <h2>My story</h2>
            <p>
              Placeholder: how you got into math and teaching, and what made you start Legg
              Tutoring. A few short paragraphs work best here.
            </p>
            <p>
              Placeholder: a moment with a student that shows what you love about tutoring.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="band band-tint">
        <div className="wrap">
          <Reveal className="section-head">
            <h2>How I teach</h2>
            <p>Three ideas behind every session.</p>
          </Reveal>
          <div className="steps">
            {PRINCIPLES.map((p, i) => (
              <Reveal className="step-card" key={p.title} delay={i * 90}>
                <span className="step-number">{i + 1}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap split">
          <Reveal className="split-copy">
            <h2>Background</h2>
            <dl className="fact-list">
              {BACKGROUND.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal className="split-media" delay={120}>
            <div className="photo-placeholder">
              <span>Image placeholder: you at work, or something from outside math</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="band band-tint">
        <div className="wrap prose-block">
          <Reveal>
            <h2>Outside of math</h2>
            <p>Placeholder: hobbies, interests, or anything that helps families get to know you.</p>
          </Reveal>
        </div>
      </section>

      <section className="cta-band">
        <Reveal className="wrap cta-band-inner">
          <h2>Let&apos;s talk about your goals</h2>
          <p>A free 15-minute call is the easiest way to see if we&apos;re a good fit.</p>
          <Link href="/consultation" className="btn btn-light">
            Book a free consultation
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </>
  );
}
