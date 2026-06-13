import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type {
  AssetDocumentListItem,
  AssetListItem,
  AssetTaskCompletionListItem,
  RepairEventListItem,
} from '../data/homeVaultSampleData';
import { formatDocumentAttachmentStatus } from '../data/documentAttachmentLabels';
import { getAssetStatusLabel } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type AssetDetailScreenProps = {
  asset: AssetListItem;
  documents: AssetDocumentListItem[];
  repairEvents: RepairEventListItem[];
  taskCompletions: AssetTaskCompletionListItem[];
  onBack: () => void;
  onAddDocument: () => void;
  onAddTask: () => void;
  onDocumentPress: (documentId: string) => void;
  onEdit: () => void;
  onDeleteRepair: (repairEventId: string) => Promise<void>;
  onRecordRepair: () => void;
};

export function AssetDetailScreen({
  asset,
  documents,
  repairEvents,
  taskCompletions,
  onBack,
  onAddDocument,
  onAddTask,
  onDocumentPress,
  onEdit,
  onDeleteRepair,
  onRecordRepair,
}: AssetDetailScreenProps) {
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
          <Pressable onPress={onRecordRepair} style={styles.secondaryButton} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Repair</Text>
          </Pressable>
          <Pressable onPress={onEdit} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>{asset.category}</Text>
        <Text style={styles.title}>{asset.name}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{getAssetStatusLabel(asset.status)}</Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <DetailItem label="Room" value={asset.roomName} />
        <DetailItem label="Brand" value={asset.brand ?? 'Not recorded'} />
        <DetailItem label="Model" value={asset.model ?? 'Not recorded'} />
        <DetailItem label="Serial" value={asset.serial ?? 'Not recorded'} />
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Maintenance context</Text>
          <Pressable
            onPress={onAddTask}
            style={styles.linkButton}
            accessibilityRole="button"
          >
            <Text style={styles.linkButtonText}>Add task</Text>
          </Pressable>
        </View>
        <DetailLine label="Last service" value={asset.lastServiceLabel} />
        <DetailLine label="Next task" value={asset.nextTaskLabel} />
        <DetailLine label="Documents" value={`${asset.documentCount} linked`} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.notes}>{asset.notes ?? 'No notes yet.'}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <Pressable
            onPress={onAddDocument}
            style={styles.linkButton}
            accessibilityRole="button"
          >
            <Text style={styles.linkButtonText}>Add</Text>
          </Pressable>
        </View>
        {documents.length > 0 ? (
          documents.map((document) => (
            <Pressable
              key={document.id}
              onPress={() => onDocumentPress(document.id)}
              style={styles.documentRow}
              accessibilityRole="button"
            >
              <View style={styles.documentIcon}>
                <Text style={styles.documentIconText}>{document.typeLabel.slice(0, 1)}</Text>
              </View>
              <View style={styles.documentBody}>
                <Text style={styles.documentTitle}>{document.title}</Text>
                <Text style={styles.documentMeta}>
                  {document.typeLabel} · {document.dateLabel}
                </Text>
                <Text style={styles.documentFileMeta}>
                  {formatDocumentAttachmentStatus(document)}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyAssetSection
            title="No linked documents"
            detail="Attach a receipt, manual, warranty, invoice, or inspection report to this asset."
            actionLabel="Add document"
            onActionPress={onAddDocument}
          />
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Service completions</Text>
        {taskCompletions.length > 0 ? (
          taskCompletions.map((completion) => (
            <View key={completion.id} style={styles.serviceRow}>
              <View style={styles.serviceRowHeader}>
                <Text style={styles.serviceTitle}>{completion.taskTitle}</Text>
                <Text style={styles.serviceDate}>{completion.completedAtLabel}</Text>
              </View>
              <Text style={styles.serviceSummary}>{completion.costLabel}</Text>
              <Text style={styles.serviceDetail}>
                {completion.notes ?? 'No notes recorded.'}
              </Text>
            </View>
          ))
        ) : (
          <EmptyAssetSection
            title="No service completions"
            detail="Create a maintenance task for this asset, then complete it to build service history."
            actionLabel="Add task"
            onActionPress={onAddTask}
          />
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Repair history</Text>
          <Pressable
            onPress={onRecordRepair}
            style={styles.linkButton}
            accessibilityRole="button"
          >
            <Text style={styles.linkButtonText}>Add</Text>
          </Pressable>
        </View>
        {repairEvents.length > 0 ? (
          repairEvents.map((repairEvent) => (
            <View key={repairEvent.id} style={styles.repairRow}>
              <View style={styles.repairRowHeader}>
                <Text style={styles.repairIssue}>{repairEvent.issue}</Text>
                <View style={styles.repairActions}>
                  <Text style={styles.repairDate}>{repairEvent.dateLabel}</Text>
                  <Pressable
                    onPress={() =>
                      confirmDeleteRepair(repairEvent.issue, () => onDeleteRepair(repairEvent.id))
                    }
                    style={styles.inlineDangerButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.inlineDangerText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.repairSummary}>{repairEvent.summaryLabel}</Text>
              {repairEvent.resolution ? (
                <Text style={styles.repairDetail}>{repairEvent.resolution}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <EmptyAssetSection
            title="No repairs recorded"
            detail="Record one-off repairs, contractor visits, parts, and costs for this asset."
            actionLabel="Record repair"
            onActionPress={onRecordRepair}
          />
        )}
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

function EmptyAssetSection({
  title,
  detail,
  actionLabel,
  onActionPress,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  onActionPress: () => void;
}) {
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{detail}</Text>
      <Pressable onPress={onActionPress} style={styles.emptyAction} accessibilityRole="button">
        <Text style={styles.emptyActionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function confirmDeleteRepair(issue: string, onConfirm: () => Promise<void>) {
  Alert.alert(
    'Delete repair?',
    `"${issue}" will be removed from this local HomeVault preview.`,
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
  heroPanel: {
    minHeight: 150,
    borderRadius: 8,
    backgroundColor: colors.ink,
    padding: 18,
    justifyContent: 'space-between',
  },
  kicker: {
    color: colors.greenSoft,
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
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: colors.green,
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
  sectionHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  linkButton: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: colors.green,
    fontSize: 12,
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
  emptyPanel: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  emptyAction: {
    alignSelf: 'flex-start',
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  documentRow: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  documentIcon: {
    width: 38,
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentIconText: {
    color: colors.amber,
    fontSize: 16,
    fontWeight: '900',
  },
  documentBody: {
    flex: 1,
    gap: 3,
  },
  documentTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  documentMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  documentFileMeta: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 15,
  },
  serviceRow: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 5,
  },
  serviceRowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  serviceDate: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'right',
  },
  serviceSummary: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '900',
  },
  serviceDetail: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  repairRow: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 5,
  },
  repairRowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  repairActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  repairIssue: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  repairDate: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'right',
  },
  inlineDangerButton: {
    minHeight: 26,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineDangerText: {
    color: colors.red,
    fontSize: 11,
    fontWeight: '900',
  },
  repairSummary: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '900',
  },
  repairDetail: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
});
