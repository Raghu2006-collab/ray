
import { useEffect, useState } from "react";
import { Clock3, Trash2, BookOpen, MessageCircle } from "lucide-react";

export const RAY_HISTORY_KEY = "ray-study-history-v1";

export function saveRayHistory(entry) {
  try {
    const previous = JSON.parse(
      localStorage.getItem(RAY_HISTORY_KEY) || "[]"
    );

    const next = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        ...entry,
      },
      ...previous,
    ].slice(0, 100);

    localStorage.setItem(RAY_HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("ray-history-updated"));
  } catch (error) {
    console.error("Could not save RAY history:", error);
  }
}

export default function StudyHistory({ onOpenEntry }) {
  const [items, setItems] = useState([]);

  function loadHistory() {
    try {
      setItems(
        JSON.parse(localStorage.getItem(RAY_HISTORY_KEY) || "[]")
      );
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    loadHistory();
    window.addEventListener("ray-history-updated", loadHistory);
    window.addEventListener("storage", loadHistory);

    return () => {
      window.removeEventListener("ray-history-updated", loadHistory);
      window.removeEventListener("storage", loadHistory);
    };
  }, []);

  function deleteEntry(id) {
    const next = items.filter((item) => item.id !== id);
    localStorage.setItem(RAY_HISTORY_KEY, JSON.stringify(next));
    setItems(next);
  }

  function clearHistory() {
    if (!window.confirm("Clear all RAY history saved in this browser?")) {
      return;
    }

    localStorage.removeItem(RAY_HISTORY_KEY);
    setItems([]);
  }

  return (
    <section className="ray-history-section" id="history">
      <div className="history-heading">
        <div>
          <span className="section-kicker">YOUR LEARNING JOURNEY</span>
          <h2>Pick up where you left off.</h2>
          <p>Your recent documents, questions, and study activities.</p>
        </div>

        {items.length > 0 && (
          <button className="history-clear" onClick={clearHistory}>
            <Trash2 size={15} /> Clear history
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="history-empty">
          <Clock3 size={25} />
          <h3>Your history will appear here</h3>
          <p>
            Open a document or ask RAY a question. Activities saved in this
            browser will be listed here.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {items.map((item) => (
            <article className="history-item" key={item.id}>
              <span className="history-item-icon">
                {item.kind === "question" ? (
                  <MessageCircle size={18} />
                ) : (
                  <BookOpen size={18} />
                )}
              </span>

              <button
                className="history-item-main"
                onClick={() => onOpenEntry?.(item)}
              >
                <strong>{item.title || "Study activity"}</strong>
                <span>{item.detail || "Open saved activity"}</span>
                <time dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString()}
                </time>
              </button>

              <button
                className="history-delete"
                onClick={() => deleteEntry(item.id)}
                aria-label="Delete history item"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
