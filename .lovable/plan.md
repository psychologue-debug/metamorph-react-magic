

## Fix : la défausse de fin de tour ne concerne que la main

### Problème
Au moment de la défausse obligatoire de fin de tour (limite : 2 cartes en main max), la modale propose actuellement de défausser indifféremment des cartes de la main **ou** des réactions posées. Cela permet au joueur de défausser une réaction au lieu d'une carte de main, sans réellement réduire sa main sous la limite — ou au contraire de perdre une réaction utile alors que seul le surplus de main est en cause.

Les réactions posées sont déjà plafonnées à 2 par leur propre règle ; elles ne doivent **pas** être affectées par la limite de fin de tour.

### Comportement attendu
- **Défausse de fin de tour** : seules les cartes de la **main** sont comptées et défaussables. Les réactions posées sont totalement exclues de la modale.
- **Défausses forcées par effet** (NEP-10, DIA-10, MIN-01 « Grenouilles »…) : comportement inchangé — le joueur peut toujours piocher dans main ET réactions (cf. règle existante).

### Modifications

**1. `src/components/game/DiscardModal.tsx`**
Ajouter une prop `allowReactions?: boolean` (défaut : `true` pour préserver le comportement des défausses forcées). Quand elle vaut `false`, la modale n'affiche plus du tout la liste des réactions et n'autorise que la sélection dans la main.

**2. `src/pages/Index.tsx`**
- Pour la modale de fin de tour (autour de la ligne 594) : passer `allowReactions={false}` et **ne pas** transmettre la prop `reactions`.
- Pour la modale de défausse forcée (ligne 610) : laisser tel quel (`allowReactions` non passé → comportement actuel conservé).

**3. Vérification logique (`src/hooks/useGameLogic.ts`)**
- `buildEndTurnResolution` (ligne 108) compte déjà uniquement `currentPlayer.hand.length > 2` — rien à changer.
- `handleDiscard` filtre déjà les `cardIds` à partir de `hand` et `reactions` séparément — il continuera de fonctionner correctement même si la modale ne renvoie que des IDs venant de la main.

### Aucune régression attendue
Les défausses forcées par effet conservent leur souplesse (main + réactions). Seul le flux strict de fin de tour est durci pour refléter la règle : « 2 cartes maximum **en main** à la fin du tour ».

