import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Property } from '@homevault/domain';
import {
  buildHomeVaultExportPackage,
  buildHomeVaultExportManifest,
  createHomeVaultExportFileName,
  formatHomeVaultExportPackage,
  formatHomeVaultExportManifest,
  formatHomeVaultImportPreview,
  type HomeVaultExportPackage,
  type HomeVaultImportPreview,
  parseHomeVaultExportPackage,
  validateHomeVaultExportPackage,
} from '@homevault/export';

import type {
  AssetListItem,
  DocumentListItem,
  RepairEventListItem,
  RoomListItem,
  TaskCompletionListItem,
  TaskListItem,
} from '../data/homeVaultSampleData';
import { sampleBackupPackage } from '../data/sampleBackupPackage';
import { colors } from '../theme/colors';

type ExportManifestScreenProps = {
  property: Property;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  repairEvents: RepairEventListItem[];
  rooms: RoomListItem[];
  taskCompletions: TaskCompletionListItem[];
  tasks: TaskListItem[];
  onBackupCreated: (backupPackage: HomeVaultExportPackage, fileName: string) => void;
  onBack: () => void;
  onFixPress: (fixId: HomeVaultExportPackage['manifest']['checklist'][number]['id']) => void;
  onRestoreBackup: (backupPackage: HomeVaultExportPackage) => Promise<void>;
};

type BackupOperationState = 'idle' | 'validating' | 'ready' | 'restoring' | 'error';

