import { View, StyleSheet } from 'react-native';

type TabKey = 'home' | 'access' | 'documents' | 'devices' | 'emergency';

type TabIconProps = {
  tabKey: TabKey;
  color: string;
};

export function TabIcon({ tabKey, color }: TabIconProps) {
  switch (tabKey) {
    case 'home':
      return <HomeIcon color={color} />;
    case 'access':
      return <AccessIcon color={color} />;
    case 'documents':
      return <DocumentsIcon color={color} />;
    case 'devices':
      return <DevicesIcon color={color} />;
    case 'emergency':
      return <EmergencyIcon color={color} />;
  }
}

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={styles.frame}>
      <View style={styles.roofRow}>
        <View style={[styles.roofLeft, { backgroundColor: color }]} />
        <View style={[styles.roofRight, { backgroundColor: color }]} />
      </View>
      <View style={[styles.houseBody, { backgroundColor: color }]}>
        <View style={[styles.door, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function AccessIcon({ color }: { color: string }) {
  return (
    <View style={styles.frame}>
      <View style={styles.keyHeadRow}>
        <View style={[styles.keyRing, { borderColor: color }]} />
        <View style={[styles.keyStem, { backgroundColor: color }]} />
      </View>
      <View style={styles.keyTeethRow}>
        <View style={[styles.keyToothTall, { backgroundColor: color }]} />
        <View style={[styles.keyToothShort, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function DevicesIcon({ color }: { color: string }) {
  return (
    <View style={styles.frame}>
      <View style={styles.gridRow}>
        <View style={[styles.gridCell, { backgroundColor: color }]} />
        <View style={[styles.gridCell, { backgroundColor: color }]} />
      </View>
      <View style={styles.gridRow}>
        <View style={[styles.gridCell, { backgroundColor: color }]} />
        <View style={[styles.gridCell, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function DocumentsIcon({ color }: { color: string }) {
  return (
    <View style={[styles.page, { borderColor: color }]}>
      <View style={[styles.pageLine, { backgroundColor: color }]} />
      <View style={[styles.pageLine, { backgroundColor: color }]} />
      <View style={[styles.pageLineShort, { backgroundColor: color }]} />
    </View>
  );
}

function EmergencyIcon({ color }: { color: string }) {
  return (
    <View style={styles.frame}>
      <View style={[styles.alertTriangle, { borderBottomColor: color }]} />
      <View style={styles.alertMark}>
        <View style={[styles.alertStem, { backgroundColor: color }]} />
        <View style={[styles.alertDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  roofRow: {
    flexDirection: 'row',
    width: 18,
    height: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 1,
  },
  roofLeft: {
    width: 9,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '-30deg' }, { translateY: -1 }],
  },
  roofRight: {
    width: 9,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '30deg' }, { translateY: -1 }],
  },
  houseBody: {
    width: 14,
    height: 9,
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 1,
  },
  door: {
    width: 4,
    height: 5,
    borderRadius: 1,
    opacity: 0.35,
  },
  keyHeadRow: {
    width: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  keyRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  keyStem: {
    width: 9,
    height: 2.5,
    borderRadius: 1,
  },
  keyTeethRow: {
    width: 18,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 2,
    marginTop: 2,
  },
  keyToothTall: {
    width: 2.5,
    height: 5,
    borderRadius: 0.5,
  },
  keyToothShort: {
    width: 2.5,
    height: 3.5,
    borderRadius: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 3,
  },
  gridCell: {
    width: 7,
    height: 7,
    borderRadius: 1.5,
  },
  page: {
    width: 14,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 2,
    padding: 3,
    gap: 3,
    justifyContent: 'center',
  },
  pageLine: {
    height: 1.5,
    borderRadius: 1,
  },
  pageLineShort: {
    height: 1.5,
    borderRadius: 1,
    width: '60%',
  },
  alertTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  alertMark: {
    position: 'absolute',
    bottom: 3,
    alignItems: 'center',
    gap: 2,
  },
  alertStem: {
    width: 2.5,
    height: 6,
    borderRadius: 1,
  },
  alertDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },
});
