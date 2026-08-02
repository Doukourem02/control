# CONTROL — Cahier des Charges (conversion Markdown)

> Conversion en Markdown de `CONTROL_SaaS_Cahier_Des_Charges_V3.pdf`, transformée en checklist d'écart entre la vision produit et l'état actuel du code.
>
> Légende : ✅ fait · ⚠️ partiel / à confirmer · ❌ pas fait · — non applicable (narratif)
>
> Ce fichier reflète la **vision cible** (le PDF). Pour le suivi jour-le-jour de ce qui reste à coder, voir [`ROADMAP.md`](./ROADMAP.md) — les deux se complètent : celui-ci dit *où on veut aller*, `ROADMAP.md` dit *où on en est concrètement, fichier par fichier*.
>
> État vérifié dans le code le 2026-08-02 (mis à jour en fin de session, après livraison des rôles étendus / stock avancé / dépenses avancées / fondation multi-boutique) : backend = `activity, analytics, cash, categories, expenses, exports, health, missing, notifications, organizations, products, sales, shops, stock, team, users` ; rôles actuels = `owner` / `manager` / `seller` / `comptable` ; `shops` porte désormais `organizationId` (pas de `storeId` séparé — `shops.$id` en tient déjà lieu) ; pas de plans/pricing ; "Mobile Money" existe seulement comme libellé de mode de paiement, pas comme intégration.

---

## Vue d'ensemble — écart vision / réalité

| Bloc du cahier des charges | État |
| --- | --- |
| 1. Positionnement produit | — narratif |
| 2. Objectifs principaux | ⚠️ 4/7 acquis, multi-boutique et rentabilité fine manquants |
| 3. Architecture SaaS multi-tenant | ⚠️ fondation livrée (Organization + plusieurs Store, isolation, switcher) — vue agrégée/permissions/monétisation restent à faire |
| 4. Structure logique (entités) | ✅ `Organization` et `Stores` existent désormais (6/6, `Stores` = collection `shops` existante + `organizationId`) |
| 5. Application Employé (mobile) | ✅ quasi complet |
| 6. Dashboard Administrateur | ⚠️ vue par boutique OK (switcher), vue agrégée entreprise et temps réel manquants |
| 7. Gestion intelligente du stock | ✅ fournisseur, types de sortie et détection d'anomalie livrés |
| 8. Gestion financière | ✅ fixe/variable + photo justificative livrés |
| 9. Calcul de rentabilité | ⚠️ CA/dépenses oui, marge/rentabilité produit non |
| 10. Notifications & anomalies | ✅ 5/5 types d'alertes couverts (+ anomalie de stock) |
| 11. Gestion des permissions | ✅ 4/4 rôles existent (owner/manager/seller/comptable) |
| 12. Fonctionnement hors ligne | ✅ livré |
| 13. Modèle SaaS & monétisation | ❌ pas commencé |
| 14. Stack technique recommandée | ⚠️ mobile conforme, reste à écart (pas de web, pas de Postgres, pas de temps réel) |
| 15. Vision long terme | ⚠️ 1/9 déjà là (export PDF) |

---

## 1. Positionnement du Produit

> CONTROL ne doit pas être présenté comme une simple application de caisse.

CONTROL est :
- un système intelligent de supervision commerciale,
- un mini ERP simplifié pour commerces africains,
- une plateforme SaaS multi-boutiques,
- un outil de contrôle opérationnel et financier.

*(narratif — sert de boussole produit, pas une checklist)*

---

## 2. Objectifs Principaux

- [x] Contrôler les ventes à distance — vue propriétaire (ventes du jour, cash attendu, écart caisse).
- [ ] ⚠️ Empêcher les ventes non déclarées — chaque vente est liée à un produit du stock, mais pas de mécanisme de détection de vente non déclarée en tant que tel.
- [x] Suivre précisément les stocks — module `stock`, historique des mouvements.
- [ ] ⚠️ Calculer automatiquement les bénéfices — CA et dépenses oui, bénéfice net / marge par produit non.
- [ ] Superviser plusieurs boutiques — pas de multi-boutique.
- [x] Centraliser les dépenses et revenus — modules `expenses` + `cash`.
- [x] Digitaliser les petits commerces africains — c'est le produit lui-même.

---

## 3. Architecture SaaS Multi-Tenant

> CONTROL doit être conçu comme une plateforme multi-tenant.

