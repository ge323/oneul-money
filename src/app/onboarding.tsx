import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ONBOARDING_KEY =
  'onboarding-completed';

type OnboardingPage = {
  id: string;
  image?: ImageSourcePropType;
  mascot: ImageSourcePropType;
  title: string;
  highlight: string;
  description: string;
  visualType: 'mockup' | 'simulator';
};

const pages: OnboardingPage[] = [
  {
    id: '1',

    image: require(
      '../../assets/images/onboarding/onboarding_1.png'
    ),

    mascot: require(
      '../../assets/images/character/hi.png'
    ),

    title: '오늘, 얼마까지\n',

    highlight: '써도 될까요?',

    description:
      '이번 달 쓸 생활비만 정해주세요.\n남은 기간과 지출을 계산해\n오늘 쓸 수 있는 금액을 알려드려요.',

    visualType: 'mockup',
  },

  {
    id: '2',

    image: require(
      '../../assets/images/onboarding/onboarding_2.png'
    ),

    mascot: require(
      '../../assets/images/character/money.png'
    ),

    title: '기록할수록\n',

    highlight:
      '더 정확해져요',

    description:
      '지출을 기록할수록 남은 생활비를 반영해\n오늘 쓸 수 있는 금액을\n바로 다시 계산해드려요.',

    visualType: 'mockup',
  },

  {
    id: '3',

    mascot: require(
      '../../assets/images/character/question.png'
    ),

    title: '사기 전에\n',

    highlight: '한번 확인해보세요',

    description:
      '사고 싶은 금액을 입력하면\n구매 후 하루에 얼마까지 쓸 수 있는지\n미리 확인할 수 있어요.',

    visualType: 'simulator',
  },
];

