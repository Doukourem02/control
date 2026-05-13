import type { Href } from 'expo-router';

export const todaySummary = {
  revenue: '528 500 FCFA',
  salesCount: 31,
  cashExpected: '212 000 FCFA',
  cashDeclared: '209 500 FCFA',
  expenses: '42 000 FCFA',
};

export const weeklyRevenue = [128, 180, 154, 230, 205, 276, 318];

export const quickActions: { label: string; href: Href }[] = [
  { label: 'Nouvelle vente', href: '/sale' },
  { label: 'Stock', href: '/stock' },
  { label: 'Depense', href: '/expenses' },
  { label: 'Caisse', href: '/cash' },
];

export const transactions = [
  { label: 'Vente thon rouge', meta: 'Cocody - 10:42', amount: '+18 000 FCFA' },
  { label: 'Achat glace', meta: 'Depense - 09:15', amount: '-8 000 FCFA' },
  { label: 'Vente crevettes', meta: 'Marcory - 08:58', amount: '+14 000 FCFA' },
];

export const stores = [
  { name: 'Poissonnerie Cocody', status: 'Ouverte', revenue: '248 500 FCFA', profit: '74 000 FCFA' },
  { name: 'Poissonnerie Marcory', status: 'Ouverte', revenue: '174 000 FCFA', profit: '51 000 FCFA' },
  { name: 'Depot Riviera', status: 'Stock actif', revenue: '106 000 FCFA', profit: '25 500 FCFA' },
];

export const alerts = [
  { title: 'Ecart caisse Cocody', detail: '-2 500 FCFA apres cloture', level: 'danger' },
  { title: 'Stock faible crevettes', detail: '3 kg restants avant rupture', level: 'warning' },
  { title: 'Baisse ventes Marcory', detail: '-18% par rapport a hier', level: 'warning' },
];

export const products = [
  { name: 'Thon rouge', category: 'Poisson', stock: '18 kg', margin: '32%', price: '6 500 FCFA/kg', status: 'Disponible' },
  { name: 'Crevettes', category: 'Fruits de mer', stock: '3 kg', margin: '38%', price: '8 000 FCFA/kg', status: 'Critique' },
  { name: 'Carpe', category: 'Poisson', stock: '16 kg', margin: '29%', price: '4 500 FCFA/kg', status: 'Disponible' },
];

export const saleBasket = [
  { label: 'Thon rouge', quantity: '2 kg', amount: '13 000 FCFA' },
  { label: 'Crevettes', quantity: '2.4 kg', amount: '19 000 FCFA' },
];

export const cashChecks = [
  { label: 'Cash physique', value: '209 500 FCFA', status: 'saisi' },
  { label: 'Mobile money', value: '86 000 FCFA', status: 'confirme' },
  { label: 'Tickets', value: '31 ventes', status: 'ok' },
];
