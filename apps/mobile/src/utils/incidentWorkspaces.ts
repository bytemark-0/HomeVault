import type { Property } from '@homevault/domain';

import type {
  ContinuityPlaybookGuide,
  ContinuityPlaybookResource,
} from './continuityPlaybooks';

export type HomeVaultIncidentScenarioKey =
  | 'insurance'
  | 'utility'
  | 'theft'
  | 'property_damage';

export type HomeVaultIncidentWorkspaceStatus = 'active' | 'closed' | 'archived';

export type HomeVaultIncidentSummaryAudience = 'insurer' | 'landlord' | 'contractor';

export type HomeVaultRecoveryChecklistCategory =
  | 'repair'
  | 'replacement'
  | 'reimbursement'
  | 'follow_up';

export type HomeVaultRecoveryChecklistStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export type HomeVaultRecoveryStatusValue = 'not_started' | 'open' | 'waiting' | 'resolved';

export type HomeVaultIncidentLinkedRecord = {
  id: string;
  detail: string;
  kind:
    | 'access'
    | 'account'
    | 'asset'
    | 'contact'
    | 'document'
    | 'screen'
    | 'new_access'
    | 'new_account';
  label: string;
  priority: 'required' | 'recommended';
  status: 'ready' | 'missing';
};

export type HomeVaultIncidentTimelineEntry =
  | {
      id: string;
      occurredAt: string;
      type: 'note';
      summary: string;
      detail: string;
    }
  | {
      id: string;
      occurredAt: string;
      type: 'photo';
      summary: string;
      detail?: string;
      photoUri: string;
    }
  | {
      id: string;
      occurredAt: string;
      type: 'document_link';
      summary: string;
      detail: string;
      documentId?: string;
    }
  | {
      id: string;
      occurredAt: string;
      type: 'contact_interaction';
      summary: string;
      contactName: string;
      channel: 'call' | 'text' | 'email' | 'in_person' | 'portal';
      outcome: string;
    }
  | {
      id: string;
      occurredAt: string;
      type: 'claim_update';
      summary: string;
      detail: string;
      claimNumber: string;
    };

type HomeVaultIncidentTimelineEntryInput =
  | Omit<Extract<HomeVaultIncidentTimelineEntry, { type: 'note' }>, 'id'>
  | Omit<Extract<HomeVaultIncidentTimelineEntry, { type: 'photo' }>, 'id'>
  | Omit<Extract<HomeVaultIncidentTimelineEntry, { type: 'document_link' }>, 'id'>
  | Omit<Extract<HomeVaultIncidentTimelineEntry, { type: 'contact_interaction' }>, 'id'>
  | Omit<Extract<HomeVaultIncidentTimelineEntry, { type: 'claim_update' }>, 'id'>;

export type HomeVaultIncidentWorkspace = {
  id: string;
  property: Pick<Property, 'id' | 'label' | 'type'>;
  scenario: {
    key: HomeVaultIncidentScenarioKey;
    label: string;
    description: string;
  };
  title: string;
  summary: string;
  status: HomeVaultIncidentWorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  linkedPlaybookId?: string;
  claimNumber?: string;
  nextActions: string[];
  linkedRecords: HomeVaultIncidentLinkedRecord[];
  timeline: HomeVaultIncidentTimelineEntry[];
  highPriorityGaps: string[];
  exportAudiences: Array<{
    detail: string;
    key: HomeVaultIncidentSummaryAudience;
    label: string;
  }>;
  retention: {
    archiveAfterDays: number;
    guidance: string;
    keepClosedWorkspaces: true;
    reviewLabel: string;
  };
};

export type BuildIncidentWorkspaceFromGuideInput = {
  claimNumber?: string;
  guide: ContinuityPlaybookGuide;
  property: Pick<Property, 'id' | 'label' | 'type'>;
  startedAt?: string;
};

