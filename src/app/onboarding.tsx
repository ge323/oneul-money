import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } =
  Dimensions.get('window');

const ONBOARDING_KEY =
  'onboarding-completed';

type OnboardingPage = {
  id: string;
  image: ImageSourcePropType;
  title: string;
  highlight: string;
  description: string;
};

const pages: OnboardingPage[] = [
  {
    id: '1',

    image: require(
      '../../assets/images/onboarding/onboarding_1.png'
    ),

    title: '오늘, 얼마까지\n',

    highlight: '써도 될까요?',

    description:
      '이번 달 사용할 금액과 고정지출,\n월급일까지의 기간을 계산해\n오늘 쓸 수 있는 금액을 알려드려요.',
  },

  {
    id: '2',

    image: require(
      '../../assets/images/onboarding/onboarding_2.png'
    ),

    title: '기록할수록\n',

    highlight:
      '더 정확해져요',

    description:
      '지출을 기록하면 남은 생활비를 반영해\n오늘 쓸 수 있는 금액을\n바로 다시 계산해드려요.',
  },
];

export default function OnboardingScreen() {
  const flatListRef =
    useRef<FlatList<OnboardingPage>>(
      null
    );

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const onViewableItemsChanged =
    useRef(
      ({
        viewableItems,
      }: {
        viewableItems: ViewToken[];
      }) => {
        if (
          viewableItems.length >
            0 &&
          viewableItems[0]
            .index !== null
        ) {
          setCurrentIndex(
            viewableItems[0]
              .index ?? 0
          );
        }
      }
    ).current;

  const viewabilityConfig =
    useRef({
      itemVisiblePercentThreshold: 50,
    }).current;

  const finishOnboarding =
    async () => {
      try {
        await AsyncStorage.setItem(
          ONBOARDING_KEY,
          'true'
        );

        /*
         * 온보딩 이후
         * 처음 예산 설정으로 이동
         */
        router.replace('/settings');
      } catch (error) {
        console.error(
          '온보딩 완료 저장 실패:',
          error
        );
      }
    };

  const goNext = () => {
    if (
      currentIndex <
      pages.length - 1
    ) {
      flatListRef.current?.scrollToIndex(
        {
          index:
            currentIndex + 1,

          animated: true,
        }
      );

      return;
    }

    finishOnboarding();
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* 건너뛰기 */}

      <View
        style={
          styles.topArea
        }
      >
        <Pressable
          style={
            styles.skipButton
          }
          onPress={
            finishOnboarding
          }
        >
          <Text
            style={
              styles.skipText
            }
          >
            건너뛰기
          </Text>
        </Pressable>
      </View>

      {/* 페이지 */}

      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={
          false
        }
        keyExtractor={(
          item
        ) => item.id}
        onViewableItemsChanged={
          onViewableItemsChanged
        }
        viewabilityConfig={
          viewabilityConfig
        }
        renderItem={({
          item,
        }) => (
          <View
            style={
              styles.page
            }
          >
            {/* 제목 */}

            <View
              style={
                styles.textArea
              }
            >
              <Text
                style={
                  styles.title
                }
              >
                {item.title}

                <Text
                  style={
                    styles.highlight
                  }
                >
                  {
                    item.highlight
                  }
                </Text>
              </Text>

              <Text
                style={
                  styles.description
                }
              >
                {
                  item.description
                }
              </Text>
            </View>

            {/* 이미지 */}

            <View
              style={
                styles.imageArea
              }
            >
              <Image
                source={
                  item.image
                }
                style={
                  styles.image
                }
                resizeMode="contain"
              />
            </View>
          </View>
        )}
      />

      {/* 하단 */}

      <View
        style={
          styles.bottomArea
        }
      >
        {/* 페이지 점 */}

        <View
          style={
            styles.dots
          }
        >
          {pages.map(
            (_, index) => (
              <View
                key={
                  index
                }
                style={[
                  styles.dot,

                  currentIndex ===
                    index &&
                    styles.activeDot,
                ]}
              />
            )
          )}
        </View>

        {/* 버튼 */}

        <Pressable
          style={({
            pressed,
          }) => [
            styles.nextButton,

            pressed &&
              styles.nextButtonPressed,
          ]}
          onPress={
            goNext
          }
        >
          <Text
            style={
              styles.nextButtonText
            }
          >
            {currentIndex ===
            pages.length - 1
              ? '시작하기'
              : '다음'}
          </Text>

          {currentIndex <
            pages.length -
              1 && (
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#FFFFFF"
            />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        '#FFFFFF',
    },

    /* 상단 */

    topArea: {
      minHeight: 52,

      paddingHorizontal: 22,

      alignItems:
        'flex-end',

      justifyContent:
        'center',
    },

    skipButton: {
      paddingHorizontal: 5,

      paddingVertical: 8,
    },

    skipText: {
      fontSize: 13,

      fontFamily:
        'Pretendard-Medium',

      color: '#8792A2',
    },

    /* 페이지 */

    page: {
      width:
        SCREEN_WIDTH,

      flex: 1,

      paddingHorizontal: 26,
    },

    textArea: {
      alignItems:
        'center',

      marginTop: 18,
    },

    title: {
      textAlign:
        'center',

      fontSize: 29,

      lineHeight: 39,

      letterSpacing: -0.8,

      fontFamily:
        'Pretendard-ExtraBold',

      color: '#172033',
    },

    highlight: {
      color: '#3563C9',

      fontFamily:
        'Pretendard-ExtraBold',
    },

    description: {
      marginTop: 16,

      textAlign:
        'center',

      fontSize: 14,

      lineHeight: 22,

      fontFamily:
        'Pretendard-Regular',

      color: '#7C8798',
    },

    /* 이미지 */

    imageArea: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 6,
    },

    image: {
      width:
        SCREEN_WIDTH *
        0.78,

      height:
        SCREEN_WIDTH *
        0.78,

      maxHeight: 360,
    },

    /* 하단 */

    bottomArea: {
      paddingHorizontal: 22,

      paddingBottom: 18,
    },

    dots: {
      flexDirection: 'row',

      justifyContent:
        'center',

      alignItems:
        'center',

      gap: 7,

      marginBottom: 20,
    },

    dot: {
      width: 7,

      height: 7,

      borderRadius: 4,

      backgroundColor:
        '#DDE3EC',
    },

    activeDot: {
      width: 22,

      backgroundColor:
        '#3563C9',
    },

    nextButton: {
      minHeight: 56,

      flexDirection: 'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 7,

      backgroundColor:
        '#3563C9',

      borderRadius: 17,
    },

    nextButtonPressed: {
      backgroundColor:
        '#294FA5',
    },

    nextButtonText: {
      fontSize: 16,

      fontFamily:
        'Pretendard-Bold',

      color: '#FFFFFF',
    },
  });