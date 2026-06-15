import { View, StyleSheet } from 'react-native';

type TabKey = 'home' | 'inventory' | 'maintenance' | 'documents' | 'household';

type TabIconProps = {
  tabKey: TabKey;
  color: string;
};

export function TabIcon({ tabKey, color }: TabIconProps) {
  switch (tabKey) {
    case 'home':
      return <HomeIcon color={color} />;
    case 'inventory':
      return <InventoryIcon color={color} />;
    case 'maintenance':
      return <TasksIcon color={color} />;
    case 'documents':
      return <DocumentsIcon color={color} />;
    case 'household':
      return <HouseholdIcon color={color} />;
  }
}

// House silhouette: roof peak + body
function HomeIcon({ color }: { color: string }) {
  return (
    <View style={styles.frame}>
      {/* Roof: two angled bars meeting at a peak */}
      <View style={styles.roofRow}>
        <View style={[styles.roofLeft, { backgroundColor: color }]} />
        <View style={[styles.roofRight, { backgroundColor: color }]} />
      </View>
      {/* Body */}
      <View style={[styles.houseBody, { backgroundColor: color }]}>
        <View style={[styles.door, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

// 2×2 grid of squares — inventory/items
function InventoryIcon({ color }: { color: string }) {
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

// Stacked lines with a check on the first — task list
function TasksIcon({ color }: { color: string }) {
  return (
    <View style={styles.frame}>
      {/* Checkmark row */}
      <View style={styles.taskRow}>
        <View style={styles.taskCheck}>
          <View style={[styles.checkLeft, { backgroundColor: color }]} />
          <View style={[styles.checkRight, { backgroundColor: color }]} />
        </View>
        <View style={[styles.taskLine, { backgroundColor: color, flex: 1 }]} />
      </View>
      {/* Plain line rows */}
      <View style={[styles.taskLine, { backgroundColor: color, marginTop: 4 }]} />
      <View style={[styles.taskLine, { backgroundColor: color, width: 12, marginTop: 4 }]} />
    </View>
  );
}

// Page rectangle with 3 text lines
function DocumentsIcon({ color }: { color: string }) {
  return (
    <View style={[styles.page, { borderColor: color }]}>
      <View style={[styles.pageLine, { backgroundColor: color }]} />
      <View style={[styles.pageLine, { backgroundColor: color }]} />
      <View style={[styles.pageLineShort, { backgroundColor: color }]} />
    </View>
  );
}

// Building: flat roof + 3 floors of windows
function HouseholdIcon({ color }: { color: string }) {
  return (
    <View style={styles.frame}>
      <View style={[styles.buildingRoof, { backgroundColor: color }]} />
      <View style={[styles.buildingBody, { borderColor: color }]}>
        <View style={styles.windowRow}>
          <View style={[styles.window, { backgroundColor: color }]} />
          <View style={[styles.window, { backgroundColor: color }]} />
        </View>
        <View style={styles.windowRow}>
          <View style={[styles.window, { backgroundColor: color }]} />
          <View style={[styles.window, { backgroundColor: color }]} />
        </View>
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

  // Home icon
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

  // Inventory grid
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

  // Tasks checklist
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 18,
  },
  taskCheck: {
    width: 7,
    height: 7,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 0,
  },
  checkLeft: {
    width: 3,
    height: 2,
    borderRadius: 0.5,
    transform: [{ rotate: '45deg' }, { translateY: -1 }],
  },
  checkRight: {
    width: 5,
    height: 2,
    borderRadius: 0.5,
    transform: [{ rotate: '-55deg' }, { translateX: -2 }, { translateY: -2 }],
  },
  taskLine: {
    height: 2,
    borderRadius: 1,
    width: 18,
  },

  // Documents page
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

  // Household building
  buildingRoof: {
    width: 18,
    height: 2.5,
    borderRadius: 1,
    marginBottom: 1,
  },
  buildingBody: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 1,
    padding: 2,
    gap: 2,
    justifyContent: 'center',
  },
  windowRow: {
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  window: {
    width: 4,
    height: 3,
    borderRadius: 0.5,
    opacity: 0.6,
  },
});
