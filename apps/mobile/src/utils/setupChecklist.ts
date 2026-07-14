import * as FileSystem from 'expo-file-system/legacy';
import type {
  AccessItem,
  Asset,
  EmergencyContact,
  ImportantAccount,
} from '@homevault/domain';
import { mapAssetToContinuitySection } from '@homevault/domain';

export type SetupChecklistStep = {
  key: 'wifi' | 'access' | 'insurance' | 'emergency' | 'device';
  label: string;
  hint: string;
  route: string;
};

export type SetupChecklistProgressInput = {
  accessItems: Pick<AccessItem, 'category'>[];
  assets: Pick<Asset, 'category' | 'name'>[];
  emergencyContacts: Pick<EmergencyContact, 'id'>[];
  importantAccounts: Pick<ImportantAccount, 'kind'>[];
};

export const SETUP_CHECKLIST_STEPS: SetupChecklistStep[] = [
  {
    key: 'wifi',
    label: 'Save Wi-Fi details',
    hint: 'SSID, password, and where to restart it.',
    route: '/readiness-setup?step=wifi',
  },
  {
    key: 'access',
    label: 'Save an access code',
    hint: 'Garage, alarm, shutoff, keybox, or entry note.',
    route: '/readiness-setup?step=access',
  },
  {
    key: 'insurance',
    label: 'Add an insurance account',
    hint: 'Policy provider, number, and recovery notes.',
    route: '/readiness-setup?step=insurance',
  },
  {
    key: 'emergency',
    label: 'Add an emergency contact',
    hint: 'The person or service provider someone should call first.',
    route: '/readiness-setup?step=emergency',
  },
  {
    key: 'device',
    label: 'Add a router or critical device',
    hint: 'The equipment a helper would need to find fast.',
    route: '/readiness-setup?step=device',
  },
];

const DISMISSED_FILE = `${FileSystem.documentDirectory ?? ''}setup_checklist_dismissed`;

export function getSetupChecklistProgress(input: SetupChecklistProgressInput) {
  const done = new Set<string>();
  const nonWifiAccess = input.accessItems.some((item) => item.category !== 'wifi');
  const hasDevice = input.assets.some((asset) => mapAssetToContinuitySection(asset) === 'devices');

  if (input.accessItems.some((item) => item.category === 'wifi')) done.add('wifi');
  if (nonWifiAccess) done.add('access');
  if (input.importantAccounts.some((account) => account.kind === 'insurance')) done.add('insurance');
  if (input.emergencyContacts.length > 0) done.add('emergency');
  if (hasDevice) done.add('device');

  const incomplete = SETUP_CHECKLIST_STEPS.filter((step) => !done.has(step.key));

  return {
    done,
    doneCount: done.size,
    incomplete,
    next: incomplete[0] ?? null,
    total: SETUP_CHECKLIST_STEPS.length,
  };
}

export async function readSetupChecklistDismissed(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(DISMISSED_FILE);
    return info.exists;
  } catch {
    return false;
  }
}

export async function dismissSetupChecklist(): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(DISMISSED_FILE, '1');
  } catch {
    // Non-fatal.
  }
}

export async function restoreSetupChecklist(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(DISMISSED_FILE);
    if (info.exists) {
      await FileSystem.deleteAsync(DISMISSED_FILE);
    }
  } catch {
    // Non-fatal.
  }
}
