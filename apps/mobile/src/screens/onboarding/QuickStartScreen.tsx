import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  CreateAccessItemInput,
  CreateAssetInput,
  CreateEmergencyContactInput,
  CreateImportantAccountInput,
  HomeVaultRepository,
} from '@homevault/database';
import type { Property } from '@homevault/domain';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import { colors } from '../../theme/colors';
import {
  clearReadinessSetupState,
  readReadinessSetupState,
  type ReadinessSetupStep,
  writeReadinessSetupState,
} from '../../utils/onboardingStorage';
import {
  getSetupChecklistProgress,
  SETUP_CHECKLIST_STEPS,
  type SetupChecklistProgressInput,
} from '../../utils/setupChecklist';

type Props = {
  property: Property;
  onDone: () => void | Promise<void>;
  initialStep?: ReadinessSetupStep | null;
};

type StepValues = {
  wifiNetworkName: string;
  wifiPassword: string;
  wifiLocation: string;
  accessLabel: string;
  accessCode: string;
  accessLocation: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insurancePhone: string;
  emergencyName: string;
  emergencyRole: string;
  emergencyPhone: string;
  deviceName: string;
  deviceCategory: string;
  deviceLocation: string;
};

const REQUIRED_EMERGENCY_CONTACTS = 3;

type QuickStartChecklistProgress = ReturnType<typeof getSetupChecklistProgress> & {
  emergencyContactCount: number;
};

const INITIAL_VALUES: StepValues = {
  wifiNetworkName: '',
  wifiPassword: '',
  wifiLocation: '',
  accessLabel: '',
  accessCode: '',
  accessLocation: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  insurancePhone: '',
  emergencyName: '',
  emergencyRole: '',
  emergencyPhone: '',
  deviceName: '',
  deviceCategory: 'Router',
  deviceLocation: '',
};

