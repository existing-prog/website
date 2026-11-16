import { ArrowUpRight } from "lucide-react";
import { asset } from "./data";
import { tr } from "./i18n";
import "./atelier-teaser.scss";
/** Projet personnel complémentaire : son lien ne modifie pas les trois scènes existantes. */
export default function AtelierProjectTeaser() {
  return (
    <a
      className="atelier-project-teaser reveal"
      href="#project/atelier-pizza"
      aria-labelledby="atelier-teaser-title"
    >
      <div className="atelier-teaser-art" aria-hidden="true">
        <img
          src={asset("atelier-pizza-whole.webp")}
          alt=""
          width="1000"
          height="1000"
          loading="lazy"
        />
      </div>
      <div>
        <span className="eyebrow">{tr("PERSONAL PROJECT / WORDPRESS")}</span>
        <h3 id="atelier-teaser-title">
          Atelier Pizza <ArrowUpRight size={25} />
        </h3>
        <p>
          {tr(
            "A restaurant menu the owner can update. Discover the website and its WordPress editing interface.",
          )}
        </p>
        <span className="atelier-teaser-link">{tr("Explore the project")}</span>
      </div>
    </a>
  );
}
