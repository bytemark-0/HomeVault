import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Property } from '@homevault/domain';
import {
  buildHomeVaultExportPackage,
  buildHomeVaultExportManifest,
  createHomeVaultExportFileName,
  formatHomeVaultExportPackage,
  formatHomeVaultExportManifest,
} from '@homevault/export';

import type {
  AssetListItem,
  DocumentListItem,
  RepairEventListItem,
  RoomListItem,
  TaskCompletionListItem,
  TaskListItem,
} from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type ExportManifestScreenProps = {
  property: Property;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  repairEvents: RepairEventListItem[];
  rooms: RoomListItem[];
  taskCompletions: TaskCompletionListItem[];
  tasks: TaskListItem[];
  onBack: () => void;
};

export function ExportManifestScreen({
  property,
  assets,
  documents,
  repairEvents,
  rooms,
  taskCompletions,
  tasks,
  onBack,
}: ExportManifestScreenProps) {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloaded' | 'unsupported'>(
    'idle',
  );
  const exportInput = {
    property,
    assets,
    documents,
    repairEvents,
    rooms,
    taskCompletions,
    tasks,
  };
  const manifest = buildHomeVaultExportManifest(exportInput);
  const exportPackage = buildHomeVaultExportPackage(exportInput);
  const {
    activeTaskCount,
    attachedDocumentCount,
    documentedAssetCount,
    linkedDocumentCount,
    repairEventsWithCostCount,
  } = manifest.coverage;
  const reviewItems = manifest.checklist.filter((item) => item.state === 'review');
  const heroTitle =
    reviewItems.length > 0
      ? `${reviewItems.length} ${reviewItems.length === 1 ? 'item needs' : 'items need'} review`
      : 'Local records are ready to package.';
  const heroMeta =
    reviewItems.length > 0
      ? reviewItems.map((item) => item.label).join(' · ')
      : `${rooms.length} areas · ${assets.length} assets · ${documents.length} documents`;
  const manifestText = formatHomeVaultExportManifest(manifest);
  const packageText = formatHomeVaultExportPackage(exportPackage);
  const exportFileName = createHomeVaultExportFileName(manifest);

  function handleDownloadManifest() {
    const didDownload = downloadTextFile({
      fileName: exportFileName,
      mimeType: 'application/json',
      text: packageText,
    });

    setDownloadStatus(didDownload ? 'downloaded' : 'unsupported');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Readiness</Text>
          <Text style={styles.title}>Export manifest</Text>
        </View>
        <Pressable onPress={onBack} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.heroLabel}>{property.label}</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        <Text style={styles.heroMeta}>{heroMeta}</Text>
      </View>

      <View style={styles.metricGrid}>
        <Metric label="Linked docs" value={`${linkedDocumentCount}/${documents.length}`} />
        <Metric label="Attached files" value={`${attachedDocumentCount}/${documents.length}`} />
        <Metric label="Open tasks" value={String(activeTaskCount)} />
      </View>

      <View style={styles.downloadPanel}>
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Download package</Text>
          <Text style={styles.downloadMeta}>
            {downloadStatus === 'downloaded'
              ? `${exportFileName} was generated.`
              : downloadStatus === 'unsupported'
                ? 'Download is available in the web preview. Native sharing comes next.'
                : 'Save manifest and local records as a JSON backup package.'}
          </Text>
        </View>
        <Pressable
          onPress={handleDownloadManifest}
          style={styles.primaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Download JSON</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Package checklist</Text>
        {manifest.checklist.map((item) => (
          <View key={item.id} style={styles.checkRow}>
            <View
              style={[
                styles.checkBadge,
                item.state === 'review' && styles.checkBadgeReview,
              ]}
            >
              <Text
                style={[
                  styles.checkBadgeText,
                  item.state === 'review' && styles.checkBadgeTextReview,
                ]}
              >
                {item.state === 'ready' ? 'Ready' : 'Review'}
              </Text>
            </View>
            <View style={styles.checkBody}>
              <Text style={styles.checkTitle}>{item.label}</Text>
              <Text style={styles.checkDetail}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Record counts</Text>
        <DetailLine label="Rooms & areas" value={String(rooms.length)} />
        <DetailLine label="Assets" value={String(assets.length)} />
        <DetailLine label="Documents" value={String(documents.length)} />
        <DetailLine label="Maintenance tasks" value={String(tasks.length)} />
        <DetailLine label="Service completions" value={String(taskCompletions.length)} />
        <DetailLine label="Repair events" value={String(repairEvents.length)} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Coverage</Text>
        <DetailLine
          label="Asset documentation"
          value={`${documentedAssetCount} of ${assets.length}`}
        />
        <DetailLine
          label="File attachments"
          value={`${attachedDocumentCount} of ${documents.length}`}
        />
        <DetailLine
          label="Task history"
          value={`${taskCompletions.length} completions`}
        />
        <DetailLine
          label="Repair costs"
          value={`${repairEventsWithCostCount} recorded`}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Manifest preview</Text>
        <Text style={styles.manifestText}>{manifestText}</Text>
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function downloadTextFile({
  fileName,
  mimeType,
  text,
}: {
  fileName: string;
  mimeType: string;
  text: string;
}) {
  if (Platform.OS !== 'web') {
    return false;
  }

  const webGlobal = globalThis as typeof globalThis & {
    Blob?: typeof Blob;
    URL?: typeof URL;
    document?: Document;
  };

  if (!webGlobal.Blob || !webGlobal.URL || !webGlobal.document) {
    return false;
  }

  const blob = new webGlobal.Blob([text], { type: mimeType });
  const url = webGlobal.URL.createObjectURL(blob);
  const link = webGlobal.document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  webGlobal.document.body.appendChild(link);
  link.click();
  link.remove();
  webGlobal.URL.revokeObjectURL(url);

  return true;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  secondaryButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  heroPanel: {
    minHeight: 150,
    borderRadius: 8,
    backgroundColor: colors.blue,
    padding: 18,
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: colors.blueSoft,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroMeta: {
    color: colors.blueSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  downloadPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  downloadBody: {
    flex: 1,
    gap: 5,
  },
  downloadMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 12,
    justifyContent: 'space-between',
  },
  metricValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  panel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  checkRow: {
    minHeight: 56,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkBadge: {
    minHeight: 28,
    minWidth: 62,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeReview: {
    backgroundColor: colors.amberSoft,
  },
  checkBadgeText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
  },
  checkBadgeTextReview: {
    color: colors.amber,
  },
  checkBody: {
    flex: 1,
    gap: 3,
  },
  checkTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  checkDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  detailLine: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  detailValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  manifestText: {
    color: colors.ink,
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
});
