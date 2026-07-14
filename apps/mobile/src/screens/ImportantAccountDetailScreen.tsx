import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import type { ImportantAccount } from '@homevault/domain';
import type { DocumentListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';
import {
  formatImportantAccountKind,
  formatImportantAccountManagerRole,
} from '../utils/digitalSafety';
import { confirmSensitiveReveal } from '../utils/sensitiveReveal';
import { getImportantAccountSensitivity } from '../utils/sensitivity';
import { formatDateLabel } from '../utils/taskUtils';

type ImportantAccountDetailScreenProps = {
  account: ImportantAccount;
  linkedDocuments: DocumentListItem[];
  onBack: () => void;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  onMarkReviewed?: () => void;
  onShare?: () => void;
  reviewStatusLabel?: string;
  onLinkedDocumentPress?: (documentId: string) => void;
};

export function ImportantAccountDetailScreen({
  account,
  linkedDocuments,
  onBack,
  onDelete,
  onEdit,
  onMarkReviewed,
  onShare,
  reviewStatusLabel,
  onLinkedDocumentPress,
}: ImportantAccountDetailScreenProps) {
  const sensitivity = getImportantAccountSensitivity(account);
  const [isRecoveryVisible, setIsRecoveryVisible] = useState(false);
  const needsSupportRefresh = reviewStatusLabel?.toLowerCase().includes('review') ?? false;

  const handleToggleRecoveryVisibility = async () => {
    if (isRecoveryVisible) {
      setIsRecoveryVisible(false);
      return;
    }

    if (await confirmSensitiveReveal('recovery_notes')) {
      setIsRecoveryVisible(true);
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
            onPress={() => confirmDeleteImportantAccount(account.label, onDelete)}
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
        <Text style={styles.kicker}>Important account</Text>
        <Text style={styles.title}>{account.label}</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{formatImportantAccountKind(account.kind)}</Text>
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

      <View style={styles.noticePanel}>
        <Text style={styles.noticeTitle}>Passwords stay out of HomeVault</Text>
        <Text style={styles.noticeText}>
          This record tracks support contacts, recovery notes, and whether protections are in
          place. It does not store passwords, one-time codes, or autofill data.
        </Text>
      </View>

      <View style={styles.sensitivityNotice}>
        <Text style={styles.sensitivityNoticeTitle}>{sensitivity.label}</Text>
        <Text style={styles.sensitivityNoticeText}>{sensitivity.detail}</Text>
      </View>

      <View style={styles.detailGrid}>
        <DetailItem label="Provider" value={account.providerName} />
        <DetailItem label="Type" value={formatImportantAccountKind(account.kind)} />
        <DetailItem
          label="Managed by"
          value={formatImportantAccountManagerRole(account.managerRole)}
        />
        <DetailItem label="Backup helper" value={account.backupHelperName ?? 'Not recorded'} />
        <DetailItem
          label="Household access"
          value={account.isSharedHouseholdAccount ? 'Shared household account' : 'Single owner'}
        />
        <DetailItem label="Account ID" value={account.accountNumber ?? 'Not recorded'} />
        <DetailItem label="Website" value={account.website ?? 'Not recorded'} />
        <DetailItem
          label="Last reviewed"
          value={account.lastReviewedAt ? formatDateLabel(account.lastReviewedAt) : 'Not recorded'}
        />
      </View>

      {reviewStatusLabel ? (
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyNoticeTitle}>Review freshness</Text>
          <Text style={styles.safetyNoticeText}>{reviewStatusLabel}</Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Recovery readiness</Text>
        <DetailLine label="MFA enabled" value={formatBooleanStatus(account.mfaEnabled)} />
        <DetailLine
          label="Recovery codes stored"
          value={formatBooleanStatus(account.recoveryCodesStored)}
        />
        <DetailLine
          label="Password manager"
          value={formatBooleanStatus(account.managedInPasswordManager)}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Support details</Text>
          {account.recoveryNotes ? (
            <Pressable
              onPress={() => void handleToggleRecoveryVisibility()}
              style={styles.visibilityButton}
              accessibilityRole="button"
              accessibilityLabel={isRecoveryVisible ? 'Hide recovery notes' : 'Reveal recovery notes'}
            >
              <Text style={styles.visibilityButtonText}>
                {isRecoveryVisible ? 'Hide recovery notes' : 'Reveal recovery notes'}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <DetailLine label="Phone" value={account.phone ?? 'Not recorded'} />
        <DetailLine label="Email" value={account.email ?? 'Not recorded'} />
        {needsSupportRefresh && (account.phone || account.email) ? (
          <View style={styles.safetyNotice}>
            <Text style={styles.safetyNoticeTitle}>Recovery phone or email may be stale</Text>
            <Text style={styles.safetyNoticeText}>
              Review this account again after support numbers, reset inboxes, or provider contacts
              change.
            </Text>
          </View>
        ) : null}
        {account.isSharedHouseholdAccount && needsSupportRefresh ? (
          <View style={styles.safetyNotice}>
            <Text style={styles.safetyNoticeTitle}>Shared family access can drift</Text>
            <Text style={styles.safetyNoticeText}>
              Confirm who still uses this login, which devices stay signed in, and whether the
              recovery details still point to the right household members.
            </Text>
          </View>
        ) : null}
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyNoticeTitle}>
            {account.recoveryNotes ? 'Recovery notes stay hidden by default' : 'No recovery notes saved'}
          </Text>
          <Text style={styles.safetyNoticeText}>
            {account.recoveryNotes
              ? 'Confirm locally before revealing account recovery guidance on this device.'
              : 'Add recovery guidance without storing passwords or one-time codes.'}
          </Text>
        </View>
        <DetailLine
          label="Recovery notes"
          value={account.recoveryNotes ? (isRecoveryVisible ? account.recoveryNotes : 'Hidden until revealed') : 'No notes yet.'}
        />
        <DetailLine label="Notes" value={account.notes ?? 'No notes yet.'} />
        {account.website ? (
          <Pressable
            onPress={() => {
              const url = account.website!.startsWith('http') ? account.website! : `https://${account.website!}`;
              Linking.openURL(url).catch(() => {});
            }}
            style={styles.linkButton}
            accessibilityRole="button"
          >
            <Text style={styles.linkButtonText}>Open website</Text>
          </Pressable>
        ) : null}
      </View>

      {linkedDocuments.length > 0 && onLinkedDocumentPress ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Linked documents</Text>
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

function confirmDeleteImportantAccount(label: string, onConfirm: () => Promise<void>) {
  Alert.alert(
    'Delete account?',
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

function formatBooleanStatus(value: boolean | undefined) {
  if (value == null) {
    return 'Not reviewed';
  }

  return value ? 'Yes' : 'No';
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
    minHeight: 150,
    borderRadius: 8,
    backgroundColor: colors.ink,
    padding: 18,
    justifyContent: 'space-between',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  kicker: {
    color: colors.greenSoft,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  statusPill: {
    alignSelf: 'flex-start',
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
  },
  sensitivityPill: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 7,
    borderWidth: 1,
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
  noticePanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.blueSoft,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  noticeText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  sensitivityNotice: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
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
    fontWeight: '700',
    lineHeight: 18,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    width: '48.6%',
    minHeight: 86,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 8,
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
    lineHeight: 20,
  },
  panel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
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
    borderColor: colors.line,
    borderWidth: 1,
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
    fontWeight: '700',
    lineHeight: 17,
  },
  detailLine: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLineLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  detailLineValue: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  linkButton: {
    alignSelf: 'flex-start',
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
  },
  linkedRow: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.page,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkedBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedBadgeText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  linkedBody: {
    flex: 1,
    gap: 4,
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
    lineHeight: 17,
  },
  chevron: {
    color: colors.blue,
    fontSize: 20,
    fontWeight: '700',
  },
});
