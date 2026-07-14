import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAssetStatusLabel, type AssetListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';
import { buildDeviceReadinessSummary, isRouterLikeAsset } from '../utils/deviceMetadata';

type AssetRowProps = {
  asset: AssetListItem;
  onPress?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  variant?: 'inventory' | 'device';
};

export function AssetRow({
  asset,
  onPress,
  onSecondaryAction,
  secondaryActionLabel,
  variant = 'inventory',
}: AssetRowProps) {
  const attention = asset.status !== 'ready';
  const statusLabel = getAssetStatusLabel(asset.status);
  const isDeviceVariant = variant === 'device';
  const primaryMeta = isDeviceVariant
    ? [asset.roomName, asset.ownerName].filter(Boolean).join(' · ')
    : [asset.roomName, [asset.brand, asset.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
  const secondaryMeta = isDeviceVariant
    ? [
        asset.serial ? `Serial ${asset.serial}` : null,
        isRouterLikeAsset(asset) && asset.networkName ? `SSID ${asset.networkName}` : null,
        `${asset.documentCount} doc${asset.documentCount === 1 ? '' : 's'}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : [
        asset.serial ? `Serial ${asset.serial}` : null,
        `${asset.documentCount} doc${asset.documentCount === 1 ? '' : 's'}`,
      ]
        .filter(Boolean)
        .join(' · ');
  const supportLine = isDeviceVariant
    ? buildDeviceReadinessSummary(asset)
    : asset.nextTaskLabel !== 'No open tasks'
      ? asset.nextTaskLabel
      : null;

  return (
    <View style={styles.assetRow}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={styles.assetRowButton}
        accessibilityRole={onPress ? 'button' : undefined}
      >
        <View style={styles.assetIcon}>
          {asset.photoUri ? (
            <Image source={{ uri: asset.photoUri }} style={styles.assetPhoto} resizeMode="cover" />
          ) : (
            <Text style={styles.assetIconText}>{asset.category.slice(0, 1)}</Text>
          )}
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowTitle}>{asset.name}</Text>
            <View style={[styles.statusPill, attention && styles.statusPillWarn]}>
              <Text style={[styles.statusText, attention && styles.statusTextWarn]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          {primaryMeta ? <Text style={styles.rowMeta}>{primaryMeta}</Text> : null}
          {secondaryMeta ? <Text style={styles.rowMeta}>{secondaryMeta}</Text> : null}
          {supportLine ? (
            <Text style={styles.rowTask} numberOfLines={1}>{supportLine}</Text>
          ) : null}
        </View>
      </Pressable>
      {onSecondaryAction && secondaryActionLabel ? (
        <View style={styles.actionRow}>
          <Pressable
            onPress={onSecondaryAction}
            style={styles.secondaryActionButton}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionButtonText}>{secondaryActionLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  assetRow: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  assetRowButton: {
    flexDirection: 'row',
    gap: 12,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  assetPhoto: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  assetIconText: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: '900',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  rowTask: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
  },
  secondaryActionButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  statusPill: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillWarn: {
    backgroundColor: colors.amberSoft,
  },
  statusText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
  },
  statusTextWarn: {
    color: colors.amber,
  },
});
