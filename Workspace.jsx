
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  FileText,
  Languages,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { studyMaterials } from "../data/studyMaterials";

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "हिन्दी — Hindi" },
  { value: "Marathi", label: "मराठी — Marathi" },
  { value: "Urdu", label: "اردو — Urdu" },
];

const QUICK_PROMPTS = [
  "Explain this material simply",
  "List the most important concepts",
  "Create 5 practice questions",
  "Explain the difficult terms",
];

async function extractText(file) {
  if (file.extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");

    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const response = await fetch(file.url);
    const buffer = await response.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      pages.push(
        content.items.map((item) => item.str).join(" ")
      );
    }

    return pages.join("\n\n");
  }

  if (file.extension === "pptx") {
    const JSZip = (await import("jszip")).default;
    const response = await fetch(file.url);
    const zip = await JSZip.loadAsync(await response.arrayBuffer());

    const slidePaths = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const slides = [];

    for (const path of slidePaths) {
      const xml = await zip.files[path].async("text");
      const document = new DOMParser().parseFromString(
        xml,
        "application/xml"
      );

      const slideText = Array.from(
        document.getElementsByTagName("a:t")
      )
        .map((node) => node.textContent)
        .join(" ");

      slides.push(`Slide ${slides.length + 1}\n${slideText}`);
    }

    return slides.join("\n\n");
  }

  if (file.extension === "ppt") {
    throw new Error(
      "This is a legacy .ppt file. Convert it to .pptx to extract its text in this browser version."
    );
  }

  throw new Error("Unsupported document format.");
}

function getOverview(sourceText) {
  const cleanText = sourceText.replace(/\s+/g, " ").trim();

  if (!cleanText) return "";

  const sentences =
    cleanText.match(/[^.!?।؟]+[.!?।؟]?/g) || [cleanText];

  return sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35)
    .slice(0, 5)
    .join("\n\n");
}

