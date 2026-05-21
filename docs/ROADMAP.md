# CONTROL — Roadmap & Fonctionnalités manquantes

> Analyse de ce qui manque pour faire de CONTROL une app accomplie.
> Organisé du plus critique (P0) au moins urgent (P3).

---

## Point de reprise rapide

Dernière mise à jour : 2026-05-21.

### Ce qui vient d'être fait

- Authentification Appwrite fonctionnelle avec login email/mot de passe, inscription, récupération de compte et Google OAuth.
- Backend métier protégé par session Appwrite, avec `shopId` réel issu de l'utilisateur connecté.
- Gestion d'erreurs structurée backend/frontend : erreurs utilisateur personnalisées, détails développeur masqués côté app.
- Réglages profil refondus dans le style mobile minimal demandé.
- Réglages **Boutique** finalisés : nom, contact, adresse, horaires.
- Réglages **Caisse** finalisés : devise, modes de paiement, heure de clôture par défaut.
- Réglages **Affichage** finalisés : montants visibles au démarrage, langue, unité par défaut.
- Préférences **Alertes** préparées : toggles stock faible, clôture oubliée, écart de caisse, seuil stock faible.
- Appwrite `shops` enrichi avec les champs réglages : paiement, clôture, affichage et préférences d'alertes.
- **Notifications in-app complètes** : collection Appwrite `notifications`, module backend (list/read/read-all), centre de notifications (modal bottom sheet), badge non-lu sur la cloche, 3 déclencheurs branchés (stock faible, clôture oubliée, écart de caisse).
- **Exports Données complets** : module backend `exports` (pdfkit), routes `GET /api/exports/daily` (PDF journalier) et `GET /api/exports/history` (CSV période), `DataSettingsModal` refait avec sélecteurs de date, états de chargement, et partage natif via `expo-file-system` + `expo-sharing`.
- **Socle tests backend démarré** : script `npm test`, extraction des calculs purs de caisse, tests unitaires `cash.calculations.test.ts`.
- **Clôture améliorée** : résumé détaillé avant confirmation sur l'écran de clôture (ventes cash, sorties, cash attendu, Mobile Money).

### Où reprendre

**Dernier arrêt concret** : on a démarré le Sprint 3 Qualité avec un premier socle de tests backend, puis on a livré le résumé détaillé avant confirmation sur l'écran de clôture.

Prochaine étape recommandée : continuer **Sprint 3 Tests** en couvrant `sales`, `stock` et `analytics`, parce que le filet de sécurité backend commence à être en place et il faut l'étendre aux flux critiques.

Alternative produit possible : passer à **Clôture & corrections** avec la correction d'une clôture déjà soumise, puis la clôture partielle.

Les push notifications sont volontairement différées — elles nécessitent un logo d'application finalisé pour iOS/Android.

### Dernier checkpoint technique

#### Fichiers ajoutés / modifiés sur la dernière reprise

- `backend_Control/src/modules/cash/cash.calculations.ts` — extraction des calculs purs de caisse.
- `backend_Control/src/modules/cash/cash.calculations.test.ts` — tests unitaires `node:test` des calculs de caisse.
- `backend_Control/src/modules/cash/cash.service.ts` — branchement du service caisse sur les calculs extraits.
- `backend_Control/package.json` — ajout du script `npm test`.
- `Control/app/closure.tsx` — résumé détaillé avant confirmation de clôture.
- `Control/app/index.tsx` — correction lint sur deux textes avec apostrophe.
- `docs/ROADMAP.md` — mise à jour du point de reprise.

#### Vérifications passées au dernier arrêt

- `npm test` dans `backend_Control` — OK, 4 tests passent.
- `npx tsc --noEmit` dans `Control` — OK.
- `npm run lint` dans `Control` — OK.
- `git diff --check` — OK.

#### Point d'attention

- Tentative Expo web non concluante : Expo a détecté les ports `8081` puis `8082` comme occupés en mode non interactif et n'a pas lancé de serveur exploitable. Le code compile et lint, mais l'écran de clôture reste à vérifier visuellement dans Expo quand un port libre est disponible.

### Notes importantes pour reprise par un autre agent

#### Stack & structure

- **Frontend** : React Native + Expo Router — `Control/app/index.tsx` contient tout l'écran principal (home, report, missing, profile) en un seul fichier.
- **Backend** : Express v5 + TypeScript — `backend_Control/src/modules/` avec un dossier par module (routes / controller / service / repository).
- **BaaS** : Appwrite (database, auth) — client SDK dans `backend_Control/src/config/appwrite.ts`.
- **API calls frontend** : toutes dans `Control/lib/control-data.ts` via la fonction `requestApi`.
- **Auth** : session Appwrite via Bearer token, middleware `requireAuth` dans `backend_Control/src/middleware/auth.ts`. Le `shopId` de l'utilisateur connecté est disponible via `request.auth.shopId` (ou `getShopId(request)`).

