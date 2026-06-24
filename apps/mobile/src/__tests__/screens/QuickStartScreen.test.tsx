import type { ReactNode } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { QuickStartScreen } from '../../screens/onboarding/QuickStartScreen';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';

const mockFirstAssetScreen = jest.fn();
const mockAddTaskScreen = jest.fn();
const mockAddDocumentScreen = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: jest.fn(),
}));

jest.mock('../../screens/onboarding/FirstAssetScreen', () => ({
  FirstAssetScreen: (props: unknown) => mockFirstAssetScreen(props),
}));

jest.mock('../../screens/AddTaskScreen', () => ({
  AddTaskScreen: (props: unknown) => mockAddTaskScreen(props),
}));

jest.mock('../../screens/AddDocumentScreen', () => ({
  AddDocumentScreen: (props: unknown) => mockAddDocumentScreen(props),
}));

const mockGetHomeVaultRepository = getHomeVaultRepository as jest.MockedFunction<
  typeof getHomeVaultRepository
>;

describe('QuickStartScreen', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Home',
    type: 'single_family' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHomeVaultRepository.mockResolvedValue({
      createTask: jest.fn().mockResolvedValue({ id: 'task-1' }),
      createDocument: jest.fn().mockResolvedValue({ id: 'document-1' }),
    } as never);

    mockFirstAssetScreen.mockImplementation(
      ({
        initialCategory,
        onBack,
        onSaved,
      }: {
        initialCategory: string;
        onBack: () => void;
        onSaved: () => void;
      }) => {
        const { Pressable, Text } = require('react-native');

        return (
          <>
            <Text>{`First asset: ${initialCategory}`}</Text>
            <Pressable accessibilityRole="button" onPress={onSaved}>
              <Text>Asset saved</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onBack}>
              <Text>Asset back</Text>
            </Pressable>
          </>
        );
      },
    );

    mockAddTaskScreen.mockImplementation(
      ({
        onCancel,
        onSave,
      }: {
        onCancel: () => void;
        onSave: (input: unknown) => Promise<void>;
      }) => {
        const { Pressable, Text } = require('react-native');

        return (
          <>
            <Text>First task screen</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                void onSave({
                  propertyId: 'property-1',
                  scope: 'property',
                  scopeId: 'property-1',
                  title: 'Replace filter',
                  dueDate: '2026-12-01',
                  recurrenceKind: 'interval',
                  recurrenceLabel: 'Monthly',
                  state: 'upcoming',
                })
              }
            >
              <Text>Task saved</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onCancel}>
              <Text>Task cancel</Text>
            </Pressable>
          </>
        );
      },
    );

    mockAddDocumentScreen.mockImplementation(
      ({
        onCancel,
        onSave,
      }: {
        onCancel: () => void;
        onSave: (input: unknown) => Promise<void>;
      }) => {
        const { Pressable, Text } = require('react-native');

        return (
          <>
            <Text>First document screen</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                void onSave({
                  propertyId: 'property-1',
                  title: 'Warranty packet',
                  type: 'warranty',
                  linkedRecordIds: ['property-1'],
                })
              }
            >
              <Text>Document saved</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onCancel}>
              <Text>Document cancel</Text>
            </Pressable>
          </>
        );
      },
    );
  });

  it('shows the quick-start choices and helper copy', async () => {
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    expect(getByText('What do you want to add first?')).toBeTruthy();
    expect(getByText('Add an appliance')).toBeTruthy();
    expect(getByText('Add a home system')).toBeTruthy();
    expect(getByText('Add a maintenance reminder')).toBeTruthy();
    expect(getByText('Save a document')).toBeTruthy();
    expect(getByText('Skip to dashboard')).toBeTruthy();
  });

  it('opens the appliance flow', async () => {
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    await fireEvent.press(getByText('Add an appliance'));

    expect(getByText('First asset: Appliance')).toBeTruthy();
  });

  it('opens the home-system flow with the system category', async () => {
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    await fireEvent.press(getByText('Add a home system'));

    expect(getByText('First asset: Heating & cooling')).toBeTruthy();
  });

  it('opens the maintenance-reminder flow and returns to choices on cancel', async () => {
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    await fireEvent.press(getByText('Add a maintenance reminder'));
    expect(getByText('First task screen')).toBeTruthy();

    await fireEvent.press(getByText('Task cancel'));
    expect(getByText('Add a maintenance reminder')).toBeTruthy();
  });

  it('opens the document flow and returns to choices on cancel', async () => {
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    await fireEvent.press(getByText('Save a document'));
    expect(getByText('First document screen')).toBeTruthy();

    await fireEvent.press(getByText('Document cancel'));
    expect(getByText('Save a document')).toBeTruthy();
  });

  it('returns to choices when backing out of the first-asset flow', async () => {
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={jest.fn()} />,
    );

    await fireEvent.press(getByText('Add an appliance'));
    expect(getByText('First asset: Appliance')).toBeTruthy();

    await fireEvent.press(getByText('Asset back'));
    expect(getByText('Add an appliance')).toBeTruthy();
  });

  it('finishes onboarding when skipping quick start', async () => {
    const onDone = jest.fn();
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={onDone} />,
    );

    await fireEvent.press(getByText('Skip to dashboard'));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('finishes onboarding after the first-asset flow saves', async () => {
    const onDone = jest.fn();
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={onDone} />,
    );

    await fireEvent.press(getByText('Add an appliance'));
    await fireEvent.press(getByText('Asset saved'));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('creates a first task and then finishes onboarding', async () => {
    const repo = {
      createTask: jest.fn().mockResolvedValue({ id: 'task-1' }),
      createDocument: jest.fn().mockResolvedValue({ id: 'document-1' }),
    };
    mockGetHomeVaultRepository.mockResolvedValue(repo as never);
    const onDone = jest.fn();
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={onDone} />,
    );

    await fireEvent.press(getByText('Add a maintenance reminder'));
    await fireEvent.press(getByText('Task saved'));

    await waitFor(() =>
      expect(repo.createTask).toHaveBeenCalledWith({
        propertyId: 'property-1',
        scope: 'property',
        scopeId: 'property-1',
        title: 'Replace filter',
        dueDate: '2026-12-01',
        recurrenceKind: 'interval',
        recurrenceLabel: 'Monthly',
        state: 'upcoming',
      }),
    );
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('creates a first document and then finishes onboarding', async () => {
    const repo = {
      createTask: jest.fn().mockResolvedValue({ id: 'task-1' }),
      createDocument: jest.fn().mockResolvedValue({ id: 'document-1' }),
    };
    mockGetHomeVaultRepository.mockResolvedValue(repo as never);
    const onDone = jest.fn();
    const { getByText } = await render(
      <QuickStartScreen property={property} onDone={onDone} />,
    );

    await fireEvent.press(getByText('Save a document'));
    await fireEvent.press(getByText('Document saved'));

    await waitFor(() =>
      expect(repo.createDocument).toHaveBeenCalledWith({
        propertyId: 'property-1',
        title: 'Warranty packet',
        type: 'warranty',
        linkedRecordIds: ['property-1'],
      }),
    );
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
