# CONTROL — Roadmap & Fonctionnalités manquantes

> Analyse de ce qui manque pour faire de CONTROL une app accomplie.
> Organisé du plus critique (P0) au moins urgent (P3).

---

## Point de reprise rapide

Dernière mise à jour : 2026-08-02 (fusion du cahier des charges).

### État global actuel

Les écarts identifiés dans [`CAHIER_DES_CHARGES.md`](./CAHIER_DES_CHARGES.md) (conversion du PDF `CONTROL_SaaS_Cahier_Des_Charges_V3.pdf`) ont été fusionnés dans les sections P1/P2/P3 ci-dessous. **Multi-boutique** et **Analytics avancés** ne sont donc plus des blocs différés : ce sont maintenant des chantiers actifs, enrichis avec le détail du cahier des charges (entité `Organization`, `organizationId`/`storeId`, rentabilité, monétisation SaaS, vision long terme). Les cases se cochent au fur et à mesure qu'un point est réellement livré et vérifié — pas avant.

La prochaine phase active était la **vue propriétaire** : transformer CONTROL d'une app surtout opérationnelle pour vendeuses en outil de pilotage pour le propriétaire.

Checklist propriétaire en cours :

- [x] Détecter le rôle `owner` / `seller` côté app.
- [x] Ajouter un choix explicite `Propriétaire` / `Vendeur` à l'inscription.
- [x] Garder l'accueil actuel pour les vendeuses.
- [x] Créer une première Home propriétaire avec ventes du jour, cash attendu, écart caisse, équipe, alertes, stock bas et activité récente.
- [x] Donner au propriétaire des raccourcis directs vers bilan, équipe, exports, stock, écarts et réglages.
- [ ] Attribuer chaque vente/dépense/clôture/manquant à l'utilisateur qui l'a créé (`actorUserId`, `actorName`).
- [ ] Afficher les performances par vendeuse.
- [ ] Verrouiller les permissions backend par rôle sur toutes les routes sensibles.
- [ ] Préparer le modèle multi-boutique propriétaire.

### État précédent

Tout ce qui devait être fait avant les sujets différés est terminé et vérifié.

Il reste uniquement les blocs volontairement mis de côté :

- Push notifications Expo/iOS.
- CI/CD.
- Connexion sociale Apple / Facebook / X.

Multi-boutique et Analytics avancés sont sortis de cette liste (voir note ci-dessus) : ce sont maintenant des chantiers actifs en P3, à traiter selon leurs propres dépendances internes.

### Dernier arrêt concret

**Qualité restante hors CI — LIVRÉ** (session 5). `npm run verify:local` à la racine : **OK**.

Ce qui a été livré dans la session 5 :

- **Tests de composants frontend** — nouveaux composants testables :
  - `Control/components/sale-form.tsx` + `Control/tests/components/sale-form.test.tsx` (4 tests).
  - `Control/components/closure-form.tsx` + `Control/tests/components/closure-form.test.tsx` (4 tests).
  - `Control/app/sale.tsx` et `Control/app/closure.tsx` utilisent maintenant ces composants purs.
- **Backend durci** :
  - validation des variables d'environnement au démarrage (`validateEnv()` dans `backend_Control/src/config/env.ts`) + tests.
  - rate limiting mémoire sur `/api` (`backend_Control/src/middleware/rate-limit.ts`) + tests.
  - logger JSON structuré (`backend_Control/src/utils/logger.ts`) branché sur le serveur et l'error handler.
  - alias compatible `/api/v1/...` → `/api/...` sans casser les routes existantes.
- **Vérification locale hors CI** :
  - `package.json` racine avec `npm run verify:local`.
  - `Control/package.json` : scripts `test` et `typecheck`.

---

**Tests d'intégration routes API critiques backend — LIVRÉ** (session 4). `npm test` dans `backend_Control` : **63 tests, 0 échec**.

Ce qui a été livré dans la session 4 :

- **`backend_Control/src/integration/api-routes.test.ts`** — nouveau (10 tests). Couvre l'assemblage HTTP Express route → controller → service → repository, sans Appwrite réel : `sales`, `products`, `summary/today`, `cash-closures`.
- Auth mockée au niveau middleware (`requireAuth`) pour fournir `request.auth.shopId`.
- Repositories Appwrite mockés via `require.cache` avant chargement de `app.ts`.
- Serveur HTTP local éphémère autour de l'app Express + client `fetch` natif Node.

