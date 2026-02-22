import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import ToastContainer from '../components/ui/Toast';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a1a' }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a1a' },
          headerTintColor: '#e8eaff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#0a0a1a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'My Soul Chart', headerShown: false }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="form/[mode]"
          options={{ title: '정보 입력', headerBackTitle: '뒤로' }}
        />
        <Stack.Screen
          name="chat/[mode]"
          options={{ title: '상담', headerBackTitle: '뒤로' }}
        />
        <Stack.Screen
          name="card/[mode]"
          options={{ title: '결과 카드', headerBackTitle: '뒤로' }}
        />
        <Stack.Screen
          name="chart"
          options={{ title: 'Soul Chart' }}
        />
      </Stack>
      <ToastContainer />
    </View>
  );
}