Chaque utilisateur peut :
- [x] créer une entreprise — automatique et silencieux (`ensureOrganizationForOwner`), pas d'écran dédié : le nom est dérivé du nom de la première boutique.
- [x] créer plusieurs boutiques — `POST /api/organizations/stores` (owner only), illimité pour l'instant (pas de palier de facturation).
- [x] gérer plusieurs employés — module `team` (invitations, rôles, retrait). Note : un employé reste attaché à une seule boutique, pas multi-boutique pour les employés (décision volontaire de cette session).
- [ ] séparer ses activités commerciales — la bascule entre boutiques existe (`switchActiveStore`), mais rien n'agrège/compare encore les activités entre elles (vue globale, rentabilité comparée).

Exemple visé :
- Boutique poissonnerie Cocody,
- Boutique poissonnerie Marcory,
- Dépôt Riviera.

Isolation des données visée :
- [x] `organizationId` — champ ajouté sur `shops` (session 2026-08-02), backfillé pour les comptes existants.
- [x] `storeId` — pas de champ séparé : `shops.$id` joue déjà ce rôle (chaque boutique EST déjà son propre document scopé), jugé redondant d'en ajouter un second.

**État réel (mis à jour)** : la fondation multi-tenant est livrée. Un owner peut créer une Organization (implicite), plusieurs Store dessous, et basculer entre elles via une modale "Mes boutiques". `request.auth.shopId` (utilisé par tous les modules métier existants) résout désormais la boutique **active**, pointée par `user_profiles.shopId` — un seul pointeur serveur par compte, pas par appareil. Ce qui reste : dashboard multi-boutique (vue globale, vue par boutique), rentabilité comparée entre boutiques, permissions par boutique pour manager/comptable, monétisation par palier — tout ça se construit **sur** cette fondation, pas avant.

---

## 4. Structure Logique du Système

| Entité | Description (cahier des charges) | État |
| --- | --- | --- |
| `Organization` | Entreprise principale du client | ✅ nouvelle collection `organizations` |
| `Stores` | Boutiques appartenant à une entreprise | ✅ collection `shops` existante + `organizationId` (pas de renommage) |
| `Users` | Employés et administrateurs | ✅ existe |
| `Products` | Produits liés à une boutique | ✅ existe |
| `Sales` | Historique des ventes | ✅ existe |
| `Expenses` | Dépenses fixes et variables | ✅ existe (catégorisation fixe/variable à confirmer) |
| `Stock Movements` | Historique complet des entrées/sorties | ✅ existe |

---

## 5. Application Employé (Mobile)

> L'application mobile doit être extrêmement simple.

- [x] connexion sécurisée,
- [x] ajout de ventes,
- [x] gestion du stock,
- [x] déclaration de dépenses,
- [x] sorties exceptionnelles de stock — module `missing`.
- [x] historique journalier — `journal.tsx`.
- [x] gestion caisse — clôture (`closure.tsx`), correction, clôture partielle.
- [x] mode hors ligne — cache local + queue offline + sync à la reconnexion.

C'est le bloc le plus complet du cahier des charges.

---

## 6. Dashboard Administrateur

> Le dashboard doit fonctionner comme un cockpit de contrôle.

- [ ] ⚠️ vue globale entreprise — la fondation multi-boutique existe (un owner peut avoir plusieurs boutiques), mais le dashboard affiche toujours une seule boutique à la fois (celle active), rien n'agrège encore plusieurs boutiques ensemble.
- [x] vue par boutique — livré via la bascule de boutique active : le dashboard reflète la boutique active choisie dans "Mes boutiques", donc la "vue par boutique" existe déjà (une à la fois), il manque juste l'agrégation multi-boutique ci-dessus.
- [ ] analytics avancées — non commencé.
- [ ] ⚠️ rentabilité — CA/dépenses affichés, pas de bénéfice net ni marge.
- [x] suivi employés — module équipe (membres actifs, invitations en attente).
- [x] supervision stock.
- [x] contrôle dépenses.
- [x] alertes intelligentes — stock faible, écart de caisse, clôture oubliée.
- [ ] ⚠️ graphiques temps réel — graphiques du Bilan existent (voir `ReportChart`), mais rien n'est poussé en temps réel (pas de websocket/Realtime dans la stack actuelle).

---

## 7. Gestion Intelligente du Stock

> Chaque vente doit être obligatoirement liée à un produit du stock. ✅ — c'est le cas.

