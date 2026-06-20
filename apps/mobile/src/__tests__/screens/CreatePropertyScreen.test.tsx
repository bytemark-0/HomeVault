import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { CreatePropertyScreen } from '../../screens/onboarding/CreatePropertyScreen';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: jest.fn(),
}));

const mockGetHomeVaultRepository = getHomeVaultRepository as jest.MockedFunction<
  typeof getHomeVaultRepository
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
});
