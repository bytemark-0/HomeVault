import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHomeVault } from '../context/HomeVaultContext';
import { colors } from '../theme/colors';

const SUPPORT_EMAIL = 'support@homevault.app';

const KNOWN_LIMITATIONS = [
  'Private beta builds are local-first and do not sync across devices.',
  'Backup and restore are the recovery path for moving data between installs.',
  'OCR label capture, cloud sync, and larger project tracking are planned after launch readiness.',
];

type BetaSupportScreenProps = {
  onBack?: () => void;
};

export function BetaSupportScreen({ onBack }: BetaSupportScreenProps) {
  const { appData, isSampleMode } = useHomeVault();
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const buildNumber =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;
  const buildLabel = buildNumber ? `${appVersion} (${buildNumber})` : appVersion;
  const deviceLabel = Constants.deviceName ?? 'Unavailable';
  const recordCounts = appData
    ? [
        `${appData.roomCount} rooms`,
        `${appData.assetCount} assets`,
        `${appData.documentCount} documents`,
        `${appData.activeTaskCount} open tasks`,
      ].join(', ')
    : 'No active vault loaded';

  function sendFeedback() {
    const body = [
      'What happened?',
      '',
      'What did you expect?',
      '',
      'Steps to reproduce:',
      '1. ',
      '',
      'Can we follow up with questions?',
      '',
      'App context:',
      `- Version: ${buildLabel}`,
      `- Platform: ${Platform.OS}`,
      `- Device: ${deviceLabel}`,
      `- Sample mode: ${isSampleMode ? 'yes' : 'no'}`,
      `- Record counts: ${recordCounts}`,
      '',
      'Please avoid including private addresses, serial numbers, document contents, or attachment files unless support specifically asks for them.',
    ].join('\n');
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('HomeVault beta feedback')}&body=${encodeURIComponent(body)}`;
    void Linking.openURL(url);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: 18 + insets.top, paddingBottom: 32 + insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={onBack ?? (() => router.back())}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Beta Support</Text>
          <Text style={styles.subtitle}>Privacy, feedback, and release context.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Local-first privacy</Text>
        <Text style={styles.bodyText}>
          HomeVault stores your vault on this device. The beta does not upload your home records,
          documents, addresses, serial numbers, photos, notes, or attachments to a HomeVault server.
        </Text>
        <Text style={styles.bodyText}>
          Backups and exports are files you choose to create and share. Keep them somewhere safe,
          because anyone with the file may be able to read the household records inside it.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Permissions</Text>
        <InfoRow
          label="Photos"
          value="Used when you attach room, asset, repair, property, or document images."
        />
        <InfoRow
          label="Camera"
          value="Used for barcode scanning and taking HomeVault photos when you choose those actions."
        />
        <InfoRow
          label="Notifications"
          value="Requested only when reminders are useful for maintenance tasks."
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delete or move data</Text>
        <Text style={styles.bodyText}>
          To move data, export a backup from the Export screen and restore it on another install.
          To delete beta data from this device, remove the app or use platform app-storage controls.
        </Text>
        <Text style={styles.bodyText}>
          Restoring a backup replaces the current local vault after confirmation.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Known beta limits</Text>
        {KNOWN_LIMITATIONS.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>App context</Text>
        <InfoRow label="Version" value={buildLabel} />
        <InfoRow label="Platform" value={Platform.OS} />
        <InfoRow label="Device" value={deviceLabel} />
        <InfoRow label="Mode" value={isSampleMode ? 'Sample home' : 'Real vault'} />
        <InfoRow label="Records" value={recordCounts} />
      </View>

      <Pressable
        onPress={sendFeedback}
        style={styles.primaryButton}
        accessibilityRole="button"
        accessibilityLabel="Send beta feedback"
      >
        <Text style={styles.primaryButtonText}>Send beta feedback</Text>
      </Pressable>

      <Text style={styles.footerNote}>
        Feedback opens your mail app with a template. It does not attach diagnostics or private
        household data automatically.
      </Text>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '400',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  bodyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  infoValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  footerNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});
