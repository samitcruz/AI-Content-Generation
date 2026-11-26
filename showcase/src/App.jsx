import Hero from "./components/Hero.jsx";
import StoryArc from "./components/StoryArc.jsx";
import Pipeline from "./components/Pipeline.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <main id="main" className="page">
        <Hero />
        <StoryArc />
        <Pipeline />
        <Footer />
      </main>
    </>
  );
}
