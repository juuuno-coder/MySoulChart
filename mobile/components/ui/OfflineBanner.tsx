import { View, Text, StyleSheet } from 'react-native';

export default function OfflineBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>오프라인 상태입니다. 네트워크를 확인해주세요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    color: '#fca5a5',
    fontWeight: '500',
  },
});
