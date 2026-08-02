import { toExperienceRole, useControlAuth } from '@/lib/control-auth';
import {
  defineAccountRole,
  flushOfflineQueue,
  getNotifications,
  getRecentStockMovements,
  getShopLogoUri,
  getTeamMembers,
  getTodaySummary,
  markAllNotificationsRead,
  markNotificationRead,
  type MemberRow,
  type NotificationRow,
  type StockMovementRow,
  type TodaySummary,
} from '@/lib/control-data';
import { getControlErrorMessage, logControlError } from '@/lib/control-errors';
import { useNetworkStatus } from '@/lib/network-state';
import { colors } from '@/lib/theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MissingMenu } from './missing-menu';
import { NotificationsCenterModal } from './notifications-center-modal';
import { ProfileMenu } from './profile-menu';
import { QuickActionsModal } from './quick-actions-modal';
import { ReportMenu, StockMovementItem } from './report-menu';
import { AlertsSettingsModal } from './settings/alerts-settings-modal';
import { CashSettingsModal } from './settings/cash-settings-modal';
import { DataSettingsModal } from './settings/data-settings-modal';
import { DisplaySettingsModal } from './settings/display-settings-modal';
import { RoleSetupModal } from './settings/role-setup-modal';
import { ShopSettingsModal } from './settings/shop-settings-modal';
import { StoresSettingsModal } from './settings/stores-settings-modal';
import { TeamSettingsModal } from './settings/team-settings-modal';
import { BottomNav, type ControlExperienceRole, type NavKey } from './shared-ui';
import { formatMoney, getInitials, isAmountsVisibleByDefault, needsShopSetup, todayDateKey } from './utils';

export type { ControlExperienceRole } from './shared-ui';

