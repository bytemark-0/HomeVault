import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type ShareHubScreenProps = {
  onBack: () => void;
  onOpenAccessShares: () => void;
  onOpenCareCards: () => void;
  onOpenContactsShares: () => void;
  onOpenDevicesShares: () => void;
  onOpenDocumentsShares: () => void;
  onOpenEmergencyPacket: () => void;
  onOpenRecoveryAccountShares: () => void;
  onOpenTrustedHandoff: () => void;
};

export function ShareHubScreen({
  onBack,
  onOpenAccessShares,
  onOpenCareCards,
  onOpenContactsShares,
  onOpenDevicesShares,
  onOpenDocumentsShares,
  onOpenEmergencyPacket,
  onOpenRecoveryAccountShares,
  onOpenTrustedHandoff,
}: ShareHubScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>Share and handoff</Text>
            <Text style={styles.title}>Choose the right amount of access</Text>
            <Text style={styles.subtitle}>
              Use the packet for broad emergency context, trusted handoff for a curated section set,
              or encrypted item share when one record is enough.
            </Text>
          </View>
          <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Broad handoff</Text>
        <Pressable
          onPress={onOpenEmergencyPacket}
          style={[styles.actionCard, styles.actionCardPrimary]}
          accessibilityRole="button"
        >
          <Text style={styles.actionTitlePrimary}>Open emergency packet</Text>
          <Text style={styles.actionDetailPrimary}>
            Export a concise backup with critical records, contacts, and continuity details.
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenTrustedHandoff}
          style={[styles.actionCard, styles.actionCardSecondary]}
          accessibilityRole="button"
        >
          <Text style={styles.actionTitle}>Start trusted handoff</Text>
          <Text style={styles.actionDetail}>
            Share selected sections for a spouse, sitter, travel helper, or emergency contact.
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenCareCards}
          style={styles.actionCard}
          accessibilityRole="button"
        >
          <Text style={styles.actionTitle}>Open care cards</Text>
          <Text style={styles.actionDetail}>
            Start a child, pet, elder, or medical-support handoff with structured caregiver details.
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Encrypted single-record share</Text>
        <Text style={styles.sectionIntro}>
          Each item share is encrypted, read-only on import, and can omit fields that are not
          needed for the audience.
        </Text>
        <ShortcutCard
          title="Access items"
          detail="Wi-Fi details, shutoff notes, lockbox instructions, and other entry help."
          cta="Open Access"
          onPress={onOpenAccessShares}
        />
        <ShortcutCard
          title="Emergency contacts"
          detail="Send one trusted person or provider without exposing unrelated household records."
          cta="Open contacts"
          onPress={onOpenContactsShares}
        />
        <ShortcutCard
          title="Recovery accounts"
          detail="Share an insurer, utility, carrier, or other recovery-relevant account."
          cta="Open Emergency"
          onPress={onOpenRecoveryAccountShares}
        />
        <ShortcutCard
          title="Key devices"
          detail="Share one phone, router, laptop, or smart-home device with recovery context."
          cta="Open devices"
          onPress={onOpenDevicesShares}
        />
        <ShortcutCard
          title="Critical documents"
          detail="Share one insurance, emergency, or other critical file record."
          cta="Open documents"
          onPress={onOpenDocumentsShares}
        />
      </View>
    </View>
  );
}

function ShortcutCard({
  cta,
  detail,
  onPress,
  title,
}: {
  cta: string;
  detail: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.shortcutCard} accessibilityRole="button">
      <Text style={styles.shortcutTitle}>{title}</Text>
      <Text style={styles.shortcutDetail}>{detail}</Text>
      <Text style={styles.shortcutCta}>{cta}</Text>
    </Pressable>
  );
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
    color: colors.blue,
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
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionIntro: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  actionCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 4,
  },
  actionCardPrimary: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  actionCardSecondary: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  actionTitle: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '900',
  },
  actionDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  actionTitlePrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  actionDetailPrimary: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  shortcutCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 4,
  },
  shortcutTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  shortcutDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  shortcutCta: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
