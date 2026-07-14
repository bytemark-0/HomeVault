import {
  isDeviceAsset,
  isRouterAsset,
  type AccessItem,
  type ContinuityPlaybook,
  type EmergencyContact,
  type ImportantAccount,
  type Property,
} from '@homevault/domain';

import type { AssetListItem, DocumentListItem } from '../data/homeVaultSampleData';
import {
  buildContinuityPlaybookGuides,
  type ContinuityPlaybookGuide,
  type ContinuityPlaybookResource,
} from './continuityPlaybooks';

export type SeasonalReadinessTrackKey =
  | 'storm_season'
  | 'wildfire_smoke'
  | 'winter_freeze'
  | 'summer_travel';

export type SeasonalReadinessTrackTiming = 'active_now' | 'coming_soon' | 'off_season';

export type SeasonalReadinessTrackReadiness = 'ready' | 'needs_attention' | 'not_prepared';
export type SeasonalReadinessTrackMode = 'prep_window' | 'incident_active';

export type SeasonalReadinessRouteTarget =
  | string
  | {
      pathname: string;
      params?: Record<string, string>;
    };

export type SeasonalReadinessChecklistItem = {
  key: string;
  label: string;
  detail: string;
  priority: 'required' | 'recommended';
  status: 'ready' | 'missing';
};

export type SeasonalReadinessTrack = {
  actionLabel: string;
  checklist: SeasonalReadinessChecklistItem[];
  key: SeasonalReadinessTrackKey;
  label: string;
  linkedPlaybookIds: string[];
  mode: SeasonalReadinessTrackMode;
  modeLabel: string;
  readiness: SeasonalReadinessTrackReadiness;
  readinessLabel: string;
  route: SeasonalReadinessRouteTarget;
  seasonLabel: string;
  summary: string;
  timing: SeasonalReadinessTrackTiming;
  timingLabel: string;
};

type BuildSeasonalReadinessTracksInput = {
  property: Property;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  accessItems: AccessItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  continuityPlaybooks: ContinuityPlaybook[];
  now?: Date;
};

