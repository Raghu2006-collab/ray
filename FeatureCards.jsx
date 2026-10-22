
import {
  BookOpenText,
  BrainCircuit,
  Languages,
  History,
  FileUp,
  MessageCircle,
  FileText,
  ListChecks,
} from "lucide-react";

const features = [
  {
    icon: BookOpenText,
    number: "01",
    title: "Understand",
    description: "Ask questions about the contents of your selected PDF or PPTX.",
  },
  {
    icon: BrainCircuit,
    number: "02",
    title: "Practice",
    description: "Generate revision notes, flashcards, quizzes and exam questions.",
  },
  {
    icon: Languages,
    number: "03",
    title: "Learn in your language",
    description: "Choose English, Hindi, Marathi or Urdu for explanations.",
  },
  {
    icon: History,
    number: "04",
    title: "Study history",
    description: "Return to recent questions and study activities saved locally.",
  },
  {
    icon: FileUp,
    number: "05",
    title: "Upload documents",
    description: "Choose a new PDF or PowerPoint directly from the chatbot.",
  },
  {
    icon: MessageCircle,
    number: "06",
    title: "Document-aware chat",
    description: "Keep asking follow-up questions about the active document.",
  },
  {
    icon: FileText,
    number: "07",
    title: "Smart summaries",
    description: "Turn lengthy study material into a structured overview.",
  },
  {
    icon: ListChecks,
    number: "08",
    title: "Exam preparation",
    description: "Create practice tests and question papers from your material.",
  },
];

export default function FeatureCards() {
  return (
    <section className="feature-strip" id="library">
      <div className="section-kicker">A BETTER WAY TO STUDY</div>
      <h2 className="features-heading">Everything starts with your material.</h2>

      <div className="feature-grid">
        {features.map(({ icon: Icon, number, title, description }) => (
          <article className="mini-feature" key={number}>
            <div className="mini-feature-top">
              <span>{number}</span>
              <Icon size={20} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
