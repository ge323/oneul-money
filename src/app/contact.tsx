import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEVELOPER_NAME = 'ge323';
const CONTACT_EMAIL = 'ge323.dev@gmail.com';

export default function ContactScreen() {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  };

  const handleEmail = async () => {
    const subject =
      encodeURIComponent(
        '[얼마] 문의드립니다'
      );

    const body =
      encodeURIComponent(
        [
          '안녕하세요.',
          '',
          '얼마 앱 관련 문의드립니다.',
          '',
          '문의 내용:',
          '',
          '',
          '앱 버전: 1.0.0',
          '기기 정보:',
        ].join('\n')
      );

    const mailUrl =
      `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    const canOpen =
      await Linking.canOpenURL(
        mailUrl
      );

    if (canOpen) {
      await Linking.openURL(
        mailUrl
      );
    }
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
          문의하기
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.intro}>
          <View style={styles.iconBox}>
            <Ionicons
              name="mail-outline"
              size={24}
              color="#3563C9"
            />
          </View>

          <Text style={styles.introTitle}>
            도움이 필요하신가요?
          </Text>

          <Text
            style={
              styles.introDescription
            }
          >
            앱 이용 중 불편한 점이나
            오류, 개선 의견이 있다면
            언제든지 알려주세요.
          </Text>
        </View>

        <View style={styles.contactCard}>
          <View
            style={styles.contactTopRow}
          >
            <View
              style={
                styles.contactIconBox
              }
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color="#3563C9"
              />
            </View>

            <View
              style={
                styles.contactTextArea
              }
            >
              <Text
                style={
                  styles.contactLabel
                }
              >
                이메일 문의
              </Text>

              <Text
                style={
                  styles.contactEmail
                }
                selectable
              >
                {CONTACT_EMAIL}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.emailButton,
              pressed &&
                styles.emailButtonPressed,
            ]}
            onPress={handleEmail}
          >
            <Ionicons
              name="paper-plane-outline"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.emailButtonText
              }
            >
              이메일 보내기
            </Text>
          </Pressable>
        </View>

        <View style={styles.guideSection}>
          <Text
            style={
              styles.sectionTitle
            }
          >
            문의하실 때 알려주세요
          </Text>

          <GuideItem
            number="1"
            title="어떤 문제가 발생했는지"
            description="오류 메시지나 문제가 발생한 상황을 자세히 알려주시면 확인에 도움이 됩니다."
          />

          <GuideItem
            number="2"
            title="사용 중인 기기와 OS"
            description="예: Galaxy S24 / Android 16"
          />

          <GuideItem
            number="3"
            title="가능하면 화면 캡처"
            description="문제가 보이는 화면을 함께 보내주시면 더 빠르게 확인할 수 있습니다."
          />
        </View>

        <View style={styles.responseNotice}>
          <Ionicons
            name="time-outline"
            size={18}
            color="#687386"
          />

          <View style={styles.noticeTextArea}>
            <Text style={styles.noticeTitle}>
              답변 안내
            </Text>

            <Text style={styles.noticeText}>
              개인 개발 앱 특성상 답변까지
              시간이 걸릴 수 있습니다.
              확인 후 가능한 범위에서
              순차적으로 답변드리겠습니다.
            </Text>
          </View>
        </View>

        <View style={styles.developerInfo}>
          <Text
            style={
              styles.developerLabel
            }
          >
            개발자
          </Text>

          <Text
            style={
              styles.developerValue
            }
          >
            {DEVELOPER_NAME}
          </Text>
        </View>

        <Text style={styles.footer}>
          얼마 · v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function GuideItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.guideItem}>
      <View
        style={styles.guideNumber}
      >
        <Text
          style={
            styles.guideNumberText
          }
        >
          {number}
        </Text>
      </View>

      <View
        style={styles.guideTextArea}
      >
        <Text
          style={styles.guideTitle}
        >
          {title}
        </Text>

        <Text
          style={
            styles.guideDescription
          }
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
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
      borderBottomColor:
        '#EEF1F5',
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    buttonPressed: {
      backgroundColor:
        '#F3F6FA',
    },

    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontFamily:
        'Pretendard-Bold',
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
      backgroundColor:
        '#F5F8FE',
      borderRadius: 20,
      marginBottom: 22,
    },

    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor:
        '#E7EEFC',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
    },

    introTitle: {
      fontSize: 19,
      lineHeight: 27,
      fontFamily:
        'Pretendard-ExtraBold',
      color: '#172033',
    },

    introDescription: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 21,
      fontFamily:
        'Pretendard-Regular',
      color: '#687386',
    },

    contactCard: {
      padding: 18,
      borderWidth: 1,
      borderColor: '#E7ECF3',
      borderRadius: 18,
      marginBottom: 32,
    },

    contactTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    contactIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        '#F1F5FC',
      alignItems: 'center',
      justifyContent: 'center',
    },

    contactTextArea: {
      flex: 1,
      marginLeft: 13,
    },

    contactLabel: {
      fontSize: 12,
      fontFamily:
        'Pretendard-Medium',
      color: '#8792A2',
    },

    contactEmail: {
      marginTop: 4,
      fontSize: 14,
      fontFamily:
        'Pretendard-Bold',
      color: '#172033',
    },

    emailButton: {
      minHeight: 52,
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor:
        '#3563C9',
      borderRadius: 15,
    },

    emailButtonPressed: {
      backgroundColor:
        '#294FA5',
      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    emailButtonText: {
      fontSize: 14,
      fontFamily:
        'Pretendard-Bold',
      color: '#FFFFFF',
    },

    guideSection: {
      marginBottom: 30,
    },

    sectionTitle: {
      marginBottom: 4,
      fontSize: 15,
      fontFamily:
        'Pretendard-Bold',
      color: '#172033',
    },

    guideItem: {
      flexDirection: 'row',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEF1F5',
    },

    guideNumber: {
      width: 25,
      height: 25,
      borderRadius: 8,
      backgroundColor:
        '#E7EEFC',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    guideNumberText: {
      fontSize: 11,
      fontFamily:
        'Pretendard-Bold',
      color: '#3563C9',
    },

    guideTextArea: {
      flex: 1,
    },

    guideTitle: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily:
        'Pretendard-SemiBold',
      color: '#172033',
    },

    guideDescription: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 18,
      fontFamily:
        'Pretendard-Regular',
      color: '#8792A2',
    },

    responseNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 16,
      backgroundColor:
        '#F8FAFD',
      borderRadius: 15,
    },

    noticeTextArea: {
      flex: 1,
    },

    noticeTitle: {
      fontSize: 12,
      fontFamily:
        'Pretendard-Bold',
      color: '#172033',
    },

    noticeText: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 18,
      fontFamily:
        'Pretendard-Regular',
      color: '#687386',
    },

    developerInfo: {
      marginTop: 26,
      paddingTop: 18,
      borderTopWidth: 1,
      borderTopColor:
        '#EEF1F5',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    developerLabel: {
      fontSize: 12,
      fontFamily:
        'Pretendard-Regular',
      color: '#98A2B3',
    },

    developerValue: {
      fontSize: 12,
      fontFamily:
        'Pretendard-SemiBold',
      color: '#687386',
    },

    footer: {
      marginTop: 22,
      textAlign: 'center',
      fontSize: 11,
      fontFamily:
        'Pretendard-Regular',
      color: '#A3ADBC',
    },
  });
