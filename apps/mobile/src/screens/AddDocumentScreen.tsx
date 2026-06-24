import { useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { DocumentAttachment, DocumentRecord, RoomArea } from '@homevault/domain';
import type { CreateDocumentInput, UpdateDocumentInput } from '@homevault/database';

import type { AssetListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type AddDocumentScreenProps = {
  propertyId: string;
  assets: AssetListItem[];
  rooms?: RoomArea[];
  document?: DocumentRecord;
  initialLinkedRecordId?: string;
  onCancel: () => void;
  onSave: (input: CreateDocumentInput | UpdateDocumentInput) => Promise<void>;
};

type FormState = {
  title: string;
  type: DocumentRecord['type'];
  linkedRecordIds: string[];
  date: string;
  vendor: string;
  amount: string;
  attachment?: DocumentAttachment;
  filePath: string;
  ocrText: string;
};

type PickerStep = 'education' | 'picking' | null;

const documentTypes: Array<{ label: string; value: DocumentRecord['type'] }> = [
  { label: 'Receipt', value: 'receipt' },
  { label: 'Manual', value: 'manual' },
  { label: 'Warranty', value: 'warranty' },
  { label: 'Invoice', value: 'invoice' },
  { label: 'Report', value: 'report' },
];

export function AddDocumentScreen({
  propertyId,
  assets,
  rooms = [],
  document,
  initialLinkedRecordId,
  onCancel,
  onSave,
}: AddDocumentScreenProps) {
  const [form, setForm] = useState<FormState>({
    title: document?.title ?? '',
    type: document?.type ?? 'receipt',
    linkedRecordIds: getInitialLinkedRecordIds(
      document?.linkedRecordIds,
      initialLinkedRecordId,
      assets[0]?.id ?? propertyId,
    ),
    date: document?.date ?? '',
    vendor: document?.vendor ?? '',
    amount: formatAmountInput(document?.amountCents),
    attachment: document?.attachment,
    filePath: document?.filePath ?? '',
    ocrText: document?.ocrText ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | undefined>();
  const [pickerStep, setPickerStep] = useState<PickerStep>(null);
  const errors = useMemo(
    () => ({
      title: form.title.trim().length === 0 ? 'Title is required.' : undefined,
      date:
        form.date.trim().length > 0 && !isValidDateInput(form.date)
          ? 'Use YYYY-MM-DD.'
          : undefined,
      amount:
        form.amount.trim().length > 0 && !isValidAmountInput(form.amount)
          ? 'Enter a valid amount.'
          : undefined,
    }),
    [form.amount, form.date, form.title],
  );

  const canSave = useMemo(
    () => !errors.title && !errors.date && !errors.amount && !isSaving,
    [errors.amount, errors.date, errors.title, isSaving],
  );

  async function handleChooseFile() {
    setPickerStep('picking');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'application/pdf',
          'image/*',
          'text/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const [asset] = result.assets;
      const attachment = await createAttachmentFromPickedAsset(asset);

      setAttachmentError(undefined);
      setForm((current) => ({
        ...current,
        attachment,
        title: current.title.trim().length > 0 ? current.title : formatPickedFileTitle(asset.name),
        filePath: attachment.storedUri,
        ocrText: current.ocrText.trim().length > 0
          ? current.ocrText
          : formatPickedFileMetadata(asset),
      }));
    } catch {
      setAttachmentError(
        'Could not import this file. Keep it available on this device and try again, or save the document without an attachment.',
      );
    } finally {
      setPickerStep(null);
    }
  }

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        id: document?.id,
        propertyId,
        title: form.title.trim(),
        type: form.type,
        attachment: buildAttachmentInput(form.filePath, form.attachment),
        filePath: cleanOptional(form.filePath),
        date: cleanOptional(form.date),
        vendor: cleanOptional(form.vendor),
        amountCents: parseAmountCents(form.amount),
        ocrText: cleanOptional(form.ocrText),
        linkedRecordIds: form.linkedRecordIds,
      });
    } finally {
      setIsSaving(false);
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
          <Text style={styles.kicker}>Documents</Text>
          <Text style={styles.title}>{document ? 'Edit document' : 'Add document'}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Field
          label="Title"
          value={form.title}
          placeholder="Receipt, manual, inspection report"
          error={errors.title}
          onChangeText={(title) => setForm((current) => ({ ...current, title }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.optionGrid}>
            {documentTypes.map((option) => {
              const isSelected = option.value === form.type;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setForm((current) => ({ ...current, type: option.value }))}
                  style={[styles.optionPill, isSelected && styles.optionPillActive]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Link to</Text>
          <Text style={styles.helperText}>Select every asset, room, or property record this document supports.</Text>
          <View style={styles.optionGrid}>
            <RecordPill
              label="Property"
              isSelected={form.linkedRecordIds.includes(propertyId)}
              onPress={() => setForm((current) => toggleLinkedRecord(current, propertyId))}
            />
            {rooms.map((room) => (
              <RecordPill
                key={room.id}
                label={room.name}
                isSelected={form.linkedRecordIds.includes(room.id)}
                onPress={() => setForm((current) => toggleLinkedRecord(current, room.id))}
              />
            ))}
            {assets.map((asset) => (
              <RecordPill
                key={asset.id}
                label={asset.name}
                isSelected={form.linkedRecordIds.includes(asset.id)}
                onPress={() => setForm((current) => toggleLinkedRecord(current, asset.id))}
              />
            ))}
          </View>
        </View>

        <Field
          label="Date"
          value={form.date}
          placeholder="2026-06-12"
          error={errors.date}
          onChangeText={(date) => setForm((current) => ({ ...current, date }))}
        />
        <Field
          label="Vendor"
          value={form.vendor}
          placeholder="Store, contractor, manufacturer"
          onChangeText={(vendor) => setForm((current) => ({ ...current, vendor }))}
        />
        <Field
          label="Amount"
          value={form.amount}
          placeholder="129.99"
          keyboardType="decimal-pad"
          error={errors.amount}
          onChangeText={(amount) => setForm((current) => ({ ...current, amount }))}
        />
        <Field
          label="File reference"
          value={form.filePath}
          placeholder="homevault://documents/hvac-manual.pdf"
          onChangeText={(filePath) => {
            if (attachmentError) {
              setAttachmentError(undefined);
            }
            setForm((current) => ({ ...current, attachment: undefined, filePath }));
          }}
        />
        <View style={styles.attachmentPanel}>
          <View style={styles.attachmentBody}>
            <Text style={styles.attachmentTitle}>
              {form.filePath ? 'Attachment selected' : 'Attach a file'}
            </Text>
            <Text style={styles.attachmentMeta} numberOfLines={2}>
              {formatAttachmentMeta(form.filePath, form.attachment)}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setAttachmentError(undefined);
              setPickerStep('education');
            }}
            style={styles.attachmentButton}
            accessibilityRole="button"
          >
            <Text style={styles.attachmentButtonText}>Choose file</Text>
          </Pressable>
        </View>
        {pickerStep === 'education' ? (
          <View style={styles.attachmentEducationCard}>
            <Text style={styles.attachmentEducationText}>
              HomeVault will open your device&apos;s file picker so you can choose a PDF, photo, or
              document copy. The selected file stays local to this device, and you can still save
              this record without an attachment.
            </Text>
            <View style={styles.attachmentEducationActions}>
              <Pressable
                onPress={() => void handleChooseFile()}
                style={styles.attachmentEducationPrimary}
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text style={styles.attachmentEducationPrimaryText}>Continue</Text>
              </Pressable>
              <Pressable
                onPress={() => setPickerStep(null)}
                style={styles.attachmentEducationSecondary}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.attachmentEducationSecondaryText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        {attachmentError ? <Text style={styles.errorText}>{attachmentError}</Text> : null}
        <Field
          label="Captured text"
          value={form.ocrText}
          placeholder="Paste useful text, warranty terms, model notes, or OCR output"
          multiline
          onChangeText={(ocrText) => setForm((current) => ({ ...current, ocrText }))}
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>
          {isSaving ? 'Saving' : document ? 'Save changes' : 'Save document'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function getInitialLinkedRecordIds(
  documentLinkedRecordIds: string[] | undefined,
  initialLinkedRecordId: string | undefined,
  fallbackRecordId: string,
) {
  const ids = documentLinkedRecordIds?.length
    ? documentLinkedRecordIds
    : [initialLinkedRecordId ?? fallbackRecordId];

  return Array.from(new Set(ids));
}

function toggleLinkedRecord(form: FormState, recordId: string): FormState {
  const isSelected = form.linkedRecordIds.includes(recordId);
  const linkedRecordIds = isSelected
    ? form.linkedRecordIds.filter((candidate) => candidate !== recordId)
    : [...form.linkedRecordIds, recordId];

  return {
    ...form,
    linkedRecordIds,
  };
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
};

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  error,
  keyboardType,
  multiline = false,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, error && styles.inputError, multiline && styles.textArea]}
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function RecordPill({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionPill, isSelected && styles.optionPillActive]}
      accessibilityRole="button"
    >
      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{label}</Text>
    </Pressable>
  );
}

function cleanOptional(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function buildAttachmentInput(
  filePath: string,
  attachment?: DocumentAttachment,
): DocumentAttachment | undefined {
  const storedUri = cleanOptional(filePath);

  if (!storedUri) {
    return undefined;
  }

  if (attachment && attachment.storedUri === storedUri) {
    return { ...attachment };
  }

  return {
    attachedAt: new Date().toISOString(),
    storageKind: 'external_reference',
    storedUri,
  };
}

async function createAttachmentFromPickedAsset(
  asset: DocumentPicker.DocumentPickerAsset,
): Promise<DocumentAttachment> {
  const attachedAt = new Date().toISOString();
  const baseAttachment = {
    attachedAt,
    fileName: asset.name,
    mimeType: asset.mimeType,
    originalUri: asset.uri,
    sizeBytes: asset.size,
  };
  const copiedUri = await copyPickedAssetToHomeVaultStorage(asset, attachedAt);

  if (copiedUri) {
    return {
      ...baseAttachment,
      storageKind: 'app_copy',
      storedUri: copiedUri,
    };
  }

  return {
    ...baseAttachment,
    storageKind: 'external_reference',
    storedUri: asset.uri,
  };
}

async function copyPickedAssetToHomeVaultStorage(
  asset: DocumentPicker.DocumentPickerAsset,
  attachedAt: string,
) {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return null;
  }

  try {
    const directoryUri = `${FileSystem.documentDirectory}homevault-documents/`;
    const fileUri = `${directoryUri}${formatStoredFileName(asset.name, attachedAt)}`;

    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
    await FileSystem.copyAsync({ from: asset.uri, to: fileUri });

    return fileUri;
  } catch {
    return null;
  }
}

function parseAmountCents(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

function isValidDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return false;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidAmountInput(value: string) {
  const parsed = Number(value.trim());

  return Number.isFinite(parsed) && parsed >= 0;
}

function formatAmountInput(value?: number) {
  if (value === undefined) {
    return '';
  }

  return (value / 100).toFixed(2);
}

function formatPickedFileTitle(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || fileName;
}

function formatStoredFileName(fileName: string, attachedAt: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const timestamp = attachedAt.replace(/[^0-9]/g, '').slice(0, 14);

  return `${timestamp}-${safeName || 'document'}`;
}

function formatPickedFileMetadata(asset: DocumentPicker.DocumentPickerAsset) {
  const details = [`File: ${asset.name}`];

  if (asset.mimeType) {
    details.push(`Type: ${asset.mimeType}`);
  }

  if (asset.size !== undefined) {
    details.push(`Size: ${formatBytes(asset.size)}`);
  }

  return details.join('\n');
}

function formatAttachmentMeta(filePath: string, attachment?: DocumentAttachment) {
  if (!filePath) {
    return 'Choose a PDF, image, text file, Word doc, receipt, or report.';
  }

  if (!attachment) {
    return filePath;
  }

  const details = [attachment.fileName ?? filePath];

  if (attachment.mimeType) {
    details.push(attachment.mimeType);
  }

  if (attachment.sizeBytes !== undefined) {
    details.push(formatBytes(attachment.sizeBytes));
  }

  return details.join(' · ');
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
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
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  cancelButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  panel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 14,
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  helperText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  input: {
    minHeight: 46,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: colors.ink,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  inputError: {
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  textArea: {
    minHeight: 112,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  attachmentPanel: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: colors.greenSoft,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachmentBody: {
    flex: 1,
    gap: 3,
  },
  attachmentTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  attachmentMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  attachmentButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  attachmentEducationCard: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  attachmentEducationText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  attachmentEducationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentEducationPrimary: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentEducationPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  attachmentEducationSecondary: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentEducationSecondaryText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPillActive: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  optionText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9AB8AC',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
