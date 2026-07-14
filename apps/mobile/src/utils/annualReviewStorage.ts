import * as FileSystem from 'expo-file-system/legacy';

export type AnnualReviewState = {
  lastCompletedAt: string | null;
  remindersEnabled: boolean;
};

type StoredAnnualReviewState = Record<string, AnnualReviewState>;

const FILE = `${FileSystem.documentDirectory ?? ''}annual_review_state.json`;

const defaultState: AnnualReviewState = {
  lastCompletedAt: null,
  remindersEnabled: false,
};

export async function readAnnualReviewState(propertyId: string): Promise<AnnualReviewState> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) {
      return defaultState;
    }

    const raw = await FileSystem.readAsStringAsync(FILE);
    const parsed = JSON.parse(raw) as StoredAnnualReviewState;
    const propertyState = parsed[propertyId];

    if (!propertyState || typeof propertyState !== 'object') {
      return defaultState;
    }

    return {
      lastCompletedAt:
        typeof propertyState.lastCompletedAt === 'string' ? propertyState.lastCompletedAt : null,
      remindersEnabled: propertyState.remindersEnabled === true,
    };
  } catch {
    return defaultState;
  }
}

export async function writeAnnualReviewState(
  propertyId: string,
  state: AnnualReviewState,
): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    let existing: StoredAnnualReviewState = {};

    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(FILE);
      existing = JSON.parse(raw) as StoredAnnualReviewState;
    }

    existing[propertyId] = {
      lastCompletedAt: state.lastCompletedAt,
      remindersEnabled: state.remindersEnabled,
    };

    await FileSystem.writeAsStringAsync(FILE, JSON.stringify(existing));
  } catch {
    // Non-fatal.
  }
}
