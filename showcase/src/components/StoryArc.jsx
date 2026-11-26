import { arc, shotById } from "../data/project.js";
import ShotCard from "./ShotCard.jsx";

export default function StoryArc() {
  return (
    <section className="section" aria-labelledby="arc-title">
      <h2 id="arc-title" className="section__title">
        The story, shot by shot
      </h2>
      <p className="section__lead">
        Four movements, one idea per shot. Players are named in the voice only; every picture keeps
        the fan anonymous and the club unbranded.
      </p>

      <nav className="arc-nav" aria-label="Story movements">
        {arc.map((part, i) => (
          <a key={part.id} href={`#${part.id}`} className="arc-nav__item">
            <span className="arc-nav__index">{i + 1}</span>
            {part.label}
          </a>
        ))}
      </nav>

      {arc.map((part) => (
        <div key={part.id} id={part.id} className={`movement movement--${part.id}`}>
          <div className="movement__head">
            <h3 className="movement__label">{part.label}</h3>
            <p className="movement__time">{part.time}</p>
            <p className="movement__summary">{part.summary}</p>
          </div>
          <div className="movement__shots">
            {part.shots.map((id) => {
              const shot = shotById(id);
              return shot ? <ShotCard key={id} shot={shot} /> : null;
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
