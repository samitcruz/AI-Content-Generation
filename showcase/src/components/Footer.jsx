import { links, storyboard } from "../data/project.js";

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer__label">{storyboard.endCard.text}</p>
      <p className="footer__ethics">
        Synthetic voices only. No real likeness, no club crests, no player faces. Made for the 10
        Academy Week 0 Heritage Short challenge.
      </p>
      <nav className="footer__links" aria-label="Project links">
        <a href={links.drive} target="_blank" rel="noreferrer">
          Watch all four cuts (Drive)
        </a>
        <a href={links.repo} target="_blank" rel="noreferrer">
          Source &amp; docs (GitHub)
        </a>
      </nav>
    </footer>
  );
}
