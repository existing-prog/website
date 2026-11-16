# Variante B — un seul geste

Adresse : `/website/lab/pizza-gesture/`.

L’ancien prototype `/website/lab/pizza-3d/` est conservé, avec sa séquence de trois sorties et trois retours. Cette variante dispose de sa propre entrée HTML, de ses commandes et de sa scène. Aucun fichier de l’ancien prototype n’est modifié pour la créer.

La variante possède ses propres modèles (`pizza-gesture/pizza.ts`, `pizza-gesture/hand.ts`), sa chorégraphie et ses réglages de caméra. Seuls le GLB anatomique CC0 et la présentation de base restent partagés ; les deux scènes n’ont jamais de boucle commune ni d’état de lecture partagé. Les améliorations de matière et de géométrie de cette variante ne changent donc pas l’ancien prototype.

## Modèles et matières

La pizza est construite en volumes : pâte, sauce, fromage fondu, croûte, tomates et feuilles de basilic. Les tranches conservent leurs couches sur les faces de découpe. Les ingrédients sont répartis par part pour suivre le morceau soulevé et sont regroupés par matière pour limiter les appels de rendu. Il n’y a plus de photographie plane posée sur la pizza dans cette variante.

La main utilise le squelette du GLB local, sans déformer ses proportions. Une texture de peau CC0 de jartur69, correspondant au modèle MakeHuman, apporte les ongles, les plis et les variations de couleur. Le fichier public ne contient que la région de la main : son origine dans l’atlas 2048 px est `(704, 1536)`, avec une taille de 512 px. Le recalage des UV utilise `repeat(4, 4)` et `offset(-1.375, -3)`, avec `flipY = false` comme pour les matériaux glTF. La carte de couleur reçoit un très léger relief ; ce n’est pas une carte de normales anatomique.

Les sources, la licence CC0 et les transformations du fichier sont documentées dans `public/assets/models/HAND-SKIN-LICENSE.txt`. La main et sa texture sont chargées ensemble ; si l’une des ressources manque, le repli illustré prend le relais. Géométries, textures, matériaux et squelette sont libérés à la sortie de la page.

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
