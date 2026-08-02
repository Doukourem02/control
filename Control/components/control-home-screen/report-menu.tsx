import {
  getAnalytics,
  getRecentStockMovements,
  type AnalyticsData,
  type AnalyticsType,
  type StockMovementRow,
} from '@/lib/control-data';
import { colors } from '@/lib/theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { DashedVerticalLine } from './shared-ui';
import {
  buildCalendarDays,
  dateFromKey,
  dateToKey,
  formatCalendarMonth,
  formatDateLabel,
  formatMoney,
  formatReportDate,
  formatSectionDate,
  formatStockMovementDate,
  formatTooltipDate,
  getLabelIndices,
  getStockMovementLabel,
  shiftMonth,
} from './utils';

export function ReportChart({
  data,
  selectedDate,
  amountsVisible,
  accent = colors.primary,
}: {
  data: AnalyticsData;
  selectedDate: string;
  amountsVisible: boolean;
  accent?: string;
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
        <Text style={{ color: colors.gray300, fontSize: 14, fontWeight: '600' }}>Aucune donnée</Text>
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
            backgroundColor: colors.gray100,
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
              backgroundColor: accent,
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
              backgroundColor: colors.ink,
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
                backgroundColor: accent,
              }}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: colors.white, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}
            >
              {amountsVisible ? formatMoney(activePoint.amount) : '•••'}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.gray400, fontSize: 12, fontWeight: '700', marginTop: 3 }}>
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
                  color: i === activeIndex ? colors.gray900 : colors.gray400,
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

export function StockMovementItem({
  movement,
}: {
  movement: StockMovementRow;
}) {
  const isDecrease = movement.type === 'sale' || movement.type === 'missing';
  const accent = isDecrease ? colors.danger : colors.successMuted;
  const bg = isDecrease ? colors.dangerSoft : colors.successSoft;
  const iconName: ComponentProps<typeof Feather>['name'] = isDecrease ? 'arrow-up-right' : 'arrow-down-left';
  const signedQuantity = `${isDecrease ? '-' : '+'}${Math.abs(movement.quantity).toLocaleString('fr-FR')} ${movement.unit}`;
  const details = [getStockMovementLabel(movement.type), formatStockMovementDate(movement.$createdAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 16,
        borderCurve: 'continuous',
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 12,
        boxShadow: '0 6px 16px rgba(23, 23, 31, 0.05)',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={iconName} size={20} color={accent} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: colors.gray900, fontSize: 14, fontWeight: '700' }}>
          {movement.productName}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.gray500, fontSize: 12, marginTop: 1 }}>
          {details}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: bg,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ color: accent, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] }}
        >
          {signedQuantity}
        </Text>
      </View>
    </View>
  );
}

export function ReportSectionTitle({
  title,
  date,
}: {
  title: string;
  date: string;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: colors.gray900, fontSize: 16, fontWeight: '800' }}>
        {title}
      </Text>
      <Text style={{ color: colors.gray500, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
        {date}
      </Text>
    </View>
  );
}

