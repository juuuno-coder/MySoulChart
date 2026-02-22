import { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToToasts, removeToast, ToastMessage } from '../../shared/utils/toast';

const TYPE_CONFIG: Record<string, { bg: string; border: string; icon: string }> = {
  success: { bg: '#065f46', border: '#10b981', icon: '✓' },
  error:   { bg: '#7f1d1d', border: '#ef4444', icon: '✕' },
  info:    { bg: '#1e3a5f', border: '#3b82f6', icon: 'ℹ' },
  warning: { bg: '#78350f', border: '#f59e0b', icon: '⚠' },
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;

  return (
    <Animated.View
      style={[
        styles.item,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
      <TouchableOpacity onPress={() => removeToast(toast.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => subscribeToToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  icon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  close: {
    fontSize: 14,
    color: '#ffffff80',
    fontWeight: 'bold',
  },
});
