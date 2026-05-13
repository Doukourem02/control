import { Card, ChoicePill, InfoRow, SectionTitle } from '@/components/seller-ui';
import { ScreenShell } from '@/components/screen-shell';
import { Text, View } from 'react-native';

const shortcuts = ['Vendre', 'Stock', 'Dépense', 'Caisse', 'Manquant', 'Bilan'];
const categories = ['Poisson', 'Glace', 'Transport', 'Sachet'];

export function CustomizeScreen() {
  return (
    <ScreenShell title="Personnaliser" subtitle="Choisir les raccourcis utiles pour la boutique">
      <Card accent="#F5F5F3">
        <Text style={{ color: '#171717', fontSize: 22, fontWeight: '900' }}>
          Raccourcis affichés
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {shortcuts.map((shortcut) => (
            <ChoicePill key={shortcut} label={shortcut} active />
          ))}
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle>Catégories rapides</SectionTitle>
        {categories.map((category) => (
          <InfoRow
            key={category}
            label="Catégorie"
            value={category}
            icon="shape-outline"
            accent="#7C3AED"
          />
        ))}
      </View>

      <InfoRow label="Ajouter" value="Créer une catégorie" icon="plus-circle-outline" accent="#111111" />
    </ScreenShell>
  );
}
