import { briefText, type Draft, serviceName } from "./data";
import { tr } from "./i18n";

/** Identifiant PUBLIC Formspree, jamais une clé secrète. Sans configuration,
 * le site garde son envoi par messagerie. La boîte destinataire se valide chez
 * Formspree et ne peut pas être activée depuis ce code seul.
 */
const formId = import.meta.env.VITE_FORMSPREE_FORM_ID?.trim();
export const directDeliveryEnabled = Boolean(formId && /^[a-zA-Z0-9]+$/.test(formId));

export async function deliverRequest(draft: Draft, signal: AbortSignal) {
  if (!directDeliveryEnabled) throw new Error("Form delivery is not configured");
  const response = await fetch(`https://formspree.io/f/${formId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: draft.name,
      email: draft.email,
      _subject: tr("Project request — {{service}}", {
        service: serviceName(draft.service),
      }),
      message: briefText(draft),
    }),
    signal,
  });
  // Un HTTP 200 seul ne suffit pas : le prestataire doit accepter la demande.
  const result = await response.json();
  if (!response.ok || result.ok !== true)
    throw new Error("Form service did not accept the request");
}
