import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { CreatePropertyScreen } from '../../screens/onboarding/CreatePropertyScreen';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import {
  clearCreatePropertyDraft,
  readCreatePropertyDraft,
  writeCreatePropertyDraft,
} from '../../utils/onboardingStorage';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: jest.fn(),
}));

jest.mock('../../utils/onboardingStorage', () => ({
  clearCreatePropertyDraft: jest.fn().mockResolvedValue(undefined),
  readCreatePropertyDraft: jest.fn().mockResolvedValue(null),
  writeCreatePropertyDraft: jest.fn().mockResolvedValue(undefined),
}));

const mockGetHomeVaultRepository = getHomeVaultRepository as jest.MockedFunction<
  typeof getHomeVaultRepository
>;
const mockReadCreatePropertyDraft = readCreatePropertyDraft as jest.MockedFunction<
  typeof readCreatePropertyDraft
>;
const mockWriteCreatePropertyDraft = writeCreatePropertyDraft as jest.MockedFunction<
  typeof writeCreatePropertyDraft
>;
const mockClearCreatePropertyDraft = clearCreatePropertyDraft as jest.MockedFunction<
  typeof clearCreatePropertyDraft
>;

describe('CreatePropertyScreen', () => {
  const createdProperty = {
    id: 'property-created',
    householdId: 'household-created',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReadCreatePropertyDraft.mockResolvedValue(null);
    mockWriteCreatePropertyDraft.mockResolvedValue(undefined);
    mockClearCreatePropertyDraft.mockResolvedValue(undefined);
    mockGetHomeVaultRepository.mockResolvedValue({
      createProperty: jest.fn().mockResolvedValue(createdProperty),
    } as never);
  });

  it('requires a home name before saving', async () => {
    const onCreated = jest.fn();
    const { getByText, queryByText } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={onCreated} />,
    );

    await fireEvent.press(getByText('Create my home'));

    expect(queryByText('Give your home a name to continue.')).toBeTruthy();
    expect(mockGetHomeVaultRepository).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('creates a home with only required fields', async () => {
    const createProperty = jest.fn().mockResolvedValue(createdProperty);
    mockGetHomeVaultRepository.mockResolvedValue({ createProperty } as never);
    const onCreated = jest.fn();
    const { getByLabelText, getByText } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={onCreated} />,
    );

    await fireEvent.changeText(getByLabelText('Home name'), '  Oak Street home  ');
    await fireEvent.press(getByText('Create my home'));

    await waitFor(() =>
      expect(createProperty).toHaveBeenCalledWith({
        label: 'Oak Street home',
        type: 'single_family',
      }),
    );
    expect(onCreated).toHaveBeenCalledWith(createdProperty);
  });

  it('calls onBack when the user leaves setup', async () => {
    const onBack = jest.fn();
    const { getByText } = await render(
      <CreatePropertyScreen onBack={onBack} onCreated={jest.fn()} />,
    );

    await fireEvent.press(getByText('← Back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('saves the selected property type', async () => {
    const createProperty = jest.fn().mockResolvedValue({
      ...createdProperty,
      type: 'townhome' as const,
    });
    mockGetHomeVaultRepository.mockResolvedValue({ createProperty } as never);
    const { getByLabelText, getByText } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Home name'), 'Townhome');
    await fireEvent.press(getByText('Townhome'));
    await fireEvent.press(getByText('Create my home'));

    await waitFor(() =>
      expect(createProperty).toHaveBeenCalledWith({
        label: 'Townhome',
        type: 'townhome',
      }),
    );
  });

  it('saves optional property details when provided', async () => {
    const createProperty = jest.fn().mockResolvedValue({
      ...createdProperty,
      addressLabel: 'Austin, TX',
      yearBuilt: 1998,
      purchaseDate: '2023-08-15',
    });
    mockGetHomeVaultRepository.mockResolvedValue({ createProperty } as never);
    const { getByLabelText, getByText } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Home name'), 'Oak Street home');
    await fireEvent.changeText(getByLabelText('Address or location'), ' Austin, TX ');
    await fireEvent.changeText(getByLabelText('Year built'), '1998');
    await fireEvent.changeText(getByLabelText('Purchase date'), '2023-08-15');
    await fireEvent.press(getByText('Create my home'));

    await waitFor(() =>
      expect(createProperty).toHaveBeenCalledWith({
        label: 'Oak Street home',
        addressLabel: 'Austin, TX',
        type: 'single_family',
        yearBuilt: 1998,
        purchaseDate: '2023-08-15',
      }),
    );
  });

  it('restores a saved draft when setup resumes', async () => {
    mockReadCreatePropertyDraft.mockResolvedValue({
      label: 'Maple House',
      addressLabel: 'Austin, TX',
      type: 'townhome',
      yearBuilt: '2004',
      purchaseDate: '2021-06-15',
    });

    const { getByDisplayValue } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={jest.fn()} />,
    );

    await waitFor(() => expect(getByDisplayValue('Maple House')).toBeTruthy());
    expect(getByDisplayValue('Austin, TX')).toBeTruthy();
    expect(getByDisplayValue('2004')).toBeTruthy();
    expect(getByDisplayValue('2021-06-15')).toBeTruthy();
  });

  it('persists draft changes while the user fills out the form', async () => {
    const { getByLabelText, getByText } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Home name'), 'Oak Street home');
    await fireEvent.changeText(getByLabelText('Address or location'), 'Austin, TX');
    await fireEvent.changeText(getByLabelText('Year built'), '1998');
    await fireEvent.changeText(getByLabelText('Purchase date'), '2023-08-15');
    await fireEvent.press(getByText('Townhome'));

    await waitFor(() =>
      expect(mockWriteCreatePropertyDraft).toHaveBeenLastCalledWith({
        label: 'Oak Street home',
        addressLabel: 'Austin, TX',
        type: 'townhome',
        yearBuilt: '1998',
        purchaseDate: '2023-08-15',
      }),
    );
  });

  it('shows inline errors for invalid optional dates', async () => {
    const createProperty = jest.fn();
    mockGetHomeVaultRepository.mockResolvedValue({ createProperty } as never);
    const { getByLabelText, getByText, queryByText } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Home name'), 'Oak Street home');
    await fireEvent.changeText(getByLabelText('Year built'), '20');
    await fireEvent.changeText(getByLabelText('Purchase date'), '2023-02-31');
    await fireEvent.press(getByText('Create my home'));

    expect(queryByText('Enter a four-digit year.')).toBeTruthy();
    expect(queryByText('Use YYYY-MM-DD.')).toBeTruthy();
    expect(createProperty).not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions while saving', async () => {
    let resolveCreate: (value: typeof createdProperty) => void = () => {};
    const createProperty = jest.fn(
      () =>
        new Promise<typeof createdProperty>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    mockGetHomeVaultRepository.mockResolvedValue({ createProperty } as never);
    const onCreated = jest.fn();
    const { getByLabelText, getByText } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={onCreated} />,
    );

    await fireEvent.changeText(getByLabelText('Home name'), 'Oak Street home');
    await fireEvent.press(getByText('Create my home'));
    await fireEvent.press(getByLabelText('Create my home'));

    expect(createProperty).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveCreate(createdProperty);
      await Promise.resolve();
    });
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdProperty));
  });

  it('shows an actionable error and allows retrying after a failed save', async () => {
    const createProperty = jest
      .fn()
      .mockRejectedValueOnce(new Error('write failed'))
      .mockResolvedValueOnce(createdProperty);
    mockGetHomeVaultRepository.mockResolvedValue({ createProperty } as never);
    const onCreated = jest.fn();
    const { getByLabelText, getByText } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={onCreated} />,
    );

    await fireEvent.changeText(getByLabelText('Home name'), 'Oak Street home');
    await fireEvent.press(getByText('Create my home'));

    await waitFor(() =>
      expect(
        getByText(
          'We could not create your home. Your information is still here. Check storage permissions and try again.',
        ),
      ).toBeTruthy(),
    );
    expect(onCreated).not.toHaveBeenCalled();

    await fireEvent.press(getByText('Create my home'));

    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(2));
    expect(onCreated).toHaveBeenCalledWith(createdProperty);
  });

  it('clears the saved draft after a successful create', async () => {
    const createProperty = jest.fn().mockResolvedValue(createdProperty);
    mockGetHomeVaultRepository.mockResolvedValue({ createProperty } as never);
    const { getByLabelText, getByText } = await render(
      <CreatePropertyScreen onBack={jest.fn()} onCreated={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Home name'), 'Oak Street home');
    await fireEvent.press(getByText('Create my home'));

    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1));
    expect(mockClearCreatePropertyDraft).toHaveBeenCalled();
  });
});
