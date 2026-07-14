import { Alert } from 'react-native';

import type { Asset } from '@homevault/domain';
import type { CreateTaskInput, HomeVaultRepository } from '@homevault/database';

import { addDaysToDateInput, getTaskStateForDate } from './taskUtils';

type ReminderTemplate = {
  title: string;
  recurrenceLabel: 'Monthly' | 'Every 90 days' | 'Twice a year' | 'Yearly';
  dueInDays: number;
  instructions?: string;
};

export type RecommendedMaintenancePlan = {
  applianceLabel: string;
  tasks: ReminderTemplate[];
};

type AssetLike = Pick<Asset, 'category' | 'name'>;
type TaskAssetLike = Pick<Asset, 'id' | 'propertyId' | 'category' | 'name'>;
type TaskRepo = Pick<HomeVaultRepository, 'createTask'>;

const RECOMMENDED_PLANS: Array<{
  applianceLabel: string;
  matches: string[];
  tasks: ReminderTemplate[];
}> = [
  {
    applianceLabel: 'dishwasher',
    matches: ['dishwasher'],
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
  },
  {
    applianceLabel: 'refrigerator',
    matches: ['refrigerator', 'fridge'],
    tasks: [
      {
        title: 'Vacuum refrigerator coils',
        recurrenceLabel: 'Every 90 days',
        dueInDays: 90,
        instructions: 'Clean dust from the coils and airflow openings to help the compressor.',
      },
      {
        title: 'Inspect refrigerator water line',
        recurrenceLabel: 'Yearly',
        dueInDays: 365,
        instructions: 'Check the water line and fittings for kinks, wear, or slow leaks.',
      },
    ],
  },
  {
    applianceLabel: 'washing machine',
    matches: ['washing machine', 'clothes washer', 'washer'],
    tasks: [
      {
        title: 'Run washing machine cleaning cycle',
        recurrenceLabel: 'Monthly',
        dueInDays: 30,
        instructions: 'Clean the drum, gasket, and detergent tray to prevent buildup and odors.',
      },
      {
        title: 'Inspect washing machine hoses',
        recurrenceLabel: 'Every 90 days',
        dueInDays: 90,
        instructions: 'Look for bulges, cracks, or damp fittings at the supply connections.',
      },
    ],
  },
  {
    applianceLabel: 'dryer',
    matches: ['dryer', 'clothes dryer'],
    tasks: [
      {
        title: 'Clean dryer lint trap and vent opening',
        recurrenceLabel: 'Monthly',
        dueInDays: 30,
        instructions: 'Clear lint from the trap and the visible vent opening behind the dryer.',
      },
      {
        title: 'Inspect dryer vent duct',
        recurrenceLabel: 'Yearly',
        dueInDays: 365,
        instructions: 'Check the full vent run for lint buildup, tears, or loose connections.',
      },
    ],
  },
  {
    applianceLabel: 'water heater',
    matches: ['water heater', 'hot water heater'],
    tasks: [
      {
        title: 'Check water heater for leaks or corrosion',
        recurrenceLabel: 'Twice a year',
        dueInDays: 182,
        instructions: 'Inspect the tank, fittings, and drain area for rust, moisture, or staining.',
      },
      {
        title: 'Flush water heater tank',
        recurrenceLabel: 'Yearly',
        dueInDays: 365,
        instructions: 'Drain sediment according to the manufacturer guidance for your unit.',
      },
    ],
  },
];

export function getRecommendedMaintenancePlan(asset: AssetLike): RecommendedMaintenancePlan | null {
  if (normalize(asset.category) !== 'appliance') {
    return null;
  }

  const normalizedName = normalize(asset.name);
  const match = RECOMMENDED_PLANS.find((plan) =>
    plan.matches.some((keyword) => normalizedName.includes(normalize(keyword))),
  );

  if (!match) {
    return null;
  }

  return {
    applianceLabel: match.applianceLabel,
    tasks: match.tasks,
  };
}

export function buildRecommendedTaskInputs(
  asset: TaskAssetLike,
  now = new Date(),
): CreateTaskInput[] {
  const plan = getRecommendedMaintenancePlan(asset);

  if (!plan) {
    return [];
  }

  return plan.tasks.map((task) => {
    const dueDate = addDaysToDateInput(now, task.dueInDays);

    return {
      propertyId: asset.propertyId,
      scope: 'asset',
      scopeId: asset.id,
      title: task.title,
      dueDate,
      recurrenceKind: 'interval',
      recurrenceLabel: task.recurrenceLabel,
      state: getTaskStateForDate(dueDate),
      instructions: task.instructions,
    };
  });
}

export async function maybeAddRecommendedMaintenanceTasks(
  repo: TaskRepo,
  asset: TaskAssetLike,
  now = new Date(),
): Promise<number> {
  const plan = getRecommendedMaintenancePlan(asset);

  if (!plan) {
    return 0;
  }

  const shouldCreateTasks = await confirmRecommendedMaintenance(asset.name, plan);

  if (!shouldCreateTasks) {
    return 0;
  }

  const taskInputs = buildRecommendedTaskInputs(asset, now);
  await Promise.all(taskInputs.map((input) => repo.createTask(input)));

  return taskInputs.length;
}

export function confirmRecommendedMaintenance(
  assetName: string,
  plan: RecommendedMaintenancePlan,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Add recommended reminders?',
      `For ${assetName}, we can add:\n${plan.tasks
        .map((task) => `- ${task.recurrenceLabel}: ${task.title}`)
        .join('\n')}`,
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: `Add ${plan.tasks.length} reminder${plan.tasks.length === 1 ? '' : 's'}`,
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false },
    );
  });
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
