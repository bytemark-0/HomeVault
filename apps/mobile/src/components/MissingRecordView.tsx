import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type MissingRecordViewProps = {
  title: string;
  detail: string;
  actionLabel: string;
  onActionPress: () => void;
};

export function MissingRecordView({
  title,
  detail,
  actionLabel,
  onActionPress,
}: MissingRecordViewProps) {
  return (
    <View style={styles.root}>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Record unavailable</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
        <Pressable
          onPress={onActionPress}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 18,
    gap: 10,
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
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  detail: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  action: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.green,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
