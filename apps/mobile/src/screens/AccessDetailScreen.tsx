import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AccessItem } from '@homevault/domain';
import type { AssetListItem, DocumentListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';
import {
  formatAccessFieldValue,
  getAccessVisibilityGuidance,
  hasSensitiveAccessDetails,
} from '../utils/accessSensitivity';
import { confirmSensitiveReveal } from '../utils/sensitiveReveal';
import { getAccessItemSensitivity } from '../utils/sensitivity';
import { formatDateLabel } from '../utils/taskUtils';

type AccessDetailScreenProps = {
  accessItem: AccessItem;
  linkedAsset?: AssetListItem;
  linkedDocuments: DocumentListItem[];
  onBack: () => void;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  onMarkReviewed?: () => void;
  onShare?: () => void;
  reviewStatusLabel?: string;
  onLinkedAssetPress?: (assetId: string) => void;
  onLinkedDocumentPress?: (documentId: string) => void;
};

export function AccessDetailScreen({
  accessItem,
  linkedAsset,
  linkedDocuments,
  onBack,
  onDelete,
  onEdit,
  onMarkReviewed,
  onShare,
  reviewStatusLabel,
  onLinkedAssetPress,
  onLinkedDocumentPress,
}: AccessDetailScreenProps) {
  const [isSensitiveVisible, setIsSensitiveVisible] = useState(false);
  const hasSensitiveFields = hasSensitiveAccessDetails(accessItem);
  const sensitivity = getAccessItemSensitivity(accessItem);

  const handleToggleSensitiveVisibility = async () => {
    if (isSensitiveVisible) {
      setIsSensitiveVisible(false);
      return;
    }

    if (await confirmSensitiveReveal('access_details')) {
      setIsSensitiveVisible(true);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <View style={styles.headerActions}>
          {onMarkReviewed ? (
            <Pressable onPress={onMarkReviewed} style={styles.secondaryButton} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Review</Text>
            </Pressable>
          ) : null}
          {onShare ? (
            <Pressable onPress={onShare} style={styles.secondaryButton} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Share</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => confirmDeleteAccessItem(accessItem.label, onDelete)}
            style={styles.dangerButton}
            accessibilityRole="button"
          >
            <Text style={styles.dangerButtonText}>Delete</Text>
          </Pressable>
          <Pressable onPress={onEdit} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>Access</Text>
        <Text style={styles.title}>{accessItem.label}</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{formatAccessCategory(accessItem.category)}</Text>
          </View>
          <View
            style={[
              styles.sensitivityPill,
              sensitivity.level === 'high'
                ? styles.sensitivityPillHigh
                : sensitivity.level === 'medium'
                  ? styles.sensitivityPillMedium
                  : styles.sensitivityPillLow,
            ]}
          >
            <Text
              style={[
                styles.sensitivityPillText,
                sensitivity.level === 'high'
                  ? styles.sensitivityPillTextHigh
                  : sensitivity.level === 'medium'
                    ? styles.sensitivityPillTextMedium
                    : styles.sensitivityPillTextLow,
              ]}
            >
              {sensitivity.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sensitivityNotice}>
        <Text style={styles.sensitivityNoticeTitle}>{sensitivity.label}</Text>
        <Text style={styles.sensitivityNoticeText}>{sensitivity.detail}</Text>
      </View>

      <View style={styles.detailGrid}>
        <DetailItem label="Category" value={formatAccessCategory(accessItem.category)} />
        <DetailItem
          label="Last reviewed"
          value={
            accessItem.lastReviewedAt
              ? formatDateLabel(accessItem.lastReviewedAt.slice(0, 10))
              : accessItem.lastVerifiedAt
                ? formatDateLabel(accessItem.lastVerifiedAt.slice(0, 10))
                : 'Not recorded'
          }
        />
        <DetailItem
          label="Last verified"
          value={accessItem.lastVerifiedAt ? formatDateLabel(accessItem.lastVerifiedAt.slice(0, 10)) : 'Not recorded'}
        />
      </View>

      {reviewStatusLabel ? (
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyNoticeTitle}>Review freshness</Text>
          <Text style={styles.safetyNoticeText}>{reviewStatusLabel}</Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Access details</Text>
          {hasSensitiveFields ? (
            <Pressable
              onPress={() => void handleToggleSensitiveVisibility()}
              style={styles.visibilityButton}
              accessibilityRole="button"
              accessibilityLabel={isSensitiveVisible ? 'Hide sensitive details' : 'Reveal sensitive details'}
            >
              <Text style={styles.visibilityButtonText}>
                {isSensitiveVisible ? 'Hide details' : 'Reveal details'}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyNoticeTitle}>
            {hasSensitiveFields ? 'Sensitive details are hidden by default' : 'No sensitive details stored'}
          </Text>
          <Text style={styles.safetyNoticeText}>{getAccessVisibilityGuidance(accessItem)}</Text>
        </View>
        <DetailLine label="Login" value={formatAccessFieldValue(accessItem.username, isSensitiveVisible)} />
        <DetailLine label="Code" value={formatAccessFieldValue(accessItem.accessCode, isSensitiveVisible)} />
        <DetailLine label="Location" value={formatAccessFieldValue(accessItem.location, isSensitiveVisible)} />
        <DetailLine label="Instructions" value={formatAccessFieldValue(accessItem.instructions, isSensitiveVisible)} />
        <DetailLine label="Notes" value={formatAccessFieldValue(accessItem.notes, isSensitiveVisible)} />
      </View>

      {linkedAsset && onLinkedAssetPress ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Linked device</Text>
          <Pressable
            onPress={() => onLinkedAssetPress(linkedAsset.id)}
            style={styles.linkedRow}
            accessibilityRole="button"
          >
            <View style={styles.linkedBadge}>
              <Text style={styles.linkedBadgeText}>Device</Text>
            </View>
            <View style={styles.linkedBody}>
              <Text style={styles.linkedTitle}>{linkedAsset.name}</Text>
              <Text style={styles.linkedMeta}>
                {linkedAsset.category} · {linkedAsset.roomName}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      ) : null}

      {linkedDocuments.length > 0 && onLinkedDocumentPress ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Linked records</Text>
          {linkedDocuments.map((document) => (
            <Pressable
              key={document.id}
              onPress={() => onLinkedDocumentPress(document.id)}
              style={styles.linkedRow}
              accessibilityRole="button"
            >
              <View style={styles.linkedBadge}>
                <Text style={styles.linkedBadgeText}>Doc</Text>
              </View>
              <View style={styles.linkedBody}>
                <Text style={styles.linkedTitle}>{document.title}</Text>
                <Text style={styles.linkedMeta}>
                  {document.typeLabel} · {document.linkedToLabel}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLineLabel}>{label}</Text>
      <Text style={styles.detailLineValue}>{value}</Text>
    </View>
  );
}

function confirmDeleteAccessItem(label: string, onConfirm: () => Promise<void>) {
  Alert.alert(
    'Delete access record?',
    `"${label}" will be removed from this local HomeVault preview.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void onConfirm();
        },
      },
    ],
  );
}

function formatAccessCategory(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Wi-Fi';
    case 'router':
      return 'Router';
    case 'utility_shutoff':
      return 'Utility shutoff';
    case 'entry_note':
      return 'Entry note';
    case 'lockbox':
      return 'Lockbox';
    default:
      return category.replaceAll('_', ' ');
  }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
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
  primaryButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dangerButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
  },
  heroPanel: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 16,
    gap: 8,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusPill: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderRadius: 14,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  sensitivityPill: {
    minHeight: 28,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensitivityPillHigh: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red,
  },
  sensitivityPillMedium: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
  },
  sensitivityPillLow: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  sensitivityPillText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sensitivityPillTextHigh: {
    color: colors.red,
  },
  sensitivityPillTextMedium: {
    color: colors.amber,
  },
  sensitivityPillTextLow: {
    color: colors.green,
  },
  sensitivityNotice: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 6,
  },
  sensitivityNoticeTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  sensitivityNoticeText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  detailItem: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 4,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  detailValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  panel: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  visibilityButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  safetyNotice: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    padding: 10,
    gap: 4,
  },
  safetyNoticeTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  safetyNoticeText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  detailLine: {
    gap: 3,
  },
  detailLineLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  detailLineValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  linkedBadge: {
    minWidth: 44,
    minHeight: 28,
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  linkedBadgeText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
  },
  linkedBody: {
    flex: 1,
    gap: 3,
  },
  linkedTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  linkedMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: '300',
  },
});