export type HomeVaultIncidentWorkspaceExportSummary = {
  audience: {
    detail: string;
    key: HomeVaultIncidentSummaryAudience;
    label: string;
  };
  claimNumber?: string;
  generatedAt: string;
  highPriorityGaps: string[];
  linkedRecordCount: number;
  propertyLabel: string;
  scenarioLabel: string;
  statusLabel: string;
  timelineHighlights: string[];
  title: string;
};

export type HomeVaultRecoveryChecklistItem = {
  category: HomeVaultRecoveryChecklistCategory;
  detail: string;
  id: string;
  label: string;
  status: HomeVaultRecoveryChecklistStatus;
};

export type HomeVaultRecoveryStatusTracker = {
  claim: HomeVaultRecoveryStatusValue;
  contractor: HomeVaultRecoveryStatusValue;
  reimbursement: HomeVaultRecoveryStatusValue;
};

export type HomeVaultRecoveryPlan = {
  checklist: HomeVaultRecoveryChecklistItem[];
  exportReady: boolean;
  returnToReadyPrompts: string[];
  statusTracker: HomeVaultRecoveryStatusTracker;
  unresolvedReminders: string[];
};

export const HOMEVAULT_INCIDENT_SCENARIOS: Array<{
  archiveAfterDays: number;
  description: string;
  exportAudiences: HomeVaultIncidentWorkspace['exportAudiences'];
  guidance: string;
  key: HomeVaultIncidentScenarioKey;
  label: string;
}> = [
  {
    key: 'insurance',
    label: 'Insurance incident',
    description:
      'Use this when damage, theft, or loss may turn into an insurer claim or documentation trail.',
    archiveAfterDays: 120,
    guidance:
      'Keep the workspace active through claim submission and early recovery, then archive it for future reference instead of deleting it.',
    exportAudiences: [
      {
        key: 'insurer',
        label: 'Insurer handoff',
        detail: 'Share the claim number, event timeline, and only the records tied to the incident.',
      },
      {
        key: 'contractor',
        label: 'Contractor handoff',
        detail: 'Share damage notes, contact history, and the minimum records needed for estimates or repair work.',
      },
    ],
  },
  {
    key: 'utility',
    label: 'Utility incident',
    description:
      'Use this when utilities, network access, or shutoff actions become part of the incident response.',
    archiveAfterDays: 45,
    guidance:
      'Keep the workspace until service is stable again, then archive it so repeated outages still have a prior timeline.',
    exportAudiences: [
      {
        key: 'landlord',
        label: 'Landlord handoff',
        detail: 'Share the outage timeline, property impact, and only the minimum records needed for building follow-up.',
      },
      {
        key: 'contractor',
        label: 'Service handoff',
        detail: 'Share system notes, contact history, and the relevant access or device records for troubleshooting.',
      },
    ],
  },
  {
    key: 'theft',
    label: 'Theft or fraud incident',
    description:
      'Use this when property, devices, identities, or accounts may be compromised and you need a clear response log.',
    archiveAfterDays: 180,
    guidance:
      'Archive this after provider follow-up, reimbursement, and account recovery are done so the timeline is preserved for disputes.',
    exportAudiences: [
      {
        key: 'insurer',
        label: 'Insurer handoff',
        detail: 'Share the theft timeline, affected records, and claim-facing notes without unrelated household context.',
      },
      {
        key: 'landlord',
        label: 'Landlord or building handoff',
        detail: 'Share entry, loss, or building-impact notes without broader family records.',
      },
    ],
  },
  {
    key: 'property_damage',
    label: 'Property-damage incident',
    description:
      'Use this when weather, leaks, fire, or structural problems create an active household recovery trail.',
    archiveAfterDays: 180,
    guidance:
      'Keep damage workspaces through the repair tail and archive them after the home is stable again.',
    exportAudiences: [
      {
        key: 'insurer',
        label: 'Insurer handoff',
        detail: 'Share the incident timeline, evidence notes, and the linked policy or claim records only.',
      },
      {
        key: 'contractor',
        label: 'Contractor handoff',
        detail: 'Share issue notes, photos, and the linked records needed for the repair estimate or site visit.',
      },
      {
        key: 'landlord',
        label: 'Landlord handoff',
        detail: 'Share building-impact notes and the minimum evidence needed for owner coordination.',
      },
    ],
  },
];

