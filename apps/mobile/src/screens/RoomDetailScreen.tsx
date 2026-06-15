import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  getAssetStatusLabel,
  type AssetListItem,
  type DocumentListItem,
  type RepairEventListItem,
  type RoomServiceCompletionListItem,
  type RoomListItem,
  type TaskListItem,
} from '../data/homeVaultSampleData';
import { formatDocumentAttachmentStatus } from '../data/documentAttachmentLabels';
import { colors } from '../theme/colors';

type RoomDetailScreenProps = {
  room: RoomListItem;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  repairEvents: RepairEventListItem[];
  serviceCompletions: RoomServiceCompletionListItem[];
  tasks: TaskListItem[];
  onAddAsset: () => void;
  onAddDocument: () => void;
  onAddTask: () => void;
  onAssetPress: (assetId: string) => void;
  onBack: () => void;
  onDelete: () => void;
  onDocumentPress: (documentId: string) => void;
  onEdit: () => void;
  onTaskPress: (taskId: string) => void;
};

export function RoomDetailScreen({
  room,
  assets,
  documents,
  repairEvents,
  serviceCompletions,
  tasks,
  onAddAsset,
  onAddDocument,
  onAddTask,
  onAssetPress,
  onBack,
  onDelete,
  onDocumentPress,
  onEdit,
  onTaskPress,
}: RoomDetailScreenProps) {
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
        <Pressable onPress={onEdit} style={styles.primaryButton} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>{formatRoomType(room.type)}</Text>
        <Text style={styles.title}>{room.name}</Text>
        <Text style={styles.heroMeta}>{room.floor ?? 'No floor recorded'}</Text>
      </View>

      {room.photoUri ? (
        <Image
          source={{ uri: room.photoUri }}
          style={styles.roomPhoto}
          resizeMode="cover"
          accessibilityLabel={`Photo of ${room.name}`}
        />
      ) : null}

      <View style={styles.metricGrid}>
        <Metric label="Assets" value={String(room.assetCount)} />
        <Metric label="Documents" value={String(documents.length)} />
        <Metric label="Open tasks" value={String(room.activeTaskCount)} />
        <Metric label="Attention" value={String(room.attentionCount)} />
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assets</Text>
          <Pressable onPress={onAddAsset} style={styles.linkButton} accessibilityRole="button">
            <Text style={styles.linkButtonText}>Add</Text>
          </Pressable>
        </View>
        {assets.length > 0 ? (
          assets.map((asset) => (
            <Pressable
              key={asset.id}
              onPress={() => onAssetPress(asset.id)}
              style={styles.row}
              accessibilityRole="button"
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{asset.name}</Text>
                <Text style={styles.rowMeta}>
                  {asset.category} · {getAssetStatusLabel(asset.status)}
                </Text>
              </View>
              <Text style={styles.rowValue}>{asset.documentCount} docs</Text>
            </Pressable>
          ))
        ) : (
          <EmptyRoomSection
            title="No assets recorded"
            detail="Add appliances, systems, fixtures, or exterior items that live in this area."
            actionLabel="Add asset"
            onActionPress={onAddAsset}
          />
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Open tasks</Text>
          <Pressable onPress={onAddTask} style={styles.linkButton} accessibilityRole="button">
            <Text style={styles.linkButtonText}>Add</Text>
          </Pressable>
        </View>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => onTaskPress(task.id)}
              style={styles.row}
              accessibilityRole="button"
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{task.title}</Text>
                <Text style={styles.rowMeta}>{task.scopeLabel}</Text>
              </View>
              <Text style={styles.rowValue}>{task.dueLabel}</Text>
            </Pressable>
          ))
        ) : (
          <EmptyRoomSection
            title="No open tasks"
            detail="Create room-level reminders for seasonal checks, filter changes, or cleaning work."
            actionLabel="Add task"
            onActionPress={onAddTask}
          />
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Documents nearby</Text>
          <Pressable onPress={onAddDocument} style={styles.linkButton} accessibilityRole="button">
            <Text style={styles.linkButtonText}>Add</Text>
          </Pressable>
        </View>
        {documents.length > 0 ? (
          documents.map((document) => (
            <Pressable
              key={document.id}
              onPress={() => onDocumentPress(document.id)}
              style={styles.row}
              accessibilityRole="button"
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{document.title}</Text>
                <Text style={styles.rowMeta}>
                  {document.typeLabel} · {document.dateLabel}
                </Text>
                <Text style={styles.fileMeta}>
                  {formatDocumentAttachmentStatus(document)}
                </Text>
              </View>
              <Text style={styles.rowValue}>{document.linkedToLabel}</Text>
            </Pressable>
          ))
        ) : (
          <EmptyRoomSection
            title="No linked documents"
            detail="Attach receipts, manuals, warranties, or invoices to this room or its assets."
            actionLabel="Add document"
            onActionPress={onAddDocument}
          />
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Recent repairs</Text>
        {repairEvents.length > 0 ? (
          repairEvents.map((repairEvent) => {
            const linkedAsset = assets.find((asset) => asset.id === repairEvent.assetId);

            return (
              <Pressable
                key={repairEvent.id}
                onPress={() => onAssetPress(repairEvent.assetId)}
                style={styles.row}
                accessibilityRole="button"
              >
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{repairEvent.issue}</Text>
                  <Text style={styles.rowMeta}>
                    {linkedAsset?.name ?? 'Asset'} · {repairEvent.summaryLabel}
                  </Text>
                </View>
                <Text style={styles.rowValue}>{repairEvent.dateLabel}</Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No repairs recorded for assets in this room.</Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Service history</Text>
        {serviceCompletions.length > 0 ? (
          serviceCompletions.map((completion) => (
            <Pressable
              key={completion.id}
              onPress={() => onTaskPress(completion.taskId)}
              style={styles.row}
              accessibilityRole="button"
            >
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{completion.taskTitle}</Text>
                <Text style={styles.rowMeta}>
                  {completion.scopeLabel} · {completion.costLabel}
                </Text>
              </View>
              <Text style={styles.rowValue}>{completion.completedAtLabel}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No completed maintenance recorded for this room.</Text>
        )}
      </View>

      <View style={styles.dangerPanel}>
        <Pressable
          onPress={() => confirmDeleteRoom(room.name, assets.length, onDelete)}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Delete room"
        >
          <Text style={styles.deleteButtonText}>Delete room</Text>
        </Pressable>
        <Text style={styles.deleteHint}>
          {assets.length > 0
            ? `Deletes this room and its ${assets.length} asset${assets.length === 1 ? '' : 's'}, along with their tasks and repair history.`
            : 'Deletes this room and its tasks. No assets are currently linked.'}
          {' Documents stay in your library.'}
        </Text>
      </View>
    </ScrollView>
  );
}

function confirmDeleteRoom(name: string, assetCount: number, onConfirm: () => void) {
  const assetWarning =
    assetCount > 0
      ? ` This will also delete ${assetCount} asset${assetCount === 1 ? '' : 's'} and their tasks and repair history.`
      : '';

  Alert.alert(
    'Delete room?',
    `"${name}" will be permanently removed.${assetWarning} Documents linked to this room's assets will remain in your library.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ],
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

function EmptyRoomSection({
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

function formatRoomType(type: RoomListItem['type']) {
  return type.slice(0, 1).toUpperCase() + type.slice(1);
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
    minHeight: 148,
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
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroMeta: {
    color: colors.greenSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  roomPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48.6%',
    minHeight: 76,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 12,
    justifyContent: 'space-between',
  },
  metricValue: {
    color: colors.ink,
    fontSize: 24,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  linkButton: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
  },
  row: {
    minHeight: 54,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  fileMeta: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 15,
  },
  rowValue: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
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
  dangerPanel: {
    borderRadius: 8,
    borderColor: colors.redSoft,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  deleteButton: {
    minHeight: 42,
    borderRadius: 8,
    borderColor: colors.red,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
  },
  deleteHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
});
