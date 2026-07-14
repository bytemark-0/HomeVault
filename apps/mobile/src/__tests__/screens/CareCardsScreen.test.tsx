import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockConfirmLocalStepUp = jest.fn();
const mockShareCareCardFile = jest.fn();

jest.mock('../../utils/localStepUpAuth', () => ({
  confirmLocalStepUp: (...args: unknown[]) => mockConfirmLocalStepUp(...args),
}));

jest.mock('../../utils/careCardExport', () => {
  const actual = jest.requireActual('../../utils/careCardExport');

  return {
    ...actual,
    shareCareCardFile: (...args: unknown[]) => mockShareCareCardFile(...args),
  };
});

import { CareCardsScreen } from '../../screens/CareCardsScreen';

describe('CareCardsScreen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  const emergencyContacts = [
    {
      id: 'contact-1',
      propertyId: property.id,
      name: 'Jamie Lee',
      role: 'Neighbor',
      priority: 'primary' as const,
      phone: '555-0101',
    },
  ];

  const baseProps = {
    property,
    emergencyContacts,
    onBack: jest.fn(),
    onShared: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirmLocalStepUp.mockResolvedValue(true);
    mockShareCareCardFile.mockResolvedValue('shared');
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      if (
        typeof message === 'string' &&
        message.includes('overlapping act() calls')
      ) {
        return;
      }

      if (
        typeof message === 'string' &&
        message.includes('The current testing environment is not configured to support act')
      ) {
        return;
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows high-risk missing prompts for a child template before export', async () => {
    const { getByText } = await render(<CareCardsScreen {...baseProps} />);

    expect(getByText('Fill these before a real handoff')).toBeTruthy();
    expect(getByText(/Add pickup or release rules/)).toBeTruthy();
    expect(getByText(/Add school or activity details/)).toBeTruthy();
    expect(
      getByText('Add a subject name and at least one care detail before exporting.'),
    ).toBeTruthy();
  });

  it('exports a caregiver plan after local confirmation when high-sensitivity details are present', async () => {
    const onShared = jest.fn();
    const { getByPlaceholderText, getByText } = await render(
      <CareCardsScreen {...baseProps} onShared={onShared} />,
    );

    fireEvent.changeText(getByPlaceholderText('Avery, Mochi, Dad, Jordan'), 'Avery');
    fireEvent.changeText(getByPlaceholderText('Daily allergy medicine'), 'Rescue inhaler');
    fireEvent.changeText(
      getByPlaceholderText(
        'Allergies, escalation rules, behavior triggers, or the detail a helper must not miss.',
      ),
      'Use the inhaler first if wheezing starts.',
    );

    await waitFor(() =>
      expect(
        getByText('Share a readable caregiver plan for a trusted helper.'),
      ).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(getByText('Share caregiver plan'));
    });

    await waitFor(() =>
      expect(mockConfirmLocalStepUp).toHaveBeenCalledWith(
        expect.objectContaining({
          alertTitle: 'Export sensitive caregiver plan?',
          confirmLabel: 'Export',
          authPromptMessage: 'Authenticate to export Avery caregiver plan',
        }),
      ),
    );
    expect(mockShareCareCardFile).toHaveBeenCalledWith(
      expect.stringContaining('HomeVault Caregiver Plan'),
      expect.stringContaining('homevault-caregiver-plan-grandparent-child-avery-oak-street-home-'),
    );
    expect(onShared).toHaveBeenCalledWith('Caregiver plan shared.');
  });
});