export default function OnboardingScreen() {
  const {
    width: screenWidth,
    height: screenHeight,
  } = useWindowDimensions();

  const flatListRef =
    useRef<FlatList<OnboardingPage>>(
      null
    );

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const contentOffsetY =
    Math.min(
      60,
      Math.max(
        20,
        screenHeight * 0.05
      )
    );

  const visualTopGap =
    Math.min(
      22,
      Math.max(
        14,
        screenHeight * 0.018
      )
    );

  const bottomPadding =
    Math.min(
      42,
      Math.max(
        28,
        screenHeight * 0.035
      )
    );

  const dotsBottomGap =
    Math.min(
      14,
      Math.max(
        10,
        screenHeight * 0.012
      )
    );

  const finishOnboarding =
    async () => {
      try {
        await AsyncStorage.setItem(
          ONBOARDING_KEY,
          'true'
        );

        router.replace('/settings');
      } catch (error) {
        console.error(
          '온보딩 완료 저장 실패:',
          error
        );
      }
    };

  const goNext = () => {
    const nextIndex =
      currentIndex + 1;

    if (
      nextIndex <
      pages.length
    ) {
      flatListRef.current?.scrollToOffset({
        offset:
          screenWidth *
          nextIndex,

        animated: true,
      });

      setCurrentIndex(
        nextIndex
      );

      return;
    }

    finishOnboarding();
  };

  const goPrevious = () => {
    const previousIndex =
      currentIndex - 1;

    if (
      previousIndex <
      0
    ) {
      return;
    }

    flatListRef.current?.scrollToOffset({
      offset:
        screenWidth *
        previousIndex,

      animated: true,
    });

    setCurrentIndex(
      previousIndex
    );
  };

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX =
      event.nativeEvent
        .contentOffset.x;

    const newIndex =
      Math.round(
        offsetX /
          screenWidth
      );

    setCurrentIndex(
      newIndex
    );
  };

  const renderVisual = (
    item: OnboardingPage
  ) => {
    if (
      item.visualType ===
      'simulator'
    ) {
      return (
        <View
          style={[
            styles.simulatorVisualArea,
            {
              marginTop:
                visualTopGap,
            },
          ]}
        >
          <View
            style={
              styles.simulatorCard
            }
          >
            <View
              style={
                styles.simulatorCardHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.simulatorCardTitle
                  }
                >
                  이거 사도 돼?
                </Text>

                <Text
                  style={
                    styles.simulatorCardDescription
                  }
                >
                  구매 후 하루 예산을
                  미리 확인해보세요.
                </Text>
              </View>

              <View
                style={
                  styles.simulatorCloseButton
                }
              >
                <Ionicons
                  name="close"
                  size={18}
                  color="#687386"
                />
              </View>
            </View>

            <Text
              style={
                styles.simulatorInputLabel
              }
            >
              사고 싶은 금액
            </Text>

            <View
              style={
                styles.simulatorInputBox
              }
            >
              <Text
                style={
                  styles.simulatorInputAmount
                }
              >
                89,000
              </Text>

              <Text
                style={
                  styles.simulatorInputUnit
                }
              >
                원
              </Text>
            </View>

            <View
              style={
                styles.simulatorResultBox
              }
            >
              <View
                style={
                  styles.simulatorResultIcon
                }
              >
                <Ionicons
                  name="checkmark"
                  size={16}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={
                  styles.simulatorResultTextArea
                }
              >
                <Text
                  style={
                    styles.simulatorResultTitle
                  }
                >
                  생활비 안에서는 괜찮아요
                </Text>

                <Text
                  style={
                    styles.simulatorResultDescription
                  }
                >
                  구매 후에도 하루 예산이
                  남아 있어요.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.simulatorBudgetRow
              }
            >
              <View>
                <Text
                  style={
                    styles.simulatorBudgetLabel
                  }
                >
                  현재 하루 예산
                </Text>

                <Text
                  style={
                    styles.simulatorBudgetAmount
                  }
                >
                  35,869원
                </Text>
              </View>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#98A2B3"
              />

              <View
                style={
                  styles.simulatorBudgetRight
                }
              >
                <Text
                  style={
                    styles.simulatorBudgetLabel
                  }
                >
                  구매 후
                </Text>

                <Text
                  style={[
                    styles.simulatorBudgetAmount,
                    styles.simulatorBudgetAfter,
                  ]}
                >
                  32,572원
                </Text>
              </View>
            </View>
          </View>

          <Image
            source={
              item.mascot
            }
            style={[
              styles.simulatorMascot,
              {
                width:
                  Math.min(
                    screenWidth *
                      0.20,
                    90
                  ),

                height:
                  Math.min(
                    screenWidth *
                      0.20,
                    90
                  ),
              },
            ]}
            resizeMode="contain"
          />
        </View>
      );
    }

    return (
      <View
        style={[
          styles.imageArea,
          {
            marginTop:
              visualTopGap,
          },
        ]}
      >
        {item.image && (
          <Image
            source={
              item.image
            }
            style={[
              styles.image,

              {
                width:
                  Math.min(
                    screenWidth *
                      0.78,
                    360
                  ),

                height:
                  Math.min(
                    screenWidth *
                      0.78,
                    360
                  ),
              },
            ]}
            resizeMode="contain"
          />
        )}

        <Image
          source={
            item.mascot
          }
          style={[
            styles.mascot,

            item.id === '1'
              ? styles.mascotPageOne
              : styles.mascotPageTwo,

            {
              width:
                Math.min(
                  screenWidth *
                    0.25,
                  112
                ),

              height:
                Math.min(
                  screenWidth *
                    0.25,
                  112
                ),
            },
          ]}
          resizeMode="contain"
        />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      {/* 상단 */}

      <View
        style={
          styles.topArea
        }
      >
        {/* 이전 */}

        {currentIndex > 0 ? (
          <Pressable
            style={
              styles.backButton
            }
            onPress={
              goPrevious
            }
            hitSlop={8}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="#172033"
            />
          </Pressable>
        ) : (
          <View
            style={
              styles.backButtonPlaceholder
            }
          />
        )}

        {/* 첫 페이지만 건너뛰기 */}

        {currentIndex === 0 ? (
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
        ) : (
          <View
            style={
              styles.skipButtonPlaceholder
            }
          />
        )}
      </View>

      {/* 페이지 */}

      <FlatList
        ref={
          flatListRef
        }
        style={
          styles.pager
        }
        contentContainerStyle={
          styles.pagerContent
        }
        data={
          pages
        }
        horizontal
        pagingEnabled
        bounces={
          false
        }
        showsHorizontalScrollIndicator={
          false
        }
        keyExtractor={(
          item
        ) =>
          item.id
        }
        onMomentumScrollEnd={
          handleScrollEnd
        }
        getItemLayout={(
          _,
          index
        ) => ({
          length:
            screenWidth,

          offset:
            screenWidth *
            index,

          index,
        })}
        renderItem={({
          item,
          index,
        }) => (
          <Pressable
            style={[
              styles.page,
              {
                width:
                  screenWidth,
              },
            ]}
            onPress={() => {
              if (
                index <
                pages.length - 1
              ) {
                goNext();
              }
            }}
          >
            <View
              style={[
                styles.contentGroup,
                {
                  transform: [
                    {
                      translateY:
                        contentOffsetY,
                    },
                  ],
                },
              ]}
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
                {
                  item.title
                }

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

            {/* 이미지 / 시뮬레이터 */}

            {renderVisual(
              item
            )}
            </View>
          </Pressable>
        )}
      />

      {/* 하단 */}

      <View
        style={[
          styles.bottomArea,
          {
            paddingBottom:
              bottomPadding,
          },
        ]}
      >
        {/* 페이지 점 */}

        <View
          style={[
            styles.dots,
            {
              marginBottom:
                dotsBottomGap,
            },
          ]}
        >
          {pages.map(
            (
              _,
              index
            ) => (
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

    /* ========================
       상단
    ======================== */

    topArea: {
      minHeight: 82,

      paddingHorizontal: 18,

      paddingTop: 24,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    backButton: {
      width: 40,

      height: 40,

      borderRadius: 20,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    backButtonPlaceholder: {
      width: 40,

      height: 40,
    },

    skipButton: {
      minWidth: 56,

      minHeight: 40,

      paddingHorizontal: 5,

      paddingVertical: 8,

      alignItems:
        'flex-end',

      justifyContent: 'center',
    },

    skipButtonPlaceholder: {
      width: 56,

      height: 40,
    },

    skipText: {
      fontSize: 14,

      lineHeight: 20,

      fontFamily:
        'Pretendard-Medium',

      color: '#687386',
    },

    /* ========================
       페이지
    ======================== */

    pager: {
      flex: 1,
    },

    pagerContent: {
      flexGrow: 1,
    },

    page: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 24,
      justifyContent: 'center',
    },

    contentGroup: {
      width: '100%',
      alignItems: 'center',
    },

    textArea: {
      alignItems: 'center',
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
      marginTop: 14,

      textAlign:
        'center',

      fontSize: 15,

      lineHeight: 23,

      fontFamily:
        'Pretendard-Regular',

      color: '#687386',
    },

    /* ========================
       기존 목업 + 캐릭터
    ======================== */

    imageArea: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },

    image: {
      maxWidth: 360,

      maxHeight: 360,
    },

    mascot: {
      position: 'absolute',

      zIndex: 2,
    },

    mascotPageOne: {
      right: '3%',

      bottom: '7%',
    },

    mascotPageTwo: {
      left: '2%',

      bottom: '5%',
    },

    /* ========================
       3페이지 구매 시뮬레이터
    ======================== */

    simulatorVisualArea: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      paddingTop: 8,
    },

    simulatorCard: {
      width: '92%',

      maxWidth: 350,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 24,

      paddingHorizontal: 20,

      paddingTop: 20,

      paddingBottom: 20,

      borderWidth: 1,

      borderColor:
        '#EBEFF5',

      shadowColor:
        '#172033',

      shadowOffset: {
        width: 0,
        height: 8,
      },

      shadowOpacity: 0.08,

      shadowRadius: 18,

      elevation: 5,
    },

    simulatorCardHeader: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',
    },

    simulatorCardTitle: {
      fontSize: 19,

      lineHeight: 26,

      fontFamily:
        'Pretendard-ExtraBold',

      color: '#172033',
    },

    simulatorCardDescription: {
      marginTop: 4,

      fontSize: 12,

      lineHeight: 18,

      fontFamily:
        'Pretendard-Regular',

      color: '#687386',
    },

    simulatorCloseButton: {
      width: 34,

      height: 34,

      borderRadius: 17,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F5F7FA',
    },

    simulatorInputLabel: {
      marginTop: 19,

      marginBottom: 8,

      fontSize: 13,

      lineHeight: 19,

      fontFamily:
        'Pretendard-Bold',

      color: '#172033',
    },

    simulatorInputBox: {
      minHeight: 58,

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        '#F1F5FC',

      borderRadius: 16,

      paddingHorizontal: 16,
    },

    simulatorInputAmount: {
      flex: 1,

      fontSize: 24,

      lineHeight: 31,

      fontFamily:
        'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    simulatorInputUnit: {
      fontSize: 14,

      fontFamily:
        'Pretendard-Bold',

      color: '#687386',
    },

    simulatorResultBox: {
      marginTop: 14,

      flexDirection: 'row',

      alignItems:
        'flex-start',

      backgroundColor:
        '#EEF8F3',

      borderRadius: 16,

      padding: 14,
    },

    simulatorResultIcon: {
      width: 28,

      height: 28,

      borderRadius: 14,

      backgroundColor:
        '#3E956C',

      alignItems: 'center',

      justifyContent:
        'center',

      marginTop: 1,
    },

    simulatorResultTextArea: {
      flex: 1,

      marginLeft: 10,
    },

    simulatorResultTitle: {
      fontSize: 14,

      lineHeight: 20,

      fontFamily:
        'Pretendard-Bold',

      color: '#276A4D',
    },

    simulatorResultDescription: {
      marginTop: 3,

      fontSize: 12,

      lineHeight: 18,

      fontFamily:
        'Pretendard-Regular',

      color: '#4F7565',
    },

    simulatorBudgetRow: {
      marginTop: 15,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      paddingTop: 15,

      borderTopWidth: 1,

      borderTopColor:
        '#EEF1F5',
    },

    simulatorBudgetRight: {
      alignItems:
        'flex-end',
    },

    simulatorBudgetLabel: {
      fontSize: 11,

      lineHeight: 16,

      fontFamily:
        'Pretendard-Medium',

      color: '#687386',
    },

    simulatorBudgetAmount: {
      marginTop: 3,

      fontSize: 15,

      lineHeight: 21,

      fontFamily:
        'Pretendard-ExtraBold',

      color: '#172033',
    },

    simulatorBudgetAfter: {
      color: '#3563C9',
    },

    simulatorMascot: {
      position: 'absolute',

      right: -35,

      bottom: 55,

      zIndex: 3,
    },

    /* ========================
       하단
    ======================== */

    bottomArea: {
      paddingHorizontal: 22,
    },

    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 7,
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

      borderWidth: 0,

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

      lineHeight: 22,

      fontFamily:
        'Pretendard-Bold',

      color: '#FFFFFF',
    },
  });