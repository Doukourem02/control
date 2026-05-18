import { SellerActionTile, type SellerAction } from '@/components/seller-action-tile';
import { getAnalytics, getTodaySummary, type AnalyticsData, type AnalyticsType, type TodaySummary } from '@/lib/control-data';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavKey = 'home' | 'report' | 'missing' | 'profile';

type NavIcon =
  | { family: 'asset'; name: 'home' | 'report' | 'missing' }
  | { family: 'material'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] };

const quickActions: SellerAction[] = [
  {
    title: 'Vente',
    subtitle: 'Nouvelle vente',
    icon: { family: 'feather', name: 'arrow-up-right' },
    accent: '#4C9BFF',
  },
  {
    title: 'Stock',
    subtitle: 'Articles',
    icon: { family: 'material', name: 'cube-outline' },
    accent: '#FF8A4C',
  },
  {
    title: 'Clôture',
    subtitle: 'Fin de journée',
    icon: { family: 'material', name: 'credit-card-outline' },
    accent: '#B94DFF',
  },
  {
    title: 'Sortie',
    subtitle: 'Dépense caisse',
    icon: { family: 'material', name: 'currency-usd' },
    accent: '#3B3B3B',
  },
];

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function NavAssetIcon({
  name,
  color,
  size,
}: {
  name: 'home' | 'report' | 'missing';
  color: string;
  size: number;
}) {
  const source =
    name === 'home'
      ? require('../assets/icons/home-flaticon-9664027.png')
      : name === 'report'
        ? require('../assets/icons/diagram-flaticon-9637699.png')
        : require('../assets/icons/wallet-flaticon-9122560.png');

  return (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        resizeMode: 'contain',
        tintColor: color,
      }}
    />
  );
}

function BottomNav({
  active = 'home',
  compact = false,
  onChange,
}: {
  active?: NavKey;
  compact?: boolean;
  onChange?: (key: NavKey) => void;
}) {
  const navHeight = compact ? 66 : 68;
  const itemSize = compact ? 50 : 52;
  const items: {
    key: NavKey;
    icon: NavIcon;
  }[] = [
    { key: 'home', icon: { family: 'asset', name: 'home' } },
    { key: 'report', icon: { family: 'asset', name: 'report' } },
    { key: 'missing', icon: { family: 'asset', name: 'missing' } },
    { key: 'profile', icon: { family: 'material', name: 'cog' } },
  ];

  return (
    <View
      style={{
        alignSelf: 'center',
        width: '66%',
        minWidth: 244,
        maxWidth: 292,
        height: navHeight,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 18px 34px rgba(0, 0, 0, 0.07)',
      }}
    >
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Pressable
            key={item.key}
            onPress={() => onChange?.(item.key)}
            style={({ pressed }: { pressed: boolean }) => ({
              width: itemSize,
              height: itemSize,
              borderRadius: itemSize / 2,
              backgroundColor: isActive ? '#F7F7F7' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.64 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            {item.icon.family === 'asset' ? (
              <NavAssetIcon
                name={item.icon.name}
                size={compact ? 25 : 26}
                color={isActive ? '#050505' : '#A6A6A6'}
              />
            ) : (
              <MaterialCommunityIcons
                name={item.icon.name}
                size={compact ? 25 : 26}
                color={isActive ? '#050505' : '#A6A6A6'}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: 58,
        borderRadius: 22,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        opacity: pressed ? 0.68 : 1,
      })}
    >
      <MaterialCommunityIcons name={icon} size={22} color="#777777" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#111111', fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text numberOfLines={1} style={{ color: '#A4A4A4', fontSize: 13, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color="#B0B0B0" />
    </Pressable>
  );
}

function HomeMenu({
  compact,
  onOpenReport,
  onOpenStock,
  onOpenSale,
  onOpenClosure,
  onOpenExpense,
}: {
  compact: boolean;
  onOpenReport: () => void;
  onOpenStock: () => void;
  onOpenSale: () => void;
  onOpenClosure: () => void;
  onOpenExpense: () => void;
}) {
  return (
    <>
      <View style={{ marginTop: compact ? 24 : 34, gap: compact ? 14 : 18 }}>
        <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>
          Actions rapides
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: compact ? 14 : 18,
          }}
        >
          {quickActions.map((action) => (
            <SellerActionTile
              key={action.title}
              action={action}
              compact={compact}
              onPress={
                action.title === 'Stock'
                  ? onOpenStock
                  : action.title === 'Vente'
                    ? onOpenSale
                    : action.title === 'Clôture'
                      ? onOpenClosure
                      : onOpenExpense
              }
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={onOpenReport}
        style={({ pressed }: { pressed: boolean }) => ({
          alignSelf: 'center',
          minHeight: compact ? 34 : 38,
          marginTop: compact ? 24 : 34,
          marginBottom: compact ? 46 : 62,
          paddingHorizontal: 18,
          borderRadius: 21,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.62 : 1,
        })}
      >
        <Text style={{ color: '#2A8DEB', fontSize: compact ? 15 : 16, fontWeight: '600' }}>
          Ouvrir le bilan
        </Text>
        <Feather name="arrow-right" size={compact ? 19 : 20} color="#2A8DEB" />
      </Pressable>
    </>
  );
}

function getLabelIndices(count: number): number[] {
  if (count === 0) return [];
  if (count <= 4) return Array.from({ length: count }, (_, i) => i);
  return [0, Math.floor((count - 1) * 0.33), Math.floor((count - 1) * 0.66), count - 1];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTooltipDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatReportDate(dateStr?: string) {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatCalendarMonth(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateStr: string) {
  return new Date(dateStr + 'T12:00:00');
}

function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);
}

function buildCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12));
  }

  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function DashedVerticalLine({ top, height, left }: { top: number; height: number; left: number }) {
  const dashHeight = 6;
  const gap = 5;
  const dashCount = Math.max(0, Math.floor(height / (dashHeight + gap)));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left, top, height, width: 1, zIndex: 1 }}>
      {Array.from({ length: dashCount }).map((_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            top: index * (dashHeight + gap),
            width: 1,
            height: dashHeight,
            backgroundColor: '#111111',
            opacity: 0.82,
          }}
        />
      ))}
    </View>
  );
}

