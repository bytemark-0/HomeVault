import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { EmergencyContact, Property } from '@homevault/domain';
import {
  HOMEVAULT_CARE_CARD_TEMPLATES,
  HOMEVAULT_CAREGIVER_PLAN_AUDIENCES,
  buildHomeVaultCareCard,
  buildHomeVaultCaregiverPlan,
  formatHomeVaultCaregiverPlan,
  type HomeVaultCareCardTemplateKey,
  type HomeVaultCaregiverAudienceKey,
} from '@homevault/export';

import { colors } from '../theme/colors';
import { confirmLocalStepUp } from '../utils/localStepUpAuth';
import {
  createCaregiverPlanFileName,
  shareCareCardFile,
} from '../utils/careCardExport';

type CareCardsScreenProps = {
  emergencyContacts: EmergencyContact[];
  onBack: () => void;
  onShared: (message: string) => void;
  property: Property;
};

type DraftState = {
  subjectName: string;
  subjectDescriptor: string;
  medicationLabel: string;
  medicationDose: string;
  medicationSchedule: string;
  medicationInstructions: string;
  routineLabel: string;
  routineTimeLabel: string;
  routineDetail: string;
  pickupRule: string;
  schoolDetail: string;
  providerLabel: string;
  providerRole: string;
  providerPhone: string;
  criticalNote: string;
};

const TEMPLATE_FIELD_HINTS: Record<
  HomeVaultCareCardTemplateKey,
  {
    descriptorPlaceholder: string;
    medicationPlaceholder: string;
    pickupPlaceholder: string;
    providerPlaceholder: string;
    routinePlaceholder: string;
  }
> = {
  child: {
    descriptorPlaceholder: 'Age, grade, or caregiver context',
    medicationPlaceholder: 'Daily allergy medicine',
    pickupPlaceholder: 'Only Jamie or Chris can pick up from aftercare.',
    providerPlaceholder: 'Pediatrician',
    routinePlaceholder: 'After-school snack',
  },
  pet: {
    descriptorPlaceholder: 'Dog, cat, or other pet details',
    medicationPlaceholder: 'Morning insulin or calming medication',
    pickupPlaceholder: 'Use the side gate and blue leash for bathroom breaks.',
    providerPlaceholder: 'Veterinarian',
    routinePlaceholder: 'Morning walk',
  },
  elder: {
    descriptorPlaceholder: 'Mobility, support, or household context',
    medicationPlaceholder: 'Evening medication',
    pickupPlaceholder: 'Only release keys or transport plans to approved family members.',
    providerPlaceholder: 'Primary care clinic',
    routinePlaceholder: 'Lunch and medication check',
  },
  medical_dependent: {
    descriptorPlaceholder: 'Condition, monitoring, or support context',
    medicationPlaceholder: 'Rescue inhaler or scheduled medication',
    pickupPlaceholder: 'Only approved adults may handle transport or discharge pickup.',
    providerPlaceholder: 'Specialist or pharmacy',
    routinePlaceholder: 'Bedtime monitoring',
  },
};

const RECOMMENDED_AUDIENCE_BY_TEMPLATE: Record<
  HomeVaultCareCardTemplateKey,
  HomeVaultCaregiverAudienceKey
> = {
  child: 'grandparent',
  pet: 'pet_sitter',
  elder: 'elder_helper',
  medical_dependent: 'elder_helper',
};

const EXPIRY_DAY_OPTIONS = [1, 3, 7, 14];

