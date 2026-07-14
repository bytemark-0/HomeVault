import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { SampleModeNotice } from '../../components/SampleModeNotice';
import { useHomeVault } from '../../context/HomeVaultContext';

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: jest.fn(),
}));

const mockUseHomeVault = useHomeVault as jest.MockedFunction<typeof useHomeVault>;

describe('SampleModeNotice', () => {
  const exitSampleMode = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockUseHomeVault.mockReturnValue({
      appData: null,
      isNewUser: false,
      isSampleMode: true,
      loadError: false,
      backupSummary: null,
      restoreSummary: null,
      toast: null,
      setBackupSummary: jest.fn(),
      setRestoreSummary: jest.fn(),
      reload: jest.fn(),
      enterSampleMode: jest.fn(),
      exitSampleMode,
      finishOnboarding: jest.fn(),
      showToast: jest.fn(),
      dismissToast: jest.fn(),
    });
  });

  it('does not render for a real vault', async () => {
    mockUseHomeVault.mockReturnValueOnce({
      ...mockUseHomeVault(),
      isSampleMode: false,
    });

    const { queryByText } = await render(<SampleModeNotice />);

    expect(queryByText('Sample continuity guide')).toBeNull();
  });

  it('labels sample data and exposes the create-vault action', async () => {
    const { getByText } = await render(<SampleModeNotice />);

    expect(getByText('Sample continuity guide')).toBeTruthy();
    expect(getByText('You are exploring a sample household operating manual.')).toBeTruthy();
    expect(getByText('Create your own guide')).toBeTruthy();
  });

  it('confirms before leaving sample mode', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const { getByText } = await render(<SampleModeNotice />);

    fireEvent.press(getByText('Create your own guide'));

    expect(alert).toHaveBeenCalledWith(
      'Create your own household guide?',
      'HomeVault will delete the sample records on this device and return you to setup.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Create my own guide', onPress: expect.any(Function) }),
      ]),
    );

    const actions = alert.mock.calls[0]?.[2] ?? [];
    const createAction = actions.find((action) => action.text === 'Create my own guide');
    createAction?.onPress?.();

    expect(exitSampleMode).toHaveBeenCalledTimes(1);
  });
});
