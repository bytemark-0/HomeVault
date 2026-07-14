import { mapAssetToContinuitySection, type AccessItem, type ContinuityPlaybook, type EmergencyContact, type ImportantAccount, type MaintenanceTask, type PartSupply, type Property, type RepairEvent, type TaskCompletion } from '@homevault/domain';
import { buildHomeVaultEmergencyPacket } from '@homevault/export';

import type { AssetListItem, DocumentListItem, RoomListItem } from '../data/homeVaultSampleData';
import { buildDigitalSafetyChecklist, buildPrimaryRecoveryAccountCoverage } from './digitalSafety';
import { buildOwnershipResponsibilities, buildOwnershipSummary } from './ownershipRoles';
import {
  getAccessItemReviewSummary,
  getCriticalDeviceReviewSummary,
  getEmergencyContactReviewSummary,
  getImportantAccountReviewSummary,
} from './reviewFreshness';
import { computeNextDueDate, getTaskStateForDate } from './taskUtils';

export const ANNUAL_REVIEW_TASK_PREFIX = 'annual-review';
export const ANNUAL_REVIEW_TITLE = 'Run annual household review';

export type AnnualReviewChecklistKey =
  | 'insurance'
  | 'contacts'
  | 'access'
  | 'devices'
  | 'digital_safety'
  | 'ownership'
  | 'packet';

export type AnnualReviewChecklistItem = {
  key: AnnualReviewChecklistKey;
  title: string;
  detail: string;
  actionLabel: string;
  status: 'ready' | 'needs_attention';
};

type AnnualReviewChecklistInput = {
  property: Property;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  accessItems: AccessItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  continuityPlaybooks: ContinuityPlaybook[];
  tasks: MaintenanceTask[];
  rooms: RoomListItem[];
  taskCompletions: TaskCompletion[];
  repairEvents: RepairEvent[];
  parts: PartSupply[];
};

export function getAnnualReviewTaskId(propertyId: string): string {
  return `${ANNUAL_REVIEW_TASK_PREFIX}-${propertyId}`;
}

export function isAnnualReviewTaskId(taskId: string): boolean {
  return taskId.startsWith(`${ANNUAL_REVIEW_TASK_PREFIX}-`);
}

export function findAnnualReviewTask(
  tasks: MaintenanceTask[],
  propertyId: string,
): MaintenanceTask | undefined {
  return tasks.find(
    (task) =>
      task.id === getAnnualReviewTaskId(propertyId) ||
      (task.scope === 'property' &&
        task.scopeId === propertyId &&
        task.title === ANNUAL_REVIEW_TITLE),
  );
}

export function buildAnnualReviewInstructions(): string {
  return [
    'Review insurance coverage and claim contacts.',
    'Confirm emergency contacts and service providers.',
    'Verify access details such as Wi-Fi, shutoffs, alarms, and lockboxes.',
    'Review key devices and recovery notes.',
    'Review MFA, recovery codes, device backups, screen lock, and find-my-device readiness.',
    'Confirm who owns the claims, utilities, device recovery, and backup-helper responsibilities.',
    'Regenerate the emergency packet after major updates.',
  ].join(' ');
}