**Entrées de stock** (visé : produit, quantité, fournisseur, prix d'achat, date) :
- [x] produit, quantité, date — réapprovisionnement (`supply`) déjà géré.
- [x] fournisseur, prix d'achat — `purchaseUnitPrice` existait déjà ; `supplier` optionnel ajouté sur `stock_movements` (session 2026-08-02), champ dans le formulaire d'appro (`app/stock.tsx`), affiché dans l'historique produit.

**Sorties de stock** (visé : vente, perte, produit abîmé, consommation interne, erreur d'inventaire) :
- [x] vente — mouvement de type vente.
- [x] perte / manquant — module `missing`.
- [x] produit abîmé, consommation interne, erreur d'inventaire — en fait déjà couvert avant cette session : `missingReasons = ['perdu', 'abime', 'erreur', 'consommation interne']` existait des deux côtés (backend + `app/missing.tsx`). Mon analyse initiale était une fausse alerte.

- [x] Détection automatique des anomalies — `triggerStockAnomalyAlert` (session 2026-08-02) : alerte quand une seule déclaration de manquant retire ≥ 50 % du stock restant (sur un stock ≥ 5 unités). Notification `stock_anomaly`.

---

## 8. Gestion Financière

> CONTROL doit intégrer une gestion financière simplifiée.

**Dépenses fixes** (loyer, électricité, eau, internet, salaires) et **dépenses variables** (achats fournisseurs, transport, glace, carburant, réparations) :
- [x] Le module `expenses` existe et couvre la saisie de dépenses.
- [x] Distinction fixe/variable — mapping statique catégorie → `fixed`/`variable` (`getExpenseKind`, session 2026-08-02), visible dans le Bilan et le Journal.

- [x] Photo justificative par dépense — upload base64 à la création, stocké dans un bucket Appwrite Storage privé, servi via proxy backend authentifié (`GET /api/expenses/:id/receipt`). Capture caméra/galerie dans `app/expense.tsx`, visualisation via `ReceiptViewerModal`.

---

## 9. Calcul de Rentabilité

Le système doit automatiquement calculer :
- [x] chiffre d'affaires,
- [x] dépenses,
- [ ] ⚠️ bénéfice net — pas de calcul explicite CA − dépenses − coût d'achat exposé en UI, à confirmer.
- [ ] marge,
- [ ] taux de perte,
- [ ] produits les plus rentables,
- [ ] boutiques les plus performantes — dépend du multi-boutique (section 3).

C'est exactement le périmètre "Analytics avancés" déjà identifié comme manquant dans `ROADMAP.md` (P3).

---

## 10. Notifications & Détection d'Anomalies

Alertes automatiques visées :
- [x] écart de stock — seuil bas configurable (`stock_low`) + `stock_anomaly` (session 2026-08-02) pour un retrait ponctuel anormalement gros. Toujours pas de détection d'écart générique entrée/sortie hors ces deux cas.
- [x] écart de caisse — notification après chaque clôture avec écart ≠ 0.
- [x] ventes suspectes — `triggerSuspiciousSaleAlert` (session 2026-08-02) : le montant encaissé (modifiable manuellement à la vente) est < 70% du prix catalogue attendu.
- [x] baisse inhabituelle d'activité — `checkActivityDropIfNeeded` (session 2026-08-02) : ventes du jour comparées à la moyenne du même jour de semaine sur 4 semaines, à heure égale.
- [ ] ⚠️ absence d'activité — le rappel de clôture oubliée s'en approche mais ce n'est pas la même chose qu'une détection d'inactivité générale.
- [x] stock faible.

Tous les types d'alertes du cahier des charges sont désormais couverts (6/6 en comptant `stock_anomaly` séparément).

---

## 11. Gestion des Permissions

Rôles visés : propriétaire, manager, vendeuse, comptable.

- [x] propriétaire (`owner`).
- [x] manager — hérite de l'expérience UI `owner` (accès complet). Peut désormais inviter des membres dans sa boutique (mis à jour session 2026-08-02, sur demande explicite : un manager recrute ses propres "apprentis"), mais toujours au niveau vendeuse — jamais un autre manager/comptable, jamais retirer un membre (réservé au propriétaire).
- [x] vendeuse (`seller`).
- [x] comptable — hérite de l'expérience UI `seller`, mais en **lecture seule** côté backend sur les actions opérationnelles (ventes, dépenses, manquants, clôtures, produits) via le middleware `requireOperationalRole`.

Livré session 2026-08-02. `AccountRole` = `'owner' | 'manager' | 'seller' | 'comptable'`. Simplification assumée : pas encore d'écran dédié comptable (vue lecture-seule des rapports), il réutilise l'écran vendeur — seule l'écriture est bloquée côté API. Le lien avec le multi-boutique (permissions par boutique) reste vrai pour une évolution future plus fine.

---

## 12. Fonctionnement Hors Ligne

> L'application mobile doit fonctionner même avec une connexion internet faible.

- [x] stockées localement — cache JSON via `expo-file-system` (`Control/lib/offline-cache.ts`).
- [x] synchronisées automatiquement lorsque la connexion revient — queue offline (`Control/lib/offline-queue.ts`) + `flushOfflineQueue()`.

Bloc entièrement livré (session 1, voir `ROADMAP.md`).

---

## 13. Modèle SaaS & Monétisation

> CONTROL peut devenir une plateforme SaaS payante.

| Plan visé | Contenu visé | État |
| --- | --- | --- |
| Free | 1 boutique, fonctionnalités limitées | ❌ pas de notion de plan |
| Pro | plusieurs boutiques, analytics avancées, gestion employés | ❌ |
| Business | boutiques illimitées, rapports avancés, supervision multi-sites, IA et prédictions | ❌ |

Aucune infrastructure de facturation, de plan ou de limitation par palier n'existe dans le code actuel. Dépend aussi du multi-boutique (section 3) pour avoir un sens.

---

## 14. Stack Technique Recommandée

| Couche | Recommandé (cahier des charges) | Actuel | État |
| --- | --- | --- | --- |
| Frontend Mobile | React Native + Expo + TypeScript | React Native + Expo + TypeScript | ✅ conforme |
| Frontend Web | Next.js + TypeScript | inexistant (tout est mobile) | ❌ |
| Backend | Node.js + Express / NestJS | Express v5 + TypeScript | ✅ conforme (variante Express) |
| Base de données | PostgreSQL | Appwrite (BaaS) | ❌ écart — Appwrite gère DB + auth, pas Postgres |
| Temps réel | Supabase Realtime / Socket.io | aucun | ❌ |
| Authentification | JWT | Session Appwrite (Bearer token) | ⚠️ équivalent fonctionnel, pas du JWT applicatif custom |
| Déploiement | Vercel + Railway / Render | à confirmer | ⚠️ à vérifier — pas de config CI/CD trouvée (`ROADMAP.md` liste CI/CD comme non fait) |

---

## 15. Vision Long Terme

CONTROL pourra évoluer vers :
- [ ] gestion multi-entreprises — dépend de la section 3.
- [ ] IA de prédiction de ventes.
- [ ] intégration Mobile Money — actuellement "Mobile Money" n'est qu'un libellé de mode de paiement (`Cash` / `Mobile Money`), pas une intégration avec un opérateur (Orange Money, Wave, etc.).
- [ ] export comptable.
- [x] génération de rapports PDF — **déjà fait** (export bilan journalier en PDF, `exports` module + `expo-sharing`).
- [ ] synchronisation bancaire.
- [ ] gestion fournisseurs.
- [ ] gestion dettes clients.
- [ ] marketplace B2B.

---

## Lecture recommandée

1. ✅ Le chantier structurant (sections 3, 4, 6) est livré à l'état de **fondation** (session 2026-08-02) : `Organization` → plusieurs `Store`, isolation, sélecteur de boutique active. Ce qui reste dessus, non encore construit : vue agrégée entreprise, rentabilité comparée entre boutiques, permissions par boutique pour manager/comptable, monétisation par palier (sections 9, 11-partiel, 13, 15).
2. ✅ Les ajouts localisés indépendants sont livrés (session 2026-08-02) : rôles manager/comptable, fournisseur + détection d'anomalie stock, catégorisation fixe/variable des dépenses, photo justificative, alertes ventes suspectes et baisse d'activité. Il ne reste de ce côté que le calcul de rentabilité fine (marge, bénéfice net, produits les plus rentables — section 9, périmètre "Analytics avancés"), qui peut maintenant s'appuyer sur le multi-boutique livré pour la comparaison entre boutiques.
3. `ROADMAP.md` reste la source de vérité pour le détail d'implémentation fichier par fichier ; ce document sert de boussole produit pour prioriser les prochains chantiers par rapport à la vision initiale.
