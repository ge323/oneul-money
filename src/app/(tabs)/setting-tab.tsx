import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function SettingsTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        설정
      </Text>

      <Text style={styles.description}>
        예산과 월급일을 관리해보세요.
      </Text>

      <View style={styles.menu}>
        <Pressable
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <View style={styles.iconBox}>
            <Ionicons
              name="wallet-outline"
              size={22}
              color="#3563C9"
            />
          </View>

          <View style={styles.menuTextArea}>
            <Text style={styles.menuTitle}>
              예산 설정
            </Text>

            <Text style={styles.menuDescription}>
              월 예산, 고정비, 저축 목표를 설정해요.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#98A2B3"
          />
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => router.push('/payday')}
        >
          <View style={styles.iconBox}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color="#3563C9"
            />
          </View>

          <View style={styles.menuTextArea}>
            <Text style={styles.menuTitle}>
              월급일 설정
            </Text>

            <Text style={styles.menuDescription}>
              월급일 또는 말일 지급을 설정해요.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#98A2B3"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  title: {
    fontSize: 28,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#172033',
  },

  description: {
    marginTop: 8,
    fontSize: 15,
    color: '#8792A2',
  },

  menu: {
    marginTop: 28,
    gap: 12,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuTextArea: {
    flex: 1,
    marginLeft: 14,
  },

  menuTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  menuDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#8792A2',
  },
});