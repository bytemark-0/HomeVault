import { fireEvent, render } from '@testing-library/react-native';

import { HouseholdScreen } from '../../screens/HouseholdScreen';

describe('HouseholdScreen', () => {
  it('shows seasonal readiness cards and opens a selected track', async () => {
    const onOpenSeasonalTrack = jest.fn();
    const { getByText } = await render(
      <HouseholdScreen
        activeTaskCount={0}
        assetCount={1}
        documentCount={1}
        documentedAssetCount={1}
        linkedDocumentCount={1}
        isDemo={false}
        property={{
          id: 'property-1',
          householdId: 'household-1',
          label: 'Oak Street home',
          type: 'single_family',
        }}
        readinessDoneCount={5}
        readinessNextLabel="Emergency contacts"
        readinessTotal={6}
        rooms={[]}
        seasonalTracks={[
          {
            actionLabel: 'Open storm checklist',
            checklist: [
              {
                key: 'storm_insurance',
                label: 'Home policy',
                detail: 'Insurance record is saved.',
                priority: 'required',
                status: 'ready',
              },
            ],
            key: 'storm_season',
            label: 'Storm season',
            linkedPlaybookIds: ['guide-storm-prep'],
            mode: 'prep_window',
            modeLabel: 'Prep window',
            readiness: 'ready',
            readinessLabel: 'Ready',
            route: '/playbook/guide-storm-prep',
            seasonLabel: 'Severe weather and outage prep',
            summary: 'Storm season is active now and the core records are already in place.',
            timing: 'active_now',
            timingLabel: 'In season now',
          },
        ]}
        onAddRoom={jest.fn()}
        onDismissRestoreNotice={jest.fn()}
        onEditProperty={jest.fn()}
        onExportManifest={jest.fn()}
        onOpenSeasonalTrack={onOpenSeasonalTrack}
        onPrintSummary={jest.fn()}
        onResetDemoData={jest.fn()}
        onRoomPress={jest.fn()}
      />,
    );

    expect(getByText('Seasonal readiness')).toBeTruthy();
    expect(getByText('Storm season')).toBeTruthy();
    expect(getByText('Severe weather and outage prep')).toBeTruthy();
    expect(getByText('Prep window')).toBeTruthy();
    expect(getByText('In season now')).toBeTruthy();
    expect(getByText('Open storm checklist')).toBeTruthy();

    fireEvent.press(getByText('Open storm checklist'));

    expect(onOpenSeasonalTrack).toHaveBeenCalledWith('storm_season');
  });
});