export function buildSeasonalReadinessTracks({
  property,
  assets,
  documents,
  accessItems,
  emergencyContacts,
  importantAccounts,
  continuityPlaybooks,
  now = new Date(),
}: BuildSeasonalReadinessTracksInput): SeasonalReadinessTrack[] {
  const playbooks = buildContinuityPlaybookGuides({
    property,
    assets,
    documents,
    accessItems,
    emergencyContacts,
    importantAccounts,
    continuityPlaybooks,
  });
  const playbookById = new Map(playbooks.map((playbook) => [playbook.id, playbook]));
  const travelGuide = playbookById.get('guide-travel-handoff');
  const stormGuide = playbookById.get('guide-storm-prep');
  const evacuationGuide = playbookById.get('guide-evacuation-ready');
  const trustedContact =
    emergencyContacts.find((contact) => contact.priority === 'primary') ?? emergencyContacts[0];
  const utilityAccount =
    importantAccounts.find((account) => account.kind === 'utility') ??
    importantAccounts.find((account) => account.kind === 'internet');
  const utilityShutoffAccess = accessItems.find((item) => item.category === 'utility_shutoff');
  const freezeDevice = assets.find(
    (asset) =>
      isRouterAsset(asset) ||
      isDeviceAsset(asset) ||
      /furnace|hvac|thermostat|boiler|heater/i.test(asset.category) ||
      /furnace|hvac|thermostat|boiler|heater/i.test(asset.name),
  );
  const smokeDevice = assets.find(
    (asset) =>
      /purifier|hvac|furnace|thermostat|fan/i.test(asset.category) ||
      /purifier|hvac|furnace|thermostat|fan/i.test(asset.name),
  );
  const smokeDocument = documents.find((document) =>
    /smoke|air quality|filter|hvac|furnace|purifier/i.test(document.title),
  );
  const currentMonth = now.getMonth() + 1;
  const hasActiveStormIncident = continuityPlaybooks.some(
    (playbook) => playbook.category === 'storm' && playbook.state === 'in_progress',
  );
  const hasActiveTravelIncident = continuityPlaybooks.some(
    (playbook) =>
      (playbook.category === 'travel' || playbook.category === 'handoff') &&
      playbook.state === 'in_progress',
  );

  return [
    buildSeasonalTrack({
      actionLabel: 'Open storm checklist',
      checklist: compactChecklistItems([
        getGuideChecklistItem(stormGuide, 'storm_insurance'),
        getGuideChecklistItem(stormGuide, 'storm_shutoff'),
        getGuideChecklistItem(stormGuide, 'storm_contact'),
        getGuideChecklistItem(stormGuide, 'storm_packet'),
      ]),
      key: 'storm_season',
      label: 'Storm season',
      linkedPlaybookIds: ['guide-storm-prep', 'guide-evacuation-ready'],
      mode: hasActiveStormIncident ? 'incident_active' : 'prep_window',
      route: '/playbook/guide-storm-prep',
      seasonLabel: 'Severe weather and outage prep',
      timing: getSeasonalTiming(currentMonth, [5, 6, 7, 8, 9, 10], [3, 4]),
    }),
    buildSeasonalTrack({
      actionLabel: 'Open smoke prep',
      checklist: compactChecklistItems([
        getGuideChecklistItem(evacuationGuide, 'evac_contact'),
        getGuideChecklistItem(evacuationGuide, 'evac_document'),
        getGuideChecklistItem(evacuationGuide, 'evac_packet'),
        smokeDevice
          ? {
              detail: `Review ${smokeDevice.name} before air quality drops.`,
              key: 'smoke_device',
              label: smokeDevice.name,
              priority: 'required',
              status: 'ready',
            }
          : {
              detail: 'Track one HVAC, purifier, or air-movement device before smoke season.',
              key: 'smoke_device',
              label: 'HVAC or air-quality device',
              priority: 'required',
              status: 'missing',
            },
        smokeDocument
          ? {
              detail: 'Keep the filter or air-quality reference easy to open.',
              key: 'smoke_document',
              label: smokeDocument.title,
              priority: 'recommended',
              status: 'ready',
            }
          : {
              detail: 'Add one filter, purifier, or HVAC reference if smoke affects your area.',
              key: 'smoke_document',
              label: 'Filter or purifier reference',
              priority: 'recommended',
              status: 'missing',
            },
      ]),
      key: 'wildfire_smoke',
      label: 'Wildfire smoke',
      linkedPlaybookIds: ['guide-evacuation-ready'],
      mode: hasActiveStormIncident ? 'incident_active' : 'prep_window',
      route: '/playbook/guide-evacuation-ready',
      seasonLabel: 'Air-quality disruption prep',
      timing: getSeasonalTiming(currentMonth, [6, 7, 8, 9], [4, 5]),
    }),
    buildSeasonalTrack({
      actionLabel: 'Open freeze prep',
      checklist: compactChecklistItems([
        utilityShutoffAccess
          ? {
              detail: utilityShutoffAccess.location ?? 'Saved shutoff instructions are ready.',
              key: 'freeze_shutoff',
              label: utilityShutoffAccess.label,
              priority: 'required',
              status: 'ready',
            }
          : {
              detail: 'Save the main shutoff location before the next freeze or burst-pipe scare.',
              key: 'freeze_shutoff',
              label: 'Utility shutoff note',
              priority: 'required',
              status: 'missing',
            },
        utilityAccount
          ? {
              detail: `Use ${utilityAccount.providerName} if power, water, or internet service is interrupted.`,
              key: 'freeze_utility',
              label: utilityAccount.label,
              priority: 'required',
              status: 'ready',
            }
          : {
              detail: 'Add the utility or internet account before winter outages force a callback hunt.',
              key: 'freeze_utility',
              label: 'Utility or internet account',
              priority: 'required',
              status: 'missing',
            },
        trustedContact
          ? {
              detail: `${trustedContact.role} can help if heat, water, or access problems escalate.`,
              key: 'freeze_contact',
              label: trustedContact.name,
              priority: 'required',
              status: 'ready',
            }
          : {
              detail: 'Add one trusted contact who can check the home or talk through a freeze emergency.',
              key: 'freeze_contact',
              label: 'Trusted contact',
              priority: 'required',
              status: 'missing',
            },
        freezeDevice
          ? {
              detail: `Review ${freezeDevice.name} before cold weather exposes equipment gaps.`,
              key: 'freeze_device',
              label: freezeDevice.name,
              priority: 'recommended',
              status: 'ready',
            }
          : {
              detail: 'Track the router, thermostat, or heating system that matters most in a freeze.',
              key: 'freeze_device',
              label: 'Critical device or heating system',
              priority: 'recommended',
              status: 'missing',
            },
      ]),
      key: 'winter_freeze',
      label: 'Winter freeze',
      linkedPlaybookIds: ['guide-storm-prep'],
      mode: hasActiveStormIncident ? 'incident_active' : 'prep_window',
      route: '/playbook/guide-storm-prep',
      seasonLabel: 'Cold-weather continuity prep',
      timing: getSeasonalTiming(currentMonth, [11, 12, 1, 2], [9, 10]),
    }),
    buildSeasonalTrack({
      actionLabel: 'Open travel handoff',
      checklist: compactChecklistItems([
        getGuideChecklistItem(travelGuide, 'travel_access'),
        getGuideChecklistItem(travelGuide, 'travel_shutoff'),
        getGuideChecklistItem(travelGuide, 'travel_contact'),
        getGuideChecklistItem(travelGuide, 'travel_handoff'),
      ]),
      key: 'summer_travel',
      label: 'Summer travel',
      linkedPlaybookIds: ['guide-travel-handoff', 'guide-house-sitter-handoff'],
      mode: hasActiveTravelIncident ? 'incident_active' : 'prep_window',
      route: '/playbook/guide-travel-handoff',
      seasonLabel: 'Away-from-home handoff prep',
      timing: getSeasonalTiming(currentMonth, [5, 6, 7, 8], [4]),
    }),
  ];
}

