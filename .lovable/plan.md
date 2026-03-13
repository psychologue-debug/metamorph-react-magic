# Systeme de Reactions Hors-Tour

## Resumé

Implementation du systeme complet de reactions : fenetre d'intervention pour tous les joueurs apres chaque action declenchante, avec timer de 10 secondes, validation des conditions, et resolution Option B (tous resolvent independamment).

Modifications supplementaires :

- Split Compassion en Compassion (reaction, 5 ex., cout 8) + Eveil (sortilege, 4 ex., cout 8)
- Resistance : cout 10 a 9, rembourse le cout de metamorphose au dieu cible
- Sursis : auto-metamorphose imparable

---

## Etape 1 : Modifier les cartes dans spellCards.ts

- **Compassion** : garder comme reaction (5 exemplaires, cout 8), effet = "Protegez votre mortel : l'effet ennemi est annule (couts restent payes)"
- **Ajouter Eveil** : nouveau sortilege (4 exemplaires, cout 8), cible = "un mortel propre incapacite", effet = "Levez l'incapacite d'un de vos mortels"
- **Resistance** : cout passe de 10 a 9, effet modifie pour preciser que le cout de metamorphose est rembourse au dieu
- Pas besoin de renvoyer le CSV, les donnees sont dans le code

## Etape 2 : Ajouter le sortilege Eveil dans useGameLogic.ts

- Dans `handleCardClick`, ajouter le cas `Eveil` : meme logique que Doute mais cible un mortel propre incapacite pour lever l'incapacite
- Validation pre-cout : verifier qu'il existe au moins un mortel propre incapacite

## Etape 3 : Types et etat pour le systeme de reaction

Dans `types/game.ts` :

- Ajouter `reactionQueue` dans `GameState` : file d'attente des joueurs devant repondre
- Ajouter `reactionTrigger` : l'evenement declencheur (metamorphose, sort, etc.)
- Ajouter `reactionResponses` : les reponses collectees

Nouveau type `ReactionTrigger` :

```text
{
  type: 'metamorphose' | 'spell_effect' | 'mortal_effect'
  sourcePlayerId: string
  targetPlayerId?: string
  targetMortalId?: string
  cardName?: string
  metamorphoseCost?: number  // pour le remboursement Resistance
}
```

## Etape 4 : Moteur de reaction (nouveau fichier src/engine/reactionEngine.ts)

Fonctions principales :

- `getEligibleReactors(trigger, gameState)` : retourne la liste des joueurs ayant des reactions posees (hors joueur actif si applicable)
- `canActivateReaction(card, trigger, player, gameState)` : verifie les conditions d'activation specifiques :
  - **Parade** : un mortel vient d'etre metamorphose ET a un effet de metamorphose
  - **Resistance** : un dieu ennemi vient de metamorphoser un de ses mortels
  - **Compassion** : un mortel propre est cible par un effet ennemi
  - **Sursis** : un dieu ennemi vient de metamorphoser son DERNIER mortel non-metamorphose, meme si les reactions sont bloquees (Regle)
- `resolveReaction(card, trigger, gameState)` : applique l'effet de la reaction

Logique de resolution par carte :

- **Parade** : l'effet de metamorphose est annule (le mortal reste metamorphose mais son `effectOnMetamorphose` ne s'applique pas)
- **Resistance** : le mortel revient a non-metamorphose, le cout est rembourse au proprietaire, la carte Resistance est defaussee et son cout (9) est paye par le reacteur
- **Compassion** : l'effet ennemi ciblant le mortel est annule (couts restent payes)
- **Sursis** : le mortel revient a non-metamorphose, cout rembourse, un flag `sursisTarget` est pose sur le mortel pour auto-metamorphose au prochain cycle

## Etape 5 : Fenetre de reaction dans useGameLogic.ts

Nouveau flux apres chaque action declenchante :

1. Apres metamorphose, sort ciblant, ou effet de mortel : creer un `ReactionTrigger`
2. Appeler `getEligibleReactors()` — si aucun reacteur, continuer normalement
3. Si reacteurs : suspendre le flux, poser `reactionWindowState` avec :
  - Liste des joueurs devant repondre
  - Timer de 10 secondes
  - Trigger sauvegarde
4. Chaque joueur repond Oui/Non :
  - **Non** ou timeout : retire de la queue
  - **Oui** : affiche ses reactions posees, il clique sur une
    - Validation des conditions → si invalide, toast d'info, il peut choisir une autre ou passer
    - Si valide, payer le cout, defausser la reaction, appliquer l'effet