export function ReportMenu({ compact, amountsVisible }: { compact: boolean; amountsVisible: boolean }) {
  const [type, setType] = useState<AnalyticsType>('sales');
  const [days] = useState(15);
  const [selectedDate, setSelectedDate] = useState(() => dateToKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [data, setData] = useState<AnalyticsData>(emptyAnalytics);
  const [stockMovements, setStockMovements] = useState<StockMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    Promise.all([
      getAnalytics(type, days, selectedDate),
      getRecentStockMovements(50, selectedDate),
    ]).then(([result, movements]) => {
      if (cancelled) return;
      setData(result);
      setStockMovements(movements);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [type, days, selectedDate]);

  const trendPct =
    data.previousTotal > 0
      ? ((data.total - data.previousTotal) / data.previousTotal) * 100
      : data.total > 0
        ? 100
        : 0;
  const trendUp = trendPct >= 0;
  const accent = type === 'sales' ? colors.primary : colors.accentOrange;
  const accentSoft = type === 'sales' ? colors.primarySoft : colors.accentOrangeSoft;
  const historyAccent = type === 'sales' ? colors.successMuted : colors.danger;
  const historyBg = type === 'sales' ? colors.successSoft : colors.dangerSoft;
  const reportDateLabel = formatReportDate(selectedDate);
  const sectionDateLabel = formatSectionDate(selectedDate);
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
      contentContainerStyle={{ paddingBottom: compact ? 104 : 118 }}
    >
      {/* Toggle Ventes / Sorties */}
      <View
        style={{
          marginTop: compact ? 20 : 28,
          flexDirection: 'row',
          backgroundColor: colors.gray100,
          borderRadius: 16,
          padding: 4,
        }}
      >
        {(['sales', 'expenses'] as AnalyticsType[]).map((t) => {
          const isActive = type === t;
          const tAccent = t === 'sales' ? colors.primary : colors.accentOrange;
          const tAccentSoft = t === 'sales' ? colors.primarySoft : colors.accentOrangeSoft;

          return (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={{
                flex: 1,
                height: 38,
                borderRadius: 13,
                backgroundColor: isActive ? tAccentSoft : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: isActive ? tAccent : colors.gray500 }}>
                {t === 'sales' ? 'Ventes' : 'Sorties'}
              </Text>
            </Pressable>
          );
        })}
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
          <Text style={{ color: colors.gray900, fontSize: 16, fontWeight: '600' }}>
            {reportDateLabel}
          </Text>
          <MaterialCommunityIcons name="menu-down" size={22} color={colors.gray600} />
        </Pressable>

        <Pressable
          onPress={toggleDateFilter}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.68 : 1,
          })}
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={23} color={colors.primary} />
        </Pressable>
      </View>

      {dateFilterOpen ? (
        <View
          style={{
            marginTop: 8,
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: colors.gray50,
            borderWidth: 1,
            borderColor: colors.gray100,
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
              <Feather name="chevron-left" size={20} color={colors.gray600} />
            </Pressable>

            <Text style={{ color: colors.gray900, fontSize: 15, fontWeight: '800', textTransform: 'capitalize' }}>
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
              <Feather name="chevron-right" size={20} color={colors.gray600} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, index) => (
              <Text
                key={`${label}-${index}`}
                style={{
                  flex: 1,
                  color: colors.gray400,
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
                        backgroundColor: isSelected ? colors.primary : isToday ? colors.primarySoft : 'transparent',
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: colors.primaryDisabled,
                        opacity: isFuture ? 0.28 : pressed ? 0.62 : 1,
                      })}
                    >
                      <Text
                        style={{
                          color: isSelected ? colors.white : isToday ? colors.primary : colors.gray900,
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
              backgroundColor: colors.primarySoft,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              opacity: pressed ? 0.64 : 1,
            })}
          >
            <MaterialCommunityIcons name="calendar-today" size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '800' }}>{"Aujourd'hui"}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Total + tendance + graphique */}
      <View
        style={{
          marginTop: compact ? 12 : 16,
          backgroundColor: accentSoft,
          borderRadius: 16,
          borderCurve: 'continuous',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 4,
        }}
      >
        <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '500' }}>
          Total {type === 'sales' ? 'Ventes' : 'Sorties'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
          <Text
            style={{
              color: colors.gray900,
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
                color: trendUp ? colors.successMuted : colors.danger,
                fontSize: 13,
                fontWeight: '700',
                paddingBottom: 6,
              }}
            >
              {trendUp ? '↗' : '↘'} {Math.abs(trendPct).toFixed(1)}% vs période préc.
            </Text>
          )}
        </View>

        {loading ? (
          <View style={{ height: 176, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={accent} />
          </View>
        ) : (
          <ReportChart data={data} selectedDate={selectedDate} amountsVisible={amountsVisible} accent={accent} />
        )}
      </View>

      {/* Historique transactions */}
      {!loading && data.transactions.length > 0 && (
        <View style={{ marginTop: compact ? 22 : 28 }}>
          <ReportSectionTitle title="Mouvements argent" date={sectionDateLabel} />
          <View style={{ gap: 10 }}>
            {data.transactions.map((t) => (
              <View
                key={t.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.white,
                  borderRadius: 16,
                  borderCurve: 'continuous',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  gap: 12,
                  boxShadow: '0 6px 16px rgba(23, 23, 31, 0.05)',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: historyBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name="arrow-up-right" size={20} color={historyAccent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: colors.gray900, fontSize: 14, fontWeight: '700' }}>
                    {t.label}
                  </Text>
                  {t.sub ? (
                    <Text numberOfLines={1} style={{ color: colors.gray500, fontSize: 12, marginTop: 1 }}>
                      {t.sub}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: colors.gray900, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {amountsVisible ? formatMoney(t.amount) : '•••'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!loading && stockMovements.length > 0 && (
        <View style={{ marginTop: data.transactions.length > 0 ? 12 : compact ? 22 : 28 }}>
          <ReportSectionTitle title="Mouvements stock" date={sectionDateLabel} />

          <View style={{ gap: 10 }}>
            {stockMovements.map((movement) => (
              <StockMovementItem key={movement.$id} movement={movement} />
            ))}
          </View>
        </View>
      )}

      {!loading && data.transactions.length === 0 && stockMovements.length === 0 && (
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ color: colors.gray300, fontSize: 15 }}>Aucune donnée pour cette date</Text>
        </View>
      )}
    </ScrollView>
  );
}