export function CareCardsScreen({
  emergencyContacts,
  onBack,
  onShared,
  property,
}: CareCardsScreenProps) {
  const [templateKey, setTemplateKey] = useState<HomeVaultCareCardTemplateKey>('child');
  const [caregiverAudience, setCaregiverAudience] = useState<HomeVaultCaregiverAudienceKey>(
    RECOMMENDED_AUDIENCE_BY_TEMPLATE.child,
  );
  const [draft, setDraft] = useState<DraftState>({
    subjectName: '',
    subjectDescriptor: '',
    medicationLabel: '',
    medicationDose: '',
    medicationSchedule: '',
    medicationInstructions: '',
    routineLabel: '',
    routineTimeLabel: '',
    routineDetail: '',
    pickupRule: '',
    schoolDetail: '',
    providerLabel: '',
    providerRole: '',
    providerPhone: '',
    criticalNote: '',
  });
  const [expiryDays, setExpiryDays] = useState<number>(
    getDefaultExpiryDays(RECOMMENDED_AUDIENCE_BY_TEMPLATE.child),
  );
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const templateHints = TEMPLATE_FIELD_HINTS[templateKey];

  useEffect(() => {
    const recommendedAudience = RECOMMENDED_AUDIENCE_BY_TEMPLATE[templateKey];
    setCaregiverAudience(recommendedAudience);
    setExpiryDays(getDefaultExpiryDays(recommendedAudience));
  }, [templateKey]);

  const selectedAudience = useMemo(
    () =>
      HOMEVAULT_CAREGIVER_PLAN_AUDIENCES.find((audience) => audience.key === caregiverAudience) ??
      HOMEVAULT_CAREGIVER_PLAN_AUDIENCES[0],
    [caregiverAudience],
  );
  const careCard = useMemo(
    () =>
      buildHomeVaultCareCard({
        property,
        template: templateKey,
        subjectName: draft.subjectName.trim() || 'Untitled care subject',
        subjectDescriptor: cleanOptional(draft.subjectDescriptor),
        medications: draft.medicationLabel.trim()
          ? [
              {
                label: draft.medicationLabel.trim(),
                dose: cleanOptional(draft.medicationDose),
                schedule: cleanOptional(draft.medicationSchedule),
                instructions: cleanOptional(draft.medicationInstructions),
                isCritical: templateKey === 'medical_dependent',
              },
            ]
          : [],
        routines:
          draft.routineLabel.trim() || draft.routineDetail.trim()
            ? [
                {
                  label: draft.routineLabel.trim() || 'Daily routine',
                  timeLabel: cleanOptional(draft.routineTimeLabel),
                  detail: draft.routineDetail.trim() || 'Routine details still need to be filled in.',
                },
              ]
            : [],
        pickupRules: draft.pickupRule.trim() ? [draft.pickupRule.trim()] : [],
        schoolDetails: draft.schoolDetail.trim() ? [draft.schoolDetail.trim()] : [],
        providerContacts:
          draft.providerLabel.trim() || draft.providerRole.trim() || draft.providerPhone.trim()
            ? [
                {
                  label: draft.providerLabel.trim() || 'Provider contact',
                  role: draft.providerRole.trim() || 'Care provider',
                  phone: cleanOptional(draft.providerPhone),
                },
              ]
            : [],
        emergencyContacts,
        criticalNotes: draft.criticalNote.trim() ? [draft.criticalNote.trim()] : [],
      }),
    [draft, emergencyContacts, property, templateKey],
  );
  const caregiverPlan = useMemo(
    () =>
      buildHomeVaultCaregiverPlan({
        careCard,
        audience: caregiverAudience,
        expiresInDays: expiryDays,
      }),
    [careCard, caregiverAudience, expiryDays],
  );

  const canExport =
    draft.subjectName.trim().length > 0 &&
    (careCard.summary.routineCount > 0 ||
      careCard.summary.medicationCount > 0 ||
      careCard.summary.providerContactCount > 0 ||
      careCard.summary.pickupRuleCount > 0 ||
      careCard.summary.schoolDetailCount > 0 ||
      careCard.summary.criticalNoteCount > 0 ||
      careCard.summary.emergencyContactCount > 0);

  async function handleExport() {
    if (!canExport || isExporting) {
      return;
    }

    try {
      if (careCard.sensitivity.level === 'high' && Platform.OS !== 'web') {
        const confirmed = await confirmLocalStepUp({
          alertTitle: 'Export sensitive caregiver plan?',
          alertMessage:
            'This caregiver plan may include medication, pickup, provider, or escalation details. If device authentication is unavailable in this preview, confirm locally before exporting it to a temporary helper.',
          confirmLabel: 'Export',
          authPromptMessage: `Authenticate to export ${careCard.subject.name} caregiver plan`,
        });

        if (!confirmed) {
          return;
        }
      }

      setIsExporting(true);
      const result = await shareCareCardFile(
        formatHomeVaultCaregiverPlan(caregiverPlan),
        createCaregiverPlanFileName(caregiverPlan, 'txt'),
      );
      const message =
        result === 'downloaded' ? 'Caregiver plan downloaded.' : 'Caregiver plan shared.';

      setExportStatus(message);
      onShared(message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not export the caregiver plan.';

      setExportStatus(message);
      onShared(message);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Care handoff</Text>
          <Text style={styles.title}>Prepare a caregiver plan</Text>
        </View>
        <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.noticePanel}>
        <Text style={styles.noticeTitle}>Start with a real template</Text>
        <Text style={styles.noticeText}>
          Use these templates for dependent, pet, elder, or medical-support handoffs so a helper
          gets a scoped plan with the care details they need and the boundaries they must respect.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Choose a template</Text>
        {HOMEVAULT_CARE_CARD_TEMPLATES.map((template) => {
          const selected = template.key === templateKey;

          return (
            <Pressable
              key={template.key}
              onPress={() => setTemplateKey(template.key)}
              style={[styles.templateCard, selected && styles.templateCardSelected]}
              accessibilityRole="button"
              accessibilityLabel={`care-template-${template.key}`}
              testID={`care-template-${template.key}`}
            >
              <View style={styles.templateHeader}>
                <Text style={styles.templateTitle}>{template.label}</Text>
                <Text style={[styles.templateBadge, selected && styles.templateBadgeSelected]}>
                  {selected ? 'Selected' : 'Use template'}
                </Text>
              </View>
              <Text style={styles.templateDetail}>{template.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Choose a helper audience</Text>
        <Text style={styles.previewText}>
          Pick the temporary helper who should receive this plan. HomeVault will adjust scope,
          review prompts, and default rotation timing for that audience.
        </Text>
        {HOMEVAULT_CAREGIVER_PLAN_AUDIENCES.map((audience) => {
          const selected = audience.key === caregiverAudience;
          const recommended = audience.key === RECOMMENDED_AUDIENCE_BY_TEMPLATE[templateKey];

          return (
            <Pressable
              key={audience.key}
              onPress={() => {
                setCaregiverAudience(audience.key);
                setExpiryDays(audience.defaultExpiryDays);
              }}
              style={[styles.templateCard, selected && styles.templateCardSelected]}
              accessibilityRole="button"
              accessibilityLabel={`caregiver-audience-${audience.key}`}
              testID={`caregiver-audience-${audience.key}`}
            >
              <View style={styles.templateHeader}>
                <Text style={styles.templateTitle}>{audience.label}</Text>
                <Text style={[styles.templateBadge, selected && styles.templateBadgeSelected]}>
                  {selected ? 'Selected' : recommended ? 'Recommended' : 'Available'}
                </Text>
              </View>
              <Text style={styles.templateDetail}>{audience.description}</Text>
              <Text style={styles.templateDetail}>
                Default rotation: {audience.defaultExpiryDays} day
                {audience.defaultExpiryDays === 1 ? '' : 's'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Core details</Text>
        <Field
          label="Subject name"
          placeholder="Avery, Mochi, Dad, Jordan"
          value={draft.subjectName}
          onChangeText={(subjectName) => setDraft((current) => ({ ...current, subjectName }))}
        />
        <Field
          label="Descriptor"
          placeholder={templateHints.descriptorPlaceholder}
          value={draft.subjectDescriptor}
          onChangeText={(subjectDescriptor) =>
            setDraft((current) => ({ ...current, subjectDescriptor }))
          }
        />
        <Field
          label="Medication"
          placeholder={templateHints.medicationPlaceholder}
          value={draft.medicationLabel}
          onChangeText={(medicationLabel) =>
            setDraft((current) => ({ ...current, medicationLabel }))
          }
        />
        <Field
          label="Dose"
          placeholder="1 tablet, 2 puffs, 5 ml"
          value={draft.medicationDose}
          onChangeText={(medicationDose) =>
            setDraft((current) => ({ ...current, medicationDose }))
          }
        />
        <Field
          label="Schedule"
          placeholder="8:00 AM and 8:00 PM"
          value={draft.medicationSchedule}
          onChangeText={(medicationSchedule) =>
            setDraft((current) => ({ ...current, medicationSchedule }))
          }
        />
        <Field
          label="Medication instructions"
          placeholder="Take with food, refrigerate, or call if missed."
          value={draft.medicationInstructions}
          onChangeText={(medicationInstructions) =>
            setDraft((current) => ({ ...current, medicationInstructions }))
          }
          multiline
        />
        <Field
          label="Routine label"
          placeholder={templateHints.routinePlaceholder}
          value={draft.routineLabel}
          onChangeText={(routineLabel) =>
            setDraft((current) => ({ ...current, routineLabel }))
          }
        />
        <Field
          label="Routine time"
          placeholder="3:30 PM"
          value={draft.routineTimeLabel}
          onChangeText={(routineTimeLabel) =>
            setDraft((current) => ({ ...current, routineTimeLabel }))
          }
        />
        <Field
          label="Routine detail"
          placeholder="What should happen, in what order, and what to avoid."
          value={draft.routineDetail}
          onChangeText={(routineDetail) =>
            setDraft((current) => ({ ...current, routineDetail }))
          }
          multiline
        />
        <Field
          label="Pickup or handoff rule"
          placeholder={templateHints.pickupPlaceholder}
          value={draft.pickupRule}
          onChangeText={(pickupRule) => setDraft((current) => ({ ...current, pickupRule }))}
          multiline
        />
        <Field
          label="School or activity detail"
          placeholder="School pickup window, aftercare contact, activity drop-off, or dismissal instructions."
          value={draft.schoolDetail}
          onChangeText={(schoolDetail) => setDraft((current) => ({ ...current, schoolDetail }))}
          multiline
        />
        <Field
          label="Provider contact"
          placeholder={templateHints.providerPlaceholder}
          value={draft.providerLabel}
          onChangeText={(providerLabel) =>
            setDraft((current) => ({ ...current, providerLabel }))
          }
        />
        <Field
          label="Provider role"
          placeholder="Pediatrician, vet, pharmacy, specialist"
          value={draft.providerRole}
          onChangeText={(providerRole) =>
            setDraft((current) => ({ ...current, providerRole }))
          }
        />
        <Field
          label="Provider phone"
          placeholder="555-0102"
          value={draft.providerPhone}
          onChangeText={(providerPhone) =>
            setDraft((current) => ({ ...current, providerPhone }))
          }
        />
        <Field
          label="Critical note"
          placeholder="Allergies, escalation rules, behavior triggers, or the detail a helper must not miss."
          value={draft.criticalNote}
          onChangeText={(criticalNote) =>
            setDraft((current) => ({ ...current, criticalNote }))
          }
          multiline
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Linked support contacts</Text>
        <Text style={styles.previewText}>
          This caregiver plan pulls in the household emergency contacts already saved in HomeVault
          so the helper has named escalation paths without opening the full household system.
        </Text>
        {emergencyContacts.length > 0 ? (
          emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactMeta}>
                {[contact.role, contact.phone].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.missingText}>
            No emergency contacts are saved yet. The care card will flag this as a high-risk gap.
          </Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Caregiver-plan preview</Text>
        <Text style={styles.previewText}>{caregiverPlan.audience.description}</Text>
        <Text style={styles.previewMeta}>
          {careCard.sensitivity.label} · Caregiver handoff defaults to{' '}
          {careCard.shareDefaults.caregiverHandoff.audienceLabel} · Emergency snapshot defaults to{' '}
          {careCard.shareDefaults.emergencySnapshot.audienceLabel}
        </Text>
        <Text style={styles.previewMeta}>
          Expires in {caregiverPlan.summary.expiresInDays} day
          {caregiverPlan.summary.expiresInDays === 1 ? '' : 's'} on{' '}
          {caregiverPlan.expiresAt.slice(0, 10)}. Rotate or reissue this plan after schedule,
          medication, or caregiver changes.
        </Text>
        <Text style={styles.previewMeta}>
          {caregiverPlan.summary.medicationCount} medication · {caregiverPlan.summary.routineCount}{' '}
          routine · {caregiverPlan.summary.providerContactCount} provider contact ·{' '}
          {caregiverPlan.summary.pickupContactCount} pickup contact
          {caregiverPlan.summary.pickupContactCount === 1 ? '' : 's'} ·{' '}
          {caregiverPlan.summary.schoolDetailCount} school detail
          {caregiverPlan.summary.schoolDetailCount === 1 ? '' : 's'}
        </Text>
        <Text style={styles.previewMeta}>{careCard.sensitivity.detail}</Text>
        {careCard.missingPrompts.length > 0 ? (
          <View style={styles.warningPanel}>
            <Text style={styles.warningTitle}>Fill these before a real handoff</Text>
            {careCard.missingPrompts.map((prompt) => (
              <Text key={prompt.id} style={styles.warningText}>
                {prompt.severity === 'high' ? 'High' : 'Medium'}: {prompt.label} — {prompt.detail}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.readyPanel}>
            <Text style={styles.readyTitle}>Core care details are present</Text>
            <Text style={styles.readyText}>
              This card has enough structure to share as a caregiver handoff.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Helper scope and review</Text>
        <Text style={styles.previewText}>
          {selectedAudience.label} plans make permissions explicit so a temporary caregiver knows
          what they can handle and what still requires the household organizer.
        </Text>
        <View style={styles.scopePanel}>
          <Text style={styles.scopeTitle}>Allowed actions</Text>
          {caregiverPlan.scope.allowedActions.map((item) => (
            <Text key={item} style={styles.scopeText}>
              - {item}
            </Text>
          ))}
        </View>
        <View style={styles.scopePanel}>
          <Text style={styles.scopeTitle}>Not authorized</Text>
          {caregiverPlan.scope.disallowedActions.map((item) => (
            <Text key={item} style={styles.scopeText}>
              - {item}
            </Text>
          ))}
        </View>
        <View style={styles.scopePanel}>
          <Text style={styles.scopeTitle}>Pre-handoff review</Text>
          {caregiverPlan.reviewPrompts.map((item) => (
            <Text key={item} style={styles.scopeText}>
              - {item}
            </Text>
          ))}
        </View>
        <View style={styles.scopePanel}>
          <Text style={styles.scopeTitle}>Travel or transition prompts</Text>
          {caregiverPlan.travelTransitionPrompts.map((item) => (
            <Text key={item} style={styles.scopeText}>
              - {item}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Rotation window</Text>
        <Text style={styles.previewText}>
          Choose how long this short-term plan should stay valid before you refresh it.
        </Text>
        <View style={styles.optionRow}>
          {EXPIRY_DAY_OPTIONS.map((option) => {
            const selected = option === expiryDays;

            return (
              <Pressable
                key={option}
                onPress={() => setExpiryDays(option)}
                style={[styles.optionChip, selected && styles.optionChipSelected]}
                accessibilityRole="button"
              >
                <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                  {option} day{option === 1 ? '' : 's'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.exportPanel}>
        <Text style={styles.sectionTitle}>Export caregiver plan</Text>
        <Text style={styles.previewText}>
          {canExport
            ? Platform.OS === 'web'
              ? 'Download a readable caregiver plan for a trusted helper.'
              : 'Share a readable caregiver plan for a trusted helper.'
            : 'Add a subject name and at least one care detail before exporting.'}
        </Text>
        {exportStatus ? <Text style={styles.exportStatus}>{exportStatus}</Text> : null}
        <Pressable
          onPress={() => void handleExport()}
          disabled={!canExport || isExporting}
          style={[styles.exportButton, (!canExport || isExporting) && styles.exportButtonDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.exportButtonText}>
            {isExporting
              ? 'Exporting...'
              : Platform.OS === 'web'
                ? 'Download caregiver plan'
                : 'Share caregiver plan'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  multiline,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function cleanOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getDefaultExpiryDays(audienceKey: HomeVaultCaregiverAudienceKey) {
  return (
    HOMEVAULT_CAREGIVER_PLAN_AUDIENCES.find((audience) => audience.key === audienceKey)
      ?.defaultExpiryDays ?? HOMEVAULT_CAREGIVER_PLAN_AUDIENCES[0]?.defaultExpiryDays ?? 7
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 112,
    gap: 14,
  },
  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  backButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  noticePanel: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  noticeText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  panel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  templateCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    padding: 12,
    gap: 6,
  },
  templateCardSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  templateTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
  },
  templateBadge: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  templateBadgeSelected: {
    color: colors.blue,
  },
  templateDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  previewText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  previewMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  contactRow: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
    gap: 4,
  },
  contactName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  contactMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  missingText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  warningPanel: {
    borderRadius: 8,
    borderColor: colors.amber,
    borderWidth: 1,
    backgroundColor: colors.amberSoft,
    padding: 12,
    gap: 6,
  },
  warningTitle: {
    color: colors.amber,
    fontSize: 13,
    fontWeight: '900',
  },
  warningText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  readyPanel: {
    borderRadius: 8,
    borderColor: '#B8D7CB',
    borderWidth: 1,
    backgroundColor: colors.greenSoft,
    padding: 12,
    gap: 6,
  },
  readyTitle: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '900',
  },
  readyText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  scopePanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    padding: 12,
    gap: 6,
  },
  scopeTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  scopeText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  optionChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  optionChipTextSelected: {
    color: colors.blue,
  },
  exportPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  exportStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  exportButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonDisabled: {
    opacity: 0.45,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
