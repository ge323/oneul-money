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

const DEVELOPER_NAME = 'ge323';
const CONTACT_EMAIL = 'ge323.dev@gmail.com';

export default function PrivacyScreen() {
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
          개인정보처리방침
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
              name="shield-checkmark-outline"
              size={24}
              color="#3563C9"
            />
          </View>

          <Text style={styles.introTitle}>
            개인정보를 소중하게 다룹니다.
          </Text>

          <Text style={styles.introDescription}>
            얼마는 서비스 제공에 필요한 범위에서 정보를 처리하며,
            사용자가 입력한 예산과 지출 정보의 보호를 중요하게 생각합니다.
          </Text>
        </View>

        <PolicySection title="1. 개인정보의 처리">
          <PolicyText>
            현재 얼마는 회원가입 및 로그인 기능을 제공하지 않으며,
            개발자가 운영하는 별도의 서버로 사용자의 예산, 지출 내역,
            소비 계획 등의 정보를 전송하거나 직접 수집하지 않습니다.
          </PolicyText>

          <PolicyText>
            사용자가 앱에 입력한 예산, 고정지출, 저축·투자 금액,
            지출 내역 및 소비 계획 등의 정보는 앱의 기능 제공을 위해
            사용자의 기기 내부 저장소에 저장됩니다.
          </PolicyText>
        </PolicySection>

        <PolicySection title="2. 정보의 이용 목적">
          <Bullet text="남은 생활비 계산" />
          <Bullet text="오늘의 권장 소비 금액 계산" />
          <Bullet text="지출 내역 및 소비 계획 관리" />
          <Bullet text="구매 후 예산 시뮬레이션 제공" />
          <Bullet text="사용자가 설정한 예산 정보의 유지" />
        </PolicySection>

        <PolicySection title="3. 개인정보의 보유 및 이용기간">
          <PolicyText>
            앱에 입력한 정보는 사용자의 기기 내부에 보관되며,
            사용자가 앱에서 해당 데이터를 삭제하거나 앱 데이터를
            초기화하는 경우 삭제될 수 있습니다.
          </PolicyText>

          <PolicyText>
            앱 삭제 시 기기 또는 운영체제의 동작 방식에 따라
            앱 내부에 저장된 데이터가 함께 삭제될 수 있습니다.
          </PolicyText>
        </PolicySection>

        <PolicySection title="4. 개인정보의 제3자 제공">
          <PolicyText>
            현재 얼마는 사용자가 앱에 입력한 개인정보를 개발자가
            별도로 수집하여 제3자에게 제공하지 않습니다.
          </PolicyText>
        </PolicySection>

        <PolicySection title="5. 개인정보 처리의 위탁">
          <PolicyText>
            현재 얼마는 사용자가 앱에 입력한 예산 및 지출 정보를
            외부 사업자에게 처리하도록 위탁하지 않습니다.
          </PolicyText>
        </PolicySection>

        <PolicySection title="6. 이용자의 권리">
          <PolicyText>
            사용자는 앱에서 자신의 지출 내역과 소비 계획을 확인,
            수정 또는 삭제할 수 있으며, 앱에서 제공하는 데이터 초기화
            기능을 통해 저장된 정보를 직접 관리할 수 있습니다.
          </PolicyText>
        </PolicySection>

        <PolicySection title="7. 개인정보의 안전성 확보">
          <PolicyText>
            얼마는 현재 사용자의 주요 예산 및 지출 데이터를 별도의
            개발자 서버에 저장하지 않고 기기 내부에서 처리하는 방식을
            사용하고 있습니다.
          </PolicyText>
        </PolicySection>

        <PolicySection title="8. 개인정보처리방침의 변경">
          <PolicyText>
            서비스 기능 또는 관련 법령·정책의 변경에 따라 본 방침의
            내용이 변경될 수 있습니다. 중요한 변경이 있는 경우 앱 또는
            공개된 정책 페이지를 통해 안내할 수 있습니다.
          </PolicyText>
        </PolicySection>

        <PolicySection title="9. 개인정보 관련 문의">
          <InfoRow label="개발자" value={DEVELOPER_NAME} />
          <InfoRow label="이메일" value={CONTACT_EMAIL} />
        </PolicySection>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color="#687386"
          />
          <Text style={styles.noticeText}>
            향후 로그인, 클라우드 동기화, 광고, 분석 도구 등
            개인정보 처리 방식에 영향을 주는 기능이 추가되면
            실제 처리 내용에 맞게 본 방침도 함께 변경됩니다.
          </Text>
        </View>

        <Text style={styles.effectiveDate}>
          시행일: 앱 최초 출시일
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

function PolicyText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text style={styles.bodyText}>
      {children}
    </Text>
  );
}

function Bullet({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>
        {text}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        selectable
      >
        {value}
      </Text>
    </View>
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
    marginBottom: 32,
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

  section: {
    paddingBottom: 26,
    marginBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },

  sectionTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  sectionBody: {
    marginTop: 12,
    gap: 10,
  },

  bodyText: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: 'Pretendard-Regular',
    color: '#5F6B7C',
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  bulletDot: {
    width: 4,
    height: 4,
    marginTop: 8,
    marginRight: 9,
    borderRadius: 2,
    backgroundColor: '#7292D8',
  },

  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Pretendard-Regular',
    color: '#5F6B7C',
  },

  infoRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },

  infoLabel: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: '#8792A2',
  },

  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: '#3563C9',
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 15,
    backgroundColor: '#F8FAFD',
    borderRadius: 14,
  },

  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'Pretendard-Regular',
    color: '#687386',
  },

  effectiveDate: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    color: '#A3ADBC',
  },
});
