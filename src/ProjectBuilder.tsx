import LanguageSwitch from "./LanguageSwitch";
import { useTranslation } from "react-i18next";
import { tr } from "./i18n";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  FolderOpen,
  Layers,
  Mail,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { briefText, budgetGuide, Draft, services, serviceName } from "./data";

/**
 * Formulaire en quatre étapes. Les valeurs internes restent indépendantes de la
 * langue ; seules les étiquettes et les exports passent par les catalogues i18n.
 */
export default function ProjectBuilder({
  initial,
  onClose,
  onSave,
  onDesk,
  notice,
}: {
  initial: Draft;
  onClose: () => void;
  onSave: (d: Draft) => { draft: Draft; persisted: boolean };
  onDesk: () => void;
  notice: string;
}) {
  const { i18n } = useTranslation();
  const [draft, setDraft] = useState<Draft>(initial);
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // Le dialogue natif contient le focus ; restaurer aussi le défilement au démontage.
  useEffect(() => {
    const el = dialog.current;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    el?.showModal();
    return () => {
      document.body.style.overflow = old;
      el?.close();
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
    dialog.current?.querySelector(".builder-content")?.scrollTo(0, 0);
  }, [step]);
  useEffect(() => {
    form.current
      ?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input,textarea")
      .forEach((field) => field.setCustomValidity(""));
  }, [i18n.resolvedLanguage]);
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
    setSaveAttempted(false);
    setCopied("");
  };
  // Validation native, puis contrôle du texte réellement saisi (hors espaces seuls).
  const next = () => {
    if (form.current?.reportValidity()) {
      if (step === 1 && draft.brief.trim().length < 20) {
        const el = form.current.querySelector<HTMLTextAreaElement>("textarea");
        el?.setCustomValidity(
          tr("Please describe your project in at least 20 characters."),
        );
        el?.reportValidity();
        return;
      }
      setStep((s) => Math.min(s + 1, 3));
    }
  };
  // Enregistrer un brouillon ne signifie ni envoyer une demande ni confirmer un achat.
  const save = () => {
    const result = onSave(draft);
    setDraft(result.draft);
    setSaved(result.persisted);
    setSaveAttempted(true);
    setCopied("");
  };
  // Copie de secours sans serveur. L’URL temporaire est libérée après le téléchargement.
  const download = () => {
    const blob = new Blob([briefText(draft)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tr("export.filename");
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(briefText(draft));
      setCopied("Brief copied. Paste it into your email to Lucas.");
    } catch {
      setCopied("Clipboard access is unavailable. Use Download brief to keep a copy.");
    }
  };
  // La messagerie du visiteur s’ouvre ; le site ne prétend jamais que l’e-mail est envoyé.
  const email = `mailto:lucasberdy@gmail.com?subject=${encodeURIComponent(tr("Project request — {{service}}", { service: serviceName(draft.service) }))}&body=${encodeURIComponent(briefText(draft))}`;
  return (
    <dialog
      className="builder-dialog"
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="builder-heading"
    >
      <div className="builder-shell">
        <aside className="builder-sidebar">
          <a className="brand-symbol" href="#top" onClick={onClose}>
            lb<span>.</span>
          </a>
          <span className="eyebrow">{tr("A GOOD PLACE TO BEGIN")}</span>
          <h2>
            {tr("Big ideas.")}
            <br />
            {tr("Small first step.")}
          </h2>
          <p>{tr("A few thoughtful details make a better starting point.")}</p>
          <ol>
            {["Your direction", "The details", "About you", "Review & next step"].map(
              (label, i) => (
                <li
                  className={i === step ? "current" : i < step ? "complete" : ""}
                  key={label}
                >
                  <span>{i < step ? <Check size={14} /> : i + 1}</span>
                  {tr(label)}
                </li>
              ),
            )}
          </ol>
          <div className="builder-promise">
            <ShieldCheck size={20} />
            <span>
              {tr("No payment. No commitment.")}
              <br />
              {tr("Just the start of a conversation.")}
            </span>
          </div>
        </aside>
        <div className="builder-main">
          <div className="builder-topbar">
            <span>
              {tr("PROJECT PLANNER")}{" "}
              <span>
                / 0{step + 1} {tr("OF 04")}
              </span>
            </span>
            <LanguageSwitch />
            <button
              className="icon-button"
              aria-label={tr("Close project planner")}
              onClick={onClose}
            >
              <X size={22} />
            </button>
          </div>
          <div className="builder-progress">
            <span style={{ width: `${(step + 1) * 25}%` }} />
          </div>
          <form
            ref={form}
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
            className="builder-form"
          >
            <div className="builder-content">
              <span className="eyebrow">
                {tr(
                  [
                    "01 / THE STARTING POINT",
                    "02 / YOUR VISION",
                    "03 / NICE TO MEET YOU",
                    "04 / ALL COMING TOGETHER",
                  ][step],
                )}
              </span>
              <h2 tabIndex={-1} ref={heading} id="builder-heading">
                {tr(
                  [
                    "What are we building?",
                    "Tell me a little more.",
                    "Who’s behind the idea?",
                    "Your next chapter, outlined.",
                  ][step],
                )}
              </h2>
              <p className="builder-intro">
                {tr(
                  [
                    "Choose the direction that’s closest to your idea. We can figure out the finer details together.",
                    "A rough idea is plenty. What should your website do, and who is it for?",
                    "So I know who I’m speaking to and where to reply.",
                    "Check your brief, then email it to me to start the conversation. Nothing has been submitted yet.",
                  ][step],
                )}
              </p>
              {step === 0 && (
                <>
                  <fieldset className="service-options">
                    <legend className="sr-only">{tr("Choose a service")}</legend>
                    {services.map((s, i) => (
                      <label
                        key={s.id}
                        className={
                          draft.service === s.id
                            ? "service-option chosen"
                            : "service-option"
                        }
                      >
                        <input
                          type="radio"
                          name="service"
                          value={s.id}
                          checked={draft.service === s.id}
                          onChange={() => update("service", s.id)}
                        />
                        <span className="option-icon">
                          {i === 0 ? <Layers /> : i === 1 ? <Monitor /> : <RefreshCw />}
                        </span>
                        <span>
                          <strong>{tr(s.short)}</strong>
                          <small>{tr(s.tagline)}</small>
                          <small className="option-budget">
                            {tr(s.budget)} <span>{tr("· indicative")}</span>
                          </small>
                        </span>
                        <span className="radio-circle">
                          {draft.service === s.id && <Check size={12} />}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <div className="planner-note">
                    <Sparkles size={18} />
                    <p>
                      {tr(
                        "Budgets are guides, not fixed totals. You receive a written quote with the scope, final price and timing to approve before any work begins.",
                      )}
                    </p>
                  </div>
                </>
              )}
              {step === 1 && (
                <div className="form-fields">
                  <div className="form-row">
                    <label>
                      {draft.service === "care"
                        ? tr("Amount of work")
                        : tr("How many pages?")}
                      <select
                        value={draft.pages}
                        onChange={(e) => update("pages", e.target.value)}
                      >
                        {[
                          "Not sure yet",
                          "One page / small update",
                          "2–5 pages",
                          "6–10 pages",
                          "Larger project",
                        ].map((x) => (
                          <option key={x} value={x}>
                            {tr(x)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {tr("Preferred timeline")}
                      <select
                        value={draft.timeline}
                        onChange={(e) => update("timeline", e.target.value)}
                      >
                        {[
                          "Flexible",
                          "Within a month",
                          "1–3 months",
                          "A specific date — see brief",
                        ].map((x) => (
                          <option key={x} value={x}>
                            {tr(x)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <fieldset className="extra-options">
                    <legend>
                      {tr("Anything else you have in mind?")}{" "}
                      <span>{tr("Optional")}</span>
                    </legend>
                    {[
                      "Subtle animations",
                      "Project or image gallery",
                      "Contact or enquiry form",
                      "Help after launch",
                    ].map((x) => (
                      <label key={x}>
                        <input
                          type="checkbox"
                          checked={draft.extras.includes(x)}
                          onChange={(e) =>
                            update(
                              "extras",
                              e.target.checked
                                ? [...draft.extras, x]
                                : draft.extras.filter((y) => y !== x),
                            )
                          }
                        />
                        <span>{tr(x)}</span>
                      </label>
                    ))}
                  </fieldset>
                  <label>
                    {tr("Your idea")}{" "}
                    <span className="required-note">{tr("Required")}</span>
                    <textarea
                      name="brief"
                      value={draft.brief}
                      onChange={(e) => {
                        e.target.setCustomValidity("");
                        update("brief", e.target.value);
                      }}
                      required
                      minLength={20}
                      maxLength={1800}
                      rows={5}
                      placeholder={tr(
                        "What do you do? What would a great website help you achieve? Any references or must-haves?",
                      )}
                    />
                    <span className="field-hint">
                      {tr("A few sentences is a good start.")} {draft.brief.length}/1800
                    </span>
                  </label>
                  <label>
                    {tr("Existing website")}{" "}
                    <span className="required-note">{tr("Optional")}</span>
                    <input
                      type="url"
                      value={draft.website}
                      onChange={(e) => update("website", e.target.value)}
                      placeholder="https://your-website.com"
                      maxLength={300}
                    />
                  </label>
                </div>
              )}
              {step === 2 && (
                <div className="form-fields">
                  <label>
                    {tr("Your name")}
                    <input
                      autoComplete="name"
                      value={draft.name}
                      onChange={(e) => update("name", e.target.value)}
                      required
                      pattern=".*\S.*"
                      maxLength={100}
                      placeholder={tr("Alex Taylor")}
                    />
                  </label>
                  <label>
                    {tr("Email address")}
                    <input
                      type="email"
                      autoComplete="email"
                      value={draft.email}
                      onChange={(e) => update("email", e.target.value)}
                      required
                      maxLength={200}
                      placeholder="alex@yourbusiness.com"
                    />
                  </label>
                  <label>
                    {tr("Business or project name")}{" "}
                    <span className="required-note">{tr("Optional")}</span>
                    <input
                      autoComplete="organization"
                      value={draft.company}
                      onChange={(e) => update("company", e.target.value)}
                      maxLength={100}
                      placeholder={tr("Your next big thing")}
                    />
                  </label>
                  <div className="planner-note">
                    <ShieldCheck size={20} />
                    <p>
                      {tr(
                        "Your details are included in your project brief. If you save a draft, they stay in this browser until you delete it or clear its storage.",
                      )}
                    </p>
                  </div>
                </div>
              )}
              {step === 3 && (
                <>
                  <div className="review-card">
                    <div className="review-title">
                      <span className="eyebrow">{tr("YOUR PROJECT")}</span>
                      <span className="pill">{tr("Request a quote")}</span>
                    </div>
                    <h3>{draft.company || serviceName(draft.service)}</h3>
                    <dl>
                      <div>
                        <dt>{tr("Service")}</dt>
                        <dd>{serviceName(draft.service)}</dd>
                      </div>
                      <div>
                        <dt>{tr("Pages / scope")}</dt>
                        <dd>{tr(draft.pages)}</dd>
                      </div>
                      <div>
                        <dt>{tr("Preferred timeline")}</dt>
                        <dd>{tr(draft.timeline)}</dd>
                      </div>
                      <div>
                        <dt>{tr("Interested in")}</dt>
                        <dd>
                          {draft.extras.map((x) => tr(x)).join(", ") ||
                            tr("Core service")}
                        </dd>
                      </div>
                      <div>
                        <dt>{tr("Contact")}</dt>
                        <dd>
                          {draft.name} · {draft.email}
                        </dd>
                      </div>
                      {draft.website && (
                        <div>
                          <dt>{tr("Existing website")}</dt>
                          <dd>{draft.website}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="review-brief">
                      <span>{tr("Your idea")}</span>
                      <p>{draft.brief}</p>
                    </div>
                    <div className="review-budget">
                      <span>{tr("Indicative service guide")}</span>
                      <strong>{budgetGuide(draft.service)}</strong>
                      <p>
                        {tr(
                          services.find((s) => s.id === draft.service)?.budgetScope || "",
                        )}
                        {tr(
                          ". Your selected scope and options may change the price. The written quote confirms the full total, any taxes and external costs.",
                        )}
                      </p>
                    </div>
                    <div className="review-quote">
                      <span>{tr("Final project total")}</span>
                      <strong>{tr("Written quote to approve")}</strong>
                    </div>
                  </div>
                  <div className="review-actions">
                    <button type="button" onClick={copy}>
                      <Copy size={15} /> {tr("Copy brief")}
                    </button>
                    <button type="button" onClick={download}>
                      <Download size={15} /> {tr("Download brief")}
                    </button>
                  </div>
                  <p className="email-note">
                    {tr(
                      "Email opens your email app with the brief filled in. You’ll still need to press Send. No payment or booking is made here.",
                    )}
                  </p>
                  <p className="action-status" role="status">
                    {tr(copied || (saveAttempted ? notice : ""))}
                  </p>
                </>
              )}
            </div>
            <div className="builder-bottom">
              <div>
                {step > 0 ? (
                  <button
                    type="button"
                    className="back-button"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ChevronLeft size={16} /> {tr("Back")}
                  </button>
                ) : (
                  <span className="step-counter">{tr("Let’s make a start.")}</span>
                )}
              </div>
              {step < 3 ? (
                <button className="button primary" type="submit">
                  {tr("Continue")} <ChevronRight size={17} />
                </button>
              ) : (
                <div className="final-actions">
                  <button className="save-button" type="button" onClick={save}>
                    {saved ? <Check size={16} /> : <FolderOpen size={16} />}{" "}
                    {saved ? tr("Saved on this device") : tr("Save draft on this device")}
                  </button>
                  <a className="button primary" href={email}>
                    <Mail size={17} /> {tr("Email project request")}
                  </a>
                </div>
              )}
            </div>
            {saved && step === 3 && (
              <div className="saved-footer">
                <button type="button" onClick={onDesk}>
                  {tr("Go to my project desk")} <ArrowRight size={14} />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </dialog>
  );
}
