import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { HomeVaultItemShareAudienceKey } from '@homevault/export';
import { colors } from '../theme/colors';
import type { ItemShareDraft, ItemShareFieldOption } from '../utils/itemShare';

type ItemShareScreenProps = {
  audienceKey: HomeVaultItemShareAudienceKey;
  audienceOptions: Array<{ key: HomeVaultItemShareAudienceKey; label: string }>;
  canExport: boolean;
  draft: ItemShareDraft;
  exportLabel: string;
  exportStatus: string | null;
  expiryDays: number;
  onAudienceChange: (audienceKey: HomeVaultItemShareAudienceKey) => void;
  onBack: () => void;
  onExpiryDaysChange: (days: number) => void;
  onExport: () => void;
  onFieldToggle: (fieldId: string) => void;
  onPassphraseChange: (value: string) => void;
  onSenderLabelChange: (value: string) => void;
  passphrase: string;
  selectedFieldIds: string[];
  senderLabel: string;
  supportMessage: string | null;
};

const expiryOptions = [
  { label: '1 day', value: 1 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
];

export function ItemShareScreen({
  audienceKey,
  audienceOptions,
  canExport,
  draft,
  exportLabel,
  exportStatus,
  expiryDays,
  onAudienceChange,
  onBack,
  onExpiryDaysChange,
  onExport,
  onFieldToggle,
  onPassphraseChange,
  onSenderLabelChange,
  passphrase,
  selectedFieldIds,
  senderLabel,
  supportMessage,
}: ItemShareScreenProps) {
  const selectedCount = selectedFieldIds.length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>Encrypted item share</Text>
        <Text style={styles.title}>{draft.title}</Text>
        <Text style={styles.subtitle}>{draft.subtitle}</Text>
      </View>

      <View style={styles.noticePanel}>
        <Text style={styles.noticeTitle}>Read-only handoff</Text>
        <Text style={styles.noticeText}>{draft.warning}</Text>
        <Text style={styles.noticeText}>
          Recipients need both the bundle file and the passphrase. Send those separately.
        </Text>
      </View>

      {supportMessage ? (
        <View style={styles.supportPanel}>
          <Text style={styles.supportTitle}>Export limitation</Text>
          <Text style={styles.supportText}>{supportMessage}</Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Audience preset</Text>
        <Text style={styles.sectionMeta}>Choose who this bundle is for before trimming fields.</Text>
        <View style={styles.choiceGrid}>
          {audienceOptions.map((audience) => {
            const selected = audience.key === audienceKey;
            return (
              <Pressable
                key={audience.key}
                onPress={() => onAudienceChange(audience.key)}
                style={[styles.choiceCard, selected && styles.choiceCardSelected]}
                accessibilityRole="button"
              >
                <Text style={[styles.choiceTitle, selected && styles.choiceTitleSelected]}>
                  {audience.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Included fields</Text>
        <Text style={styles.sectionMeta}>
          {selectedCount} of {draft.fieldOptions.length} optional fields included.
        </Text>
        {draft.fieldOptions.map((field) => {
          const selected = selectedFieldIds.includes(field.id);

          return (
            <Pressable
              key={field.id}
              onPress={() => onFieldToggle(field.id)}
              style={[styles.fieldCard, selected && styles.fieldCardSelected]}
              accessibilityRole="button"
            >
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldTitle}>{field.label}</Text>
                <Text style={[styles.fieldBadge, selected && styles.fieldBadgeSelected]}>
                  {selected ? 'Included' : 'Omitted'}
                </Text>
              </View>
              <Text style={styles.fieldValue}>{field.value}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Bundle settings</Text>
        <Text style={styles.inputLabel}>Sender label</Text>
        <TextInput
          value={senderLabel}
          onChangeText={onSenderLabelChange}
          placeholder="Who is sending this?"
          style={styles.input}
          autoCapitalize="words"
        />
        <Text style={styles.inputHint}>
          This shows up in provenance so the recipient knows who prepared the bundle.
        </Text>

        <Text style={styles.inputLabel}>Passphrase</Text>
        <TextInput
          value={passphrase}
          onChangeText={onPassphraseChange}
          placeholder="Create a share passphrase"
          style={styles.input}
          autoCapitalize="none"
          secureTextEntry
        />
        <Text style={styles.inputHint}>
          Use at least 8 characters and send it separately from the file.
        </Text>

        <Text style={styles.inputLabel}>Expiry</Text>
        <View style={styles.choiceGrid}>
          {expiryOptions.map((option) => {
            const selected = option.value === expiryDays;
            return (
              <Pressable
                key={option.value}
                onPress={() => onExpiryDaysChange(option.value)}
                style={[styles.choiceCard, selected && styles.choiceCardSelected]}
                accessibilityRole="button"
              >
                <Text style={[styles.choiceTitle, selected && styles.choiceTitleSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <Text style={styles.previewText}>
          Audience: {audienceOptions.find((audience) => audience.key === audienceKey)?.label ?? audienceKey}
        </Text>
        <Text style={styles.previewText}>Optional fields included: {selectedCount}</Text>
        <Text style={styles.previewText}>Linked records referenced: {draft.linkedRecordIds.length}</Text>
        <Text style={styles.previewText}>Read-only expiry: {expiryDays} day{expiryDays === 1 ? '' : 's'}</Text>
      </View>

      <Pressable
        onPress={onExport}
        disabled={!canExport}
        style={[styles.exportButton, !canExport && styles.exportButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.exportButtonText}>{exportLabel}</Text>
      </Pressable>
      {exportStatus ? <Text style={styles.exportStatus}>{exportStatus}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  header: {
    minHeight: 58,
    justifyContent: 'center',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  heroPanel: {
    borderRadius: 8,
    backgroundColor: colors.ink,
    padding: 18,
    gap: 8,
  },
  kicker: {
    color: '#B9C4C9',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: '#D6E0E5',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  noticePanel: {
    borderRadius: 8,
    borderColor: '#E6C47A',
    borderWidth: 1,
    backgroundColor: colors.amberSoft,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    color: colors.amber,
    fontSize: 13,
    fontWeight: '900',
  },
  noticeText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  supportPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 6,
  },
  supportTitle: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
  },
  supportText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
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
    fontSize: 14,
    fontWeight: '900',
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceCard: {
    minHeight: 36,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.page,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCardSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  choiceTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  choiceTitleSelected: {
    color: colors.blue,
  },
  fieldCard: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  fieldCardSelected: {
    borderTopColor: colors.blue,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  fieldTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },
  fieldBadge: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  fieldBadgeSelected: {
    color: colors.blue,
  },
  fieldValue: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  inputHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  previewText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  exportButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonDisabled: {
    backgroundColor: '#A9BBB4',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  exportStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
});
