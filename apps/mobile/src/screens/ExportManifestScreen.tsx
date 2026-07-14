import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { shareZipExport } from '../utils/exportZip';
import {
  createEmergencyPacketFileName,
  formatEmergencyPacketText,
  printEmergencyPacket,
} from '../utils/emergencyPacketExport';
import { createOfflineCompanionPackFileName } from '../utils/offlineCompanionPackExport';
import {
  createTrustedShareFileName,
  formatTrustedShareText,
} from '../utils/trustedShareExport';
import { inspectBackupAsset, type ValidatedBackup } from '../utils/backupImport';
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

import type {
  AccessItem,
  ContinuityPlaybook,
  EmergencyContact,
  ImportantAccount,
  PartSupply,
  Property,
} from '@homevault/domain';
import {
  buildHomeVaultEmergencyPacket,
  buildHomeVaultExportPackage,
  buildHomeVaultExportManifest,
  buildHomeVaultOfflineCompanionPack,
  buildHomeVaultTrustedShareArtifact,
  createHomeVaultExportFileName,
  formatSensitiveDataWarning,
  formatHomeVaultExportPackage,
  formatHomeVaultExportManifest,
  formatHomeVaultImportPreview,
  formatHomeVaultOfflineCompanionPack,
  parseHomeVaultOfflineCompanionPack,
  parseHomeVaultItemShareBundle,
  HOMEVAULT_TRUSTED_SHARE_AUDIENCES,
  HOMEVAULT_TRUSTED_SHARE_SECTION_OPTIONS,
  type HomeVaultOfflineCompanionPackImportPreview,
  type HomeVaultOfflineCompanionPackTargetKey,
  type HomeVaultOfflineCompanionPackValidationErrorKind,
  type HomeVaultExportPackage,
  type HomeVaultTrustedShareAudienceKey,
  type HomeVaultTrustedShareSectionKey,
  type HomeVaultExportValidationErrorKind,
  type HomeVaultImportPreview,
  type HomeVaultItemShareBundleImportPreview,
  type HomeVaultItemShareBundleValidationErrorKind,
  validateHomeVaultExportPackage,
} from '@homevault/export';

import {
  SAMPLE_PROPERTY_ID,
  type AssetListItem,
  type DocumentListItem,
  type RepairEventListItem,
  type RoomListItem,
  type TaskCompletionListItem,
  type TaskListItem,
} from '../data/homeVaultSampleData';
import { sampleBackupPackage } from '../data/sampleBackupPackage';
import { colors } from '../theme/colors';
import { confirmLocalStepUp } from '../utils/localStepUpAuth';
import { getExportSensitivity, type SensitivityLevel } from '../utils/sensitivity';

type ExportManifestScreenProps = {
  property: Property;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  accessItems: AccessItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  continuityPlaybooks: ContinuityPlaybook[];
  parts: PartSupply[];
  repairEvents: RepairEventListItem[];
  rooms: RoomListItem[];
  taskCompletions: TaskCompletionListItem[];
  tasks: TaskListItem[];
  initialFocusSection?: 'packet' | 'trusted-share';
  initialTrustedShareAudience?: HomeVaultTrustedShareAudienceKey;
  onBackupCreated: (backupPackage: HomeVaultExportPackage, fileName: string) => void;
  onBack: () => void;
  onFixPress: (fixId: HomeVaultExportPackage['manifest']['checklist'][number]['id']) => void;
  onRestoreBackup: (backup: ValidatedBackup) => Promise<void>;
};

type BackupOperationState = 'idle' | 'validating' | 'ready' | 'restoring' | 'error';
type ItemShareImportState = 'idle' | 'validating' | 'ready' | 'error';
type OfflineCompanionImportState = 'idle' | 'validating' | 'ready' | 'error';
type OfflineCompanionExportState = 'idle' | 'sharing' | 'done' | 'unsupported';
const DEFAULT_TRUSTED_SHARE_AUDIENCE = HOMEVAULT_TRUSTED_SHARE_AUDIENCES[0]?.key ?? 'spouse';