export function canStartIncidentWorkspaceFromGuide(guide: ContinuityPlaybookGuide) {
  return Boolean(getIncidentWorkspaceScenarioForGuide(guide));
}

export function getIncidentWorkspaceScenarioForGuide(
  guide: Pick<ContinuityPlaybookGuide, 'id'>,
) {
  if (guide.id === 'guide-insurance-incident') {
    return 'insurance' as const;
  }

  if (guide.id === 'guide-internet-outage' || guide.id === 'guide-fake-utility-shutoff') {
    return 'utility' as const;
  }

  if (
    guide.id === 'guide-stolen-phone' ||
    guide.id === 'guide-urgent-scam-call' ||
    guide.id === 'guide-carrier-fraud' ||
    guide.id === 'guide-bank-account-panic'
  ) {
    return 'theft' as const;
  }

  if (guide.id === 'guide-storm-prep' || guide.id === 'guide-evacuation-ready') {
    return 'property_damage' as const;
  }

  return null;
}

export function buildIncidentWorkspaceFromGuide(
  input: BuildIncidentWorkspaceFromGuideInput,
): HomeVaultIncidentWorkspace {
  const scenarioKey = getIncidentWorkspaceScenarioForGuide(input.guide);

  if (!scenarioKey) {
    throw new Error(`Guide ${input.guide.id} does not map to an incident-workspace scenario.`);
  }

  const startedAt = input.startedAt ?? new Date().toISOString();
  const scenario = getIncidentScenario(scenarioKey);
  const linkedRecords = [...input.guide.readyRecords, ...input.guide.missingRecords].map(
    (resource) => toIncidentLinkedRecord(resource),
  );
  const timeline: HomeVaultIncidentTimelineEntry[] = [
    {
      id: 'entry-1',
      occurredAt: startedAt,
      type: 'note',
      summary: `Workspace started from ${input.guide.title}`,
      detail: input.guide.whenToUse,
    },
  ];

  if (input.claimNumber?.trim()) {
    timeline.push({
      id: `entry-${timeline.length + 1}`,
      occurredAt: startedAt,
      type: 'claim_update',
      summary: 'Claim number added',
      detail: 'Claim or case tracking started for this incident.',
      claimNumber: input.claimNumber.trim(),
    });
  }

  return {
    id: `incident-${scenario.key}-${slugify(input.property.label)}-${startedAt.slice(0, 10)}`,
    property: { ...input.property },
    scenario: {
      key: scenario.key,
      label: scenario.label,
      description: scenario.description,
    },
    title: `${scenario.label} workspace`,
    summary: input.guide.summary,
    status: 'active',
    createdAt: startedAt,
    updatedAt: startedAt,
    linkedPlaybookId: input.guide.source === 'guided' ? input.guide.id : undefined,
    claimNumber: input.claimNumber?.trim() || undefined,
    nextActions: input.guide.steps.filter((step) => step.isRequired).map((step) => step.label),
    linkedRecords,
    timeline,
    highPriorityGaps: input.guide.missingRecords
      .filter((record) => record.priority === 'required')
      .map((record) => record.label),
    exportAudiences: scenario.exportAudiences.map((audience) => ({ ...audience })),
    retention: {
      archiveAfterDays: scenario.archiveAfterDays,
      guidance: scenario.guidance,
      keepClosedWorkspaces: true,
      reviewLabel: `Archive after ${scenario.archiveAfterDays} days once the incident is closed.`,
    },
  };
}

