/**
 * Integration test: HomeVaultContext loads and exposes data from the repository.
 * Uses createMemoryHomeVaultRepository to avoid SQLite.
 */
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { createMemoryHomeVaultRepository } from '@homevault/database';
import { setHomeVaultRepository } from '../../data/localHomeVaultRepository';
import { HomeVaultProvider, useHomeVault } from '../../context/HomeVaultContext';
import { SAMPLE_PROPERTY_ID } from '../../data/homeVaultSampleData';
import { syncTaskNotifications } from '../../utils/notificationUtils';

// Mock expo modules that HomeVaultContext uses at module load time.
jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  setBadgeCountAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock the dynamic import of notificationUtils to avoid --experimental-vm-modules requirement.
jest.mock('../../utils/notificationUtils', () => ({
  requestNotificationPermission: jest.fn().mockResolvedValue(true),
  syncTaskNotifications: jest.fn().mockResolvedValue(undefined),
  clearAllNotifications: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('expo-constants', () => ({
  default: { expoConfig: { version: '1.0.0-test' } },
}));

// Minimal snapshot for the memory repository.
const testSnapshot = {
  properties: [
    {
      id: 'prop-test',
      label: 'Test Home',
      address: '1 Test St',
      purchaseDate: '2020-01-01',
      purchasePriceCents: 300000_00,
      squareFeet: 2000,
    },
  ],
  rooms: [],
  assets: [],
  documents: [],
  tasks: [],
  taskCompletions: [],
  repairEvents: [],
  parts: [],
};

function DataProbe() {
  const { appData, loadError } = useHomeVault();
  if (loadError) return <Text testID="load-error">load error</Text>;
  if (!appData) return <Text testID="loading">loading</Text>;
  return <Text testID="property-label">{appData.property.label}</Text>;
}

describe('HomeVaultContext integration', () => {
  beforeEach(() => {
    const repo = createMemoryHomeVaultRepository(testSnapshot);
    setHomeVaultRepository(repo);
  });

  it('loads property data from the repository', async () => {
    const { getByTestId } = await render(
      <HomeVaultProvider>
        <DataProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('property-label')).toBeTruthy());
    expect(getByTestId('property-label').props.children).toBe('Test Home');
  });

  it('shows load error when repository fails', async () => {
    const failingRepo = {
      ...createMemoryHomeVaultRepository(testSnapshot),
      getProperties: () => Promise.reject(new Error('DB failure')),
    };
    setHomeVaultRepository(failingRepo);

    const { getByTestId } = await render(
      <HomeVaultProvider>
        <DataProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('load-error')).toBeTruthy());
  });

  it('reloads data after a mutation', async () => {
    const repo = createMemoryHomeVaultRepository(testSnapshot);
    setHomeVaultRepository(repo);

    let triggerReload: (() => Promise<void>) | null = null;

    function ReloadProbe() {
      const { appData, reload } = useHomeVault();
      triggerReload = reload;
      if (!appData) return <Text testID="loading">loading</Text>;
      return <Text testID="task-count">{appData.tasks.length}</Text>;
    }

    const { getByTestId } = await render(
      <HomeVaultProvider>
        <ReloadProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('task-count')).toBeTruthy());
    expect(getByTestId('task-count').props.children).toBe(0);

    // Add a task to the repo and reload.
    await repo.createTask({
      propertyId: 'prop-test',
      scope: 'property',
      scopeId: 'prop-test',
      title: 'New task',
      dueDate: '2026-12-01',
      recurrenceKind: 'one_time',
      recurrenceLabel: 'One time',
      state: 'upcoming',
    });

    await act(async () => {
      await triggerReload!();
    });

    await waitFor(() => expect(getByTestId('task-count').props.children).toBe(1));
  });

  it('does not call syncTaskNotifications when loading sample data', async () => {
    const sampleSnapshot = {
      properties: [
        {
          id: SAMPLE_PROPERTY_ID,
          label: 'Sample Home',
          address: '123 Sample St',
          purchaseDate: '2020-01-01',
          purchasePriceCents: 0,
          squareFeet: 0,
        },
      ],
      rooms: [],
      assets: [],
      documents: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    };
    const repo = createMemoryHomeVaultRepository(sampleSnapshot);
    await repo.createTask({
      propertyId: SAMPLE_PROPERTY_ID,
      scope: 'property',
      scopeId: SAMPLE_PROPERTY_ID,
      title: 'Sample task',
      dueDate: '2027-01-01',
      recurrenceKind: 'one_time',
      recurrenceLabel: 'One time',
      state: 'upcoming',
    });
    setHomeVaultRepository(repo);

    (syncTaskNotifications as jest.Mock).mockClear();

    const { getByTestId } = await render(
      <HomeVaultProvider>
        <DataProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('property-label')).toBeTruthy());
    expect(syncTaskNotifications as jest.Mock).not.toHaveBeenCalled();
  });
});
