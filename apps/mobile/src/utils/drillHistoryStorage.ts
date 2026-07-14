import * as FileSystem from 'expo-file-system/legacy';

export type DrillOutcome = 'pass' | 'pass_with_follow_up' | 'needs_data' | 'blocked';

export type DrillHistoryEntry = {
  guideId: string;
  title: string;
  category: string;
  lastDrilledAt: string;
  lastOutcome: DrillOutcome;
  practiceCount: number;
  failureStreak: number;
  blockedCount: number;
  confusingCount: number;
  missingRecordCount: number;
  reviewNeededCount: number;
};

export type DrillPracticePrompt = {
  guideId: string;
  title: string;
  actionLabel: string;
  detail: string;
  priority: 'high' | 'medium';
};

type StoredDrillHistory = Record<string, Record<string, DrillHistoryEntry>>;

type WriteDrillHistoryInput = {
  propertyId: string;
  guideId: string;
  title: string;
  category: string;
  completedAt: string;
  outcome: DrillOutcome;
  blockedCount: number;
  confusingCount: number;
  missingRecordCount: number;
  reviewNeededCount: number;
};

const FILE = `${FileSystem.documentDirectory ?? ''}drill_history_state.json`;

export async function readDrillHistory(
  propertyId: string,
): Promise<Record<string, DrillHistoryEntry>> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) {
      return {};
    }

    const raw = await FileSystem.readAsStringAsync(FILE);
    const parsed = JSON.parse(raw) as StoredDrillHistory;
    const propertyState = parsed[propertyId];

    if (!propertyState || typeof propertyState !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(propertyState).filter((entry): entry is [string, DrillHistoryEntry] => {
        const value = entry[1];

        return (
          Boolean(value) &&
          typeof value === 'object' &&
          typeof value.guideId === 'string' &&
          typeof value.title === 'string' &&
          typeof value.category === 'string' &&
          typeof value.lastDrilledAt === 'string' &&
          typeof value.lastOutcome === 'string'
        );
      }),
    );
  } catch {
    return {};
  }
}

export async function writeDrillHistoryEntry(input: WriteDrillHistoryInput): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    let existing: StoredDrillHistory = {};

    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(FILE);
      existing = JSON.parse(raw) as StoredDrillHistory;
    }

    const propertyHistory = existing[input.propertyId] ?? {};
    const previousEntry = propertyHistory[input.guideId];
    const nextEntry: DrillHistoryEntry = {
      guideId: input.guideId,
      title: input.title,
      category: input.category,
      lastDrilledAt: input.completedAt,
      lastOutcome: input.outcome,
      practiceCount: (previousEntry?.practiceCount ?? 0) + 1,
      failureStreak:
        input.outcome === 'blocked' || input.outcome === 'needs_data'
          ? (previousEntry?.failureStreak ?? 0) + 1
          : 0,
      blockedCount: input.blockedCount,
      confusingCount: input.confusingCount,
      missingRecordCount: input.missingRecordCount,
      reviewNeededCount: input.reviewNeededCount,
    };

    existing[input.propertyId] = {
      ...propertyHistory,
      [input.guideId]: nextEntry,
    };

    await FileSystem.writeAsStringAsync(FILE, JSON.stringify(existing));
  } catch {
    // Non-fatal.
  }
}

export function summarizeDrillHistory({
  supportedDrills,
  history,
}: {
  supportedDrills: Array<{ id: string; title: string }>;
  history: Record<string, DrillHistoryEntry>;
}) {
  const prompts: DrillPracticePrompt[] = [];
  let practicedCount = 0;

  for (const drill of supportedDrills) {
    const entry = history[drill.id];

    if (!entry) {
      prompts.push({
        guideId: drill.id,
        title: drill.title,
        actionLabel: 'Run first drill',
        detail: `${drill.title} has never been practiced.`,
        priority: 'high',
      });
      continue;
    }

    practicedCount += 1;

    if (entry.failureStreak >= 2) {
      prompts.push({
        guideId: drill.id,
        title: drill.title,
        actionLabel: 'Retry failed drill',
        detail: `${drill.title} has failed ${entry.failureStreak} drills in a row.`,
        priority: 'high',
      });
      continue;
    }

    if (entry.lastOutcome === 'blocked' || entry.lastOutcome === 'needs_data') {
      prompts.push({
        guideId: drill.id,
        title: drill.title,
        actionLabel: 'Re-test drill',
        detail: `${drill.title} last ended as ${formatOutcomeLabel(entry.lastOutcome).toLowerCase()}.`,
        priority: 'medium',
      });
    }
  }

  const highPriorityPrompt = prompts.find((prompt) => prompt.priority === 'high') ?? prompts[0] ?? null;

  return {
    totalSupportedCount: supportedDrills.length,
    practicedCount,
    unpracticedCount: supportedDrills.length - practicedCount,
    prompts,
    highPriorityPrompt,
  };
}

export function formatOutcomeLabel(outcome: DrillOutcome) {
  switch (outcome) {
    case 'blocked':
      return 'Blocked';
    case 'needs_data':
      return 'Needs data';
    case 'pass_with_follow_up':
      return 'Pass with follow-up';
    case 'pass':
    default:
      return 'Pass';
  }
}
