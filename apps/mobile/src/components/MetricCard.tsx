import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
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
