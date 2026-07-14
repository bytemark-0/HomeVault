import { fireEvent, render } from '@testing-library/react-native';

const mockRouter = {
  push: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
}));

jest.mock('../../components/SampleModeNotice', () => ({
  SampleModeNotice: () => null,
}));

jest.mock('../../utils/navigation', () => ({
  navigateBackOrReplace: jest.fn(),
}));

const ShareHubRoute = require('../../../app/share').default;

describe('ShareHubRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes packet, trusted handoff, care cards, and item-share shortcuts', async () => {
    const { getByText } = await render(<ShareHubRoute />);

    await fireEvent.press(getByText('Open emergency packet'));
    await fireEvent.press(getByText('Start trusted handoff'));
    await fireEvent.press(getByText('Open care cards'));
    await fireEvent.press(getByText('Access items'));
    await fireEvent.press(getByText('Critical documents'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/export');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, {
      pathname: '/export',
      params: { focus: 'trusted-share' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, '/share/care-cards');
    expect(mockRouter.push).toHaveBeenNthCalledWith(4, '/(tabs)/access');
    expect(mockRouter.push).toHaveBeenNthCalledWith(5, {
      pathname: '/(tabs)/documents',
      params: { collection: 'critical' },
    });
  });
});
