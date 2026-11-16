# Variante B — un seul geste

Adresse : `/website/lab/pizza-gesture/`.

L’ancien prototype `/website/lab/pizza-3d/` est conservé, avec sa séquence de trois sorties et trois retours. Cette variante dispose de sa propre entrée HTML, de ses commandes et de sa scène. Aucun fichier de l’ancien prototype n’est modifié pour la créer.

Les modèles (`pizza3d/pizza.ts`, `pizza3d/hand.ts`), la licence de la main et la présentation de base sont partagés ; les deux scènes n’ont jamais de boucle commune ni d’état de lecture partagé. La variante possède son propre `choreography.ts` et ses propres réglages de caméra. Cette séparation permet de comparer les deux idées avant toute intégration au site commercial.

## Déroulement

| Progression | Geste                                                                             |
| ----------- | --------------------------------------------------------------------------------- |
| 0,12 → 0,30 | La main entre dans le cadre.                                                      |
| 0,27 → 0,38 | Les doigts saisissent la croûte.                                                  |
| 0,36 → 0,56 | La part se soulève.                                                               |
| 0,40 → 0,60 | La caméra passe à une vue de trois quarts.                                        |
| 0,62 → 0,74 | La main emporte la part hors du cadre.                                            |
| 0,74 → 0,80 | Courte respiration : personne ne revient au-dessus de l’assiette.                 |
| 0,77        | La part est retirée, entièrement hors champ. Aucun état de bouchée intermédiaire. |
| 0,80 → 0,94 | Retour de la caméra au-dessus de la pizza.                                        |
| 0,84 → 0,94 | Apparition de miettes fixes sur l’assiette.                                       |
| 0,92 → 1    | Le texte apparaît à côté, ou en dessous sur téléphone.                            |

Le trajet de la main reste monotone après la prise : sa progression de sortie ne diminue jamais en avançant. Le scroll arrière restitue volontairement le geste en sens inverse. La géométrie de la part ne change qu’une fois entièrement hors champ, en utilisant sa boîte complète projetée dans la caméra comme repère.

La lecture facultative dure **9 secondes**, mesurées avec `performance.now()` pour ne pas s’allonger lorsque des images sont perdues. La piste mesure 280 svh sur ordinateur et 250 svh sur téléphone ; le défilement reste natif, sans capture du geste tactile. Les commandes arrêtent la lecture au scroll, au toucher, au clavier et quand l’onglet est masqué.

En mouvement réduit, la scène reste statique et les commandes permettent de choisir volontairement une pose. Si WebGL ou le modèle est indisponible, un repli illustré reste accessible. Les ressources, événements et observateurs sont libérés à la sortie de la page.

## Comparer

La nouvelle page contient des liens vers l’ancien prototype et la page Atelier Pizza actuelle. Le site principal ne charge aucune des deux scènes. Les liens de comparaison sont de simples navigations vers des pages séparées : ils ne remplacent ni ne publient une scène dans le parcours commercial.