export function ExportManifestScreen({
  property,
  assets,
  documents,
  accessItems,
  emergencyContacts,
  importantAccounts,
  continuityPlaybooks,
  parts,
  repairEvents,
  rooms,
  taskCompletions,
  tasks,
  initialFocusSection,
  initialTrustedShareAudience,
  onBackupCreated,
  onBack,
  onFixPress,
  onRestoreBackup,
}: ExportManifestScreenProps) {
  const [downloadStatus, setDownloadStatus] = useState<
    'idle' | 'sharing' | 'downloaded' | 'unsupported'
  >('idle');
  const [zipStatus, setZipStatus] = useState<
    'idle' | 'building' | 'done' | 'error'
  >('idle');
  const [packetShareStatus, setPacketShareStatus] = useState<
    'idle' | 'sharing' | 'done' | 'unsupported'
  >('idle');
  const [trustedShareStatus, setTrustedShareStatus] = useState<
    'idle' | 'sharing' | 'done' | 'unsupported'
  >('idle');
  const [offlineCompanionStatuses, setOfflineCompanionStatuses] = useState<
    Record<HomeVaultOfflineCompanionPackTargetKey, OfflineCompanionExportState>
  >({
    primary_user: 'idle',
    helper_device: 'idle',
  });
  const [packetPrintStatus, setPacketPrintStatus] = useState<
    'idle' | 'printing' | 'done' | 'error'
  >('idle');
  const [trustedShareAudience, setTrustedShareAudience] =
    useState<HomeVaultTrustedShareAudienceKey>(initialTrustedShareAudience ?? DEFAULT_TRUSTED_SHARE_AUDIENCE);
  const [trustedShareSections, setTrustedShareSections] = useState<HomeVaultTrustedShareSectionKey[]>(
    HOMEVAULT_TRUSTED_SHARE_AUDIENCES.find(
      (audience) => audience.key === (initialTrustedShareAudience ?? DEFAULT_TRUSTED_SHARE_AUDIENCE),
    )?.recommendedSectionKeys ?? [],
  );
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [validationErrorKind, setValidationErrorKind] =
    useState<HomeVaultExportValidationErrorKind | null>(null);
  const [importPreview, setImportPreview] = useState<HomeVaultImportPreview | null>(null);
  const [validatedBackup, setValidatedBackup] = useState<ValidatedBackup | null>(null);
  const [itemShareImportPreview, setItemShareImportPreview] =
    useState<HomeVaultItemShareBundleImportPreview | null>(null);
  const [itemShareValidationResult, setItemShareValidationResult] = useState<string | null>(null);
  const [itemShareValidationErrorKind, setItemShareValidationErrorKind] =
    useState<HomeVaultItemShareBundleValidationErrorKind | null>(null);
  const [itemShareOperationState, setItemShareOperationState] =
    useState<ItemShareImportState>('idle');
  const [offlineCompanionImportPreview, setOfflineCompanionImportPreview] =
    useState<HomeVaultOfflineCompanionPackImportPreview | null>(null);
  const [offlineCompanionValidationResult, setOfflineCompanionValidationResult] =
    useState<string | null>(null);
  const [offlineCompanionValidationErrorKind, setOfflineCompanionValidationErrorKind] =
    useState<HomeVaultOfflineCompanionPackValidationErrorKind | null>(null);
  const [offlineCompanionOperationState, setOfflineCompanionOperationState] =
    useState<OfflineCompanionImportState>('idle');
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [operationState, setOperationState] = useState<BackupOperationState>('idle');
  const exportInput = {
    property,
    assets,
    documents,
    accessItems,
    emergencyContacts,
    importantAccounts,
    continuityPlaybooks,
    parts,
    repairEvents,
    rooms,
    taskCompletions,
    tasks,
  };
  const manifest = buildHomeVaultExportManifest(exportInput);
  const exportPackage = buildHomeVaultExportPackage(exportInput);
  const emergencyPacket = buildHomeVaultEmergencyPacket(exportInput);
  const primaryOfflineCompanionPack = buildHomeVaultOfflineCompanionPack(exportInput, {
    target: 'primary_user',
  });
  const helperOfflineCompanionPack = buildHomeVaultOfflineCompanionPack(exportInput, {
    target: 'helper_device',
  });
  const trustedShareArtifact = buildHomeVaultTrustedShareArtifact(exportInput, {
    audience: trustedShareAudience,
    includeSections: trustedShareSections,
  });
  const emergencyPacketDocumentTitleById = new Map(
    emergencyPacket.records.documents.map((document) => [document.id, document.title]),
  );
  const trustedShareSectionSummaryByKey = new Map(
    [...trustedShareArtifact.summary.includedSections, ...trustedShareArtifact.summary.omittedSections].map(
      (section) => [section.key, section],
    ),
  );
  const selectedTrustedShareAudience =
    HOMEVAULT_TRUSTED_SHARE_AUDIENCES.find((audience) => audience.key === trustedShareAudience) ??
    HOMEVAULT_TRUSTED_SHARE_AUDIENCES[0];
  const selectedTrustedShareOmittedSectionKeys = HOMEVAULT_TRUSTED_SHARE_SECTION_OPTIONS
    .map((option) => option.key)
    .filter((key) => !selectedTrustedShareAudience?.recommendedSectionKeys.includes(key));
  const emergencyPacketFileName = createEmergencyPacketFileName(emergencyPacket, 'txt');
  const emergencyPacketText = formatEmergencyPacketText(emergencyPacket);
  const trustedShareFileName = createTrustedShareFileName(trustedShareArtifact, 'txt');
  const trustedShareText = formatTrustedShareText(trustedShareArtifact);
  const primaryOfflineCompanionFileName = createOfflineCompanionPackFileName(
    primaryOfflineCompanionPack,
    'json',
  );
  const primaryOfflineCompanionText = formatHomeVaultOfflineCompanionPack(
    primaryOfflineCompanionPack,
  );
  const helperOfflineCompanionFileName = createOfflineCompanionPackFileName(
    helperOfflineCompanionPack,
    'json',
  );
  const helperOfflineCompanionText = formatHomeVaultOfflineCompanionPack(
    helperOfflineCompanionPack,
  );
  const physicalEmergencyRecords = emergencyPacket.records.accessItems.filter((accessItem) =>
    isPhysicalContinuityCategory(accessItem.category),
  );
  const isSampleExport = property.id === SAMPLE_PROPERTY_ID;
  const {
    activeTaskCount,
    attachedDocumentCount,
    documentedAssetCount,
    linkedDocumentCount,
    repairEventsWithCostCount,
  } = manifest.coverage;
  const reviewItems = manifest.checklist.filter((item) => item.state === 'review');
  const sensitiveWarning = formatSensitiveDataWarning(manifest.sensitiveData);
  const backupSensitivity = getExportSensitivity('backup', manifest.sensitiveData);
  const packetSensitivity = getExportSensitivity('packet', manifest.sensitiveData);
  const offlineCompanionSensitivity = getExportSensitivity(
    'offline-pack',
    manifest.sensitiveData,
  );
  const trustedShareSensitivity = getExportSensitivity('trusted-share', manifest.sensitiveData);
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
  const canExportEmergencyPacket = emergencyPacket.summary.hasContent;
  const canExportPrimaryOfflineCompanion =
    primaryOfflineCompanionPack.summary.includedSectionCount > 0 &&
    primaryOfflineCompanionPack.summary.recordCount > 0;
  const canExportHelperOfflineCompanion =
    helperOfflineCompanionPack.summary.includedSectionCount > 0 &&
    helperOfflineCompanionPack.summary.recordCount > 0;
  const canExportTrustedShare =
    trustedShareSections.length > 0 && trustedShareArtifact.summary.hasContent;
  const usingRecommendedTrustedShareSections = areSameSectionSelection(
    trustedShareSections,
    selectedTrustedShareAudience?.recommendedSectionKeys ?? [],
  );
  const focusNotice = getFocusNotice(initialFocusSection);
  const restoreReady = restoreConfirmText.trim() === 'RESTORE';
  const canRestore = restoreReady && operationState === 'ready';
  const validatedPackage = validatedBackup?.package ?? null;
  const restoreConflicts = validatedPackage
    ? buildRestoreConflicts(validatedPackage, manifest, property)
    : [];
  const itemShareBusy = itemShareOperationState === 'validating';
  const itemShareExpired = itemShareImportPreview
    ? isExpiredItemSharePreview(itemShareImportPreview)
    : false;
  const showItemShareRotationNudge = itemShareImportPreview
    ? shouldNudgeSharedCredentialRotation(itemShareImportPreview)
    : false;
  const offlineCompanionBusy = offlineCompanionOperationState === 'validating';
  const offlineCompanionOutdated = offlineCompanionImportPreview
    ? isOutdatedOfflineCompanionPreview(offlineCompanionImportPreview)
    : false;

  async function handleDownloadManifest() {
    if (!(await confirmSensitiveShare('backup JSON package', manifest.sensitiveData))) {
      return;
    }

    if (Platform.OS !== 'web') {
      await shareNativeTextFile({
        fileName: exportFileName,
        text: packageText,
        mimeType: 'application/json',
        dialogTitle: 'Save HomeVault backup',
        uti: 'public.json',
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

  async function handleShareZip() {
    if (!(await confirmSensitiveShare('backup zip archive', manifest.sensitiveData))) {
      return;
    }

    setZipStatus('building');
    try {
      await shareZipExport({
        exportPackage,
        exportFileName,
        property,
        assets,
        documents,
        rooms,
      });
      setZipStatus('done');
      onBackupCreated(exportPackage, exportFileName);
    } catch {
      setZipStatus('error');
    }
  }

  async function handleShareEmergencyPacket() {
    if (!canExportEmergencyPacket) {
      return;
    }

    if (!(await confirmSensitivePacketAction('share', manifest.sensitiveData))) {
      return;
    }

    if (Platform.OS !== 'web') {
      await shareNativeTextFile({
        fileName: emergencyPacketFileName,
        text: emergencyPacketText,
        mimeType: 'text/plain',
        dialogTitle: 'Share HomeVault Emergency Packet',
        uti: 'public.plain-text',
        onStart: () => setPacketShareStatus('sharing'),
        onDone: () => setPacketShareStatus('done'),
        onError: () => setPacketShareStatus('unsupported'),
      });

      return;
    }

    const didDownload = downloadTextFile({
      fileName: emergencyPacketFileName,
      mimeType: 'text/plain',
      text: emergencyPacketText,
    });

    setPacketShareStatus(didDownload ? 'done' : 'unsupported');
  }

  function handleTrustedShareAudienceSelect(audienceKey: HomeVaultTrustedShareAudienceKey) {
    const nextAudience = HOMEVAULT_TRUSTED_SHARE_AUDIENCES.find(
      (audience) => audience.key === audienceKey,
    );

    setTrustedShareAudience(audienceKey);
    setTrustedShareSections(nextAudience?.recommendedSectionKeys ?? []);
    setTrustedShareStatus('idle');
  }

  function handleTrustedShareSectionToggle(sectionKey: HomeVaultTrustedShareSectionKey) {
    setTrustedShareSections((current) =>
      current.includes(sectionKey)
        ? current.filter((key) => key !== sectionKey)
        : [...current, sectionKey],
    );
    setTrustedShareStatus('idle');
  }

  function handleLoadRecommendedTrustedShareSections() {
    setTrustedShareSections(selectedTrustedShareAudience?.recommendedSectionKeys ?? []);
    setTrustedShareStatus('idle');
  }

  async function handleShareTrustedShare() {
    if (!canExportTrustedShare) {
      return;
    }

    if (
      !(await confirmSensitiveTrustedShare(
        trustedShareArtifact.audience.label,
        manifest.sensitiveData,
      ))
    ) {
      return;
    }

    if (Platform.OS !== 'web') {
      await shareNativeTextFile({
        fileName: trustedShareFileName,
        text: trustedShareText,
        mimeType: 'text/plain',
        dialogTitle: 'Share HomeVault trusted handoff',
        uti: 'public.plain-text',
        onStart: () => setTrustedShareStatus('sharing'),
        onDone: () => setTrustedShareStatus('done'),
        onError: () => setTrustedShareStatus('unsupported'),
      });

      return;
    }

    const didDownload = downloadTextFile({
      fileName: trustedShareFileName,
      mimeType: 'text/plain',
      text: trustedShareText,
    });

    setTrustedShareStatus(didDownload ? 'done' : 'unsupported');
  }

  function setOfflineCompanionStatus(
    targetKey: HomeVaultOfflineCompanionPackTargetKey,
    status: OfflineCompanionExportState,
  ) {
    setOfflineCompanionStatuses((current) => ({
      ...current,
      [targetKey]: status,
    }));
  }

  async function handleShareOfflineCompanion(
    targetKey: HomeVaultOfflineCompanionPackTargetKey,
  ) {
    const pack =
      targetKey === 'primary_user'
        ? primaryOfflineCompanionPack
        : helperOfflineCompanionPack;
    const fileName =
      targetKey === 'primary_user'
        ? primaryOfflineCompanionFileName
        : helperOfflineCompanionFileName;
    const packText =
      targetKey === 'primary_user'
        ? primaryOfflineCompanionText
        : helperOfflineCompanionText;
    const canExport =
      targetKey === 'primary_user'
        ? canExportPrimaryOfflineCompanion
        : canExportHelperOfflineCompanion;

    if (!canExport) {
      return;
    }

    if (!(await confirmSensitiveOfflineCompanion(pack.target.label, manifest.sensitiveData))) {
      return;
    }

    if (Platform.OS !== 'web') {
      await shareNativeTextFile({
        fileName,
        text: packText,
        mimeType: 'application/json',
        dialogTitle: `Share ${pack.target.label} offline companion pack`,
        uti: 'public.json',
        onStart: () => setOfflineCompanionStatus(targetKey, 'sharing'),
        onDone: () => setOfflineCompanionStatus(targetKey, 'done'),
        onError: () => setOfflineCompanionStatus(targetKey, 'unsupported'),
      });

      return;
    }

    const didDownload = downloadTextFile({
      fileName,
      mimeType: 'application/json',
      text: packText,
    });

    setOfflineCompanionStatus(targetKey, didDownload ? 'done' : 'unsupported');
  }

  async function handlePrintEmergencyPacket() {
    if (!canExportEmergencyPacket) {
      return;
    }

    if (!(await confirmSensitivePacketAction('print', manifest.sensitiveData))) {
      return;
    }

    setPacketPrintStatus('printing');

    try {
      await printEmergencyPacket(emergencyPacket);
      setPacketPrintStatus('done');
    } catch {
      setPacketPrintStatus('error');
    }
  }

  async function handleValidateBackup() {
    setOperationState('validating');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/json', 'application/zip', 'application/x-zip-compressed'],
      });

      if (result.canceled || result.assets.length === 0) {
        setOperationState(importPreview ? 'ready' : 'idle');
        return;
      }

      const [asset] = result.assets;
      setImportPreview(null);
      setValidatedBackup(null);
      setValidationErrorKind(null);
      setRestoreConfirmText('');

      if (!asset.file && !asset.uri) {
        setOperationState('error');
        setValidationErrorKind('not_homevault');
        setValidationResult(
          'Backup validation requires a readable JSON or zip file. Try the web preview or pick the file from your device.',
        );
        return;
      }

      const parsed = await inspectBackupAsset({
        file: asset.file,
        name: asset.name,
        uri: asset.uri,
      });

      if (parsed.ok) {
        const backup = 'backup' in parsed ? parsed.backup : null;
        if (!backup) {
          throw new Error('Backup inspection returned an unexpected success shape.');
        }
        setImportPreview(backup.preview);
        setValidatedBackup(backup);
        setValidationErrorKind(null);
        setRestoreConfirmText('');
        setOperationState('ready');
      } else {
        setOperationState('error');
        setValidationErrorKind(parsed.errorKind);
      }

      setValidationResult(
        parsed.ok
          ? `Valid HomeVault ${'backup' in parsed && parsed.backup.sourceKind === 'zip' ? 'zip archive' : 'backup'}: ${'backup' in parsed ? parsed.backup.summary : parsed.summary}.`
          : parsed.errors.join(' '),
      );
    } catch (error) {
      setImportPreview(null);
      setValidatedBackup(null);
      setValidationErrorKind(null);
      setRestoreConfirmText('');
      setOperationState('error');
      setValidationResult(`Backup validation failed: ${formatErrorMessage(error)}`);
    }
  }

  async function handleValidateItemShareBundle() {
    setItemShareOperationState('validating');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/json'],
      });

      if (result.canceled || result.assets.length === 0) {
        setItemShareOperationState(itemShareImportPreview ? 'ready' : 'idle');
        return;
      }

      const [asset] = result.assets;
      setItemShareImportPreview(null);
      setItemShareValidationErrorKind(null);

      const source = await readPickedTextAsset(asset);

      if (!source) {
        setItemShareOperationState('error');
        setItemShareValidationErrorKind('not_homevault');
        setItemShareValidationResult(
          'Shared bundle validation requires a readable HomeVault JSON file.',
        );
        return;
      }

      const parsed = parseHomeVaultItemShareBundle(source);

      if (parsed.ok) {
        setItemShareImportPreview(parsed.preview);
        setItemShareValidationErrorKind(null);
        setItemShareOperationState('ready');
      } else {
        setItemShareOperationState('error');
        setItemShareValidationErrorKind(parsed.errorKind);
      }

      setItemShareValidationResult(
        parsed.ok
          ? `Shared bundle ready to review: ${parsed.summary}.`
          : parsed.errors.join(' '),
      );
    } catch (error) {
      setItemShareImportPreview(null);
      setItemShareValidationErrorKind(null);
      setItemShareOperationState('error');
      setItemShareValidationResult(
        `Shared bundle validation failed: ${formatErrorMessage(error)}`,
      );
    }
  }

  async function handleValidateOfflineCompanionPack() {
    setOfflineCompanionOperationState('validating');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/json'],
      });

      if (result.canceled || result.assets.length === 0) {
        setOfflineCompanionOperationState(
          offlineCompanionImportPreview ? 'ready' : 'idle',
        );
        return;
      }

      const [asset] = result.assets;
      setOfflineCompanionImportPreview(null);
      setOfflineCompanionValidationErrorKind(null);

      const source = await readPickedTextAsset(asset);

      if (!source) {
        setOfflineCompanionOperationState('error');
        setOfflineCompanionValidationErrorKind('not_homevault');
        setOfflineCompanionValidationResult(
          'Offline companion review requires a readable HomeVault JSON file.',
        );
        return;
      }

      const parsed = parseHomeVaultOfflineCompanionPack(source);

      if (parsed.ok) {
        setOfflineCompanionImportPreview(parsed.preview);
        setOfflineCompanionValidationErrorKind(null);
        setOfflineCompanionOperationState('ready');
      } else {
        setOfflineCompanionOperationState('error');
        setOfflineCompanionValidationErrorKind(parsed.errorKind);
      }

      setOfflineCompanionValidationResult(
        parsed.ok
          ? `Offline companion ready to review: ${parsed.summary}.`
          : parsed.errors.join(' '),
      );
    } catch (error) {
      setOfflineCompanionImportPreview(null);
      setOfflineCompanionValidationErrorKind(null);
      setOfflineCompanionOperationState('error');
      setOfflineCompanionValidationResult(
        `Offline companion validation failed: ${formatErrorMessage(error)}`,
      );
    }
  }

  function handleLoadSampleBackup() {
    setImportPreview(null);
    setValidatedBackup(null);
    setValidationErrorKind(null);
    setRestoreConfirmText('');
    setOperationState('validating');

    const parsed = validateHomeVaultExportPackage(sampleBackupPackage);

    if (parsed.ok) {
      setImportPreview(parsed.preview);
      setValidatedBackup({
        sourceKind: 'json',
        package: parsed.package,
        preview: parsed.preview,
        summary: parsed.summary,
      });
      setValidationErrorKind(null);
      setOperationState('ready');
    } else {
      setOperationState('error');
      setValidationErrorKind(parsed.errorKind);
    }

    setValidationResult(
      parsed.ok
        ? `Sample backup loaded: ${parsed.summary}.`
        : parsed.errors.join(' '),
    );
  }

  function handleRestoreBackup() {
    if (!validatedBackup || !canRestore) {
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
            void restoreBackup(validatedBackup);
          },
        },
      ],
    );
  }

  async function restoreBackup(backup: ValidatedBackup) {
    setOperationState('restoring');
    setValidationResult('Restoring validated backup package...');

    try {
      await onRestoreBackup(backup);
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

      {focusNotice ? (
        <View style={[styles.sampleNotice, styles.focusNotice]}>
          <Text style={[styles.sampleNoticeTitle, styles.focusNoticeTitle]}>{focusNotice.title}</Text>
          <Text style={styles.sampleNoticeText}>{focusNotice.detail}</Text>
        </View>
      ) : null}

      {isSampleExport ? (
        <View style={styles.sampleNotice}>
          <Text style={styles.sampleNoticeTitle}>Sample backup only</Text>
          <Text style={styles.sampleNoticeText}>
            Exports from this screen include the sample household guide you are exploring. Create
            your own guide before using backups for real household records.
          </Text>
        </View>
      ) : null}

      <View style={styles.metricGrid}>
        <Metric label="Linked docs" value={`${linkedDocumentCount}/${documents.length}`} />
        <Metric label="Attached files" value={`${attachedDocumentCount}/${documents.length}`} />
        <Metric label="Open tasks" value={String(activeTaskCount)} />
      </View>

      {manifest.sensitiveData.includesSensitiveData ? (
        <View style={styles.sampleNotice}>
          <Text style={styles.sampleNoticeTitle}>Sensitive information included</Text>
          <Text style={styles.sampleNoticeText}>
            {sensitiveWarning} Anyone with this backup can read those details.
          </Text>
          <Text style={styles.sampleNoticeText}>
            If you export or print an emergency packet, any included access codes, locations, and
            recovery notes will appear in full.
          </Text>
        </View>
      ) : null}

      {manifest.sensitiveData.includesSensitiveData ? (
        <View style={styles.pinStubPanel}>
          <Text style={styles.pinStubTitle}>Sensitive-actions PIN fallback</Text>
          <Text style={styles.pinStubText}>
            High-risk reveals and exports request biometric or device-auth verification when this
            device supports it. If that verification is unavailable in this preview, HomeVault
            falls back to a local confirmation prompt on this device.
          </Text>
          <Text style={styles.pinStubText}>
            A local sensitive-actions PIN fallback is planned for devices where biometrics are not
            available.
          </Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Export choices</Text>
        <ShareModeCard
          title="Full backup"
          badge="Restore + archive"
          detail="JSON or zip package with local records, history, and linked files for restore or migration."
          sensitivity={backupSensitivity}
        />
        <ShareModeCard
          title="Emergency Packet"
          badge="Incident response"
          detail="Fixed emergency-ready summary for access, contacts, insurance, devices, and recovery guidance."
          sensitivity={packetSensitivity}
        />
        <ShareModeCard
          title="Offline companion pack"
          badge="Local rescue copy"
          detail="Read-only offline JSON pack for a primary household device or one narrower helper device when the app or cloud are unavailable."
          sensitivity={offlineCompanionSensitivity}
        />
        <ShareModeCard
          title="Trusted share"
          badge="Selective handoff"
          detail="Document-based v1 handoff for a spouse, house sitter, or emergency contact with only the sections you choose."
          sensitivity={trustedShareSensitivity}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Offline companion pack</Text>
        <Text style={styles.previewSummary}>
          Keep a read-only local rescue copy for moments when connectivity, app installs, or cloud
          recovery paths are unreliable.
        </Text>
        <View style={styles.trustedShareNotice}>
          <Text style={styles.trustedShareNoticeTitle}>Static and read-only by design</Text>
          <Text style={styles.trustedShareNoticeText}>
            These packs stay fixed after export and should be replaced whenever contacts, codes,
            recovery notes, or linked records change.
          </Text>
          <Text style={styles.trustedShareNoticeText}>
            The primary-user pack keeps the broader emergency packet view. The helper-device pack
            stays narrower by reusing the emergency-contact handoff rules.
          </Text>
          <Text style={styles.trustedShareNoticeText}>
            HomeVault can suggest device-local protection, but once you export a copy, storage and
            rotation discipline matter more than app logic.
          </Text>
        </View>
        {[primaryOfflineCompanionPack, helperOfflineCompanionPack].map((pack) => {
          const omittedSections = pack.sections.filter((section) => section.state === 'omitted');
          const missingSections = pack.sections.filter((section) => section.state === 'missing');

          return (
            <View key={pack.target.key} style={styles.selectionCard}>
              <View style={styles.selectionCardHeader}>
                <Text style={styles.selectionCardTitle}>{pack.target.label}</Text>
                <Text style={styles.selectionCardBadge}>
                  {pack.target.key === 'primary_user' ? 'Broader copy' : 'Narrower copy'}
                </Text>
              </View>
              <Text style={styles.selectionCardText}>{pack.target.description}</Text>
              <Text style={styles.selectionCardMeta}>
                {pack.summary.includedSectionCount} section
                {pack.summary.includedSectionCount === 1 ? '' : 's'} included ·{' '}
                {pack.summary.recordCount} record
                {pack.summary.recordCount === 1 ? '' : 's'} · {pack.summary.documentCount}{' '}
                document{pack.summary.documentCount === 1 ? '' : 's'} ·{' '}
                {pack.summary.incidentCount} playbook
                {pack.summary.incidentCount === 1 ? '' : 's'}
              </Text>
              <Text style={styles.selectionCardMeta}>
                Unlock: {pack.unlock.detail}
              </Text>
              <Text style={styles.selectionCardMeta}>
                Omitted by design:{' '}
                {omittedSections.length > 0
                  ? formatOfflineCompanionSectionTitles(omittedSections)
                  : 'Nothing beyond the included emergency scope.'}
              </Text>
              <Text style={styles.selectionCardMeta}>
                Missing today:{' '}
                {missingSections.length > 0
                  ? formatOfflineCompanionSectionTitles(missingSections)
                  : 'No sections are missing.'}
              </Text>
            </View>
          );
        })}
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Warnings to carry with the file</Text>
          <Text style={styles.emptyText}>
            Staleness: {primaryOfflineCompanionPack.warnings.staleness}
          </Text>
          <Text style={styles.emptyText}>
            Rotation: {primaryOfflineCompanionPack.warnings.rotation}
          </Text>
          <Text style={styles.emptyText}>
            Device loss: {primaryOfflineCompanionPack.warnings.deviceLoss}
          </Text>
        </View>
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Local transfer paths</Text>
          <Text style={styles.emptyText}>
            Use the device share sheet for AirDrop, Nearby Share, or another local share target
            when both devices are nearby.
          </Text>
          <Text style={styles.emptyText}>
            Save the JSON file to Files, removable storage, or another offline destination when you
            need a manual handoff without email or cloud sync.
          </Text>
          <Text style={styles.emptyText}>
            Receiver preview in HomeVault shows who the pack is for, what sections are omitted, and
            how old the pack is before anyone relies on it.
          </Text>
        </View>
      </View>

      <View style={styles.downloadPanel}>
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Export primary-user companion</Text>
          <Text style={styles.downloadMeta}>
            {!canExportPrimaryOfflineCompanion
              ? 'Add at least one emergency-ready section before exporting the broader primary-user companion pack.'
              : offlineCompanionStatuses.primary_user === 'sharing'
                ? 'Opening share sheet...'
                : offlineCompanionStatuses.primary_user === 'done'
                  ? Platform.OS === 'web'
                    ? `${primaryOfflineCompanionFileName} was downloaded.`
                    : 'Primary-user offline companion shared successfully.'
                  : offlineCompanionStatuses.primary_user === 'unsupported'
                    ? 'Sharing is not available on this device. Try downloading from the web preview.'
                    : Platform.OS === 'web'
                      ? 'Download the broader emergency-ready offline pack for your own device.'
                      : 'Share the broader emergency-ready offline pack to Files or another local device destination.'}
          </Text>
          <Text style={styles.previewSummary}>
            Includes the broader emergency packet scope in read-only JSON form for the main
            household organizer.
          </Text>
        </View>
        <Pressable
          onPress={() => void handleShareOfflineCompanion('primary_user')}
          disabled={
            !canExportPrimaryOfflineCompanion ||
            offlineCompanionStatuses.primary_user === 'sharing'
          }
          style={[
            styles.secondaryActionButton,
            (!canExportPrimaryOfflineCompanion ||
              offlineCompanionStatuses.primary_user === 'sharing') &&
              styles.actionButtonDisabled,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryActionText}>
            {offlineCompanionStatuses.primary_user === 'sharing'
              ? 'Sharing...'
              : Platform.OS === 'web'
                ? 'Download primary copy'
                : 'Share primary copy'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.downloadPanel}>
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Export helper-device companion</Text>
          <Text style={styles.downloadMeta}>
            {!canExportHelperOfflineCompanion
              ? 'Add at least one emergency-ready helper section before exporting the narrower helper-device companion pack.'
              : offlineCompanionStatuses.helper_device === 'sharing'
                ? 'Opening share sheet...'
                : offlineCompanionStatuses.helper_device === 'done'
                  ? Platform.OS === 'web'
                    ? `${helperOfflineCompanionFileName} was downloaded.`
                    : 'Helper-device offline companion shared successfully.'
                  : offlineCompanionStatuses.helper_device === 'unsupported'
                    ? 'Sharing is not available on this device. Try downloading from the web preview.'
                    : Platform.OS === 'web'
                      ? 'Download the narrower helper-device pack without unrelated household records.'
                      : 'Share the narrower helper-device pack without the broader emergency packet scope.'}
          </Text>
          <Text style={styles.previewSummary}>
            Reuses the emergency-contact handoff scope so a helper can act during an incident
            without receiving unrelated records.
          </Text>
        </View>
        <Pressable
          onPress={() => void handleShareOfflineCompanion('helper_device')}
          disabled={
            !canExportHelperOfflineCompanion ||
            offlineCompanionStatuses.helper_device === 'sharing'
          }
          style={[
            styles.secondaryActionButton,
            (!canExportHelperOfflineCompanion ||
              offlineCompanionStatuses.helper_device === 'sharing') &&
              styles.actionButtonDisabled,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryActionText}>
            {offlineCompanionStatuses.helper_device === 'sharing'
              ? 'Sharing...'
              : Platform.OS === 'web'
                ? 'Download helper copy'
                : 'Share helper copy'}
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.panel,
          initialFocusSection === 'trusted-share' && styles.panelFocused,
        ]}
      >
        <Text style={styles.sectionTitle}>Trusted-share handoff</Text>
        <Text style={styles.previewSummary}>
          Prepare the right household details for one trusted person without exporting unrelated inventory or maintenance records.
        </Text>
        <View style={styles.trustedShareNotice}>
          <Text style={styles.trustedShareNoticeTitle}>Static handoff, not live access</Text>
          <Text style={styles.trustedShareNoticeText}>{trustedShareArtifact.v1Notice}</Text>
          <Text style={styles.trustedShareNoticeText}>
            {trustedShareArtifact.tradeoffs.localFirst}
          </Text>
          <Text style={styles.trustedShareNoticeText}>
            {trustedShareArtifact.tradeoffs.liveAccess}
          </Text>
          <Text style={styles.trustedShareNoticeText}>
            {trustedShareArtifact.tradeoffs.futureDirection}
          </Text>
        </View>
        <Text style={styles.subsectionTitle}>Who is this for?</Text>
        {HOMEVAULT_TRUSTED_SHARE_AUDIENCES.map((audience) => {
          const selected = trustedShareAudience === audience.key;

          return (
            <Pressable
              key={audience.key}
              onPress={() => handleTrustedShareAudienceSelect(audience.key)}
              style={[
                styles.selectionCard,
                selected && styles.selectionCardSelected,
              ]}
              accessibilityRole="button"
            >
              <View style={styles.selectionCardHeader}>
                <Text style={styles.selectionCardTitle}>{audience.label}</Text>
                <Text
                  style={[
                    styles.selectionCardBadge,
                    selected && styles.selectionCardBadgeSelected,
                  ]}
                >
                  {selected ? 'Recommended loaded' : 'Load recommended'}
                </Text>
              </View>
              <Text style={styles.selectionCardText}>{audience.description}</Text>
              <Text style={styles.selectionCardMeta}>
                Use case: {formatTrustedShareAudienceScope(audience.scope)}
              </Text>
              <Text style={styles.selectionCardMeta}>
                Recommended: {formatTrustedShareSectionTitles(audience.recommendedSectionKeys)}
              </Text>
            </Pressable>
          );
        })}
        <View style={styles.readyPanel}>
          <Text style={styles.readyTitle}>
            Preset for {selectedTrustedShareAudience?.label ?? 'trusted handoff'}
          </Text>
          <Text style={styles.readyText}>{selectedTrustedShareAudience?.description}</Text>
          <Text style={styles.readyText}>
            Use case: {formatTrustedShareAudienceScope(selectedTrustedShareAudience?.scope)}
          </Text>
          <Text style={styles.readyText}>
            {trustedShareArtifact.summary.includedSectionCount} section
            {trustedShareArtifact.summary.includedSectionCount === 1 ? '' : 's'} included ·{' '}
            {trustedShareArtifact.summary.omittedSectionCount} omitted
          </Text>
          <Text style={styles.readyText}>
            {usingRecommendedTrustedShareSections
              ? 'Recommended preset is loaded.'
              : 'Custom section changes are active for this handoff.'}
          </Text>
          {!usingRecommendedTrustedShareSections ? (
            <Pressable
              onPress={handleLoadRecommendedTrustedShareSections}
              style={styles.inlineLinkButton}
              accessibilityRole="button"
            >
              <Text style={styles.inlineLinkButtonText}>Use recommended sections again</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Review before sharing</Text>
          <Text style={styles.emptyText}>{selectedTrustedShareAudience?.reviewPrompt}</Text>
          {(selectedTrustedShareAudience?.checklist ?? []).map((item) => (
            <Text key={item} style={styles.emptyText}>
              - {item}
            </Text>
          ))}
        </View>
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Left out by default</Text>
          <Text style={styles.emptyText}>
            {selectedTrustedShareOmittedSectionKeys.length > 0
              ? formatTrustedShareSectionTitles(selectedTrustedShareOmittedSectionKeys)
              : 'Nothing is omitted by default for this broader co-manager preset.'}
          </Text>
          <Text style={styles.emptyText}>
            Temporary-helper presets stay lighter than emergency use unless you choose to include more.
          </Text>
        </View>
        <Text style={styles.subsectionTitle}>Choose sections</Text>
        {HOMEVAULT_TRUSTED_SHARE_SECTION_OPTIONS.map((section) => {
          const summary = trustedShareSectionSummaryByKey.get(section.key);
          const selected = trustedShareSections.includes(section.key);

          return (
            <Pressable
              key={section.key}
              onPress={() => handleTrustedShareSectionToggle(section.key)}
              style={[
                styles.selectionCard,
                selected && styles.selectionCardSelected,
              ]}
              accessibilityRole="button"
            >
              <View style={styles.selectionCardHeader}>
                <Text style={styles.selectionCardTitle}>{section.title}</Text>
                <Text
                  style={[
                    styles.selectionCardBadge,
                    selected && styles.selectionCardBadgeSelected,
                  ]}
                >
                  {selected ? 'Included' : 'Not included'}
                </Text>
              </View>
              <Text style={styles.selectionCardText}>{section.description}</Text>
              <Text style={styles.selectionCardMeta}>{section.includes}</Text>
              <Text style={styles.selectionCardMeta}>
                {summary?.state === 'included'
                  ? `${summary.itemCount} item${summary.itemCount === 1 ? '' : 's'} ready`
                  : summary?.rationale ?? 'No saved records yet.'}
              </Text>
            </Pressable>
          );
        })}
        {trustedShareArtifact.summary.omittedSections.length > 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>What stays out of this handoff</Text>
            {trustedShareArtifact.summary.omittedSections.map((section) => (
              <Text key={section.key} style={styles.emptyText}>
                {section.title}: {section.rationale}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.downloadPanel,
          initialFocusSection === 'trusted-share' && styles.panelFocused,
        ]}
      >
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Export trusted share</Text>
          <Text style={styles.downloadMeta}>
            {trustedShareSections.length === 0
              ? 'Choose at least one section before exporting a trusted handoff.'
              : trustedShareStatus === 'sharing'
                ? 'Opening share sheet...'
                : trustedShareStatus === 'done'
                  ? Platform.OS === 'web'
                    ? `${trustedShareFileName} was downloaded.`
                    : 'Trusted-share handoff shared successfully.'
                  : trustedShareStatus === 'unsupported'
                    ? 'Sharing is not available on this device. Try downloading from the web preview.'
                    : !trustedShareArtifact.summary.hasContent
                      ? 'The selected sections do not have saved records yet. Pick a different section or add records first.'
                      : Platform.OS === 'web'
                        ? 'Download a selective trusted-share handoff without the full backup package.'
                        : 'Share a selective trusted-share handoff without the full backup package.'}
          </Text>
          <Text style={styles.previewSummary}>
            Includes only the selected sections below and keeps this v1 share document-based instead of live synced.
          </Text>
        </View>
        <Pressable
          onPress={() => void handleShareTrustedShare()}
          disabled={!canExportTrustedShare || trustedShareStatus === 'sharing'}
          style={[
            styles.secondaryActionButton,
            (!canExportTrustedShare || trustedShareStatus === 'sharing') &&
              styles.actionButtonDisabled,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryActionText}>
            {trustedShareStatus === 'sharing'
              ? 'Sharing...'
              : Platform.OS === 'web'
                ? 'Download handoff'
                : 'Share handoff'}
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.panel,
          initialFocusSection === 'packet' && styles.panelFocused,
        ]}
      >
        <Text style={styles.sectionTitle}>Emergency packet preview</Text>
        <Text style={styles.previewSummary}>{emergencyPacket.warning}</Text>
        <Text style={styles.previewSummary}>
          Includes only emergency-useful details such as access info, contacts, insurance,
          key devices, and recovery guidance. It does not include full inventory history,
          maintenance logs, or hidden diagnostics.
        </Text>
        <DetailLine label="Sections ready" value={String(emergencyPacket.summary.includedSectionCount)} />
        <DetailLine label="Sections missing" value={String(emergencyPacket.summary.missingSectionCount)} />
        <DetailLine label="Supporting documents" value={String(emergencyPacket.records.documents.length)} />
        <Text style={styles.subsectionTitle}>Section check</Text>
        {[
          ...emergencyPacket.summary.includedSections,
          ...emergencyPacket.summary.missingSections,
        ].map((section) => (
          <View key={section.key} style={styles.compareLine}>
            <Text style={styles.compareLabel}>{section.title}</Text>
            <View style={styles.compareValues}>
              <Text
                style={[
                  styles.compareValue,
                  section.status === 'missing' && styles.compareValueChanged,
                ]}
              >
                {section.status === 'ready'
                  ? `${section.itemCount} item${section.itemCount === 1 ? '' : 's'}`
                  : 'Missing'}
              </Text>
              <Text style={styles.compareDelta}>{section.includes}</Text>
            </View>
          </View>
        ))}
        {!canExportEmergencyPacket ? (
          <Text style={styles.packetEmptyText}>
            Add at least one access record, emergency contact, insurance account, key device, or
            recovery note before exporting a packet.
          </Text>
        ) : null}
        <Text style={styles.subsectionTitle}>Physical continuity details</Text>
        {physicalEmergencyRecords.length > 0 ? (
          physicalEmergencyRecords.map((accessItem) => (
            <View key={accessItem.id} style={styles.packetRecordCard}>
              <View style={styles.packetRecordHeader}>
                <Text style={styles.packetRecordTitle}>{accessItem.label}</Text>
                <Text style={styles.packetRecordCategory}>
                  {formatAccessCategory(accessItem.category)}
                </Text>
              </View>
              {accessItem.location ? (
                <Text style={styles.packetRecordDetail}>Location: {accessItem.location}</Text>
              ) : null}
              {accessItem.instructions ? (
                <Text style={styles.packetRecordMeta}>{accessItem.instructions}</Text>
              ) : null}
              {accessItem.linkedAssetLabel ? (
                <Text style={styles.packetRecordMeta}>
                  Equipment: {accessItem.linkedAssetLabel}
                </Text>
              ) : null}
              {accessItem.linkedDocumentIds.length > 0 ? (
                <Text style={styles.packetRecordMeta}>
                  Documents:{' '}
                  {accessItem.linkedDocumentIds
                    .map((documentId) => emergencyPacketDocumentTitleById.get(documentId) ?? 'Linked document')
                    .join(', ')}
                </Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.packetEmptyText}>
            No utility shutoffs, lockbox notes, or entry instructions are saved yet.
          </Text>
        )}
        <Text style={styles.subsectionTitle}>Key devices</Text>
        {emergencyPacket.sections.keyDevices.items.length > 0 ? (
          emergencyPacket.sections.keyDevices.items.map((device) => (
            <View key={device.id} style={styles.packetRecordCard}>
              <View style={styles.packetRecordHeader}>
                <Text style={styles.packetRecordTitle}>{device.name}</Text>
                <Text style={styles.packetRecordCategory}>{device.category}</Text>
              </View>
              {device.roomName ? (
                <Text style={styles.packetRecordDetail}>Location: {device.roomName}</Text>
              ) : null}
              {device.networkName ? (
                <Text style={styles.packetRecordMeta}>Network: {device.networkName}</Text>
              ) : null}
              {device.internetProvider ? (
                <Text style={styles.packetRecordMeta}>Provider: {device.internetProvider}</Text>
              ) : null}
              {device.linkedAccessItemIds.length > 0 ? (
                <Text style={styles.packetRecordMeta}>
                  Linked access: {device.linkedAccessItemIds.length}
                </Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.packetEmptyText}>
            No routers, phones, or connectivity devices are saved yet.
          </Text>
        )}
      </View>

      <View
        style={[
          styles.downloadPanel,
          initialFocusSection === 'packet' && styles.panelFocused,
        ]}
      >
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Export emergency packet</Text>
          <Text style={styles.downloadMeta}>
            {!canExportEmergencyPacket
              ? 'Add at least one emergency-ready record before exporting a packet.'
              : packetShareStatus === 'sharing'
                ? 'Opening share sheet...'
                : packetShareStatus === 'done'
                  ? Platform.OS === 'web'
                    ? `${emergencyPacketFileName} was downloaded.`
                    : 'Emergency packet shared successfully.'
                  : packetShareStatus === 'unsupported'
                    ? 'Sharing is not available on this device. Try downloading from the web preview.'
                    : Platform.OS === 'web'
                      ? 'Download a concise emergency packet without exporting the full backup.'
                      : 'Share a concise emergency packet without the full backup package.'}
          </Text>
          <Text style={styles.previewSummary}>
            Sensitive values appear in full inside the packet so someone can use them in a real emergency.
          </Text>
        </View>
        <View style={styles.actionGroup}>
          <Pressable
            onPress={() => void handleShareEmergencyPacket()}
            disabled={!canExportEmergencyPacket || packetShareStatus === 'sharing'}
            style={[
              styles.secondaryActionButton,
              (!canExportEmergencyPacket || packetShareStatus === 'sharing') &&
                styles.actionButtonDisabled,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>
              {packetShareStatus === 'sharing'
                ? 'Sharing...'
                : Platform.OS === 'web'
                  ? 'Download packet'
                  : 'Share packet'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handlePrintEmergencyPacket()}
            disabled={!canExportEmergencyPacket || packetPrintStatus === 'printing'}
            style={[
              styles.secondaryActionButton,
              (!canExportEmergencyPacket || packetPrintStatus === 'printing') &&
                styles.actionButtonDisabled,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>
              {packetPrintStatus === 'printing' ? 'Printing...' : 'Print packet'}
            </Text>
          </Pressable>
        </View>
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
          <Text style={styles.sectionTitle}>Download as zip</Text>
          <Text style={styles.downloadMeta}>
            {zipStatus === 'building'
              ? 'Building archive — reading attached files...'
              : zipStatus === 'done'
                ? 'Zip archive shared successfully.'
                : zipStatus === 'error'
                  ? 'Could not build archive. Check that attached files are still accessible.'
                  : 'Bundle the JSON backup + all attached documents and photos into a single zip file.'}
          </Text>
        </View>
        <Pressable
          onPress={() => void handleShareZip()}
          disabled={zipStatus === 'building'}
          style={[styles.primaryButton, zipStatus === 'building' && styles.primaryButtonBusy]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>
            {zipStatus === 'building' ? 'Building...' : 'Share zip'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.downloadPanel}>
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Validate backup</Text>
          <Text style={styles.downloadMeta}>
            {validationResult ?? 'Choose a HomeVault JSON or zip package and check its manifest counts.'}
          </Text>
          {validationErrorKind ? (
            <Text style={styles.validationErrorKind}>
              {formatValidationErrorKind(validationErrorKind)}
            </Text>
          ) : null}
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
              {operationState === 'validating' ? 'Checking...' : 'Choose backup'}
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

      <View style={styles.downloadPanel}>
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Review offline companion pack</Text>
          <Text style={styles.downloadMeta}>
            {offlineCompanionValidationResult ??
              'Choose a HomeVault offline companion JSON file to preview who it is for, what it omits, and whether it looks outdated before using it.'}
          </Text>
          {offlineCompanionValidationErrorKind ? (
            <Text style={styles.validationErrorKind}>
              {formatOfflineCompanionValidationErrorKind(offlineCompanionValidationErrorKind)}
            </Text>
          ) : null}
          <Text
            style={[
              styles.operationStatus,
              offlineCompanionOperationState === 'error' && styles.operationStatusError,
              offlineCompanionOperationState === 'ready' && styles.operationStatusReady,
            ]}
          >
            {formatOfflineCompanionOperationState(offlineCompanionOperationState)}
          </Text>
        </View>
        <View style={styles.actionGroup}>
          <Pressable
            onPress={handleValidateOfflineCompanionPack}
            disabled={offlineCompanionBusy}
            style={[
              styles.secondaryActionButton,
              offlineCompanionBusy && styles.actionButtonDisabled,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>
              {offlineCompanionOperationState === 'validating'
                ? 'Checking...'
                : 'Choose offline pack'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.downloadPanel}>
        <View style={styles.downloadBody}>
          <Text style={styles.sectionTitle}>Review shared bundle</Text>
          <Text style={styles.downloadMeta}>
            {itemShareValidationResult ??
              'Choose a HomeVault item-share JSON file to preview its sender, audience, and read-only metadata before import.'}
          </Text>
          {itemShareValidationErrorKind ? (
            <Text style={styles.validationErrorKind}>
              {formatItemShareValidationErrorKind(itemShareValidationErrorKind)}
            </Text>
          ) : null}
          <Text
            style={[
              styles.operationStatus,
              itemShareOperationState === 'error' && styles.operationStatusError,
              itemShareOperationState === 'ready' && styles.operationStatusReady,
            ]}
          >
            {formatItemShareOperationState(itemShareOperationState)}
          </Text>
        </View>
        <View style={styles.actionGroup}>
          <Pressable
            onPress={handleValidateItemShareBundle}
            disabled={itemShareBusy}
            style={[styles.secondaryActionButton, itemShareBusy && styles.actionButtonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>
              {itemShareOperationState === 'validating' ? 'Checking...' : 'Choose shared bundle'}
            </Text>
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
            label="Access records"
            currentValue={manifest.recordCounts.accessItems}
            backupValue={importPreview.recordCounts.accessItems}
          />
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
            label="Emergency contacts"
            currentValue={manifest.recordCounts.emergencyContacts}
            backupValue={importPreview.recordCounts.emergencyContacts}
          />
          <CompareLine
            label="Important accounts"
            currentValue={manifest.recordCounts.importantAccounts}
            backupValue={importPreview.recordCounts.importantAccounts}
          />
          <CompareLine
            label="Continuity playbooks"
            currentValue={manifest.recordCounts.continuityPlaybooks}
            backupValue={importPreview.recordCounts.continuityPlaybooks}
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
          <CompareLine
            label="Parts & supplies"
            currentValue={manifest.recordCounts.parts}
            backupValue={importPreview.recordCounts.parts}
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
          {validatedBackup?.sourceKind === 'zip' ? (
            <>
              <Text style={styles.subsectionTitle}>Archive files</Text>
              <DetailLine
                label="Document files"
                value={String(validatedBackup.documentFileCount)}
              />
              <DetailLine
                label="Asset photos"
                value={String(validatedBackup.assetPhotoCount)}
              />
              <DetailLine
                label="Room photos"
                value={String(validatedBackup.roomPhotoCount)}
              />
              {validatedBackup.warnings.length > 0 ? (
                <View style={styles.conflictPanel}>
                  <Text style={styles.conflictTitle}>Archive warnings</Text>
                  {validatedBackup.warnings.map((warning) => (
                    <View key={warning} style={styles.conflictRow}>
                      <Text style={styles.conflictBullet}>!</Text>
                      <Text style={styles.conflictText}>{warning}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.previewSummary}>
                  Zip restore will rebuild app-owned document files and photos from this archive.
                </Text>
              )}
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
              detail={
                validatedBackup?.sourceKind === 'zip'
                  ? 'Manifest counts match the included records and archive contents were inspected.'
                  : 'Manifest counts match the included records.'
              }
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
            {validatedBackup?.sourceKind === 'zip' ? (
              <RestorePlanRow
                label="Attachment files"
                detail={
                  validatedBackup.warnings.length > 0
                    ? 'Some archive files are missing. Review warnings before restoring.'
                    : 'Attachment files and photos are ready to be rebuilt in app storage.'
                }
                state={validatedBackup.warnings.length > 0 ? 'pending' : 'ready'}
              />
            ) : null}
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

      {offlineCompanionImportPreview ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Offline companion preview</Text>
          <Text style={styles.previewSummary}>
            {offlineCompanionOutdated ? 'Outdated' : 'Read-only'} rescue pack for{' '}
            {offlineCompanionImportPreview.target.label}. Review what is included, what is left out,
            and how recently it was generated before relying on it during an incident.
          </Text>
          <DetailLine label="Household" value={offlineCompanionImportPreview.householdLabel} />
          <DetailLine label="Target" value={offlineCompanionImportPreview.target.label} />
          <DetailLine
            label="Generated"
            value={
              offlineCompanionOutdated
                ? `Older pack from ${formatDateTime(offlineCompanionImportPreview.generatedAt)}`
                : formatDateTime(offlineCompanionImportPreview.generatedAt)
            }
          />
          <DetailLine label="Access" value="Read-only offline pack" />
          <DetailLine
            label="Sections"
            value={`${offlineCompanionImportPreview.summary.includedSectionCount} included · ${offlineCompanionImportPreview.summary.omittedSectionCount} omitted · ${offlineCompanionImportPreview.summary.missingSectionCount} missing`}
          />
          <DetailLine
            label="Records"
            value={`${offlineCompanionImportPreview.summary.recordCount} core records · ${offlineCompanionImportPreview.summary.documentCount} docs · ${offlineCompanionImportPreview.summary.incidentCount} playbooks`}
          />
          <Text style={styles.subsectionTitle}>Transfer context</Text>
          <Text style={styles.downloadMeta}>
            Unlock: {offlineCompanionImportPreview.unlock.detail}
          </Text>
          <Text style={styles.downloadMeta}>
            Derived from emergency packet v{offlineCompanionImportPreview.derivedFrom.emergencyPacketVersion}
            {' '}and trusted-share v{offlineCompanionImportPreview.derivedFrom.trustedShareVersion} (
            {offlineCompanionImportPreview.derivedFrom.trustedShareAudienceKey} scope).
          </Text>
          {(offlineCompanionOutdated ||
            offlineCompanionImportPreview.sections.some((section) => section.state !== 'included')) ? (
            <View style={styles.conflictPanel}>
              <Text style={styles.conflictTitle}>Receiver warnings</Text>
              {offlineCompanionOutdated ? (
                <View style={styles.conflictRow}>
                  <Text style={styles.conflictBullet}>!</Text>
                  <Text style={styles.conflictText}>
                    This offline companion pack looks old. Confirm the sender has refreshed it after
                    recent contact, code, or recovery-note changes.
                  </Text>
                </View>
              ) : null}
              <View style={styles.conflictRow}>
                <Text style={styles.conflictBullet}>!</Text>
                <Text style={styles.conflictText}>
                  {offlineCompanionImportPreview.warnings.rotation}
                </Text>
              </View>
              <View style={styles.conflictRow}>
                <Text style={styles.conflictBullet}>!</Text>
                <Text style={styles.conflictText}>
                  {offlineCompanionImportPreview.warnings.deviceLoss}
                </Text>
              </View>
            </View>
          ) : null}
          <Text style={styles.subsectionTitle}>Section scope</Text>
          {offlineCompanionImportPreview.sections.map((section) => (
            <View key={`${section.key}-${section.state}`} style={styles.compareLine}>
              <Text style={styles.compareLabel}>{section.title}</Text>
              <View style={styles.compareValues}>
                <Text
                  style={[
                    styles.compareValue,
                    section.state !== 'included' && styles.compareValueChanged,
                  ]}
                >
                  {section.state === 'included'
                    ? `${section.itemCount} item${section.itemCount === 1 ? '' : 's'}`
                    : section.state === 'omitted'
                      ? 'Omitted'
                      : 'Missing'}
                </Text>
                <Text style={styles.compareDelta}>{section.rationale}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {itemShareImportPreview ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Shared bundle preview</Text>
          <Text style={styles.previewSummary}>
            {itemShareExpired ? 'Expired' : 'Read-only'} {itemShareImportPreview.itemCount} shared item
            {itemShareImportPreview.itemCount === 1 ? '' : 's'} for{' '}
            {itemShareImportPreview.audienceLabel}. This preview stays read-only until the sender
            shares the passphrase separately.
          </Text>
          <DetailLine label="Sender" value={itemShareImportPreview.senderLabel} />
          <DetailLine label="Household" value={itemShareImportPreview.householdLabel} />
          <DetailLine label="Audience" value={itemShareImportPreview.audienceLabel} />
          <DetailLine label="Generated" value={formatDateTime(itemShareImportPreview.generatedAt)} />
          <DetailLine
            label="Expires"
            value={
              itemShareImportPreview.expiresAt
                ? itemShareExpired
                  ? `Expired ${formatDateTime(itemShareImportPreview.expiresAt)}`
                  : formatDateTime(itemShareImportPreview.expiresAt)
                : 'No expiry set'
            }
          />
          <DetailLine label="Access" value="Read-only bundle" />
          <DetailLine
            label="Primary type"
            value={formatItemShareRecordType(itemShareImportPreview.primaryRecordType)}
          />
          <DetailLine
            label="Linked records"
            value={String(itemShareImportPreview.linkedRecordCount)}
          />
          <DetailLine
            label="Omitted fields"
            value={String(itemShareImportPreview.omittedFieldCount)}
          />
          <Text style={styles.subsectionTitle}>Included items</Text>
          <Text style={styles.downloadMeta}>
            Encrypted field contents stay locked in this preview. You can still verify who sent the
            bundle, who it was intended for, and which record labels it contains.
          </Text>
          {itemShareExpired ? (
            <View style={styles.conflictPanel}>
              <Text style={styles.conflictTitle}>Expiry warning</Text>
              <View style={styles.conflictRow}>
                <Text style={styles.conflictBullet}>!</Text>
                <Text style={styles.conflictText}>
                  This shared bundle has expired. Ask the sender for a fresh handoff before you rely on it.
                </Text>
              </View>
              {showItemShareRotationNudge ? (
                <View style={styles.conflictRow}>
                  <Text style={styles.conflictBullet}>!</Text>
                  <Text style={styles.conflictText}>
                    Rotate any shared codes or recovery details before reusing them after this temporary access window.
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {itemShareImportPreview.items.map((item) => (
            <View key={`${item.recordType}-${item.recordId}`} style={styles.restorePlanRow}>
              <View style={styles.restorePlanBody}>
                <Text style={styles.restorePlanTitle}>{item.label}</Text>
                <Text style={styles.restorePlanDetail}>
                  {formatItemShareRecordType(item.recordType)} · {item.linkedRecordIds.length}{' '}
                  linked · {item.omittedFieldIds.length} omitted field
                  {item.omittedFieldIds.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
          ))}
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

function ShareModeCard({
  badge,
  detail,
  sensitivity,
  title,
}: {
  badge: string;
  detail: string;
  sensitivity: { detail: string; label: string; level: SensitivityLevel };
  title: string;
}) {
  return (
    <View style={styles.shareModeCard}>
      <View style={styles.shareModeHeader}>
        <Text style={styles.shareModeTitle}>{title}</Text>
        <Text style={styles.shareModeBadge}>{badge}</Text>
      </View>
      <Text style={styles.shareModeDetail}>{detail}</Text>
      <View
        style={[
          styles.sensitivityBadge,
          sensitivity.level === 'high'
            ? styles.sensitivityBadgeHigh
            : sensitivity.level === 'medium'
              ? styles.sensitivityBadgeMedium
              : styles.sensitivityBadgeLow,
        ]}
      >
        <Text
          style={[
            styles.sensitivityBadgeText,
            sensitivity.level === 'high'
              ? styles.sensitivityBadgeTextHigh
              : sensitivity.level === 'medium'
                ? styles.sensitivityBadgeTextMedium
                : styles.sensitivityBadgeTextLow,
          ]}
        >
          {sensitivity.label}
        </Text>
      </View>
      <Text style={styles.shareModeMeta}>{sensitivity.detail}</Text>
    </View>
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

function formatValidationErrorKind(kind: HomeVaultExportValidationErrorKind) {
  switch (kind) {
    case 'not_json':
      return 'The selected file is not a valid HomeVault JSON package.';
    case 'not_homevault':
      return 'This file does not appear to be a HomeVault backup. Choose a file exported from the HomeVault app.';
    case 'version_unsupported':
      return 'This backup was created with a newer version of HomeVault. Update the app to restore from this backup.';
    case 'malformed':
      return 'The backup file is missing required fields. The file may be corrupted or incomplete.';
  }
}

function formatItemShareValidationErrorKind(kind: HomeVaultItemShareBundleValidationErrorKind) {
  switch (kind) {
    case 'not_json':
      return 'The selected file is not valid JSON.';
    case 'not_homevault':
      return 'This file does not appear to be a HomeVault shared bundle.';
    case 'version_unsupported':
      return 'This shared bundle uses a newer HomeVault format. Update the app to review it here.';
    case 'malformed':
      return 'The shared bundle is missing required metadata or encryption details.';
  }
}

function formatOfflineCompanionValidationErrorKind(
  kind: HomeVaultOfflineCompanionPackValidationErrorKind,
) {
  switch (kind) {
    case 'not_json':
      return 'The selected file is not valid JSON.';
    case 'not_homevault':
      return 'This file does not appear to be a HomeVault offline companion pack.';
    case 'version_unsupported':
      return 'This offline companion pack uses a newer HomeVault format. Update the app to review it here.';
    case 'malformed':
      return 'The offline companion pack is missing required rescue metadata or section summaries.';
  }
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

function formatItemShareOperationState(state: ItemShareImportState) {
  switch (state) {
    case 'validating':
      return 'Checking shared bundle...';
    case 'ready':
      return 'Shared bundle is ready to review.';
    case 'error':
      return 'Needs attention before importing.';
    case 'idle':
    default:
      return 'Waiting for a shared bundle.';
  }
}

function formatOfflineCompanionOperationState(state: OfflineCompanionImportState) {
  switch (state) {
    case 'validating':
      return 'Checking offline companion pack...';
    case 'ready':
      return 'Offline companion pack is ready to review.';
    case 'error':
      return 'Needs attention before using this rescue pack.';
    case 'idle':
    default:
      return 'Waiting for an offline companion pack.';
  }
}

function formatErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function formatItemShareRecordType(
  recordType: HomeVaultItemShareBundleImportPreview['primaryRecordType'],
) {
  switch (recordType) {
    case 'access_item':
      return 'Access record';
    case 'emergency_contact':
      return 'Emergency contact';
    case 'important_account':
      return 'Important account';
    case 'asset':
      return 'Key device';
    case 'document':
      return 'Critical document';
    case 'continuity_playbook':
      return 'Continuity playbook';
  }
}

async function readPickedTextAsset(
  asset: Pick<DocumentPicker.DocumentPickerAsset, 'file' | 'uri'>,
) {
  if (typeof asset.file?.text === 'function') {
    return asset.file.text();
  }

  if (!asset.uri) {
    return null;
  }

  return FileSystem.readAsStringAsync(asset.uri);
}

function isExpiredItemSharePreview(preview: HomeVaultItemShareBundleImportPreview) {
  if (!preview.expiresAt) {
    return false;
  }

  const expiresAt = new Date(preview.expiresAt);

  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now();
}

function shouldNudgeSharedCredentialRotation(preview: HomeVaultItemShareBundleImportPreview) {
  return preview.items.some(
    (item) => item.recordType === 'access_item' || item.recordType === 'important_account',
  );
}

function isOutdatedOfflineCompanionPreview(
  preview: HomeVaultOfflineCompanionPackImportPreview,
) {
  const generatedAt = new Date(preview.generatedAt);

  if (Number.isNaN(generatedAt.getTime())) {
    return false;
  }

  const ageMs = Date.now() - generatedAt.getTime();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  return ageMs > ninetyDaysMs;
}

function getFocusNotice(focusSection?: 'packet' | 'trusted-share') {
  if (focusSection === 'trusted-share') {
    return {
      title: 'Trusted handoff shortcut',
      detail:
        'You opened the selective handoff tools from Emergency. Review the audience and included sections before you share it.',
    };
  }

  if (focusSection === 'packet') {
    return {
      title: 'Emergency packet shortcut',
      detail:
        'You opened the emergency packet tools from a recovery playbook. Use this packet when someone needs the core household details quickly.',
    };
  }

  return null;
}

function areSameSectionSelection(
  left: HomeVaultTrustedShareSectionKey[],
  right: HomeVaultTrustedShareSectionKey[],
) {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((key) => rightSet.has(key));
}

function formatTrustedShareSectionTitles(sectionKeys: HomeVaultTrustedShareSectionKey[]) {
  const titleByKey = new Map(
    HOMEVAULT_TRUSTED_SHARE_SECTION_OPTIONS.map((option) => [option.key, option.title]),
  );

  return sectionKeys
    .map((key) => titleByKey.get(key))
    .filter((title): title is string => Boolean(title))
    .join(', ');
}

function formatTrustedShareAudienceScope(
  scope: (typeof HOMEVAULT_TRUSTED_SHARE_AUDIENCES)[number]['scope'] | undefined,
) {
  switch (scope) {
    case 'temporary':
      return 'Temporary helper handoff';
    case 'emergency':
      return 'Emergency-only handoff';
    case 'co_manager':
    default:
      return 'Broader co-manager handoff';
  }
}

function formatOfflineCompanionSectionTitles(
  sections: Array<{ title: string }>,
) {
  return sections.map((section) => section.title).join(', ');
}

function isPhysicalContinuityCategory(category: AccessItem['category']) {
  return (
    category === 'utility_shutoff' ||
    category === 'lockbox' ||
    category === 'entry_note' ||
    category === 'garage' ||
    category === 'safe'
  );
}

function formatAccessCategory(category: AccessItem['category']) {
  switch (category) {
    case 'utility_shutoff':
      return 'Utility shutoff';
    case 'entry_note':
      return 'Entry note';
    case 'lockbox':
      return 'Lockbox';
    default:
      return category.replaceAll('_', ' ');
  }
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
    { key: 'accessItems', label: 'access records' },
    { key: 'assets', label: 'assets' },
    { key: 'continuityPlaybooks', label: 'continuity playbooks' },
    { key: 'rooms', label: 'rooms' },
    { key: 'documents', label: 'documents' },
    { key: 'emergencyContacts', label: 'emergency contacts' },
    { key: 'importantAccounts', label: 'important accounts' },
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

function confirmSensitiveShare(
  targetLabel: string,
  sensitiveData: HomeVaultExportPackage['manifest']['sensitiveData'],
) {
  if (!sensitiveData.includesSensitiveData || Platform.OS === 'web') {
    return Promise.resolve(true);
  }

  return confirmLocalStepUp({
    alertTitle: 'Share sensitive backup?',
    alertMessage: `${formatSensitiveDataWarning(sensitiveData)} Access codes, locations, and recovery notes will be readable in this ${targetLabel}. If device authentication is unavailable in this preview, confirm locally before sharing it with trusted people and storing it securely.`,
    confirmLabel: 'Share',
    authPromptMessage: `Authenticate to share ${targetLabel}`,
  });
}

function confirmSensitivePacketAction(
  actionLabel: 'print' | 'share',
  sensitiveData: HomeVaultExportPackage['manifest']['sensitiveData'],
) {
  if (!sensitiveData.includesSensitiveData || Platform.OS === 'web') {
    return Promise.resolve(true);
  }

  return confirmLocalStepUp({
    alertTitle: `${actionLabel === 'print' ? 'Print' : 'Share'} sensitive emergency packet?`,
    alertMessage: `${formatSensitiveDataWarning(sensitiveData)} Access codes, locations, recovery notes, and contact details may appear in full in this emergency packet. If device authentication is unavailable in this preview, confirm locally before continuing with a trusted person or printer.`,
    confirmLabel: actionLabel === 'print' ? 'Print' : 'Share',
    authPromptMessage: `Authenticate to ${actionLabel} emergency packet`,
  });
}

function confirmSensitiveTrustedShare(
  audienceLabel: string,
  sensitiveData: HomeVaultExportPackage['manifest']['sensitiveData'],
) {
  if (!sensitiveData.includesSensitiveData || Platform.OS === 'web') {
    return Promise.resolve(true);
  }

  return confirmLocalStepUp({
    alertTitle: 'Share sensitive trusted handoff?',
    alertMessage: `${formatSensitiveDataWarning(sensitiveData)} This trusted-share handoff for ${audienceLabel} is a static document and sensitive details will be readable in full. If device authentication is unavailable in this preview, confirm locally before sending it to this trusted person.`,
    confirmLabel: 'Share',
    authPromptMessage: `Authenticate to share trusted handoff for ${audienceLabel}`,
  });
}

function confirmSensitiveOfflineCompanion(
  targetLabel: string,
  sensitiveData: HomeVaultExportPackage['manifest']['sensitiveData'],
) {
  if (!sensitiveData.includesSensitiveData || Platform.OS === 'web') {
    return Promise.resolve(true);
  }

  return confirmLocalStepUp({
    alertTitle: 'Share sensitive offline companion pack?',
    alertMessage: `${formatSensitiveDataWarning(sensitiveData)} This offline companion pack for ${targetLabel} is a static local copy, and any included emergency details will be readable in full. If device authentication is unavailable in this preview, confirm locally before exporting it to a device you trust.`,
    confirmLabel: 'Share',
    authPromptMessage: `Authenticate to share offline companion for ${targetLabel}`,
  });
}

async function shareNativeTextFile({
  fileName,
  text,
  mimeType,
  dialogTitle,
  uti,
  onStart,
  onDone,
  onError,
}: {
  fileName: string;
  text: string;
  mimeType: string;
  dialogTitle: string;
  uti: string;
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
      mimeType,
      dialogTitle,
      UTI: uti,
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
  sampleNotice: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  focusNotice: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  sampleNoticeTitle: {
    color: colors.amber,
    fontSize: 14,
    fontWeight: '900',
  },
  focusNoticeTitle: {
    color: colors.blue,
  },
  sampleNoticeText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  pinStubPanel: {
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  pinStubTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  pinStubText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
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
  validationErrorKind: {
    color: colors.amber,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
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
  panelFocused: {
    borderColor: colors.blue,
    borderWidth: 2,
  },
  shareModeCard: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 5,
  },
  shareModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  shareModeTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
  },
  shareModeBadge: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  shareModeDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  shareModeMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  sensitivityBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sensitivityBadgeHigh: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red,
  },
  sensitivityBadgeMedium: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
  },
  sensitivityBadgeLow: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  sensitivityBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sensitivityBadgeTextHigh: {
    color: colors.red,
  },
  sensitivityBadgeTextMedium: {
    color: colors.amber,
  },
  sensitivityBadgeTextLow: {
    color: colors.green,
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
  trustedShareNotice: {
    borderRadius: 8,
    borderColor: '#B8D7CB',
    borderWidth: 1,
    backgroundColor: colors.greenSoft,
    padding: 12,
    gap: 6,
  },
  trustedShareNoticeTitle: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '900',
  },
  trustedShareNoticeText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  selectionCard: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 6,
  },
  selectionCardSelected: {
    borderColor: colors.blue,
    backgroundColor: '#F3F8FF',
  },
  selectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectionCardTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  selectionCardBadge: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  selectionCardBadgeSelected: {
    color: colors.blue,
  },
  selectionCardText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  selectionCardMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
  },
  inlineLinkButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLinkButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.page,
    padding: 12,
    gap: 6,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  packetRecordCard: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 5,
    paddingTop: 10,
  },
  packetRecordHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  packetRecordTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  packetRecordCategory: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  packetRecordDetail: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  packetRecordMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  packetEmptyText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
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