export default function Workspace({ onBack }) {
  const [selectedId, setSelectedId] = useState(
    studyMaterials[0]?.id || ""
  );
  const [language, setLanguage] = useState("English");
  const [sourceText, setSourceText] = useState("");
  const [overview, setOverview] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("explain");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [showLibrary, setShowLibrary] = useState(true);

  const selected = useMemo(
    () => studyMaterials.find((item) => item.id === selectedId),
    [selectedId]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      if (!selected) {
        setSourceText("");
        setOverview("");
        setStatus("idle");
        return;
      }

      setStatus("loading");
      setError("");
      setSourceText("");
      setOverview("");
      setMessages([]);

      try {
        const text = await extractText(selected);

        if (cancelled) return;

        setSourceText(text);
        setOverview(getOverview(text));
        setStatus(text.trim() ? "ready" : "empty");
      } catch (err) {
        if (cancelled) return;

        setError(err.message || "Unable to read the selected file.");
        setStatus("error");
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function selectDocument(file) {
    setSelectedId(file.id);
    setActiveTab("explain");
    setQuestion("");
  }

  function ask(prompt) {
    const value = (prompt ?? question).trim();

    if (!value || !selected) return;

    const reply =
      status === "ready"
        ? `I extracted the text from "${selected.filename}". The source is available for an AI-generated answer, but this frontend-only version cannot reliably answer arbitrary questions or translate the material into ${language} without an AI service.`
        : `I cannot answer from "${selected.filename}" because its text is not currently available. ${error}`;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: value },
      { role: "assistant", text: reply },
    ]);

    setQuestion("");
  }

  const displayOverview =
    language === "English"
      ? overview
      : `Selected language: ${language}\n\n${overview}\n\nThis preview extracts source text but does not translate it. A multilingual AI service is needed for a genuine ${language} explanation.`;

  return (
    <div className="workspace-page">
      <header className="workspace-topbar">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to RAY
        </button>

        <div className="workspace-brand">
          <span className="brand-symbol">
            <Sparkles size={17} />
          </span>
          RAY <span className="workspace-divider">/</span> STUDY SPACE
        </div>

        <div className="language-select">
          <Languages size={16} />
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label="Explanation language"
          >
            {LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </div>
      </header>

      <div className="workspace-body">
        <aside className={`library-panel ${showLibrary ? "" : "library-hidden"}`}>
          <div className="panel-heading">
            <div>
              <span className="section-kicker">YOUR MATERIALS</span>
              <h2>Study library</h2>
            </div>

            <button
              className="plain-icon"
              onClick={() => setShowLibrary(false)}
              aria-label="Hide library"
            >
              <X size={16} />
            </button>
          </div>

          {studyMaterials.length === 0 ? (
            <div className="empty-library-card">
              <FileText size={24} />
              <strong>No files discovered</strong>
              <p>
                Place PDF or PPTX files inside src/components or a
                subfolder.
              </p>
            </div>
          ) : (
            studyMaterials.map((file) => (
              <button
                key={file.id}
                className={`library-file ${
                  file.id === selectedId ? "is-selected" : ""
                }`}
                onClick={() => {
                  selectDocument(file);
                  setShowLibrary(true);
                }}
              >
                <span className="file-type">
                  {file.extension.toUpperCase()}
                </span>
                <span className="library-file-title">{file.title}</span>
                {file.id === selectedId && <Check size={15} />}
              </button>
            ))
          )}

          <div className="privacy-note">
            <span className="privacy-dot" />
            Files are read in this browser
          </div>
        </aside>

        {!showLibrary && (
          <button
            className="show-library"
            onClick={() => setShowLibrary(true)}
          >
            <BookOpen size={16} />
            Library
          </button>
        )}

        <main className="document-workspace">
          {!selected ? (
            <div className="empty-workspace">
              <BookOpen size={32} />
              <h1>Your study space is ready.</h1>
              <p>
                Add PDF or PPTX files to src/components.
              </p>
            </div>
          ) : (
            <>
              <div className="document-heading">
                <div className="document-heading-icon">
                  <FileText size={22} />
                </div>

                <div className="document-heading-copy">
                  <span className="section-kicker">
                    {selected.type} · SELECTED MATERIAL
                  </span>
                  <h1>{selected.title}</h1>
                  <p>Choose a language and explore your material.</p>
                </div>

                <a
                  className="open-file-link"
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open file ↗
                </a>
              </div>

              <div className="study-tabs">
                {[
                  { id: "explain", label: "Explanation", icon: Sparkles },
                  { id: "notes", label: "Key points", icon: BookOpen },
                  { id: "questions", label: "Practice questions", icon: Brain },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={activeTab === id ? "active" : ""}
                    onClick={() => setActiveTab(id)}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="study-panel">
                {status === "loading" && (
                  <div className="loading-state">
                    <LoaderCircle className="spin" size={25} />
                    <h3>Reading your material…</h3>
                    <p>Extracting text from the selected file.</p>
                  </div>
                )}

                {status === "error" && (
                  <div className="error-state">
                    <FileText size={24} />
                    <h3>Couldn't extract this file</h3>
                    <p>{error}</p>
                    <p>
                      Scanned PDFs require OCR. Legacy PPT files should
                      be converted to PPTX for this version.
                    </p>
                  </div>
                )}

                {status === "empty" && (
                  <div className="error-state">
                    <FileText size={24} />
                    <h3>No selectable text found</h3>
                    <p>
                      The document may contain scanned pages or
                      image-based slides.
                    </p>
                  </div>
                )}

                {status === "ready" && activeTab === "explain" && (
                  <>
                    <div className="ai-result-header">
                      <span className="result-icon">
                        <Sparkles size={18} />
                      </span>
                      <div>
                        <h2>Document overview</h2>
                        <p>Source-text preview · {language}</p>
                      </div>
                      <span className="preview-label">PREVIEW</span>
                    </div>

                    <div className="summary-copy">
                      {displayOverview ||
                        "No overview could be prepared from the extracted text."}
                    </div>

                    <div className="source-preview">
                      <div>
                        <FileText size={16} />
                        <strong>Extracted source text</strong>
                        <span>
                          {sourceText.length.toLocaleString()} characters
                        </span>
                      </div>

                      <details>
                        <summary>View extracted text</summary>
                        <pre>
                          {sourceText.slice(0, 12000)}
                          {sourceText.length > 12000
                            ? "\n\n[Preview truncated]"
                            : ""}
                        </pre>
                      </details>
                    </div>
                  </>
                )}

                {status === "ready" && activeTab === "notes" && (
                  <>
                    <div className="ai-result-header">
                      <span className="result-icon">
                        <BookOpen size={18} />
                      </span>
                      <div>
                        <h2>Key points</h2>
                        <p>Sentences extracted from the source document</p>
                      </div>
                    </div>

                    <ul className="key-points">
                      {(sourceText.match(/[^.!?।؟]+[.!?।؟]?/g) || [])
                        .map((sentence) => sentence.trim())
                        .filter((sentence) => sentence.length > 45)
                        .slice(0, 10)
                        .map((sentence, index) => (
                          <li key={index}>{sentence}</li>
                        ))}
                    </ul>
                  </>
                )}

                {status === "ready" && activeTab === "questions" && (
                  <div className="question-prompts">
                    <div className="ai-result-header">
                      <span className="result-icon">
                        <Brain size={18} />
                      </span>
                      <div>
                        <h2>Practice prompts</h2>
                        <p>Question starters for this document</p>
                      </div>
                    </div>

                    {[
                      "What is the main idea of this material?",
                      "Explain one important concept in your own words.",
                      "Which definitions should I remember?",
                      "What are three likely exam questions?",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => {
                          setActiveTab("explain");
                          setQuestion(prompt);
                        }}
                      >
                        {prompt}
                        <Send size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <section className="ask-ray">
                <div className="ask-ray-heading">
                  <div className="ask-icon">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h2>Ask about this document</h2>
                    <p>
                      Questions stay associated with the selected file.
                    </p>
                  </div>
                </div>

                <div className="quick-prompts">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button key={prompt} onClick={() => ask(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="chat-history">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`chat-bubble ${message.role}`}
                    >
                      <span>
                        {message.role === "user" ? "YOU" : "RAY"}
                      </span>
                      <p>{message.text}</p>
                    </div>
                  ))}
                </div>

                <form
                  className="ask-input"
                  onSubmit={(event) => {
                    event.preventDefault();
                    ask();
                  }}
                >
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={`Ask a question in ${language}…`}
                  />
                  <button
                    type="submit"
                    disabled={!question.trim()}
                    aria-label="Send question"
                  >
                    <Send size={17} />
                  </button>
                </form>

                <p className="backend-note">
                  AI-generated answers and actual translation require
                  an AI service. Never put an API key in frontend code.
                </p>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