export function addIncidentNote(
  workspace: HomeVaultIncidentWorkspace,
  input: { detail: string; occurredAt?: string; summary: string },
) {
  return appendIncidentEntry(workspace, {
    type: 'note',
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    summary: input.summary,
    detail: input.detail,
  });
}

export function addIncidentPhoto(
  workspace: HomeVaultIncidentWorkspace,
  input: { detail?: string; occurredAt?: string; photoUri: string; summary: string },
) {
  return appendIncidentEntry(workspace, {
    type: 'photo',
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    summary: input.summary,
    detail: input.detail,
    photoUri: input.photoUri,
  });
}

export function addIncidentDocumentLink(
  workspace: HomeVaultIncidentWorkspace,
  input: { detail: string; documentId?: string; occurredAt?: string; summary: string },
) {
  return appendIncidentEntry(workspace, {
    type: 'document_link',
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    summary: input.summary,
    detail: input.detail,
    documentId: input.documentId,
  });
}

export function addIncidentContactInteraction(
  workspace: HomeVaultIncidentWorkspace,
  input: {
    channel: 'call' | 'text' | 'email' | 'in_person' | 'portal';
    contactName: string;
    occurredAt?: string;
    outcome: string;
    summary: string;
  },
) {
  return appendIncidentEntry(workspace, {
    type: 'contact_interaction',
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    summary: input.summary,
    contactName: input.contactName,
    channel: input.channel,
    outcome: input.outcome,
  });
}

export function closeIncidentWorkspace(
  workspace: HomeVaultIncidentWorkspace,
  closedAt?: string,
): HomeVaultIncidentWorkspace {
  const occurredAt = closedAt ?? new Date().toISOString();

  return appendIncidentEntry(
    {
      ...workspace,
      status: 'closed',
    },
    {
      type: 'note',
      occurredAt,
      summary: 'Incident closed',
      detail: workspace.retention.reviewLabel,
    },
  );
}

export function archiveIncidentWorkspace(
  workspace: HomeVaultIncidentWorkspace,
  archivedAt?: string,
): HomeVaultIncidentWorkspace {
  const occurredAt = archivedAt ?? new Date().toISOString();

  return appendIncidentEntry(
    {
      ...workspace,
      status: 'archived',
    },
    {
      type: 'note',
      occurredAt,
      summary: 'Incident archived',
      detail: workspace.retention.guidance,
    },
  );
}

export function buildIncidentWorkspaceExportSummary(
  workspace: HomeVaultIncidentWorkspace,
  audienceKey: HomeVaultIncidentSummaryAudience,
  generatedAt?: string,
): HomeVaultIncidentWorkspaceExportSummary {
  const audience =
    workspace.exportAudiences.find((candidate) => candidate.key === audienceKey) ??
    workspace.exportAudiences[0];

  if (!audience) {
    throw new Error('This workspace does not have any export audiences configured.');
  }

  return {
    audience,
    claimNumber: workspace.claimNumber,
    generatedAt: generatedAt ?? new Date().toISOString(),
    highPriorityGaps: [...workspace.highPriorityGaps],
    linkedRecordCount: workspace.linkedRecords.filter((record) => record.kind !== 'screen').length,
    propertyLabel: workspace.property.label,
    scenarioLabel: workspace.scenario.label,
    statusLabel: formatIncidentWorkspaceStatus(workspace.status),
    timelineHighlights: workspace.timeline
      .slice()
      .sort(compareIncidentEntries)
      .slice(-5)
      .map((entry) => `${entry.occurredAt}: ${entry.summary}`),
    title: workspace.title,
  };
}

