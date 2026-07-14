import { buildHomeVaultEmergencyPacket } from '@homevault/export';
import type {
  AccessItem,
  ContinuityPlaybook,
  EmergencyContact,
  ImportantAccount,
  MaintenanceTask,
  PartSupply,
  Property,
  RepairEvent,
  RoomArea,
  TaskCompletion,
} from '@homevault/domain';

import type { AssetListItem, DocumentListItem } from '../data/homeVaultSampleData';
import { buildContinuityPlaybookGuides } from './continuityPlaybooks';
import { buildDigitalSafetyChecklist } from './digitalSafety';
import { isCriticalDocument } from './documentTaxonomy';
import { buildCriticalReviewQueue } from './reviewFreshness';
import { getSetupChecklistProgress } from './setupChecklist';

export type DashboardRouteTarget =
  | string
  | {
      pathname: string;
      params?: Record<string, string>;
    };

export type DashboardReadinessOpportunity = {
  key: string;
  label: string;
  detail: string;
  route: DashboardRouteTarget;
  points: number;
};

export type DashboardPriorityReviewAlert = {
  key: string;
  label: string;
  detail: string;
  route: DashboardRouteTarget;
  status: 'stale' | 'missing';
};

export type DashboardReadinessSummary = {
  score: number;
  label: string;
  nextOpportunity: DashboardReadinessOpportunity | null;
  opportunities: DashboardReadinessOpportunity[];
  priorityReviewAlerts: DashboardPriorityReviewAlert[];
  staleRecordsCount: number;
  breakdown: {
    criticalDocsScore: number;
    digitalSafetyScore: number;
    freshnessPenalty: number;
    maintenanceScore: number;
    packetScore: number;
    playbookScore: number;
    setupScore: number;
  };
  packetReadySectionCount: number;
  playbooksReadyCount: number;
  setupDoneCount: number;
  setupTotal: number;
};

type DashboardReadinessInput = {
  property: Property;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  accessItems: AccessItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  continuityPlaybooks: ContinuityPlaybook[];
  tasks: MaintenanceTask[];
  rooms?: RoomArea[];
  taskCompletions?: TaskCompletion[];
  repairEvents?: RepairEvent[];
  parts?: PartSupply[];
};

const SETUP_WEIGHT = 45;
const PACKET_WEIGHT = 20;
const DIGITAL_SAFETY_WEIGHT = 15;
const PLAYBOOK_WEIGHT = 10;
const CRITICAL_DOC_WEIGHT = 10;
const MAINTENANCE_WEIGHT = 10;