export function ControlHomeScreen({ experienceRole }: { experienceRole?: ControlExperienceRole }) {
  const router = useRouter();
  const { session, refreshSession } = useControlAuth();
  const activeRole = experienceRole ?? toExperienceRole(session?.user.accountRole) ?? null;
  const isOffline = useNetworkStatus();
  const prevOfflineRef = useRef(false);
  const [activeMenu, setActiveMenu] = useState<NavKey>('home');
  const [amountsVisible, setAmountsVisible] = useState(true);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [dashboardMembers, setDashboardMembers] = useState<MemberRow[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementRow[]>([]);
  const [roleSetupVisible, setRoleSetupVisible] = useState(false);
  const [roleSetupLoading, setRoleSetupLoading] = useState(false);
  const [roleSetupError, setRoleSetupError] = useState('');
  const [shopSettingsVisible, setShopSettingsVisible] = useState(false);
  const [storesSettingsVisible, setStoresSettingsVisible] = useState(false);
  const [cashSettingsVisible, setCashSettingsVisible] = useState(false);
  const [displaySettingsVisible, setDisplaySettingsVisible] = useState(false);
  const [alertsSettingsVisible, setAlertsSettingsVisible] = useState(false);
  const [teamSettingsVisible, setTeamSettingsVisible] = useState(false);
  const [teamJoinFirst, setTeamJoinFirst] = useState(false);
  const [dataSettingsVisible, setDataSettingsVisible] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [todaySummary, setTodaySummary] = useState<TodaySummary>({
    cashSalesAmount: 0,
    mobileMoneySalesAmount: 0,
    expensesAmount: 0,
    physicalCashExpected: 0,
    salesCount: 0,
    expensesCount: 0,
    latestCashGap: 0,
    closureCount: 0,
    isClosed: false,
  });
  const promptedShopSetup = useRef(false);
  const appliedDisplayDefaults = useRef<string | null>(null);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const compact = height < 900;
  const contentWidth = Math.min(width, 520);
  // ===== TEMP PREVIEW DATA — a supprimer avant livraison =====
  // Objectif : juger le rendu visuel avec un ecran "plein" pendant la session de design.
  // Pour revenir aux vraies donnees : supprimer ce bloc et restaurer les lignes commentees en dessous.
  const PREVIEW_MODE = true;
  const previewCashSales = 128000;
  const previewMobileSales = 96500;
  const previewExpenses = 42000;
  const previewGap = -3500;
  const previewMovements: StockMovementRow[] = [
    {
      $id: 'preview-1',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      shopId: 'preview',
      productId: 'preview-product-1',
      productName: 'Tilapia frais',
      type: 'sale',
      quantity: 4,
      unit: 'kg',
      unitCost: 3500,
      totalCost: 14000,
      note: '',
    },
    {
      $id: 'preview-2',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      shopId: 'preview',
      productId: 'preview-product-2',
      productName: 'Carpe',
      type: 'supply',
      quantity: 20,
      unit: 'kg',
      unitCost: 2800,
      totalCost: 56000,
      note: '',
    },
    {
      $id: 'preview-3',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      shopId: 'preview',
      productId: 'preview-product-3',
      productName: 'Crevettes',
      type: 'missing',
      quantity: 1,
      unit: 'kg',
      unitCost: 6000,
      totalCost: 6000,
      note: '',
    },
  ];
  // ===== FIN TEMP PREVIEW DATA =====

  const expectedCashAmount = PREVIEW_MODE
    ? previewCashSales + previewMobileSales - previewExpenses
    : todaySummary.physicalCashExpected;
  const displayedCashAmount = amountsVisible ? formatMoney(expectedCashAmount) : '•••';
  const cashTrendText = amountsVisible ? 'à encaisser' : 'masqué';
  const firstName = session?.user.name?.trim().split(/\s+/)[0] ?? '';
  const avatarInitials = getInitials(session?.user.name || session?.shop.name || 'C');
  const logoFileId = session?.shop.logoFileId;
  const [avatarLogoUri, setAvatarLogoUri] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFileId) {
      setAvatarLogoUri(null);
      return;
    }
    let cancelled = false;
    getShopLogoUri()
      .then((uri) => {
        if (!cancelled) setAvatarLogoUri(uri);
      })
      .catch(() => {
        if (!cancelled) setAvatarLogoUri(null);
      });
    return () => {
      cancelled = true;
    };
  }, [logoFileId]);
  const totalSalesAmount = PREVIEW_MODE
    ? previewCashSales + previewMobileSales
    : todaySummary.cashSalesAmount + todaySummary.mobileMoneySalesAmount;
  const displayedExpenses = PREVIEW_MODE ? previewExpenses : todaySummary.expensesAmount;
  const displayedGap = PREVIEW_MODE ? previewGap : todaySummary.latestCashGap;
  const displayedMovements = PREVIEW_MODE ? previewMovements : stockMovements;
  const spentRatio = totalSalesAmount > 0 ? Math.min(displayedExpenses / totalSalesAmount, 1) : 0;
  const gapColor = displayedGap < 0 ? colors.danger : colors.successMuted;
  const headerTitle =
    activeMenu === 'report'
      ? 'Bilan'
      : activeMenu === 'missing'
        ? 'Contrôles'
        : activeMenu === 'profile'
          ? 'Réglages'
          : '';

  function handleTabChange(key: NavKey) {
    if (key === activeMenu) return;
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: -8, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setActiveMenu(key);
      contentTranslateY.setValue(8);
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    });
  }

  async function handleRoleSelection(accountRole: 'owner' | 'seller') {
    if (roleSetupLoading) return;

    setRoleSetupLoading(true);
    setRoleSetupError('');

    try {
      await defineAccountRole(accountRole);
      await refreshSession();
      setRoleSetupVisible(false);

      if (accountRole === 'owner') {
        setShopSettingsVisible(true);
      } else {
        setTeamJoinFirst(true);
        setTeamSettingsVisible(true);
      }
    } catch (error) {
      setRoleSetupError(getControlErrorMessage(error));
    } finally {
      setRoleSetupLoading(false);
    }
  }

  useFocusEffect(useCallback(() => {
    let isMounted = true;

    getTodaySummary().then((summary) => {
      if (isMounted) setTodaySummary(summary);
    }).catch((error) => {
      logControlError('home-summary', error);
    });

    getNotifications().then((list) => {
      if (isMounted) setNotifications(list);
    }).catch((error) => {
      logControlError('home-notifications', error);
    });

    getTeamMembers().then((members) => {
      if (isMounted) setDashboardMembers(members);
    }).catch((error) => {
      logControlError('home-team-members', error);
    });

    getRecentStockMovements(5, todayDateKey()).then((movements) => {
      if (isMounted) setStockMovements(movements);
    }).catch((error) => {
      logControlError('home-stock-movements', error);
    });

    return () => {
      isMounted = false;
    };
  }, []));

  useEffect(() => {
    if (promptedShopSetup.current || !session) return;

    promptedShopSetup.current = true;
    setRoleSetupError('');

    if (!activeRole) {
      setRoleSetupVisible(true);
      return;
    }

    if (activeRole === 'owner' && needsShopSetup(session)) {
      setShopSettingsVisible(true);
    }
  }, [activeRole, session]);

  useEffect(() => {
    if (!session) {
      appliedDisplayDefaults.current = null;
      return;
    }

    const preferenceKey = `${session.shop.$id}:${session.shop.amountsVisibleByDefault}`;
    if (appliedDisplayDefaults.current === preferenceKey) return;

    appliedDisplayDefaults.current = preferenceKey;
    setAmountsVisible(isAmountsVisibleByDefault(session.shop.amountsVisibleByDefault));
  }, [session]);

  useEffect(() => {
    if (prevOfflineRef.current && !isOffline) {
      flushOfflineQueue().then(() => {
        return getTodaySummary().then((s) => setTodaySummary(s));
      }).catch((error) => {
        logControlError('offline-flush', error);
      });
    }
    prevOfflineRef.current = isOffline;
  }, [isOffline]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      {isOffline && (
        <View
          style={{
            backgroundColor: colors.warningSoft,
            paddingVertical: 8,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Feather name="wifi-off" size={13} color={colors.warningDark} />
          <Text style={{ color: colors.warningDark, fontSize: 13, fontWeight: '600', flex: 1 }}>
            Hors ligne — données en cache affichées
          </Text>
        </View>
      )}
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.paper }}>
        <View
          style={{
            width: contentWidth,
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: compact ? 8 : 14,
            paddingBottom: compact ? 12 : 18,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                minHeight: 38,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {headerTitle ? (
                <Text style={{ color: colors.gray900, fontSize: 22, fontWeight: '800' }}>{headerTitle}</Text>
              ) : (
                <View style={{ flexShrink: 1 }}>
                  <Text numberOfLines={1} style={{ color: colors.gray500, fontSize: 15, fontWeight: '500' }}>
                    Bonjour,
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.gray900, fontSize: 26, fontWeight: '600', marginTop: 2 }}>
                    {firstName || 'Utilisateur'}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable
                  onPress={() => setNotificationsVisible(true)}
                  style={({ pressed }: { pressed: boolean }) => ({
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.62 : 1,
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  })}
                >
                  <MaterialCommunityIcons name="bell-outline" size={21} color={colors.primary} />
                  {notifications.filter((n) => n.read === 'false').length > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 9,
                        height: 9,
                        borderRadius: 5,
                        backgroundColor: colors.danger,
                        borderWidth: 1.5,
                        borderColor: colors.white,
                      }}
                    />
                  )}
                </Pressable>

                {!headerTitle ? (
                  <Pressable
                    onPress={() => handleTabChange('profile')}
                    style={({ pressed }: { pressed: boolean }) => ({
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: avatarLogoUri ? colors.gray100 : colors.primarySoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.62 : 1,
                      overflow: 'hidden',
                    })}
                  >
                    {avatarLogoUri ? (
                      <Image source={{ uri: avatarLogoUri }} style={{ width: 44, height: 44 }} />
                    ) : (
                      <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '800' }}>{avatarInitials}</Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            </View>

            <Animated.View
              style={{
                flex: 1,
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY as unknown as number }],
              }}
            >
              {activeMenu === 'home' ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: compact ? 104 : 118 }}
                >
                    <Pressable
                      onPress={() => router.push('/stock' as never)}
                      style={({ pressed }: { pressed: boolean }) => ({
                        marginTop: compact ? 14 : 18,
                        height: 46,
                        borderRadius: 16,
                        borderCurve: 'continuous',
                        backgroundColor: colors.gray100,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        opacity: pressed ? 0.72 : 1,
                      })}
                    >
                      <Feather name="search" size={17} color={colors.gray600} />
                      <Text style={{ color: colors.gray600, fontSize: 14, fontWeight: '500' }}>
                        Rechercher un produit…
                      </Text>
                    </Pressable>

                    <LinearGradient
                      colors={[colors.primary, colors.primaryMuted]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{
                        marginTop: compact ? 14 : 18,
                        borderRadius: 16,
                        borderCurve: 'continuous',
                        overflow: 'hidden',
                        paddingHorizontal: compact ? 22 : 26,
                        paddingVertical: compact ? 38 : 46,
                        gap: compact ? 16 : 18,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' }}>
                          Caisse du jour
                        </Text>
                        <Pressable
                          onPress={() => setAmountsVisible((visible) => !visible)}
                          style={({ pressed }: { pressed: boolean }) => ({
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? 0.62 : 1,
                          })}
                        >
                          <Feather name={amountsVisible ? 'eye' : 'eye-off'} size={17} color={colors.white} />
                        </Pressable>
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10, rowGap: 4 }}>
                        <Text
                          selectable
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.5}
                          style={{
                            flexShrink: 1,
                            color: colors.white,
                            fontSize: compact ? 36 : 40,
                            lineHeight: compact ? 40 : 44,
                            fontWeight: '800',
                            fontVariant: ['tabular-nums'],
                          }}
                        >
                          {displayedCashAmount}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: 14,
                            lineHeight: 24,
                            fontWeight: '700',
                          }}
                        >
                          {amountsVisible ? (expectedCashAmount >= 0 ? '↗' : '↘') : '•'} {cashTrendText}
                        </Text>
                      </View>

                      <View
                        style={{
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: 'rgba(255,255,255,0.22)',
                          overflow: 'hidden',
                          justifyContent: 'center',
                        }}
                      >
                        <View
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${Math.max(spentRatio * 100, totalSalesAmount > 0 && displayedExpenses > 0 ? 22 : 0)}%`,
                            borderRadius: 17,
                            backgroundColor: 'rgba(5,5,5,0.32)',
                          }}
                        />
                        <Text
                          style={{
                            marginLeft: 14,
                            color: colors.white,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          {amountsVisible ? `${formatMoney(displayedExpenses)} dépensés` : '••• dépensés'}
                        </Text>
                      </View>
                    </LinearGradient>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: compact ? 14 : 16 }}>
                      {[
                        {
                          label: 'Ventes',
                          value: totalSalesAmount,
                          color: colors.primary,
                          bg: colors.primarySoft,
                          ratio: 1,
                        },
                        {
                          label: 'Dépenses',
                          value: displayedExpenses,
                          color: colors.accentOrange,
                          bg: colors.accentOrangeSoft,
                          ratio: spentRatio,
                        },
                        {
                          label: 'Écart',
                          value: displayedGap,
                          color: gapColor,
                          bg: displayedGap < 0 ? colors.dangerSoft : colors.successSoft,
                          ratio: totalSalesAmount > 0 ? Math.min(Math.abs(displayedGap) / totalSalesAmount, 1) : 0,
                        },
                      ].map((metric) => (
                        <View
                          key={metric.label}
                          style={{
                            flex: 1,
                            borderRadius: 14,
                            backgroundColor: metric.bg,
                            padding: compact ? 12 : 14,
                            gap: 10,
                          }}
                        >
                          <Text numberOfLines={1} style={{ color: colors.gray700, fontSize: 12, fontWeight: '600' }}>
                            {metric.label}
                          </Text>
                          <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                            style={{ color: colors.gray900, fontSize: 17, fontWeight: '800' }}
                          >
                            {amountsVisible ? formatMoney(metric.value) : '•••'}
                          </Text>
                          <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.10)', overflow: 'hidden' }}>
                            <View
                              style={{
                                height: 8,
                                borderRadius: 4,
                                width: `${Math.max(metric.ratio * 100, 6)}%`,
                                backgroundColor: metric.color,
                              }}
                            />
                          </View>
                        </View>
                      ))}
                    </View>

                    <View style={{ marginTop: compact ? 24 : 30 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ color: colors.gray900, fontSize: 17, fontWeight: '800' }}>Mouvements</Text>
                        <Pressable onPress={() => handleTabChange('missing')} hitSlop={8}>
                          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Voir tout</Text>
                        </Pressable>
                      </View>

                      {displayedMovements.length === 0 ? (
                        <Text style={{ color: colors.gray500, fontSize: 13, marginTop: 8 }}>
                          Aucun mouvement de stock aujourd’hui.
                        </Text>
                      ) : (
                        <View style={{ gap: 10, marginTop: 10 }}>
                          {displayedMovements.map((movement) => (
                            <StockMovementItem key={movement.$id} movement={movement} />
                          ))}
                        </View>
                      )}
                    </View>
                </ScrollView>
              ) : activeMenu === 'report' ? (
                <ReportMenu
                  compact={compact}
                  amountsVisible={amountsVisible}
                />
              ) : activeMenu === 'missing' ? (
                <MissingMenu
                  compact={compact}
                  amountsVisible={amountsVisible}
                  role={activeRole}
                  summary={todaySummary}
                  onOpenCashJournal={() => router.push('/journal' as never)}
                  onOpenExpense={() => router.push('/expense' as never)}
                  onOpenMissing={() => router.push('/missing' as never)}
                  onOpenMissingHistory={() =>
                    router.push({ pathname: '/missing', params: { view: 'history' } } as never)
                  }
                />
              ) : (
                <ProfileMenu
                  compact={compact}
                  role={activeRole}
                  memberCount={dashboardMembers.filter((m) => m.status === 'active').length + 1}
                  onEditShop={() => setShopSettingsVisible(true)}
                  onEditCash={() => setCashSettingsVisible(true)}
                  onEditDisplay={() => setDisplaySettingsVisible(true)}
                  onEditAlerts={() => setAlertsSettingsVisible(true)}
                  onEditTeam={() => setTeamSettingsVisible(true)}
                  onEditData={() => setDataSettingsVisible(true)}
                  onEditStores={() => setStoresSettingsVisible(true)}
                />
              )}
            </Animated.View>
          </View>
        </View>

        <LinearGradient
          pointerEvents="none"
          colors={['rgba(243,243,250,0)', 'rgba(243,243,250,0.85)', colors.paper]}
          locations={[0, 0.55, 1]}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: compact ? 128 : 144,
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: compact ? 14 : 20,
            alignItems: 'center',
          }}
        >
          <BottomNav
            active={activeMenu}
            compact={compact}
            role={activeRole}
            onChange={handleTabChange}
            onQuickActions={() => setQuickActionsVisible(true)}
          />
        </View>
      </View>
      <NotificationsCenterModal
        visible={notificationsVisible}
        compact={compact}
        notifications={notifications}
        onClose={() => setNotificationsVisible(false)}
        onRead={(id) => {
          markNotificationRead(id).then((updated) =>
            setNotifications((prev) => prev.map((n) => (n.$id === id ? updated : n)))
          );
        }}
        onReadAll={() => {
          markAllNotificationsRead().then(() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: 'true' })))
          );
        }}
      />
      <RoleSetupModal
        visible={roleSetupVisible}
        compact={compact}
        loading={roleSetupLoading}
        errorMessage={roleSetupError}
        onSelectOwner={() => handleRoleSelection('owner')}
        onSelectSeller={() => handleRoleSelection('seller')}
      />
      <ShopSettingsModal
        visible={shopSettingsVisible}
        compact={compact}
        onClose={() => setShopSettingsVisible(false)}
        onSaved={refreshSession}
      />
      <StoresSettingsModal
        visible={storesSettingsVisible}
        compact={compact}
        onClose={() => setStoresSettingsVisible(false)}
        onSwitched={refreshSession}
      />
      <CashSettingsModal
        visible={cashSettingsVisible}
        compact={compact}
        onClose={() => setCashSettingsVisible(false)}
        onSaved={refreshSession}
      />
      <DisplaySettingsModal
        visible={displaySettingsVisible}
        compact={compact}
        onClose={() => setDisplaySettingsVisible(false)}
        onSaved={refreshSession}
      />
      <AlertsSettingsModal
        visible={alertsSettingsVisible}
        compact={compact}
        onClose={() => setAlertsSettingsVisible(false)}
        onSaved={refreshSession}
      />
      <TeamSettingsModal
        visible={teamSettingsVisible}
        compact={compact}
        startOnJoin={teamJoinFirst}
        onJoined={refreshSession}
        onClose={() => {
          setTeamSettingsVisible(false);
          setTeamJoinFirst(false);
        }}
      />
      <DataSettingsModal
        visible={dataSettingsVisible}
        compact={compact}
        onClose={() => setDataSettingsVisible(false)}
      />
      <QuickActionsModal
        visible={quickActionsVisible}
        compact={compact}
        onClose={() => setQuickActionsVisible(false)}
        onOpenSale={() => router.push('/sale' as never)}
        onOpenStock={() => router.push('/stock' as never)}
        onOpenClosure={() => router.push('/closure' as never)}
        onOpenExpense={() => router.push('/expense' as never)}
      />
    </SafeAreaView>
  );
}
