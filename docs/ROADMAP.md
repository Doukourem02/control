# CONTROL — Roadmap & Fonctionnalités manquantes

> Analyse de ce qui manque pour faire de CONTROL une app accomplie.
> Organisé du plus critique (P0) au moins urgent (P3).

---

## Point de reprise rapide

Dernière mise à jour : 2026-05-22 (session 3).

### Dernier arrêt concret

**Tests unitaires services backend — LIVRÉ** (session 3). `npm test` dans `backend_Control` : **53 tests, 0 échec**.

Ce qui a été livré dans la session 3 :

- **`backend_Control/src/modules/cash/cash.service.test.ts`** — nouveau (13 tests). Couvre : `getCashClosures` (limit clamping, route par date), `createCashClosure` (validation montant, calcul cashGap, montant 0 accepté), `patchCashClosure` (note vide, clôture introuvable, mauvaise boutique, correction appliquée). Mocks via `require.cache` : sales/expenses/cash/shops repos + notifications triggers.
- **`backend_Control/src/modules/sales/sales.service.test.ts`** — nouveau (7 tests). Couvre : `createSale` — productId manquant, quantity ≤ 0 ou NaN, paymentMethod invalide, méthode désactivée dans la boutique, chemin heureux.
- **`backend_Control/src/modules/stock/stock.service.test.ts`** — nouveau (9 tests). Couvre : `getStockMovements` — limit clamping (1–50), filtre productId + trim + blank, plage date from/to, type de mouvement, pas de date → range undefined. Utilise `mock.fn()` pour vérifier les arguments passés au repo.
- **`backend_Control/src/modules/products/products.service.test.ts`** — nouveau (20 tests). Couvre : `createOrSupplyProduct` (7 validations + 2 chemins heureux), `updateProduct` (not found, mauvaise boutique, nom vide, prix ≤ 0, aucun champ, mises à jour), `archiveProduct` (not found, mauvaise boutique, hasSales, suppression OK).
- **`backend_Control/package.json`** — script `test` corrigé : remplace le glob `dist/**/*.test.js` (non supporté par `/bin/sh`) par `find dist -name '*.test.js' | sort`.

**Technique de mock utilisée** : injection dans `require.cache` via `createRequire(__filename)` + chargement lazy du service après injection. Compatible Node 20 (pas de `mock.module()` qui nécessite Node 22).

---

**Photo/emoji amélioré — LIVRÉ** (session 2). `npx tsc --noEmit` passe. P2 terminé à 100 %.

Ce qui a été livré dans la session 2 :

- **`Control/app/stock.tsx`** — grille de 40 emojis inline sous le champ Nom (création produit) ; même grille dans le modal d'édition + TextInput fallback pour emoji personnalisé ; `ALL_EMOJIS` (40 emojis) remplace `EMOJI_OPTIONS` (5) dans la création de catégorie ; emoji du nouveau produit = sélection utilisateur || emoji catégorie || `📦`.

---

**Mode offline — LIVRÉ** (session 1). 4 tests passent.

Ce qui a été livré dans la session 1 :

- **`Control/lib/network-state.ts`** — flag global `offline` + listeners + hook `useNetworkStatus()`. Mis à jour automatiquement par `requestApi` (fetch échoué → offline, fetch réussi → online).
- **`Control/lib/offline-cache.ts`** — cache JSON via `expo-file-system` (`cacheWrite` / `cacheRead`). Répertoire `ctrl-cache/` dans `documentDirectory`.
- **`Control/lib/offline-queue.ts`** — queue persistante (`ctrl-queue.json`) pour les actions offline. `queueAdd` / `queueGet` / `queueRemove` / `queueCount`.
- **`Control/lib/control-errors.ts`** — helper `isOfflineQueued(error)` pour distinguer une action mise en queue d'une vraie erreur.
- **`Control/lib/control-data.ts`** — `requestApi` notifie l'état réseau ; `getProducts`, `getCategories`, `getTodaySummary` écrivent le cache au succès et lisent le cache à l'échec réseau ; `createSale` et `createExpense` mettent en queue et lancent `OFFLINE_QUEUED` quand hors ligne ; `flushOfflineQueue()` rejoue la queue à la reconnexion.
- **`Control/app/sale.tsx`** — bannière amber "Hors ligne" ; vente acceptée avec message d'attente si `OFFLINE_QUEUED` (pas de réversion optimiste) ; `useEffect` qui flush la queue et recharge les produits au retour réseau.
- **`Control/app/expense.tsx`** — idem pour les sorties caisse.
- **`Control/app/index.tsx`** — bannière globale "Hors ligne — données en cache affichées" ; `useEffect` qui flush la queue + rafraîchit le résumé à la reconnexion.

