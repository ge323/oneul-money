import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const APP_NAME = '얼마';
const APP_SUBTITLE = '하루 소비 예산';
const APP_VERSION = '1.0.0';
const DEVELOPER_NAME = 'ge323';
const CONTACT_EMAIL = 'ge323.dev@gmail.com';

export default function AppInfoScreen() {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed &&
              styles.buttonPressed,
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
          앱 정보
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />

          <Text style={styles.appName}>
            {APP_NAME}
          </Text>

          <Text style={styles.appSubtitle}>
            {APP_SUBTITLE}
          </Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>
              v{APP_VERSION}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>
            오늘 얼마 써도 될지,
            한눈에 확인해보세요.
          </Text>

          <Text style={styles.descriptionText}>
            얼마는 사용자가 직접 입력한 예산과 지출 정보를 바탕으로
            남은 생활비와 오늘의 권장 소비 금액을 계산해주는
            소비 예산 관리 앱입니다.
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>
            앱 정보
          </Text>

          <InfoRow
            icon="apps-outline"
            label="앱 이름"
            value={APP_NAME}
          />

          <InfoRow
            icon="pricetag-outline"
            label="버전"
            value={APP_VERSION}
          />

          <InfoRow
            icon="person-outline"
            label="개발자"
            value={DEVELOPER_NAME}
          />

          <InfoRow
            icon="mail-outline"
            label="문의"
            value={CONTACT_EMAIL}
            last
          />
        </View>

        <View style={styles.featureSection}>
          <Text style={styles.sectionTitle}>
            주요 기능
          </Text>

          <FeatureItem
            icon="wallet-outline"
            title="오늘의 권장 소비 금액"
            description="남은 생활비와 다음 월급일까지의 기간을 바탕으로 오늘 사용할 수 있는 금액을 계산합니다."
          />

          <FeatureItem
            icon="receipt-outline"
            title="지출 기록"
            description="사용한 금액과 카테고리를 기록하고 월별 소비 내역을 확인할 수 있습니다."
          />

          <FeatureItem
            icon="calendar-outline"
            title="소비 계획"
            description="앞으로 예정된 지출을 미리 반영해 실제로 사용할 수 있는 생활비를 관리합니다."
          />

          <FeatureItem
            icon="bag-check-outline"
            title="구매 시뮬레이션"
            description="구매 전 금액을 입력해 구매 후 하루 예산이 얼마나 달라지는지 확인할 수 있습니다."
          />
        </View>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#687386"
          />

          <Text style={styles.noticeText}>
            얼마에서 제공하는 예산과 소비 관련 계산 결과는
            사용자가 입력한 정보를 기반으로 제공되는 참고용 정보이며,
            금융·투자·재무 자문을 목적으로 하지 않습니다.
          </Text>
        </View>

        <Text style={styles.copyright}>
          © 2026 {DEVELOPER_NAME}. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon:
    | 'apps-outline'
    | 'pricetag-outline'
    | 'person-outline'
    | 'mail-outline';
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        last && styles.infoRowLast,
      ]}
    >
      <View style={styles.infoLeft}>
        <View style={styles.infoIconBox}>
          <Ionicons
            name={icon}
            size={18}
            color="#687386"
          />
        </View>

        <Text style={styles.infoLabel}>
          {label}
        </Text>
      </View>

      <Text
        style={styles.infoValue}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon:
    | 'wallet-outline'
    | 'receipt-outline'
    | 'calendar-outline'
    | 'bag-check-outline';
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconBox}>
        <Ionicons
          name={icon}
          size={20}
          color="#3563C9"
        />
      </View>

      <View style={styles.featureTextArea}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureDescription}>
          {description}
        </Text>
      </View>
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
    paddingTop: 28,
    paddingBottom: 56,
  },

  hero: {
    alignItems: 'center',
    marginBottom: 30,
  },

  appIcon: {
    width: 84,
    height: 84,
  },

  appName: {
    marginTop: 16,
    fontSize: 23,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#172033',
  },

  appSubtitle: {
    marginTop: 5,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#8792A2',
  },

  versionBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F1F5FC',
  },

  versionBadgeText: {
    fontSize: 10,
    fontFamily: 'Pretendard-Bold',
    color: '#687386',
  },

  descriptionCard: {
    padding: 19,
    backgroundColor: '#F5F8FE',
    borderRadius: 18,
    marginBottom: 30,
  },

  descriptionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  descriptionText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'Pretendard-Regular',
    color: '#687386',
  },

  infoSection: {
    marginBottom: 30,
  },

  sectionTitle: {
    marginBottom: 8,
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  infoRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoLabel: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: '#687386',
  },

  infoValue: {
    flex: 1,
    marginLeft: 16,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: '#172033',
  },

  featureSection: {
    marginBottom: 28,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },

  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#E7EEFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  featureTextArea: {
    flex: 1,
    paddingTop: 1,
  },

  featureTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  featureDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'Pretendard-Regular',
    color: '#8792A2',
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

  copyright: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Pretendard-Regular',
    color: '#A3ADBC',
  },
});