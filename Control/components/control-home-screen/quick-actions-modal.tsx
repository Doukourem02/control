import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, Text, View } from 'react-native';
import { quickActions } from './shared-ui';

export function QuickActionsModal({
  visible,
  compact,
  onClose,
  onOpenSale,
  onOpenStock,
  onOpenClosure,
  onOpenExpense,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
  onOpenSale: () => void;
  onOpenStock: () => void;
  onOpenClosure: () => void;
  onOpenExpense: () => void;
}) {
  const handlers: Record<string, () => void> = {
    Vente: onOpenSale,
    Stock: onOpenStock,
    Clôture: onOpenClosure,
    Sortie: onOpenExpense,
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.24)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            gap: 10,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <Text style={{ color: '#111111', fontSize: 20, fontWeight: '800' }}>Actions rapides</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={18} color="#111111" />
            </Pressable>
          </View>

          {quickActions.map((action) => (
            <Pressable
              key={action.title}
              onPress={() => {
                handlers[action.title]?.();
                onClose();
              }}
              style={({ pressed }: { pressed: boolean }) => ({
                minHeight: 64,
                borderRadius: 20,
                borderCurve: 'continuous',
                backgroundColor: '#F7F7F7',
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  borderCurve: 'continuous',
                  backgroundColor: action.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {action.icon.family === 'material' ? (
                  <MaterialCommunityIcons name={action.icon.name} size={22} color="#FFFFFF" />
                ) : (
                  <Feather name={action.icon.name} size={22} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#111111', fontSize: 16, fontWeight: '700' }}>{action.title}</Text>
                <Text style={{ color: '#8E8E8E', fontSize: 13, marginTop: 1 }}>{action.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#B0B0B0" />
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
