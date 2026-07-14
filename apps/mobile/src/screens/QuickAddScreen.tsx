import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type QuickAddScreenProps = {
  repairAssetName?: string;
  onOpenAccess: () => void;
  onOpenDevices: () => void;
  onOpenDocuments: () => void;
  onOpenEmergency: () => void;
  onCancel: () => void;
  onRecordRepair: () => void;
};

export function QuickAddScreen({
  repairAssetName,
  onOpenAccess,
  onOpenDevices,
  onOpenDocuments,
  onOpenEmergency,
  onCancel,
  onRecordRepair,
}: QuickAddScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Quick add</Text>
          <Text style={styles.title}>Start with the essentials</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.optionGrid}>
        <QuickAddOption
          title="Access"
          detail="Wi-Fi details, garage codes, and shutoff notes"
          marker="A"
          onPress={onOpenAccess}
        />
        <QuickAddOption
          title="Emergency"
          detail="Contacts, accounts, and your export packet"
          marker="E"
          onPress={onOpenEmergency}
        />
        <QuickAddOption
          title="Device"
          detail="Router, phone, laptop, tablet, or essential equipment"
          marker="D"
          onPress={onOpenDevices}
        />
        <QuickAddOption
          title="Document"
          detail="Policy, warranty, receipt, manual, or report"
          marker="R"
          onPress={onOpenDocuments}
        />
        <QuickAddOption
          title="Repair"
          detail={
            repairAssetName
              ? `Record service for ${repairAssetName}`
              : 'Add an asset first, then record repair history'
          }
          marker="R"
          onPress={onRecordRepair}
        />
      </View>
    </ScrollView>
  );
}

function QuickAddOption({
  title,
  detail,
  marker,
  onPress,
}: {
  title: string;
  detail: string;
  marker: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.optionCard} accessibilityRole="button">
      <View style={styles.optionMarker}>
        <Text style={styles.optionMarkerText}>{marker}</Text>
      </View>
      <View style={styles.optionBody}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDetail}>{detail}</Text>
      </View>
    </Pressable>
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
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  cancelButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  optionGrid: {
    gap: 10,
  },
  optionCard: {
    minHeight: 92,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionMarker: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionMarkerText: {
    color: colors.green,
    fontSize: 18,
    fontWeight: '900',
  },
  optionBody: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  optionDetail: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