export function formatSeasonalTrackTiming(timing: SeasonalReadinessTrackTiming) {
  switch (timing) {
    case 'active_now':
      return 'In season now';
    case 'coming_soon':
      return 'Coming soon';
    case 'off_season':
    default:
      return 'Off season';
  }
}

export function formatSeasonalTrackMode(mode: SeasonalReadinessTrackMode) {
  return mode === 'incident_active' ? 'Incident active' : 'Prep window';
}

function buildSeasonalTrack({
  actionLabel,
  checklist,
  key,
  label,
  linkedPlaybookIds,
  mode,
  route,
  seasonLabel,
  timing,
}: {
  actionLabel: string;
  checklist: SeasonalReadinessChecklistItem[];
  key: SeasonalReadinessTrackKey;
  label: string;
  linkedPlaybookIds: string[];
  mode: SeasonalReadinessTrackMode;
  route: SeasonalReadinessRouteTarget;
  seasonLabel: string;
  timing: SeasonalReadinessTrackTiming;
}): SeasonalReadinessTrack {
  const requiredItems = checklist.filter((item) => item.priority === 'required');
  const readyRequiredCount = requiredItems.filter((item) => item.status === 'ready').length;
  const readiness: SeasonalReadinessTrackReadiness =
    readyRequiredCount === requiredItems.length
      ? 'ready'
      : readyRequiredCount > 0
        ? 'needs_attention'
        : 'not_prepared';

  return {
    actionLabel,
    checklist,
    key,
    label,
    linkedPlaybookIds,
    mode,
    modeLabel: formatSeasonalTrackMode(mode),
    readiness,
    readinessLabel:
      readiness === 'ready'
        ? 'Ready'
        : readiness === 'needs_attention'
          ? 'Needs review'
          : 'Not prepared',
    route,
    seasonLabel,
    summary: buildSeasonalTrackSummary(
      label,
      timing,
      mode,
      readiness,
      requiredItems.length - readyRequiredCount,
    ),
    timing,
    timingLabel: formatSeasonalTrackTiming(timing),
  };
}

function buildSeasonalTrackSummary(
  label: string,
  timing: SeasonalReadinessTrackTiming,
  mode: SeasonalReadinessTrackMode,
  readiness: SeasonalReadinessTrackReadiness,
  missingRequiredCount: number,
) {
  if (mode === 'incident_active') {
    if (readiness === 'ready') {
      return `${label} looks active right now. The linked records are ready, so switch from seasonal prep into the incident playbook.`;
    }

    return `${label} looks active right now and still has ${formatChecklistGapCount(missingRequiredCount)}. Focus on the playbook instead of treating this like routine prep.`;
  }

  if (timing === 'active_now') {
    if (readiness === 'ready') {
      return `${label} is active now and the core records are already in place.`;
    }

    return `${label} is active now and still missing ${formatChecklistGapCount(missingRequiredCount)}.`;
  }

  if (timing === 'coming_soon') {
    if (readiness === 'ready') {
      return `${label} is coming soon and the main handoff basics are already covered.`;
    }

    return `${label} is coming soon. Close ${formatChecklistGapCount(missingRequiredCount)} before it arrives.`;
  }

  if (readiness === 'ready') {
    return `The next ${label.toLowerCase()} cycle already has the core prep records saved.`;
  }

  return `Use the off-season window to close ${formatChecklistGapCount(missingRequiredCount)} before ${label.toLowerCase()} comes back around.`;
}

function formatChecklistGapCount(count: number) {
  return `${count} key gap${count === 1 ? '' : 's'}`;
}

function getSeasonalTiming(
  currentMonth: number,
  activeMonths: number[],
  comingSoonMonths: number[],
): SeasonalReadinessTrackTiming {
  if (activeMonths.includes(currentMonth)) {
    return 'active_now';
  }

  if (comingSoonMonths.includes(currentMonth)) {
    return 'coming_soon';
  }

  return 'off_season';
}

function getGuideChecklistItem(
  guide: ContinuityPlaybookGuide | undefined,
  resourceKey: string,
): SeasonalReadinessChecklistItem | null {
  if (!guide) {
    return null;
  }

  const resource = [...guide.readyRecords, ...guide.missingRecords].find(
    (candidate) => candidate.key === resourceKey,
  );

  if (!resource) {
    return null;
  }

  return toChecklistItem(resource);
}

function toChecklistItem(
  resource: ContinuityPlaybookResource,
): SeasonalReadinessChecklistItem {
  return {
    detail: resource.detail,
    key: resource.key,
    label: resource.label,
    priority: resource.priority,
    status: resource.status,
  };
}

function compactChecklistItems(
  items: Array<SeasonalReadinessChecklistItem | null>,
): SeasonalReadinessChecklistItem[] {
  return items.filter((item): item is SeasonalReadinessChecklistItem => Boolean(item));
}
