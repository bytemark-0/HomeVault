import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { WelcomeScreen } from '../../screens/onboarding/WelcomeScreen';
import { useHomeVault } from '../../context/HomeVaultContext';
import { logUxEvent } from '../../utils/analytics';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: jest.fn(),
}));

jest.mock('../../utils/analytics', () => ({
  logUxEvent: jest.fn(),
}));

const mockUseHomeVault = useHomeVault as jest.MockedFunction<typeof useHomeVault>;
const mockLogUxEvent = logUxEvent as jest.MockedFunction<typeof logUxEvent>;

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

    expect(mockLogUxEvent).toHaveBeenCalledWith('welcome_viewed');
    await fireEvent.press(getByText('Start my household guide'));

    expect(onSetUp).toHaveBeenCalledTimes(1);
    expect(mockLogUxEvent).toHaveBeenCalledWith('setup_selected');
  });

  it('enters sample mode from the secondary action', async () => {
    const { getByText } = await render(<WelcomeScreen onSetUp={jest.fn()} />);

    await fireEvent.press(getByText('Explore a sample household guide'));

    await waitFor(() => expect(enterSampleMode).toHaveBeenCalledTimes(1));
    expect(mockLogUxEvent).toHaveBeenCalledWith('sample_selected');
  });

  it('calls support callback from the tertiary action', async () => {
    const onSupport = jest.fn();
    const { getByText } = await render(
      <WelcomeScreen onSetUp={jest.fn()} onSupport={onSupport} />,
    );

    await fireEvent.press(getByText('Privacy & beta support'));

    expect(onSupport).toHaveBeenCalledTimes(1);
  });

  it('logs abandonment when the welcome screen unmounts without a path selection', async () => {
    const view = await render(<WelcomeScreen onSetUp={jest.fn()} />);

    view.unmount();

    await waitFor(() => expect(mockLogUxEvent).toHaveBeenCalledWith('welcome_abandoned'));
  });
});
