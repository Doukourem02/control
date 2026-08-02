import type { NotificationRow } from '@/lib/control-data';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

export function NotificationsCenterModal({
  visible,
  compact,
  notifications,
  onClose,
  onRead,
  onReadAll,
}: {
  visible: boolean;
  compact: boolean;
  notifications: NotificationRow[];
  onClose: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  const unreadCount = notifications.filter((n) => n.read === 'false').length;

  const typeLabel: Record<string, string> = {
    stock_low: 'Stock faible',
    closure_reminder: 'Clôture oubliée',
    cash_gap: 'Écart de caisse',
  };

  function formatRelativeDate(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days} j`;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.24)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            maxHeight: '80%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              marginBottom: 4,
            }}
          >
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={{ color: '#8E8E8E', fontSize: 13 }}>
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {unreadCount > 0 && (
                <Pressable
                  onPress={onReadAll}
                  style={({ pressed }: { pressed: boolean }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 12,
                    backgroundColor: '#F5F5F5',
                    opacity: pressed ? 0.68 : 1,
                  })}
                >
                  <Text style={{ color: '#111111', fontSize: 13, fontWeight: '600' }}>
                    Tout lire
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={({ pressed }: { pressed: boolean }) => ({
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#F5F5F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.68 : 1,
                })}
              >
                <Feather name="x" size={20} color="#111111" />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={{ marginTop: 8 }}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="bell-outline" size={40} color="#D0D0D0" />
                <Text style={{ color: '#A0A0A0', fontSize: 15, marginTop: 12 }}>
                  Aucune notification
                </Text>
              </View>
            ) : (
              notifications.map((notif) => (
                <Pressable
                  key={notif.$id}
                  onPress={() => notif.read === 'false' && onRead(notif.$id)}
                  style={({ pressed }: { pressed: boolean }) => ({
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                    backgroundColor: notif.read === 'false' ? '#F5F8FF' : '#FAFAFA',
                    borderRadius: 16,
                    padding: 14,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: notif.read === 'false' ? '#E8F0FF' : '#F0F0F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={
                        notif.type === 'stock_low'
                          ? 'package-variant-closed'
                          : notif.type === 'cash_gap'
                            ? 'cash-minus'
                            : 'bell-ring-outline'
                      }
                      size={18}
                      color={notif.read === 'false' ? '#4C9BFF' : '#A0A0A0'}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={{
                          color: '#111111',
                          fontSize: 14,
                          fontWeight: notif.read === 'false' ? '700' : '600',
                          flex: 1,
                        }}
                      >
                        {notif.title}
                      </Text>
                      {notif.read === 'false' && (
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 4,
                            backgroundColor: '#4C9BFF',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </View>
                    <Text style={{ color: '#5A5A5A', fontSize: 13, lineHeight: 18 }}>
                      {notif.message}
                    </Text>
                    <Text style={{ color: '#A0A0A0', fontSize: 12, marginTop: 2 }}>
                      {typeLabel[notif.type] ?? notif.type} · {formatRelativeDate(notif.$createdAt)}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
