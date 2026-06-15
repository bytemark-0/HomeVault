import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function MetricCard({ label, value, detail, onPress, accessibilityLabel }: MetricCardProps) {
  return (
    <Pressable
      style={styles.metricCard}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    width: '48.6%',
    minHeight: 112,
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  metricDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
