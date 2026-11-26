import { media } from "../data/project.js";

export default function ShotCard({ shot }) {
  const number = shot.id.replace("shot_", "");

  return (
    <article className="shot">
      <div className="shot__frame">
        <img
          src={media.keyframe(shot.id)}
          alt={`Keyframe for shot ${number}: ${shot.reason}`}
          loading="lazy"
          width="640"
          height="360"
        />
        <span className="shot__badge">
          {number} · {shot.durationSec}s
        </span>
      </div>
      <div className="shot__body">
        <p className="shot__reason">{shot.reason}</p>
        <p className="shot__camera">{shot.camera}</p>
        <div className="shot__lines">
          <p lang="en">
            <span className="shot__lang">EN</span>
            {shot.narration.en}
          </p>
          <p lang="am">
            <span className="shot__lang">AM</span>
            {shot.narration.am}
          </p>
        </div>
      </div>
    </article>
  );
}