function ReportChart({
  data,
  selectedDate,
  amountsVisible,
}: {
  data: AnalyticsData;
  selectedDate: string;
  amountsVisible: boolean;
}) {
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = 214;
  const plotTop = 8;
  const plotBottom = 42;
  const plotHeight = chartHeight - plotTop - plotBottom;
  const amountsByDate = new Map(data.chartData.map((point) => [point.date, point.amount]));
  const selectedDateValue = dateFromKey(selectedDate);
  const points = Array.from({ length: 15 }, (_, index) => {
    const date = new Date(selectedDateValue);
    date.setDate(date.getDate() + index - 9);
    const key = dateToKey(date);
    return { date: key, amount: amountsByDate.get(key) ?? 0 };
  });
  const labelIndices = getLabelIndices(points.length);
  const activeIndex = 9;
  const activePoint = points[activeIndex];
  const step = points.length > 1 ? chartWidth / (points.length - 1) : 0;
  const activeX = points.length > 1 ? activeIndex * step : chartWidth / 2;
  const dotY = plotTop + plotHeight * 0.52;
  const tooltipWidth = 128;
  const tooltipHeight = 62;
  const labelWidth = 74;
  const tooltipLeft = Math.min(
    Math.max(activeX - 12, 0),
    Math.max(chartWidth - tooltipWidth, 0)
  );
  const tooltipTop = Math.max(plotTop + 4, dotY - tooltipHeight - 18);

  if (points.length === 0) {
    return (
      <View style={{ height: chartHeight, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#BBBBBB', fontSize: 14, fontWeight: '600' }}>Aucune donnée</Text>
      </View>
    );
  }

  return (
    <View
      onLayout={(event: { nativeEvent: { layout: { width: number } } }) =>
        setChartWidth(event.nativeEvent.layout.width)
      }
      style={{ height: chartHeight, overflow: 'visible' }}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: plotTop + (plotHeight / 5) * index,
            height: 1,
            backgroundColor: '#EFEFEF',
          }}
        />
      ))}

      {chartWidth > 0 && activePoint ? (
        <>
          <DashedVerticalLine top={plotTop} height={plotHeight} left={activeX} />
          <View
            style={{
              position: 'absolute',
              left: activeX - 4,
              top: dotY - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#111111',
              zIndex: 4,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: tooltipLeft,
              top: tooltipTop,
              width: tooltipWidth,
              height: tooltipHeight,
              borderRadius: 12,
              borderCurve: 'continuous',
              backgroundColor: '#111111',
              paddingLeft: 22,
              paddingRight: 14,
              paddingVertical: 10,
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 9,
                top: 13,
                width: 3,
                height: tooltipHeight - 26,
                borderRadius: 2,
                backgroundColor: '#D8D8D8',
              }}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}
            >
              {amountsVisible ? formatMoney(activePoint.amount) : '•••'}
            </Text>
            <Text numberOfLines={1} style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '700', marginTop: 3 }}>
              {formatTooltipDate(activePoint.date)}
            </Text>
          </View>
        </>
      ) : null}

      {chartWidth > 0
        ? labelIndices.map((i) => {
            const labelX = points.length > 1 ? i * step : chartWidth / 2;
            const labelLeft = Math.min(
              Math.max(labelX - labelWidth / 2, 0),
              Math.max(chartWidth - labelWidth, 0)
            );

            return (
              <Text
                key={points[i].date}
                numberOfLines={1}
                style={{
                  position: 'absolute',
                  left: labelLeft,
                  bottom: 0,
                  width: labelWidth,
                  color: i === activeIndex ? '#111111' : '#9B9B9B',
                  fontSize: 13,
                  fontWeight: i === activeIndex ? '800' : '600',
                  textAlign: i === 0 ? 'left' : i === points.length - 1 ? 'right' : 'center',
                }}
              >
                {formatDateLabel(points[i].date)}
              </Text>
            );
          })
        : null}
    </View>
  );
}

