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

export default function TermsScreen() {
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
          이용약관
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
              name="document-text-outline"
              size={24}
              color="#3563C9"
            />
          </View>

          <Text style={styles.introTitle}>
            얼마 서비스 이용약관
          </Text>

          <Text style={styles.introDescription}>
            본 약관은 얼마 앱의 이용과 관련하여
            서비스 제공자와 이용자 간의 기본적인 사항을 정합니다.
          </Text>
        </View>

        <TermsSection title="제1조 목적">
          <TermsText>
            본 약관은 ge323(이하 “개발자”)가 제공하는
            얼마 앱(이하 “서비스”)의 이용과 관련하여
            개발자와 이용자 간의 권리, 의무 및 책임사항 등
            기본적인 이용조건을 정함을 목적으로 합니다.
          </TermsText>
        </TermsSection>

        <TermsSection title="제2조 서비스의 내용">
          <TermsText>
            서비스는 사용자가 직접 입력한 예산, 고정지출,
            저축·투자 금액, 지출 내역 및 예정 지출 정보를 바탕으로
            생활비 관리에 도움을 주는 기능을 제공합니다.
          </TermsText>

          <Bullet text="남은 생활비 계산" />
          <Bullet text="오늘의 권장 소비 금액 계산" />
          <Bullet text="지출 내역 기록 및 관리" />
          <Bullet text="예정 지출 및 소비 계획 관리" />
          <Bullet text="구매 후 예산 시뮬레이션" />
        </TermsSection>

        <TermsSection title="제3조 서비스 이용">
          <TermsText>
            이용자는 본인의 판단과 책임 하에 서비스를 이용합니다.
            서비스가 제공하는 계산 결과는 사용자가 입력한 정보를
            기반으로 산출된 참고용 정보입니다.
          </TermsText>
        </TermsSection>

        <TermsSection title="제4조 금융·투자 관련 안내">
          <TermsText>
            서비스가 제공하는 예산, 소비 가능 금액, 구매 가능 여부 등의
            정보는 금융상품 추천, 투자 권유, 자산관리, 재무설계 또는
            전문적인 금융 자문을 목적으로 하지 않습니다.
          </TermsText>

          <TermsText>
            실제 소비 또는 금융 의사결정은 이용자 본인의 상황과
            판단에 따라 이루어져야 하며, 서비스의 계산 결과만을 근거로
            중요한 재무 결정을 내리는 것은 권장하지 않습니다.
          </TermsText>
        </TermsSection>

        <TermsSection title="제5조 이용자의 책임">
          <TermsText>
            이용자는 서비스에 정확한 정보를 입력하고,
            자신의 기기와 앱 데이터를 적절히 관리할 책임이 있습니다.
          </TermsText>

          <TermsText>
            이용자의 입력 오류, 기기 분실, 앱 삭제, 운영체제의
            데이터 처리 방식 등으로 인해 발생한 데이터 손실에 대해서는
            개발자가 책임을 부담하지 않을 수 있습니다.
          </TermsText>
        </TermsSection>

        <TermsSection title="제6조 서비스의 변경 및 중단">
          <TermsText>
            개발자는 서비스의 품질 개선, 기능 변경, 유지보수,
            운영상의 필요 등에 따라 서비스의 전부 또는 일부를
            변경하거나 중단할 수 있습니다.
          </TermsText>
        </TermsSection>

        <TermsSection title="제7조 지식재산권">
          <TermsText>
            서비스의 디자인, 로고, 화면 구성, 문구, 소프트웨어 등
            개발자가 권리를 보유하는 콘텐츠의 권리는 개발자에게 있습니다.
            오픈소스 소프트웨어의 권리는 각 라이선스에 따릅니다.
          </TermsText>
        </TermsSection>

        <TermsSection title="제8조 책임의 제한">
          <TermsText>
            개발자는 천재지변, 통신 장애, 운영체제 오류,
            이용자의 기기 문제 등 합리적으로 통제하기 어려운 사유로
            발생한 손해에 대해 책임이 제한될 수 있습니다.
          </TermsText>

          <TermsText>
            서비스에서 제공하는 계산값은 참고용 정보이므로,
            이를 이용한 실제 소비, 계약, 투자 또는 기타 재무상 결정의
            최종 책임은 이용자에게 있습니다.
          </TermsText>
        </TermsSection>

        <TermsSection title="제9조 약관의 변경">
          <TermsText>
            관련 법령, 정책 또는 서비스 내용의 변경에 따라
            본 약관은 변경될 수 있습니다.
            중요한 변경 사항이 있는 경우 앱 또는 별도 공개 페이지를 통해
            안내할 수 있습니다.
          </TermsText>
        </TermsSection>

        <TermsSection title="제10조 문의">
          <InfoRow label="개발자" value={DEVELOPER_NAME} />
          <InfoRow label="이메일" value={CONTACT_EMAIL} />
        </TermsSection>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color="#687386"
          />

          <Text style={styles.noticeText}>
            본 약관은 서비스의 실제 기능과 운영 방식에 맞춰
            계속 정비될 수 있습니다.
          </Text>
        </View>

        <Text style={styles.effectiveDate}>
          시행일: 앱 최초 출시일
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function TermsSection({
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

function TermsText({
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
