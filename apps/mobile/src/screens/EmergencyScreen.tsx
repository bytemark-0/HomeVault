import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  isDeviceAsset,
  isRouterAsset,
  type AccessItem,
  type ContinuityPlaybook,
  type EmergencyContact,
  type ImportantAccount,
} from '@homevault/domain';
import type { HomeVaultTrustedShareAudienceKey } from '@homevault/export';
import type { AssetListItem, DocumentListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';
import {
  buildDigitalSafetyChecklist,
  buildPrimaryRecoveryAccountCoverage,
  formatImportantAccountKind,
  getImportantAccountRecoverySummary,
  type DigitalSafetyChecklistItem,
} from '../utils/digitalSafety';
import {
  buildOwnershipResponsibilities,
  buildOwnershipSummary,
  formatOwnershipHandoffSummary,
  formatOwnershipResponsibilityStatus,
} from '../utils/ownershipRoles';
import {
  getEmergencyAudienceView,
  HOMEVAULT_EMERGENCY_AUDIENCE_VIEWS,
  type HomeVaultEmergencyAudienceKey,
} from '../utils/emergencyAudienceViews';
import {
  getDocumentReadinessLabel,
  isCriticalDocument,
} from '../utils/documentTaxonomy';
import {
  buildContinuityPlaybookGuides,
  formatContinuityPlaybookState,
} from '../utils/continuityPlaybooks';
import { buildCriticalReviewQueue } from '../utils/reviewFreshness';
import { formatDateLabel } from '../utils/taskUtils';
import { shareTextFile } from '../utils/textShare';

type EmergencyScreenProps = {
  accessItems: AccessItem[];
  assets: AssetListItem[];
  documents: DocumentListItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  continuityPlaybooks: ContinuityPlaybook[];
  propertyId: string;
  propertyLabel: string;
  onAddEmergencyContact: () => void;
  onAddImportantAccount: (kind?: ImportantAccount['kind']) => void;
  onOpenAccessArea: () => void;
  onOpenAccessItem: (accessItemId: string) => void;
  onOpenAsset: (assetId: string) => void;
  onOpenDevices: () => void;
  onOpenDocumentArea: () => void;
  onOpenDocument: (documentId: string) => void;
  onOpenEmergencyContact: (contactId: string) => void;
  onOpenEmergencyContacts: () => void;
  onOpenExport: () => void;
  onOpenHousehold: () => void;
  onOpenImportantAccount: (importantAccountId: string) => void;
  onOpenPlaybook: (playbookId: string) => void;
  onOpenShareHub: () => void;
  onOpenTrustedHandoff: (audienceKey?: HomeVaultTrustedShareAudienceKey) => void;
  onShareImportantAccount?: (importantAccountId: string) => void;
};

export function EmergencyScreen({
  accessItems,
  assets,
  documents,
  emergencyContacts,
  importantAccounts,
  continuityPlaybooks,
  propertyId,
  propertyLabel,
  onAddEmergencyContact,
  onAddImportantAccount,
  onOpenAccessArea,
  onOpenAccessItem,
  onOpenAsset,
  onOpenDevices,
  onOpenDocumentArea,
  onOpenDocument,
  onOpenEmergencyContact,
  onOpenEmergencyContacts,
  onOpenExport,
  onOpenHousehold,
  onOpenImportantAccount,
  onOpenPlaybook,
  onOpenShareHub,
  onOpenTrustedHandoff,
  onShareImportantAccount,
}: EmergencyScreenProps) {
  const [selectedAudienceKey, setSelectedAudienceKey] =
    useState<HomeVaultEmergencyAudienceKey>('whole_household');
  const [ownershipShareStatus, setOwnershipShareStatus] = useState<string | null>(null);
  const [isSharingOwnership, setIsSharingOwnership] = useState(false);
  const audienceView = getEmergencyAudienceView(selectedAudienceKey);
  const physicalAccessItems = accessItems.filter((item) => isPhysicalContinuityCategory(item.category));
  const criticalDocuments = documents.filter((document) => isCriticalDocument(document));
  const visibleEmergencyContacts = filterEmergencyContactsForAudience(emergencyContacts, audienceView.key);
  const visibleImportantAccounts = filterImportantAccountsForAudience(importantAccounts, audienceView.key);
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const documentById = new Map(documents.map((document) => [document.id, document]));
  const digitalSafetyChecklist = buildDigitalSafetyChecklist(importantAccounts, assets);
  const ownershipResponsibilities = useMemo(
    () =>
      buildOwnershipResponsibilities({
        assets,
        emergencyContacts,
        importantAccounts,
      }),
    [assets, emergencyContacts, importantAccounts],
  );
  const ownershipSummary = useMemo(
    () => buildOwnershipSummary(ownershipResponsibilities),
    [ownershipResponsibilities],
  );
  const recoveryPlaybooks = buildContinuityPlaybookGuides({
    property: { id: propertyId, householdId: '', label: propertyLabel, type: 'single_family' },
    assets,
    documents,
    accessItems,
    emergencyContacts,
    importantAccounts,
    continuityPlaybooks,
  });
  const coreIncidentPlaybooks = CORE_INCIDENT_PLAYBOOK_IDS.map((id) =>
    recoveryPlaybooks.find((playbook) => playbook.id === id),
  ).filter((playbook): playbook is ContinuityPlaybookGuide => Boolean(playbook));
  const audiencePlaybooks = filterPlaybooksForAudience(recoveryPlaybooks, audienceView.recommendedPlaybookIds);
  const additionalPlaybooks = recoveryPlaybooks.filter(
    (playbook) => !CORE_INCIDENT_PLAYBOOK_ID_SET.has(playbook.id),
  );
  const primaryAudiencePlaybooks =
    audienceView.key === 'whole_household' || audienceView.key === 'spouse'
      ? coreIncidentPlaybooks
      : audiencePlaybooks;
  const additionalPlaybooksForAudience =
    audienceView.key === 'whole_household' || audienceView.key === 'spouse'
      ? additionalPlaybooks
      : [];
  const emergencyEssentials = buildEmergencyEssentialsSummary({
    accessItems,
    assets,
    emergencyContacts,
    importantAccounts,
    ownershipSummary,
  });
  const staleReviewItems = buildCriticalReviewQueue({
    accessItems,
    assets,
    emergencyContacts,
    importantAccounts,
  }).filter((item) => item.status !== 'current').slice(0, 3);
  const priorityActions = buildPriorityActions({
    accessItems,
    assets,
    criticalDocuments,
    emergencyContacts,
    importantAccounts,
    onAddEmergencyContact,
    onAddImportantAccount,
    onOpenAccessArea,
    onOpenDevices,
    onOpenDocumentArea,
    onOpenExport,
    onOpenTrustedHandoff: () => onOpenTrustedHandoff(audienceView.trustedShareAudienceKey),
    packetFocus: audienceView.packetFocus,
  });
  const primaryRecoveryCoverage = buildPrimaryRecoveryAccountCoverage(importantAccounts);
  const readyIncidentCount = primaryAudiencePlaybooks.filter((playbook) => playbook.state === 'ready').length;

  function handleOpenReviewItem(recordType: 'access_item' | 'emergency_contact' | 'important_account' | 'asset', recordId: string) {
    switch (recordType) {
      case 'access_item':
        onOpenAccessItem(recordId);
        return;
      case 'emergency_contact':
        onOpenEmergencyContact(recordId);
        return;
      case 'important_account':
        onOpenImportantAccount(recordId);
        return;
      case 'asset':
        onOpenAsset(recordId);
        return;
    }
  }

  async function handleShareOwnershipHandoff() {
    if (isSharingOwnership) {
      return;
    }

    try {
      setIsSharingOwnership(true);
      const result = await shareTextFile({
        dialogTitle: 'Share HomeVault responsibility handoff',
        fileName: createOwnershipHandoffFileName(propertyLabel),
        text: formatOwnershipHandoffSummary({
          propertyLabel,
          responsibilities: ownershipResponsibilities,
        }),
      });
      setOwnershipShareStatus(
        result === 'downloaded' ? 'Responsibility handoff downloaded.' : 'Responsibility handoff shared.',
      );
    } catch (error) {
      setOwnershipShareStatus(
        error instanceof Error ? error.message : 'Could not share the responsibility handoff.',
      );
    } finally {
      setIsSharingOwnership(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Emergency</Text>
        <Text style={styles.title}>Who to call and what to hand off</Text>
        <Text style={styles.subtitle}>
          Keep critical contacts, recovery accounts, and your export packet one tap away.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Focused audience view</Text>
        <Text style={styles.sectionIntro}>
          Switch between the full household workspace and smaller helper views that hide irrelevant or overly sensitive details by default.
        </Text>
        <View style={styles.audienceGrid}>
          {HOMEVAULT_EMERGENCY_AUDIENCE_VIEWS.map((audience) => {
            const selected = audience.key === selectedAudienceKey;

            return (
              <Pressable
                key={audience.key}
                onPress={() => setSelectedAudienceKey(audience.key)}
                style={[styles.audienceCard, selected && styles.audienceCardSelected]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${audience.label} view`}
                testID={`audience-view-${audience.key}`}
              >
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>{audience.label}</Text>
                  <Text
                    style={[
                      styles.statusPill,
                      selected ? styles.statusPillReady : styles.statusPillProgress,
                    ]}
                  >
                    {selected ? 'Active view' : 'Switch view'}
                  </Text>
                </View>
                <Text style={styles.recordDetail}>{audience.description}</Text>
              </Pressable>
            );
          })}
        </View>
        {audienceView.authorityWarning ? (
          <View style={[styles.readinessPanel, styles.readinessPanelProgress]}>
            <Text style={styles.readinessTitle}>Authority reminder</Text>
            <Text style={styles.sectionIntro}>{audienceView.authorityWarning}</Text>
          </View>
        ) : null}
      </View>

      {audienceView.showReviewQueue && staleReviewItems.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Review now</Text>
            <Text style={styles.sectionAction}>
              {staleReviewItems.length} high-risk record{staleReviewItems.length === 1 ? '' : 's'}
            </Text>
          </View>
          <Text style={styles.sectionIntro}>
            Refresh these emergency-critical records before the next handoff or incident.
          </Text>
          {staleReviewItems.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => handleOpenReviewItem(item.recordType, item.recordId)}
              style={[styles.recordCard, styles.reviewCard]}
              accessibilityRole="button"
            >
              <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>{item.label}</Text>
                <Text style={[styles.statusPill, styles.statusPillNeedsSetup]}>
                  {item.status === 'missing' ? 'First review' : 'Needs review'}
                </Text>
              </View>
              <Text style={styles.recordDetail}>{item.subtitle}</Text>
              <Text style={styles.recordMeta}>{item.detail}</Text>
              <Text style={styles.sectionActionInline}>Open record</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What to do now</Text>
        <View
          style={[
            styles.readinessPanel,
            emergencyEssentials.readyCount === emergencyEssentials.total
              ? styles.readinessPanelReady
              : emergencyEssentials.readyCount >= 3
                ? styles.readinessPanelProgress
                : styles.readinessPanelNeedsSetup,
          ]}
        >
          <View style={styles.recordHeader}>
            <Text style={styles.readinessTitle}>
              {emergencyEssentials.readyCount} of {emergencyEssentials.total} emergency essentials ready
            </Text>
            <Text
              style={[
                styles.statusPill,
                emergencyEssentials.readyCount === emergencyEssentials.total
                  ? styles.statusPillReady
                  : emergencyEssentials.readyCount >= 3
                    ? styles.statusPillProgress
                    : styles.statusPillNeedsSetup,
              ]}
            >
              {emergencyEssentials.statusLabel}
            </Text>
          </View>
          <Text style={styles.sectionIntro}>{emergencyEssentials.detail}</Text>
        </View>
        {priorityActions.map((action) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={styles.recordCard}
            accessibilityRole="button"
          >
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>{action.title}</Text>
              <Text
                style={[
                  styles.statusPill,
                  action.tone === 'ready'
                    ? styles.statusPillReady
                    : action.tone === 'progress'
                      ? styles.statusPillProgress
                      : styles.statusPillNeedsSetup,
                ]}
              >
                {action.badge}
              </Text>
            </View>
            <Text style={styles.recordDetail}>{action.detail}</Text>
            <Text style={styles.sectionActionInline}>{action.cta}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actionsRow}>
        {audienceView.packetFocus !== 'off' ? (
          <Pressable
            onPress={onOpenExport}
            style={[styles.actionCard, styles.actionCardPrimary]}
            accessibilityRole="button"
          >
            <Text style={styles.actionTitlePrimary}>
              {audienceView.packetFocus === 'narrow' ? 'Open emergency packet' : 'Open full emergency packet'}
            </Text>
            <Text style={styles.actionDetailPrimary}>
              {audienceView.packetFocus === 'narrow'
                ? 'Use the packet when a helper needs the broadest incident-ready backup.'
                : 'Export a backup with records, contacts, and continuity details.'}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => onOpenTrustedHandoff(audienceView.trustedShareAudienceKey)}
          style={[styles.actionCard, styles.actionCardSecondary]}
          accessibilityRole="button"
        >
          <Text style={styles.actionTitle}>
            {audienceView.trustedShareAudienceKey ? 'Open matching handoff' : 'Start trusted handoff'}
          </Text>
          <Text style={styles.actionDetail}>
            {audienceView.trustedShareAudienceKey
              ? 'Jump straight to the trusted-share preset that matches this helper view.'
              : 'Open the selective handoff export for a spouse, sitter, or emergency helper.'}
          </Text>
        </Pressable>
      </View>
      <Pressable onPress={onOpenShareHub} style={styles.utilityCard} accessibilityRole="button">
        <Text style={styles.utilityCardTitle}>Open sharing tools</Text>
        <Text style={styles.utilityCardDetail}>
          Choose a trusted handoff or jump straight to encrypted single-record shares.
        </Text>
      </Pressable>
      <Pressable onPress={onOpenHousehold} accessibilityRole="button">
        <Text style={styles.utilityLink}>Review household settings and backup</Text>
      </Pressable>

      <View style={styles.summaryRow}>
        <SummaryCard value={emergencyEssentials.readyCount} label="essentials ready" />
        <SummaryCard value={readyIncidentCount} label="incident guides ready" />
        <SummaryCard
          value={audienceView.showCriticalDocuments ? criticalDocuments.length : visibleEmergencyContacts.length}
          label={audienceView.showCriticalDocuments ? 'critical files' : 'call-first contacts'}
        />
      </View>

      {audienceView.showOwnership ? (
        <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ownership and backup roles</Text>
          <Pressable onPress={handleShareOwnershipHandoff} accessibilityRole="button">
            <Text style={styles.sectionAction}>
              {isSharingOwnership ? 'Sharing...' : 'Share roles'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.sectionIntro}>
          Clarify who handles claims, outages, device recovery, and helper calls before someone
          else has to step in cold.
        </Text>
        <View
          style={[
            styles.readinessPanel,
            ownershipSummary.status === 'ready'
              ? styles.readinessPanelReady
              : ownershipSummary.status === 'needs_attention'
                ? styles.readinessPanelProgress
                : styles.readinessPanelNeedsSetup,
          ]}
        >
          <View style={styles.recordHeader}>
            <Text style={styles.readinessTitle}>
              {ownershipSummary.readyCount} of {ownershipSummary.total} mapped responsibilities ready
            </Text>
            <Text
              style={[
                styles.statusPill,
                ownershipSummary.status === 'ready'
                  ? styles.statusPillReady
                  : ownershipSummary.status === 'needs_attention'
                    ? styles.statusPillProgress
                    : styles.statusPillNeedsSetup,
              ]}
            >
              {ownershipSummary.status === 'ready'
                ? 'Ready'
                : ownershipSummary.status === 'needs_attention'
                  ? 'Review'
                  : 'Missing'}
            </Text>
          </View>
          <Text style={styles.sectionIntro}>{ownershipSummary.detail}</Text>
          {ownershipShareStatus ? <Text style={styles.recordMeta}>{ownershipShareStatus}</Text> : null}
        </View>
        {ownershipResponsibilities.map((item) => (
          <View key={item.key} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Text
                style={[
                  styles.statusPill,
                  item.status === 'ready'
                    ? styles.statusPillReady
                    : item.status === 'needs_attention' || item.status === 'not_applicable'
                      ? styles.statusPillProgress
                      : styles.statusPillNeedsSetup,
                ]}
              >
                {formatOwnershipResponsibilityStatus(item.status)}
              </Text>
            </View>
            <Text style={styles.recordDetail}>{item.handoffPrompt}</Text>
            <Text style={styles.recordMeta}>{item.detail}</Text>
            {item.status !== 'not_applicable' ? (
              <>
                <Text style={styles.recordMeta}>Owner: {item.ownerLabel ?? 'Not assigned'}</Text>
                <Text style={styles.recordMeta}>Backup: {item.backupLabel ?? 'Not assigned'}</Text>
              </>
            ) : null}
          </View>
        ))}
      </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Start from an incident</Text>
          <Text style={styles.sectionAction}>
            {readyIncidentCount}/{primaryAudiencePlaybooks.length || 1} ready
          </Text>
        </View>
        <Text style={styles.sectionIntro}>
          {selectedAudienceKey === 'whole_household' || selectedAudienceKey === 'spouse'
            ? 'Jump into the right records and next steps for the four core incidents HomeVault supports first.'
            : 'Keep the first few incident guides small so a helper can find the next move without wading through the whole house.'}
        </Text>
        {primaryAudiencePlaybooks.map((playbook) => (
          <Pressable
            key={playbook.id}
            onPress={() => onOpenPlaybook(playbook.id)}
            style={styles.recordCard}
            accessibilityRole="button"
          >
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>{playbook.title}</Text>
              <Text
                style={[
                  styles.statusPill,
                  playbook.state === 'ready'
                    ? styles.statusPillReady
                    : playbook.state === 'in_progress'
                      ? styles.statusPillProgress
                      : styles.statusPillNeedsSetup,
                ]}
              >
                {formatContinuityPlaybookState(playbook.state)}
              </Text>
            </View>
            <Text style={styles.recordDetail}>{playbook.whenToUse}</Text>
            <Text style={styles.recordMeta}>
              {playbook.readyRecords.length} linked · {playbook.missingRecords.length} missing
            </Text>
            {playbook.missingRecords.length > 0 ? (
              <Text style={styles.recordMeta}>
                Missing now: {playbook.missingRecords.slice(0, 2).map((resource) => resource.label).join(', ')}
                {playbook.missingRecords.length > 2 ? ` +${playbook.missingRecords.length - 2} more` : ''}
              </Text>
            ) : (
              <Text style={styles.recordMeta}>{playbook.summary}</Text>
            )}
          </Pressable>
        ))}
      </View>

      {audienceView.showDigitalSafety ? (
        <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Digital safety checklist</Text>
          <Pressable onPress={() => onAddImportantAccount()} accessibilityRole="button">
            <Text style={styles.sectionAction}>Add account</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionIntro}>
          Track recovery readiness without storing passwords. HomeVault records whether protections
          are in place and where to look next.
        </Text>
        {digitalSafetyChecklist.map((item) => (
          <ChecklistRow
            key={item.key}
            item={item}
            onPress={
              item.routeTarget === 'accounts'
                ? () => onAddImportantAccount()
                : onOpenDevices
            }
          />
        ))}
      </View>
      ) : null}

      {audienceView.showPrimaryRecoveryAccounts ? (
        <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Primary recovery accounts</Text>
          <Pressable onPress={() => onAddImportantAccount()} accessibilityRole="button">
            <Text style={styles.sectionAction}>Add account</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionIntro}>
          Focus first on the accounts that can lock the household out of email, phones, backups,
          utilities, and entry systems.
        </Text>
        {primaryRecoveryCoverage.map((item) => (
          <Pressable
            key={item.key}
            onPress={() =>
              item.account ? onOpenImportantAccount(item.account.id) : onAddImportantAccount(mapCoverageKindToAccountKind(item.key))
            }
            style={styles.recordCard}
            accessibilityRole="button"
          >
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Text
                style={[
                  styles.statusPill,
                  item.status === 'ready'
                    ? styles.statusPillReady
                    : item.status === 'needs_attention'
                      ? styles.statusPillProgress
                      : styles.statusPillNeedsSetup,
                ]}
              >
                {item.status === 'ready' ? 'Ready' : item.status === 'needs_attention' ? 'Review' : 'Missing'}
              </Text>
            </View>
            <Text style={styles.recordDetail}>{item.account?.label ?? 'Save this recovery account'}</Text>
            <Text style={styles.recordMeta}>{item.detail}</Text>
          </Pressable>
        ))}
      </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Home entry and shutoffs</Text>
          <Pressable onPress={onOpenAccessArea} accessibilityRole="button">
            <Text style={styles.sectionAction}>Open Access</Text>
          </Pressable>
        </View>
        {physicalAccessItems.length > 0 ? (
          physicalAccessItems.map((item) => {
            const linkedAsset = item.linkedAssetId ? assetById.get(item.linkedAssetId) : null;
            const linkedDocuments = item.linkedDocumentIds
              .map((documentId) => documentById.get(documentId))
              .filter((document): document is DocumentListItem => Boolean(document));

            return (
              <Pressable
                key={item.id}
                onPress={() => onOpenAccessItem(item.id)}
                style={styles.recordCard}
                accessibilityRole="button"
              >
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>{item.label}</Text>
                  <Text style={styles.recordTag}>{formatAccessCategory(item.category)}</Text>
                </View>
                {item.location ? <Text style={styles.recordDetail}>Location: {item.location}</Text> : null}
                {item.accessCode ? <Text style={styles.recordMeta}>Code: {item.accessCode}</Text> : null}
                {item.instructions ? <Text style={styles.recordMeta}>{item.instructions}</Text> : null}
                {linkedAsset ? (
                  <Text style={styles.recordMeta}>Equipment: {linkedAsset.name}</Text>
                ) : null}
                {linkedDocuments.length > 0 ? (
                  <Text style={styles.recordMeta}>
                    Documents: {linkedDocuments.map((document) => document.title).join(', ')}
                  </Text>
                ) : null}
                <Text style={styles.recordMeta}>
                  {item.lastVerifiedAt
                    ? `Last checked ${formatDateLabel(item.lastVerifiedAt)}`
                    : 'Needs verification'}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <EmptyState text="Save utility shutoffs, lockbox notes, spare key locations, and entry instructions so someone can act fast without digging through inventory." />
        )}
      </View>

      {audienceView.showCriticalDocuments ? (
        <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Critical documents</Text>
          <Pressable onPress={onOpenDocumentArea} accessibilityRole="button">
            <Text style={styles.sectionAction}>Open Documents</Text>
          </Pressable>
        </View>
        {criticalDocuments.length > 0 ? (
          criticalDocuments.map((document) => (
            <Pressable
              key={document.id}
              onPress={() => onOpenDocument(document.id)}
              style={styles.recordCard}
              accessibilityRole="button"
            >
              <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>{document.title}</Text>
                <Text style={styles.recordTag}>{getDocumentReadinessLabel(document)}</Text>
              </View>
              <Text style={styles.recordDetail}>
                {document.typeLabel} · {document.linkedToLabel}
              </Text>
              <Text style={styles.recordMeta}>{document.dateLabel}</Text>
            </Pressable>
          ))
        ) : (
          <EmptyState text="Keep insurance policies, claim files, emergency plans, and other critical paperwork one tap away here." />
        )}
      </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency contacts</Text>
          <Pressable onPress={onOpenEmergencyContacts} accessibilityRole="button">
            <Text style={styles.sectionAction}>
              {visibleEmergencyContacts.length > 0 ? 'Manage contacts' : 'Add contacts'}
            </Text>
          </Pressable>
        </View>
        {visibleEmergencyContacts.length > 0 ? (
          visibleEmergencyContacts.map((contact) => (
            <Pressable
              key={contact.id}
              onPress={() => onOpenEmergencyContact(contact.id)}
              style={styles.recordCard}
              accessibilityRole="button"
            >
              <Text style={styles.recordTitle}>{contact.name}</Text>
              <Text style={styles.recordDetail}>
                {formatEmergencyContactPriority(contact.priority)} · {contact.role}
              </Text>
              {contact.phone ? <Text style={styles.recordMeta}>Phone: {contact.phone}</Text> : null}
              {contact.email ? <Text style={styles.recordMeta}>Email: {contact.email}</Text> : null}
              {contact.notes ? <Text style={styles.recordMeta}>{contact.notes}</Text> : null}
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyText}>
              Add the people and service providers someone should call first.
            </Text>
            <Pressable
              onPress={onAddEmergencyContact}
              style={styles.emptyPrimaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.emptyPrimaryActionText}>Add first contact</Text>
            </Pressable>
          </View>
        )}
      </View>

      {audienceView.showImportantAccounts ? (
        <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Important accounts</Text>
          <Pressable onPress={() => onAddImportantAccount()} accessibilityRole="button">
            <Text style={styles.sectionAction}>Add account</Text>
          </Pressable>
        </View>
        {visibleImportantAccounts.length > 0 ? (
          visibleImportantAccounts.map((account) => (
            <View key={account.id} style={styles.recordCard}>
              <Pressable
                onPress={() => onOpenImportantAccount(account.id)}
                style={styles.recordMainButton}
                accessibilityRole="button"
              >
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>{account.label}</Text>
                  <Text style={styles.recordTag}>{formatImportantAccountKind(account.kind)}</Text>
                </View>
                <Text style={styles.recordDetail}>{account.providerName}</Text>
                {account.kind === 'insurance' ? (
                  <Text style={styles.recordMeta}>Use linked documents for policy and claim paperwork.</Text>
                ) : null}
                <Text style={styles.recordMeta}>{getImportantAccountRecoverySummary(account)}</Text>
                {account.phone ? <Text style={styles.recordMeta}>Phone: {account.phone}</Text> : null}
                {account.website ? <Text style={styles.recordMeta}>{account.website}</Text> : null}
                {account.recoveryNotes ? <Text style={styles.recordMeta}>{account.recoveryNotes}</Text> : null}
              </Pressable>
              {onShareImportantAccount ? (
                <View style={styles.cardActionRow}>
                  <Pressable
                    onPress={() => onShareImportantAccount(account.id)}
                    style={styles.cardShareButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.cardShareButtonText}>Share account</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <EmptyState text="Insurance, utilities, and recovery accounts should live here." />
        )}
      </View>
      ) : null}

      {audienceView.showAdditionalPlaybooks ? (
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional playbooks</Text>
        <Text style={styles.sectionIntro}>
          Keep longer-form saved plans and secondary recovery guides here.
        </Text>
        {additionalPlaybooksForAudience.length > 0 ? (
          additionalPlaybooksForAudience.map((playbook) => {
            const completedSteps = playbook.steps.filter((step) => step.isComplete).length;

            return (
              <Pressable
                key={playbook.id}
                onPress={() => onOpenPlaybook(playbook.id)}
                style={styles.recordCard}
                accessibilityRole="button"
              >
                <Text style={styles.recordTitle}>{playbook.title}</Text>
                <Text style={styles.recordDetail}>
                  {completedSteps} of {playbook.steps.length} steps complete
                </Text>
                <Text style={styles.recordMeta}>{playbook.whenToUse}</Text>
                <Text style={styles.recordMeta}>
                  {formatContinuityPlaybookState(playbook.state)} ·{' '}
                  {playbook.readyRecords.length} linked · {playbook.missingRecords.length} missing
                </Text>
                {playbook.readyRecords.length > 0 ? (
                  <Text style={styles.recordMeta}>
                    Related records: {playbook.readyRecords.slice(0, 3).map((resource) => resource.label).join(', ')}
                    {playbook.readyRecords.length > 3 ? ` +${playbook.readyRecords.length - 3} more` : ''}
                  </Text>
                ) : null}
              </Pressable>
            );
          })
        ) : (
          <EmptyState text="Short response plans for outages, travel, or handoff belong here." />
        )}
      </View>
      ) : null}
    </View>
  );
}

type ContinuityPlaybookGuide = ReturnType<typeof buildContinuityPlaybookGuides>[number];
type EmergencyPriorityAction = {
  badge: string;
  cta: string;
  detail: string;
  key: string;
  onPress: () => void;
  title: string;
  tone: 'needs_setup' | 'progress' | 'ready';
};

const CORE_INCIDENT_PLAYBOOK_IDS = [
  'guide-home-lockout',
  'guide-internet-outage',
  'guide-stolen-phone',
  'guide-insurance-incident',
] as const;
const CORE_INCIDENT_PLAYBOOK_ID_SET = new Set<string>(CORE_INCIDENT_PLAYBOOK_IDS);

function SummaryCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function ChecklistRow({
  item,
  onPress,
}: {
  item: DigitalSafetyChecklistItem;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.recordCard} accessibilityRole="button">
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{item.title}</Text>
        <Text style={styles.recordTag}>{formatChecklistStatus(item.status)}</Text>
      </View>
      <Text style={styles.recordDetail}>{item.detail}</Text>
      <Text style={styles.recordMeta}>{item.helper}</Text>
      {item.supportingLabels.length > 0 ? (
        <Text style={styles.recordMeta}>
          Related records: {item.supportingLabels.slice(0, 3).join(', ')}
          {item.supportingLabels.length > 3 ? ` +${item.supportingLabels.length - 3} more` : ''}
        </Text>
      ) : null}
      <Text style={styles.sectionActionInline}>
        {item.routeTarget === 'accounts' ? 'Review accounts' : 'Review devices'}
      </Text>
    </Pressable>
  );
}

function buildEmergencyEssentialsSummary({
  accessItems,
  assets,
  emergencyContacts,
  importantAccounts,
  ownershipSummary,
}: {
  accessItems: AccessItem[];
  assets: AssetListItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  ownershipSummary: ReturnType<typeof buildOwnershipSummary>;
}) {
  const essentials = [
    accessItems.length > 0,
    emergencyContacts.length > 0,
    importantAccounts.some((account) => account.kind === 'insurance'),
    assets.some((asset) => isCriticalEmergencyDevice(asset)),
    importantAccounts.some((account) => hasRecoverySignals(account)),
    ownershipSummary.status === 'ready',
  ];
  const readyCount = essentials.filter(Boolean).length;
  const total = essentials.length;

  return {
    detail:
      readyCount === total
        ? 'Core access, contacts, insurance, devices, recovery notes, and ownership coverage are all in place for a real handoff.'
        : ownershipSummary.status !== 'ready'
          ? 'Finish the missing basics and role gaps so someone else can step in without guessing who owns the next move.'
          : 'Finish the missing basics so someone else can step in without guessing where to look first.',
    readyCount,
    statusLabel:
      readyCount === total ? 'Ready now' : readyCount >= 3 ? 'In progress' : 'Needs setup',
    total,
  };
}

function buildPriorityActions({
  accessItems,
  assets,
  criticalDocuments,
  emergencyContacts,
  importantAccounts,
  onAddEmergencyContact,
  onAddImportantAccount,
  onOpenAccessArea,
  onOpenDevices,
  onOpenDocumentArea,
  onOpenExport,
  onOpenTrustedHandoff,
  packetFocus,
}: {
  accessItems: AccessItem[];
  assets: AssetListItem[];
  criticalDocuments: DocumentListItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  onAddEmergencyContact: () => void;
  onAddImportantAccount: () => void;
  onOpenAccessArea: () => void;
  onOpenDevices: () => void;
  onOpenDocumentArea: () => void;
  onOpenExport: () => void;
  onOpenTrustedHandoff: () => void;
  packetFocus: 'broad' | 'narrow' | 'off';
}): EmergencyPriorityAction[] {
  const actions: EmergencyPriorityAction[] = [];

  if (accessItems.length === 0) {
    actions.push({
      badge: 'Missing',
      cta: 'Open Access',
      detail: 'Save one lockbox, shutoff, garage, or entry note so helpers can act fast.',
      key: 'access',
      onPress: onOpenAccessArea,
      title: 'Save a home entry or shutoff note',
      tone: 'needs_setup',
    });
  }

  if (emergencyContacts.length === 0) {
    actions.push({
      badge: 'Missing',
      cta: 'Add contact',
      detail: 'List the person or service provider someone should call first.',
      key: 'contacts',
      onPress: onAddEmergencyContact,
      title: 'Add the first trusted contact',
      tone: 'needs_setup',
    });
  }

  if (!importantAccounts.some((account) => account.kind === 'insurance')) {
    actions.push({
      badge: 'Missing',
      cta: 'Add account',
      detail: 'Capture the insurer and policy record before you need a claim number under stress.',
      key: 'insurance',
      onPress: () => onAddImportantAccount(),
      title: 'Add the insurance account',
      tone: 'needs_setup',
    });
  }

  if (!assets.some((asset) => isCriticalEmergencyDevice(asset))) {
    actions.push({
      badge: 'Missing',
      cta: 'Open devices',
      detail: 'Track the router, a primary phone, or another critical device a helper would need fast.',
      key: 'devices',
      onPress: onOpenDevices,
      title: 'Track a phone, router, or other critical device',
      tone: 'needs_setup',
    });
  }

  if (!importantAccounts.some((account) => hasRecoverySignals(account))) {
    actions.push({
      badge: 'Missing',
      cta: 'Add account',
      detail: 'HomeVault tracks MFA and recovery readiness only. It does not store passwords.',
      key: 'recovery',
      onPress: () => onAddImportantAccount(),
      title: 'Add digital recovery notes',
      tone: 'needs_setup',
    });
  }

  if (criticalDocuments.length === 0) {
    actions.push({
      badge: 'Helpful',
      cta: 'Open Documents',
      detail: 'Link one policy, manual, shutoff map, or emergency file to make the dashboard useful sooner.',
      key: 'documents',
      onPress: onOpenDocumentArea,
      title: 'Link one critical document',
      tone: 'progress',
    });
  }

  if (actions.length === 0) {
    if (packetFocus !== 'off') {
      actions.push({
        badge: 'Ready',
        cta: packetFocus === 'narrow' ? 'Open packet' : 'Open export tools',
        detail: 'Your household basics are covered. Export or print the packet while the details are fresh.',
        key: 'packet',
        onPress: onOpenExport,
        title: 'Emergency packet is ready',
        tone: 'ready',
      });
    }
    actions.push({
      badge: 'Ready',
      cta: 'Start handoff',
      detail: 'Prepare a selective handoff for a spouse, sitter, or emergency helper.',
      key: 'handoff',
      onPress: onOpenTrustedHandoff,
      title: 'Prepare a trusted handoff',
      tone: 'ready',
    });
  } else {
    actions.push({
      badge: 'Ready',
      cta: 'Start handoff',
      detail: 'Trusted-share export is ready whenever you need a narrower handoff than the full packet.',
      key: 'handoff',
      onPress: onOpenTrustedHandoff,
      title: 'Prepare a trusted handoff',
      tone: 'ready',
    });
  }

  return actions.slice(0, 3);
}

function hasRecoverySignals(account: ImportantAccount) {
  return (
    Boolean(account.recoveryNotes) ||
    account.mfaEnabled === true ||
    account.recoveryCodesStored === true ||
    account.managedInPasswordManager === true
  );
}

function isCriticalEmergencyDevice(asset: AssetListItem) {
  return isRouterAsset(asset) || isDeviceAsset(asset);
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

function mapCoverageKindToAccountKind(key: ReturnType<typeof buildPrimaryRecoveryAccountCoverage>[number]['key']): ImportantAccount['kind'] {
  switch (key) {
    case 'primary_email':
      return 'email';
    case 'carrier':
      return 'carrier';
    case 'platform':
      return 'platform';
    case 'utility':
      return 'utility';
    case 'smart_home':
      return 'smart_home';
  }
}

function formatEmergencyContactPriority(priority: EmergencyContact['priority']) {
  switch (priority) {
    case 'primary':
      return 'Trusted person';
    case 'secondary':
      return 'Backup contact';
    case 'service_provider':
      return 'Service provider';
    case 'other':
    default:
      return 'Other contact';
  }
}

function filterPlaybooksForAudience(
  playbooks: ContinuityPlaybookGuide[],
  recommendedPlaybookIds: string[],
) {
  if (recommendedPlaybookIds.length === 0) {
    return playbooks;
  }

  return playbooks.filter((playbook) => recommendedPlaybookIds.includes(playbook.id));
}

function filterEmergencyContactsForAudience(
  emergencyContacts: EmergencyContact[],
  audienceKey: HomeVaultEmergencyAudienceKey,
) {
  if (audienceKey === 'whole_household' || audienceKey === 'spouse') {
    return emergencyContacts;
  }

  const allowedPriorities =
    audienceKey === 'emergency_helper'
      ? new Set<EmergencyContact['priority']>(['primary', 'secondary', 'service_provider'])
      : new Set<EmergencyContact['priority']>(['primary', 'secondary', 'service_provider']);
  const allowedResponsibilityCategories =
    audienceKey === 'teen_helper'
      ? new Set(['school', 'pet', 'home_service'])
      : audienceKey === 'house_sitter'
        ? new Set(['pet', 'home_service'])
        : new Set(['school', 'pet', 'home_service', 'trusted_helper', 'other']);

  return emergencyContacts.filter(
    (contact) =>
      allowedPriorities.has(contact.priority) ||
      (contact.responsibilityCategory != null &&
        allowedResponsibilityCategories.has(contact.responsibilityCategory)),
  );
}

function filterImportantAccountsForAudience(
  importantAccounts: ImportantAccount[],
  audienceKey: HomeVaultEmergencyAudienceKey,
) {
  if (audienceKey === 'whole_household' || audienceKey === 'spouse') {
    return importantAccounts;
  }

  if (audienceKey === 'emergency_helper') {
    return importantAccounts.filter(
      (account) =>
        account.kind === 'insurance' ||
        account.kind === 'utility' ||
        account.kind === 'carrier' ||
        account.kind === 'smart_home',
    );
  }

  return [];
}

function formatChecklistStatus(status: DigitalSafetyChecklistItem['status']) {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'needs_attention':
      return 'Needs review';
    case 'not_started':
    default:
      return 'Not started';
  }
}

function createOwnershipHandoffFileName(propertyLabel: string) {
  const safePropertyLabel = propertyLabel
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `homevault-responsibility-handoff-${safePropertyLabel || 'household'}-${new Date()
    .toISOString()
    .slice(0, 10)}.txt`;
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  hero: {
    gap: 6,
  },
  audienceGrid: {
    gap: 10,
  },
  audienceCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 6,
  },
  audienceCardSelected: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  readinessPanel: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  readinessPanelReady: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  readinessPanelProgress: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  readinessPanelNeedsSetup: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red,
  },
  readinessTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  kicker: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  actionsRow: {
    gap: 10,
  },
  actionCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 4,
  },
  actionCardPrimary: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  actionCardSecondary: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  actionTitle: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '900',
  },
  actionDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  actionTitlePrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  actionDetailPrimary: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  utilityCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
    padding: 14,
    gap: 4,
  },
  utilityCardTitle: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '900',
  },
  utilityCardDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  utilityLink: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 2,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionActionInline: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  cardShareButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardShareButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionIntro: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  recordHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  recordMainButton: {
    gap: 5,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  statusPillReady: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
    color: colors.green,
  },
  statusPillProgress: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
    color: colors.blue,
  },
  statusPillNeedsSetup: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red,
    color: colors.red,
  },
  recordCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 5,
  },
  reviewCard: {
    backgroundColor: '#FFF6EA',
    borderColor: '#E6C38A',
  },
  recordTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  recordTag: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  recordDetail: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  recordMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  emptyPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  emptyPrimaryAction: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: colors.green,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPrimaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
