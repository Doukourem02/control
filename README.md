# CONTROL Mobile

Application mobile Expo / React Native pour CONTROL.

## Concept

CONTROL est une plateforme de gestion commerciale pour boutiques, avec une seule application mobile qui affiche des interfaces differentes selon le role de l'utilisateur.

Roles prevus :

- Employe : ventes, stock, depenses, caisse.
- Proprietaire : dashboard, boutiques, alertes, rapports.

## Lancer le projet

```bash
npm run start
```

Commandes utiles :

```bash
npm run web
npm run android
npm run ios
```

## Structure actuelle

- `src/app` : routes et vues principales.
- `src/components/control-ui.tsx` : composants UI CONTROL reutilisables.
- `src/context/control-role.tsx` : role actif temporaire pour la maquette.
- `src/data/control-demo.ts` : donnees fictives pour les ecrans.

## Etat

Cette version est une maquette mobile minimale, sans backend.
