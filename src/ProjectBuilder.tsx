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
import { briefText, Draft, services, serviceName } from "./data";

export default function ProjectBuilder({
  initial,
  onClose,
  onSave,
  onDesk,
  notice,
}: {
  initial: Draft;
  onClose: () => void;
  onSave: (d: Draft) => Draft;
  onDesk: () => void;
  notice: string;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState("");
  const [saved, setSaved] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
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
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };
  const next = () => {
    if (form.current?.reportValidity()) {
      if (step === 1 && draft.brief.trim().length < 20) {
        const el = form.current.querySelector<HTMLTextAreaElement>("textarea");
        el?.setCustomValidity(
          "Please describe your project in at least 20 characters.",
        );
        el?.reportValidity();
        return;
      }
      setStep((s) => Math.min(s + 1, 3));
    }
  };
  const save = () => {
    const d = onSave(draft);
    setDraft(d);
    setSaved(true);
  };
  const download = () => {
    const blob = new Blob([briefText(draft)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lucas-berdy-project-brief.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(briefText(draft));
      setCopied("Brief copied. Paste it into your email to Lucas.");
    } catch {
      setCopied(
        "Clipboard access is unavailable. Use Download brief to keep a copy.",
      );
    }
  };
  const email = `mailto:lucasberdy@gmail.com?subject=${encodeURIComponent(`Project request — ${serviceName(draft.service)}`)}&body=${encodeURIComponent(briefText(draft))}`;
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
          <span className="eyebrow">A GOOD PLACE TO BEGIN</span>
          <h2>
            Big ideas.
            <br />
            Small first step.
          </h2>
          <p>A few thoughtful details make a better starting point.</p>
          <ol>
            {[
              "Your direction",
              "The details",
              "About you",
              "Review & next step",
            ].map((label, i) => (
              <li
                className={i === step ? "current" : i < step ? "complete" : ""}
                key={label}
              >
                <span>{i < step ? <Check size={14} /> : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="builder-promise">
            <ShieldCheck size={20} />
            <span>
              No payment. No commitment.
              <br />
              Just the start of a conversation.
            </span>
          </div>
        </aside>
        <div className="builder-main">
          <div className="builder-topbar">
            <span>
              PROJECT PLANNER <span>/ 0{step + 1} OF 04</span>
            </span>
            <button
              className="icon-button"
              aria-label="Close project planner"
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
                {
                  [
                    "01 / THE STARTING POINT",
                    "02 / YOUR VISION",
                    "03 / NICE TO MEET YOU",
                    "04 / ALL COMING TOGETHER",
                  ][step]
                }
              </span>
              <h2 tabIndex={-1} ref={heading} id="builder-heading">
                {
                  [
                    "What are we building?",
                    "Tell me a little more.",
                    "Who’s behind the idea?",
                    "Your next chapter, outlined.",
                  ][step]
                }
              </h2>
              <p className="builder-intro">
                {
                  [
                    "Choose the direction that’s closest to your idea. We can figure out the finer details together.",
                    "A rough idea is plenty. What should your website do, and who is it for?",
                    "So I know who I’m speaking to and where to reply.",
                    "Check your brief, then email it to me to start the conversation. Nothing has been submitted yet.",
                  ][step]
                }
              </p>
              {step === 0 && (
                <>
                  <fieldset className="service-options">
                    <legend className="sr-only">Choose a service</legend>
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
                          {i === 0 ? (
                            <Layers />
                          ) : i === 1 ? (
                            <Monitor />
                          ) : (
                            <RefreshCw />
                          )}
                        </span>
                        <span>
                          <strong>{s.short}</strong>
                          <small>{s.tagline}</small>
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
                      Each project gets a tailored quote. Scope, price and
                      timing are agreed together before the work begins.
                    </p>
                  </div>
                </>
              )}
              {step === 1 && (
                <div className="form-fields">
                  <div className="form-row">
                    <label>
                      {draft.service === "care"
                        ? "Amount of work"
                        : "How many pages?"}
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
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Preferred timeline
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
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <fieldset className="extra-options">
                    <legend>
                      Anything else you have in mind? <span>Optional</span>
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
                        <span>{x}</span>
                      </label>
                    ))}
                  </fieldset>
                  <label>
                    Your idea <span className="required-note">Required</span>
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
                      placeholder="What do you do? What would a great website help you achieve? Any references or must-haves?"
                    />
                    <span className="field-hint">
                      A few sentences is a good start. {draft.brief.length}/1800
                    </span>
                  </label>
                  <label>
                    Existing website{" "}
                    <span className="required-note">Optional</span>
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
                    Your name
                    <input
                      autoComplete="name"
                      value={draft.name}
                      onChange={(e) => update("name", e.target.value)}
                      required
                      pattern=".*\S.*"
                      maxLength={100}
                      placeholder="Alex Taylor"
                    />
                  </label>
                  <label>
                    Email address
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
                    Business or project name{" "}
                    <span className="required-note">Optional</span>
                    <input
                      autoComplete="organization"
                      value={draft.company}
                      onChange={(e) => update("company", e.target.value)}
                      maxLength={100}
                      placeholder="Your next big thing"
                    />
                  </label>
                  <div className="planner-note">
                    <ShieldCheck size={20} />
                    <p>
                      Your details are included in your project brief. If you
                      save a draft, they stay in this browser until you delete
                      it or clear its storage.
                    </p>
                  </div>
                </div>
              )}
              {step === 3 && (
                <>
                  <div className="review-card">
                    <div className="review-title">
                      <span className="eyebrow">YOUR PROJECT</span>
                      <span className="pill">Request a quote</span>
                    </div>
                    <h3>{draft.company || serviceName(draft.service)}</h3>
                    <dl>
                      <div>
                        <dt>Service</dt>
                        <dd>{serviceName(draft.service)}</dd>
                      </div>
                      <div>
                        <dt>Pages / scope</dt>
                        <dd>{draft.pages}</dd>
                      </div>
                      <div>
                        <dt>Preferred timeline</dt>
                        <dd>{draft.timeline}</dd>
                      </div>
                      <div>
                        <dt>Interested in</dt>
                        <dd>{draft.extras.join(", ") || "Core service"}</dd>
                      </div>
                      <div>
                        <dt>Contact</dt>
                        <dd>
                          {draft.name} · {draft.email}
                        </dd>
                      </div>
                      {draft.website && (
                        <div>
                          <dt>Existing website</dt>
                          <dd>{draft.website}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="review-brief">
                      <span>Your idea</span>
                      <p>{draft.brief}</p>
                    </div>
                    <div className="review-quote">
                      <span>Project investment</span>
                      <strong>Quoted after review</strong>
                    </div>
                  </div>
                  <div className="review-actions">
                    <button type="button" onClick={copy}>
                      <Copy size={15} /> Copy brief
                    </button>
                    <button type="button" onClick={download}>
                      <Download size={15} /> Download brief
                    </button>
                  </div>
                  <p className="email-note">
                    Email opens your email app with the brief filled in. You’ll
                    still need to press Send. No payment or booking is made
                    here.
                  </p>
                  <p className="action-status" role="status">
                    {copied || (saved ? notice : "")}
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
                    <ChevronLeft size={16} /> Back
                  </button>
                ) : (
                  <span className="step-counter">Let’s make a start.</span>
                )}
              </div>
              {step < 3 ? (
                <button className="button lime" type="submit">
                  Continue <ChevronRight size={17} />
                </button>
              ) : (
                <div className="final-actions">
                  <button className="save-button" type="button" onClick={save}>
                    {saved ? <Check size={16} /> : <FolderOpen size={16} />}{" "}
                    {saved
                      ? "Saved on this device"
                      : "Save draft on this device"}
                  </button>
                  <a className="button lime" href={email}>
                    <Mail size={17} /> Email project request
                  </a>
                </div>
              )}
            </div>
            {saved && step === 3 && (
              <div className="saved-footer">
                <button type="button" onClick={onDesk}>
                  Go to my project desk <ArrowRight size={14} />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </dialog>
  );
}
