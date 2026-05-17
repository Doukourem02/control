# CONTROL V1 - Checklist Implementation

## Objectif V1

Permettre au proprietaire qui a confie sa boutique a une vendeuse de suivre l'activite reelle sans etre physiquement present :

- [ ] ventes
- [ ] depenses
- [ ] stock
- [ ] pertes / manquants
- [ ] argent attendu
- [ ] argent reel
- [ ] ecarts
- [ ] dernieres actions

Hors scope V1 :

- pas de SaaS complet
- pas d'IA
- pas de marketplace
- pas de credit client dans les ventes

## Probleme Principal

> J'ai investi mon argent et je veux comprendre ce qu'il se passe sans etre physiquement present.

Le produit doit donc repondre d'abord a une question simple :

> Est-ce que l'argent, le stock et les actions declarees correspondent a la realite de la boutique ?

## Architecture V1

La V1 doit etre construite autour de quelques modeles simples, persistants et faciles a auditer.

Modeles centraux :

```ts
type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: 'kg' | 'piece' | 'carton' | 'tas' | 'unite';
  purchaseUnitPrice: number;
  sellingUnitPrice: number;
  createdAt: string;
  updatedAt: string;
};

type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: 'initial' | 'supply' | 'sale' | 'missing' | 'adjustment';
  quantity: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  note?: string;
  createdAt: string;
};

type Sale = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Mobile Money';
  createdAt: string;
};

type Expense = {
  id: string;
  category: 'transport' | 'courant' | 'sachets' | 'eau' | 'salaire' | 'imprevu' | 'nettoyage';
  amount: number;
  note?: string;
  createdAt: string;
};

type Missing = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  reason: 'perdu' | 'abime' | 'erreur' | 'consommation interne';
  note?: string;
  createdAt: string;
};

type CashClosure = {
  id: string;
  businessDate: string;
  cashSalesAmount: number;
  mobileMoneySalesAmount: number;
  expensesAmount: number;
  physicalCashExpected: number;
  physicalCashActual: number;
  cashGap: number;
  createdAt: string;
};

type ActivityLog = {
  id: string;
  type: 'stock' | 'sale' | 'expense' | 'missing' | 'cash';
  actorName: string;
  message: string;
  createdAt: string;
};
```

Regles importantes :

- [ ] chaque action met a jour le modele principal concerne
- [ ] chaque action ajoute une entree dans `ActivityLog`
- [ ] chaque changement de stock ajoute une entree dans `StockMovement`
- [ ] les ventes Mobile Money ne doivent pas etre melangees avec le cash physique
- [ ] la fermeture de journee doit figer un snapshot de la journee
- [ ] les calculs doivent utiliser une vraie date de journee commerciale

## Flux Reel V1

Premiere utilisation :

- [ ] creer le stock initial reel de la boutique
- [ ] ajouter les produits reellement presents
- [ ] commencer les ventes
- [ ] declarer les depenses
- [ ] declarer les pertes / manquants
- [ ] fermer la journee
- [ ] consulter le bilan

Flux quotidien :

- [ ] approvisionnement
- [ ] vente
- [ ] depense
- [ ] manquant
- [ ] caisse
- [ ] controle

## Priorite 0 - Persistance Locale

Aujourd'hui, les donnees disparaissent au redemarrage de l'application. Avant d'ajouter trop de fonctionnalites, il faut rendre les donnees persistantes.

- [ ] choisir la strategie de stockage locale
- [ ] privilegier SQLite si on veut une base solide pour l'historique
- [ ] sinon utiliser AsyncStorage pour une V1 tres rapide
- [ ] persister les produits
- [ ] persister les ventes
- [ ] persister les depenses
- [ ] persister les manquants
- [ ] persister les fermetures de caisse
- [ ] charger les donnees au demarrage
- [ ] gerer un etat de chargement initial
- [ ] verifier qu'un redemarrage conserve toutes les donnees

## Priorite 1 - Modele Stock

Le stock ne doit pas fonctionner uniquement en kilogrammes. Dans une boutique reelle, les produits peuvent etre suivis en kg, piece, carton, tas ou unite.

Modele cible `Product` :