export function resolveAnnualReviewDueDate(lastCompletedAt?: string | null): string {
  if (lastCompletedAt) {
    return computeNextDueDate('Yearly', lastCompletedAt) ?? new Date().toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

export function buildAnnualReviewChecklist(
  input: AnnualReviewChecklistInput,
): AnnualReviewChecklistItem[] {
  const insuranceRecords = input.importantAccounts.filter((account) => account.kind === 'insurance');
  const insuranceDocuments = input.documents.filter(
    (document) => document.type === 'insurance' || document.type === 'policy',
  );
  const trustedContacts = input.emergencyContacts.filter(
    (contact) => contact.priority === 'primary' || contact.priority === 'secondary',
  );
  const deviceAssets = input.assets.filter((asset) => mapAssetToContinuitySection(asset) === 'devices');
  const deviceCount = deviceAssets.length;
  const accessReview = summarizeReviewState(input.accessItems.map(getAccessItemReviewSummary));
  const contactReview = summarizeReviewState(
    input.emergencyContacts.map(getEmergencyContactReviewSummary),
  );
  const insuranceReview = summarizeReviewState(
    insuranceRecords.map(getImportantAccountReviewSummary),
  );
  const deviceReview = summarizeReviewState(deviceAssets.map(getCriticalDeviceReviewSummary));
  const digitalSafetyChecklist = buildDigitalSafetyChecklist(input.importantAccounts, input.assets);
  const primaryRecoveryCoverage = buildPrimaryRecoveryAccountCoverage(input.importantAccounts);
  const ownershipResponsibilities = buildOwnershipResponsibilities({
    assets: input.assets,
    emergencyContacts: input.emergencyContacts,
    importantAccounts: input.importantAccounts,
  });
  const ownershipSummary = buildOwnershipSummary(ownershipResponsibilities);
  const firstOwnershipGap = ownershipResponsibilities.find(
    (item) =>
      item.status !== 'ready' &&
      item.status !== 'not_applicable',
  );
  const primaryRecoveryReadyCount = primaryRecoveryCoverage.filter((item) => item.status === 'ready').length;
  const primaryRecoveryGap = primaryRecoveryCoverage.find((item) => item.status !== 'ready');
  const digitalSafetyReadyCount = digitalSafetyChecklist.filter((item) => item.status === 'ready').length;
  const digitalSafetyMissing = digitalSafetyChecklist.filter((item) => item.status !== 'ready');
  const firstDigitalSafetyGap = digitalSafetyMissing[0];
  const packet = buildHomeVaultEmergencyPacket({
    property: input.property,
    rooms: input.rooms,
    assets: input.assets,
    documents: input.documents,
    accessItems: input.accessItems,
    emergencyContacts: input.emergencyContacts,
    importantAccounts: input.importantAccounts,
    continuityPlaybooks: input.continuityPlaybooks,
    tasks: input.tasks,
    taskCompletions: input.taskCompletions,
    repairEvents: input.repairEvents,
    parts: input.parts,
  });

  return [
    {
      key: 'insurance',
      title: 'Insurance records',
      detail:
        insuranceRecords.length > 0 || insuranceDocuments.length > 0
          ? insuranceRecords.length > 0 && insuranceReview.needsAttentionCount > 0
            ? `${insuranceReview.needsAttentionCount} insurance account${insuranceReview.needsAttentionCount === 1 ? '' : 's'} need a fresher review.`
            : `${insuranceRecords.length} account${insuranceRecords.length === 1 ? '' : 's'} and ${insuranceDocuments.length} policy document${insuranceDocuments.length === 1 ? '' : 's'} are current.`
          : 'Add or verify at least one policy account or coverage document.',
      actionLabel: insuranceRecords.length > 0 ? 'Review coverage' : 'Add insurance account',
      status:
        insuranceRecords.length > 0 || insuranceDocuments.length > 0
          ? insuranceRecords.length > 0 && insuranceReview.needsAttentionCount > 0
            ? 'needs_attention'
            : 'ready'
          : 'needs_attention',
    },
    {
      key: 'contacts',
      title: 'Emergency contacts',
      detail:
        input.emergencyContacts.length >= 3
          ? contactReview.needsAttentionCount > 0
            ? `${contactReview.needsAttentionCount} of ${input.emergencyContacts.length} contacts need to be reviewed again.`
            : `${input.emergencyContacts.length} contacts are saved, including ${trustedContacts.length} trusted people.`
          : 'Keep at least three contacts ready so a helper knows who to call first.',
      actionLabel: input.emergencyContacts.length > 0 ? 'Review contacts' : 'Add contacts',
      status:
        input.emergencyContacts.length >= 3 && contactReview.needsAttentionCount === 0
          ? 'ready'
          : 'needs_attention',
    },
    {
      key: 'access',
      title: 'Access info',
      detail:
        input.accessItems.length > 0
          ? accessReview.needsAttentionCount > 0
            ? `${accessReview.needsAttentionCount} of ${input.accessItems.length} access record${input.accessItems.length === 1 ? '' : 's'} need a fresh review.`
            : `${input.accessItems.length} access record${input.accessItems.length === 1 ? '' : 's'} are current for Wi-Fi, entries, and shutoffs.`
          : 'Save Wi-Fi, shutoff, garage, alarm, or entry notes before you need them.',
      actionLabel: input.accessItems.length > 0 ? 'Review access' : 'Add access info',
      status:
        input.accessItems.length > 0 && accessReview.needsAttentionCount === 0
          ? 'ready'
          : 'needs_attention',
    },
    {
      key: 'devices',
      title: 'Critical devices',
      detail:
        deviceCount > 0
          ? deviceReview.needsAttentionCount > 0
            ? `${deviceReview.needsAttentionCount} of ${deviceCount} device${deviceCount === 1 ? '' : 's'} need a fresher review.`
            : `${deviceCount} device${deviceCount === 1 ? '' : 's'} are documented with current recovery context.`
          : 'Document the router, phones, or other critical gear a helper would need to find fast.',
      actionLabel: deviceCount > 0 ? 'Review devices' : 'Add device',
      status:
        deviceCount > 0 && deviceReview.needsAttentionCount === 0
          ? 'ready'
          : 'needs_attention',
    },
    {
      key: 'digital_safety',
      title: 'Digital safety',
      detail:
        digitalSafetyReadyCount === digitalSafetyChecklist.length &&
        primaryRecoveryReadyCount === primaryRecoveryCoverage.length
          ? `${digitalSafetyReadyCount} of ${digitalSafetyChecklist.length} digital safety checks are ready, and all ${primaryRecoveryCoverage.length} primary recovery accounts are covered.`
          : primaryRecoveryGap && digitalSafetyMissing.length > 0
            ? `Review ${primaryRecoveryGap.title.toLowerCase()} coverage and ${digitalSafetyMissing.length} digital recovery check${digitalSafetyMissing.length === 1 ? '' : 's'}.`
          : primaryRecoveryGap
            ? `Review ${primaryRecoveryGap.title.toLowerCase()} coverage before the next annual check-in.`
          : firstDigitalSafetyGap && digitalSafetyMissing.length > 1
            ? `Review ${firstDigitalSafetyGap.title.toLowerCase()} and ${digitalSafetyMissing.length - 1} more digital recovery check${digitalSafetyMissing.length - 1 === 1 ? '' : 's'}.`
            : firstDigitalSafetyGap
              ? `Review ${firstDigitalSafetyGap.title.toLowerCase()} before the next annual check-in.`
            : 'Review digital recovery readiness across accounts and primary devices.',
      actionLabel: 'Review digital safety',
      status:
        digitalSafetyReadyCount === digitalSafetyChecklist.length &&
        primaryRecoveryReadyCount === primaryRecoveryCoverage.length
          ? 'ready'
          : 'needs_attention',
    },
    {
      key: 'ownership',
      title: 'Ownership and backup roles',
      detail:
        ownershipSummary.status === 'ready'
          ? `${ownershipSummary.readyCount} of ${ownershipSummary.total} mapped responsibilities have both an owner and a backup path.`
          : firstOwnershipGap
            ? `${ownershipSummary.ownerGapCount} owner gap${ownershipSummary.ownerGapCount === 1 ? '' : 's'} and ${ownershipSummary.backupGapCount} backup gap${ownershipSummary.backupGapCount === 1 ? '' : 's'} remain. Start with ${firstOwnershipGap.title.toLowerCase()}.`
            : 'Review who owns the critical handoff responsibilities before the next annual check-in.',
      actionLabel: 'Review ownership',
      status: ownershipSummary.status === 'ready' ? 'ready' : 'needs_attention',
    },
    {
      key: 'packet',
      title: 'Emergency packet',
      detail:
        packet.summary.includedSectionCount >= 4
          ? `${packet.summary.includedSectionCount} of 5 continuity sections are ready to export again.`
          : 'Regenerate the packet after coverage, contacts, access, or device details change.',
      actionLabel: 'Regenerate packet',
      status: packet.summary.includedSectionCount >= 4 ? 'ready' : 'needs_attention',
    },
  ];
}

function summarizeReviewState(
  summaries: Array<{ status: 'current' | 'stale' | 'missing' }>,
) {
  return {
    needsAttentionCount: summaries.filter((summary) => summary.status !== 'current').length,
  };
}

export function getAnnualReviewTaskRoute(taskId: string): string {
  return isAnnualReviewTaskId(taskId) ? '/annual-review' : `/task/${taskId}`;
}

export function getAnnualReviewCompletionRoute(taskId: string): string {
  return isAnnualReviewTaskId(taskId) ? '/annual-review' : `/task/${taskId}/complete`;
}

export function buildAnnualReviewTask(propertyId: string, lastCompletedAt?: string | null): {
  id: string;
  propertyId: string;
  scope: 'property';
  scopeId: string;
  title: string;
  dueDate: string;
  recurrenceKind: 'interval';
  recurrenceLabel: 'Yearly';
  state: ReturnType<typeof getTaskStateForDate>;
  instructions: string;
} {
  const dueDate = resolveAnnualReviewDueDate(lastCompletedAt);

  return {
    id: getAnnualReviewTaskId(propertyId),
    propertyId,
    scope: 'property',
    scopeId: propertyId,
    title: ANNUAL_REVIEW_TITLE,
    dueDate,
    recurrenceKind: 'interval',
    recurrenceLabel: 'Yearly',
    state: getTaskStateForDate(dueDate),
    instructions: buildAnnualReviewInstructions(),
  };
}
