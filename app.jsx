
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";
import GeminiChatbot from "./components/GeminiChatbot";
import "./index.css";

const ACTIVE_DOCUMENT_KEY = "ray-active-document";

export default function App() {
  const [view, setView] = useState("home");
  const [activeDocument, setActiveDocument] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ACTIVE_DOCUMENT_KEY) || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (activeDocument) {
      localStorage.setItem(
        ACTIVE_DOCUMENT_KEY,
        JSON.stringify(activeDocument)
      );
    } else {
      localStorage.removeItem(ACTIVE_DOCUMENT_KEY);
    }
  }, [activeDocument]);

  function openWorkspace() {
    setView("workspace");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openHome() {
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="ray-app">
      <AnimatePresence mode="wait">
        {view === "home" ? (
          <motion.div
            key="ray-home"
            className="ray-view"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Home onStart={openWorkspace} />
          </motion.div>
        ) : (
          <motion.div
            key="ray-workspace"
            className="ray-view"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Workspace
              onBack={openHome}
              activeDocument={activeDocument}
              onSelectDocument={setActiveDocument}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <GeminiChatbot
        title="RAY"
        subtitle={
          activeDocument
            ? `Studying: ${activeDocument.name}`
            : "Select a PDF or PowerPoint to begin"
        }
        accent="#9b7aff"
        initialTheme="dark"
        activeDocument={activeDocument}
        onSelectDocument={setActiveDocument}
        suggestedPrompts={[
          "Summarize the selected document",
          "Explain the most important concepts",
          "Create exam questions from this document",
          "Explain this material in Hindi",
        ]}
      />
    </main>
  );
}
