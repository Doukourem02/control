# CONTROL — Roadmap & Fonctionnalités manquantes

> Analyse de ce qui manque pour faire de CONTROL une app accomplie.
> Organisé du plus critique (P0) au moins urgent (P3).

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

### Écrans Settings (actuellement tous morts)

- [x] **Boutique** — modifier nom, contact, adresse, horaires
- [ ] **Caisse** — configurer devise, modes de paiement, heure de clôture par défaut
- [ ] **Équipe** — inviter des vendeurs, définir les rôles (propriétaire / vendeur), gérer les accès
- [ ] **Alertes** — activer/désactiver alertes stock faible, rappel clôture oubliée, écarts de caisse
- [ ] **Affichage** — toggle montants visibles par défaut, choix de langue, unités
- [ ] **Données** — export historique, sauvegarde manuelle

> Actuellement le `ProfileMenu` affiche ces 6 sections mais aucune n'a de navigation ni d'implémentation.

### Notifications & Alertes

- [ ] Icône cloche dans le header à brancher (actuellement sans action)
- [ ] Alerte stock faible (seuil configurable par produit)
- [ ] Rappel push si la clôture de la journée n'a pas été faite
- [ ] Notification en cas d'écart de caisse détecté
- [ ] Centre de notifications in-app (liste des alertes récentes)

### Réapprovisionnement produit (Supply)

- [x] Ajout de stock à un produit existant depuis l'écran stock
- [x] Création d'un mouvement `'supply'` côté backend lors d'un réapprovisionnement
- [ ] Clarifier l'UX de l'écran stock pour rendre le mode réapprovisionnement plus évident
- [ ] Historique des approvisionnements par produit

---

## P2 — Valeur ajoutée (différenciant, réclamé rapidement)

### Export des données

- [ ] Export bilan journalier en PDF (ventes + dépenses + clôture)
- [ ] Export historique en Excel / CSV (sur une période choisie)
- [ ] Partage du rapport par WhatsApp / email directement depuis l'app
- [ ] La section "Données" dans les réglages doit déclencher ces exports

### Mode offline

- [ ] Cache local des produits, catégories et résumé du jour
- [ ] Queue des actions offline (vente/dépense saisie sans réseau → sync à la reconnexion)
- [ ] Indicateur visuel de l'état de connexion réseau
- [ ] Aujourd'hui les erreurs API retournent silencieusement des données vides — afficher un vrai message à l'utilisateur

### Gestion produits avancée

- [ ] Modifier un produit existant (prix de vente, prix d'achat, unité)
- [ ] Archiver / supprimer un produit
- [ ] Recherche et filtre dans la liste produits
- [ ] Photo ou emoji personnalisé amélioré

### Clôture & corrections

- [ ] Corriger une clôture déjà soumise (noter une erreur de saisie)
- [ ] Clôture partielle (fermeture en cours de journée si besoin)
- [ ] Résumé détaillé de la clôture avant confirmation

---

## P3 — Stabilité & long terme

### Tests

- [ ] Tests unitaires sur les services backend (sales, cash, stock, analytics)
- [ ] Tests d'intégration sur les routes API critiques
- [ ] Tests de composants frontend (formulaire vente, clôture)
- [ ] Aucun fichier de test n'existe dans le projet actuellement

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

- [ ] Brancher / finaliser les sections du profil réglages
- [x] Implémenter les réglages Boutique
- [ ] Implémenter les réglages Caisse
- [ ] Implémenter les réglages Affichage
- [ ] Préparer la structure des réglages Alertes, Équipe et Données sans forcément tout finaliser

### Sprint 3 — Qualité minimale

- [ ] Ajouter un framework de test backend
- [ ] Couvrir les services critiques : produits, stock, ventes, caisse
- [ ] Ajouter `npm run build` backend dans une vérification locale ou CI
- [ ] Ajouter `npm run lint` frontend dans une vérification locale ou CI
- [ ] Valider les variables d'environnement au démarrage backend

---

## Récapitulatif

| Priorité | Tâches totales | Restantes | Statut |
| -------- | ------------- | --------- | ------ |
| P0 | 16 | 1 | Bloquant production |
| P1 | 15 | 12 | Réclamé en premier |
| P2 | 15 | 15 | Différenciants |
| P3 | 16 | 16 | Long terme |
| **Total** | **62** | **44** | |
