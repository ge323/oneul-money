import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LicenseItem = {
  name: string;
  license: string;
  description: string;
};

const LICENSES: LicenseItem[] = [
  {
    name: 'React Native',
    license: 'MIT License',
    description:
      '앱의 사용자 인터페이스와 네이티브 기능 구성을 위해 사용합니다.',
  },
  {
    name: 'Expo',
    license: 'MIT License',
    description:
      'React Native 앱 개발, 실행 및 빌드 환경을 위해 사용합니다.',
  },
  {
    name: 'Expo Router',
    license: 'MIT License',
    description:
      '앱 화면 간 파일 기반 라우팅과 내비게이션을 위해 사용합니다.',
  },
  {
    name: '@expo/vector-icons',
    license: 'MIT License',
    description:
      '앱 화면의 아이콘 표시를 위해 사용합니다.',
  },
  {
    name: 'Ionicons',
    license: 'MIT License',
    description:
      '메뉴, 달력, 지출 등 다양한 UI 아이콘을 위해 사용합니다.',
  },
  {
    name: '@react-native-async-storage/async-storage',
    license: 'MIT License',
    description:
      '예산, 지출 내역, 소비 계획 등의 로컬 데이터 저장을 위해 사용합니다.',
  },
  {
    name: 'react-native-calendars',
    license: 'MIT License',
    description:
      '지출 및 소비 계획에서 날짜를 선택하는 달력 UI를 위해 사용합니다.',
  },
  {
    name: 'react-native-safe-area-context',
    license: 'MIT License',
    description:
      '기기별 안전 영역을 고려한 화면 배치를 위해 사용합니다.',
  },
];

export default function LicensesScreen() {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleBack}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#172033"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          오픈소스 라이선스
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.iconBox}>
            <Ionicons
              name="code-slash-outline"
              size={24}
              color="#3563C9"
            />
          </View>

          <Text style={styles.introTitle}>
            오픈소스 소프트웨어 안내
          </Text>

          <Text style={styles.introDescription}>
            얼마는 안정적인 서비스 제공을 위해 여러 오픈소스
            소프트웨어를 사용하고 있습니다. 각 오픈소스의 저작권과
            라이선스는 해당 권리자에게 있습니다.
          </Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>
            현재 확인된 주요 오픈소스
          </Text>

          <Text style={styles.summaryAmount}>
            {LICENSES.length}개
          </Text>
        </View>

        <View style={styles.list}>
          {LICENSES.map((item, index) => (
            <View
              key={item.name}
              style={[
                styles.licenseItem,
                index === LICENSES.length - 1 &&
                  styles.licenseItemLast,
              ]}
            >
              <View style={styles.licenseTop}>
                <Text style={styles.licenseName}>
                  {item.name}
                </Text>

                <View style={styles.licenseBadge}>
                  <Text style={styles.licenseBadgeText}>
                    MIT
                  </Text>
                </View>
              </View>

              <Text style={styles.licenseDescription}>
                {item.description}
              </Text>

              <Text style={styles.licenseType}>
                {item.license}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.mitBox}>
          <Text style={styles.mitTitle}>
            MIT License 안내
          </Text>

          <Text style={styles.mitText}>
            MIT 라이선스는 저작권 및 라이선스 고지를 유지하는 조건으로
            소프트웨어의 사용, 복제, 수정, 배포 등을 허용하는
            오픈소스 라이선스입니다.
          </Text>

          <Text style={styles.mitText}>
            각 라이브러리의 정확한 저작권자, 라이선스 전문 및 추가 고지
            사항은 해당 오픈소스 프로젝트에 포함된 LICENSE 파일의
            내용을 따릅니다.
          </Text>
        </View>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color="#687386"
          />

          <Text style={styles.noticeText}>
            이 화면에는 현재 앱 코드에서 확인된 주요 라이브러리를
            우선 표시하고 있습니다. 출시 전 package.json 및
            package-lock.json을 기준으로 전체 의존성을 다시 확인해
            최종 고지 목록을 확정할 예정입니다.
          </Text>
        </View>

        <Text style={styles.footer}>
          얼마 · ge323
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    backgroundColor: '#F3F6FA',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  headerSpacer: {
    width: 40,
  },

  scroll: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 56,
  },

  intro: {
    padding: 20,
    backgroundColor: '#F5F8FE',
    borderRadius: 20,
    marginBottom: 18,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#E7EEFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  introTitle: {
    fontSize: 19,
    lineHeight: 27,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#172033',
  },

  introDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: 'Pretendard-Regular',
    color: '#687386',
  },

  summaryBox: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFD',
    borderRadius: 15,
    marginBottom: 28,
  },

  summaryLabel: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: '#687386',
  },

  summaryAmount: {
    fontSize: 15,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#3563C9',
  },

  list: {
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },

  licenseItem: {
    paddingVertical: 19,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },

  licenseItemLast: {
    marginBottom: 28,
  },

  licenseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  licenseName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  licenseBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E7EEFC',
  },

  licenseBadgeText: {
    fontSize: 10,
    fontFamily: 'Pretendard-Bold',
    color: '#3563C9',
  },

  licenseDescription: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: 'Pretendard-Regular',
    color: '#687386',
  },

  licenseType: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: 'Pretendard-Medium',
    color: '#98A2B3',
  },

  mitBox: {
    padding: 17,
    backgroundColor: '#F8FAFD',
    borderRadius: 16,
    marginBottom: 16,
  },

  mitTitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  mitText: {
    marginTop: 9,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'Pretendard-Regular',
    color: '#687386',
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 15,
    backgroundColor: '#FFF9ED',
    borderRadius: 14,
  },

  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'Pretendard-Regular',
    color: '#7A6847',
  },

  footer: {
    marginTop: 22,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    color: '#A3ADBC',
  },
});