import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Property, RoomArea } from '@homevault/domain';

import { SectionTitle } from '../components/SectionTitle';
import type { RoomListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type HouseholdScreenProps = {
  activeTaskCount: number;
  assetCount: number;
  backupSummary?: BackupSummary;
  documentCount: number;
  documentedAssetCount: number;
  isDemo: boolean;
  linkedDocumentCount: number;
  property: Property;
  restoreSummary?: RestoreSummary;
  rooms: RoomListItem[];
  onAddRoom: () => void;
  onDismissRestoreNotice: () => void;
  onEditProperty: () => void;
  onExportManifest: () => void;
  onResetDemoData: () => void;
  onRoomPress: (roomId: string) => void;
};

type RestoreSummary = {
  generatedAt: string;
  propertyLabel: string;
  recordCounts: {
    rooms: number;
    assets: number;
    documents: number;
    tasks: number;
    taskCompletions: number;
    repairEvents: number;
  };
  restoredAt: string;
};

type BackupSummary = {
  generatedAt: string;
  fileName?: string;
  kind: 'created' | 'restored';
  propertyLabel: string;
  recordCounts: {
    rooms: number;
    assets: number;
    documents: number;
    tasks: number;
    taskCompletions: number;
    repairEvents: number;
  };
  updatedAt: string;
};

export function HouseholdScreen({
  activeTaskCount,
  assetCount,
  backupSummary,
  documentCount,
  documentedAssetCount,
  isDemo,
  linkedDocumentCount,
  property,
  restoreSummary,
  rooms,
  onAddRoom,
  onDismissRestoreNotice,
  onEditProperty,
  onExportManifest,
  onResetDemoData,
  onRoomPress,
}: HouseholdScreenProps) {
  const readinessScore = calculateReadinessScore({
    activeTaskCount,
    assetCount,
    documentCount,
    documentedAssetCount,
    linkedDocumentCount,
    roomCount: rooms.length,
  });
  const readinessLabel =
    readinessScore >= 80 ? 'Strong coverage' : readinessScore >= 55 ? 'Getting organized' : 'Needs setup';

  return (
    <View style={styles.screen}>
      <View style={styles.householdPanel}>
        <Text style={styles.kicker}>Household</Text>
        <Text style={styles.focusTitle}>{readinessScore}% ready</Text>
        <Text style={styles.focusMeta}>
          {readinessLabel} · {formatCount(rooms.length, 'area')} · {formatCount(assetCount, 'asset')}
        </Text>
      </View>

      {isDemo ? (
        <View style={styles.demoPanel}>
          <View style={styles.demoBody}>
            <Text style={styles.demoTitle}>Demo workspace</Text>
            <Text style={styles.demoText}>
              These seeded records stay local to this preview. Rename the home and replace sample areas,
              assets, documents, and tasks with your own household records.
            </Text>
          </View>
          <View style={styles.demoActions}>
            <Pressable onPress={onEditProperty} style={styles.demoPrimaryAction} accessibilityRole="button">
              <Text style={styles.demoPrimaryActionText}>Edit home</Text>
            </Pressable>
            <Pressable
              onPress={() => confirmResetDemoData(onResetDemoData)}
              style={styles.demoSecondaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.demoSecondaryActionText}>Reset demo</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {restoreSummary ? (
        <View style={styles.noticePanel}>
          <View style={styles.noticeHeader}>
            <Text style={styles.noticeTitle}>Backup restored</Text>
            <Pressable
              onPress={onDismissRestoreNotice}
              style={styles.noticeDismiss}
              accessibilityRole="button"
            >
              <Text style={styles.noticeDismissText}>Dismiss</Text>
            </Pressable>
          </View>
          <Text style={styles.noticeText}>
            {restoreSummary.propertyLabel} restored at {formatDateTime(restoreSummary.restoredAt)}.
          </Text>
          <Text style={styles.noticeMeta}>
            Backup generated {formatDateTime(restoreSummary.generatedAt)}
          </Text>
          <View style={styles.noticeCounts}>
            <RestoreCount label="Areas" value={restoreSummary.recordCounts.rooms} />
            <RestoreCount label="Assets" value={restoreSummary.recordCounts.assets} />
            <RestoreCount label="Docs" value={restoreSummary.recordCounts.documents} />
            <RestoreCount label="Tasks" value={restoreSummary.recordCounts.tasks} />
            <RestoreCount
              label="History"
              value={
                restoreSummary.recordCounts.taskCompletions +
                restoreSummary.recordCounts.repairEvents
              }
            />
          </View>
        </View>
      ) : null}

      <SectionTitle title="Property" action="Edit" onActionPress={onEditProperty} />
      <Pressable
        onPress={onEditProperty}
        style={styles.propertyCard}
        accessibilityRole="button"
      >
        <View style={styles.propertyPhoto}>
          <Text style={styles.propertyPhotoText}>{propertyInitials(property.label)}</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{property.label}</Text>
          <Text style={styles.rowMeta}>
            {formatPropertyType(property.type)}
            {property.yearBuilt ? ` · Built ${property.yearBuilt}` : ''}
            {property.purchaseDate ? ` · Purchased ${property.purchaseDate.slice(0, 4)}` : ''}
          </Text>
          {property.addressLabel ? (
            <Text style={styles.rowMeta}>{property.addressLabel}</Text>
          ) : null}
        </View>
      </Pressable>

      <SectionTitle title="Rooms & areas" action="Add area" onActionPress={onAddRoom} />
      {rooms.length > 0 ? (
        <View style={styles.readinessList}>
          {rooms.map((room) => (
            <Pressable
              key={room.id}
              onPress={() => onRoomPress(room.id)}
              style={styles.readinessRow}
              accessibilityRole="button"
            >
              <View>
                <Text style={styles.readinessLabel}>{room.name}</Text>
                <Text style={styles.roomMeta}>
                  {formatRoomType(room.type)}{room.floor ? ` · ${room.floor}` : ''}
                </Text>
              </View>
              <View style={styles.roomCounts}>
                <Text style={styles.readinessValue}>{formatCount(room.assetCount, 'asset')}</Text>
                <Text style={styles.roomCountMeta}>
                  {room.activeTaskCount > 0
                    ? formatCount(room.activeTaskCount, 'task')
                    : 'No open tasks'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Map the first area</Text>
          <Text style={styles.emptyText}>
            Add rooms, exterior spaces, or storage areas so assets and tasks can be grouped.
          </Text>
          <Pressable onPress={onAddRoom} style={styles.emptyAction} accessibilityRole="button">
            <Text style={styles.emptyActionText}>Add area</Text>
          </Pressable>
        </View>
      )}

      <SectionTitle title="Readiness" action="Backup" />
      <View style={styles.readinessList}>
        <View style={styles.readinessRow}>
          <View>
            <Text style={styles.readinessLabel}>Offline records</Text>
            <Text style={styles.roomMeta}>Stored on this device for quick access</Text>
          </View>
          <Text style={styles.readinessValue}>Available</Text>
        </View>
        <View style={styles.readinessRow}>
          <View>
            <Text style={styles.readinessLabel}>Document coverage</Text>
            <Text style={styles.roomMeta}>Assets with at least one linked record</Text>
          </View>
          <Text style={styles.readinessValue}>
            {documentedAssetCount}/{assetCount || 0}
          </Text>
        </View>
        <View style={styles.readinessRow}>
          <View>
            <Text style={styles.readinessLabel}>Linked documents</Text>
            <Text style={styles.roomMeta}>Receipts, manuals, and policy records connected</Text>
          </View>
          <Text style={styles.readinessValue}>
            {linkedDocumentCount}/{documentCount || 0}
          </Text>
        </View>
        <View style={styles.readinessRow}>
          <View>
            <Text style={styles.readinessLabel}>Open maintenance</Text>
            <Text style={styles.roomMeta}>Tasks still needing attention</Text>
          </View>
          <Text style={styles.readinessValue}>
            {activeTaskCount > 0 ? formatCount(activeTaskCount, 'task') : 'Clear'}
          </Text>
        </View>
        <View style={styles.backupStatusRow}>
          <View style={styles.backupStatusHeader}>
            <View style={styles.backupStatusBody}>
              <Text style={styles.readinessLabel}>Backup status</Text>
              <Text style={styles.roomMeta}>
                {backupSummary
                  ? `${formatBackupKind(backupSummary.kind)} ${formatDateTime(backupSummary.updatedAt)}`
                  : 'No backup created in this session'}
              </Text>
            </View>
            <Text style={styles.readinessValue}>
              {backupSummary ? 'Current' : 'Not started'}
            </Text>
          </View>
          {backupSummary ? (
            <>
              <Text style={styles.backupMeta} numberOfLines={2}>
                {backupSummary.fileName ?? backupSummary.propertyLabel}
              </Text>
              <View style={styles.noticeCounts}>
                <RestoreCount label="Areas" value={backupSummary.recordCounts.rooms} />
                <RestoreCount label="Assets" value={backupSummary.recordCounts.assets} />
                <RestoreCount label="Docs" value={backupSummary.recordCounts.documents} />
                <RestoreCount label="Tasks" value={backupSummary.recordCounts.tasks} />
                <RestoreCount
                  label="History"
                  value={
                    backupSummary.recordCounts.taskCompletions +
                    backupSummary.recordCounts.repairEvents
                  }
                />
              </View>
            </>
          ) : null}
        </View>
        <Pressable
          onPress={onExportManifest}
          style={styles.readinessRow}
          accessibilityRole="button"
        >
          <View>
            <Text style={styles.readinessLabel}>Export manifest</Text>
            <Text style={styles.roomMeta}>Review local record coverage</Text>
          </View>
          <Text style={styles.readinessValue}>Open</Text>
        </Pressable>
        <View style={styles.readinessRow}>
          <View>
            <Text style={styles.readinessLabel}>Demo data</Text>
            <Text style={styles.roomMeta}>Restore seeded home records</Text>
          </View>
          <Pressable
            onPress={() => confirmResetDemoData(onResetDemoData)}
            style={styles.resetButton}
            accessibilityRole="button"
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RestoreCount({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.noticeCountPill}>
      <Text style={styles.noticeCountValue}>{value}</Text>
      <Text style={styles.noticeCountLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  householdPanel: {
    backgroundColor: colors.greenSoft,
    borderColor: '#B8D7CB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  noticePanel: {
    backgroundColor: colors.blueSoft,
    borderColor: '#B9D2E7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  demoPanel: {
    borderRadius: 8,
    borderColor: '#B9D2E7',
    borderWidth: 1,
    backgroundColor: colors.blueSoft,
    padding: 14,
    gap: 12,
  },
  demoBody: {
    gap: 5,
  },
  demoTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  demoText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  demoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoPrimaryAction: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoPrimaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  demoSecondaryAction: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoSecondaryActionText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  noticeHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  noticeTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  noticeDismiss: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeDismissText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
  },
  noticeText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  noticeMeta: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  noticeCounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noticeCountPill: {
    minHeight: 40,
    minWidth: 66,
    borderRadius: 8,
    backgroundColor: colors.panel,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  noticeCountValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  noticeCountLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 1,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  focusTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: 0,
  },
  focusMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  propertyCard: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  propertyPhoto: {
    width: 62,
    height: 62,
    borderRadius: 8,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyPhotoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  readinessList: {
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
  },
  readinessRow: {
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  backupStatusRow: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 8,
  },
  backupStatusHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  backupStatusBody: {
    flex: 1,
  },
  backupMeta: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  readinessLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  readinessValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  roomCounts: {
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: 12,
  },
  roomCountMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  resetButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
  },
  roomMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyAction: {
    alignSelf: 'flex-start',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});

function propertyInitials(label: string) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function formatRoomType(type: RoomArea['type']) {
  return type.slice(0, 1).toUpperCase() + type.slice(1);
}

function formatPropertyType(type: Property['type']) {
  switch (type) {
    case 'single_family':
      return 'Single-family';
    case 'multi_unit':
      return 'Multi-unit';
    case 'townhome':
      return 'Townhome';
    case 'condo':
      return 'Condo';
    case 'other':
    default:
      return 'Other';
  }
}

function formatCount(value: number, singular: string) {
  return `${value} ${singular}${value === 1 ? '' : 's'}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatBackupKind(kind: BackupSummary['kind']) {
  return kind === 'created' ? 'Created' : 'Restored';
}

function calculateReadinessScore({
  activeTaskCount,
  assetCount,
  documentCount,
  documentedAssetCount,
  linkedDocumentCount,
  roomCount,
}: {
  activeTaskCount: number;
  assetCount: number;
  documentCount: number;
  documentedAssetCount: number;
  linkedDocumentCount: number;
  roomCount: number;
}) {
  const roomScore = roomCount > 0 ? 20 : 0;
  const assetScore = assetCount > 0 ? 20 : 0;
  const documentScore =
    documentCount > 0 ? Math.round((linkedDocumentCount / documentCount) * 25) : 0;
  const assetDocumentScore =
    assetCount > 0 ? Math.round((documentedAssetCount / assetCount) * 25) : 0;
  const taskPenalty = Math.min(10, activeTaskCount * 2);

  return Math.max(0, Math.min(100, roomScore + assetScore + documentScore + assetDocumentScore + 10 - taskPenalty));
}

function confirmResetDemoData(onConfirm: () => void) {
  Alert.alert(
    'Reset demo data?',
    'This restores the seeded HomeVault records and removes local edits in this preview.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
  );
}