### Prochaine étape

#### P3 : Tests d'intégration sur les routes API critiques

Les tests unitaires services sont terminés (53 tests). La prochaine couche utile :

1. Tests d'intégration sur les routes HTTP critiques (sales, cash, products) — vérifie que controller + service + repo s'assemblent correctement, sans Appwrite réel (mock du repo Appwrite).
2. Tests de composants frontend (formulaire vente, clôture caisse) — si Expo Testing Library est ajouté.

CI/CD et push notifications : **différés explicitement — ne pas toucher pour l'instant.**

#### Volontairement différé — ne pas toucher

Push notifications Expo/iOS, connexion Apple/Facebook/X, multi-boutique, analytics avancés, CI/CD.

### Fichiers modifiés sur la dernière reprise (session 3)

- `backend_Control/src/modules/cash/cash.service.test.ts` — nouveau (13 tests).
- `backend_Control/src/modules/sales/sales.service.test.ts` — nouveau (7 tests).
- `backend_Control/src/modules/stock/stock.service.test.ts` — nouveau (9 tests).
- `backend_Control/src/modules/products/products.service.test.ts` — nouveau (20 tests).
- `backend_Control/package.json` — script `test` : glob `**` → `find dist -name '*.test.js'`.

### Vérifications au dernier arrêt (session 3)

```sh
npm test   # dans backend_Control — 53 tests, 0 échec
```

### Fichiers modifiés sur la reprise précédente (session 2)

- `Control/lib/network-state.ts` — nouveau.
- `Control/lib/offline-cache.ts` — nouveau.
- `Control/lib/offline-queue.ts` — nouveau.
- `Control/lib/control-errors.ts` — + `isOfflineQueued`.
- `Control/lib/control-data.ts` — network-state + cache (GET) + queue (mutations) + `flushOfflineQueue`.
- `Control/app/sale.tsx` — bannière offline + gestion `OFFLINE_QUEUED` + sync reconnexion.
- `Control/app/expense.tsx` — idem.
- `Control/app/index.tsx` — bannière réseau globale + flush queue à la reconnexion.

### Vérifications au dernier arrêt

```sh
npx tsc --noEmit   # dans Control — OK
```

### Points d'attention Appwrite

| Collection | Script de création | Statut |
| --- | --- | --- |
| `shops` | `scripts/setup-appwrite-shops.js` | créée |
| `notifications` | `scripts/setup-appwrite-notifications.js` | créée |
| `members` | `scripts/create-members-collection.ts` (`npx ts-node -T`) | créée 2026-05-22 |
| `cash_closures` champs `correctionNote`/`isPartial` | `scripts/setup-appwrite-cash-closures.js` | ajoutés 2026-05-22 |

Si l'environnement Appwrite est recréé, relancer tous ces scripts dans l'ordre.

### Notes pour reprise par un autre agent

#### Stack & structure

- **Frontend** : React Native + Expo Router — `Control/app/index.tsx` contient tout l'écran principal (home, report, missing, profile) en un seul fichier.
- **Backend** : Express v5 + TypeScript — `backend_Control/src/modules/` avec un dossier par module (routes / controller / service / repository).
- **BaaS** : Appwrite (database, auth) — client SDK dans `backend_Control/src/config/appwrite.ts`.
- **API calls frontend** : toutes dans `Control/lib/control-data.ts` via la fonction `requestApi`.
- **Auth** : session Appwrite via Bearer token, middleware `requireAuth` dans `backend_Control/src/middleware/auth.ts`. Le `shopId` est disponible via `request.auth.shopId` (ou `getShopId(request)`).

