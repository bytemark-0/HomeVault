import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { WelcomeScreen } from '../../screens/onboarding/WelcomeScreen';
import { useHomeVault } from '../../context/HomeVaultContext';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: jest.fn(),
}));

const mockUseHomeVault = useHomeVault as jest.MockedFunction<typeof useHomeVault>;

describe('WelcomeScreen', () => {
  const enterSampleMode = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHomeVault.mockReturnValue({
      appData: null,
      isNewUser: true,
      isSampleMode: false,
      loadError: false,
      backupSummary: null,
      restoreSummary: null,
      toast: null,
      setBackupSummary: jest.fn(),
      setRestoreSummary: jest.fn(),
      reload: jest.fn(),
      enterSampleMode,
      exitSampleMode: jest.fn(),
      finishOnboarding: jest.fn(),
      showToast: jest.fn(),
      dismissToast: jest.fn(),
    });
  });

  it('calls setup callback when the primary action is pressed', async () => {
    const onSetUp = jest.fn();
    const { getByText } = await render(<WelcomeScreen onSetUp={onSetUp} />);

    await fireEvent.press(getByText('Set up my home'));

    expect(onSetUp).toHaveBeenCalledTimes(1);
  });

  it('enters sample mode from the secondary action', async () => {
    const { getByText } = await render(<WelcomeScreen onSetUp={jest.fn()} />);

    await fireEvent.press(getByText('Explore a sample home'));

    await waitFor(() => expect(enterSampleMode).toHaveBeenCalledTimes(1));
  });
});
