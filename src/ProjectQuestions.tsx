import { ArrowUpRight, Plus } from "lucide-react";
import { tr } from "./i18n";
import "./project-questions.scss";

const questions = [
  {
    question: "How long will my project take?",
    answer:
      "The timeline depends on the pages, features and content available. After our first exchange, your quote sets out the planned stages and dates. If the scope changes, we agree on the impact before continuing.",
  },
  {
    question: "What should I prepare before we start?",
    answer:
      "Bring your goals, a few examples you like, and any existing logo, text or photographs. You don’t need a finished brief to contact me. We’ll identify missing content together and clarify who provides it in the quote.",
  },
  {
    question: "Can you help with hosting and a domain name?",
    answer:
      "Yes, I can help you choose an option suited to your website and plan its launch. Domain, hosting and any third-party subscriptions are listed separately in the quote. Accounts should be registered in your name so you retain control.",
  },
  {
    question: "How are revisions handled?",
    answer:
      "The quote defines the deliverables and review stages. You can share feedback at those stages; requests outside the agreed scope are discussed and quoted before they are added.",
  },
  {
    question: "What happens after the website goes live?",
    answer:
      "We check the agreed deliverables together before launch and plan the handover of the code, accounts and access covered by the quote. Ongoing updates or maintenance can be arranged separately, with an agreed scope and price.",
  },
  {
    question: "Can you improve a website I already have?",
    answer:
      "Yes. I can review frontend issues such as responsive layouts, accessibility, content and loading performance. I’ll first check your existing setup and access, then propose a suitable scope. Backend development and complex integrations need a separate assessment.",
  },
  {
    question: "Can we work together remotely, in French or English?",
    answer:
      "Yes. I’m based in France and work remotely in French and English. We agree on the communication channels and feedback stages at the start, so you know how to follow the project.",
  },
  {
    question: "Does sending a brief commit me to anything?",
    answer:
      "No. It starts a conversation about your needs. Scope, price and timing must be agreed in a written quote before work begins. The website does not take payments or confirm a booking.",
  },
];

/** Accordéons HTML natifs : lecture et clavier sans dépendance JavaScript.
 * Les réponses décrivent le cadre du devis, sans inventer des engagements commerciaux.
 */
export default function ProjectQuestions({ onStart }: { onStart: () => void }) {
  return (
    <section
      className="project-questions section shell"
      id="questions"
      aria-labelledby="questions-title"
    >
      <div className="questions-intro reveal">
        <p className="eyebrow">{tr("BEFORE WE GET STARTED")}</p>
        <h2 id="questions-title">{tr("A few things you might be wondering.")}</h2>
        <p>
          {tr(
            "Your first website, or your next one. Here’s how we can make the project clear from the start.",
          )}
        </p>
        <button className="understated-link" onClick={onStart}>
          {tr("Tell me about your project")} <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="questions-list">
        {questions.map(({ question, answer }, index) => (
          <details className="project-question reveal" key={question}>
            <summary>
              <span className="question-number" aria-hidden="true">
                0{index + 1}
              </span>
              <span>{tr(question)}</span>
              <Plus size={18} aria-hidden="true" />
            </summary>
            <p>{tr(answer)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