export function formatIncidentWorkspaceExportSummary(
  summary: HomeVaultIncidentWorkspaceExportSummary,
) {
  const lines = [
    'HomeVault Incident Summary',
    '==========================',
    '',
    `Title      : ${summary.title}`,
    `Scenario   : ${summary.scenarioLabel}`,
    `Property   : ${summary.propertyLabel}`,
    `Audience   : ${summary.audience.label}`,
    `Generated  : ${summary.generatedAt}`,
    `Status     : ${summary.statusLabel}`,
    ...(summary.claimNumber ? [`Claim     : ${summary.claimNumber}`] : []),
    '',
    `Audience note: ${summary.audience.detail}`,
    '',
    `Linked records: ${summary.linkedRecordCount}`,
    '',
    'Timeline Highlights',
    '-------------------',
    ...(summary.timelineHighlights.length > 0
      ? summary.timelineHighlights.map((item) => `- ${item}`)
      : ['- No timeline entries recorded yet.']),
    '',
    'High-Priority Gaps',
    '------------------',
    ...(summary.highPriorityGaps.length > 0
      ? summary.highPriorityGaps.map((item) => `- ${item}`)
      : ['- No required gaps are currently flagged.']),
  ];

  return lines.join('\n').trim() + '\n';
}

export function formatIncidentWorkspaceStatus(status: HomeVaultIncidentWorkspaceStatus) {
  switch (status) {
    case 'archived':
      return 'Archived';
    case 'closed':
      return 'Closed';
    case 'active':
    default:
      return 'Active';
  }
}

export function buildIncidentRecoveryPlan(input: {
  checklist?: HomeVaultRecoveryChecklistItem[];
  statusTracker?: Partial<HomeVaultRecoveryStatusTracker>;
  workspace: HomeVaultIncidentWorkspace;
}): HomeVaultRecoveryPlan {
  const checklist =
    input.checklist?.map((item) => ({ ...item })) ??
    buildDefaultRecoveryChecklist(input.workspace.scenario.key);
  const statusTracker: HomeVaultRecoveryStatusTracker = {
    claim: input.statusTracker?.claim ?? 'not_started',
    contractor: input.statusTracker?.contractor ?? 'not_started',
    reimbursement: input.statusTracker?.reimbursement ?? 'not_started',
  };
  const unresolvedReminders = buildRecoveryReminders({
    checklist,
    statusTracker,
    workspace: input.workspace,
  });

  return {
    checklist,
    exportReady:
      unresolvedReminders.length === 0 &&
      (statusTracker.claim === 'resolved' ||
        statusTracker.contractor === 'resolved' ||
        statusTracker.reimbursement === 'resolved'),
    returnToReadyPrompts: buildReturnToReadyPrompts(input.workspace.scenario.key),
    statusTracker,
    unresolvedReminders,
  };
}

export function updateRecoveryChecklistItem(
  checklist: HomeVaultRecoveryChecklistItem[],
  itemId: string,
  status: HomeVaultRecoveryChecklistStatus,
): HomeVaultRecoveryChecklistItem[] {
  return checklist.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status,
        }
      : { ...item },
  );
}

export function formatRecoveryChecklistStatus(status: HomeVaultRecoveryChecklistStatus) {
  switch (status) {
    case 'done':
      return 'Done';
    case 'in_progress':
      return 'In progress';
    case 'blocked':
      return 'Blocked';
    case 'todo':
    default:
      return 'To do';
  }
}

export function formatRecoveryStatusValue(status: HomeVaultRecoveryStatusValue) {
  switch (status) {
    case 'open':
      return 'Open';
    case 'waiting':
      return 'Waiting';
    case 'resolved':
      return 'Resolved';
    case 'not_started':
    default:
      return 'Not started';
  }
}

function appendIncidentEntry(
  workspace: HomeVaultIncidentWorkspace,
  entry: HomeVaultIncidentTimelineEntryInput,
): HomeVaultIncidentWorkspace {
  const nextEntry = {
    ...entry,
    id: `entry-${workspace.timeline.length + 1}`,
  } as HomeVaultIncidentTimelineEntry;
  const timeline = [...workspace.timeline, nextEntry].sort(compareIncidentEntries);
  const latestOccurredAt = timeline[timeline.length - 1]?.occurredAt ?? workspace.updatedAt;

  return {
    ...workspace,
    updatedAt: latestOccurredAt,
    timeline,
  };
}

