import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type AppHeaderProps = {
  title: string;
  description?: string;
  showBack?: boolean;
};

export default function AppHeader({
  title,
  description,
  showBack = true,
}: AppHeaderProps) {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      {showBack && (
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color="#172033"
          />
        </Pressable>
      )}

      <Text style={styles.title}>
        {title}
      </Text>

      {description ? (
        <Text style={styles.description}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#172033',
  },

  description: {
    marginTop: 8,
    fontSize: 15,
    color: '#687386',
  },
});