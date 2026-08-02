/**
 * Palette centralisée de l'app — calée sur le bleu du logo (#0A74FE).
 *
 * Avant ce fichier, les couleurs étaient écrites en dur dans chaque écran :
 * une douzaine de gris et 4 bleus quasi identiques mais non harmonisés,
 * utilisés au coup par coup selon l'écran. Le bleu du logo est désormais
 * la seule couleur de marque (CTA, liens, icône active) ; le vert et le
 * rouge redeviennent purement sémantiques (positif / négatif), jamais
 * utilisés comme accent de marque. Toute nouvelle couleur doit être
 * ajoutée ici plutôt que codée en dur dans un composant.
 */
export const colors = {
  white: '#FFFFFF',
  paper: '#F5F6FA',
  ink: '#15151C',

  // Échelle de gris légèrement froide, cohérente avec le bleu du logo
  gray50: '#F0F2F8',
  gray100: '#E7E9F1',
  gray200: '#DCDFEA',
  gray300: '#C5C9D9',
  gray400: '#A5AABE',
  gray500: '#84899E',
  gray600: '#666B80',
  gray700: '#494D60',
  gray800: '#2A2C38',
  gray900: '#17171F',

  // Bleu principal — la couleur du logo, appliquée partout (CTA, liens, icône active)
  primary: '#0A74FE',
  primaryMuted: '#4E9BFF',
  primaryDisabled: '#B9D6FF',
  primarySoft: '#E4EFFF',

  // Vert (succès, valeurs positives — sémantique uniquement)
  success: '#1E8E5A',
  successMuted: '#34A873',
  successSoft: '#E1F3EA',

  // Rouge (erreurs, destructif, valeurs négatives — sémantique uniquement)
  danger: '#D6453D',
  dangerDark: '#B03028',
  dangerSoft: '#FBE4E2',

  // Ambre (avertissements, mode hors-ligne)
  warning: '#C98A1D',
  warningDark: '#8A5F13',
  warningSoft: '#FBEED9',

  // Accents catégoriels (tuiles d'action, graphiques) : terre cuite + bleu profond
  accentOrange: '#C9663D',
  accentOrangeSoft: '#F6E7DD',
  accentDeep: '#0B3FA0',
  accentDeepSoft: '#E1E9F7',
} as const;

export type ThemeColor = keyof typeof colors;
