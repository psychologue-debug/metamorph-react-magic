## Objectif

Refondre le rendu des plateaux pour les rendre vraiment responsive, faciliter le repositionnement précis des mortels, dessiner proprement les liens, et ajouter des toggles d'aide visuelle (priorités, liens, halos).

---

## 1. Taille des mortels — responsive intelligent

**Problème** : `tokenSize` est en pixels fixes (140px plateau actif, 50/64px pour les ennemis), ce qui cause débordements et chevauchements quand la cellule est petite.

**Solution** : passer à un sizing **relatif au conteneur**, indépendant du viewport et du nombre d'ennemis.

- Mesurer la largeur réelle du conteneur (`ResizeObserver` dans `GodLayout.tsx`).
- Calculer `tokenSize = clamp(minSize, containerWidth × ratio, maxSize)` avec un ratio fixe (~14% de la largeur du plateau, donnant ~140px sur un plateau de 1000px et ~28px sur un plateau de 200px).
- Supprimer la prop `tokenSize` côté appelants : la taille devient auto-dérivée du conteneur.
- Le `padding` autour du plateau passe lui aussi en pourcentage (3% du min(w,h)) pour rester proportionnel.
- `BoardToken` reçoit la taille en px calculée mais toutes ses bordures/halos/icônes s'expriment en `em` ou en fractions de `size` pour rester nettes à toute échelle.

**Avantage** : un seul code path, fonctionne sur tablette, petit écran ou grand écran, et la grille adverse (1/2/3-4/5-6) n'a plus besoin du flag `compact`.

---

## 2. Position des mortels — workflow x%/y%

C'est **déjà** ce qui est fait : chaque layout (`CeresLayout`, `BacchusLayout`, etc.) contient un `POSITIONS: Record<code, {x, y}>` en pourcentage du plateau, et `GodLayout` les place via `left: x%, top: y%, transform: translate(-50%, -50%)`.

→ Tu peux me donner pour chaque divinité une liste type `Mydas: x=11, y=97` et je l'applique directement dans le fichier `XxxLayout.tsx` correspondant. Aucune refonte nécessaire pour ça : les coordonnées sont **exactement** les centres des jetons.

Note : avec le sizing responsive du point 1, un mortel à `y=97%` sera entièrement visible (le padding et le clamp évitent le débordement).

---

## 3. Liens entre mortels — design programmatique

Ils sont **déjà** dessinés en SVG dans `GodLayout` à partir d'un tableau `CONNECTIONS: { from, to, color }[]`. Aucun besoin d'images.

Capacités actuelles :
- ligne droite entre deux mortels, couleur libre (HSL), épaisseur, opacité, linecap.

Capacités que je peux ajouter facilement si tu le décris en texte :
- courbes (Bézier quadratique avec point de contrôle, pour éviter qu'un trait passe sur un 3e mortel) ;
- traits pointillés (`strokeDasharray`) ;
- têtes de flèche (`marker-end`) pour indiquer un sens ;
- traits multiples / parallèles ;
- glow (filtre SVG) pour faire briller une chaîne ;
- libellés sur le trait (numéro/symbole).

→ Donne-moi simplement, par divinité : `de A vers B, couleur X, droite/courbée vers le haut/bas, plein/pointillé, flèche oui/non`. Aucune image nécessaire.

---

## 4. Toggles d'aide visuelle

Ajout de **3 toggles indépendants** dans la barre supérieure (à côté de "Chroniques"), chacun avec un état persisté dans `localStorage` :

| Toggle | Effet |
|---|---|
| **Priorités** | Affiche un badge `I` / `II` / `III` en surimpression des mortels (tableau de priorités à fournir par dieu). |
| **Liens** | Affiche/masque le SVG des `CONNECTIONS` dans tous les `GodLayout`. |
| **Halos** | Affiche/masque les anneaux colorés (violet/jaune/vert) des mortels métamorphosés. |

### Détail technique

- Nouveau hook `useDisplayPreferences` (Context React) exposant `{ showPriorities, showLinks, showHalos, toggle(key) }`. Stockage `localStorage`.
- Provider monté dans `App.tsx`.
- 3 boutons toggle (icônes lucide : `ListOrdered`, `GitBranch`, `Sparkles`) dans le bandeau supérieur de `Index.tsx`, état visuel actif/inactif.
- `GodLayout.tsx` lit `showLinks` → conditionne le rendu du `<svg>` des liens.
- `BoardToken.tsx` lit `showHalos` → si false, n'applique pas le `boxShadow` du halo (l'anneau de base ring-2 reste).
- Nouveau fichier `src/data/mortalPriorities.ts` exportant `PRIORITIES: Partial<Record<MortalCode, 1 | 2 | 3>>` (vide au départ, à remplir par toi). `BoardToken` lit cette table et superpose un petit badge en chiffre romain en haut-gauche du jeton si `showPriorities` est ON et que le mortel **n'est pas encore métamorphosé**.

---

## Fichiers impactés

- `src/components/game/GodLayout.tsx` — sizing responsive (ResizeObserver), conditionnel sur `showLinks`.
- `src/components/game/BoardToken.tsx` — sizing relatif aux em, conditionnel sur `showHalos`, badge priorité.
- `src/components/game/PlayerPanel.tsx` — retire `tokenSize` / `compact` (devient auto).
- `src/components/game/GameBoard.tsx` — retire la logique `compact`.
- `src/components/game/OwnPlayerBoard.tsx` — retire `tokenSize`.
- `src/hooks/useDisplayPreferences.tsx` — nouveau (Context + localStorage).
- `src/App.tsx` — wrap le Provider.
- `src/pages/Index.tsx` — 3 boutons toggle dans le top bar.
- `src/data/mortalPriorities.ts` — nouveau, table à compléter.

---

## Ce dont j'aurai besoin de toi (après implémentation)

1. Les **coordonnées** révisées par dieu (format : `CODE x% y%`).
2. La **liste des priorités** I/II/III par dieu.
3. La **liste des liens** par dieu (paires + couleur + droite/courbe + style).

Tu pourras me les envoyer en plusieurs messages, je les intégrerai au fur et à mesure.
