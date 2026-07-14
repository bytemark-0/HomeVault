import { buildSeasonalReadinessTracks } from '../../utils/seasonalReadiness';

describe('seasonalReadiness', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  it('builds four seasonal tracks and reflects active-season readiness from existing records', () => {
    const tracks = buildSeasonalReadinessTracks({
      property,
      assets: [
        {
          id: 'asset-router',
          propertyId: property.id,
          name: 'Main router',
          category: 'Networking',
          status: 'ready',
          roomName: 'Office',
          documentCount: 0,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
        {
          id: 'asset-purifier',
          propertyId: property.id,
          name: 'Hallway purifier',
          category: 'Air purifier',
          status: 'ready',
          roomName: 'Hall',
          documentCount: 0,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
      ],
      documents: [
        {
          id: 'document-policy',
          propertyId: property.id,
          title: 'Prairie Mutual home policy',
          type: 'insurance',
          typeLabel: 'Insurance',
          linkedToLabel: 'Property',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: [property.id],
        },
        {
          id: 'document-filter',
          propertyId: property.id,
          title: 'HVAC filter replacement note',
          type: 'manual',
          typeLabel: 'Manual',
          linkedToLabel: 'Hallway purifier',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: ['asset-purifier'],
        },
      ],
      accessItems: [
        {
          id: 'access-lockbox',
          propertyId: property.id,
          category: 'lockbox',
          label: 'Front porch lockbox',
          linkedDocumentIds: [],
        },
        {
          id: 'access-shutoff',
          propertyId: property.id,
          category: 'utility_shutoff',
          label: 'Main water shutoff',
          location: 'Garage south wall',
          linkedDocumentIds: [],
        },
      ],
      emergencyContacts: [
        {
          id: 'contact-1',
          propertyId: property.id,
          name: 'Jamie Lee',
          role: 'Neighbor with spare key',
          priority: 'primary',
        },
      ],
      importantAccounts: [
        {
          id: 'account-insurance',
          propertyId: property.id,
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          linkedDocumentIds: ['document-policy'],
        },
        {
          id: 'account-utility',
          propertyId: property.id,
          kind: 'utility',
          providerName: 'City Utilities',
          label: 'City Utilities account',
          linkedDocumentIds: [],
        },
      ],
      continuityPlaybooks: [],
      now: new Date('2026-07-10T12:00:00.000Z'),
    });

    const stormTrack = tracks.find((track) => track.key === 'storm_season');
    const smokeTrack = tracks.find((track) => track.key === 'wildfire_smoke');
    const freezeTrack = tracks.find((track) => track.key === 'winter_freeze');
    const travelTrack = tracks.find((track) => track.key === 'summer_travel');

    expect(tracks).toHaveLength(4);
    expect(stormTrack).toEqual(
      expect.objectContaining({
        timing: 'active_now',
        readiness: 'ready',
        route: '/playbook/guide-storm-prep',
      }),
    );
    expect(smokeTrack).toEqual(
      expect.objectContaining({
        timing: 'active_now',
        readiness: 'ready',
        route: '/playbook/guide-evacuation-ready',
      }),
    );
    expect(freezeTrack).toEqual(
      expect.objectContaining({
        timing: 'off_season',
        route: '/playbook/guide-storm-prep',
      }),
    );
    expect(travelTrack).toEqual(
      expect.objectContaining({
        timing: 'active_now',
        route: '/playbook/guide-travel-handoff',
      }),
    );
    expect(travelTrack?.summary).toMatch(/summer travel is active now/i);
  });

  it('distinguishes a current disruption from ordinary prep windows', () => {
    const tracks = buildSeasonalReadinessTracks({
      property,
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [
        {
          id: 'playbook-storm-active',
          propertyId: property.id,
          category: 'storm',
          title: 'Storm response in motion',
          state: 'in_progress',
          linkedRecordIds: [],
          steps: [{ id: 'step-1', label: 'Check outage updates', isRequired: true, isComplete: false }],
        },
      ],
      now: new Date('2026-07-10T12:00:00.000Z'),
    });

    const stormTrack = tracks.find((track) => track.key === 'storm_season');
    const smokeTrack = tracks.find((track) => track.key === 'wildfire_smoke');
    const travelTrack = tracks.find((track) => track.key === 'summer_travel');

    expect(stormTrack).toEqual(
      expect.objectContaining({
        mode: 'incident_active',
      }),
    );
    expect(smokeTrack).toEqual(
      expect.objectContaining({
        mode: 'incident_active',
      }),
    );
    expect(travelTrack).toEqual(
      expect.objectContaining({
        mode: 'prep_window',
      }),
    );
    expect(stormTrack?.summary).toMatch(/looks active right now/i);
  });
});
