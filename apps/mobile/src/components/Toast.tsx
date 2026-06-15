import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type ToastProps = {
  message: string | null;
  kind?: 'success' | 'error' | 'info';
  onDismiss: () => void;
};

export function Toast({ message, kind = 'success', onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(onDismiss, 2500);

    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.banner, kind === 'error' && styles.errorBanner, kind === 'info' && styles.infoBanner]}>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  banner: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 6,
  },
  errorBanner: {
    backgroundColor: colors.red,
  },
  infoBanner: {
    backgroundColor: colors.blue,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
