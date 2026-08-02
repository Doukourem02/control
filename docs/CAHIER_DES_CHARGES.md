# CONTROL — Cahier des Charges (conversion Markdown)

> Conversion en Markdown de `CONTROL_SaaS_Cahier_Des_Charges_V3.pdf`, transformée en checklist d'écart entre la vision produit et l'état actuel du code.
>
> Légende : ✅ fait · ⚠️ partiel / à confirmer · ❌ pas fait · — non applicable (narratif)
>
> Ce fichier reflète la **vision cible** (le PDF). Pour le suivi jour-le-jour de ce qui reste à coder, voir [`ROADMAP.md`](./ROADMAP.md) — les deux se complètent : celui-ci dit *où on veut aller*, `ROADMAP.md` dit *où on en est concrètement, fichier par fichier*.
>
> État vérifié dans le code le 2026-08-02 : backend = `activity, analytics, cash, categories, expenses, exports, health, missing, notifications, products, sales, shops, stock, team, users` (pas de module `organizations` ni `stores`) ; rôles actuels = `owner` / `seller` uniquement ; pas de `organizationId`/`storeId` ; pas de plans/pricing ; "Mobile Money" existe seulement comme libellé de mode de paiement, pas comme intégration.

---

## Vue d'ensemble — écart vision / réalité

| Bloc du cahier des charges | État |
| --- | --- |
| 1. Positionnement produit | — narratif |
| 2. Objectifs principaux | ⚠️ 4/7 acquis, multi-boutique et rentabilité fine manquants |
| 3. Architecture SaaS multi-tenant | ❌ pas commencé |
| 4. Structure logique (entités) | ⚠️ 4/6 entités existent, `Organization` et `Stores` manquent |
| 5. Application Employé (mobile) | ✅ quasi complet |
| 6. Dashboard Administrateur | ⚠️ solide sur 1 boutique, rien de multi-boutique/temps réel |
| 7. Gestion intelligente du stock | ⚠️ base solide, détection d'anomalies à confirmer |
| 8. Gestion financière | ⚠️ dépenses OK, catégorisation fixe/variable et photo à confirmer |
| 9. Calcul de rentabilité | ⚠️ CA/dépenses oui, marge/rentabilité produit non |
| 10. Notifications & anomalies | ⚠️ 2/5 types d'alertes couverts |
| 11. Gestion des permissions | ⚠️ 2/4 rôles existent (owner/seller), manager/comptable absents |
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
- [ ] créer une entreprise,
- [ ] créer plusieurs boutiques,
- [x] gérer plusieurs employés — module `team` (invitations, rôles, retrait).
- [ ] séparer ses activités commerciales.

Exemple visé :
- Boutique poissonnerie Cocody,
- Boutique poissonnerie Marcory,
- Dépôt Riviera.

Isolation des données visée :
- [ ] `organizationId`,
- [ ] `storeId`.

**État réel** : un compte = une boutique (`shopId`), avec une équipe qui la partage. Aucune notion d'entreprise mère regroupant plusieurs boutiques. C'est le plus gros écart structurel du cahier des charges — tout le reste (dashboard multi-boutique, rentabilité par boutique, permissions par boutique) en dépend.

---

## 4. Structure Logique du Système

| Entité | Description (cahier des charges) | État |
| --- | --- | --- |
| `Organization` | Entreprise principale du client | ❌ n'existe pas |
| `Stores` | Boutiques appartenant à une entreprise | ❌ n'existe pas (boutique unique) |
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

- [ ] ⚠️ vue globale entreprise — vue propriétaire existe mais à l'échelle d'une seule boutique, pas d'une entreprise multi-boutique.
- [ ] vue par boutique — pas de multi-boutique.
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
- [ ] ⚠️ fournisseur, prix d'achat — champs à confirmer dans le modèle produit/mouvement.

**Sorties de stock** (visé : vente, perte, produit abîmé, consommation interne, erreur d'inventaire) :
- [x] vente — mouvement de type vente.
- [x] perte / manquant — module `missing`.
- [ ] ⚠️ produit abîmé, consommation interne, erreur d'inventaire comme catégories distinctes — à confirmer, probablement regroupées sous "manquant" aujourd'hui plutôt que finement typées.

- [ ] ⚠️ Détection automatique des anomalies — l'alerte "stock faible" existe (seuil configurable), mais pas de détection d'anomalie générique (ex. sortie de stock incohérente avec l'historique).

---

## 8. Gestion Financière

> CONTROL doit intégrer une gestion financière simplifiée.

**Dépenses fixes** (loyer, électricité, eau, internet, salaires) et **dépenses variables** (achats fournisseurs, transport, glace, carburant, réparations) :
- [x] Le module `expenses` existe et couvre la saisie de dépenses.
- [ ] ⚠️ La distinction fixe/variable comme catégorisation structurée est à confirmer.

- [ ] ⚠️ Photo justificative par dépense — non confirmée dans le code actuel, probablement pas encore là.

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
- [ ] ⚠️ écart de stock — existe pour le seuil bas configurable, pas pour un écart générique entrée/sortie.
- [x] écart de caisse — notification après chaque clôture avec écart ≠ 0.
- [ ] ventes suspectes — non implémenté.
- [ ] baisse inhabituelle (d'activité/ventes) — non implémenté.
- [ ] ⚠️ absence d'activité — le rappel de clôture oubliée s'en approche mais ce n'est pas la même chose qu'une détection d'inactivité générale.
- [x] stock faible.

2 alertes sur 5 sont couvertes précisément comme décrites ; les 2 "⚠️" s'en rapprochent sans les couvrir totalement.

---

## 11. Gestion des Permissions

Rôles visés : propriétaire, manager, vendeuse, comptable.

- [x] propriétaire (`owner`).
- [ ] manager — rôle inexistant aujourd'hui.
- [x] vendeuse (`seller`).
- [ ] comptable — rôle inexistant aujourd'hui.

Le modèle actuel (`Control/lib/control-auth.tsx`) ne connaît que `'owner' | 'seller'`. Passer à 4 rôles avec permissions fines par rôle est un chantier à part entière (et logiquement lié au multi-boutique : un manager ou un comptable a probablement une portée par boutique).

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

1. Le chantier structurant qui débloque une bonne partie du reste (sections 3, 6, 9, 11, 13, 15) est le **multi-tenant multi-boutique** (`Organization` → plusieurs `Store`). Tant qu'il n'est pas là, "rentabilité par boutique", "permissions par boutique" et "monétisation par palier" n'ont pas de sol pour tenir.
2. Le reste des écarts (rôles manager/comptable, catégorisation fixe/variable des dépenses, photo justificative, détection d'anomalies fine) sont des ajouts localisés, indépendants les uns des autres — faisables un par un sans dépendance structurelle.
3. `ROADMAP.md` reste la source de vérité pour le détail d'implémentation fichier par fichier ; ce document sert de boussole produit pour prioriser les prochains chantiers par rapport à la vision initiale.
