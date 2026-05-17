# Guide des unités — CONTROL

## `piece` — tu vends des objets entiers qu'on compte
- Poulet entier → 40 poulets = quantité `40`, unité `piece`
- Tu vends : 1 poulet = 3 000 F, demi poulet = quantité `0.5` = 2 000 F (montant modifiable)

## `kg` — tu vends au poids, tu pèses à la vente
- Viande de bœuf → tu as 15 kg, tu vends à 5 000 F/kg
- Tu vends : le client dit "donne-moi 2 kg" → quantité `2`

## `carton` — tu vends des cartons entiers (pas ce qui est dedans)
- Tu vends le carton en entier à un revendeur → quantité `20 cartons`, prix `15 000 F/carton`
- ⚠️ Si tu vends le contenu du carton à l'unité → utilise `piece` à la place

## `tas` — tu vends par petits tas
- Tomates en tas → quantité `30 tas`, prix `200 F/tas`

## `unite` — fourre-tout pour ce qui ne rentre dans aucune autre catégorie
- Sachet d'eau, boîte de conserve, etc.

---

## Résumé

| Produit | Unité | Quantité |
|---|---|---|
| Poisson individuel | `piece` | nombre de poissons |
| Poulet entier | `piece` | nombre de poulets |
| Viande pesée | `kg` | poids total |
| Carton vendu entier | `carton` | nombre de cartons |