```ts
type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: 'kg' | 'piece' | 'carton' | 'tas' | 'unite';
  purchaseUnitPrice: number;
  sellingUnitPrice: number;
  createdAt: string;
  updatedAt: string;
};
```

Checklist :

- [ ] remplacer `quantityKg` par `quantity`
- [ ] ajouter `unit`
- [ ] remplacer `purchaseAmount` par `purchaseUnitPrice` si le montant est un prix unitaire
- [ ] enregistrer les couts totaux d'arrivage dans `StockMovement`
- [ ] remplacer `salePricePerKg` par `sellingUnitPrice`
- [ ] afficher l'unite partout dans l'application
- [ ] permettre la selection de l'unite lors de l'ajout de stock
- [ ] adapter le total stock pour ne plus additionner des kg avec des pieces/cartons
- [ ] afficher le stock par produit plutot qu'un total global trompeur
- [ ] verifier les ecrans stock, vente, manquant, bilan

## Priorite 2 - Approvisionnement

Quand un nouvel arrivage est achete, l'application doit permettre d'ajouter ou d'augmenter un stock existant.

- [ ] ajouter un nouveau produit
- [ ] ajouter une quantite a un produit existant
- [ ] enregistrer le cout total d'achat
- [ ] enregistrer le prix de vente
- [ ] enregistrer la date d'approvisionnement
- [ ] ajouter une entree dans le journal d'activite
- [ ] afficher les derniers approvisionnements

## Priorite 3 - Vente

La vente doit rester simple pour la V1.

Paiements V1 :

- [ ] Cash
- [ ] Mobile Money

Hors scope V1 :

- retirer Credit

Modele cible `Sale` :

```ts
type Sale = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Mobile Money';
  createdAt: string;
};
```

Checklist :

- [ ] retirer l'option `Credit` de l'ecran vente
- [ ] sauvegarder vraiment `paymentMethod`
- [ ] calculer le total avec `quantity * sellingUnitPrice`
- [ ] retirer la quantite vendue du stock
- [ ] bloquer la vente si la quantite demandee depasse le stock
- [ ] enregistrer la vente avec une vraie date
- [ ] ajouter la vente dans le journal d'activite
- [ ] afficher les dernieres ventes

## Priorite 4 - Depenses

Categories V1 :

- [ ] transport
- [ ] courant
- [ ] sachets
- [ ] eau
- [ ] salaire
- [ ] imprevu
- [ ] nettoyage

Checklist :

- [ ] aligner les categories de l'app sur la V1
- [ ] enregistrer le montant
- [ ] considerer les depenses V1 comme des sorties de cash physique
- [ ] enregistrer une note optionnelle
- [ ] enregistrer la date
- [ ] ajouter la depense dans le journal d'activite
- [ ] afficher les dernieres depenses
- [ ] reporter correctement les depenses dans la caisse

Plus tard :

- [ ] photo justificative

## Priorite 5 - Manquants / Pertes

Raisons V1 :

- [ ] perdu
- [ ] abime
- [ ] erreur
- [ ] consommation interne

Checklist :

- [ ] aligner les raisons de l'app sur la V1
- [ ] selectionner le produit concerne
- [ ] saisir la quantite manquante
- [ ] retirer la quantite du stock
- [ ] enregistrer une note optionnelle
- [ ] enregistrer la date
- [ ] ajouter le manquant dans le journal d'activite
- [ ] afficher l'historique des manquants

## Priorite 6 - Fermeture Journee

La fermeture doit comparer ce qui est attendu avec ce qui est reel.

Afficher :

- [ ] ventes
- [ ] depenses
- [ ] total ventes
- [ ] cash attendu
- [ ] mobile money attendu
- [ ] argent physique attendu
- [ ] argent physique reel
- [ ] ecart caisse

Checklist :

- [ ] calculer `total ventes = ventes cash + ventes mobile money`
- [ ] calculer `argent physique attendu = ventes cash - depenses cash`
- [ ] afficher Mobile Money separement du cash physique
- [ ] saisir l'argent physique reel
- [ ] calculer `ecart caisse = argent physique reel - argent physique attendu`
- [ ] enregistrer une fermeture de journee
- [ ] figer un snapshot de la journee fermee
- [ ] afficher la derniere fermeture
- [ ] ajouter la fermeture dans le journal d'activite
- [ ] associer chaque fermeture a une `businessDate`
- [ ] empecher les confusions entre plusieurs jours commerciaux