export function QuickStartScreen({ property, onDone, initialStep = null }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<QuickStartChecklistProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<ReadinessSetupStep | null>(null);
  const [skippedSteps, setSkippedSteps] = useState<Set<ReadinessSetupStep>>(new Set());
  const [values, setValues] = useState<StepValues>(INITIAL_VALUES);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [repo, savedState] = await Promise.all([
        getHomeVaultRepository(),
        readReadinessSetupState(),
      ]);
      const snapshot = await loadProgressSnapshot(repo, property.id);
      const nextProgress = getQuickStartChecklistProgress(snapshot);
      const normalizedSkipped = savedState.skippedSteps.filter((step) => !nextProgress.done.has(step));
      const availableSteps = getAvailableSteps(nextProgress, normalizedSkipped);
      const preferredStep =
        choosePreferredStep({
          initialStep,
          savedStep: savedState.currentStep,
          availableSteps,
        }) ?? null;

      if (!isMounted) return;

      setProgress(nextProgress);
      setSkippedSteps(new Set(normalizedSkipped));
      setCurrentStep(preferredStep);
      setLoading(false);
      await writeReadinessSetupState({
        currentStep: preferredStep,
        skippedSteps: normalizedSkipped,
      });
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [initialStep, property.id]);

  const stepStatus = useMemo(() => {
    const done = progress?.done ?? new Set<string>();
    return SETUP_CHECKLIST_STEPS.map((step) => ({
      ...step,
      isDone: done.has(step.key),
      isSkipped: skippedSteps.has(step.key),
      isCurrent: currentStep === step.key,
    }));
  }, [currentStep, progress, skippedSteps]);

  const completedCount = progress?.doneCount ?? 0;
  const totalSteps = SETUP_CHECKLIST_STEPS.length;
  const currentStepMeta = SETUP_CHECKLIST_STEPS.find((step) => step.key === currentStep) ?? null;
  const emergencyContactCount =
    progress && currentStep === 'emergency' ? progress.emergencyContactCount : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.loadingText}>Loading readiness setup…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentStepMeta || !progress) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.completionState}>
          <Text style={styles.heading}>Your essentials are in place</Text>
          <Text style={styles.subheading}>
            Wi-Fi, access details, insurance, at least three emergency contacts, and a key device
            are already saved in the household guide.
          </Text>
          <Pressable
            onPress={() => void handleFinish(onDone)}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Open dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <Text style={styles.kicker}>Readiness setup</Text>
        <Text style={styles.heading}>Add the essentials first</Text>
        <Text style={styles.subheading}>
          Build the records someone would need in the first ten minutes of a handoff or emergency.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressHeading}>Essentials saved</Text>
            <Text style={styles.progressValue}>
              {completedCount} of {totalSteps}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${(completedCount / totalSteps) * 100}%` }]}
            />
          </View>
          <View style={styles.stepStatusList}>
            {stepStatus.map((step) => (
              <View key={step.key} style={styles.stepStatusRow}>
                <View
                  style={[
                    styles.stepStatusDot,
                    step.isDone ? styles.stepStatusDotDone : null,
                    step.isSkipped ? styles.stepStatusDotSkipped : null,
                    step.isCurrent ? styles.stepStatusDotCurrent : null,
                  ]}
                />
                <Text
                  style={[
                    styles.stepStatusLabel,
                    step.isDone ? styles.stepStatusLabelDone : null,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.stepStatusMeta}>
                  {step.isDone
                    ? 'Saved'
                    : step.isSkipped
                      ? 'Skipped'
                      : step.isCurrent
                        ? 'Now'
                        : 'Next'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepLabel}>Current step</Text>
          <Text style={styles.stepTitle}>{currentStepMeta.label}</Text>
          <Text style={styles.stepHint}>{currentStepMeta.hint}</Text>

          {currentStep === 'wifi' ? (
            <FormFields
              fields={[
                {
                  label: 'Network name',
                  value: values.wifiNetworkName,
                  onChangeText: (value) => updateValue(setValues, 'wifiNetworkName', value),
                  placeholder: 'OakStreet-5G',
                },
                {
                  label: 'Password',
                  value: values.wifiPassword,
                  onChangeText: (value) => updateValue(setValues, 'wifiPassword', value),
                  placeholder: 'Wi-Fi password',
                },
                {
                  label: 'Router location',
                  value: values.wifiLocation,
                  onChangeText: (value) => updateValue(setValues, 'wifiLocation', value),
                  placeholder: 'Hall closet shelf',
                },
              ]}
            />
          ) : null}

          {currentStep === 'access' ? (
            <FormFields
              fields={[
                {
                  label: 'Access label',
                  value: values.accessLabel,
                  onChangeText: (value) => updateValue(setValues, 'accessLabel', value),
                  placeholder: 'Garage keypad',
                },
                {
                  label: 'Code or note',
                  value: values.accessCode,
                  onChangeText: (value) => updateValue(setValues, 'accessCode', value),
                  placeholder: '1942',
                },
                {
                  label: 'Where to find it',
                  value: values.accessLocation,
                  onChangeText: (value) => updateValue(setValues, 'accessLocation', value),
                  placeholder: 'Beside the side door',
                },
              ]}
            />
          ) : null}

          {currentStep === 'insurance' ? (
            <FormFields
              fields={[
                {
                  label: 'Insurance provider',
                  value: values.insuranceProvider,
                  onChangeText: (value) => updateValue(setValues, 'insuranceProvider', value),
                  placeholder: 'Prairie Mutual',
                },
                {
                  label: 'Policy number',
                  value: values.insurancePolicyNumber,
                  onChangeText: (value) =>
                    updateValue(setValues, 'insurancePolicyNumber', value),
                  placeholder: 'POL-883492',
                },
                {
                  label: 'Claims phone',
                  value: values.insurancePhone,
                  onChangeText: (value) => updateValue(setValues, 'insurancePhone', value),
                  placeholder: '555-0119',
                },
              ]}
            />
          ) : null}

          {currentStep === 'emergency' ? (
            <>
              <View style={styles.stepNotice}>
                <Text style={styles.stepNoticeTitle}>
                  {Math.min(emergencyContactCount, REQUIRED_EMERGENCY_CONTACTS)} of{' '}
                  {REQUIRED_EMERGENCY_CONTACTS} contacts saved
                </Text>
                <Text style={styles.stepNoticeText}>
                  Aim for one trusted person, one backup person, and one service provider so a
                  helper is not blocked by a single missed call.
                </Text>
              </View>
              <FormFields
                fields={[
                  {
                    label: 'Contact name',
                    value: values.emergencyName,
                    onChangeText: (value) => updateValue(setValues, 'emergencyName', value),
                    placeholder: 'Jamie Lee',
                  },
                  {
                    label: 'Role',
                    value: values.emergencyRole,
                    onChangeText: (value) => updateValue(setValues, 'emergencyRole', value),
                    placeholder: 'Neighbor with spare key',
                  },
                  {
                    label: 'Phone',
                    value: values.emergencyPhone,
                    onChangeText: (value) => updateValue(setValues, 'emergencyPhone', value),
                    placeholder: '555-0101',
                  },
                ]}
              />
            </>
          ) : null}

          {currentStep === 'device' ? (
            <FormFields
              fields={[
                {
                  label: 'Device name',
                  value: values.deviceName,
                  onChangeText: (value) => updateValue(setValues, 'deviceName', value),
                  placeholder: 'Main Wi-Fi router',
                },
                {
                  label: 'Device type',
                  value: values.deviceCategory,
                  onChangeText: (value) => updateValue(setValues, 'deviceCategory', value),
                  placeholder: 'Router',
                },
                {
                  label: 'Where it lives',
                  value: values.deviceLocation,
                  onChangeText: (value) => updateValue(setValues, 'deviceLocation', value),
                  placeholder: 'Office shelf beside the modem',
                },
              ]}
            />
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: 24 + insets.bottom }]}>
        <Pressable
          onPress={() =>
            void handleSkip({
              currentStep: currentStepMeta.key,
              onDone,
              progress,
              setCurrentStep,
              setSkippedSteps,
              skippedSteps,
            })
          }
          style={styles.secondaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Skip for now</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            void handleSaveStep({
              currentStep: currentStepMeta.key,
              onDone,
              progress,
              propertyId: property.id,
              setCurrentStep,
              setErrorMessage,
              setProgress,
              setSaving,
              setSkippedSteps,
              setValues,
              skippedSteps,
              values,
            })
          }
          disabled={saving}
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save and continue'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

async function handleSaveStep({
  currentStep,
  onDone,
  progress,
  propertyId,
  setCurrentStep,
  setErrorMessage,
  setProgress,
  setSaving,
  setSkippedSteps,
  setValues,
  skippedSteps,
  values,
}: {
  currentStep: ReadinessSetupStep;
  onDone: () => void | Promise<void>;
  progress: QuickStartChecklistProgress;
  propertyId: string;
  setCurrentStep: (step: ReadinessSetupStep | null) => void;
  setErrorMessage: (message: string | null) => void;
  setProgress: (progress: QuickStartChecklistProgress) => void;
  setSaving: (saving: boolean) => void;
  setSkippedSteps: (steps: Set<ReadinessSetupStep>) => void;
  setValues: Dispatch<SetStateAction<StepValues>>;
  skippedSteps: Set<ReadinessSetupStep>;
  values: StepValues;
}) {
  const validationError = validateStep(currentStep, values);
  if (validationError) {
    setErrorMessage(validationError);
    return;
  }

  setSaving(true);
  setErrorMessage(null);

  try {
    const repo = await getHomeVaultRepository();
    const existingEmergencyContacts =
      currentStep === 'emergency' ? await repo.getEmergencyContacts(propertyId) : [];

    switch (currentStep) {
      case 'wifi':
        await repo.createAccessItem(buildWifiInput(propertyId, values));
        break;
      case 'access':
        await repo.createAccessItem(buildAccessInput(propertyId, values));
        break;
      case 'insurance':
        await repo.createImportantAccount(buildInsuranceInput(propertyId, values));
        break;
      case 'emergency':
        await repo.createEmergencyContact(
          buildEmergencyInput(propertyId, values, existingEmergencyContacts.length),
        );
        break;
      case 'device':
        await repo.createAsset(buildDeviceInput(propertyId, values));
        break;
    }

    const snapshot = await loadProgressSnapshot(repo, propertyId);
    const nextProgress = getQuickStartChecklistProgress(snapshot);
    const nextSkipped = new Set(skippedSteps);
    nextSkipped.delete(currentStep);
    const availableSteps = getAvailableSteps(nextProgress, [...nextSkipped]);
    const nextStep = availableSteps[0] ?? null;

    setProgress(nextProgress);
    setSkippedSteps(nextSkipped);
    setCurrentStep(nextStep);

    await writeReadinessSetupState({
      currentStep: nextStep,
      skippedSteps: [...nextSkipped],
    });

    if (currentStep === 'emergency' && nextStep === 'emergency') {
      setValues((current) => ({
        ...current,
        emergencyName: '',
        emergencyRole: '',
        emergencyPhone: '',
      }));
    }

    if (!nextStep) {
      await handleFinish(onDone);
    }
  } catch {
    setErrorMessage('Could not save this step. Please try again.');
  } finally {
    setSaving(false);
  }
}

async function handleSkip({
  currentStep,
  onDone,
  progress,
  setCurrentStep,
  setSkippedSteps,
  skippedSteps,
}: {
  currentStep: ReadinessSetupStep;
  onDone: () => void | Promise<void>;
  progress: QuickStartChecklistProgress;
  setCurrentStep: (step: ReadinessSetupStep | null) => void;
  setSkippedSteps: (steps: Set<ReadinessSetupStep>) => void;
  skippedSteps: Set<ReadinessSetupStep>;
}) {
  const nextSkipped = new Set(skippedSteps);
  nextSkipped.add(currentStep);
  const availableSteps = getAvailableSteps(progress, [...nextSkipped]);
  const nextStep = availableSteps[0] ?? null;

  setSkippedSteps(nextSkipped);
  setCurrentStep(nextStep);
  await writeReadinessSetupState({
    currentStep: nextStep,
    skippedSteps: [...nextSkipped],
  });

  if (!nextStep) {
    await handleFinish(onDone);
  }
}

async function handleFinish(onDone: () => void | Promise<void>) {
  await clearReadinessSetupState();
  await onDone();
}

async function loadProgressSnapshot(
  repo: HomeVaultRepository,
  propertyId: string,
): Promise<SetupChecklistProgressInput> {
  const [accessItems, emergencyContacts, importantAccounts, assets] = await Promise.all([
    repo.getAccessItems(propertyId),
    repo.getEmergencyContacts(propertyId),
    repo.getImportantAccounts(propertyId),
    repo.getAssets(propertyId),
  ]);

  return {
    accessItems,
    assets,
    emergencyContacts,
    importantAccounts,
  };
}

function choosePreferredStep({
  initialStep,
  savedStep,
  availableSteps,
}: {
  initialStep: ReadinessSetupStep | null;
  savedStep: ReadinessSetupStep | null;
  availableSteps: ReadinessSetupStep[];
}) {
  if (initialStep && availableSteps.includes(initialStep)) return initialStep;
  if (savedStep && availableSteps.includes(savedStep)) return savedStep;
  return availableSteps[0];
}

function getAvailableSteps(
  progress: ReturnType<typeof getSetupChecklistProgress>,
  skippedSteps: ReadinessSetupStep[],
) {
  return SETUP_CHECKLIST_STEPS.filter(
    (step) => !progress.done.has(step.key) && !skippedSteps.includes(step.key),
  ).map((step) => step.key);
}

export function getQuickStartChecklistProgress(input: SetupChecklistProgressInput) {
  const base = getSetupChecklistProgress(input);

  if (input.emergencyContacts.length >= REQUIRED_EMERGENCY_CONTACTS) {
    return {
      ...base,
      emergencyContactCount: input.emergencyContacts.length,
    };
  }

  const done = new Set(base.done);
  done.delete('emergency');
  const incomplete = SETUP_CHECKLIST_STEPS.filter((step) => !done.has(step.key));

  return {
    ...base,
    done,
    doneCount: done.size,
    emergencyContactCount: input.emergencyContacts.length,
    incomplete,
    next: incomplete[0] ?? null,
  };
}

function buildWifiInput(propertyId: string, values: StepValues): CreateAccessItemInput {
  return {
    propertyId,
    category: 'wifi',
    label: 'Wi-Fi access',
    username: values.wifiNetworkName.trim(),
    accessCode: values.wifiPassword.trim(),
    location: toOptionalString(values.wifiLocation),
    linkedDocumentIds: [],
    lastVerifiedAt: new Date().toISOString().slice(0, 10),
  };
}

function buildAccessInput(propertyId: string, values: StepValues): CreateAccessItemInput {
  return {
    propertyId,
    category: 'other',
    label: values.accessLabel.trim(),
    accessCode: values.accessCode.trim(),
    location: toOptionalString(values.accessLocation),
    linkedDocumentIds: [],
  };
}

function buildInsuranceInput(propertyId: string, values: StepValues): CreateImportantAccountInput {
  return {
    propertyId,
    kind: 'insurance',
    providerName: values.insuranceProvider.trim(),
    label: 'Home insurance',
    accountNumber: toOptionalString(values.insurancePolicyNumber),
    phone: toOptionalString(values.insurancePhone),
    linkedDocumentIds: [],
  };
}

function buildEmergencyInput(
  propertyId: string,
  values: StepValues,
  existingCount: number,
): CreateEmergencyContactInput {
  return {
    propertyId,
    name: values.emergencyName.trim(),
    role: values.emergencyRole.trim(),
    priority: getEmergencyPriorityForCount(existingCount),
    phone: toOptionalString(values.emergencyPhone),
  };
}

export function getEmergencyPriorityForCount(
  existingCount: number,
): CreateEmergencyContactInput['priority'] {
  if (existingCount === 0) {
    return 'primary';
  }

  if (existingCount === 1) {
    return 'secondary';
  }

  if (existingCount === 2) {
    return 'service_provider';
  }

  return 'other';
}

function buildDeviceInput(propertyId: string, values: StepValues): CreateAssetInput {
  return {
    propertyId,
    name: values.deviceName.trim(),
    category: values.deviceCategory.trim() || 'Router',
    status: 'ready',
    notes: toOptionalString(values.deviceLocation),
  };
}

function validateStep(step: ReadinessSetupStep, values: StepValues) {
  switch (step) {
    case 'wifi':
      if (!values.wifiNetworkName.trim() || !values.wifiPassword.trim()) {
        return 'Add the network name and password before continuing.';
      }
      return null;
    case 'access':
      if (!values.accessLabel.trim() || !values.accessCode.trim()) {
        return 'Add an access label and code before continuing.';
      }
      return null;
    case 'insurance':
      if (!values.insuranceProvider.trim()) {
        return 'Add the insurance provider before continuing.';
      }
      return null;
    case 'emergency':
      if (!values.emergencyName.trim() || !values.emergencyRole.trim()) {
        return 'Add a contact name and role before continuing.';
      }
      return null;
    case 'device':
      if (!values.deviceName.trim()) {
        return 'Add a router or device name before continuing.';
      }
      return null;
  }
}

function toOptionalString(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function updateValue(
  setValues: Dispatch<SetStateAction<StepValues>>,
  key: keyof StepValues,
  value: string,
) {
  setValues((current) => ({ ...current, [key]: value }));
}

function FormFields({
  fields,
}: {
  fields: Array<{
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
  }>;
}) {
  return (
    <View style={styles.form}>
      {fields.map((field) => (
        <View key={field.label} style={styles.field}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <TextInput
            accessibilityLabel={field.label}
            onChangeText={field.onChangeText}
            placeholder={field.placeholder}
            placeholderTextColor="#8B98A1"
            style={styles.input}
            value={field.value}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  completionState: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    padding: 28,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 18,
    gap: 6,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heading: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  subheading: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 14,
  },
  progressCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 16,
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressHeading: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  progressValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.green,
  },
  stepStatusList: {
    gap: 8,
  },
  stepStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.line,
  },
  stepStatusDotDone: {
    backgroundColor: colors.green,
  },
  stepStatusDotSkipped: {
    backgroundColor: colors.amber,
  },
  stepStatusDotCurrent: {
    backgroundColor: colors.blue,
  },
  stepStatusLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  stepStatusLabelDone: {
    color: colors.muted,
  },
  stepStatusMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 16,
    gap: 12,
  },
  stepLabel: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  stepHint: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  stepNotice: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
    padding: 12,
    gap: 4,
  },
  stepNoticeTitle: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '900',
  },
  stepNoticeText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  form: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    backgroundColor: colors.page,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '900',
  },
});
