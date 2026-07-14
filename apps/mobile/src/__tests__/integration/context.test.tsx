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
import { EmergencyScreen } from '../../screens/EmergencyScreen';
import { clearAllNotifications, syncTaskNotifications } from '../../utils/notificationUtils';

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
  accessItems: [],
  emergencyContacts: [],
  importantAccounts: [],
  continuityPlaybooks: [],
  tasks: [],
  taskCompletions: [],
  repairEvents: [],
  parts: [],
};

function DataProbe() {
  const { appData, isNewUser, loadError } = useHomeVault();
  if (loadError) return <Text testID="load-error">load error</Text>;
  if (isNewUser) return <Text testID="new-user">new user</Text>;
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

  it('exposes new-user state when the repository has no properties', async () => {
    const emptyRepo = createMemoryHomeVaultRepository({
      properties: [],
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });
    setHomeVaultRepository(emptyRepo);

    const { getByTestId } = await render(
      <HomeVaultProvider>
        <DataProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('new-user')).toBeTruthy());
  });

  it('loads the newly created home when onboarding finishes', async () => {
    const emptyRepo = createMemoryHomeVaultRepository({
      properties: [],
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });
    setHomeVaultRepository(emptyRepo);

    let finishOnboarding: (() => Promise<void>) | null = null;

    function FinishOnboardingProbe() {
      const context = useHomeVault();
      finishOnboarding = context.finishOnboarding;

      if (context.isNewUser) return <Text testID="new-user">new user</Text>;
      if (!context.appData) return <Text testID="loading">loading</Text>;
      return <Text testID="property-label">{context.appData.property.label}</Text>;
    }

    const { getByTestId } = await render(
      <HomeVaultProvider>
        <FinishOnboardingProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('new-user')).toBeTruthy());

    await emptyRepo.createProperty({ label: 'Oak Street home', type: 'single_family' });

    await act(async () => {
      if (!finishOnboarding) {
        throw new Error('finishOnboarding was not provided by HomeVaultContext.');
      }

      await finishOnboarding();
    });

    await waitFor(() => expect(getByTestId('property-label')).toBeTruthy());
    expect(getByTestId('property-label').props.children).toBe('Oak Street home');
  });

  it('takes a clean-install household from onboarding into a usable empty Emergency view', async () => {
    const emptyRepo = createMemoryHomeVaultRepository({
      properties: [],
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });
    setHomeVaultRepository(emptyRepo);

    let finishOnboarding: (() => Promise<void>) | null = null;

    function EmergencyProbe() {
      const context = useHomeVault();
      finishOnboarding = context.finishOnboarding;

      if (context.isNewUser) return <Text testID="new-user">new user</Text>;
      if (!context.appData) return <Text testID="loading">loading</Text>;

      return (
        <EmergencyScreen
          accessItems={context.appData.accessItems}
          assets={context.appData.assets}
          documents={context.appData.documents}
          emergencyContacts={context.appData.emergencyContacts}
          importantAccounts={context.appData.importantAccounts}
          continuityPlaybooks={context.appData.continuityPlaybooks}
          propertyId={context.appData.property.id}
          propertyLabel={context.appData.property.label}
          onAddEmergencyContact={jest.fn()}
          onAddImportantAccount={jest.fn()}
          onOpenAccessArea={jest.fn()}
          onOpenAccessItem={jest.fn()}
          onOpenAsset={jest.fn()}
          onOpenDevices={jest.fn()}
          onOpenDocumentArea={jest.fn()}
          onOpenDocument={jest.fn()}
          onOpenEmergencyContact={jest.fn()}
          onOpenEmergencyContacts={jest.fn()}
          onOpenExport={jest.fn()}
          onOpenHousehold={jest.fn()}
          onOpenImportantAccount={jest.fn()}
          onOpenPlaybook={jest.fn()}
          onOpenShareHub={jest.fn()}
          onOpenTrustedHandoff={jest.fn()}
          onShareImportantAccount={jest.fn()}
        />
      );
    }

    const view = await render(
      <HomeVaultProvider>
        <EmergencyProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(view.getByTestId('new-user')).toBeTruthy());

    await emptyRepo.createProperty({ label: 'Oak Street home', type: 'single_family' });

    await act(async () => {
      if (!finishOnboarding) {
        throw new Error('finishOnboarding was not provided by HomeVaultContext.');
      }

      await finishOnboarding();
    });

    await waitFor(() => expect(view.getByText('Who to call and what to hand off')).toBeTruthy());
    expect(view.getByText('0 of 6 emergency essentials ready')).toBeTruthy();
    expect(view.getByText('Add the first trusted contact')).toBeTruthy();
    expect(view.getByText('Open full emergency packet')).toBeTruthy();
  });

  it('loads upgraded-install emergency-plan records into a mature Emergency view', async () => {
    const upgradedRepo = createMemoryHomeVaultRepository({
      properties: [
        {
          id: 'prop-upgrade',
          householdId: 'household-upgrade',
          label: 'Oak Street home',
          type: 'single_family',
        },
      ],
      rooms: [],
      assets: [
        {
          id: 'asset-router',
          propertyId: 'prop-upgrade',
          name: 'Main router',
          category: 'Networking',
          status: 'ready',
          networkName: 'OakStreet-5G',
          internetProvider: 'FiberFast',
          backupEnabled: true,
          screenLockEnabled: true,
          findMyDeviceEnabled: true,
          lastReviewedAt: '2026-07-01',
        },
      ],
      documents: [
        {
          id: 'document-policy',
          propertyId: 'prop-upgrade',
          title: 'Prairie Mutual home policy',
          type: 'insurance',
          linkedRecordIds: ['prop-upgrade'],
          date: '2026-07-01',
        },
        {
          id: 'document-router',
          propertyId: 'prop-upgrade',
          title: 'Router quick start',
          type: 'manual',
          linkedRecordIds: ['asset-router'],
          date: '2026-07-01',
        },
      ],
      accessItems: [
        {
          id: 'access-wifi',
          propertyId: 'prop-upgrade',
          category: 'wifi',
          label: 'Main Wi-Fi',
          username: 'OakStreet-5G',
          accessCode: '9274',
          linkedAssetId: 'asset-router',
          linkedDocumentIds: ['document-router'],
          lastReviewedAt: '2026-07-01',
        },
      ],
      emergencyContacts: [
        {
          id: 'contact-1',
          propertyId: 'prop-upgrade',
          name: 'Jamie Lee',
          role: 'Neighbor with spare key',
          priority: 'primary',
          phone: '555-0101',
          lastReviewedAt: '2026-07-01',
        },
      ],
      importantAccounts: [
        {
          id: 'account-insurance',
          propertyId: 'prop-upgrade',
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          phone: '555-0119',
          managerRole: 'self',
          linkedDocumentIds: ['document-policy'],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-email',
          propertyId: 'prop-upgrade',
          kind: 'email',
          providerName: 'Google',
          label: 'Primary email',
          mfaEnabled: true,
          recoveryCodesStored: true,
          managedInPasswordManager: true,
          recoveryNotes: 'Backup codes are stored in the fire safe.',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
      ],
      continuityPlaybooks: [
        {
          id: 'playbook-1',
          propertyId: 'prop-upgrade',
          category: 'storm',
          title: 'Storm outage restart',
          state: 'ready',
          steps: [{ id: 'step-1', label: 'Check router lights', isRequired: true, isComplete: true }],
          linkedRecordIds: ['asset-router', 'account-insurance'],
        },
      ],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });
    setHomeVaultRepository(upgradedRepo);

    function UpgradedEmergencyProbe() {
      const context = useHomeVault();
      if (context.isNewUser) return <Text testID="new-user">new user</Text>;
      if (!context.appData) return <Text testID="loading">loading</Text>;

      return (
        <EmergencyScreen
          accessItems={context.appData.accessItems}
          assets={context.appData.assets}
          documents={context.appData.documents}
          emergencyContacts={context.appData.emergencyContacts}
          importantAccounts={context.appData.importantAccounts}
          continuityPlaybooks={context.appData.continuityPlaybooks}
          propertyId={context.appData.property.id}
          propertyLabel={context.appData.property.label}
          onAddEmergencyContact={jest.fn()}
          onAddImportantAccount={jest.fn()}
          onOpenAccessArea={jest.fn()}
          onOpenAccessItem={jest.fn()}
          onOpenAsset={jest.fn()}
          onOpenDevices={jest.fn()}
          onOpenDocumentArea={jest.fn()}
          onOpenDocument={jest.fn()}
          onOpenEmergencyContact={jest.fn()}
          onOpenEmergencyContacts={jest.fn()}
          onOpenExport={jest.fn()}
          onOpenHousehold={jest.fn()}
          onOpenImportantAccount={jest.fn()}
          onOpenPlaybook={jest.fn()}
          onOpenShareHub={jest.fn()}
          onOpenTrustedHandoff={jest.fn()}
          onShareImportantAccount={jest.fn()}
        />
      );
    }

    const view = await render(
      <HomeVaultProvider>
        <UpgradedEmergencyProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(view.getByText('Who to call and what to hand off')).toBeTruthy());
    expect(view.getByText('5 of 6 emergency essentials ready')).toBeTruthy();
    expect(view.getByText('Prepare a trusted handoff')).toBeTruthy();
    expect(
      view.getByText(
        'Finish the missing basics and role gaps so someone else can step in without guessing who owns the next move.',
      ),
    ).toBeTruthy();
    expect(view.getByText('Jamie Lee')).toBeTruthy();
    expect(view.getByText('Home policy')).toBeTruthy();
    expect(view.getAllByText('Primary email').length).toBeGreaterThan(0);
    expect(view.getByText('Storm outage restart')).toBeTruthy();
  });

  it('loads sample data when entering sample mode from an empty repository', async () => {
    const emptyRepo = createMemoryHomeVaultRepository({
      properties: [],
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });
    setHomeVaultRepository(emptyRepo);

    let enterSampleMode: (() => Promise<void>) | null = null;

    function SampleModeProbe() {
      const context = useHomeVault();
      enterSampleMode = context.enterSampleMode;

      if (context.isSampleMode) return <Text testID="sample-mode">sample</Text>;
      if (context.isNewUser) return <Text testID="new-user">new user</Text>;
      return <Text testID="loading">loading</Text>;
    }

    const { getByTestId } = await render(
      <HomeVaultProvider>
        <SampleModeProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('new-user')).toBeTruthy());

    await act(async () => {
      if (!enterSampleMode) {
        throw new Error('enterSampleMode was not provided by HomeVaultContext.');
      }

      await enterSampleMode();
    });

    await waitFor(() => expect(getByTestId('sample-mode')).toBeTruthy());
  });

  it('exits sample mode by clearing sample records and returning to onboarding', async () => {
    const emptyRepo = createMemoryHomeVaultRepository({
      properties: [],
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });
    setHomeVaultRepository(emptyRepo);

    let enterSampleMode: (() => Promise<void>) | null = null;
    let exitSampleMode: (() => Promise<void>) | null = null;

    function SampleExitProbe() {
      const context = useHomeVault();
      enterSampleMode = context.enterSampleMode;
      exitSampleMode = context.exitSampleMode;

      if (context.isSampleMode) return <Text testID="sample-mode">sample</Text>;
      if (context.isNewUser) return <Text testID="new-user">new user</Text>;
      return <Text testID="loading">loading</Text>;
    }

    const { getByTestId } = await render(
      <HomeVaultProvider>
        <SampleExitProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('new-user')).toBeTruthy());

    await act(async () => {
      if (!enterSampleMode) {
        throw new Error('enterSampleMode was not provided by HomeVaultContext.');
      }

      await enterSampleMode();
    });

    await waitFor(() => expect(getByTestId('sample-mode')).toBeTruthy());
    expect(await emptyRepo.getProperties()).toHaveLength(1);

    await act(async () => {
      if (!exitSampleMode) {
        throw new Error('exitSampleMode was not provided by HomeVaultContext.');
      }

      await exitSampleMode();
    });

    await waitFor(() => expect(getByTestId('new-user')).toBeTruthy());
    expect(await emptyRepo.getProperties()).toHaveLength(0);
    expect(clearAllNotifications as jest.Mock).toHaveBeenCalled();
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
      if (!triggerReload) {
        throw new Error('reload was not provided by HomeVaultContext.');
      }

      await triggerReload();
    });

    await waitFor(() => expect(getByTestId('task-count').props.children).toBe(1));
  });

  it('keeps loading task data even when notification sync fails', async () => {
    const repo = createMemoryHomeVaultRepository({
      properties: [
        {
          id: 'prop-notify',
          householdId: 'household-notify',
          label: 'Notify Home',
          type: 'single_family',
        },
      ],
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [
        {
          id: 'task-notify',
          propertyId: 'prop-notify',
          scope: 'property',
          scopeId: 'prop-notify',
          title: 'Replace filter',
          dueDate: '2026-12-01',
          recurrenceKind: 'one_time',
          recurrenceLabel: 'One time',
          state: 'upcoming',
        },
      ],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });
    setHomeVaultRepository(repo);
    (syncTaskNotifications as jest.Mock).mockClear();
    (syncTaskNotifications as jest.Mock).mockRejectedValueOnce(
      new Error('Notification permission denied'),
    );

    const { getByTestId } = await render(
      <HomeVaultProvider>
        <DataProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('property-label')).toBeTruthy());
    expect(getByTestId('property-label').props.children).toBe('Notify Home');
    expect(syncTaskNotifications as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it('keeps dashboard due-task counts aligned with the due-task list', async () => {
    const repo = createMemoryHomeVaultRepository({
      properties: [
        {
          id: 'prop-due',
          householdId: 'household-due',
          label: 'Due Home',
          type: 'single_family',
        },
      ],
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [
        {
          id: 'task-overdue',
          propertyId: 'prop-due',
          scope: 'property',
          scopeId: 'prop-due',
          title: 'Overdue task',
          dueDate: '2026-06-20',
          recurrenceKind: 'one_time',
          recurrenceLabel: 'One time',
          state: 'overdue',
        },
        {
          id: 'task-today',
          propertyId: 'prop-due',
          scope: 'property',
          scopeId: 'prop-due',
          title: 'Due today task',
          dueDate: '2026-06-23',
          recurrenceKind: 'one_time',
          recurrenceLabel: 'One time',
          state: 'due_today',
        },
        {
          id: 'task-later',
          propertyId: 'prop-due',
          scope: 'property',
          scopeId: 'prop-due',
          title: 'Upcoming task',
          dueDate: '2026-07-01',
          recurrenceKind: 'one_time',
          recurrenceLabel: 'One time',
          state: 'upcoming',
        },
      ],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });
    setHomeVaultRepository(repo);

    function DueProbe() {
      const { appData } = useHomeVault();
      if (!appData) return <Text testID="loading">loading</Text>;

      return (
        <Text testID="due-summary">
          {`${appData.activeTaskCount}:${appData.dueTasks.length}`}
        </Text>
      );
    }

    const { getByTestId } = await render(
      <HomeVaultProvider>
        <DueProbe />
      </HomeVaultProvider>,
    );

    await waitFor(() => expect(getByTestId('due-summary')).toBeTruthy());
    expect(getByTestId('due-summary').props.children).toBe('2:2');
  });

  it('does not call syncTaskNotifications when loading sample data', async () => {
    const sampleSnapshot = {
      properties: [
        {
          id: SAMPLE_PROPERTY_ID,
          householdId: 'sample-household',
          label: 'Sample Home',
          type: 'single_family' as const,
          purchaseDate: '2020-01-01',
        },
      ],
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
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