export function ExportManifestScreen({
  property,
  assets,
  documents,
  repairEvents,
  rooms,
  taskCompletions,
  tasks,
  onBackupCreated,
  onBack,
  onFixPress,
  onRestoreBackup,
}: ExportManifestScreenProps) {
  const [downloadStatus, setDownloadStatus] = useState<
    'idle' | 'sharing' | 'downloaded' | 'unsupported'
  >('idle');
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<HomeVaultImportPreview | null>(null);
  const [validatedPackage, setValidatedPackage] = useState<HomeVaultExportPackage | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [operationState, setOperationState] = useState<BackupOperationState>('idle');
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
  const isBusy = operationState === 'validating' || operationState === 'restoring';
  const restoreReady = restoreConfirmText.trim() === 'RESTORE';
  const canRestore = restoreReady && operationState === 'ready';
  const restoreConflicts = validatedPackage
    ? buildRestoreConflicts(validatedPackage, manifest, property)
    : [];

  async function handleDownloadManifest() {
    if (Platform.OS !== 'web') {
      await shareNativeBackup({
        fileName: exportFileName,
        text: packageText,
        onStart: () => setDownloadStatus('sharing'),
        onDone: () => {
          setDownloadStatus('downloaded');
          onBackupCreated(exportPackage, exportFileName);
        },
        onError: () => setDownloadStatus('unsupported'),
      });

      return;
    }

    const didDownload = downloadTextFile({
      fileName: exportFileName,
      mimeType: 'application/json',
      text: packageText,
    });

    setDownloadStatus(didDownload ? 'downloaded' : 'unsupported');

    if (didDownload) {
      onBackupCreated(exportPackage, exportFileName);
    }
  }

  async function handleValidateBackup() {
    setOperationState('validating');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: 'application/json',
      });

      if (result.canceled || result.assets.length === 0) {
        setOperationState(importPreview ? 'ready' : 'idle');
        return;
      }

      const [asset] = result.assets;
      setImportPreview(null);
      setValidatedPackage(null);
      setRestoreConfirmText('');

      if (!asset.file) {
        setOperationState('error');
        setValidationResult('Backup validation is available for downloaded JSON files in the web preview.');
        return;
      }

      const parsed = parseHomeVaultExportPackage(await asset.file.text());

      if (parsed.ok) {
        setImportPreview(parsed.preview);
        setValidatedPackage(parsed.package);
        setRestoreConfirmText('');
        setOperationState('ready');
      } else {
        setOperationState('error');
      }

      setValidationResult(
        parsed.ok
          ? `Valid HomeVault backup: ${parsed.summary}.`
          : `Backup needs review: ${parsed.errors.join(' ')}`,
      );
    } catch (error) {
      setImportPreview(null);
      setValidatedPackage(null);
      setRestoreConfirmText('');
      setOperationState('error');
      setValidationResult(`Backup validation failed: ${formatErrorMessage(error)}`);
    }
  }

  function handleLoadSampleBackup() {
    setImportPreview(null);
    setValidatedPackage(null);
    setRestoreConfirmText('');
    setOperationState('validating');

    const parsed = validateHomeVaultExportPackage(sampleBackupPackage);

    if (parsed.ok) {
      setImportPreview(parsed.preview);
      setValidatedPackage(parsed.package);
      setOperationState('ready');
    } else {
      setOperationState('error');
    }

    setValidationResult(
      parsed.ok
        ? `Sample backup loaded: ${parsed.summary}.`
        : `Sample backup needs review: ${parsed.errors.join(' ')}`,
    );
  }

  function handleRestoreBackup() {
    if (!validatedPackage || !canRestore) {
      return;
    }

    Alert.alert(
      'Restore backup?',
      'This replaces the local HomeVault records in this preview with the validated backup package.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: () => {
            void restoreBackup(validatedPackage);
          },
        },
      ],
    );
  }

  async function restoreBackup(backupPackage: HomeVaultExportPackage) {
    setOperationState('restoring');
    setValidationResult('Restoring validated backup package...');

    try {
      await onRestoreBackup(backupPackage);
      setOperationState('ready');
    } catch (error) {
      setOperationState('error');
      setValidationResult(`Restore failed: ${formatErrorMessage(error)}`);
    }
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

      {reviewItems.length > 0 ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Next fixes</Text>
          <Text style={styles.previewSummary}>
            Resolve these before sharing a backup with someone else.
          </Text>
          {reviewItems.map((item) => (
            <FixRow
              key={item.id}
              label={item.label}
              detail={item.detail}
              action={item.action}
              onPress={() => onFixPress(item.id)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.readyPanel}>
          <Text style={styles.readyTitle}>Ready to back up</Text>
          <Text style={styles.readyText}>
            The manifest checks are clear. Download a JSON package before making major changes or sharing records.
          </Text>
        </View>
      )}

      <View style={styles.downloadPanel}>
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Download package</Text>
          <Text style={styles.downloadMeta}>
            {downloadStatus === 'downloaded'
              ? `${exportFileName} was generated.`
              : downloadStatus === 'sharing'
                ? 'Opening share sheet...'
                : downloadStatus === 'unsupported'
                  ? 'Sharing is not available on this device. Try downloading from the web preview.'
                  : Platform.OS === 'web'
                    ? 'Save manifest and local records as a JSON backup package.'
                    : 'Share or save the backup JSON package to Files or another app.'}
          </Text>
        </View>
        <Pressable
          onPress={() => void handleDownloadManifest()}
          disabled={downloadStatus === 'sharing'}
          style={[styles.primaryButton, downloadStatus === 'sharing' && styles.primaryButtonBusy]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>
            {downloadStatus === 'sharing'
              ? 'Sharing...'
              : Platform.OS === 'web'
                ? 'Download JSON'
                : 'Share backup'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.downloadPanel}>
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Validate backup</Text>
          <Text style={styles.downloadMeta}>
            {validationResult ?? 'Choose a HomeVault JSON package and check its manifest counts.'}
          </Text>
          <Text
            style={[
              styles.operationStatus,
              operationState === 'error' && styles.operationStatusError,
              operationState === 'ready' && styles.operationStatusReady,
            ]}
          >
            {formatOperationState(operationState)}
          </Text>
        </View>
        <View style={styles.actionGroup}>
          <Pressable
            onPress={handleValidateBackup}
            disabled={isBusy}
            style={[styles.secondaryActionButton, isBusy && styles.actionButtonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>
              {operationState === 'validating' ? 'Checking...' : 'Choose JSON'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleLoadSampleBackup}
            disabled={isBusy}
            style={[styles.secondaryActionButton, isBusy && styles.actionButtonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>Load sample</Text>
          </Pressable>
        </View>
      </View>

      {importPreview ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Backup preview</Text>
          <Text style={styles.previewSummary}>
            {formatHomeVaultImportPreview(importPreview)}
          </Text>
          <DetailLine label="Generated" value={formatDateTime(importPreview.generatedAt)} />
          <DetailLine
            label="Service history"
            value={`${importPreview.recordCounts.taskCompletions} completions`}
          />
          <DetailLine
            label="Repair events"
            value={String(importPreview.recordCounts.repairEvents)}
          />
          <Text style={styles.subsectionTitle}>Property</Text>
          <CompareLine
            label="Home label"
            currentText={property.label}
            backupText={importPreview.propertyLabel}
          />
          <Text style={styles.subsectionTitle}>Record counts</Text>
          <CompareLine
            label="Rooms & areas"
            currentValue={manifest.recordCounts.rooms}
            backupValue={importPreview.recordCounts.rooms}
          />
          <CompareLine
            label="Assets"
            currentValue={manifest.recordCounts.assets}
            backupValue={importPreview.recordCounts.assets}
          />
          <CompareLine
            label="Documents"
            currentValue={manifest.recordCounts.documents}
            backupValue={importPreview.recordCounts.documents}
          />
          <CompareLine
            label="Maintenance tasks"
            currentValue={manifest.recordCounts.tasks}
            backupValue={importPreview.recordCounts.tasks}
          />
          <CompareLine
            label="Service completions"
            currentValue={manifest.recordCounts.taskCompletions}
            backupValue={importPreview.recordCounts.taskCompletions}
          />
          <CompareLine
            label="Repairs"
            currentValue={manifest.recordCounts.repairEvents}
            backupValue={importPreview.recordCounts.repairEvents}
          />
          {validatedPackage?.manifest.coverage ? (
            <>
              <Text style={styles.subsectionTitle}>Coverage</Text>
              <CompareLine
                label="Documented assets"
                currentValue={manifest.coverage.documentedAssetCount}
                backupValue={validatedPackage.manifest.coverage.documentedAssetCount}
              />
              <CompareLine
                label="Attached files"
                currentValue={manifest.coverage.attachedDocumentCount}
                backupValue={validatedPackage.manifest.coverage.attachedDocumentCount}
              />
              <CompareLine
                label="Linked documents"
                currentValue={manifest.coverage.linkedDocumentCount}
                backupValue={validatedPackage.manifest.coverage.linkedDocumentCount}
              />
            </>
          ) : null}
          {validatedPackage?.records.assets && validatedPackage.records.assets.length > 0 ? (
            <>
              <Text style={styles.subsectionTitle}>Assets in backup</Text>
              {validatedPackage.records.assets.slice(0, 4).map((asset) => (
                <View key={asset.id} style={styles.backupAssetRow}>
                  <Text style={styles.backupAssetName}>{asset.name}</Text>
                  <Text style={styles.backupAssetMeta}>{asset.category}</Text>
                </View>
              ))}
              {validatedPackage.records.assets.length > 4 ? (
                <Text style={styles.backupAssetOverflow}>
                  +{validatedPackage.records.assets.length - 4} more
                </Text>
              ) : null}
            </>
          ) : null}
          {restoreConflicts.length > 0 ? (
            <View style={styles.conflictPanel}>
              <Text style={styles.conflictTitle}>Conflict warnings</Text>
              {restoreConflicts.map((conflict) => (
                <View key={conflict.id} style={styles.conflictRow}>
                  <Text style={styles.conflictBullet}>!</Text>
                  <Text style={styles.conflictText}>{conflict.message}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={styles.subsectionTitle}>Dry-run checklist</Text>
          <View style={styles.restoreChecklist}>
            <RestorePlanRow
              label="Package validated"
              detail="Manifest counts match the included records."
              state="ready"
            />
            <RestorePlanRow
              label="Differences reviewed"
              detail="Current and backup record counts are shown above."
              state="ready"
            />
            {restoreConflicts.length > 0 ? (
              <RestorePlanRow
                label="Conflicts acknowledged"
                detail={`${restoreConflicts.length} conflict warning${restoreConflicts.length === 1 ? '' : 's'} — review before restoring.`}
                state="pending"
              />
            ) : (
              <RestorePlanRow
                label="No conflicts detected"
                detail="Backup property and record counts are compatible."
                state="ready"
              />
            )}
            <RestorePlanRow
              label="Overwrite warning"
              detail="Restore replaces all current local records."
              state="ready"
            />
            <RestorePlanRow
              label="Typed confirmation"
              detail={canRestore ? 'Restore action is enabled.' : 'Type RESTORE to enable restore.'}
              state={restoreReady ? 'ready' : 'pending'}
            />
          </View>
          <View style={styles.restoreWarning}>
            <Text style={styles.restoreWarningTitle}>Restore will overwrite this preview</Text>
            <Text style={styles.restoreWarningText}>
              Current rooms, assets, documents, tasks, service history, and repairs will be replaced
              with the validated backup package.
            </Text>
            <TextInput
              value={restoreConfirmText}
              onChangeText={setRestoreConfirmText}
              placeholder="Type RESTORE to enable"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.restoreInput}
            />
          </View>
          <Pressable
            onPress={handleRestoreBackup}
            disabled={!canRestore}
            style={[
              styles.restoreButton,
              !canRestore && styles.restoreButtonDisabled,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.restoreButtonText}>
              {operationState === 'restoring' ? 'Restoring...' : 'Restore this backup'}
            </Text>
          </Pressable>
        </View>
      ) : null}

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
              <Text style={styles.checkAction}>{item.action}</Text>
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

function FixRow({
  action,
  detail,
  label,
  onPress,
}: {
  action: string;
  detail: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" style={styles.fixRow} onPress={onPress}>
      <View style={styles.fixMarker}>
        <Text style={styles.fixMarkerText}>Fix</Text>
      </View>
      <View style={styles.fixBody}>
        <Text style={styles.fixTitle}>{label}</Text>
        <Text style={styles.fixDetail}>{detail}</Text>
        <Text style={styles.fixAction}>{action}</Text>
      </View>
      <Text style={styles.fixOpen}>Open</Text>
    </Pressable>
  );
}

function CompareLine(
  props:
    | { label: string; currentValue: number; backupValue: number; currentText?: undefined; backupText?: undefined }
    | { label: string; currentText: string; backupText: string; currentValue?: undefined; backupValue?: undefined },
) {
  const { label } = props;

  if (props.currentText !== undefined) {
    const same = props.currentText === props.backupText;

    return (
      <View style={styles.compareLine}>
        <Text style={styles.compareLabel}>{label}</Text>
        <View style={styles.compareValues}>
          <Text style={styles.compareValue}>{props.currentText}</Text>
          <Text style={styles.compareArrow}>→</Text>
          <Text style={[styles.compareValue, !same && styles.compareValueChanged]}>
            {props.backupText}
          </Text>
          {same ? null : (
            <Text style={styles.compareDeltaNegative}>Different</Text>
          )}
        </View>
      </View>
    );
  }

  const currentValue = props.currentValue ?? 0;
  const backupValue = props.backupValue ?? 0;
  const delta = backupValue - currentValue;
  const deltaLabel = delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${delta}`;

  return (
    <View style={styles.compareLine}>
      <Text style={styles.compareLabel}>{label}</Text>
      <View style={styles.compareValues}>
        <Text style={styles.compareValue}>{currentValue} now</Text>
        <Text style={styles.compareArrow}>to</Text>
        <Text style={styles.compareValue}>{backupValue} backup</Text>
        <Text
          style={[
            styles.compareDelta,
            delta < 0 && styles.compareDeltaNegative,
            delta > 0 && styles.compareDeltaPositive,
          ]}
        >
          {deltaLabel}
        </Text>
      </View>
    </View>
  );
}

function RestorePlanRow({
  label,
  detail,
  state,
}: {
  label: string;
  detail: string;
  state: 'pending' | 'ready';
}) {
  return (
    <View style={styles.restorePlanRow}>
      <View
        style={[
          styles.restorePlanBadge,
          state === 'pending' && styles.restorePlanBadgePending,
        ]}
      >
        <Text
          style={[
            styles.restorePlanBadgeText,
            state === 'pending' && styles.restorePlanBadgeTextPending,
          ]}
        >
          {state === 'ready' ? 'Ready' : 'Pending'}
        </Text>
      </View>
      <View style={styles.restorePlanBody}>
        <Text style={styles.restorePlanTitle}>{label}</Text>
        <Text style={styles.restorePlanDetail}>{detail}</Text>
      </View>
    </View>
  );
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

function formatOperationState(state: BackupOperationState) {
  switch (state) {
    case 'validating':
      return 'Checking backup package...';
    case 'ready':
      return 'Backup package is ready to restore.';
    case 'restoring':
      return 'Restore is running...';
    case 'error':
      return 'Needs attention before continuing.';
    case 'idle':
    default:
      return 'Waiting for a backup package.';
  }
}

function formatErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

type RestoreConflict = {
  id: string;
  message: string;
};

function buildRestoreConflicts(
  pkg: HomeVaultExportPackage,
  currentManifest: ReturnType<typeof buildHomeVaultExportManifest>,
  currentProperty: Property,
): RestoreConflict[] {
  const conflicts: RestoreConflict[] = [];

  if (pkg.records.property.id !== currentProperty.id) {
    conflicts.push({
      id: 'property_mismatch',
      message: `Backup is from a different property ("${pkg.manifest.property.label}"). All current records will be replaced with data from the backup home.`,
    });
  }

  const lossChecks: Array<{ key: keyof typeof currentManifest.recordCounts; label: string }> = [
    { key: 'assets', label: 'assets' },
    { key: 'rooms', label: 'rooms' },
    { key: 'documents', label: 'documents' },
    { key: 'tasks', label: 'maintenance tasks' },
    { key: 'taskCompletions', label: 'service completions' },
    { key: 'repairEvents', label: 'repair events' },
  ];

  for (const { key, label } of lossChecks) {
    const currentCount = currentManifest.recordCounts[key];
    const backupCount = pkg.manifest.recordCounts[key];
    const loss = currentCount - backupCount;

    if (loss > 0) {
      conflicts.push({
        id: `fewer_${key}`,
        message: `Backup has ${loss} fewer ${label} than the current records. ${loss === 1 ? 'That record' : 'Those records'} will not be in the restored data.`,
      });
    }
  }

  return conflicts;
}

async function shareNativeBackup({
  fileName,
  text,
  onStart,
  onDone,
  onError,
}: {
  fileName: string;
  text: string;
  onStart: () => void;
  onDone: () => void;
  onError: () => void;
}) {
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    onError();
    return;
  }

  onStart();

  try {
    const file = new File(Paths.cache, fileName);
    file.write(text);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save HomeVault backup',
      UTI: 'public.json',
    });
    onDone();
  } catch {
    onError();
  }
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
  primaryButtonBusy: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  secondaryActionButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  operationStatus: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  operationStatusError: {
    color: colors.red,
  },
  operationStatusReady: {
    color: colors.green,
  },
  actionGroup: {
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  restoreButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  restoreButtonDisabled: {
    opacity: 0.45,
  },
  restoreButtonText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
  },
  restoreWarning: {
    borderRadius: 8,
    borderColor: colors.redSoft,
    borderWidth: 1,
    backgroundColor: '#FFF8F8',
    padding: 12,
    gap: 8,
  },
  restoreWarningTitle: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
  },
  restoreWarningText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  restoreInput: {
    minHeight: 40,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 10,
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
  readyPanel: {
    borderRadius: 8,
    borderColor: '#B8D7CB',
    borderWidth: 1,
    backgroundColor: colors.greenSoft,
    padding: 14,
    gap: 6,
  },
  readyTitle: {
    color: colors.green,
    fontSize: 15,
    fontWeight: '900',
  },
  readyText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
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
  checkAction: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  previewSummary: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  fixRow: {
    minHeight: 70,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  fixMarker: {
    minHeight: 28,
    minWidth: 42,
    borderRadius: 7,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixMarkerText: {
    color: colors.amber,
    fontSize: 10,
    fontWeight: '900',
  },
  fixBody: {
    flex: 1,
    gap: 3,
  },
  fixTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  fixDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  fixAction: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 17,
  },
  fixOpen: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 16,
    paddingTop: 1,
    textTransform: 'uppercase',
  },
  subsectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 6,
  },
  compareLine: {
    minHeight: 42,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 9,
    gap: 5,
  },
  compareLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  compareValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  compareValue: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  compareArrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  compareDelta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  compareDeltaNegative: {
    color: colors.red,
  },
  compareDeltaPositive: {
    color: colors.green,
  },
  compareValueChanged: {
    color: colors.amber,
  },
  backupAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 10,
  },
  backupAssetName: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  backupAssetMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  backupAssetOverflow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    paddingTop: 4,
  },
  conflictPanel: {
    borderRadius: 8,
    borderColor: colors.amberSoft,
    borderWidth: 1,
    backgroundColor: '#FFFBF0',
    padding: 12,
    gap: 10,
  },
  conflictTitle: {
    color: colors.amber,
    fontSize: 13,
    fontWeight: '900',
  },
  conflictRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  conflictBullet: {
    color: colors.amber,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  conflictText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  restoreChecklist: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.page,
  },
  restorePlanRow: {
    minHeight: 58,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  restorePlanBadge: {
    minHeight: 26,
    minWidth: 62,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restorePlanBadgePending: {
    backgroundColor: colors.amberSoft,
  },
  restorePlanBadgeText: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '900',
  },
  restorePlanBadgeTextPending: {
    color: colors.amber,
  },
  restorePlanBody: {
    flex: 1,
    gap: 3,
  },
  restorePlanTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  restorePlanDetail: {
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
