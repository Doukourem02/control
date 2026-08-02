import { useControlAuth } from '@/lib/control-auth';
import {
  getTeamMembers,
  inviteTeamMember,
  joinShop,
  removeTeamMember,
  type MemberRow,
} from '@/lib/control-data';
import { getControlErrorMessage } from '@/lib/control-errors';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { formatInviteExpiry, getInitials } from '../utils';

export function TeamSettingsModal({
  visible,
  compact,
  startOnJoin,
  onClose,
  onJoined,
}: {
  visible: boolean;
  compact: boolean;
  startOnJoin?: boolean;
  onClose: () => void;
  onJoined?: () => Promise<void>;
}) {
  const { session } = useControlAuth();
  const ownerName = session?.shop.ownerName || session?.user.name || 'Proprietaire';
  const ownerEmail = session?.user.email || '';
  const userId = session?.user.id ?? '';
  const shopId = session?.shop.$id ?? '';
  const isOwner = session?.user.accountRole
    ? session.user.accountRole === 'owner'
    : !userId || !shopId || userId === shopId;

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  function flash(msg: string, ok = false) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3500);
  }

  useEffect(() => {
    if (!visible) return;
    setLoadingMembers(true);
    getTeamMembers()
      .then(setMembers)
      .finally(() => setLoadingMembers(false));
  }, [visible]);

  useEffect(() => {
    if (!visible || !startOnJoin) return;

    setInviteVisible(false);
    setJoinVisible(true);
  }, [startOnJoin, visible]);

  async function handleInvite() {
    if (inviteLoading) return;
    setInviteLoading(true);
    try {
      const member = await inviteTeamMember({ name: inviteName, email: inviteEmail });
      setMembers((prev) => [member, ...prev]);
      setInviteName('');
      setInviteEmail('');
      setInviteVisible(false);
      flash(`Code d'invitation : ${member.inviteCode}`, true);
    } catch (err: any) {
      flash(getControlErrorMessage(err));
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemove(memberId: string) {
    try {
      await removeTeamMember(memberId);
      setMembers((prev) => prev.filter((m) => m.$id !== memberId));
    } catch (err: any) {
      flash(getControlErrorMessage(err));
    }
  }

  async function handleJoin() {
    if (joinLoading) return;
    setJoinLoading(true);
    try {
      await joinShop(joinCode.trim().toUpperCase());
      await onJoined?.();
      setJoinCode('');
      setJoinVisible(false);
      flash('Tu as rejoint la boutique.', true);
    } catch (err: any) {
      flash(getControlErrorMessage(err));
    } finally {
      setJoinLoading(false);
    }
  }

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.24)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <ScrollView
          style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: compact ? 24 : 34, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Equipe</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>Proprietaire, vendeuses et acces</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F5F5',
                alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color="#111111" />
            </Pressable>
          </View>

          {/* Feedback */}
          {feedback ? (
            <View style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: feedback.ok ? '#E8F8F0' : '#FFF3CD' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: feedback.ok ? '#08784F' : '#856404' }}>{feedback.msg}</Text>
            </View>
          ) : null}

          {/* Proprietaire */}
          <View style={{ borderRadius: 20, backgroundColor: '#F7F7F7', padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F4EF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#08784F', fontSize: 15, fontWeight: '800' }}>{getInitials(ownerName)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>{ownerName}</Text>
                {ownerEmail ? <Text numberOfLines={1} style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 1 }}>{ownerEmail}</Text> : null}
              </View>
              <Text style={{ color: '#08784F', fontSize: 11, fontWeight: '800' }}>Owner</Text>
            </View>
          </View>

          {/* Membres actifs */}
          {loadingMembers ? (
            <ActivityIndicator size="small" color="#111111" style={{ alignSelf: 'center', marginVertical: 8 }} />
          ) : activeMembers.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Vendeuses actives</Text>
              {activeMembers.map((m) => (
                <View key={m.$id} style={{ borderRadius: 16, backgroundColor: '#F7F7F7', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#EAF0FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#2A5BE8', fontSize: 13, fontWeight: '800' }}>{getInitials(m.name || m.email)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>{m.name || m.email}</Text>
                    {m.name ? <Text numberOfLines={1} style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600' }}>{m.email}</Text> : null}
                  </View>
                  {isOwner ? (
                    <Pressable
                      onPress={() => handleRemove(m.$id)}
                      style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
                    >
                      <Feather name="x" size={16} color="#BBBBBB" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* Invitations en attente */}
          {isOwner && pendingMembers.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>En attente</Text>
              {pendingMembers.map((m) => (
                <View key={m.$id} style={{ borderRadius: 16, backgroundColor: '#F7F7F7', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="clock" size={15} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>{m.name || m.email}</Text>
                    <Text style={{ color: '#8B5CF6', fontSize: 12, fontWeight: '700', marginTop: 1 }}>Code : {m.inviteCode}</Text>
                    <Text style={{ color: '#8E8E8E', fontSize: 11, fontWeight: '700', marginTop: 1 }}>
                      {formatInviteExpiry(m.expiresAt, m.$createdAt)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemove(m.$id)}
                    style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
                  >
                    <Feather name="x" size={16} color="#BBBBBB" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {/* Inviter (owner) */}
          {isOwner ? (
            inviteVisible ? (
              <View style={{ borderRadius: 20, backgroundColor: '#F7F7F7', padding: 14, gap: 10 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Inviter une vendeuse</Text>
                <TextInput
                  placeholder="Nom"
                  value={inviteName}
                  onChangeText={setInviteName}
                  placeholderTextColor="#AAAAAA"
                  style={{ height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, color: '#111111', fontWeight: '600' }}
                />
                <TextInput
                  placeholder="Email"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#AAAAAA"
                  style={{ height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, color: '#111111', fontWeight: '600' }}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => { setInviteVisible(false); setInviteName(''); setInviteEmail(''); }}
                    style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleInvite}
                    style={({ pressed }: { pressed: boolean }) => ({ flex: 2, height: 42, borderRadius: 12, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', opacity: pressed || inviteLoading ? 0.68 : 1 })}
                  >
                    {inviteLoading
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Generer le code</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setInviteVisible(true)}
                style={({ pressed }: { pressed: boolean }) => ({
                  height: 48, borderRadius: 18, backgroundColor: '#111111', flexDirection: 'row',
                  alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.68 : 1,
                })}
              >
                <Feather name="user-plus" size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Inviter une vendeuse</Text>
              </Pressable>
            )
          ) : null}

          {/* Rejoindre (seller / new user) */}
          {!isOwner ? (
            joinVisible ? (
              <View style={{ borderRadius: 20, backgroundColor: '#F0F4FF', padding: 14, gap: 10 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Rejoindre une boutique</Text>
                <TextInput
                  placeholder="Code d'invitation (ex. A3F9C2)"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  placeholderTextColor="#AAAAAA"
                  style={{ height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, color: '#111111', fontWeight: '700', letterSpacing: 2 }}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => { setJoinVisible(false); setJoinCode(''); }}
                    style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: '#DDEAFF', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#2A5BE8', fontSize: 14, fontWeight: '700' }}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleJoin}
                    style={({ pressed }: { pressed: boolean }) => ({ flex: 2, height: 42, borderRadius: 12, backgroundColor: '#2A5BE8', alignItems: 'center', justifyContent: 'center', opacity: pressed || joinLoading ? 0.68 : 1 })}
                  >
                    {joinLoading
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Rejoindre</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setJoinVisible(true)}
                style={({ pressed }: { pressed: boolean }) => ({
                  height: 48, borderRadius: 18, backgroundColor: '#F0F4FF', flexDirection: 'row',
                  alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.68 : 1,
                })}
              >
                <Feather name="log-in" size={16} color="#2A5BE8" />
                <Text style={{ color: '#2A5BE8', fontSize: 14, fontWeight: '700' }}>Rejoindre une boutique</Text>
              </Pressable>
            )
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