function buildDefaultRecoveryChecklist(
  scenario: HomeVaultIncidentScenarioKey,
): HomeVaultRecoveryChecklistItem[] {
  const defaults: Record<HomeVaultIncidentScenarioKey, HomeVaultRecoveryChecklistItem[]> = {
    insurance: [
      {
        id: 'repair-estimate',
        category: 'repair',
        label: 'Collect repair estimate',
        detail: 'Keep at least one estimate or scope note tied to the incident evidence.',
        status: 'todo',
      },
      {
        id: 'replacement-list',
        category: 'replacement',
        label: 'List damaged items or systems',
        detail: 'Record what must be replaced before memory fades.',
        status: 'todo',
      },
      {
        id: 'claim-followup',
        category: 'reimbursement',
        label: 'Track claim reimbursement',
        detail: 'Keep payout or deductible follow-up visible until the claim closes.',
        status: 'todo',
      },
      {
        id: 'provider-followup',
        category: 'follow_up',
        label: 'Schedule insurer or contractor follow-up',
        detail: 'Make the next call or inspection date explicit.',
        status: 'todo',
      },
    ],
    utility: [
      {
        id: 'service-repair',
        category: 'repair',
        label: 'Track service repair steps',
        detail: 'Keep outage repair steps and provider commitments visible.',
        status: 'todo',
      },
      {
        id: 'device-replacement',
        category: 'replacement',
        label: 'List any equipment that needs replacement',
        detail: 'Note if routers, modems, or home systems must be swapped.',
        status: 'todo',
      },
      {
        id: 'billing-credit',
        category: 'reimbursement',
        label: 'Request outage credit or reimbursement',
        detail: 'Track any provider credit, refund, or extra-cost reimbursement.',
        status: 'todo',
      },
      {
        id: 'service-followup',
        category: 'follow_up',
        label: 'Confirm service stability',
        detail: 'Set a last check after service returns so the incident really closes.',
        status: 'todo',
      },
    ],
    theft: [
      {
        id: 'security-repair',
        category: 'repair',
        label: 'Repair or secure the affected entry point',
        detail: 'Fix the physical or digital weakness the incident exposed.',
        status: 'todo',
      },
      {
        id: 'device-replacement',
        category: 'replacement',
        label: 'Replace compromised or missing devices',
        detail: 'Track replacements for missing hardware or accounts that must be rebuilt.',
        status: 'todo',
      },
      {
        id: 'fraud-reimbursement',
        category: 'reimbursement',
        label: 'Track reimbursements or credits',
        detail: 'Keep disputed charges, payouts, or reimbursement promises visible.',
        status: 'todo',
      },
      {
        id: 'provider-followup',
        category: 'follow_up',
        label: 'Confirm provider follow-up',
        detail: 'Keep the next bank, carrier, or insurer follow-up from slipping.',
        status: 'todo',
      },
    ],
    property_damage: [
      {
        id: 'stabilize-repairs',
        category: 'repair',
        label: 'Track stabilization and repair work',
        detail: 'Keep dry-out, cleanup, or urgent repair work in one local checklist.',
        status: 'todo',
      },
      {
        id: 'replacement-list',
        category: 'replacement',
        label: 'List damaged belongings or systems',
        detail: 'Keep the replacement scope clear for the recovery tail.',
        status: 'todo',
      },
      {
        id: 'cost-recovery',
        category: 'reimbursement',
        label: 'Track reimbursement or landlord cost recovery',
        detail: 'Record what costs should come back and what is still unresolved.',
        status: 'todo',
      },
      {
        id: 'inspection-followup',
        category: 'follow_up',
        label: 'Schedule the next inspection or contractor step',
        detail: 'Keep the next visit or approval from disappearing into the incident fog.',
        status: 'todo',
      },
    ],
  };

  return defaults[scenario].map((item) => ({ ...item }));
}

