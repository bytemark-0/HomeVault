import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { EmergencyContact } from '@homevault/domain';
import { colors } from '../theme/colors';

type EmergencyContactsScreenProps = {
  emergencyContacts: EmergencyContact[];
  onAddContact: (priority?: EmergencyContact['priority']) => void;
  onBack: () => void;
  onContactPress: (contactId: string) => void;
  onShareContact?: (contactId: string) => void;
};

const priorityFilters: Array<{ value: EmergencyContact['priority'] | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'primary', label: 'Trusted' },
  { value: 'secondary', label: 'Backup' },
  { value: 'service_provider', label: 'Provider' },
  { value: 'other', label: 'Other' },
];

export function EmergencyContactsScreen({
  emergencyContacts,
  onAddContact,
  onBack,
  onContactPress,
  onShareContact,
}: EmergencyContactsScreenProps) {
  const [query, setQuery] = useState('');
  const [activePriority, setActivePriority] =
    useState<EmergencyContact['priority'] | 'all'>('all');

  const filteredContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return emergencyContacts.filter((contact) => {
      const matchesPriority =
        activePriority === 'all' || contact.priority === activePriority;
      const searchableText = [
        contact.name,
        contact.role,
        contact.phone ?? '',
        contact.email ?? '',
        contact.address ?? '',
        contact.notes ?? '',
        formatEmergencyContactPriority(contact.priority),
      ]
        .join(' ')
        .toLowerCase();

      return (
        matchesPriority &&
        (normalizedQuery.length === 0 || searchableText.includes(normalizedQuery))
      );
    });
  }, [activePriority, emergencyContacts, query]);

  const trustedCount = emergencyContacts.filter((contact) => contact.priority === 'primary').length;
  const providerCount = emergencyContacts.filter(
    (contact) => contact.priority === 'service_provider',
  ).length;

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>Emergency contacts</Text>
            <Text style={styles.title}>People and providers to call first</Text>
            <Text style={styles.subtitle}>
              Keep at least three contacts ready so a spouse, house sitter, or emergency helper
              knows who to call without guessing.
            </Text>
          </View>
          <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{emergencyContacts.length}</Text>
          <Text style={styles.summaryLabel}>saved contacts</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{trustedCount}</Text>
          <Text style={styles.summaryLabel}>trusted people</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{providerCount}</Text>
          <Text style={styles.summaryLabel}>service providers</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => onAddContact('primary')}
          style={[styles.actionCard, styles.actionCardPrimary]}
          accessibilityRole="button"
        >
          <Text style={styles.actionTitlePrimary}>Add trusted person</Text>
          <Text style={styles.actionDetailPrimary}>
            Family, neighbor, or friend who can help quickly.
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onAddContact('service_provider')}
          style={styles.actionCard}
          accessibilityRole="button"
        >
          <Text style={styles.actionTitle}>Add service provider</Text>
          <Text style={styles.actionDetail}>
            Plumber, electrician, insurer, vet, or building contact.
          </Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search emergency contacts"
          placeholder="Search names, roles, numbers, or notes"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {priorityFilters.map((filter) => {
          const isActive = filter.value === activePriority;

          return (
            <Pressable
              key={filter.value}
              onPress={() => setActivePriority(filter.value)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Saved contacts</Text>
        <Pressable onPress={() => onAddContact()} accessibilityRole="button">
          <Text style={styles.sectionAction}>Add contact</Text>
        </Pressable>
      </View>

      {emergencyContacts.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Save the first emergency contact</Text>
          <Text style={styles.emptyText}>
            Start with one trusted person, one backup person, and one service provider you would
            want someone to call during a stressful situation.
          </Text>
          <View style={styles.emptyActions}>
            <Pressable
              onPress={() => onAddContact('primary')}
              style={styles.emptyAction}
              accessibilityRole="button"
            >
              <Text style={styles.emptyActionText}>Add trusted person</Text>
            </Pressable>
            <Pressable
              onPress={() => onAddContact('service_provider')}
              style={styles.emptySecondaryAction}
              accessibilityRole="button"
            >
              <Text style={styles.emptySecondaryActionText}>Add provider</Text>
            </Pressable>
          </View>
        </View>
      ) : filteredContacts.length > 0 ? (
        filteredContacts.map((contact) => (
          <View key={contact.id} style={styles.recordCard}>
            <Pressable
              onPress={() => onContactPress(contact.id)}
              style={styles.recordMainButton}
              accessibilityRole="button"
            >
              <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>{contact.name}</Text>
                <Text style={styles.recordTag}>{formatEmergencyContactPriority(contact.priority)}</Text>
              </View>
              <Text style={styles.recordDetail}>{contact.role}</Text>
              {contact.phone ? <Text style={styles.recordMeta}>Phone: {contact.phone}</Text> : null}
              {contact.email ? <Text style={styles.recordMeta}>Email: {contact.email}</Text> : null}
              {contact.address ? <Text style={styles.recordMeta}>Address: {contact.address}</Text> : null}
              {contact.notes ? <Text style={styles.recordMeta}>{contact.notes}</Text> : null}
            </Pressable>
            {onShareContact ? (
              <View style={styles.recordActionRow}>
                <Pressable
                  onPress={() => onShareContact(contact.id)}
                  style={styles.shareButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.shareButtonText}>Share contact</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No contacts match this search</Text>
          <Text style={styles.emptyText}>Try another search or contact type filter.</Text>
        </View>
      )}
    </View>
  );
}

export function formatEmergencyContactPriority(priority: EmergencyContact['priority']) {
  switch (priority) {
    case 'primary':
      return 'Trusted person';
    case 'secondary':
      return 'Backup contact';
    case 'service_provider':
      return 'Service provider';
    case 'other':
    default:
      return 'Other contact';
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  hero: {
    gap: 6,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroText: {
    flex: 1,
    gap: 6,
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
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
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
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 2,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minHeight: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 8,
  },
  actionCardPrimary: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  actionTitlePrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  actionDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  actionDetailPrimary: {
    color: '#D7F3E7',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  searchBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    minHeight: 40,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    gap: 8,
    paddingRight: 8,
  },
  filterPill: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  filterTextActive: {
    color: colors.green,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyAction: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  emptySecondaryAction: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySecondaryActionText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  recordCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 5,
  },
  recordMainButton: {
    gap: 5,
  },
  recordHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  recordTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  recordTag: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  recordDetail: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  recordMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  recordActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  shareButton: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
});