**Note vérification** : dans le sandbox Codex, l'écoute HTTP locale demande une autorisation escaladée (`listen EPERM` sinon). Une fois autorisée, la suite passe.

---

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

#### Differes explicitement — ne pas toucher pour l'instant

Tout ce qui etait faisable hors zone differee est termine.

Il reste uniquement :

- Push notifications Expo/iOS.
- Connexion Apple/Facebook/X.
- Multi-boutique.
- Analytics avancés.
- CI/CD.

### Fichiers modifiés sur la dernière reprise (session 5)

- `Control/components/sale-form.tsx` — nouveau composant pur formulaire vente.
- `Control/tests/components/sale-form.test.tsx` — nouveau (4 tests).
- `Control/components/closure-form.tsx` — nouveau composant pur formulaire clôture.
- `Control/tests/components/closure-form.test.tsx` — nouveau (4 tests).
- `Control/app/sale.tsx` — utilise `SaleForm`.
- `Control/app/closure.tsx` — utilise `ClosureForm`.
- `Control/package.json` / `Control/package-lock.json` — deps/scripts tests frontend.
- `Control/tsconfig.json` — types Node pour tests.
- `backend_Control/src/config/env.ts` + `env.test.ts` — validation env.
- `backend_Control/src/middleware/rate-limit.ts` + `rate-limit.test.ts` — rate limiting.
- `backend_Control/src/middleware/api-version.ts` — alias `/api/v1`.
- `backend_Control/src/utils/logger.ts` — logger structuré.
- `backend_Control/src/app.ts`, `server.ts`, `middleware/error-handler.ts` — branchements qualité.
- `backend_Control/src/integration/api-routes.test.ts` — ajout test `/api/v1/products`.
- `package.json` — script racine `verify:local`.

### Vérifications au dernier arrêt (session 5)

```sh
npm run verify:local   # racine — OK
```

### Fichiers modifiés sur la reprise précédente (session 4)

