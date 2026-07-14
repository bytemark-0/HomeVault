import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { EmergencyContact } from '@homevault/domain';
import { colors } from '../theme/colors';
import { formatEmergencyContactPriority } from './EmergencyContactsScreen';
import { formatImportantAccountManagerRole } from '../utils/digitalSafety';
import { formatDateLabel } from '../utils/taskUtils';

type EmergencyContactDetailScreenProps = {
  contact: EmergencyContact;
  onBack: () => void;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  onMarkReviewed?: () => void;
  onShare?: () => void;
  reviewStatusLabel?: string;
};

export function EmergencyContactDetailScreen({
  contact,
  onBack,
  onDelete,
  onEdit,
  onMarkReviewed,
  onShare,
  reviewStatusLabel,
}: EmergencyContactDetailScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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
            onPress={() => confirmDeleteEmergencyContact(contact.name, onDelete)}
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
        <Text style={styles.kicker}>Emergency contact</Text>
        <Text style={styles.title}>{contact.name}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>
            {formatEmergencyContactPriority(contact.priority)}
          </Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <DetailItem label="Type" value={formatEmergencyContactPriority(contact.priority)} />
        <DetailItem label="Relationship or provider" value={contact.role} />
        <DetailItem
          label="Responsibility"
          value={formatEmergencyContactResponsibility(contact.responsibilityCategory)}
        />
        <DetailItem
          label="Last reviewed"
          value={contact.lastReviewedAt ? formatDateLabel(contact.lastReviewedAt) : 'Not recorded'}
        />
      </View>

      {reviewStatusLabel ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Review freshness</Text>
          <Text style={styles.detailLineValue}>{reviewStatusLabel}</Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Reach this contact</Text>
        <DetailLine
          label="Owned by"
          value={
            contact.ownerRole
              ? formatImportantAccountManagerRole(contact.ownerRole)
              : 'Not recorded'
          }
        />
        <DetailLine
          label="Backup helper"
          value={contact.backupHelperName ?? 'Not recorded'}
        />
        <DetailLine label="Phone" value={contact.phone ?? 'Not recorded'} />
        <DetailLine label="Email" value={contact.email ?? 'Not recorded'} />
        <DetailLine label="Address" value={contact.address ?? 'Not recorded'} />
        <DetailLine label="Notes" value={contact.notes ?? 'No notes yet.'} />

        <View style={styles.actionRow}>
          {contact.phone ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${contact.phone}`).catch(() => {})}
              style={styles.linkButton}
              accessibilityRole="button"
            >
              <Text style={styles.linkButtonText}>Call contact</Text>
            </Pressable>
          ) : null}
          {contact.email ? (
            <Pressable
              onPress={() => Linking.openURL(`mailto:${contact.email}`).catch(() => {})}
              style={styles.linkButton}
              accessibilityRole="button"
            >
              <Text style={styles.linkButtonText}>Email contact</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
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

function formatEmergencyContactResponsibility(
  category?: EmergencyContact['responsibilityCategory'],
) {
  switch (category) {
    case 'school':
      return 'School / daycare';
    case 'pet':
      return 'Pet care';
    case 'home_service':
      return 'Home service';
    case 'trusted_helper':
      return 'Trusted helper';
    case 'other':
      return 'Other';
    default:
      return 'General helper';
  }
}

function confirmDeleteEmergencyContact(label: string, onConfirm: () => Promise<void>) {
  Alert.alert(
    'Delete emergency contact?',
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
  kicker: {
    color: '#B9C4C9',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  statusPill: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderRadius: 14,
    backgroundColor: '#21313A',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#B8D7CB',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  detailItem: {
    flex: 1,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 4,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
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
  detailLine: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 3,
  },
  detailLineLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailLineValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  linkButton: {
    minHeight: 38,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.page,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
});
