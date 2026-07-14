import { Alert } from 'react-native';

import {
  buildRecommendedTaskInputs,
  getRecommendedMaintenancePlan,
  maybeAddRecommendedMaintenanceTasks,
} from '../../utils/recommendedMaintenance';

describe('recommendedMaintenance', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns dishwasher recommendations for appliance assets', () => {
    expect(
      getRecommendedMaintenancePlan({
        name: 'Kitchen Dishwasher',
        category: 'Appliance',
      }),
    ).toEqual({
      applianceLabel: 'dishwasher',
      tasks: [
        {
          title: 'Clean dishwasher drain filter',
          recurrenceLabel: 'Monthly',
          dueInDays: 30,
          instructions: 'Remove debris from the filter and rinse it before reinstalling.',
        },
        {
          title: 'Check dishwasher supply and drain fittings',
          recurrenceLabel: 'Yearly',
          dueInDays: 365,
          instructions: 'Look for drips, corrosion, or loose hose connections around the unit.',
        },
      ],
    });
  });

  it('does not return recommendations for non-appliance categories', () => {
    expect(
      getRecommendedMaintenancePlan({
        name: 'Dishwasher',
        category: 'Plumbing',
      }),
    ).toBeNull();
  });

  it('builds dated recurring task inputs for a matched appliance', () => {
    expect(
      buildRecommendedTaskInputs(
        {
          id: 'asset-dishwasher',
          propertyId: 'property-1',
          name: 'Dishwasher',
          category: 'Appliance',
        },
        new Date('2026-06-24T12:00:00Z'),
      ),
    ).toEqual([
      {
        propertyId: 'property-1',
        scope: 'asset',
        scopeId: 'asset-dishwasher',
        title: 'Clean dishwasher drain filter',
        dueDate: '2026-07-24',
        recurrenceKind: 'interval',
        recurrenceLabel: 'Monthly',
        state: 'upcoming',
        instructions: 'Remove debris from the filter and rinse it before reinstalling.',
      },
      {
        propertyId: 'property-1',
        scope: 'asset',
        scopeId: 'asset-dishwasher',
        title: 'Check dishwasher supply and drain fittings',
        dueDate: '2027-06-24',
        recurrenceKind: 'interval',
        recurrenceLabel: 'Yearly',
        state: 'upcoming',
        instructions: 'Look for drips, corrosion, or loose hose connections around the unit.',
      },
    ]);
  });

  it('creates recommended tasks after the user opts in', async () => {
    const createTask = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const addButton = Array.isArray(buttons) ? buttons[1] : undefined;
      if (addButton && typeof addButton !== 'string') {
        addButton.onPress?.();
      }
    });

    const count = await maybeAddRecommendedMaintenanceTasks(
      { createTask },
      {
        id: 'asset-dishwasher',
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
      },
      new Date('2026-06-24T12:00:00Z'),
    );

    expect(count).toBe(2);
    expect(createTask).toHaveBeenCalledTimes(2);
    expect(createTask).toHaveBeenNthCalledWith(1, {
      propertyId: 'property-1',
      scope: 'asset',
      scopeId: 'asset-dishwasher',
      title: 'Clean dishwasher drain filter',
      dueDate: '2026-07-24',
      recurrenceKind: 'interval',
      recurrenceLabel: 'Monthly',
      state: 'upcoming',
      instructions: 'Remove debris from the filter and rinse it before reinstalling.',
    });
  });
});
