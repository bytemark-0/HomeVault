import type { ReactNode } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  getEmergencyPriorityForCount,
  getQuickStartChecklistProgress,
  QuickStartScreen,
} from '../../screens/onboarding/QuickStartScreen';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import {
  clearReadinessSetupState,
  readReadinessSetupState,
  writeReadinessSetupState,
} from '../../utils/onboardingStorage';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: jest.fn(),
}));

jest.mock('../../utils/onboardingStorage', () => {
  const actual = jest.requireActual('../../utils/onboardingStorage');
  return {
    ...actual,
    readReadinessSetupState: jest.fn(),
    writeReadinessSetupState: jest.fn().mockResolvedValue(undefined),
    clearReadinessSetupState: jest.fn().mockResolvedValue(undefined),
  };
});

const mockGetHomeVaultRepository = getHomeVaultRepository as jest.MockedFunction<
  typeof getHomeVaultRepository
>;
const mockReadReadinessSetupState = readReadinessSetupState as jest.MockedFunction<
  typeof readReadinessSetupState
>;
const mockWriteReadinessSetupState = writeReadinessSetupState as jest.MockedFunction<
  typeof writeReadinessSetupState
>;
const mockClearReadinessSetupState = clearReadinessSetupState as jest.MockedFunction<
  typeof clearReadinessSetupState
>;

describe('QuickStartScreen', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Home',
    type: 'single_family' as const,
  };

  function buildRepo({
    accessItems = [],
    assets = [],
    emergencyContacts = [],
    importantAccounts = [],
  }: {
    accessItems?: unknown[];
    assets?: unknown[];
    emergencyContacts?: unknown[];
    importantAccounts?: unknown[];
  } = {}) {
    return {
      getAccessItems: jest.fn().mockResolvedValue(accessItems),
      getAssets: jest.fn().mockResolvedValue(assets),
      getEmergencyContacts: jest.fn().mockResolvedValue(emergencyContacts),
      getImportantAccounts: jest.fn().mockResolvedValue(importantAccounts),
      createAccessItem: jest.fn().mockResolvedValue({ id: 'access-1' }),
      createAsset: jest.fn().mockResolvedValue({ id: 'asset-1' }),
      createEmergencyContact: jest.fn().mockResolvedValue({ id: 'contact-1' }),
      createImportantAccount: jest.fn().mockResolvedValue({ id: 'account-1' }),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockReadReadinessSetupState.mockResolvedValue({ currentStep: null, skippedSteps: [] });
  });

  it('starts with Wi-Fi as the first readiness step for a new setup', async () => {
    mockGetHomeVaultRepository.mockResolvedValue(buildRepo() as never);

    const { getByText, queryAllByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    await waitFor(() => expect(getByText('Add the essentials first')).toBeTruthy());
    expect(getByText('0 of 5')).toBeTruthy();
    expect(queryAllByText('Save Wi-Fi details').length).toBeGreaterThan(0);
  });

  it('resumes the saved readiness step when onboarding is reopened', async () => {
    mockGetHomeVaultRepository.mockResolvedValue(buildRepo() as never);
    mockReadReadinessSetupState.mockResolvedValue({
      currentStep: 'insurance',
      skippedSteps: ['wifi', 'access'],
    });

    const { queryAllByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    await waitFor(() =>
      expect(queryAllByText('Add an insurance account').length).toBeGreaterThan(0),
    );
  });

  it('uses saved records to jump ahead for a partially completed setup', async () => {
    mockGetHomeVaultRepository.mockResolvedValue(
      buildRepo({
        accessItems: [
          { id: 'wifi-1', propertyId: 'property-1', category: 'wifi' },
          { id: 'garage-1', propertyId: 'property-1', category: 'garage' },
        ],
      }) as never,
    );

    const { getByText, queryAllByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    await waitFor(() =>
      expect(queryAllByText('Add an insurance account').length).toBeGreaterThan(0),
    );
    expect(getByText('2 of 5')).toBeTruthy();
  });

  it('saves Wi-Fi details and advances to the next unfinished step', async () => {
    const repo = buildRepo();
    repo.getAccessItems
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'wifi-1', propertyId: 'property-1', category: 'wifi' }]);
    mockGetHomeVaultRepository.mockResolvedValue(repo as never);

    const { getByLabelText, getByText, queryAllByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    await waitFor(() => expect(queryAllByText('Save Wi-Fi details').length).toBeGreaterThan(0));

    const networkNameInput = getByLabelText('Network name');
    const passwordInput = getByLabelText('Password');
    const routerLocationInput = getByLabelText('Router location');

    fireEvent.changeText(networkNameInput, 'OakStreet-5G');
    fireEvent.changeText(passwordInput, '9274');
    fireEvent.changeText(routerLocationInput, 'Hall closet shelf');
    await waitFor(() => expect(networkNameInput.props.value).toBe('OakStreet-5G'));
    await waitFor(() => expect(passwordInput.props.value).toBe('9274'));
    await waitFor(() => expect(routerLocationInput.props.value).toBe('Hall closet shelf'));
    fireEvent.press(getByText('Save and continue'));

    await waitFor(() =>
      expect(repo.createAccessItem).toHaveBeenCalledWith({
        propertyId: 'property-1',
        category: 'wifi',
        label: 'Wi-Fi access',
        username: 'OakStreet-5G',
        accessCode: '9274',
        location: 'Hall closet shelf',
        linkedDocumentIds: [],
        lastVerifiedAt: expect.any(String),
      }),
    );
    await waitFor(() => expect(queryAllByText('Save an access code').length).toBeGreaterThan(0));
    expect(mockWriteReadinessSetupState).toHaveBeenCalledWith({
      currentStep: 'access',
      skippedSteps: [],
    });
  });

  it('keeps emergency onboarding incomplete until three contacts are saved', () => {
    const progress = getQuickStartChecklistProgress({
      accessItems: [
        { category: 'wifi' as const },
        { category: 'garage' as const },
      ],
      assets: [{ category: 'Network', name: 'Router' }],
      emergencyContacts: [{ id: 'contact-1' }],
      importantAccounts: [{ kind: 'insurance' as const }],
    });

    expect(progress.doneCount).toBe(4);
    expect(progress.done.has('emergency')).toBe(false);
    expect(progress.emergencyContactCount).toBe(1);
    expect(progress.next?.key).toBe('emergency');
  });

  it('assigns onboarding emergency contacts a useful priority sequence', () => {
    expect(getEmergencyPriorityForCount(0)).toBe('primary');
    expect(getEmergencyPriorityForCount(1)).toBe('secondary');
    expect(getEmergencyPriorityForCount(2)).toBe('service_provider');
    expect(getEmergencyPriorityForCount(3)).toBe('other');
  });
});