#### Modules backend existants

```text
backend_Control/src/modules/
├── activity/        — logs d'activité
├── analytics/       — analytics ventes/dépenses
├── cash/            — résumé du jour + clôtures (correction + partielle inclus)
├── categories/      — catégories de produits
├── expenses/        — dépenses
├── exports/         — PDF journalier + CSV historique (pdfkit)
├── health/          — healthcheck (route publique)
├── missing/         — déclaration de manquants
├── notifications/   — notifications in-app (list/read/read-all + triggers)
│   └── notifications.triggers.ts  ← 3 déclencheurs : stock_low, cash_gap, closure_reminder
├── products/        — produits + approvisionnement (supply)
├── sales/           — ventes
├── shops/           — boutique et réglages
├── stock/           — mouvements de stock (filtre ?productId disponible)
└── users/           — inscription/login (routes publiques)
```

#### Routes cash — état complet

- `GET  /api/summary/today` — résumé journalier (isClosed, cashSalesAmount, etc.)
- `GET  /api/cash-closures` — liste des clôtures (`?date=YYYY-MM-DD` ou `?limit=N`)
- `POST /api/cash-closures` — créer une clôture (`physicalCashAmount`, `note?`, `isPartial?`, `businessDate?`)
- `PATCH /api/cash-closures/:id` — corriger une clôture (`correctionNote` — note obligatoire, montants inchangés)

#### Notifications in-app — état actuel

