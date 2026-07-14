jest.mock('expo-file-system/legacy', () => {
  const files = new Map<string, string>();

  return {
    documentDirectory: 'file:///documents/',
    __resetFiles: () => files.clear(),
    getInfoAsync: jest.fn(async (path: string) => ({ exists: files.has(path) })),
    readAsStringAsync: jest.fn(async (path: string) => {
      const value = files.get(path);
      if (value === undefined) throw new Error('missing file');
      return value;
    }),
    writeAsStringAsync: jest.fn(async (path: string, value: string) => {
      files.set(path, value);
    }),
  };
});

import {
  readDrillHistory,
  summarizeDrillHistory,
  writeDrillHistoryEntry,
} from '../../utils/drillHistoryStorage';

const FileSystem = require('expo-file-system/legacy');

describe('drillHistoryStorage', () => {
  beforeEach(() => {
    FileSystem.__resetFiles();
  });

  it('falls back to an empty history when nothing has been saved', async () => {
    await expect(readDrillHistory('property-1')).resolves.toEqual({});
  });

  it('tracks practice count and repeated failures per property', async () => {
    await writeDrillHistoryEntry({
      propertyId: 'property-1',
      guideId: 'guide-home-lockout',
      title: 'Home lockout recovery',
      category: 'handoff',
      completedAt: '2026-07-10T12:00:00.000Z',
      outcome: 'needs_data',
      blockedCount: 0,
      confusingCount: 1,
      missingRecordCount: 1,
      reviewNeededCount: 0,
    });
    await writeDrillHistoryEntry({
      propertyId: 'property-1',
      guideId: 'guide-home-lockout',
      title: 'Home lockout recovery',
      category: 'handoff',
      completedAt: '2026-07-11T12:00:00.000Z',
      outcome: 'blocked',
      blockedCount: 1,
      confusingCount: 0,
      missingRecordCount: 0,
      reviewNeededCount: 0,
    });

    await expect(readDrillHistory('property-1')).resolves.toEqual({
      'guide-home-lockout': expect.objectContaining({
        practiceCount: 2,
        failureStreak: 2,
        lastOutcome: 'blocked',
        lastDrilledAt: '2026-07-11T12:00:00.000Z',
      }),
    });
    await expect(readDrillHistory('property-2')).resolves.toEqual({});
  });

  it('summarizes unpracticed and repeatedly failed drills into prompts', () => {
    const summary = summarizeDrillHistory({
      supportedDrills: [
        { id: 'guide-home-lockout', title: 'Home lockout recovery' },
        { id: 'guide-internet-outage', title: 'Internet outage recovery' },
      ],
      history: {
        'guide-home-lockout': {
          guideId: 'guide-home-lockout',
          title: 'Home lockout recovery',
          category: 'handoff',
          lastDrilledAt: '2026-07-10T12:00:00.000Z',
          lastOutcome: 'blocked',
          practiceCount: 2,
          failureStreak: 2,
          blockedCount: 1,
          confusingCount: 0,
          missingRecordCount: 0,
          reviewNeededCount: 0,
        },
      },
    });

    expect(summary.practicedCount).toBe(1);
    expect(summary.unpracticedCount).toBe(1);
    expect(summary.highPriorityPrompt).toEqual(
      expect.objectContaining({
        guideId: 'guide-home-lockout',
        actionLabel: 'Retry failed drill',
      }),
    );
    expect(summary.prompts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ guideId: 'guide-home-lockout' }),
        expect.objectContaining({ guideId: 'guide-internet-outage', actionLabel: 'Run first drill' }),
      ]),
    );
  });
});
