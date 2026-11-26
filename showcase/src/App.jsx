import { useEffect, useState } from "react";
import storyboard from "../../storyboard.json";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <main>
      <h1 className="brand">{storyboard.title}</h1>
      <p className="tag">{storyboard.logline}</p>
      <div className="meta">
        <div>
          <strong>Audience</strong> — {storyboard.audience}
        </div>
        <div>
          <strong>Intent</strong> — {storyboard.intent}
        </div>
        <div>
          <strong>Target</strong> — {storyboard.durationTargetSec}s · {storyboard.shots.length} shots
        </div>
      </div>

      {storyboard.shots.map((shot) => (
        <article className="shot" key={shot.id}>
          <h2>
            {shot.id.replace("_", " ").toUpperCase()} · {shot.durationSec}s · {shot.camera}
          </h2>
          <p className="reason">{shot.reason}</p>
          <div className="grid">
            <div className="lang">
              <span>English</span>
              <p>{shot.narration.en}</p>
            </div>
            <div className="lang">
              <span>Amharic</span>
              <p>{shot.narration.am}</p>
            </div>
          </div>
        </article>
      ))}

      <p className="note">
        This showcase only displays the storyboard contract. Generation runs via{" "}
        <code>npm run film</code> in the Node pipeline. Exports: Amharic+EN subs and English+AM
        subs, both 9:16 and 16:9. End card: {storyboard.endCard.text}.
      </p>
    </main>
  );
}
