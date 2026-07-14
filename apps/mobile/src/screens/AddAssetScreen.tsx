import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';

import type { Asset, RoomArea } from '@homevault/domain';
import type { CreateAssetInput, UpdateAssetInput } from '@homevault/database';

import { FormField } from '../components/FormField';
import { PhotoPickerField } from '../components/PhotoPickerField';
import { deleteAppOwnedPhoto } from '../utils/photoStorage';
import {
  fromDeviceBooleanChoice,
  getDeviceNamePlaceholder,
  getDeviceNotesPlaceholder,
  getDeviceTemplate,
  isRouterLikeAsset,
  toDeviceBooleanChoice,
  type DeviceBooleanChoice,
  type DeviceTemplateKey,
} from '../utils/deviceMetadata';
import { colors } from '../theme/colors';

type AddAssetScreenProps = {
  propertyId: string;
  rooms: RoomArea[];
  asset?: Asset;
  copyFrom?: Asset;
  initialRoomId?: string;
  mode?: 'asset' | 'device';
  deviceTemplate?: DeviceTemplateKey;
  onCancel: () => void;
  onSave: (input: CreateAssetInput | UpdateAssetInput) => Promise<void>;
};

type FormState = {
  name: string;
  category: string;
  roomId?: string;
  ownerName: string;
  backupHelperName: string;
  brand: string;
  model: string;
  serial: string;
  installDate: string;
  purchaseDate: string;
  cost: string;
  status: Asset['status'];
  warrantyExpiry: string;
  backupEnabled: DeviceBooleanChoice;
  screenLockEnabled: DeviceBooleanChoice;
  findMyDeviceEnabled: DeviceBooleanChoice;
  networkName: string;
  internetProvider: string;
  networkAdminUrl: string;
  photoUri: string;
  notes: string;
};

const assetCategoryPresets = [
  'Appliance',
  'Heating & cooling',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Windows & doors',
  'Flooring',
  'Lighting',
  'Security',
  'Exterior',
  'Structure',
];

const deviceCategoryPresets = [
  'Router',
  'Phone',
  'Laptop',
  'Tablet',
  'Smart home',
  'Camera',
  'Computer',
  'Other device',
];

const statusOptions: Array<{ label: string; value: Asset['status'] }> = [
  { label: 'Ready', value: 'ready' },
  { label: 'Needs attention', value: 'needs_attention' },
  { label: 'Warranty soon', value: 'warranty_soon' },
];

const deviceSettingOptions: Array<{ label: string; value: DeviceBooleanChoice }> = [
  { label: 'Yes', value: 'enabled' },
  { label: 'No', value: 'disabled' },
  { label: 'Not sure', value: 'unknown' },
];