#### Modules backend existants

```text
backend_Control/src/modules/
├── activity/        — logs d'activité
├── analytics/       — analytics ventes/dépenses
├── cash/            — résumé du jour + clôtures de caisse
├── categories/      — catégories de produits
├── expenses/        — dépenses
├── health/          — healthcheck (route publique)
├── missing/         — déclaration de manquants
├── notifications/   — notifications in-app (list/read/read-all + triggers)
│   └── notifications.triggers.ts  ← les 3 déclencheurs d'alertes
├── products/        — produits + approvisionnement (supply)
├── sales/           — ventes
├── shops/           — boutique et réglages
├── stock/           — mouvements de stock
└── users/           — inscription/login (routes publiques)
```

#### Notifications in-app — état actuel

- Collection Appwrite `notifications` créée via `npm run appwrite:setup-notifications` dans `backend_Control`.
- Routes : `GET /api/notifications`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read`.
- Déclencheurs (fire-and-forget, n'affectent jamais le flux principal) :
  - **stock_low** → déclenché dans `sales.repository.ts` et `missing.repository.ts` quand le stock croise le seuil.
  - **cash_gap** → déclenché dans `cash.service.ts` après chaque clôture avec écart ≠ 0.
  - **closure_reminder** → déclenché dans `cash.controller.ts` (`getTodaySummary`) si la journée n'est pas clôturée et qu'on est passé l'heure de fermeture. Dédupliqué sur 12h.
- Frontend : cloche branchée dans `Control/app/index.tsx` (~ligne 2580), badge rouge si non-lus, modal `NotificationsCenterModal`.

#### Éléments à garder en tête

- **Push notifications** : volontairement différées jusqu'au logo final iOS/Android.
- **Mode offline** : pas encore traité ; les erreurs réseau peuvent encore tomber sur des états vides selon les écrans.
- **Clôture** : le résumé avant confirmation existe, mais la correction d'une clôture déjà soumise reste à faire.

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
- [ ] Clarifier l'UX de l'écran stock pour rendre le mode réapprovisionnement plus évident
- [ ] Historique des approvisionnements par produit

---

## P2 — Valeur ajoutée (différenciant, réclamé rapidement)

### Export des données

- [x] Export bilan journalier en PDF (ventes + dépenses + clôture)
- [x] Export historique en CSV (sur une période choisie)
- [x] Partage natif (WhatsApp / email / etc.) depuis l'app via expo-sharing
- [x] La section "Données" dans les réglages déclenche ces exports

### Mode offline

- [ ] Cache local des produits, catégories et résumé du jour
- [ ] Queue des actions offline (vente/dépense saisie sans réseau → sync à la reconnexion)
- [ ] Indicateur visuel de l'état de connexion réseau
- [ ] Aujourd'hui les erreurs API retournent silencieusement des données vides — afficher un vrai message à l'utilisateur

### Gestion produits avancée

- [x] Modifier un produit existant (nom, emoji, prix de vente) — modal édition dans stock.tsx
- [x] Supprimer un produit (bloqué si ventes existantes, modal de confirmation)
- [x] Recherche et filtre dans la liste produits — barre de recherche frontend
- [ ] Photo ou emoji personnalisé amélioré

### Clôture & corrections

- [ ] Corriger une clôture déjà soumise (noter une erreur de saisie)
- [ ] Clôture partielle (fermeture en cours de journée si besoin)
- [x] Résumé détaillé de la clôture avant confirmation

---

## P3 — Stabilité & long terme

### Tests

- [ ] Tests unitaires sur les services backend (sales, cash, stock, analytics)
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
- [ ] Couvrir les services critiques : produits, stock, ventes, caisse
- [x] Couvrir le premier bloc caisse : calcul du résumé journalier, dates métier, état clôturé/ouvert
- [ ] Ajouter `npm run build` backend dans une vérification locale ou CI
- [ ] Ajouter `npm run lint` frontend dans une vérification locale ou CI
- [ ] Valider les variables d'environnement au démarrage backend

---

## Récapitulatif haut niveau

| Priorité | Tâches totales | Restantes | Statut |
| -------- | ------------- | --------- | ------ |
| P0 | 16 | 1 | Bloquant production |
| P1 | 18 | 6 | Réclamé en premier |
| P2 | 15 | 15 | Différenciants |
| P3 | 16 | 16 | Long terme |
| **Total** | **65** | **38** | |

> Le tableau compte les tâches haut niveau. Les sous-tâches ajoutées dans les sections de détail servent au suivi de reprise et peuvent être consolidées au fur et à mesure.
