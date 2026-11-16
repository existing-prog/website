# Variante B — un seul geste

Adresse : `/website/lab/pizza-gesture/`.

L’ancien prototype `/website/lab/pizza-3d/` est conservé, avec sa séquence de trois sorties et trois retours. Cette variante dispose de sa propre entrée HTML, de ses commandes et de sa scène. Aucun fichier de l’ancien prototype n’est modifié pour la créer.

La variante possède ses propres modèles (`pizza-gesture/pizza.ts`, `pizza-gesture/hand.ts`), sa chorégraphie et ses réglages de caméra. Seuls le GLB anatomique CC0 et la présentation de base restent partagés ; les deux scènes n’ont jamais de boucle commune ni d’état de lecture partagé. Les améliorations de matière et de géométrie de cette variante ne changent donc pas l’ancien prototype.

## Modèles et matières

La pizza est construite en volumes : pâte, sauce, fromage fondu, croûte, tomates et feuilles de basilic. Les tranches conservent leurs couches sur les faces de découpe. Les ingrédients sont répartis par part pour suivre le morceau soulevé et sont regroupés par matière pour limiter les appels de rendu. Il n’y a plus de photographie plane posée sur la pizza dans cette variante.

La main utilise le squelette CC0 du GLB local, avec des doigts épaissis de 16 % autour des axes de repos, pondérés par les influences du squelette. La longueur des doigts est conservée. Une matière unie mate remplace la texture photographique de peau pour un rendu de personnage. La provenance du GLB reste documentée dans `public/assets/models/ANATOMICAL-HAND-LICENSE.txt`. L’ancien atlas de peau reste archivé mais n’est plus téléchargé par cette variante.

La pointe de la part fléchit légèrement lors de la levée, avec une petite détente avant stabilisation. Les positions de repos sont conservées pour que le scroll inverse restitue la géométrie sans accumulation. Les ingrédients suivent la même déformation et la croûte reste rigide dans la prise. Les bornes de sortie incluent la flexion maximale. Aucun moteur de physique ni animation permanente n’est nécessaire.

Si le modèle manque, le repli illustré prend le relais. Géométries, textures procédurales, matériaux et squelette sont libérés à la sortie de la page.

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

Le trajet de la main reste monotone après la prise : sa progression de sortie ne diminue jamais en avançant. Le scroll arrière restitue volontairement le geste en sens inverse. La part ne disparaît qu’une fois entièrement hors champ, en utilisant sa boîte complète projetée dans la caméra comme repère.

La lecture facultative dure **9 secondes**, mesurées avec `performance.now()` pour ne pas s’allonger lorsque des images sont perdues. La piste mesure 280 svh sur ordinateur et 250 svh sur téléphone ; le défilement reste natif, sans capture du geste tactile. Les commandes arrêtent la lecture au scroll, au toucher, au clavier et quand l’onglet est masqué.

En mouvement réduit, la scène reste statique et les commandes permettent de choisir volontairement une pose. Si WebGL ou le modèle est indisponible, un repli illustré reste accessible. Les ressources, événements et observateurs sont libérés à la sortie de la page.

## Comparer

La nouvelle page contient des liens vers l’ancien prototype et la page Atelier Pizza actuelle. Le site principal ne charge aucune des deux scènes. Les liens de comparaison sont de simples navigations vers des pages séparées : ils ne remplacent ni ne publient une scène dans le parcours commercial.
