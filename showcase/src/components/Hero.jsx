import { media, storyboard } from "../data/project.js";

export default function Hero() {
  const totalSec = storyboard.shots.reduce((sum, s) => sum + s.durationSec, 0);

  return (
    <header className="hero">
      <div className="hero__copy">
        <p className="eyebrow">A Heritage Short · Amharic &amp; English</p>
        <h1 className="hero__title">{storyboard.title}</h1>
        <p className="hero__logline">{storyboard.logline}</p>
        <ul className="hero__facts" aria-label="Film facts">
          <li>{storyboard.shots.length} shots</li>
          <li>~{totalSec}s</li>
          <li>9:16 &amp; 16:9</li>
        </ul>
      </div>

      <figure className="hero__film">
        <video
          className="hero__video"
          src={media.film}
          poster={media.poster}
          controls
          playsInline
          preload="metadata"
        >
          Your browser does not support embedded video.
        </video>
        <figcaption>
          English narration with Amharic subtitles burned in. The primary graded cut is the
          Amharic 9:16 version.
        </figcaption>
      </figure>

      <blockquote className="hero__intent">
        <span className="hero__intent-label">Intent</span>
        {storyboard.intent}
      </blockquote>
    </header>
  );
}
