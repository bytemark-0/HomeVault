import * as FileSystem from 'expo-file-system/legacy';

export type SetupChecklistStep = {
  key: string;
  label: string;
  hint: string;
  route: string;
};

export type SetupChecklistProgressInput = {
  assetCount: number;
  backupCreated: boolean;
  documentCount: number;
  hasPropertyPhoto: boolean;
  roomCount: number;
  taskCount: number;
};

export const SETUP_CHECKLIST_STEPS: SetupChecklistStep[] = [
  {
    key: 'room',
    label: 'Add a room or area',
    hint: 'Kitchen, garage, basement, roof…',
    route: '/room/new',
  },
  {
    key: 'asset',
    label: 'Add an appliance or system',
    hint: 'Dishwasher, HVAC, water heater…',
    route: '/asset/new',
  },
  {
    key: 'task',
    label: 'Add a maintenance reminder',
    hint: 'Filter changes, seasonal checks…',
    route: '/task/new',
  },
  {
    key: 'document',
    label: 'Save a document',
    hint: 'Manuals, warranties, receipts…',
    route: '/document/new',
  },
  {
    key: 'photo',
    label: 'Add a property photo',
    hint: 'Makes your vault feel personal.',
    route: '/property/edit',
  },
  {
    key: 'backup',
    label: 'Create a backup',
    hint: 'Keep a copy of your home records.',
    route: '/(tabs)/household',
  },
];

const DISMISSED_FILE = `${FileSystem.documentDirectory ?? ''}setup_checklist_dismissed`;

export function getSetupChecklistProgress(input: SetupChecklistProgressInput) {
  const done = new Set<string>();

  if (input.roomCount > 0) done.add('room');
  if (input.assetCount > 0) done.add('asset');
  if (input.taskCount > 0) done.add('task');
  if (input.documentCount > 0) done.add('document');
  if (input.hasPropertyPhoto) done.add('photo');
  if (input.backupCreated) done.add('backup');

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
