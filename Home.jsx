
import Header from "../components/Header";
import FeatureCards from "../components/FeatureCards";
import StudyHistory from "../components/StudyHistory";

export default function Home({ onStart }) {
  return (
    <div className="home-page">
      <Header onStart={onStart} />
      <FeatureCards />
      <StudyHistory onOpenEntry={onStart} />

      <footer className="ray-footer">
        <span>RAY © 2026</span>
        <span>Make learning feel a little more human.</span>
      </footer>
    </div>
  );
}
