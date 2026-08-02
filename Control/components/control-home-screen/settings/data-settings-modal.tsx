import { exportDailyReport, exportHistoryCSV } from '@/lib/control-data';
import { getControlErrorMessage } from '@/lib/control-errors';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { formatDayLabel, shareExportFile, shiftDateKey, todayDateKey } from '../utils';

export function DataSettingsModal({
  visible,
  compact,
  onClose,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
}) {
  const today = todayDateKey();
  const [pdfDate, setPdfDate] = useState(today);
  const [csvFrom, setCsvFrom] = useState(shiftDateKey(today, -6));
  const [csvTo, setCsvTo] = useState(today);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleExportPDF() {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const { data, filename } = await exportDailyReport(pdfDate);
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, data, { encoding: FileSystem.EncodingType.Base64 });
      await shareExportFile(path, { mimeType: 'application/pdf', dialogTitle: 'Partager le bilan PDF' });
    } catch (error) {
      showFeedback(getControlErrorMessage(error));
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleExportCSV() {
    if (csvLoading) return;
    if (csvFrom > csvTo) {
      showFeedback('La date de début doit être avant la date de fin.');
      return;
    }
    setCsvLoading(true);
    try {
      const { data, filename } = await exportHistoryCSV(csvFrom, csvTo);
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, data, { encoding: FileSystem.EncodingType.Base64 });
      await shareExportFile(path, { mimeType: 'text/csv', dialogTitle: "Partager l'historique CSV" });
    } catch (error) {
      showFeedback(getControlErrorMessage(error));
    } finally {
      setCsvLoading(false);
    }
  }

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
            gap: 16,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Données</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>Export et historique</Text>
            </View>
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

          {/* Feedback banner */}
          {feedback ? (
            <View style={{ backgroundColor: '#FFF3CD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: '#856404', fontSize: 13, fontWeight: '600' }}>{feedback}</Text>
            </View>
          ) : null}

          {/* Bilan PDF */}
          <View style={{ borderRadius: 18, backgroundColor: '#F7F7F7', padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name="file-chart-outline" size={22} color="#111111" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Bilan journalier</Text>
                <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 1 }}>Export PDF</Text>
              </View>
            </View>
            {/* Date selector */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                onPress={() => setPdfDate(shiftDateKey(pdfDate, -1))}
                style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }}
              >
                <Feather name="chevron-left" size={16} color="#111111" />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EBEBEB', borderRadius: 10, paddingVertical: 6 }}>
                <Text style={{ color: '#111111', fontSize: 13, fontWeight: '700' }}>{formatDayLabel(pdfDate)}</Text>
              </View>
              <Pressable
                onPress={() => pdfDate < today && setPdfDate(shiftDateKey(pdfDate, 1))}
                style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center', opacity: pdfDate >= today ? 0.35 : 1 }}
              >
                <Feather name="chevron-right" size={16} color="#111111" />
              </Pressable>
            </View>
            <Pressable
              onPress={handleExportPDF}
              style={({ pressed }: { pressed: boolean }) => ({
                height: 42,
                borderRadius: 12,
                backgroundColor: '#111111',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed || pdfLoading ? 0.68 : 1,
              })}
            >
              {pdfLoading
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Exporter PDF</Text>
              }
            </Pressable>
          </View>

          {/* Historique CSV */}
          <View style={{ borderRadius: 18, backgroundColor: '#F7F7F7', padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name="table-arrow-down" size={22} color="#111111" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Historique</Text>
                <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 1 }}>Export CSV sur une période</Text>
              </View>
            </View>
            {/* From / To */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', width: 38 }}>Début</Text>
                <Pressable
                  onPress={() => setCsvFrom(shiftDateKey(csvFrom, -1))}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Feather name="chevron-left" size={14} color="#111111" />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EBEBEB', borderRadius: 8, paddingVertical: 5 }}>
                  <Text style={{ color: '#111111', fontSize: 13, fontWeight: '700' }}>{formatDayLabel(csvFrom)}</Text>
                </View>
                <Pressable
                  onPress={() => csvFrom < csvTo && setCsvFrom(shiftDateKey(csvFrom, 1))}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center', opacity: csvFrom >= csvTo ? 0.35 : 1 }}
                >
                  <Feather name="chevron-right" size={14} color="#111111" />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', width: 38 }}>Fin</Text>
                <Pressable
                  onPress={() => csvTo > csvFrom && setCsvTo(shiftDateKey(csvTo, -1))}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center', opacity: csvTo <= csvFrom ? 0.35 : 1 }}
                >
                  <Feather name="chevron-left" size={14} color="#111111" />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EBEBEB', borderRadius: 8, paddingVertical: 5 }}>
                  <Text style={{ color: '#111111', fontSize: 13, fontWeight: '700' }}>{formatDayLabel(csvTo)}</Text>
                </View>
                <Pressable
                  onPress={() => csvTo < today && setCsvTo(shiftDateKey(csvTo, 1))}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center', opacity: csvTo >= today ? 0.35 : 1 }}
                >
                  <Feather name="chevron-right" size={14} color="#111111" />
                </Pressable>
              </View>
            </View>
            <Pressable
              onPress={handleExportCSV}
              style={({ pressed }: { pressed: boolean }) => ({
                height: 42,
                borderRadius: 12,
                backgroundColor: '#111111',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed || csvLoading ? 0.68 : 1,
              })}
            >
              {csvLoading
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Exporter CSV</Text>
              }
            </Pressable>
          </View>

          {/* Sauvegarde info */}
          <View
            style={{
              minHeight: 52,
              borderRadius: 18,
              backgroundColor: '#F7F7F7',
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <MaterialCommunityIcons name="cloud-check-outline" size={22} color="#111111" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Sauvegarde</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 1 }}>Données isolées par boutique sur Appwrite</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
