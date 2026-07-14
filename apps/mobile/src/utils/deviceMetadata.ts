import type { Asset } from '@homevault/domain';
import { isDeviceAsset, isRouterAsset } from '@homevault/domain';

export type DeviceTemplateKey =
  | 'router'
  | 'phone'
  | 'laptop'
  | 'tablet'
  | 'smart_home'
  | 'camera';

export type DeviceBooleanChoice = 'unknown' | 'enabled' | 'disabled';

type DeviceTemplate = {
  key: DeviceTemplateKey;
  label: string;
  category: string;
  namePlaceholder: string;
  locationPlaceholder: string;
  notesPlaceholder: string;
};

export const DEVICE_TEMPLATES: DeviceTemplate[] = [
  {
    key: 'router',
    label: 'Router',
    category: 'Router',
    namePlaceholder: 'Main Wi-Fi router',
    locationPlaceholder: 'Office shelf beside the modem',
    notesPlaceholder: 'Restart steps, ISP notes, battery backup, or cabinet location',
  },
  {
    key: 'phone',
    label: 'Phone',
    category: 'Phone',
    namePlaceholder: 'Jamie’s iPhone',
    locationPlaceholder: 'Usually with Jamie or on the kitchen charger',
    notesPlaceholder: 'Carrier, SIM notes, or family sharing details',
  },
  {
    key: 'laptop',
    label: 'Laptop',
    category: 'Laptop',
    namePlaceholder: 'Work laptop',
    locationPlaceholder: 'Office desk drawer',
    notesPlaceholder: 'Dock, charger, backup drive, or VPN recovery notes',
  },
  {
    key: 'tablet',
    label: 'Tablet',
    category: 'Tablet',
    namePlaceholder: 'Family iPad',
    locationPlaceholder: 'Living room charging station',
    notesPlaceholder: 'Parental controls, charging setup, or travel bag location',
  },
  {
    key: 'smart_home',
    label: 'Smart home',
    category: 'Smart home',
    namePlaceholder: 'Front door keypad',
    locationPlaceholder: 'Entryway console',
    notesPlaceholder: 'App pairing, battery type, or reset instructions',
  },
  {
    key: 'camera',
    label: 'Camera',
    category: 'Camera',
    namePlaceholder: 'Front door camera',
    locationPlaceholder: 'Covered porch',
    notesPlaceholder: 'Storage plan, power adapter, or recovery instructions',
  },
];

export function getDeviceTemplate(
  key?: string | string[] | null,
): DeviceTemplate | undefined {
  if (!key) return undefined;

  const normalized = Array.isArray(key) ? key[0] : key;
  return DEVICE_TEMPLATES.find((template) => template.key === normalized);
}

export function toDeviceBooleanChoice(value: boolean | undefined): DeviceBooleanChoice {
  if (value == null) {
    return 'unknown';
  }

  return value ? 'enabled' : 'disabled';
}

export function fromDeviceBooleanChoice(value: DeviceBooleanChoice): boolean | undefined {
  if (value === 'unknown') {
    return undefined;
  }

  return value === 'enabled';
}

export function formatDeviceStatus(
  value: boolean | undefined,
  positiveLabel = 'Enabled',
  negativeLabel = 'Off',
) {
  if (value == null) {
    return 'Not reviewed';
  }

  return value ? positiveLabel : negativeLabel;
}

export function buildDeviceReadinessSummary(
  asset: Pick<Asset, 'backupEnabled' | 'screenLockEnabled' | 'findMyDeviceEnabled'>,
) {
  const flags = [
    asset.backupEnabled ? 'Backup on' : null,
    asset.screenLockEnabled ? 'Lock on' : null,
    asset.findMyDeviceEnabled ? 'Find My on' : null,
  ].filter(Boolean);

  if (flags.length > 0) {
    return flags.join(' · ');
  }

  if (
    asset.backupEnabled === false ||
    asset.screenLockEnabled === false ||
    asset.findMyDeviceEnabled === false
  ) {
    return 'Needs readiness review';
  }

  return 'Readiness not reviewed';
}

export function getAssetMode(
  asset: Pick<Asset, 'category' | 'name'> | undefined,
): 'device' | 'asset' {
  return asset && isDeviceAsset(asset) ? 'device' : 'asset';
}

export function getDeviceLocationPlaceholder(templateKey?: DeviceTemplateKey) {
  return getDeviceTemplate(templateKey)?.locationPlaceholder ?? 'Office shelf, travel bag, or charger';
}

export function getDeviceNamePlaceholder(templateKey?: DeviceTemplateKey) {
  return getDeviceTemplate(templateKey)?.namePlaceholder ?? 'Main Wi-Fi router, family iPad, office laptop';
}

export function getDeviceNotesPlaceholder(templateKey?: DeviceTemplateKey) {
  return (
    getDeviceTemplate(templateKey)?.notesPlaceholder ??
    'Recovery notes, charger details, accessory location, or outage steps'
  );
}

export function isRouterLikeAsset(asset: Pick<Asset, 'category' | 'name'>) {
  return isRouterAsset(asset);
}
