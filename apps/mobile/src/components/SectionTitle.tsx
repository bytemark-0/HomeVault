import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type SectionTitleProps = {
  title: string;
  action: string;
  onActionPress?: () => void;
};

export function SectionTitle({ title, action, onActionPress }: SectionTitleProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onActionPress ? (
        <Pressable onPress={onActionPress} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : (
        <Text style={styles.sectionAction}>{action}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  sectionAction: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '800',
  },
});