export function calculateDashboardReadinessSummary(
  input: DashboardReadinessInput,
): DashboardReadinessSummary {
  const setup = getSetupChecklistProgress({
    accessItems: input.accessItems,
    assets: input.assets,
    emergencyContacts: input.emergencyContacts,
    importantAccounts: input.importantAccounts,
  });
  const packet = buildHomeVaultEmergencyPacket({
    property: input.property,
    assets: input.assets,
    documents: input.documents,
    accessItems: input.accessItems,
    emergencyContacts: input.emergencyContacts,
    importantAccounts: input.importantAccounts,
    continuityPlaybooks: input.continuityPlaybooks,
    tasks: input.tasks,
    rooms: input.rooms ?? [],
    taskCompletions: input.taskCompletions ?? [],
    repairEvents: input.repairEvents ?? [],
    parts: input.parts ?? [],
  });
  const digitalSafetyChecklist = buildDigitalSafetyChecklist(input.importantAccounts, input.assets);
  const digitalSafetyReadyCount = digitalSafetyChecklist.filter((item) => item.status === 'ready').length;
  const digitalSafetyNeedsAttention = digitalSafetyChecklist.filter((item) => item.status !== 'ready');
  const criticalDocuments = input.documents.filter((document) => isCriticalDocument(document));
  const linkedCriticalDocuments = criticalDocuments.filter(
    (document) => document.linkedRecordIds.length > 0,
  );
  const playbooks = buildContinuityPlaybookGuides({
    property: input.property,
    assets: input.assets,
    documents: input.documents,
    accessItems: input.accessItems,
    emergencyContacts: input.emergencyContacts,
    importantAccounts: input.importantAccounts,
    continuityPlaybooks: input.continuityPlaybooks,
  });
  const readyPlaybooksCount = playbooks.filter(
    (playbook) => playbook.source === 'guided' && playbook.state === 'ready',
  ).length;
  const openTasks = input.tasks.filter((task) => task.state !== 'completed').length;
  const criticalReviewQueue = buildCriticalReviewQueue({
    accessItems: input.accessItems,
    assets: input.assets,
    emergencyContacts: input.emergencyContacts,
    importantAccounts: input.importantAccounts,
  });
  const staleCriticalRecords = criticalReviewQueue.filter(isStaleCriticalReviewItem);
  const freshnessPenalty = Math.min(
    18,
    staleCriticalRecords.reduce(
      (sum, item) => sum + (item.status === 'missing' ? 5 : 3),
      0,
    ),
  );

  const setupScore = Math.round((setup.doneCount / setup.total) * SETUP_WEIGHT);
  const packetScore = Math.round(
    (packet.summary.includedSectionCount / (packet.summary.includedSectionCount + packet.summary.missingSectionCount || 1)) *
      PACKET_WEIGHT,
  );
  const digitalSafetyScore = Math.round(
    (digitalSafetyReadyCount / (digitalSafetyChecklist.length || 1)) * DIGITAL_SAFETY_WEIGHT,
  );
  const playbookScore = Math.round((Math.min(readyPlaybooksCount, 3) / 3) * PLAYBOOK_WEIGHT);
  const criticalDocsScore =
    criticalDocuments.length > 0
      ? Math.round((linkedCriticalDocuments.length / criticalDocuments.length) * CRITICAL_DOC_WEIGHT)
      : 0;
  const maintenanceScore = Math.max(0, MAINTENANCE_WEIGHT - Math.min(MAINTENANCE_WEIGHT, openTasks * 2));

  const rawScore =
    setupScore +
    packetScore +
    digitalSafetyScore +
    playbookScore +
    criticalDocsScore +
    maintenanceScore;
  const score = Math.max(0, Math.min(100, rawScore - freshnessPenalty));
  const opportunities = buildReadinessOpportunities({
    criticalReviewQueue,
    criticalDocumentCount: criticalDocuments.length,
    digitalSafetyNeedsAttention,
    input,
    openTasks,
    packet,
    playbooksReadyCount: readyPlaybooksCount,
    setup,
  });

  return {
    score,
    label:
      score >= 80
        ? 'Strong coverage'
        : score >= 60
          ? 'Getting organized'
          : score >= 35
            ? 'Foundational coverage'
            : 'Needs setup',
    nextOpportunity: opportunities[0] ?? null,
    opportunities,
    priorityReviewAlerts: staleCriticalRecords.slice(0, 3).map((item) => ({
      key: item.key,
      label: `Review ${item.label}`,
      detail: `${item.subtitle} · ${item.detail}`,
      route: getCriticalReviewRoute(item),
      status: item.status,
    })),
    staleRecordsCount: staleCriticalRecords.length,
    breakdown: {
      criticalDocsScore,
      digitalSafetyScore,
      freshnessPenalty,
      maintenanceScore,
      packetScore,
      playbookScore,
      setupScore,
    },
    packetReadySectionCount: packet.summary.includedSectionCount,
    playbooksReadyCount: readyPlaybooksCount,
    setupDoneCount: setup.doneCount,
    setupTotal: setup.total,
  };
}

