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
  { label: "Education", value: "Bachelor of Science in Applied Mathematics, University of Utah, 2025" },
  {
    label: "Experience",
    value:
      "I've tutored dozens of students over a span of four years. I've helped students achieve at all levels, from middle school to upper undergraduate.",
  },
  { label: "Based in", value: "Roanoke, Virginia" },
];

const READING = [
  {
    author: "John von Neumann",
    title: <>&ldquo;The Mathematician&rdquo;</>,
    year: 1947,
    href: "https://scholar.google.com/scholar?q=%22The+Mathematician%22+von+Neumann+1947",
  },
  {
    author: "George Pólya",
    title: <em>How to Solve It</em>,
    year: 1945,
    href: "https://press.princeton.edu/books/paperback/9780691164076/how-to-solve-it",
  },
  {
    author: "John Dewey",
    title: <em>How We Think</em>,
    year: 1910,
    href: "https://www.gutenberg.org/ebooks/search/?query=dewey+how+we+think",
  },
  {
    author: "Carol S. Dweck",
    title: <em>Mindset: The New Psychology of Success</em>,
    year: 2006,
    href: "https://search.worldcat.org/search?q=Mindset+The+New+Psychology+of+Success+Dweck",
  },
  {
    author: "Jo Boaler",
    title: <em>Mathematical Mindsets</em>,
    year: 2016,
    href: "https://search.worldcat.org/search?q=Mathematical+Mindsets+Boaler",
  },
  {
    author: "National Research Council",
    title: <em>Adding It Up: Helping Children Learn Mathematics</em>,
    year: 2001,
    href: "https://nap.nationalacademies.org/catalog/9822/adding-it-up-helping-children-learn-mathematics",
  },
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
            <h2>Teaching philosophy</h2>
            <blockquote className="pull-quote">&ldquo;When am I going to use this?&rdquo;</blockquote>
            <p>
              I&apos;ve heard this question more times than I can count, and I&apos;ve asked it
              myself. It comes from real struggle with a subject that can feel abstract and
              disconnected from anything tangible. Mathematics can look like it exists only for its
              own sake. John von Neumann warned about exactly this: that mathematics drifting too far
              from its real-world sources risks becoming &ldquo;l&apos;art pour l&apos;art,&rdquo;
              art for art&apos;s sake.
            </p>
            <p>
              At any level, math is a set of skills that can be learned, and anyone willing to put in
              the work can learn them. Research backs this up. Carol Dweck&apos;s work on growth
              mindset and Jo Boaler&apos;s on mathematical mindsets show that ability grows with
              effort, and that mistakes are part of how it grows. Struggle isn&apos;t a sign that a
              student isn&apos;t a &ldquo;math person.&rdquo; It&apos;s what learning math feels
              like.
            </p>
            <p>
              Math is hard, and it&apos;s easy to think the only reward is getting past that
              difficulty. I believe the reward is bigger. The reasoning and problem-solving habits
              that math builds, out of necessity, carry over to everyday life and to the problems we
              all face. George P&oacute;lya&apos;s <em>How to Solve It</em> laid out those habits
              decades ago: understand the problem, make a plan, carry it out, and look back. They
              work just as well on a hard decision as on a hard equation. John Dewey made a similar
              case in <em>How We Think</em>: careful, reflective reasoning is a skill that has to be
              practiced, and math is one of the best places to practice it. The National Research
              Council&apos;s <em>Adding It Up</em> even counts seeing math as sensible, useful and
              worthwhile as one of the five strands of being good at math.
            </p>
            <p>
              So in every session the goal is two things: getting the math right, and building the
              thinking that will still be useful long after the test.
            </p>
            <div className="reading-list">
              <h3>Further reading</h3>
              <ul>
                {READING.map((r) => (
                  <li key={r.href}>
                    <a href={r.href} target="_blank" rel="noopener noreferrer">
                      {r.author}, {r.title}
                    </a>{" "}
                    ({r.year})
                  </li>
                ))}
              </ul>
            </div>
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
            <h2>Looking ahead</h2>
            <p>
              I&apos;m preparing to begin graduate studies in mathematics abroad. The questions that
              pull me in come from harmonic analysis: the idea that a complicated signal can be
              broken down into simple waves. A chord on a piano is a handful of frequencies sounding
              at once. White light splits into a spectrum of colors. Fourier analysis gives a precise
              way to take those signals apart and put them back together, and the same mathematics
              sits behind digital audio, image compression and medical imaging.
            </p>
            <p>
              Functional analysis is the framework that makes those ideas rigorous. Instead of
              working with one function at a time, it treats whole families of functions as points
              in a space with its own geometry, where you can measure distance and angle. In that
              setting, a sound wave and a light wave become vectors, and breaking a signal into
              frequencies becomes a change of coordinates. It&apos;s abstract, but it&apos;s some of
              the most useful abstraction in mathematics, and it&apos;s a good answer to &ldquo;when
              am I going to use this?&rdquo;
            </p>
            <p>
              Further down the road, I want to pursue a Doctor of Education (EdD) so I can study how
              people learn mathematics and bring that research straight back into how I teach.
            </p>
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
