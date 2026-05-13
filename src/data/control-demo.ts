export const todaySummary = {
  revenue: '248 500 FCFA',
  profit: '76 200 FCFA',
  expenses: '42 000 FCFA',
  salesCount: 31,
  cashExpected: '206 500 FCFA',
  cashDeclared: '204 000 FCFA',
};

export const quickActions = ['Nouvelle vente', 'Ajouter depense', 'Entree stock', 'Sortie stock'];

export const products = [
  { name: 'Thon rouge', stock: '18 kg', price: '3 500 FCFA', margin: '31%', status: 'OK' },
  { name: 'Tilapia', stock: '6 kg', price: '2 000 FCFA', margin: '24%', status: 'Faible' },
  { name: 'Crevettes', stock: '2 kg', price: '5 500 FCFA', margin: '38%', status: 'Critique' },
  { name: 'Sole', stock: '11 kg', price: '4 000 FCFA', margin: '29%', status: 'OK' },
];

export const transactions = [
  { label: 'Vente thon rouge', meta: 'Cocody - 10:42', amount: '+35 000 FCFA' },
  { label: 'Achat glace', meta: 'Depense - 09:15', amount: '-8 000 FCFA' },
  { label: 'Vente tilapia', meta: 'Cocody - 08:54', amount: '+18 000 FCFA' },
];

export const stores = [
  { name: 'Poissonnerie Cocody', revenue: '248 500 FCFA', profit: '76 200 FCFA', status: 'Active' },
  { name: 'Poissonnerie Marcory', revenue: '184 000 FCFA', profit: '52 800 FCFA', status: 'Stock faible' },
  { name: 'Depot Riviera', revenue: '96 000 FCFA', profit: '21 500 FCFA', status: 'Calme' },
];

export const alerts = [
  {
    title: 'Ecart de caisse',
    detail: 'Poissonnerie Cocody - difference de 2 500 FCFA',
    level: 'danger',
  },
  {
    title: 'Stock critique',
    detail: 'Crevettes - il reste 2 kg a Marcory',
    level: 'warning',
  },
  {
    title: 'Baisse inhabituelle',
    detail: 'Depot Riviera - activite plus faible que lundi dernier',
    level: 'warning',
  },
];

export const weeklyRevenue = ['182k', '210k', '196k', '248k', '231k', '290k', '264k'];