function buildRecoveryReminders(input: {
  checklist: HomeVaultRecoveryChecklistItem[];
  statusTracker: HomeVaultRecoveryStatusTracker;
  workspace: HomeVaultIncidentWorkspace;
}) {
  const reminders: string[] = [];
  const openChecklist = input.checklist.filter((item) => item.status !== 'done');

  if (openChecklist.length > 0) {
    reminders.push(
      `${openChecklist.length} recovery checklist item${
        openChecklist.length === 1 ? ' is' : 's are'
      } still unresolved.`,
    );
  }

  if (input.workspace.timeline.filter((entry) => entry.type === 'photo').length === 0) {
    reminders.push('Add at least one photo or evidence entry before recovery details fade.');
  }

  if (input.workspace.timeline.filter((entry) => entry.type === 'contact_interaction').length === 0) {
    reminders.push('Log at least one provider or helper interaction so follow-up does not rely on memory.');
  }

  if (input.statusTracker.claim !== 'resolved' && input.workspace.scenario.key === 'insurance') {
    reminders.push('The claim is not marked resolved yet.');
  }

  if (
    input.statusTracker.contractor !== 'resolved' &&
    (input.workspace.scenario.key === 'property_damage' || input.workspace.scenario.key === 'insurance')
  ) {
    reminders.push('Contractor or repair follow-up is still open.');
  }

  if (input.statusTracker.reimbursement === 'not_started' || input.statusTracker.reimbursement === 'open') {
    reminders.push('Reimbursement or cost recovery still needs review.');
  }

  return reminders;
}

function buildReturnToReadyPrompts(scenario: HomeVaultIncidentScenarioKey) {
  const prompts: Record<HomeVaultIncidentScenarioKey, string[]> = {
    insurance: [
      'Update the emergency packet if the insurer, policy, or deductible details changed during recovery.',
      'Turn any missing-evidence surprise into a readiness task before archiving this workspace.',
    ],
    utility: [
      'Review whether shutoff notes, router details, or provider contacts were missing under pressure.',
      'Convert any outage lesson into a household readiness task before closing the loop.',
    ],
    theft: [
      'Update access, device, or account recovery records that proved stale during the incident.',
      'Create a follow-up readiness task for any authority gap or slow callback path you discovered.',
    ],
    property_damage: [
      'Refresh contractor, policy, and evidence records based on what slowed recovery down.',
      'Turn repair lessons into maintenance or preparedness tasks before you mark the home back to ready.',
    ],
  };

  return [...prompts[scenario]];
}

function compareIncidentEntries(
  left: Pick<HomeVaultIncidentTimelineEntry, 'occurredAt'>,
  right: Pick<HomeVaultIncidentTimelineEntry, 'occurredAt'>,
) {
  return left.occurredAt.localeCompare(right.occurredAt);
}

function getIncidentScenario(key: HomeVaultIncidentScenarioKey) {
  return (
    HOMEVAULT_INCIDENT_SCENARIOS.find((scenario) => scenario.key === key) ??
    HOMEVAULT_INCIDENT_SCENARIOS[0]
  );
}

function toIncidentLinkedRecord(resource: ContinuityPlaybookResource): HomeVaultIncidentLinkedRecord {
  return {
    id: getIncidentLinkedRecordId(resource),
    detail: resource.detail,
    kind: resource.target.kind,
    label: resource.label,
    priority: resource.priority,
    status: resource.status,
  };
}

function getIncidentLinkedRecordId(resource: ContinuityPlaybookResource) {
  switch (resource.target.kind) {
    case 'access':
    case 'account':
    case 'asset':
    case 'contact':
    case 'document':
      return resource.target.id;
    case 'screen':
      return resource.target.screen;
    case 'new_access':
      return `new-access-${resource.target.category}`;
    case 'new_account':
      return `new-account-${resource.target.accountKind}`;
    default:
      return resource.key;
  }
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
