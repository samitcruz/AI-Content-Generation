import { pipeline } from "../data/project.js";

export default function Pipeline() {
  return (
    <section className="section" aria-labelledby="pipeline-title">
      <h2 id="pipeline-title" className="section__title">
        How it was made
      </h2>
      <p className="section__lead">
        One storyboard file drives every stage. Run <code>npm run film</code> and each stage reads
        the contract, writes its own outputs, and logs every model call to{" "}
        <code>runs.jsonl</code>.
      </p>
      <ol className="pipeline">
        {pipeline.map((step, i) => (
          <li key={step.stage} className="pipeline__step">
            <span className="pipeline__index">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="pipeline__stage">{step.stage}</h3>
            <p className="pipeline__tool">{step.tool}</p>
            <p className="pipeline__detail">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