## Priorite 7 - Historique Reel

Les filtres doivent utiliser de vraies dates, pas seulement des totaux en memoire.

- [ ] filtrer aujourd'hui
- [ ] filtrer semaine
- [ ] filtrer mois
- [ ] afficher les ventes par periode
- [ ] afficher les depenses par periode
- [ ] afficher les manquants par periode
- [ ] afficher les fermetures par periode
- [ ] verifier les calculs quand plusieurs jours existent

## Priorite 8 - Journal Activite

Le journal doit permettre au proprietaire de comprendre ce qui s'est passe rapidement.

Exemples :

- [ ] Fatou a vendu du maquereau
- [ ] Fatou a ajoute du stock
- [ ] Fatou a declare une perte
- [ ] Fatou a ferme la caisse

Modele possible :

```ts
type ActivityLog = {
  id: string;
  type: 'stock' | 'sale' | 'expense' | 'missing' | 'cash';
  actorName: string;
  message: string;
  createdAt: string;
};
```

Checklist :

- [ ] creer le modele `ActivityLog`
- [ ] enregistrer une activite pour chaque action importante
- [ ] afficher les dernieres actions sur l'accueil
- [ ] afficher les dernieres actions dans la vue proprietaire

## Priorite 9 - Vue Proprietaire

Vue mobile simple :

- [ ] ventes du jour
- [ ] depenses du jour
- [ ] argent attendu
- [ ] derniers ecarts
- [ ] stock faible
- [ ] dernieres actions

Checklist :

- [ ] creer une vue synthetique orientee proprietaire
- [ ] eviter les details inutiles
- [ ] mettre en avant les anomalies
- [ ] rendre les montants faciles a lire
- [ ] rendre les actions recentes visibles rapidement

## Priorite 10 - Auth, Roles, Backend, Sync

Cette partie vient apres la V1 locale fonctionnelle, sauf si le proprietaire doit consulter les donnees depuis un autre telephone des la premiere version testable.

Roles :

- [ ] proprietaire
- [ ] vendeuse

Backend :

- [ ] choisir le backend
- [ ] synchroniser les produits
- [ ] synchroniser les ventes
- [ ] synchroniser les depenses
- [ ] synchroniser les manquants
- [ ] synchroniser les fermetures
- [ ] gerer les conflits de synchronisation

## Ordre de Developpement Propose

### Semaine 1 - Base Reelle

- [ ] persistance locale
- [ ] refonte modele stock avec unites
- [ ] vente avec `paymentMethod`
- [ ] retrait du credit
- [ ] categories depenses V1
- [ ] raisons manquants V1

### Semaine 2 - Controle Journee

- [ ] fermeture journee
- [ ] historique avec vraies dates
- [ ] bilan jour / semaine / mois
- [ ] journal d'activite local

### Semaine 3 - Roles

- [ ] auth locale ou simple simulation de role
- [ ] vue vendeuse
- [ ] vue proprietaire
- [ ] restrictions d'actions selon le role

### Semaine 4 - Backend

- [ ] schema backend
- [ ] API ou client data
- [ ] liaison compte proprietaire / boutique
- [ ] premiere synchronisation

### Semaine 5 - Synchronisation

- [ ] sync automatique
- [ ] etat hors-ligne
- [ ] reprise apres erreur
- [ ] verification multi-telephone

## Definition De Fini V1

La V1 est consideree utilisable quand :

- [ ] un stock initial peut etre cree
- [ ] une vente retire bien du stock
- [ ] une depense reduit bien l'argent attendu
- [ ] un manquant retire bien du stock
- [ ] une fermeture compare argent attendu et argent reel
- [ ] les donnees restent apres redemarrage
- [ ] l'historique affiche les bonnes periodes
- [ ] le proprietaire peut comprendre la journee en moins de 30 secondes

## Rappel Produit

Ne pas partir directement vers un SaaS geant.

La V1 doit rester concentree sur :

> Approvisionnement -> Vente -> Depense -> Caisse -> Controle.