export function AddAssetScreen({
  propertyId,
  rooms,
  asset,
  copyFrom,
  initialRoomId,
  mode = 'asset',
  deviceTemplate,
  onCancel,
  onSave,
}: AddAssetScreenProps) {
  const originalPhotoUri = useRef(copyFrom ? '' : (asset?.photoUri ?? ''));
  const template = asset ?? copyFrom;
  const selectedDeviceTemplate = mode === 'device' ? getDeviceTemplate(deviceTemplate) : undefined;
  const categoryPresets = mode === 'device' ? deviceCategoryPresets : assetCategoryPresets;
  const hasAdvancedData =
    asset != null &&
    Boolean(
      asset.ownerName ||
      asset.backupHelperName ||
      asset.brand ||
      asset.model ||
      asset.serial ||
      asset.installDate ||
      asset.purchaseDate ||
      asset.costCents ||
      asset.warrantyExpiry ||
      asset.backupEnabled != null ||
      asset.screenLockEnabled != null ||
      asset.findMyDeviceEnabled != null ||
      asset.networkName ||
      asset.internetProvider ||
      asset.networkAdminUrl ||
      asset.photoUri ||
      asset.notes,
    );
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedData);
  const [form, setForm] = useState<FormState>({
    name: copyFrom ? `${copyFrom.name} (copy)` : (asset?.name ?? ''),
    category: template?.category ?? selectedDeviceTemplate?.category ?? (mode === 'device' ? 'Router' : 'Appliance'),
    roomId: template?.roomId ?? initialRoomId ?? rooms[0]?.id,
    ownerName: copyFrom ? (copyFrom.ownerName ?? '') : (asset?.ownerName ?? ''),
    backupHelperName: copyFrom ? (copyFrom.backupHelperName ?? '') : (asset?.backupHelperName ?? ''),
    brand: template?.brand ?? '',
    model: template?.model ?? '',
    serial: copyFrom ? '' : (asset?.serial ?? ''),
    installDate: copyFrom ? '' : (asset?.installDate ?? ''),
    purchaseDate: copyFrom ? '' : (asset?.purchaseDate ?? ''),
    cost: copyFrom ? '' : (asset?.costCents != null ? String(asset.costCents / 100) : ''),
    status: template?.status ?? 'ready',
    warrantyExpiry: copyFrom ? '' : (asset?.warrantyExpiry ?? ''),
    backupEnabled: copyFrom
      ? toDeviceBooleanChoice(copyFrom.backupEnabled)
      : toDeviceBooleanChoice(asset?.backupEnabled),
    screenLockEnabled: copyFrom
      ? toDeviceBooleanChoice(copyFrom.screenLockEnabled)
      : toDeviceBooleanChoice(asset?.screenLockEnabled),
    findMyDeviceEnabled: copyFrom
      ? toDeviceBooleanChoice(copyFrom.findMyDeviceEnabled)
      : toDeviceBooleanChoice(asset?.findMyDeviceEnabled),
    networkName: copyFrom ? (copyFrom.networkName ?? '') : (asset?.networkName ?? ''),
    internetProvider: copyFrom ? (copyFrom.internetProvider ?? '') : (asset?.internetProvider ?? ''),
    networkAdminUrl: copyFrom ? (copyFrom.networkAdminUrl ?? '') : (asset?.networkAdminUrl ?? ''),
    photoUri: copyFrom ? '' : (asset?.photoUri ?? ''),
    notes: copyFrom ? '' : (asset?.notes ?? ''),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const errors = useMemo(
    () => ({
      name: form.name.trim().length === 0 ? 'Name is required.' : undefined,
      category: form.category.trim().length === 0 ? 'Category is required.' : undefined,
      installDate:
        form.installDate.trim().length > 0 && !datePattern.test(form.installDate.trim())
          ? 'Enter a date as YYYY-MM-DD.'
          : undefined,
      purchaseDate:
        form.purchaseDate.trim().length > 0 && !datePattern.test(form.purchaseDate.trim())
          ? 'Enter a date as YYYY-MM-DD.'
          : undefined,
      cost:
        form.cost.trim().length > 0 && (isNaN(parseFloat(form.cost.trim())) || parseFloat(form.cost.trim()) < 0)
          ? 'Enter a positive dollar amount.'
          : undefined,
      warrantyExpiry:
        form.warrantyExpiry.trim().length > 0 && !datePattern.test(form.warrantyExpiry.trim())
          ? 'Enter a date as YYYY-MM-DD.'
          : undefined,
    }),
    [form.category, form.cost, form.installDate, form.name, form.purchaseDate, form.warrantyExpiry],
  );

  const canSave = useMemo(
    () =>
      !errors.name &&
      !errors.category &&
      !errors.installDate &&
      !errors.purchaseDate &&
      !errors.cost &&
      !errors.warrantyExpiry &&
      !isSaving,
    [errors.category, errors.cost, errors.installDate, errors.name, errors.purchaseDate, errors.warrantyExpiry, isSaving],
  );

  function handlePhotoChange(photoUri: string) {
    const current = form.photoUri;
    if (current && current !== originalPhotoUri.current) {
      void deleteAppOwnedPhoto(current);
    }
    setForm((prev) => ({ ...prev, photoUri }));
  }

  function handleCancel() {
    if (form.photoUri && form.photoUri !== originalPhotoUri.current) {
      void deleteAppOwnedPhoto(form.photoUri);
    }
    onCancel();
  }

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        id: asset?.id,
        propertyId,
        roomId: form.roomId,
        name: form.name.trim(),
        category: form.category.trim(),
        ownerName: cleanOptional(form.ownerName),
        backupHelperName: cleanOptional(form.backupHelperName),
        brand: cleanOptional(form.brand),
        model: cleanOptional(form.model),
        serial: cleanOptional(form.serial),
        installDate: cleanOptional(form.installDate),
        purchaseDate: cleanOptional(form.purchaseDate),
        costCents: form.cost.trim().length > 0 ? Math.round(parseFloat(form.cost.trim()) * 100) : undefined,
        status: form.status,
        warrantyExpiry: cleanOptional(form.warrantyExpiry),
        backupEnabled: fromDeviceBooleanChoice(form.backupEnabled),
        screenLockEnabled: fromDeviceBooleanChoice(form.screenLockEnabled),
        findMyDeviceEnabled: fromDeviceBooleanChoice(form.findMyDeviceEnabled),
        networkName: cleanOptional(form.networkName),
        internetProvider: cleanOptional(form.internetProvider),
        networkAdminUrl: cleanOptional(form.networkAdminUrl),
        photoUri: form.photoUri || undefined,
        notes: cleanOptional(form.notes),
      });
      if (originalPhotoUri.current && originalPhotoUri.current !== form.photoUri) {
        void deleteAppOwnedPhoto(originalPhotoUri.current);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenScanner() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setScannerBusy(false);
    setShowScanner(true);
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scannerBusy) return;
    setScannerBusy(true);

    try {
      // TODO(privacy): trial endpoint — replace with a self-hosted lookup before public release.
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(data)}`);
      const json = await response.json() as {
        items?: Array<{ title?: string; brand?: string; model?: string }>;
      };
      const item = json.items?.[0];

      setForm((current) => ({
        ...current,
        name: current.name.trim() || item?.title?.trim() || current.name,
        brand: current.brand.trim() || item?.brand?.trim() || current.brand,
        model: current.model.trim() || item?.model?.trim() || current.model,
        serial: current.serial.trim() || data,
      }));
    } catch {
      setForm((current) => ({
        ...current,
        serial: current.serial.trim() || data,
      }));
    }

    setShowScanner(false);
  }

  const isRouterDevice = mode === 'device' && isRouterLikeAsset({ category: form.category, name: form.name });
  const namePlaceholder =
    mode === 'device'
      ? getDeviceNamePlaceholder(selectedDeviceTemplate?.key)
      : 'Dishwasher, roof, breaker panel';
  const notesPlaceholder =
    mode === 'device'
      ? getDeviceNotesPlaceholder(selectedDeviceTemplate?.key)
      : 'Filter size, location, access notes';
  const roomLabel = mode === 'device' ? 'Room, shelf, or area (optional)' : 'Room or area (optional)';
  const screenTitle =
    mode === 'device'
      ? asset
        ? 'Edit device'
        : copyFrom
          ? 'Copy device'
          : 'Add device'
      : asset
        ? 'Edit asset'
        : copyFrom
          ? 'Copy asset'
          : 'Add asset';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{mode === 'device' ? 'Devices' : 'Inventory'}</Text>
          <Text style={styles.title}>{screenTitle}</Text>
        </View>
        <Pressable onPress={handleCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <FormField
          label="Name"
          value={form.name}
          placeholder={namePlaceholder}
          error={errors.name}
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        />
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{mode === 'device' ? 'Device type' : 'Category'}</Text>
          <View style={styles.optionGrid}>
            {categoryPresets.map((preset) => {
              const isSelected = form.category === preset;

              return (
                <Pressable
                  key={preset}
                  onPress={() => setForm((current) => ({ ...current, category: preset }))}
                  style={[styles.optionPill, isSelected && styles.optionPillActive]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {preset}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!categoryPresets.includes(form.category) || form.category === '' ? (
            <TextInput
              value={categoryPresets.includes(form.category) ? '' : form.category}
              placeholder="Custom category"
              onChangeText={(category) => setForm((current) => ({ ...current, category }))}
              style={[styles.input, errors.category && styles.inputError]}
              placeholderTextColor={colors.muted}
            />
          ) : null}
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{roomLabel}</Text>
          {rooms.length > 0 ? (
            <View style={styles.optionGrid}>
              {rooms.map((room) => {
                const isSelected = room.id === form.roomId;

                return (
                  <Pressable
                    key={room.id}
                    onPress={() => setForm((current) => ({ ...current, roomId: room.id }))}
                    style={[styles.optionPill, isSelected && styles.optionPillActive]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                      {room.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.fieldHint}>
              No areas added yet. Add a room or area from the Household tab first.
            </Text>
          )}
        </View>

        {mode === 'device' ? (
          <View style={styles.devicePanel}>
            <Text style={styles.label}>Recovery details</Text>
            <FormField
              label="Owner (optional)"
              value={form.ownerName}
              placeholder="Jamie, household, guest room"
              onChangeText={(ownerName) => setForm((current) => ({ ...current, ownerName }))}
            />
            <FormField
              label="Backup helper (optional)"
              value={form.backupHelperName}
              placeholder="Taylor, spouse, or trusted helper fallback"
              onChangeText={(backupHelperName) =>
                setForm((current) => ({ ...current, backupHelperName }))
              }
            />
            <ChoiceField
              label="Backup enabled"
              value={form.backupEnabled}
              options={deviceSettingOptions}
              onChange={(backupEnabled) => setForm((current) => ({ ...current, backupEnabled }))}
            />
            <ChoiceField
              label="Screen lock enabled"
              value={form.screenLockEnabled}
              options={deviceSettingOptions}
              onChange={(screenLockEnabled) =>
                setForm((current) => ({ ...current, screenLockEnabled }))
              }
            />
            <ChoiceField
              label="Find-my-device enabled"
              value={form.findMyDeviceEnabled}
              options={deviceSettingOptions}
              onChange={(findMyDeviceEnabled) =>
                setForm((current) => ({ ...current, findMyDeviceEnabled }))
              }
            />
            {isRouterDevice ? (
              <View style={styles.routerPanel}>
                <Text style={styles.routerTitle}>Router details</Text>
                <Text style={styles.fieldHint}>
                  Keep the network name, provider, and local admin address handy so someone can
                  recover the home connection faster.
                </Text>
                <FormField
                  label="Network name (optional)"
                  value={form.networkName}
                  placeholder="OakStreet-5G"
                  onChangeText={(networkName) => setForm((current) => ({ ...current, networkName }))}
                />
                <FormField
                  label="Internet provider (optional)"
                  value={form.internetProvider}
                  placeholder="FiberCo"
                  onChangeText={(internetProvider) =>
                    setForm((current) => ({ ...current, internetProvider }))
                  }
                />
                <FormField
                  label="Admin address (optional)"
                  value={form.networkAdminUrl}
                  placeholder="http://192.168.1.1"
                  onChangeText={(networkAdminUrl) =>
                    setForm((current) => ({ ...current, networkAdminUrl }))
                  }
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable
          onPress={() => setShowAdvanced((v) => !v)}
          style={styles.advancedToggle}
          accessibilityRole="button"
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? 'Show less ▴' : 'More details ▾'}
          </Text>
        </Pressable>

        {showAdvanced && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{mode === 'device' ? 'Hardware details' : 'Identification'}</Text>
              <Pressable
                onPress={() => void handleOpenScanner()}
                style={styles.scanButton}
                accessibilityRole="button"
                accessibilityLabel="Scan barcode"
              >
                <Text style={styles.scanButtonText}>Scan barcode</Text>
              </Pressable>
            </View>

            <FormField
              label="Brand (optional)"
              value={form.brand}
              placeholder="Bosch, Trane, Rheem"
              onChangeText={(brand) => setForm((current) => ({ ...current, brand }))}
            />
            <FormField
              label="Model (optional)"
              value={form.model}
              placeholder="Model number"
              autoCapitalize="characters"
              onChangeText={(model) => setForm((current) => ({ ...current, model }))}
            />
            <FormField
              label="Serial number (optional)"
              value={form.serial}
              placeholder="Serial number"
              autoCapitalize="characters"
              onChangeText={(serial) => setForm((current) => ({ ...current, serial }))}
            />
            <FormField
              label="Install date (optional)"
              value={form.installDate}
              placeholder="YYYY-MM-DD"
              error={errors.installDate}
              onChangeText={(installDate) => setForm((current) => ({ ...current, installDate }))}
            />
            <FormField
              label="Purchase date (optional)"
              value={form.purchaseDate}
              placeholder="YYYY-MM-DD"
              error={errors.purchaseDate}
              onChangeText={(purchaseDate) => setForm((current) => ({ ...current, purchaseDate }))}
            />
            <FormField
              label="Purchase cost (optional)"
              value={form.cost}
              placeholder="0.00"
              error={errors.cost}
              keyboardType="decimal-pad"
              onChangeText={(cost) => setForm((current) => ({ ...current, cost }))}
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.optionGrid}>
                {statusOptions.map((option) => {
                  const isSelected = option.value === form.status;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setForm((current) => ({ ...current, status: option.value }))}
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

            <FormField
              label="Warranty expiry (optional)"
              value={form.warrantyExpiry}
              placeholder="YYYY-MM-DD"
              error={errors.warrantyExpiry}
              onChangeText={(warrantyExpiry) =>
                setForm((current) => ({ ...current, warrantyExpiry }))
              }
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Photo (optional)</Text>
              <PhotoPickerField
                prefix="asset"
                value={form.photoUri}
                onChange={handlePhotoChange}
                accessibilityLabel={`Photo of ${form.name || 'asset'}`}
              />
            </View>

            <FormField
              label="Notes (optional)"
              value={form.notes}
              placeholder={mode === 'device' ? notesPlaceholder : 'Filter size, location, access notes'}
              multiline
              onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
            />
          </>
        )}
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>
          {isSaving ? 'Saving' : asset ? 'Save changes' : mode === 'device' ? 'Save device' : 'Save asset'}
        </Text>
      </Pressable>

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.scannerCamera}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
            }}
            onBarcodeScanned={scannerBusy ? undefined : (e) => void handleBarcodeScanned(e)}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTopBar}>
              <Pressable
                onPress={() => setShowScanner(false)}
                style={styles.scannerCloseButton}
                accessibilityRole="button"
              >
                <Text style={styles.scannerCloseText}>Close</Text>
              </Pressable>
              <Text style={styles.scannerTitle}>Scan barcode</Text>
            </View>
            <View style={styles.scannerMiddle}>
              <View style={styles.scannerViewfinder}>
                <View style={[styles.scannerCorner, styles.scannerCornerTL]} />
                <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
                <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
                <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
              </View>
            </View>
            <View style={styles.scannerBottomBar}>
              {scannerBusy ? (
                <View style={styles.scannerStatus}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.scannerStatusText}>Looking up product…</Text>
                </View>
              ) : (
                <Text style={styles.scannerHint}>
                  Point the camera at a barcode or QR code on the appliance or its packaging
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function cleanOptional(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function ChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: DeviceBooleanChoice;
  options: Array<{ label: string; value: DeviceBooleanChoice }>;
  onChange: (value: DeviceBooleanChoice) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
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
  devicePanel: {
    gap: 12,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
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
  fieldHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  multilineInput: {
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: 'top',
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
  routerPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.page,
    padding: 12,
    gap: 10,
  },
  routerTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  advancedToggle: {
    minHeight: 38,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedToggleText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
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
  scanButton: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerCamera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  scannerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  scannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  scannerCloseButton: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerCloseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  scannerMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerViewfinder: {
    width: 260,
    height: 180,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  scannerCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  scannerCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  scannerCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  scannerCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scannerBottomBar: {
    paddingHorizontal: 32,
    paddingBottom: 60,
    alignItems: 'center',
  },
  scannerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scannerStatusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  scannerHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 21,
  },
});
