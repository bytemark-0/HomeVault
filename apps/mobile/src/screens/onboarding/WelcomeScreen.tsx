import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHomeVault } from '../../context/HomeVaultContext';
import { colors } from '../../theme/colors';

const VALUE_POINTS = [
  {
    icon: '🏠',
    heading: 'Keep home records together',
    body: 'Appliances, systems, rooms, and warranties — all in one place.',
  },
  {
    icon: '🔔',
    heading: 'Stay ahead of maintenance',
    body: 'Set reminders and track what needs attention before it becomes a problem.',
  },
  {
    icon: '📄',
    heading: 'Preserve documents and service history',
    body: 'Store manuals, receipts, and repair records so you never lose them again.',
  },
];

type Props = {
  onSetUp?: () => void;
  onSupport?: () => void;
};

export function WelcomeScreen({ onSetUp, onSupport }: Props) {
  const { enterSampleMode } = useHomeVault();
  const insets = useSafeAreaInsets();
  const [loadingSample, setLoadingSample] = useState(false);

  async function handleExploreSample() {
    setLoadingSample(true);
    await enterSampleMode();
    setLoadingSample(false);
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 48 + insets.top, paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.wordmark}>HomeVault</Text>
          <Text style={styles.tagline}>Your home, documented.</Text>
          <Text style={styles.subTagline}>
            A private record of everything that makes up your home — built to last.
          </Text>
        </View>

        <View style={styles.valueList}>
          {VALUE_POINTS.map((point) => (
            <View key={point.heading} style={styles.valueRow}>
              <Text style={styles.valueIcon}>{point.icon}</Text>
              <View style={styles.valueBody}>
                <Text style={styles.valueHeading}>{point.heading}</Text>
                <Text style={styles.valueText}>{point.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.privacy}>
          <Text style={styles.privacyHeading}>Private by default</Text>
          <Text style={styles.privacyText}>
            All your data stays on this device. HomeVault never uploads your home records to any server.
          </Text>
          <Text style={styles.privacyText}>
            You choose when to create backup or export files. Beta feedback never includes your
            household details unless you decide to share them.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: 24 + insets.bottom }]}>
        <Pressable
          style={styles.primaryButton}
          onPress={onSetUp}
          accessibilityRole="button"
          accessibilityLabel="Set up my home"
        >
          <Text style={styles.primaryButtonText}>Set up my home</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, loadingSample && styles.buttonDisabled]}
          onPress={loadingSample ? undefined : handleExploreSample}
          accessibilityRole="button"
          accessibilityLabel="Explore a sample home"
          accessibilityState={{ busy: loadingSample }}
        >
          {loadingSample ? (
            <ActivityIndicator color={colors.muted} />
          ) : (
            <Text style={styles.secondaryButtonText}>Explore a sample home</Text>
          )}
        </Pressable>

        {onSupport ? (
          <Pressable
            style={styles.tertiaryButton}
            onPress={onSupport}
            accessibilityRole="button"
            accessibilityLabel="Privacy and beta support"
          >
            <Text style={styles.tertiaryButtonText}>Privacy & beta support</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    gap: 32,
  },
  hero: {
    gap: 10,
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.green,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 32,
  },
  subTagline: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.muted,
    lineHeight: 23,
  },
  valueList: {
    gap: 20,
  },
  valueRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  valueIcon: {
    fontSize: 24,
    lineHeight: 30,
    width: 36,
    textAlign: 'center',
  },
  valueBody: {
    flex: 1,
    gap: 3,
  },
  valueHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    lineHeight: 20,
  },
  privacy: {
    backgroundColor: colors.panel,
    borderRadius: 10,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  privacyHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
  },
  privacyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    lineHeight: 19,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 28,
    paddingTop: 16,
    gap: 12,
    backgroundColor: colors.page,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  primaryButton: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    borderColor: colors.line,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  tertiaryButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tertiaryButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '800',
  },
});