- `backend_Control/src/integration/api-routes.test.ts` — nouveau (10 tests d'intégration API).

### Vérifications au dernier arrêt (session 4)

```sh
npm test   # dans backend_Control — 63 tests, 0 échec
```

### Fichiers modifiés sur la reprise précédente (session 3)

- `backend_Control/src/modules/cash/cash.service.test.ts` — nouveau (13 tests).
- `backend_Control/src/modules/sales/sales.service.test.ts` — nouveau (7 tests).
- `backend_Control/src/modules/stock/stock.service.test.ts` — nouveau (9 tests).
- `backend_Control/src/modules/products/products.service.test.ts` — nouveau (20 tests).
- `backend_Control/package.json` — script `test` : glob `**` → `find dist -name '*.test.js'`.

### Vérifications session 3

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

- [x] **Boutique** — modifier nom, contact, adresse, horaires, logo/avatar (photo caméra ou galerie, remplace les initiales dans l'accueil et le profil — session 2026-08-02, hors cahier des charges initial)
- [x] **Caisse** — configurer devise, modes de paiement, heure de clôture par défaut
- [x] **Équipe** — invitations avec code, rôles propriétaire/vendeuse, contrôle d'accès backend, modal interactif
- [x] **Alertes** — activer/désactiver alertes stock faible, rappel clôture oubliée, écarts de caisse
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
- [ ] Alerte "ventes suspectes" (cahier des charges §10)
- [ ] Alerte "baisse d'activité inhabituelle" (cahier des charges §10)
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

### Rôles étendus (manager / comptable)

> Cahier des charges §11. LIVRÉ (session 2026-08-02).

- [x] Ajouter le rôle `manager` — hérite de l'expérience UI `owner` (`toExperienceRole` dans `Control/lib/control-auth.tsx`).
- [x] Ajouter le rôle `comptable` — hérite de l'expérience UI `seller`.
- [x] Définir les permissions fines par rôle — `comptable` en lecture seule côté backend sur les actions opérationnelles (ventes, dépenses, manquants, clôtures, produits) via le middleware `requireOperationalRole` (`backend_Control/src/middleware/roles.ts`) ; invite/retrait d'équipe reste réservé à `owner` (déjà en place, maintenant correctement étendu à manager/comptable aussi).

Détail livré :
- `AccountRole` (backend `users.repository.ts`) et `MemberRole` (backend `team.repository.ts`) élargis à `manager`/`comptable`.
- Invitation d'équipe : sélecteur de rôle dans `team-settings-modal.tsx`, propagé jusqu'à `POST /api/team/invite` (`role` dans le body, validé côté service).
- Le rôle réellement assigné à l'inscription/join vient de l'invitation (`member.role`), plus jamais hardcodé à `'seller'`.
- Middleware `requireAuth` : la résolution du `shopId` par appartenance à une équipe (au lieu de la création d'une boutique propre) s'applique maintenant à tout rôle `!== 'owner'`, pas seulement `'seller'`.
- Simplification assumée et documentée dans le code : pas encore d'écran dédié comptable (vue lecture seule des rapports) — `comptable` réutilise l'écran vendeur/seller pour l'instant, seule l'écriture est bloquée côté API.

### Dépenses avancées

> Cahier des charges §8. LIVRÉ (session 2026-08-02).

- [x] Catégoriser les dépenses en fixes / variables — mapping statique catégorie → `fixed`/`variable` (`getExpenseKind` dans `types/control.ts`, pas de nouveau champ à saisir). Visible dans le Bilan (onglet Sorties) et le Journal via le `sub` des transactions.
- [x] Photo justificative par dépense — champ `receiptFileId` sur `expenses`, upload en base64 à la création (`POST /api/expenses`), stocké dans un bucket Appwrite Storage **privé** (`expense_receipts`), servi uniquement via un proxy backend authentifié et scopé à la boutique (`GET /api/expenses/:id/receipt`) — jamais d'URL Appwrite publique. Capture caméra ou galerie dans `app/expense.tsx` (`expo-image-picker`), visualisation via `ReceiptViewerModal` dans le Journal et le Bilan (icône caméra sur les sorties qui ont une photo).

> ⚠️ Actions manuelles requises avant que la photo justificative fonctionne :
> 1. `node scripts/setup-appwrite-expense-receipts.js` dans `backend_Control` — crée le bucket Storage + l'attribut `receiptFileId`.
> 2. **Rebuild natif obligatoire** (`expo-image-picker` est un nouveau module natif, pas juste un reload JS) : `npx expo run:ios` / `run:android`, ou un nouveau build `eas build --profile development`. Impossible de tester la capture photo avant ce rebuild.

### Stock avancé

> Cahier des charges §7. LIVRÉ (session 2026-08-02).

- [x] Champ fournisseur sur les entrées de stock — `supplier` optionnel sur `stock_movements` (backend `products.repository.ts`/`products.service.ts`, script `scripts/setup-appwrite-stock-supplier.js` à lancer pour créer l'attribut Appwrite), champ dans le formulaire d'appro (`app/stock.tsx`), affiché dans l'historique produit et le détail des mouvements (`StockMovementItem`).
- [x] Distinguer les types de sortie (produit abîmé / consommation interne / erreur d'inventaire) — en fait **déjà fait avant cette session** : `missingReasons = ['perdu', 'abime', 'erreur', 'consommation interne']` existait déjà côté backend (`types/control.ts`) et frontend (`app/missing.tsx`), le gap identifié dans le cahier des charges était une fausse alerte de mon analyse initiale.
- [x] Détection d'anomalie de stock — nouveau déclencheur `triggerStockAnomalyAlert` (`notifications.triggers.ts`) : alerte quand une seule déclaration de manquant retire ≥ 50 % du stock restant (sur un stock d'au moins 5 unités). Nouveau type de notification `stock_anomaly`, affiché dans le centre de notifications.

> ⚠️ Action manuelle requise avant que le champ fournisseur fonctionne en prod : lancer `node scripts/setup-appwrite-stock-supplier.js` dans `backend_Control` pour créer l'attribut sur la collection Appwrite `stock_movements`.

---

## P3 — Stabilité & long terme

### Tests

- [x] Tests unitaires sur les services backend (sales, cash, stock, products)
- [x] Premier socle de tests backend : calculs de caisse (`cash.calculations.test.ts`)
- [x] Tests d'intégration sur les routes API critiques
- [x] Tests de composants frontend (formulaire vente, clôture)

### Multi-boutique

> Cahier des charges §3-4-6. Le plus gros chantier structurel : débloque la vue globale entreprise, la rentabilité par boutique, les permissions par boutique et la monétisation par palier.

- [ ] Introduire l'entité `Organization` (entreprise) au-dessus de `Shop`
- [ ] Un utilisateur peut gérer plusieurs boutiques (`Store`) au sein d'une organisation
- [ ] Migrer le modèle de données : isolation par `organizationId` + `storeId` (au lieu du `shopId` unique actuel)
- [ ] Sélecteur de boutique active dans l'app
- [ ] Isolation stricte des données entre boutiques
- [ ] Vue globale entreprise (toutes boutiques confondues) dans le dashboard
- [ ] Vue par boutique dans le dashboard

### Analytics avancés

> Cahier des charges §9.

- [ ] Prix d'achat sur les produits (prérequis pour calculer une marge)
- [ ] Marge brute par produit (prix achat vs prix vente)
- [ ] Bénéfice net (CA − dépenses − coût d'achat)
- [ ] Taux de perte
- [ ] Classement des produits les plus vendus
- [ ] Classement des produits les plus rentables
- [ ] Tendance hebdomadaire / mensuelle
- [ ] Comparaison entre deux périodes
- [ ] Comparaison des boutiques les plus performantes (dépend du multi-boutique)

### Monétisation SaaS

> Cahier des charges §13. N'a de sens complet qu'une fois le multi-boutique en place.

- [ ] Définir les paliers Free / Pro / Business
- [ ] Infrastructure de facturation / limitation par palier

### Vision long terme (hors périmètre proche)

> Cahier des charges §15.

- [x] Génération de rapports PDF — déjà livré (export bilan journalier, voir P2 "Export des données")
- [ ] IA de prédiction de ventes
- [ ] Vraie intégration Mobile Money (API opérateur — aujourd'hui c'est juste un libellé de mode de paiement)
- [ ] Export comptable
- [ ] Synchronisation bancaire
- [ ] Gestion fournisseurs
- [ ] Gestion dettes clients
- [ ] Marketplace B2B

### CI/CD & qualité

- [ ] Pipeline CI (lint + build + tests) sur chaque PR
- [x] Versionning de l'API (préfixe `/v1/`)
- [x] Rate limiting sur le backend
- [x] Logs structurés (remplacer les `console.warn` par un vrai logger)
- [x] Variables d'environnement validées au démarrage du serveur

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
- [x] Ajouter `npm run build` backend dans une vérification locale ou CI
- [x] Ajouter `npm run lint` frontend dans une vérification locale ou CI
- [x] Valider les variables d'environnement au démarrage backend

---

## Récapitulatif haut niveau

| Priorité | Tâches totales | Restantes | Statut |
| -------- | ------------- | --------- | ------ |
| P0 | 16 | 1 | Apple/FB/X différé en dernier plan |
| P1 | 27 | 4 | Push notifications différées + 2 alertes cahier des charges |
| P2 | 23 | 0 | Tout livré ✓ (rôles étendus, stock avancé, dépenses avancées) |
| P3 | 35 | 26 | Multi-boutique, analytics, monétisation, vision long terme (cahier des charges) |
| **Total** | **101** | **31** | P2 entièrement fermé le 2026-08-02 — reste uniquement P0 (Apple/FB/X), P1 (push) et P3 |

> Le tableau compte les tâches haut niveau. Les sous-tâches ajoutées dans les sections de détail servent au suivi de reprise et peuvent être consolidées au fur et à mesure.
> Le saut de 10 → 38 tâches restantes vient de la fusion des écarts de [`CAHIER_DES_CHARGES.md`](./CAHIER_DES_CHARGES.md), pas d'une régression : ce sont des tâches qui existaient déjà dans la vision produit mais n'étaient pas encore transcrites ici.
