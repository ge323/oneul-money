import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Screen from '../../components/screen';

export default function SettingsTabScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>
          설정
        </Text>

        <Text style={styles.description}>
          이번 달 생활비를 관리해보세요.
        </Text>

        <View style={styles.menu}>
          <Pressable
            style={styles.menuItem}
            onPress={() =>
              router.push('/settings')
            }
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
                이번 달에 사용할 생활비 한도를 설정해요.
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',

    // 소비 계획 화면과 동일
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  title: {
    // 소비 계획 화면과 동일
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#172033',
  },

  description: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Pretendard-Regular',
    color: '#8792A2',
  },

  menu: {
    marginTop: 28,
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
    lineHeight: 22,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  menuDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Pretendard-Regular',
    color: '#8792A2',
  },
});