import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetwork() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    return NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
  }, []);

  return isConnected;
}
