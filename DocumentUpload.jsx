
import { useEffect, useState } from "react";
import {
  FileText, FileUp, Trash2, RefreshCw, BookOpen,
  BrainCircuit, ClipboardList, Languages, LoaderCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const API = "http://127.0.0.1:5000/api";

export default function DocumentUpload() {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [task, setTask] = useState("summary");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function refreshDocuments() {
    try {
      const response = await fetch(`${API}/documents`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load documents.");
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function uploadFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setBusy(true);
    setError("");
    setResult("");

    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);

        const response = await fetch(`${API}/documents`, {
          method: "POST",
          body: form,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Could not upload ${file.name}.`);
        }

        setSelected((current) => [...new Set([...current, data.id])]);
      }
      await refreshDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument(id) {
    if (!window.confirm("Delete this document and its indexed content?")) return;
    setError("");

    try {
      const response = await fetch(`${API}/documents/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Delete failed.");
      setDocuments((current) => current.filter((doc) => doc.id !== id));
      setSelected((current) => current.filter((docId) => docId !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function generateStudyMaterial() {
    setBusy(true);
    setError("");
    setResult("");

    try {
      const response = await fetch(`${API}/study`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_type: task,
          document_ids: selected,
          topic,
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      setResult(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const studyTasks = [
    { value: "summary", label: "Summary", icon: BookOpen },
    { value: "notes", label: "Revision notes", icon: FileText },
    { value: "explain", label: "Simple explanation", icon: Languages },
    { value: "flashcards", label: "Flashcards", icon: BrainCircuit },
    { value: "quiz", label: "MCQ quiz", icon: ClipboardList },
    { value: "question-paper", label: "Question paper", icon: FileText },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-3xl border border-white/10 bg-[#101525] p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
            <FileUp />
          </span>
          <div>
            <h3 className="text-lg font-semibold">Your documents</h3>
            <p className="text-sm text-slate-400">Upload and select study material.</p>
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-violet-300/30 bg-violet-500/5 px-4 py-9 text-center transition hover:bg-violet-500/10">
          {busy ? (
            <LoaderCircle className="animate-spin text-violet-300" size={28} />
          ) : (
            <FileUp className="text-violet-300" size={28} />
          )}
          <span className="mt-3 font-medium">
            {busy ? "Processing…" : "Choose documents to upload"}
          </span>
          <span className="mt-1 text-xs text-slate-400">
            PDF, TXT, Markdown, DOCX, PPTX, XLSX or CSV · Maximum 25 MB
          </span>
          <input
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.txt,.md,.docx,.pptx,.xlsx,.csv"
            onChange={uploadFiles}
            disabled={busy}
          />
        </label>

        <div className="mt-5 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Indexed files</h4>
          <button
            onClick={refreshDocuments}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Refresh document list"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {documents.length === 0 && (
            <p className="rounded-xl border border-white/5 p-4 text-sm text-slate-400">
              No documents yet. Upload one to begin.
            </p>
          )}

          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 p-3"
            >
              <input
                type="checkbox"
                checked={selected.includes(doc.id)}
                onChange={(event) => {
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, doc.id]
                      : current.filter((id) => id !== doc.id)
                  );
                }}
                aria-label={`Select ${doc.original_name}`}
              />
              <FileText size={18} className="shrink-0 text-violet-300" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">
                  {doc.original_name}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {doc.file_type} · {doc.page_count} extracted sections
                </p>
              </div>
              <button
                onClick={() => deleteDocument(doc.id)}
                className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                aria-label={`Delete ${doc.original_name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#101525] p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
            <BrainCircuit />
          </span>
          <div>
            <h3 className="text-lg font-semibold">Study studio</h3>
            <p className="text-sm text-slate-400">Create personalized revision resources.</p>
          </div>
        </div>

        <label className="mt-6 block text-sm font-medium">
          Study topic (optional if documents are selected)
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. Photosynthesis"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Output language
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#101525] px-4 py-3 text-sm outline-none focus:border-violet-400"
          >
            {["English", "Hindi", "Marathi", "Urdu"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {studyTasks.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTask(value)}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                task === value
                  ? "border-violet-400 bg-violet-500/15 text-white"
                  : "border-white/10 text-slate-400 hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <button
          disabled={busy || (selected.length === 0 && !topic.trim())}
          onClick={generateStudyMaterial}
          className="mt-5 w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Working…" : "Generate study material"}
        </button>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="font-semibold">Your result</h4>
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="text-xs text-violet-300 hover:text-white"
              >
                Copy
              </button>
            </div>
            <div className="ray-markdown max-h-[28rem] overflow-y-auto text-sm leading-7 text-slate-200">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
