import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useHomeVault } from '../context/HomeVaultContext';
import { colors } from '../theme/colors';

export function SampleModeNotice() {
  const { isSampleMode, exitSampleMode } = useHomeVault();

  if (!isSampleMode) return null;

  return (
    <View style={styles.notice} accessibilityLabel="Sample home notice">
      <View style={styles.body}>
        <Text style={styles.kicker}>Sample continuity guide</Text>
        <Text style={styles.title}>You are exploring a sample household operating manual.</Text>
        <Text style={styles.text}>
          Use it to see how access details, key documents, devices, and recovery notes fit
          together. Leaving sample mode deletes these demo records from this device.
        </Text>
      </View>
      <Pressable
        style={styles.action}
        onPress={() =>
          Alert.alert(
            'Create your own household guide?',
            'HomeVault will delete the sample records on this device and return you to setup.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Create my own guide',
                style: 'destructive',
                onPress: () => void exitSampleMode(),
              },
            ],
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Create your own household guide"
      >
        <Text style={styles.actionText}>Create your own guide</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: 8,
    borderColor: '#D4A05A',
    borderWidth: 1,
    backgroundColor: colors.amberSoft,
    padding: 14,
    gap: 12,
  },
  body: {
    gap: 4,
  },
  kicker: {
    color: colors.amber,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  text: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  action: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: colors.amber,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