const emptyAnalytics: AnalyticsData = { total: 0, previousTotal: 0, chartData: [], transactions: [] };

function ReportMenu({ compact, amountsVisible }: { compact: boolean; amountsVisible: boolean }) {
  const [type, setType] = useState<AnalyticsType>('sales');
  const [days] = useState(15);
  const [selectedDate, setSelectedDate] = useState(() => dateToKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [data, setData] = useState<AnalyticsData>(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    getAnalytics(type, days, selectedDate).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [type, days, selectedDate]);

  const trendPct =
    data.previousTotal > 0
      ? ((data.total - data.previousTotal) / data.previousTotal) * 100
      : data.total > 0
        ? 100
        : 0;
  const trendUp = trendPct >= 0;
  const accent = type === 'sales' ? '#2A8DEB' : '#FF6B35';
  const historyAccent = type === 'sales' ? '#34C875' : '#E5484D';
  const reportDateLabel = formatReportDate(selectedDate);
  const todayKey = dateToKey(new Date());
  const todayDate = dateFromKey(todayKey);
  const calendarDays = buildCalendarDays(calendarMonth);
  const canGoNextMonth =
    shiftMonth(calendarMonth, 1).getTime() <= new Date(todayDate.getFullYear(), todayDate.getMonth(), 1, 12).getTime();

  function applyDate(nextDate: string) {
    setSelectedDate(nextDate);
    const nextDateValue = dateFromKey(nextDate);
    setCalendarMonth(new Date(nextDateValue.getFullYear(), nextDateValue.getMonth(), 1, 12));
    setDateFilterOpen(false);
  }

  function toggleDateFilter() {
    const selectedDateValue = dateFromKey(selectedDate);
    setCalendarMonth(new Date(selectedDateValue.getFullYear(), selectedDateValue.getMonth(), 1, 12));
    setDateFilterOpen((open) => !open);
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* Toggle Ventes / Sorties */}
      <View
        style={{
          marginTop: compact ? 20 : 28,
          flexDirection: 'row',
          backgroundColor: '#F0F0F0',
          borderRadius: 16,
          padding: 4,
        }}
      >
        {(['sales', 'expenses'] as AnalyticsType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 13,
              backgroundColor: type === t ? '#FFFFFF' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: type === t ? '#111111' : '#9A9A9A' }}>
              {t === 'sales' ? 'Ventes' : 'Sorties'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date */}
      <View
        style={{
          minHeight: 44,
          marginTop: compact ? 18 : 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={toggleDateFilter}
          style={({ pressed }: { pressed: boolean }) => ({
            minHeight: 36,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            opacity: pressed ? 0.62 : 1,
          })}
        >
          <Text style={{ color: '#111111', fontSize: 16, fontWeight: '600' }}>
            {reportDateLabel}
          </Text>
          <MaterialCommunityIcons name="menu-down" size={22} color="#777777" />
        </Pressable>

        <Pressable
          onPress={toggleDateFilter}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.68 : 1,
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.045)',
          })}
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={23} color="#2A8DEB" />
        </Pressable>
      </View>

      {dateFilterOpen ? (
        <View
          style={{
            marginTop: 8,
            borderRadius: 22,
            borderCurve: 'continuous',
            backgroundColor: '#F7F7F7',
            borderWidth: 1,
            borderColor: '#EEEEEE',
            padding: 12,
          }}
        >
          <View
            style={{
              minHeight: 36,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <Pressable
              onPress={() => setCalendarMonth((current) => shiftMonth(current, -1))}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.64 : 1,
              })}
            >
              <Feather name="chevron-left" size={20} color="#777777" />
            </Pressable>

            <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800', textTransform: 'capitalize' }}>
              {formatCalendarMonth(calendarMonth)}
            </Text>

            <Pressable
              disabled={!canGoNextMonth}
              onPress={() => setCalendarMonth((current) => shiftMonth(current, 1))}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !canGoNextMonth ? 0.28 : pressed ? 0.64 : 1,
              })}
            >
              <Feather name="chevron-right" size={20} color="#777777" />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, index) => (
              <Text
                key={`${label}-${index}`}
                style={{
                  flex: 1,
                  color: '#A0A0A0',
                  fontSize: 11,
                  fontWeight: '800',
                  textAlign: 'center',
                }}
              >
                {label}
              </Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
            {calendarDays.map((day, index) => {
              const dayKey = day ? dateToKey(day) : '';
              const isSelected = dayKey === selectedDate;
              const isToday = dayKey === todayKey;
              const isFuture = day ? day.getTime() > todayDate.getTime() : false;

              return (
                <View key={dayKey || `empty-${index}`} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
                  {day ? (
                    <Pressable
                      disabled={isFuture}
                      onPress={() => applyDate(dayKey)}
                      style={({ pressed }: { pressed: boolean }) => ({
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? '#111111' : isToday ? '#EAF4FF' : 'transparent',
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: '#B8DCFF',
                        opacity: isFuture ? 0.28 : pressed ? 0.62 : 1,
                      })}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#FFFFFF' : isToday ? '#2A8DEB' : '#111111',
                          fontSize: 14,
                          fontWeight: isSelected || isToday ? '800' : '700',
                        }}
                      >
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={{ width: 38, height: 38 }} />
                  )}
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={() => applyDate(todayKey)}
            style={({ pressed }: { pressed: boolean }) => ({
              alignSelf: 'center',
              minHeight: 34,
              marginTop: 10,
              paddingHorizontal: 14,
              borderRadius: 17,
              backgroundColor: '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              opacity: pressed ? 0.64 : 1,
            })}
          >
            <MaterialCommunityIcons name="calendar-today" size={18} color="#2A8DEB" />
            <Text style={{ color: '#111111', fontSize: 13, fontWeight: '800' }}>Aujourd’hui</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Total + tendance */}
      <View style={{ marginTop: compact ? 12 : 16 }}>
        <Text style={{ color: '#9A9A9A', fontSize: 13, fontWeight: '500' }}>
          Total {type === 'sales' ? 'Ventes' : 'Sorties'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
          <Text
            style={{
              color: '#111111',
              fontSize: compact ? 34 : 38,
              fontWeight: '800',
              fontVariant: ['tabular-nums'],
            }}
          >
            {amountsVisible ? formatMoney(data.total) : '•••'}
          </Text>
          {data.previousTotal > 0 && amountsVisible && (
            <Text
              style={{
                color: trendUp ? '#34C875' : '#E5484D',
                fontSize: 13,
                fontWeight: '700',
                paddingBottom: 6,
              }}
            >
              {trendUp ? '↗' : '↘'} {Math.abs(trendPct).toFixed(1)}% vs période préc.
            </Text>
          )}
        </View>
      </View>

      {/* Graphique bilan */}
      <View style={{ marginTop: compact ? 18 : 22 }}>
        {loading ? (
          <View style={{ height: 176, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={accent} />
          </View>
        ) : (
          <ReportChart data={data} selectedDate={selectedDate} amountsVisible={amountsVisible} />
        )}
      </View>

      {/* Historique transactions */}
      {!loading && data.transactions.length > 0 && (
        <View style={{ marginTop: compact ? 22 : 28 }}>
          <Text style={{ color: '#111111', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
            Historique
          </Text>
          <View
            style={{
              paddingVertical: 2,
            }}
          >
            {data.transactions.map((t, i) => (
              <View
                key={t.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  gap: 12,
                }}
              >
                <View
	                  style={{
	                    width: 40,
	                    height: 40,
	                    borderRadius: 20,
	                    backgroundColor: '#F7F7F7',
	                    alignItems: 'center',
	                    justifyContent: 'center',
	                  }}
	                >
	                  <Feather name="arrow-up-right" size={20} color={historyAccent} />
	                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>
                    {t.label}
                  </Text>
                  {t.sub ? (
                    <Text numberOfLines={1} style={{ color: '#A4A4A4', fontSize: 12, marginTop: 1 }}>
                      {t.sub}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: '#111111', fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {amountsVisible ? formatMoney(t.amount) : '•••'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!loading && data.transactions.length === 0 && (
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ color: '#BBBBBB', fontSize: 15 }}>Aucune donnée pour cette période</Text>
        </View>
      )}
    </ScrollView>
  );
}

function EcartsTile({
  title,
  subtitle,
  icon,
  accent,
  compact,
  subtitleColor = '#A8A8A8',
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  accent: string;
  compact: boolean;
  subtitleColor?: string;
  onPress?: () => void;
}) {
  const iconSize = compact ? 40 : 44;
  const glyphSize = compact ? 20 : 22;

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        width: '48%',
        height: compact ? 158 : 176,
        borderRadius: 28,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        paddingTop: compact ? 22 : 24,
        paddingHorizontal: compact ? 22 : 24,
        paddingBottom: compact ? 20 : 22,
        opacity: pressed ? 0.68 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.018)',
      })}
    >
      <View
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 14,
          borderCurve: 'continuous',
          backgroundColor: accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon} size={glyphSize} color="#FFFFFF" />
      </View>

      <View style={{ gap: 5, marginTop: compact ? 30 : 40 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={{
            color: '#111111',
            fontSize: compact ? 17 : 18,
            lineHeight: compact ? 21 : 22,
            fontWeight: '700',
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: subtitleColor,
            fontSize: compact ? 14 : 15,
            lineHeight: compact ? 17 : 18,
            fontWeight: '400',
          }}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function MissingMenu({
  compact,
  amountsVisible,
  summary,
  onOpenClosure,
  onOpenMissing,
  onOpenMissingHistory,
}: {
  compact: boolean;
  amountsVisible: boolean;
  summary: TodaySummary;
  onOpenClosure: () => void;
  onOpenMissing: () => void;
  onOpenMissingHistory: () => void;
}) {
  const hiddenValue = '•••';
  const hasGap = summary.latestCashGap !== 0;
  const gapColor = summary.latestCashGap < 0 ? '#E5484D' : '#34C875';
  const expectedValue = amountsVisible ? formatMoney(summary.physicalCashExpected) : hiddenValue;
  const latestGapValue = amountsVisible ? formatMoney(summary.latestCashGap) : hiddenValue;

  return (
    <View style={{ marginTop: compact ? 24 : 34, marginBottom: compact ? 46 : 62, gap: 28 }}>
      <View style={{ gap: 14 }}>
        <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Contrôle caisse</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
          <EcartsTile
            title="Cash attendu"
            subtitle={expectedValue}
            subtitleColor="#A8A8A8"
            icon="cash"
            accent="#4C9BFF"
            compact={compact}
            onPress={onOpenClosure}
          />
          <EcartsTile
            title="Dernier écart"
            subtitle={latestGapValue}
            subtitleColor={hasGap ? gapColor : '#A8A8A8'}
            icon={hasGap ? 'alert' : 'check'}
            accent="#FF8A4C"
            compact={compact}
            onPress={onOpenClosure}
          />
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
          <EcartsTile
            title="Déclarer"
            subtitle="Perte ou casse"
            icon="alert-outline"
            accent="#B94DFF"
            compact={compact}
            onPress={onOpenMissing}
          />
          <EcartsTile
            title="Historique"
            subtitle="Voir les écarts"
            icon="clipboard-text-clock-outline"
            accent="#3B3B3B"
            compact={compact}
            onPress={onOpenMissingHistory}
          />
        </View>
      </View>
    </View>
  );
}

function ProfileMenu({ compact }: { compact: boolean }) {
  return (
    <View style={{ marginTop: compact ? 24 : 34, marginBottom: compact ? 46 : 62, gap: 13 }}>
      <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Réglages</Text>
      <SettingsRow icon="store" title="Boutique" subtitle="Informations et horaires" />
      <SettingsRow icon="account-group" title="Équipe" subtitle="Vendeurs et permissions" />
      <SettingsRow icon="tune" title="Préférences" subtitle="Caisse, alertes et affichage" />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<NavKey>('home');
  const [amountsVisible, setAmountsVisible] = useState(true);
  const [todaySummary, setTodaySummary] = useState<TodaySummary>({
    cashSalesAmount: 0,
    mobileMoneySalesAmount: 0,
    expensesAmount: 0,
    physicalCashExpected: 0,
    salesCount: 0,
    expensesCount: 0,
    latestCashGap: 0,
  });
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const compact = height < 900;
  const contentWidth = Math.min(width, 520);
  const alertText =
    todaySummary.salesCount === 0
      ? 'Aucune vente aujourd’hui'
      : `${todaySummary.salesCount} vente${todaySummary.salesCount > 1 ? 's' : ''} aujourd’hui`;
  const expectedCashAmount = todaySummary.physicalCashExpected;
  const displayedCashAmount = amountsVisible ? formatMoney(expectedCashAmount) : '•••';
  const cashTrendText = amountsVisible ? 'à encaisser' : 'masqué';
  const dailySummary = amountsVisible
    ? `${todaySummary.salesCount} vente${todaySummary.salesCount > 1 ? 's' : ''} · ${
        todaySummary.expensesCount
      } sortie${todaySummary.expensesCount > 1 ? 's' : ''} · ${
        todaySummary.latestCashGap === 0 ? 'aucun écart' : `${formatMoney(todaySummary.latestCashGap)} écart`
      }`
    : 'Détails de caisse masqués';
  const headerTitle =
    activeMenu === 'report'
      ? 'Bilan'
      : activeMenu === 'missing'
        ? 'Écarts'
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

  useFocusEffect(useCallback(() => {
    let isMounted = true;

    getTodaySummary().then((summary) => {
      if (isMounted) {
        setTodaySummary(summary);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF' }}>
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
                height: 38,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {headerTitle ? (
                <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>{headerTitle}</Text>
              ) : (
                <Pressable
                  style={({ pressed }: { pressed: boolean }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.62 : 1,
                  })}
                >
                  <Image
                    source={require('../assets/icons/user-flaticon-1077114.png')}
                    style={{
                      width: 25,
                      height: 25,
                      resizeMode: 'contain',
                      tintColor: '#777777',
                    }}
                  />
                </Pressable>
              )}

              <Pressable
                style={({ pressed }: { pressed: boolean }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.62 : 1,
                })}
              >
                <MaterialCommunityIcons name="bell" size={25} color="#777777" />
              </Pressable>
            </View>

            <Animated.View
              style={{
                flex: 1,
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY as unknown as number }],
              }}
            >
              {activeMenu === 'home' ? (
                <>
                  <View style={{ marginTop: compact ? 20 : 28, gap: compact ? 8 : 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: '#8D8D8D', fontSize: 16, fontWeight: '600' }}>
                        Caisse du jour
                      </Text>
                      <Pressable
                        onPress={() => setAmountsVisible((visible) => !visible)}
                        style={({ pressed }: { pressed: boolean }) => ({
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: pressed ? 0.62 : 1,
                        })}
                      >
                        <Feather name={amountsVisible ? 'eye' : 'eye-off'} size={18} color="#A7A7A7" />
                      </Pressable>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
                      <Text
                        selectable
                        style={{
                          color: '#050505',
                          fontSize: compact ? 43 : 46,
                          lineHeight: compact ? 48 : 52,
                          fontWeight: '700',
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {displayedCashAmount}
                      </Text>
                      <Text
                        style={{
                          color: expectedCashAmount >= 0 ? '#34C875' : '#E5484D',
                          fontSize: 15,
                          lineHeight: 29,
                          fontWeight: '700',
                        }}
                      >
                        {amountsVisible ? (expectedCashAmount >= 0 ? '↗' : '↘') : '•'} {cashTrendText}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleTabChange('report')}
                    style={({ pressed }: { pressed: boolean }) => ({
                      height: compact ? 62 : 66,
                      marginTop: compact ? 22 : 30,
                      borderRadius: 26,
                      borderCurve: 'continuous',
                      backgroundColor: '#FFFFFF',
                      paddingHorizontal: compact ? 13 : 15,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: compact ? 12 : 14,
                      opacity: pressed ? 0.72 : 1,
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.035)',
                    })}
                  >
                    <View
                      style={{
                        width: compact ? 42 : 46,
                        height: compact ? 42 : 46,
                        borderRadius: compact ? 21 : 23,
                        backgroundColor: '#F1FAF5',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name="arrow-down-left" size={22} color="#32C171" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={{ color: '#111111', fontSize: compact ? 15 : 16, fontWeight: '600' }}
                      >
                        {alertText}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ color: '#A8A8A8', fontSize: compact ? 13 : 14, fontWeight: '400' }}
                      >
                        {dailySummary}
                      </Text>
                    </View>
                    <Feather name="arrow-right" size={22} color="#111111" />
                  </Pressable>

                  <HomeMenu
                    compact={compact}
                    onOpenReport={() => handleTabChange('report')}
                    onOpenStock={() => router.push('/stock' as never)}
                    onOpenSale={() => router.push('/sale' as never)}
                    onOpenClosure={() => router.push('/closure' as never)}
                    onOpenExpense={() => router.push('/expense' as never)}
                  />
                </>
              ) : activeMenu === 'report' ? (
                <ReportMenu
                  compact={compact}
                  amountsVisible={amountsVisible}
                />
              ) : activeMenu === 'missing' ? (
                <MissingMenu
                  compact={compact}
                  amountsVisible={amountsVisible}
                  summary={todaySummary}
                  onOpenClosure={() => router.push('/closure' as never)}
                  onOpenMissing={() => router.push('/missing' as never)}
                  onOpenMissingHistory={() =>
                    router.push({ pathname: '/missing', params: { view: 'history' } } as never)
                  }
                />
              ) : (
                <ProfileMenu compact={compact} />
              )}
            </Animated.View>
          </View>

          <BottomNav active={activeMenu} compact={compact} onChange={handleTabChange} />
        </View>
      </View>
    </SafeAreaView>
  );
}
