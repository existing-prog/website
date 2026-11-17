import { asset } from "./data";
import "./hero-project-backdrop.scss";

type ProjectId = "samantha" | "atelier-pizza" | "kasa" | "nina";

/** Quatre décors décoratifs persistants : les opacités se croisent sans démonter
 * la carte ni réinitialiser son mouvement. Aucune information n’est ajoutée au
 * lecteur d’écran ; le lien et le nom du projet restent portés par le vrai aperçu.
 */
export default function HeroProjectBackdrop({ projectId }: { projectId: string }) {
  const active = (id: ProjectId) => projectId === id;
  return (
    <div className="hero-project-backdrop" aria-hidden="true" data-project={projectId}>
      <div className="hero-scene backdrop-samantha" data-active={active("samantha")}>
        <div className="glass-halo">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div
        className="hero-scene backdrop-atelier-pizza"
        data-active={active("atelier-pizza")}
      >
        <div className="project-aura" />
        <img className="backdrop-pizza" src={asset("atelier-pizza-whole.webp")} alt="" />
        <img
          className="backdrop-basil basil-a"
          src={asset("pizza-burst/basil.webp")}
          alt=""
        />
        <img
          className="backdrop-basil basil-b"
          src={asset("pizza-burst/basil.webp")}
          alt=""
        />
      </div>
      <div className="hero-scene backdrop-kasa" data-active={active("kasa")}>
        <div className="project-aura" />
        <div className="interface-frames">
          <div className="interface-frame frame-back">
            <i />
            <i />
            <i />
          </div>
          <div className="interface-frame frame-front">
            <i />
            <i />
            <i />
          </div>
          <div className="interface-phone">
            <i />
          </div>
        </div>
      </div>
      <div className="hero-scene backdrop-nina" data-active={active("nina")}>
        <div className="project-aura" />
        <div className="photo-viewfinder">
          <span className="corner corner-tl" />
          <span className="corner corner-tr" />
          <span className="corner corner-bl" />
          <span className="corner corner-br" />
          <span className="photo-registration" />
        </div>
      </div>
    </div>
  );
}
