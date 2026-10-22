
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bot, X, Minus, Send, Sparkles, User, Copy, Check,
  RotateCcw, Trash2, Sun, Moon, AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_PROMPTS = [
  "Explain something simply",
  "Help me write code",
  "Give me some ideas",
];

export default function GeminiChatbot({
  apiUrl = "http://127.0.0.1:5000/api/chat",
  title = "Gemini Assistant",
  subtitle = "Ask me anything",
  accent = "#7c3aed",
  initialTheme = "dark",
  welcomeMessage = "Hi! 👋 How can I help you today?",
  suggestedPrompts = DEFAULT_PROMPTS,
}) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dark, setDark] = useState(initialTheme === "dark");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [copied, setCopied] = useState(null);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus();
  }, [open, minimized]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function sendMessage(text = input) {
    const question = text.trim();
    if (!question || loading) return;

    setError("");
    setInput("");
    setLastQuestion(question);
    setLoading(true);

    const history = messagesRef.current;
    const userMessage = { role: "user", content: question };
    const assistantMessage = {
      role: "assistant",
      content: "",
      pending: true,
    };
    const next = [...history, userMessage, assistantMessage];

    setMessages(next);
    messagesRef.current = next;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: question,
          history: history
            .filter((m) => m.content && !m.pending)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      if (!response.body) throw new Error("Streaming is not supported here.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const payload = line.slice(5).trim();
          if (!payload) continue;

          const event = JSON.parse(payload);
          if (event.error) throw new Error(event.error);
          if (event.text) {
            answer += event.text;
            setMessages((current) => {
              const updated = [...current];
              updated[updated.length - 1] = {
                role: "assistant",
                content: answer,
              };
              messagesRef.current = updated;
              return updated;
            });
          }
        }
      }

      if (!answer.trim()) throw new Error("Gemini returned an empty response.");

      setMessages((current) => {
        const updated = [...current];
        updated[updated.length - 1] = {
          role: "assistant",
          content: answer,
        };
        messagesRef.current = updated;
        return updated;
      });
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages((current) => {
          const updated = current.map((m) =>
            m.pending ? { ...m, pending: false } : m
          );
          messagesRef.current = updated;
          return updated;
        });
      } else {
        setError(err.message || "Something went wrong.");
        setMessages((current) => {
          const updated = current.filter((m) => !m.pending);
          messagesRef.current = updated;
          return updated;
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  function clearChat() {
    stopGeneration();
    setMessages([]);
    messagesRef.current = [];
    setError("");
    setLastQuestion("");
  }

  async function copyMessage(text, index) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Clipboard access failed. Please copy the text manually.");
    }
  }

  const shell = dark
    ? "bg-slate-950 text-slate-100 border-white/10"
    : "bg-white text-slate-800 border-slate-200";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const field = dark
    ? "bg-white/5 border-white/10 placeholder:text-slate-500"
    : "bg-slate-50 border-slate-200 placeholder:text-slate-400";

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] font-sans"
      style={{ "--chat-accent": accent }}
    >
      <AnimatePresence>
        {open && !minimized && (
          <motion.section
            key="chat-window"
            role="dialog"
            aria-label={title}
            aria-modal="false"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`mb-4 flex h-[min(620px,calc(100dvh-110px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border shadow-2xl shadow-black/25 backdrop-blur-2xl ${shell}`}
          >
            <header
              className="relative flex items-center gap-3 border-b border-white/10 px-4 py-4"
              style={{
                background: `linear-gradient(120deg, ${accent}35, ${accent}10)`,
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${accent}, #2563eb)` }}
              >
                <Sparkles size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{title}</h2>
                <p className={`flex items-center gap-1.5 text-xs ${muted}`}>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {subtitle}
                </p>
              </div>
              <button
                type="button"
                title={dark ? "Switch to light theme" : "Switch to dark theme"}
                aria-label="Toggle theme"
                onClick={() => setDark((v) => !v)}
                className="rounded-xl p-2 transition hover:bg-white/10"
              >
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button
                type="button"
                title="Clear conversation"
                aria-label="Clear conversation"
                onClick={clearChat}
                className="rounded-xl p-2 transition hover:bg-white/10"
              >
                <Trash2 size={17} />
              </button>
              <button
                type="button"
                title="Minimize"
                aria-label="Minimize chat"
                onClick={() => setMinimized(true)}
                className="rounded-xl p-2 transition hover:bg-white/10"
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                title="Close"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 transition hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </header>

            <div
              className={`chatbot-scrollbar flex-1 space-y-5 overflow-y-auto px-4 py-5 ${muted}`}
              aria-live="polite"
              aria-relevant="additions text"
            >
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex min-h-48 flex-col items-center justify-center text-center"
                >
                  <div
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${accent}, #2563eb)` }}
                  >
                    <Bot size={30} />
                  </div>
                  <h3 className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                    How can I help?
                  </h3>
                  <p className="mt-1 max-w-60 text-sm">
                    Ask a question, explore an idea, or get help with a task.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        disabled={loading}
                        className="rounded-full border border-white/10 px-3 py-2 text-xs transition hover:-translate-y-0.5 hover:border-violet-400/50 hover:bg-violet-500/10 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={`${index}-${message.role}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      message.role === "user"
                        ? "bg-slate-600 text-white"
                        : "text-white"
                    }`}
                    style={message.role === "assistant"
                      ? { background: `linear-gradient(135deg, ${accent}, #2563eb)` }
                      : undefined}
                  >
                    {message.role === "user" ? <User size={16} /> : <Sparkles size={16} />}
                  </div>

                  <div className={`min-w-0 max-w-[85%] ${message.role === "user" ? "text-right" : ""}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-3 text-left text-sm leading-6 ${
                        message.role === "user"
                          ? "rounded-tr-md text-white"
                          : `rounded-tl-md ${dark ? "bg-white/[0.07]" : "bg-slate-100"}`
                      }`}
                      style={message.role === "user" ? { backgroundColor: accent } : undefined}
                    >
                      {message.content ? (
                        message.role === "assistant" ? (
                          <div className="chatbot-markdown break-words">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ node, ...props }) => (
                                  <a {...props} target="_blank" rel="noopener noreferrer" className="underline" />
                                ),
                                pre: ({ children }) => (
                                  <pre className="my-2 overflow-x-auto rounded-xl bg-black/20 p-3">{children}</pre>
                                ),
                                code: ({ children, className, ...props }) => (
                                  <code className={`rounded bg-black/10 px-1 ${className || ""}`} {...props}>{children}</code>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )
                      ) : (
                        <span className="flex gap-1 py-1" aria-label="Gemini is thinking">
                          {[0, 1, 2].map((n) => (
                            <span key={n} className="chatbot-dot h-2 w-2 rounded-full bg-current" />
                          ))}
                        </span>
                      )}
                    </div>

                    {message.role === "assistant" && message.content && (
                      <button
                        type="button"
                        onClick={() => copyMessage(message.content, index)}
                        className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs transition hover:bg-white/10 ${muted}`}
                      >
                        {copied === index ? <Check size={13} /> : <Copy size={13} />}
                        {copied === index ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              <div ref={endRef} />
            </div>

            {error && (
              <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-500">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1 break-words">{error}</div>
                <button type="button" onClick={() => sendMessage(lastQuestion)} disabled={loading || !lastQuestion} className="font-semibold underline disabled:opacity-40">
                  Retry
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className={`border-t p-3 ${dark ? "border-white/10" : "border-slate-200"}`}
            >
              <div className={`flex items-end gap-2 rounded-2xl border p-2 ${field}`}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Message the assistant..."
                  aria-label="Your message"
                  className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none"
                />
                {loading ? (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    title="Stop generation"
                    aria-label="Stop generation"
                    className="rounded-xl bg-red-500 p-2.5 text-white transition hover:bg-red-600"
                  >
                    <X size={18} />
                  </button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={!input.trim()}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    aria-label="Send message"
                    className="rounded-xl p-2.5 text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${accent}, #2563eb)` }}
                  >
                    <Send size={18} />
                  </motion.button>
                )}
              </div>
              <p className={`mt-2 text-center text-[10px] ${muted}`}>
                AI can make mistakes. Check important information.
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <motion.button
          type="button"
          aria-label={open ? "Close assistant" : "Open assistant"}
          title={open ? "Close assistant" : "Chat with AI"}
          onClick={() => {
            setOpen((v) => !v);
            setMinimized(false);
          }}
          whileHover={{ scale: 1.07, rotate: 3 }}
          whileTap={{ scale: 0.92 }}
          animate={{ y: [0, -3, 0] }}
          transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
          className="chatbot-pulse flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl shadow-violet-900/30"
          style={{ background: `linear-gradient(135deg, ${accent}, #2563eb)` }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "bot"}
              initial={{ opacity: 0, rotate: -35, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 35, scale: 0.7 }}
              transition={{ duration: 0.15 }}
            >
              {open ? <X size={25} /> : <Bot size={26} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
