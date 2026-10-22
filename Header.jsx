
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  BookOpen,
  Brain,
  Languages,
  Sparkles,
  Layers3,
  ChevronLeft,
  ChevronRight,
  FileUp,
  MessageCircle,
  History,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    label: "Understand",
    title: "Turn pages into clarity",
    text: "Explore your PDF and presentation, understand key concepts, and ask questions grounded in the source.",
    tone: "violet",
  },
  {
    icon: Brain,
    label: "Practice",
    title: "Learn by retrieval",
    text: "Turn your study material into revision notes, flashcards, quizzes, and exam questions.",
    tone: "blue",
  },
  {
    icon: Languages,
    label: "Multilingual",
    title: "Learn in your language",
    text: "Choose English, Hindi, Marathi, or Urdu for document explanations and chat.",
    tone: "pink",
  },
  {
    icon: Layers3,
    label: "Your library",
    title: "One focused study space",
    text: "Keep your built-in documents and newly uploaded files organized in one place.",
    tone: "amber",
  },
  {
    icon: FileUp,
    label: "Upload",
    title: "Bring your own material",
    text: "Upload a PDF or PPTX directly into the RAY chatbot to ask questions about it.",
    tone: "blue",
  },
  {
    icon: History,
    label: "History",
    title: "Pick up where you left off",
    text: "Return to previous document questions and study activities saved in this browser.",
    tone: "violet",
  },
];

export default function Header({ onStart }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % features.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [paused]);

  const previous = () =>
    setActive((current) =>
      (current - 1 + features.length) % features.length
    );

  const next = () =>
    setActive((current) => (current + 1) % features.length);

  const current = features[active];
  const FeatureIcon = current.icon;
  const left = features[(active - 1 + features.length) % features.length];
  const right = features[(active + 1) % features.length];

  return (
    <header className="ray-hero" id="top">
      <nav className="hero-nav">
        <a className="ray-brand" href="#top" aria-label="RAY home">
          <span className="brand-symbol">
            <Sparkles size={20} />
          </span>
          <span>
            RAY
            <small>READ · ANALYZE · YOURS</small>
          </span>
        </a>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#library">Your library</a>
          <button className="nav-cta" onClick={onStart}>
            Open workspace <ArrowDownRight size={16} />
          </button>
        </div>
      </nav>

      <div className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            YOUR PERSONAL STUDY SPACE
          </div>

          <h1>
            Make every document
            <br />
            <span>make sense.</span>
          </h1>

          <p className="hero-lede">
            Select your PDF or presentation. Explore its ideas, ask
            document-based questions, revise with purpose, and learn in
            your preferred language.
          </p>

          <div className="hero-actions">
            <button className="button-primary" onClick={onStart}>
              Explore your materials <ArrowDownRight size={17} />
            </button>
            <a className="text-link" href="#features">
              Discover RAY <ChevronRight size={15} />
            </a>
          </div>

          <div className="hero-proof">
            <span className="proof-avatars">
              <i>R</i>
              <i>A</i>
              <i>Y</i>
            </span>
            <span>One library. Multiple ways to learn.</span>
          </div>
        </div>

        <div
          className="carousel-scene"
          id="features"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setPaused(false);
            }
          }}
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="floating-chip chip-top">
            <Sparkles size={14} /> Six study features
          </div>

          <div className="floating-chip chip-bottom">
            <MessageCircle size={14} /> Ask about your documents
          </div>

          <div className="feature-carousel" key={active}>
            <div className={`feature-card card-back card-left tone-${left.tone}`}>
              <span className="card-label">{left.label}</span>
              <h2>{left.title}</h2>
            </div>

            <div className={`feature-card card-back card-right tone-${right.tone}`}>
              <span className="card-label">{right.label}</span>
              <h2>{right.title}</h2>
            </div>

            <article className={`feature-card card-front tone-${current.tone}`}>
              <div className="card-topline">
                <span>RAY / {String(active + 1).padStart(2, "0")}</span>
                <span className="card-live">
                  <i /> FEATURE
                </span>
              </div>

              <div className="card-icon">
                <FeatureIcon size={27} />
              </div>

              <span className="card-label">{current.label}</span>
              <h2>{current.title}</h2>
              <p>{current.text}</p>

              <div className="card-bottom">
                <span>EXPLORE THE POSSIBILITIES</span>
                <Sparkles size={16} />
              </div>
            </article>
          </div>

          <div className="carousel-controls">
            <button onClick={previous} aria-label="Previous feature">
              <ChevronLeft size={17} />
            </button>

            <div className="carousel-dots">
              {features.map((feature, index) => (
                <button
                  key={feature.label}
                  type="button"
                  className={index === active ? "selected" : ""}
                  onClick={() => setActive(index)}
                  aria-label={`Show ${feature.label}`}
                  aria-current={index === active ? "true" : undefined}
                />
              ))}
            </div>

            <button onClick={next} aria-label="Next feature">
              <ChevronRight size={17} />
            </button>
          </div>

          <p className="carousel-status" aria-live="polite">
            {active + 1} of {features.length} · {current.label}
            {paused ? " · Paused" : " · Auto-playing"}
          </p>
        </div>
      </div>

      <div className="hero-bottomline">
        <span>DOCUMENT-LED LEARNING</span>
        <span>PDF + POWERPOINT</span>
        <span>ENGLISH · हिन्दी · मराठी · اردو</span>
      </div>
    </header>
  );
}
