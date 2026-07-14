jest.mock('expo-file-system/legacy', () => {
  const files = new Map<string, string>();

  return {
    documentDirectory: 'file:///documents/',
    __resetFiles: () => files.clear(),
    __setFile: (path: string, value: string) => files.set(path, value),
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

import { readAnnualReviewState, writeAnnualReviewState } from '../../utils/annualReviewStorage';

const FileSystem = require('expo-file-system/legacy');

describe('annualReviewStorage', () => {
  beforeEach(() => {
    FileSystem.__resetFiles();
  });

  it('falls back to a safe default when no state exists', async () => {
    await expect(readAnnualReviewState('property-1')).resolves.toEqual({
      lastCompletedAt: null,
      remindersEnabled: false,
    });
  });

  it('round-trips annual review state per property', async () => {
    await writeAnnualReviewState('property-1', {
      lastCompletedAt: '2026-07-08T12:00:00.000Z',
      remindersEnabled: true,
    });

    await expect(readAnnualReviewState('property-1')).resolves.toEqual({
      lastCompletedAt: '2026-07-08T12:00:00.000Z',
      remindersEnabled: true,
    });
    await expect(readAnnualReviewState('property-2')).resolves.toEqual({
      lastCompletedAt: null,
      remindersEnabled: false,
    });
  });
});
