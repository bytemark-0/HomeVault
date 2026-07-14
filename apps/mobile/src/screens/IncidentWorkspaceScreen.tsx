import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { EmergencyContact, Property } from '@homevault/domain';

import { PhotoPickerField } from '../components/PhotoPickerField';
import type { DocumentListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';
import type { ContinuityPlaybookGuide, ContinuityPlaybookTarget } from '../utils/continuityPlaybooks';
import {
  addIncidentContactInteraction,
  addIncidentDocumentLink,
  addIncidentNote,
  addIncidentPhoto,
  archiveIncidentWorkspace,
  buildIncidentRecoveryPlan,
  buildIncidentWorkspaceExportSummary,
  buildIncidentWorkspaceFromGuide,
  closeIncidentWorkspace,
  formatRecoveryChecklistStatus,
  formatRecoveryStatusValue,
  formatIncidentWorkspaceExportSummary,
  formatIncidentWorkspaceStatus,
  updateRecoveryChecklistItem,
  type HomeVaultRecoveryChecklistStatus,
  type HomeVaultRecoveryStatusValue,
  type HomeVaultIncidentSummaryAudience,
} from '../utils/incidentWorkspaces';
import { shareTextFile } from '../utils/textShare';

type IncidentWorkspaceScreenProps = {
  documents: DocumentListItem[];
  emergencyContacts: EmergencyContact[];
  guide: ContinuityPlaybookGuide;
  onBack: () => void;
  onOpenTarget: (target: ContinuityPlaybookTarget) => void;
  onShared: (message: string) => void;
  property: Pick<Property, 'id' | 'label' | 'type'>;
};

export function IncidentWorkspaceScreen({
  documents,
  emergencyContacts,
  guide,
  onBack,
  onOpenTarget,
  onShared,
  property,
}: IncidentWorkspaceScreenProps) {
  const [claimNumber, setClaimNumber] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [localNotes, setLocalNotes] = useState<Array<{ occurredAt: string; summary: string }>>([]);
  const [photoDraftUri, setPhotoDraftUri] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [localPhotos, setLocalPhotos] = useState<
    Array<{ detail?: string; occurredAt: string; photoUri: string; summary: string }>
  >([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    documents[0]?.id ?? null,
  );
  const [documentDetail, setDocumentDetail] = useState('');
  const [localDocumentLinks, setLocalDocumentLinks] = useState<
    Array<{ detail: string; documentId?: string; occurredAt: string; summary: string }>
  >([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    emergencyContacts[0]?.id ?? null,
  );
  const [contactChannel, setContactChannel] = useState<
    'call' | 'text' | 'email' | 'in_person' | 'portal'
  >('call');
  const [contactOutcome, setContactOutcome] = useState('');
  const [localContactInteractions, setLocalContactInteractions] = useState<
    Array<{
      channel: 'call' | 'text' | 'email' | 'in_person' | 'portal';
      contactName: string;
      occurredAt: string;
      outcome: string;
      summary: string;
    }>
  >([]);
  const [selectedAudience, setSelectedAudience] = useState<HomeVaultIncidentSummaryAudience | null>(
    null,
  );
  const [recoveryChecklist, setRecoveryChecklist] = useState(() =>
    buildIncidentRecoveryPlan({
      workspace: buildIncidentWorkspaceFromGuide({
        property,
        guide,
      }),
    }).checklist,
  );
  const [claimStatus, setClaimStatus] = useState<HomeVaultRecoveryStatusValue>('not_started');
  const [contractorStatus, setContractorStatus] = useState<HomeVaultRecoveryStatusValue>('not_started');
  const [reimbursementStatus, setReimbursementStatus] =
    useState<HomeVaultRecoveryStatusValue>('not_started');
  const [closedAt, setClosedAt] = useState<string | null>(null);
  const [archivedAt, setArchivedAt] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? documents[0] ?? null;
  const selectedContact =
    emergencyContacts.find((contact) => contact.id === selectedContactId) ??
    emergencyContacts[0] ??
    null;

  const workspace = useMemo(() => {
    let nextWorkspace = buildIncidentWorkspaceFromGuide({
      property,
      guide,
      claimNumber: cleanOptional(claimNumber),
    });

    for (const note of localNotes) {
      nextWorkspace = addIncidentNote(nextWorkspace, {
        occurredAt: note.occurredAt,
        summary: note.summary,
        detail: note.summary,
      });
    }

    for (const photo of localPhotos) {
      nextWorkspace = addIncidentPhoto(nextWorkspace, photo);
    }

    for (const link of localDocumentLinks) {
      nextWorkspace = addIncidentDocumentLink(nextWorkspace, link);
    }

    for (const interaction of localContactInteractions) {
      nextWorkspace = addIncidentContactInteraction(nextWorkspace, interaction);
    }

    if (closedAt) {
      nextWorkspace = closeIncidentWorkspace(nextWorkspace, closedAt);
    }

    if (archivedAt) {
      nextWorkspace = archiveIncidentWorkspace(nextWorkspace, archivedAt);
    }

    return nextWorkspace;
  }, [
    archivedAt,
    claimNumber,
    closedAt,
    guide,
    localContactInteractions,
    localDocumentLinks,
    localNotes,
    localPhotos,
    property,
  ]);

  const activeAudience = selectedAudience ?? workspace.exportAudiences[0]?.key ?? 'insurer';
  const exportSummary = useMemo(
    () => buildIncidentWorkspaceExportSummary(workspace, activeAudience),
    [activeAudience, workspace],
  );
  const recoveryPlan = useMemo(
    () =>
      buildIncidentRecoveryPlan({
        workspace,
        checklist: recoveryChecklist,
        statusTracker: {
          claim: claimStatus,
          contractor: contractorStatus,
          reimbursement: reimbursementStatus,
        },
      }),
    [claimStatus, contractorStatus, recoveryChecklist, reimbursementStatus, workspace],
  );

  async function handleExport() {
    if (isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      const result = await shareTextFile({
        text: formatIncidentWorkspaceExportSummary(exportSummary),
        fileName: createIncidentSummaryFileName(workspace, activeAudience),
        dialogTitle: 'Share HomeVault incident summary',
      });
      const message =
        result === 'downloaded' ? 'Incident summary downloaded.' : 'Incident summary shared.';

      setExportStatus(message);
      onShared(message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not export the incident summary.';

      setExportStatus(message);
      onShared(message);
    } finally {
      setIsExporting(false);
    }
  }

  function handleAddNote() {
    const summary = noteDraft.trim();

    if (!summary) {
      return;
    }

    setLocalNotes((current) => [
      ...current,
      {
        occurredAt: new Date().toISOString(),
        summary,
      },
    ]);
    setNoteDraft('');
  }

  function handleAddPhotoEvidence() {
    if (!photoDraftUri) {
      return;
    }

    setLocalPhotos((current) => [
      ...current,
      {
        occurredAt: new Date().toISOString(),
        photoUri: photoDraftUri,
        summary: photoCaption.trim() || 'Photo evidence added',
        detail: cleanOptional(photoCaption),
      },
    ]);
    setPhotoDraftUri('');
    setPhotoCaption('');
  }

  function handleAddDocumentLink() {
    if (!selectedDocument) {
      return;
    }

    setLocalDocumentLinks((current) => [
      ...current,
      {
        occurredAt: new Date().toISOString(),
        documentId: selectedDocument.id,
        summary: `Linked ${selectedDocument.title}`,
        detail: documentDetail.trim() || `Linked ${selectedDocument.typeLabel.toLowerCase()} evidence.`,
      },
    ]);
    setDocumentDetail('');
  }

  function handleAddContactInteraction() {
    if (!selectedContact || contactOutcome.trim().length === 0) {
      return;
    }

    setLocalContactInteractions((current) => [
      ...current,
      {
        occurredAt: new Date().toISOString(),
        contactName: selectedContact.name,
        channel: contactChannel,
        outcome: contactOutcome.trim(),
        summary: `${formatContactChannel(contactChannel)} with ${selectedContact.name}`,
      },
    ]);
    setContactOutcome('');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>Incident workspace</Text>
        <Text style={styles.title}>{workspace.scenario.label}</Text>
        <Text style={styles.subtitle}>{workspace.scenario.description}</Text>
        <Text style={styles.metaText}>
          Built from {guide.title} · {workspace.linkedRecords.length} linked records ·{' '}
          {workspace.highPriorityGaps.length} required gap
          {workspace.highPriorityGaps.length === 1 ? '' : 's'}
        </Text>
        <Text style={styles.metaText}>
          Status: {formatIncidentWorkspaceStatus(workspace.status)} · Updated {workspace.updatedAt}
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Claim or case tracking</Text>
        <Text style={styles.sectionText}>
          Add the claim, ticket, or case number if this incident already has one.
        </Text>
        <TextInput
          value={claimNumber}
          onChangeText={setClaimNumber}
          placeholder="CLM-2026-0142 or utility ticket"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.sectionMeta}>
          {workspace.claimNumber
            ? `Tracking ${workspace.claimNumber}`
            : 'No claim number added yet.'}
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Do this first</Text>
        {workspace.nextActions.map((step) => (
          <Text key={step} style={styles.bulletText}>
            - {step}
          </Text>
        ))}
        <Text style={styles.sectionMeta}>{workspace.retention.guidance}</Text>
        <View style={styles.optionRow}>
          <Pressable
            onPress={() => setClosedAt((current) => current ?? new Date().toISOString())}
            disabled={Boolean(closedAt)}
            style={[styles.secondaryActionButton, Boolean(closedAt) && styles.buttonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>
              {closedAt ? 'Incident closed' : 'Mark incident closed'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!closedAt) {
                setClosedAt(new Date().toISOString());
              }
              setArchivedAt((current) => current ?? new Date().toISOString());
            }}
            disabled={Boolean(archivedAt)}
            style={[styles.secondaryActionButton, Boolean(archivedAt) && styles.buttonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>
              {archivedAt ? 'Incident archived' : 'Archive workspace'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Recovery tracker</Text>
        <Text style={styles.sectionText}>
          Keep the repair, replacement, reimbursement, and follow-up tail visible after the first
          incident rush passes.
        </Text>
        <View style={styles.scopeGrid}>
          <StatusCard
            label="Claim"
            value={claimStatus}
            onSelect={setClaimStatus}
          />
          <StatusCard
            label="Contractor"
            value={contractorStatus}
            onSelect={setContractorStatus}
          />
          <StatusCard
            label="Reimbursement"
            value={reimbursementStatus}
            onSelect={setReimbursementStatus}
          />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Recovery checklist</Text>
        <Text style={styles.sectionText}>
          These local-only tasks are here to keep repair and reimbursement follow-through from
          disappearing after the emergency moment.
        </Text>
        {recoveryPlan.checklist.map((item) => (
          <View key={item.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>{item.label}</Text>
              <Text style={styles.recordTag}>{formatRecoveryChecklistStatus(item.status)}</Text>
            </View>
            <Text style={styles.recordDetail}>{item.detail}</Text>
            <View style={styles.optionRow}>
              {RECOVERY_CHECKLIST_STATUS_OPTIONS.map((option) => {
                const selected = option === item.status;

                return (
                  <Pressable
                    key={option}
                    onPress={() =>
                      setRecoveryChecklist((current) =>
                        updateRecoveryChecklistItem(current, item.id, option),
                      )
                    }
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[styles.optionChipText, selected && styles.optionChipTextSelected]}
                    >
                      {formatRecoveryChecklistStatus(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Unresolved reminders</Text>
        <Text style={styles.sectionText}>
          Use these as local nudges for missing evidence and unresolved recovery work before you
          archive the workspace.
        </Text>
        {recoveryPlan.unresolvedReminders.map((reminder) => (
          <Text key={reminder} style={styles.bulletText}>
            - {reminder}
          </Text>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Return to ready</Text>
        <Text style={styles.sectionText}>
          Before you close this out, convert the recovery lessons back into household readiness.
        </Text>
        {recoveryPlan.returnToReadyPrompts.map((prompt) => (
          <Text key={prompt} style={styles.bulletText}>
            - {prompt}
          </Text>
        ))}
        <Text style={styles.sectionMeta}>
          {recoveryPlan.exportReady
            ? 'This recovery workspace is in good shape to archive or export as a completed summary.'
            : 'Keep the recovery tracker moving until the unresolved reminders above are cleared.'}
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Starter timeline</Text>
        <Text style={styles.sectionText}>
          Keep a clean incident trail with timestamped notes while things are still unfolding.
        </Text>
        {workspace.timeline.map((entry) => (
          <View key={entry.id} style={styles.timelineRow}>
            <Text style={styles.timelineTitle}>{entry.summary}</Text>
            <Text style={styles.recordDetail}>{formatTimelineEntryDetail(entry)}</Text>
            <Text style={styles.timelineMeta}>{entry.occurredAt}</Text>
          </View>
        ))}
        <TextInput
          value={noteDraft}
          onChangeText={setNoteDraft}
          placeholder="Add a note about damage, a call, or what changed next."
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.inputMultiline]}
          multiline
        />
        <Pressable
          onPress={handleAddNote}
          disabled={noteDraft.trim().length === 0}
          style={[styles.primaryButton, noteDraft.trim().length === 0 && styles.buttonDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Add timeline note</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Photo evidence</Text>
        <Text style={styles.sectionText}>
          Add a local photo of damage, conditions, or the repair context while the scene is still
          fresh.
        </Text>
        <PhotoPickerField
          prefix={`incident-${guide.id}`}
          value={photoDraftUri}
          onChange={setPhotoDraftUri}
          accessibilityLabel="Incident photo preview"
        />
        <TextInput
          value={photoCaption}
          onChangeText={setPhotoCaption}
          placeholder="What does this photo show?"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable
          onPress={handleAddPhotoEvidence}
          disabled={!photoDraftUri}
          style={[styles.primaryButton, !photoDraftUri && styles.buttonDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Add photo evidence</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Document links</Text>
        <Text style={styles.sectionText}>
          Link the policy, claim, invoice, or other document evidence that belongs in this incident
          trail.
        </Text>
        <View style={styles.optionRow}>
          {documents.map((document) => {
            const selected = document.id === selectedDocument?.id;

            return (
              <Pressable
                key={document.id}
                onPress={() => setSelectedDocumentId(document.id)}
                style={[styles.optionChip, selected && styles.optionChipSelected]}
                accessibilityRole="button"
              >
                <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                  {document.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={documentDetail}
          onChangeText={setDocumentDetail}
          placeholder="Why is this document relevant right now?"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.inputMultiline]}
          multiline
        />
        <Pressable
          onPress={handleAddDocumentLink}
          disabled={!selectedDocument}
          style={[styles.primaryButton, !selectedDocument && styles.buttonDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Link document evidence</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Contact interactions</Text>
        <Text style={styles.sectionText}>
          Keep a simple log of who you contacted, how, and what happened next.
        </Text>
        <View style={styles.optionRow}>
          {emergencyContacts.map((contact) => {
            const selected = contact.id === selectedContact?.id;

            return (
              <Pressable
                key={contact.id}
                onPress={() => setSelectedContactId(contact.id)}
                style={[styles.optionChip, selected && styles.optionChipSelected]}
                accessibilityRole="button"
              >
                <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                  {contact.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.optionRow}>
          {CONTACT_CHANNEL_OPTIONS.map((option) => {
            const selected = option.value === contactChannel;

            return (
              <Pressable
                key={option.value}
                onPress={() => setContactChannel(option.value)}
                style={[styles.optionChip, selected && styles.optionChipSelected]}
                accessibilityRole="button"
              >
                <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={contactOutcome}
          onChangeText={setContactOutcome}
          placeholder="Ticket opened, estimate scheduled, voicemail left, or next action."
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.inputMultiline]}
          multiline
        />
        <Pressable
          onPress={handleAddContactInteraction}
          disabled={!selectedContact || contactOutcome.trim().length === 0}
          style={[
            styles.primaryButton,
            (!selectedContact || contactOutcome.trim().length === 0) && styles.buttonDisabled,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Log contact interaction</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Linked records</Text>
        <Text style={styles.sectionText}>
          These are the records this incident already depends on. Open any one to review the real
          source before you hand details to someone else.
        </Text>
        {guide.readyRecords.map((resource) => (
          <Pressable
            key={resource.key}
            onPress={() => onOpenTarget(resource.target)}
            style={styles.recordCard}
            accessibilityRole="button"
          >
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>{resource.label}</Text>
              <Text style={styles.recordTag}>
                {resource.priority === 'required' ? 'Required' : 'Helpful'}
              </Text>
            </View>
            <Text style={styles.recordDetail}>{resource.detail}</Text>
            <Text style={styles.recordAction}>Open linked record</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Focused export summary</Text>
        <Text style={styles.sectionText}>
          Export only the incident summary someone needs for this handoff instead of the broader
          household archive.
        </Text>
        <View style={styles.optionRow}>
          {workspace.exportAudiences.map((audience) => {
            const selected = audience.key === activeAudience;

            return (
              <Pressable
                key={audience.key}
                onPress={() => setSelectedAudience(audience.key)}
                style={[styles.optionChip, selected && styles.optionChipSelected]}
                accessibilityRole="button"
              >
                <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                  {audience.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.sectionMeta}>{exportSummary.audience.detail}</Text>
        <Text style={styles.sectionMeta}>
          {exportSummary.linkedRecordCount} linked records · {exportSummary.timelineHighlights.length}{' '}
          timeline highlight{exportSummary.timelineHighlights.length === 1 ? '' : 's'}
        </Text>
        {exportStatus ? <Text style={styles.exportStatus}>{exportStatus}</Text> : null}
        <Pressable
          onPress={() => void handleExport()}
          disabled={isExporting}
          style={[styles.primaryButton, isExporting && styles.buttonDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>
            {isExporting
              ? 'Exporting...'
              : Platform.OS === 'web'
                ? 'Download incident summary'
                : 'Share incident summary'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const CONTACT_CHANNEL_OPTIONS: Array<{
  label: string;
  value: 'call' | 'text' | 'email' | 'in_person' | 'portal';
}> = [
  { label: 'Call', value: 'call' },
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Portal', value: 'portal' },
  { label: 'In person', value: 'in_person' },
];

function cleanOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function formatTimelineEntryDetail(
  entry: ReturnType<typeof buildIncidentWorkspaceFromGuide>['timeline'][number],
) {
  switch (entry.type) {
    case 'contact_interaction':
      return `${formatContactChannel(entry.channel)} · ${entry.contactName} · ${entry.outcome}`;
    case 'document_link':
      return entry.detail;
    case 'claim_update':
      return `${entry.claimNumber} · ${entry.detail}`;
    case 'photo':
      return entry.detail ?? 'Photo evidence saved in this incident trail.';
    case 'note':
    default:
      return entry.detail;
  }
}

function formatContactChannel(channel: 'call' | 'text' | 'email' | 'in_person' | 'portal') {
  switch (channel) {
    case 'call':
      return 'Call';
    case 'text':
      return 'Text';
    case 'email':
      return 'Email';
    case 'portal':
      return 'Portal';
    case 'in_person':
    default:
      return 'In person';
  }
}

function createIncidentSummaryFileName(
  workspace: ReturnType<typeof buildIncidentWorkspaceFromGuide>,
  audience: HomeVaultIncidentSummaryAudience,
) {
  return `homevault-incident-summary-${slugify(workspace.scenario.key)}-${slugify(audience)}-${slugify(workspace.property.label)}-${workspace.createdAt.slice(0, 10)}.txt`;
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'incident'
  );
}

const RECOVERY_CHECKLIST_STATUS_OPTIONS: HomeVaultRecoveryChecklistStatus[] = [
  'todo',
  'in_progress',
  'done',
  'blocked',
];

const RECOVERY_STATUS_OPTIONS: HomeVaultRecoveryStatusValue[] = [
  'not_started',
  'open',
  'waiting',
  'resolved',
];

function StatusCard({
  label,
  value,
  onSelect,
}: {
  label: string;
  onSelect: (value: HomeVaultRecoveryStatusValue) => void;
  value: HomeVaultRecoveryStatusValue;
}) {
  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusCardTitle}>{label}</Text>
      <Text style={styles.statusCardValue}>{formatRecoveryStatusValue(value)}</Text>
      <View style={styles.optionRow}>
        {RECOVERY_STATUS_OPTIONS.map((option) => {
          const selected = option === value;

          return (
            <Pressable
              key={`${label}-${option}`}
              onPress={() => onSelect(option)}
              style={[styles.optionChip, selected && styles.optionChipSelected]}
              accessibilityRole="button"
            >
              <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                {formatRecoveryStatusValue(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 16,
    gap: 8,
  },
  kicker: {
    color: colors.blue,
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
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  input: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  bulletText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  timelineRow: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    padding: 12,
    gap: 4,
  },
  scopeGrid: {
    gap: 10,
  },
  statusCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    padding: 12,
    gap: 8,
  },
  statusCardTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  statusCardValue: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  timelineTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  timelineMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  recordCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    padding: 12,
    gap: 6,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  recordTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  recordAction: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  optionChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  optionChipTextSelected: {
    color: colors.blue,
  },
  exportStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryActionButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  primaryButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
