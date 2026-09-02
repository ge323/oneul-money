import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

const ONBOARDING_KEY = 'onboarding-completed';

export default function StartScreen() {
  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed =
        await AsyncStorage.getItem(
          ONBOARDING_KEY
        );

      if (completed === 'true') {
        router.replace('/(tabs)');
        return;
      }

      router.replace('/onboarding');
    } catch (error) {
      console.error(
        '온보딩 확인 실패:',
        error
      );

      router.replace('/onboarding');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="small"
        color="#3563C9"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});