function buildReadinessOpportunities({
  criticalReviewQueue,
  criticalDocumentCount,
  digitalSafetyNeedsAttention,
  input,
  openTasks,
  packet,
  playbooksReadyCount,
  setup,
}: {
  criticalReviewQueue: ReturnType<typeof buildCriticalReviewQueue>;
  criticalDocumentCount: number;
  digitalSafetyNeedsAttention: ReturnType<typeof buildDigitalSafetyChecklist>;
  input: DashboardReadinessInput;
  openTasks: number;
  packet: ReturnType<typeof buildHomeVaultEmergencyPacket>;
  playbooksReadyCount: number;
  setup: ReturnType<typeof getSetupChecklistProgress>;
}): DashboardReadinessOpportunity[] {
  const opportunities: DashboardReadinessOpportunity[] = [];
  const topStaleRecords = criticalReviewQueue.filter((item) => item.status !== 'current').slice(0, 2);

  for (const item of topStaleRecords) {
    opportunities.push({
      key: `review:${item.key}`,
      label: `Review ${item.label}`,
      detail: `${item.subtitle} is ${item.status === 'missing' ? 'missing a first review' : 'stale'}.`,
      route: getCriticalReviewRoute(item),
      points: item.status === 'missing' ? 10 : 8,
    });
  }

  for (const step of setup.incomplete) {
    opportunities.push({
      key: step.key,
      label: step.label,
      detail: step.hint,
      route: step.route,
      points:
        step.key === 'wifi'
          ? 15
          : step.key === 'insurance' || step.key === 'emergency'
            ? 12
            : 11,
    });
  }

  const hasRecoveryReadyAccount = input.importantAccounts.some(
    (account) =>
      Boolean(account.recoveryNotes) ||
      account.mfaEnabled === true ||
      account.recoveryCodesStored === true ||
      account.managedInPasswordManager === true,
  );
  if (!hasRecoveryReadyAccount) {
    opportunities.push({
      key: 'recovery-account',
      label: 'Add recovery notes to an important account',
      detail: 'Track MFA, recovery codes, or where to look next without storing passwords.',
      route:
        input.importantAccounts[0]
          ? '/(tabs)/emergency'
          : { pathname: '/account/new', params: { kind: 'banking' } },
      points: 10,
    });
  }

  if (
    digitalSafetyNeedsAttention.length > 0 &&
    (input.importantAccounts.length > 0 || input.assets.length > 0)
  ) {
    const firstGap = digitalSafetyNeedsAttention[0];

    opportunities.push({
      key: 'digital-safety-review',
      label: 'Review one digital safety check',
      detail: `${firstGap.title} still needs attention before the next recovery emergency.`,
      route: '/(tabs)/emergency',
      points: 6,
    });
  }

  if (criticalDocumentCount === 0) {
    opportunities.push({
      key: 'critical-doc',
      label: 'Link one critical document',
      detail: 'Add a policy, emergency file, manual, or shutoff map to make the guide more useful fast.',
      route: { pathname: '/(tabs)/documents', params: { collection: 'critical' } },
      points: 9,
    });
  }

  if (packet.summary.missingSectionCount > 0) {
    const missingLabels = packet.summary.missingSections
      .slice(0, 2)
      .map((section) => section.title.toLowerCase())
      .join(' and ');

    opportunities.push({
      key: 'packet-sections',
      label: 'Fill one more emergency packet section',
      detail: missingLabels
        ? `The packet is still missing ${missingLabels}.`
        : 'The packet still needs more emergency-ready records.',
      route: '/export',
      points: 8,
    });
  }

  if (playbooksReadyCount < 3) {
    opportunities.push({
      key: 'playbooks',
      label: 'Complete the records behind recovery playbooks',
      detail: 'Guided response plans become much more useful once at least three are fully linked.',
      route: '/(tabs)/emergency',
      points: 7,
    });
  }

  if (openTasks > 0) {
    opportunities.push({
      key: 'maintenance',
      label: 'Clear one open maintenance reminder',
      detail: 'Maintenance still matters, but it should not outweigh continuity basics.',
      route: '/(tabs)/maintenance',
      points: Math.min(6, openTasks + 2),
    });
  }

  return opportunities
    .sort((left, right) => right.points - left.points || left.label.localeCompare(right.label))
    .slice(0, 3);
}

function getCriticalReviewRoute(item: ReturnType<typeof buildCriticalReviewQueue>[number]): DashboardRouteTarget {
  switch (item.recordType) {
    case 'access_item':
      return `/access/${item.recordId}`;
    case 'emergency_contact':
      return `/contact/${item.recordId}`;
    case 'important_account':
      return `/account/${item.recordId}`;
    case 'asset':
      return `/asset/${item.recordId}?source=devices`;
  }
}

function isStaleCriticalReviewItem(item: ReturnType<typeof buildCriticalReviewQueue>[number]): item is ReturnType<typeof buildCriticalReviewQueue>[number] & {
  status: 'stale' | 'missing';
} {
  return item.status !== 'current';
}