5. Option B : tous les joueurs resolvent independamment. Si deux jouent Resistance sur la meme metamorphose, les deux payent, le mortel est retrometamorphose une seule fois, le cout est rembourse une seule fois
6. Une fois tous les joueurs resolus : reprendre le flux normal (appliquer l'effet de metamorphose si non bloque par Parade, etc.)

## Etape 6 : Composant UI ReactionWindow (nouveau fichier src/components/game/ReactionWindow.tsx)

Interface en bas de l'ecran ou en overlay pour le joueur dont c'est le tour de reagir :

```text
+--------------------------------------------------+
| [Avatar] Diane — Voulez-vous activer une reaction?|
|                                                    |
|   [OUI]     [NON]        Timer: 8s               |
+--------------------------------------------------+
```

Si "Oui" :

```text
+--------------------------------------------------+
| Choisissez une reaction :                         |
|                                                    |
|  [Resistance (9 Ether)]  [Compassion (8 Ether)]  |
|                                                    |
|   [Annuler]                                       |
+--------------------------------------------------+
```

En hot-seat (un seul ecran) : afficher un ecran de transition "C'est au tour de [Joueur] de reagir — Cliquez quand pret" pour eviter que le joueur actif voie les reactions.

## Etape 7 : Integration dans le flux de metamorphose

Modifier `handleMortalClick` :

1. Apres la metamorphose reussie, AVANT d'appliquer l'effet de metamorphose :
  - Creer le trigger
  - Verifier les reacteurs eligibles
  - Si reacteurs : sauvegarder l'effet de metamorphose en attente, ouvrir la fenetre de reaction
  - Apres resolution des reactions : si Parade jouee, ne pas appliquer l'effet ; si Resistance jouee, annuler la metamorphose et rembourser
2. Meme logique pour les sorts ciblants (Torpeur, Pharmaka, etc.) et les effets de mortels

## Etape 8 : Sursis — auto-metamorphose

- Ajouter un champ `sursisTarget: boolean` sur `Mortal` dans `types/game.ts`
- Au debut de chaque cycle (dans `handleEndTurn` quand `isNewCycle`), chercher les mortels avec `sursisTarget === true` :
  - Les metamorphoser automatiquement sans cout
  - Retirer le flag
  - Pas de fenetre de reaction (imparable)
  - Appliquer l'effet de metamorphose normalement

C'est ok pour la métamorphose suite à "Sursis". Concernant l'activation de sursis. En effet Règne ne le bloque pas. Mais  il faut ajouter que, concernant le ciblage de "Sursis", rien ne le bloque non plus. Par exemple, l'effet d'Apollon "vos mortels sont invulnérables", n'empêche pas de les cibler avec Sursis.

## Etape 9 : Regner bloque les reactions (sauf Sursis)

- Le flag `reactionsBlocked` existant empeche toutes les reactions SAUF Sursis
- Dans `canActivateReaction`, verifier `!gameState.reactionsBlocked || card.name === 'Sursis'`
  &nbsp;

---

## Details techniques

### Fichiers a creer

- `src/engine/reactionEngine.ts` — moteur de validation et resolution des reactions
- `src/components/game/ReactionWindow.tsx` — UI de la fenetre de reaction

### Fichiers a modifier

- `src/data/spellCards.ts` — split Compassion/Eveil, modifier Resistance
- `src/types/game.ts` — ajouter `sursisTarget` sur Mortal, `ReactionTrigger` et etat reaction sur GameState
- `src/hooks/useGameLogic.ts` — integrer le flux de reaction, ajouter Eveil, gerer Sursis au cycle
- `src/components/game/TargetingModal.tsx` — eventuellement etendre pour les choix de reaction
- `src/pages/Index.tsx` — brancher ReactionWindow
- `src/components/game/ActionBar.tsx` — supprimer le bouton "Reaction" manuel (remplace par le systeme automatique)

### Ordre d'implementation

1. Modifications de cartes (spellCards.ts)
2. Types (game.ts)
3. Moteur de reaction (reactionEngine.ts)
4. Logique de jeu (useGameLogic.ts)
5. UI (ReactionWindow.tsx)
6. Integration (Index.tsx, ActionBar.tsx)
7. Sursis auto-metamorphose
8. Sortilege Eveil