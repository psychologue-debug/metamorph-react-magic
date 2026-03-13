

## Diagnostic

### Probleme 1 : Boutons "Creer" / "Rejoindre" vides
Les deux boutons ont `onClick={() => {}}` (lignes 193 et 204 de `Index.tsx`). Le mode multijoueur n'a jamais ete implemente. Il n'y a aucune infrastructure reseau, pas de Supabase, pas de WebSocket, rien.

### Probleme 2 : "Lancer la partie" en solo ne marche pas sur le VPS
Le bouton appelle bien `startGame()` via `onStartGame`. Si ca marche dans l'apercu Lovable mais pas sur le VPS, c'est probablement un probleme de **configuration du serveur web** : le VPS ne sert pas correctement l'application SPA (Single Page Application). Nginx doit rediriger toutes les routes vers `index.html`.

---

## Solutions

### A. Corriger le mode solo sur le VPS (configuration serveur)

Dans la config Nginx du VPS, ajouter :

```text
location / {
    try_files $uri $uri/ /index.html;
}
```

Sans cette directive, toute navigation ou rechargement renvoie une erreur 404 au lieu de l'application React. Verifier aussi que le dossier `dist/` genere par `npm run build` est bien servi.

Si le probleme persiste meme sur `/` sans navigation, verifier la console du navigateur (F12) pour des erreurs JavaScript -- il peut y avoir un chemin d'asset incorrect (`base` dans `vite.config.ts`).

### B. Implementer le mode multijoueur

Le multijoueur necessite un backend pour synchroniser l'etat de jeu entre les joueurs. Deux approches :

**Option 1 -- Supabase Realtime (recommande pour Lovable)**
- Activer Lovable Cloud ou connecter un projet Supabase externe
- Creer une table `game_sessions` stockant l'etat de jeu serialise
- Utiliser Supabase Realtime pour synchroniser les changements entre joueurs
- Systeme de lobby avec code de partie

**Option 2 -- WebSocket maison sur le VPS**
- Deployer un serveur Node.js/WebSocket sur le VPS
- Gerer l'etat de jeu cote serveur
- Non faisable directement dans Lovable (pas de backend Node)

Pour l'option 1, le plan d'implementation serait :

1. **Connecter Supabase** (Cloud ou externe)
2. **Creer la table `game_sessions`** avec colonnes : `id`, `game_code`, `state` (JSONB), `status`, `created_at`, `players` (JSONB)
3. **Creer un ecran de lobby** : generer un code, saisir pseudo, choisir dieu, attendre les autres joueurs
4. **Synchroniser l'etat** : chaque action de jeu met a jour la table, les autres joueurs recoivent les changements en temps reel via subscription Realtime
5. **Adapter `useGameLogic`** : remplacer le `useState` local par des lectures/ecritures Supabase

C'est un chantier consequent (plusieurs dizaines de fichiers et messages). Je recommande de d'abord regler le probleme du mode solo sur le VPS, puis de s'attaquer au multijoueur etape par etape.

