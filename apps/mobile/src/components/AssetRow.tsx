import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAssetStatusLabel, type AssetListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type AssetRowProps = {
  asset: AssetListItem;
  onPress?: () => void;
};

export function AssetRow({ asset, onPress }: AssetRowProps) {
  const attention = asset.status !== 'ready';
  const statusLabel = getAssetStatusLabel(asset.status);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.assetRow}
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
        <Text style={styles.rowMeta}>
          {[asset.roomName, [asset.brand, asset.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.rowMeta}>
          {[asset.serial ? `Serial ${asset.serial}` : null, `${asset.documentCount} doc${asset.documentCount === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  assetRow: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
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