- Routes : `GET /api/notifications`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read`.
- Déclencheurs fire-and-forget :
  - **stock_low** → `sales.repository.ts` + `missing.repository.ts`
  - **cash_gap** → `cash.service.ts` après chaque clôture avec écart ≠ 0
  - **closure_reminder** → `cash.controller.ts` (`getTodaySummary`) si journée non clôturée après l'heure. Dédupliqué sur 12h.
- Frontend : cloche dans `Control/app/index.tsx` (~ligne 2580), badge rouge si non-lus, modal `NotificationsCenterModal`.

#### Éléments à garder en tête

- **Push notifications** : différées jusqu'au logo final iOS/Android.
- **Mode offline** : pas encore traité — les erreurs réseau retournent silencieusement des données vides sur la plupart des écrans.
- **`scrollRef` dans `stock.tsx`** : casté `as any` (incompatibilité de typage RN/TS6) — fonctionnel à l'exécution.

#### Vérifications locales

- `npm run build` dans `backend_Control` — compile TypeScript
- `npm test` dans `backend_Control` — compile puis lance les tests backend
- `npm run lint` dans `Control` — lint Expo
- `npx tsc --noEmit` dans `Control` — typecheck frontend
- Après chaque nouveau script Appwrite : `node scripts/setup-appwrite-<nom>.js`

---

## P0 — Bloquants (l'app ne peut pas tourner en production sans ça)

### Authentification & identité utilisateur

- [x] Écran de login (email + mot de passe) côté frontend
- [x] Écran d'inscription / création de compte
- [x] `users.service.ts` à implémenter
- [x] Middleware d'authentification sur le backend (session Appwrite)
- [x] Protection de toutes les routes API métier
- [x] Gestion du token côté app (stockage sécurisé, restauration de session, logout)
- [x] Mot de passe oublié / récupération de compte
- [x] Connexion sociale Google
- [ ] Connexion sociale optionnelle : Apple / Facebook / X
- [x] Erreurs d'authentification personnalisées côté app (compte absent, mauvais mot de passe, session expirée)

#### Critères de validation — Authentification

- Une requête API métier sans utilisateur authentifié est refusée.
- L'app sait se connecter, se déconnecter et restaurer une session au redémarrage.
- Le frontend n'envoie plus d'action métier sans identité utilisateur valide.

### Boutiques (Shops module)

- [x] `shops.service.ts` à implémenter
- [x] Router shops à monter dans `app.ts`
- [x] Création / récupération d'une boutique à l'inscription et à la connexion
- [x] Remplacer le `DEFAULT_SHOP_ID = 'default-shop'` hardcodé par le vrai `shopId` de l'utilisateur connecté
- [x] Liaison `utilisateur → boutique(s)` en base de données
- [x] Automatiser la création de la collection Appwrite `shops`

#### Critères de validation — Boutiques

- Chaque donnée métier est créée avec le `shopId` réel de la boutique active.
- Deux boutiques ne peuvent pas lire ou modifier les données l'une de l'autre.
- Le backend ne dépend plus de `default-shop` pour les routes métier.

---

## P1 — Fonctionnels importants (ce que l'utilisateur va réclamer en premier)

### Écrans Settings

- [x] **Boutique** — modifier nom, contact, adresse, horaires
- [x] **Caisse** — configurer devise, modes de paiement, heure de clôture par défaut
- [x] **Équipe** — invitations avec code, rôles propriétaire/vendeuse, contrôle d'accès backend, modal interactif
- [ ] **Alertes** — activer/désactiver alertes stock faible, rappel clôture oubliée, écarts de caisse
- [x] **Affichage** — toggle montants visibles par défaut, choix de langue, unités
- [x] **Données** — export PDF journalier, export CSV historique, partage natif

> Le `ProfileMenu` ouvre maintenant les sections Boutique, Caisse, Affichage, Alertes, Équipe et Données. Les préférences et actions principales sont branchées ; les push notifications restent différées.

#### Détail — Settings déjà branchés

- [x] Boutique : sauvegarde via `PATCH /api/shops/current`.
- [x] Caisse : sauvegarde devise, modes de paiement et heure de clôture.
- [x] Affichage : sauvegarde montants visibles, langue, unité par défaut.
- [x] Alertes : préférences sauvegardées sur la boutique + notifications in-app.
- [x] Équipe : invitations par email, code d'invitation, rôles, retrait de membre, join flow.
- [x] Données : exports PDF/CSV et partage natif.

#### Détail — Settings restant à finaliser

- [ ] Alertes : push notifications Expo/iOS quand le logo final est prêt.

### Notifications & Alertes

- [x] Icône cloche dans le header à brancher
- [x] Collection / modèle backend `notifications`
- [x] Alerte stock faible in-app (seuil boutique déjà configurable)
- [x] Rappel in-app si la clôture de la journée n'a pas été faite
- [x] Notification in-app en cas d'écart de caisse détecté
- [x] Centre de notifications in-app (liste des alertes récentes)
- [x] Badge non-lu sur la cloche
- [ ] Push notifications Expo/iOS — différé (logo app requis, à faire en dernier)

### Réapprovisionnement produit (Supply)

- [x] Ajout de stock à un produit existant depuis l'écran stock
- [x] Création d'un mouvement `'supply'` côté backend lors d'un réapprovisionnement
- [x] Clarifier l'UX de l'écran stock pour rendre le mode réapprovisionnement plus évident
- [x] Historique des approvisionnements par produit

---

## P2 — Valeur ajoutée (différenciant, réclamé rapidement)

### Export des données

- [x] Export bilan journalier en PDF (ventes + dépenses + clôture)
- [x] Export historique en CSV (sur une période choisie)
- [x] Partage natif (WhatsApp / email / etc.) depuis l'app via expo-sharing
- [x] La section "Données" dans les réglages déclenche ces exports

### Mode offline

- [x] Cache local des produits, catégories et résumé du jour
- [x] Queue des actions offline (vente/dépense saisie sans réseau → sync à la reconnexion)
- [x] Indicateur visuel de l'état de connexion réseau
- [x] Aujourd'hui les erreurs API retournent silencieusement des données vides — afficher un vrai message à l'utilisateur

### Gestion produits avancée

- [x] Modifier un produit existant (nom, emoji, prix de vente) — modal édition dans stock.tsx
- [x] Supprimer un produit (bloqué si ventes existantes, modal de confirmation)
- [x] Recherche et filtre dans la liste produits — barre de recherche frontend
- [x] Photo ou emoji personnalisé amélioré

### Clôture & corrections

- [x] Corriger une clôture déjà soumise (noter une erreur de saisie)
- [x] Clôture partielle (fermeture en cours de journée si besoin)
- [x] Résumé détaillé de la clôture avant confirmation

---

## P3 — Stabilité & long terme

### Tests

- [x] Tests unitaires sur les services backend (sales, cash, stock, products)
- [x] Premier socle de tests backend : calculs de caisse (`cash.calculations.test.ts`)
- [ ] Tests d'intégration sur les routes API critiques
- [ ] Tests de composants frontend (formulaire vente, clôture)

### Multi-boutique

- [ ] Un utilisateur peut gérer plusieurs boutiques
- [ ] Sélecteur de boutique active dans l'app
- [ ] Isolation stricte des données entre boutiques

### Analytics avancés

- [ ] Marge brute par produit (prix achat vs prix vente)
- [ ] Classement des produits les plus vendus
- [ ] Tendance hebdomadaire / mensuelle
- [ ] Comparaison entre deux périodes

### CI/CD & qualité

- [ ] Pipeline CI (lint + build + tests) sur chaque PR
- [ ] Versionning de l'API (préfixe `/v1/`)
- [ ] Rate limiting sur le backend
- [ ] Logs structurés (remplacer les `console.warn` par un vrai logger)
- [ ] Variables d'environnement validées au démarrage du serveur

---

## Prochaine version — MVP production

Objectif : sortir CONTROL du mode démo et rendre les données fiables par utilisateur et par boutique.

### Sprint 1 — Identité, boutique réelle, sécurité API

- [x] Choisir définitivement la stratégie d'authentification : session Appwrite
- [x] Implémenter login / inscription / logout côté app
- [x] Créer ou récupérer la boutique de l'utilisateur à l'inscription
- [x] Ajouter le middleware d'authentification backend
- [x] Monter les routes `users` et `shops` dans `app.ts`
- [x] Remplacer tous les usages métier de `DEFAULT_SHOP_ID` par le `shopId` issu de la session
- [x] Protéger les routes produits, stock, ventes, dépenses, caisse, écarts, activité, analytics et catégories
- [x] Afficher une erreur claire côté app quand l'API refuse une action
- [x] Ajouter / documenter la collection Appwrite `shops`

### Sprint 2 — Réglages utiles

- [x] Brancher les sections du profil réglages
- [x] Implémenter les réglages Boutique
- [x] Implémenter les réglages Caisse
- [x] Implémenter les réglages Affichage
- [x] Préparer la structure des réglages Alertes, Équipe et Données sans forcément tout finaliser
- [x] Finaliser Alertes et Données (notifications in-app + exports PDF/CSV)
- [x] Finaliser Équipe (invitations, codes, rôles, join flow)

### Sprint 3 — Qualité minimale

- [x] Ajouter un framework de test backend (`node:test` via `npm test`)
- [x] Couvrir les services critiques : produits, stock, ventes, caisse (53 tests — session 3)
- [x] Couvrir le premier bloc caisse : calcul du résumé journalier, dates métier, état clôturé/ouvert
- [ ] Ajouter `npm run build` backend dans une vérification locale ou CI
- [ ] Ajouter `npm run lint` frontend dans une vérification locale ou CI
- [ ] Valider les variables d'environnement au démarrage backend

---

## Récapitulatif haut niveau

| Priorité | Tâches totales | Restantes | Statut |
| -------- | ------------- | --------- | ------ |
| P0 | 16 | 1 | Apple/FB/X différé en dernier plan |
| P1 | 18 | 2 | Alertes settings UI + réappro historique (fait) |
| P2 | 15 | 0 | Tout livré ✓ |
| P3 | 16 | 15 | Tests unitaires services ✓ |
| **Total** | **65** | **22** | |

> Le tableau compte les tâches haut niveau. Les sous-tâches ajoutées dans les sections de détail servent au suivi de reprise et peuvent être consolidées au fur et à mesure.
