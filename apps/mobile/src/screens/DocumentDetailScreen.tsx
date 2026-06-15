import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  formatDocumentAttachmentDetail,
  formatDocumentAttachmentStatus,
  formatDocumentAttachmentUri,
  getDocumentAttachmentUri,
} from '../data/documentAttachmentLabels';
import type { DocumentListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type DocumentDetailScreenProps = {
  document: DocumentListItem;
  onBack: () => void;
  onDelete: () => Promise<void>;
  onEdit: () => void;
};

export function DocumentDetailScreen({
  document,
  onBack,
  onDelete,
  onEdit,
}: DocumentDetailScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => confirmDeleteDocument(document.title, onDelete)}
            style={styles.dangerButton}
            accessibilityRole="button"
          >
            <Text style={styles.dangerButtonText}>Delete</Text>
          </Pressable>
          <Pressable onPress={onEdit} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>{document.typeLabel}</Text>
        <Text style={styles.title}>{document.title}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>
            {formatDocumentAttachmentStatus(document)}
          </Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <DetailItem label="Type" value={document.typeLabel} />
        <DetailItem label="Date" value={document.dateLabel} />
        <DetailItem label="Linked to" value={document.linkedToLabel} />
        <DetailItem label="Amount" value={formatAmount(document.amountCents)} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Source</Text>
        <DetailLine label="Linked to" value={document.linkedToLabel} />
        <DetailLine label="Vendor" value={document.vendor ?? 'Not recorded'} />
        <DetailLine label="Attachment" value={formatDocumentAttachmentStatus(document)} />
        <DetailLine label="File" value={formatDocumentAttachmentDetail(document)} />
        <DetailLine label="Location" value={formatDocumentAttachmentUri(document)} />
        {getDocumentAttachmentUri(document) ? (
          <Pressable
            onPress={() => {
              const uri = getDocumentAttachmentUri(document);
              if (uri) void Linking.openURL(uri);
            }}
            style={styles.openFileButton}
            accessibilityRole="button"
            accessibilityLabel="Open attached file"
          >
            <Text style={styles.openFileButtonText}>Open file</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Captured text</Text>
        <Text style={styles.notes}>{document.ocrText ?? 'No text captured yet.'}</Text>
      </View>
    </ScrollView>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLineLabel}>{label}</Text>
      <Text style={styles.detailLineValue}>{value}</Text>
    </View>
  );
}

function formatAmount(value?: number) {
  if (value === undefined) {
    return 'Not recorded';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value / 100);
}

function confirmDeleteDocument(title: string, onConfirm: () => Promise<void>) {
  Alert.alert(
    'Delete document?',
    `"${title}" will be removed from this local HomeVault preview.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void onConfirm();
        },
      },
    ],
  );
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
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  primaryButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dangerButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
  },
  openFileButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderColor: colors.blue,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  openFileButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  heroPanel: {
    minHeight: 150,
    borderRadius: 8,
    backgroundColor: colors.amber,
    padding: 18,
    justifyContent: 'space-between',
  },
  kicker: {
    color: colors.amberSoft,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 0,
  },
  statusPill: {
    alignSelf: 'flex-start',
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: colors.amber,
    fontSize: 12,
    fontWeight: '900',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    width: '48.6%',
    minHeight: 86,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 8,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  detailValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  panel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  detailLine: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLineLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  detailLineValue: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  notes: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
