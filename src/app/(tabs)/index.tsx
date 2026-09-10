import Screen from '../../components/screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ensureCurrentMonthBudget,
} from '../../utils/monthly-budgets';
import { router, useFocusEffect } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

const EXPENSES_KEY = 'expenses';
const PLANNED_EXPENSES_KEY = 'planned-expenses';

/*
 * 실제 배포/평소 개발:
 *   null
 *
 * 새 달 초기화 테스트 예시:
 *   new Date(2026, 9, 1)  // 2026년 10월 1일
 *
 * JavaScript의 월은 0부터 시작합니다.
 */
export const DEV_TEST_DATE: Date | null =
  null;
const getNow = () => {
  return DEV_TEST_DATE
    ? new Date(DEV_TEST_DATE)
    : new Date();
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  category?: string;
  createdAt: string;
};

type PlannedExpense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  createdAt: string;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const {
    width: screenWidth,
    height: screenHeight,
  } = useWindowDimensions();

  const isCompactHeight =
    screenHeight < 760;

  const horizontalPadding =
    screenWidth < 390
      ? 16
      : 20;

  const [
    currentMonthBudget,
    setCurrentMonthBudget,
  ] = useState(0);

  const [
    showSimulator,
    setShowSimulator,
  ] = useState(false);

  const [
    showServiceMenu,
    setShowServiceMenu,
  ] = useState(false);

  const [
    purchaseAmount,
    setPurchaseAmount,
  ] = useState('');

  const [
    todaySpent,
    setTodaySpent,
  ] = useState(0);

  const [
    monthlySpent,
    setMonthlySpent,
  ] = useState(0);

  const [
    plannedAmount,
    setPlannedAmount,
  ] = useState(0);

  const [
    displayedDailyBudget,
    setDisplayedDailyBudget,
  ] = useState(0);

  const [
    homeRefreshKey,
    setHomeRefreshKey,
  ] = useState(0);

  const [
    homeDataLoaded,
    setHomeDataLoaded,
  ] = useState(false);

  const [
    showMonthlyNotice,
    setShowMonthlyNotice,
  ] = useState(false);

  const [
    monthlyNoticeText,
    setMonthlyNoticeText,
  ] = useState('');

  const monthlyNoticeOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  const monthlyNoticeTranslateY =
    useRef(
      new Animated.Value(22)
    ).current;

  const monthlyNoticeTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const dailyBudgetAnim = useRef(
    new Animated.Value(0)
  ).current;

  const dailyBudgetScale = useRef(
    new Animated.Value(0.97)
  ).current;

  const slideAnim = useRef(
    new Animated.Value(500)
  ).current;

  const backdropOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  const serviceMenuSlideAnim =
    useRef(
      new Animated.Value(420)
    ).current;

  const serviceMenuBackdropOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  const getCurrentMonthNoticeKey =
    () => {
      const today = getNow();

      const year =
        today.getFullYear();

      const month =
        String(
          today.getMonth() + 1
        ).padStart(2, '0');

      return `monthly-budget-notice-${year}-${month}`;
    };

  const getCurrentMonthLabel =
    () => {
      return `${getNow().getMonth() + 1
        }월`;
    };

  const hideMonthlyNotice =
    () => {
      if (
        monthlyNoticeTimer.current
      ) {
        clearTimeout(
          monthlyNoticeTimer.current
        );

        monthlyNoticeTimer.current =
          null;
      }

      Animated.parallel([
        Animated.timing(
          monthlyNoticeOpacity,
          {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          monthlyNoticeTranslateY,
          {
            toValue: 22,
            duration: 220,
            useNativeDriver: true,
          }
        ),
      ]).start(() => {
        setShowMonthlyNotice(
          false
        );
      });
    };

  const showMonthlyBudgetNotice =
    async (
      budget: number
    ) => {
      if (budget <= 0) {
        return;
      }

      try {
        const skipOnce =
          await AsyncStorage.getItem(
            'skip-monthly-budget-notice-once'
          );

        if (skipOnce === 'true') {
          await AsyncStorage.removeItem(
            'skip-monthly-budget-notice-once'
          );

          return;
        }

        const noticeKey =
          getCurrentMonthNoticeKey();

        const alreadyShown =
          await AsyncStorage.getItem(
            noticeKey
          );

        if (alreadyShown) {
          return;
        }

        setMonthlyNoticeText(
          `지난달과 같은 ${budget.toLocaleString(
            'ko-KR'
          )}원으로 시작할게요.`
        );

        monthlyNoticeOpacity.setValue(
          0
        );

        monthlyNoticeTranslateY.setValue(
          22
        );

        setShowMonthlyNotice(true);

        await AsyncStorage.setItem(
          noticeKey,
          'true'
        );

        if (monthlyNoticeTimer.current) {
          clearTimeout(
            monthlyNoticeTimer.current
          );
          monthlyNoticeTimer.current = null;
        }

        requestAnimationFrame(
          () => {
            Animated.parallel([
              Animated.timing(
                monthlyNoticeOpacity,
                {
                  toValue: 1,
                  duration: 260,
                  useNativeDriver:
                    true,
                }
              ),

              Animated.timing(
                monthlyNoticeTranslateY,
                {
                  toValue: 0,
                  duration: 260,
                  useNativeDriver:
                    true,
                }
              ),
            ]).start();

            monthlyNoticeTimer.current =
              setTimeout(
                hideMonthlyNotice,
                2600
              );
          }
        );
      } catch (error) {
        console.error(
          '월 시작 안내 표시 실패:',
          error
        );
      }
    };
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshHome = async () => {
        await loadHomeData();

        if (isActive) {
          setHomeDataLoaded(true);
          setHomeRefreshKey(
            (prev) => prev + 1
          );
        }
      };

      refreshHome();

      return () => {
        /*
         * 개발 모드에서는 focus effect가 빠르게 정리됐다가
         * 다시 실행될 수 있습니다. 여기서 안내 타이머를 지우면
         * 월 시작 안내가 화면에 남은 채로 멈출 수 있으므로
         * 타이머는 hideMonthlyNotice가 직접 종료하도록 둡니다.
         */
        isActive = false;
      };
    }, [])
  );

  const loadHomeData =
    async () => {
      try {
        const [
          savedExpenses,
          savedPlannedExpenses,
        ] = await Promise.all([
          AsyncStorage.getItem(
            EXPENSES_KEY
          ),
          AsyncStorage.getItem(
            PLANNED_EXPENSES_KEY
          ),
        ]);

        const today =
          getNow();

        /*
         * 예산은 monthly-budgets만 사용합니다.
         * 이번 달 값이 없으면 가장 최근 월의 예산을
         * 자동으로 이어받습니다.
         */
        const budgetForThisMonth =
          await ensureCurrentMonthBudget(
            0,
            today
          );

        setCurrentMonthBudget(
          budgetForThisMonth
        );

        await showMonthlyBudgetNotice(
          budgetForThisMonth
        );

        const parsedExpenses:
          Expense[] =
          savedExpenses
            ? JSON.parse(
              savedExpenses
            )
            : [];

        const todayTotal =
          parsedExpenses.reduce(
            (
              sum,
              expense
            ) => {
              const expenseDate =
                new Date(
                  expense.createdAt
                );

              const isToday =
                expenseDate.getFullYear() ===
                today.getFullYear() &&
                expenseDate.getMonth() ===
                today.getMonth() &&
                expenseDate.getDate() ===
                today.getDate();

              if (!isToday) {
                return sum;
              }

              return (
                sum +
                (Number(
                  expense.amount
                ) || 0)
              );
            },
            0
          );

        setTodaySpent(
          todayTotal
        );

        const monthlyTotal =
          parsedExpenses.reduce(
            (
              sum,
              expense
            ) => {
              const expenseDate =
                new Date(
                  expense.createdAt
                );

              const isThisMonth =
                expenseDate.getFullYear() ===
                today.getFullYear() &&
                expenseDate.getMonth() ===
                today.getMonth();

              if (!isThisMonth) {
                return sum;
              }

              return (
                sum +
                (Number(
                  expense.amount
                ) || 0)
              );
            },
            0
          );

        setMonthlySpent(
          monthlyTotal
        );

        const parsedPlannedExpenses:
          PlannedExpense[] =
          savedPlannedExpenses
            ? JSON.parse(
              savedPlannedExpenses
            )
            : [];

        const todayStart =
          new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );

        const upcomingPlannedTotal =
          parsedPlannedExpenses.reduce(
            (
              sum,
              expense
            ) => {
              const expenseDate =
                new Date(
                  `${expense.date}T00:00:00`
                );

              const isThisMonth =
                expenseDate.getFullYear() ===
                today.getFullYear() &&
                expenseDate.getMonth() ===
                today.getMonth();

              if (
                expenseDate <
                todayStart ||
                !isThisMonth
              ) {
                return sum;
              }

              return (
                sum +
                (Number(
                  expense.amount
                ) || 0)
              );
            },
            0
          );

        setPlannedAmount(
          upcomingPlannedTotal
        );
      } catch (error) {
        console.error(
          '홈 데이터 불러오기 실패:',
          error
        );
      }
    };

  const getRemainingDays =
    () => {
      const today =
        getNow();

      const lastDay =
        new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );

      const todayStart =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

      const difference =
        lastDay.getTime() -
        todayStart.getTime();

      const daysUntilEnd =
        Math.ceil(
          difference /
          (
            1000 *
            60 *
            60 *
            24
          )
        );

      /*
       * 오늘을 포함해서 남은 기간으로 나눕니다.
       * 예: 오늘이 9월 15일이고 30일까지라면 16일.
       */
      return Math.max(
        daysUntilEnd + 1,
        1
      );
    };

  const remainingDays =
    getRemainingDays();

  /* =========================
     생활비 계산
  ========================= */

  const SAFETY_RESERVE_RATE = 0.1;

  // 사용자가 정한 생활비 한도에서 실제 지출과 예정 지출을 차감합니다.
  const remainingBudget =
    Math.max(
      0,

      currentMonthBudget -
      monthlySpent -
      plannedAmount
    );

  // 남은 생활비의 10%는 예상치 못한 지출을 위한 안전 여유금으로 보호
  const safetyReserve =
    Math.floor(
      remainingBudget *
      SAFETY_RESERVE_RATE
    );

  // 실제로 이번 달 남은 기간 동안 나눠 사용할 수 있는 생활비
  const usableRemainingBudget =
    Math.max(
      0,
      remainingBudget -
      safetyReserve
    );

  // 오늘 권장 생활비
  const dailyBudget =
    remainingDays > 0
      ? Math.floor(
        usableRemainingBudget /
        remainingDays
      )
      : 0;

  useEffect(() => {
    if (!homeDataLoaded) {
      return;
    }

    const listenerId =
      dailyBudgetAnim.addListener(
        ({ value }) => {
          setDisplayedDailyBudget(
            Math.round(value)
          );
        }
      );

    dailyBudgetAnim.stopAnimation();

    /*
     * 홈에 처음 들어오거나,
     * 지출 기록 후 홈으로 돌아왔을 때
     * 0원부터 새 하루 예산까지 짧게 올라갑니다.
     */
    dailyBudgetAnim.setValue(0);
    dailyBudgetScale.setValue(0.97);

    Animated.parallel([
      Animated.timing(
        dailyBudgetAnim,
        {
          toValue: dailyBudget,
          duration: 650,
          useNativeDriver: false,
        }
      ),

      Animated.sequence([
        Animated.timing(
          dailyBudgetScale,
          {
            toValue: 1.015,
            duration: 430,
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          dailyBudgetScale,
          {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }
        ),
      ]),
    ]).start(() => {
      setDisplayedDailyBudget(
        dailyBudget
      );
    });

    return () => {
      dailyBudgetAnim.removeListener(
        listenerId
      );
    };
  }, [
    dailyBudget,
    homeRefreshKey,
    homeDataLoaded,
    dailyBudgetAnim,
    dailyBudgetScale,
  ]);

  const todayRemaining =
    Math.max(
      0,
      dailyBudget -
      todaySpent
    );

  const todayOverAmount =
    Math.max(
      0,
      todaySpent -
      dailyBudget
    );

  const todayUsageRatio =
    dailyBudget > 0
      ? todaySpent /
      dailyBudget
      : todaySpent > 0
        ? Infinity
        : 0;

  const formatMoney = (
    amount: number
  ) => {
    return amount.toLocaleString(
      'ko-KR'
    );
  };

  const formatMoneyInput = (
    text: string
  ) => {
    const numbersOnly =
      text.replace(
        /[^0-9]/g,
        ''
      );

    if (!numbersOnly) {
      return '';
    }

    return Number(
      numbersOnly
    ).toLocaleString(
      'ko-KR'
    );
  };

  const parseMoney = (
    text: string
  ) => {
    return (
      Number(
        text.replace(
          /,/g,
          ''
        )
      ) || 0
    );
  };

  const getTodayStatus =
    () => {
      if (todaySpent <= 0) {
        return {
          type: 'empty' as const,

          icon:
            'time-outline' as const,

          title:
            '아직 오늘 기록한 지출이 없어요',

          message:
            '오늘 지출을 기록하면 권장 금액과 비교해드려요.',
        };
      }

      if (
        dailyBudget <= 0
      ) {
        return {
          type: 'danger' as const,

          icon:
            'alert-circle-outline' as const,

          title:
            '오늘 사용할 수 있는 예산이 없어요',

          message: `기준보다 ${formatMoney(
            todaySpent
          )}원 더 사용했어요.`,
        };
      }

      if (
        todaySpent >
        dailyBudget
      ) {
        return {
          type: 'danger' as const,

          icon:
            'alert-circle-outline' as const,

          title: `오늘은 ${formatMoney(
            todayOverAmount
          )}원 초과했어요`,

          message: `기준보다 ${formatMoney(
            todayOverAmount
          )}원 더 사용했어요.`,
        };
      }

      if (
        todayUsageRatio >=
        0.8
      ) {
        return {
          type: 'warning' as const,

          icon:
            'wallet-outline' as const,

          title: `오늘 예산이 ${formatMoney(
            todayRemaining
          )}원 남았어요`,

          message: `권장 금액에서 ${formatMoney(
            todayRemaining
          )}원 남았어요.`,
        };
      }

      return {
        type: 'safe' as const,

        icon:
          'checkmark-circle-outline' as const,

        title:
          '오늘 소비는 적정해요',

        message: `권장 금액에서 ${formatMoney(
          todayRemaining
        )}원 남았어요.`,
      };
    };

  const todayStatus =
    getTodayStatus();

  /* =========================
     서비스 메뉴
  ========================= */

  const openServiceMenu = () => {
    serviceMenuSlideAnim.setValue(420);
    serviceMenuBackdropOpacity.setValue(0);

    setShowServiceMenu(true);

    requestAnimationFrame(() => {
      Animated.sequence([
        Animated.timing(
          serviceMenuBackdropOpacity,
          {
            toValue: 1,
            duration: 90,
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          serviceMenuSlideAnim,
          {
            toValue: 0,
            duration: 210,
            useNativeDriver: true,
          }
        ),
      ]).start();
    });
  };

  const closeServiceMenu = () => {
    Animated.sequence([
      Animated.timing(
        serviceMenuSlideAnim,
        {
          toValue: 420,
          duration: 170,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        serviceMenuBackdropOpacity,
        {
          toValue: 0,
          duration: 70,
          useNativeDriver: true,
        }
      ),
    ]).start(() => {
      setShowServiceMenu(false);
    });
  };

  const handleServiceMenuPress = (
    label: string
  ) => {
    const routes: Record<string, string> = {
      개인정보처리방침: '/privacy',
      이용약관: '/terms',
      '오픈소스 라이선스': '/licenses',
      문의하기: '/contact',
      '앱 정보': '/app-info',
    };

    const targetRoute = routes[label];

    if (!targetRoute) {
      return;
    }

    setShowServiceMenu(false);
    serviceMenuBackdropOpacity.setValue(0);
    serviceMenuSlideAnim.setValue(420);

    router.push(targetRoute as any);
  };

  /* =========================
     이거 사도 돼?
  ========================= */

  const openSimulator =
    () => {
      slideAnim.setValue(
        500
      );

      backdropOpacity.setValue(
        0
      );

      setShowSimulator(
        true
      );

      requestAnimationFrame(
        () => {
          Animated.parallel([
            Animated.timing(
              slideAnim,
              {
                toValue: 0,
                duration: 250,
                useNativeDriver:
                  true,
              }
            ),

            Animated.timing(
              backdropOpacity,
              {
                toValue: 1,
                duration: 100,
                useNativeDriver:
                  true,
              }
            ),
          ]).start();
        }
      );
    };

  const closeSimulator =
    () => {
      Animated.parallel([
        Animated.timing(
          slideAnim,
          {
            toValue: 500,
            duration: 200,
            useNativeDriver:
              true,
          }
        ),

        Animated.timing(
          backdropOpacity,
          {
            toValue: 0,
            duration: 60,
            useNativeDriver:
              true,
          }
        ),
      ]).start(() => {
        setShowSimulator(
          false
        );

        setPurchaseAmount(
          ''
        );
      });
    };

  const purchase =
    parseMoney(
      purchaseAmount
    );

  // 구매 후 남는 전체 생활비
  const budgetAfterPurchase =
    Math.max(
      0,
      remainingBudget -
      purchase
    );

  // 현재 확보한 안전 여유금은 구매 후에도 그대로 보호
  const usableBudgetAfterPurchase =
    Math.max(
      0,
      budgetAfterPurchase -
      safetyReserve
    );

  // 구매 후 하루 사용 가능 금액
  const dailyBudgetAfterPurchase =
    remainingDays > 0
      ? Math.floor(
        usableBudgetAfterPurchase /
        remainingDays
      )
      : 0;

  const dailyDifference =
    Math.max(
      0,
      dailyBudget -
      dailyBudgetAfterPurchase
    );

  // 안전 여유금까지 침범해야 하는 구매인지 확인
  const isOverBudget =
    purchase >
    usableRemainingBudget;

  const getSimulationStatus =
    () => {
      if (
        purchase <= 0
      ) {
        return null;
      }

      if (isOverBudget) {
        return {
          type: 'danger',

          icon:
            'alert-circle' as const,

          title:
            '지금 구매하면 부담돼요',

          message:
            '안전하게 남겨둔 여유금까지 사용해야 하는 금액이에요.',
        };
      }

      if (
        dailyBudgetAfterPurchase <
        dailyBudget * 0.5
      ) {
        return {
          type: 'warning',

          icon:
            'warning' as const,

          title:
            '조금 고민해보는 게 좋아요',

          message:
            '구매 후 하루에 사용할 수 있는 금액이 크게 줄어요.',
        };
      }

      return {
        type: 'safe',

        icon:
          'checkmark-circle' as const,

        title:
          '생활비 안에서는 괜찮아요',

        message:
          '안전 여유금을 남기고도 이번 달 사용할 생활비가 있어요.',
      };
    };

  const simulationStatus =
    getSimulationStatus();

  return (
    <>
      <Screen>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.scrollContent,
            isCompactHeight &&
            styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios'
              ? 'interactive'
              : 'on-drag'
          }
        >
          <View
            style={[
              styles.content,

              {
                paddingHorizontal:
                  horizontalPadding,
              },
            ]}
          >
            {/* 상단 헤더 */}

            <View
              style={[
                styles.headerRow,
                isCompactHeight &&
                styles.headerRowCompact,
              ]}
            >
              <Text style={styles.title}>
                오늘 얼마 써도 돼?
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.menuButton,
                  pressed &&
                  styles.menuButtonPressed,
                ]}
                onPress={openServiceMenu}
                hitSlop={8}
              >
                <Ionicons
                  name="menu-outline"
                  size={25}
                  color="#172033"
                />
              </Pressable>
            </View>

            {/* 오늘 권장 생활비 */}

            <View
              style={[
                styles.dailyCard,

                isCompactHeight &&
                styles.dailyCardCompact,
              ]}
            >
              <Text
                style={
                  styles.dailyLabel
                }
              >
                오늘은
              </Text>

              <Animated.View
                style={{
                  transform: [
                    {
                      scale:
                        dailyBudgetScale,
                    },
                  ],
                }}
              >
                <Text
                  style={[
                    styles.dailyAmount,

                    screenWidth < 370 &&
                    styles.dailyAmountSmall,
                  ]}
                >
                  {formatMoney(
                    displayedDailyBudget
                  )}
                  원
                </Text>
              </Animated.View>

              <Text
                style={
                  styles.dailyMessage
                }
              >
                써도 괜찮아요
              </Text>

              <View
                style={
                  styles.dailyDivider
                }
              />

              <View
                style={
                  styles.dailyBottomRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.monthSpentLabel
                    }
                  >
                    이번 달 생활비
                  </Text>

                  <Text
                    style={
                      styles.monthSpentAmount
                    }
                  >
                    {formatMoney(
                      currentMonthBudget
                    )}
                    원
                  </Text>

                  <Text
                    style={
                      styles.monthSpentSubText
                    }
                  >
                    현재까지 {formatMoney(monthlySpent)}원 사용
                  </Text>
                </View>

                <View
                  style={
                    styles.dDayBadge
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color="#3563C9"
                  />

                  <Text
                    style={
                      styles.dDayText
                    }
                  >
                    {remainingDays}일 남음
                  </Text>
                </View>
              </View>

              <View style={styles.reserveInlineRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color="#7292D8"
                />

                <Text style={styles.reserveInlineText}>
                  여유금 10%를 남겨두고 계산했어요.
                </Text>
              </View>
            </View>

            {/* 오늘 사용 현황 + 남은 생활비 */}

            <View style={styles.budgetSummaryCard}>
              <View
                style={
                  styles.todaySummary
                }
              >
                <View
                  style={
                    styles.todaySummaryTop
                  }
                >
                  <Text
                    style={
                      styles.todaySummaryLabel
                    }
                  >
                    오늘 지출
                  </Text>

                  <Text
                    style={
                      styles.todaySummaryAmount
                    }
                  >
                    {formatMoney(
                      todaySpent
                    )}
                    원
                  </Text>
                </View>

                <View
                  style={
                    styles.todaySummaryBottom
                  }
                >
                  <View
                    style={[
                      styles.statusDot,

                      todayStatus.type ===
                      'safe' &&
                      styles.statusDotSafe,

                      todayStatus.type ===
                      'warning' &&
                      styles.statusDotWarning,

                      todayStatus.type ===
                      'danger' &&
                      styles.statusDotDanger,
                    ]}
                  />

                  <Text
                    style={[
                      styles.todaySummaryMessage,

                      todayStatus.type ===
                      'safe' &&
                      styles.todaySummaryMessageSafe,

                      todayStatus.type ===
                      'warning' &&
                      styles.todaySummaryMessageWarning,

                      todayStatus.type ===
                      'danger' &&
                      styles.todaySummaryMessageDanger,
                    ]}
                  >
                    {
                      todayStatus.message
                    }
                  </Text>
                </View>
              </View>

              {/* 남은 생활비 */}

              <View style={styles.remainingSection}>
                <View style={styles.remainingTopRow}>
                  <Text style={styles.remainingLabel}>
                    남은 생활비
                  </Text>

                  <Text style={styles.remainingAmount}>
                    {formatMoney(remainingBudget)}원
                  </Text>
                </View>

                {plannedAmount > 0 && (
                  <View style={styles.plannedNoticeRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={13}
                      color="#7292D8"
                    />

                    <Text style={styles.plannedNotice}>
                      예정된 지출 {formatMoney(plannedAmount)}원을 미리 제외했어요.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* 행동 영역 */}

            <View
              style={
                styles.actionSection
              }
            >
              <Pressable
                style={({
                  pressed,
                }) => [
                    styles.simulatorButton,

                    pressed &&
                    styles.simulatorButtonPressed,
                  ]}
                onPress={
                  openSimulator
                }
              >
                <Ionicons
                  name="bag-handle-outline"
                  size={18}
                  color="#3563C9"
                />

                <View
                  style={
                    styles.simulatorTextArea
                  }
                >
                  <Text
                    style={
                      styles.simulatorTitle
                    }
                  >
                    이거 사도 돼?
                  </Text>

                  <Text
                    style={
                      styles.simulatorDescription
                    }
                  >
                    구매 후 예산을 미리 확인해보세요.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#687386"
                />
              </Pressable>

            </View>
          </View>
        </ScrollView>
      </Screen>

      {showMonthlyNotice && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.monthlyNotice,

            {
              opacity:
                monthlyNoticeOpacity,

              transform: [
                {
                  translateY:
                    monthlyNoticeTranslateY,
                },
              ],
            },
          ]}
        >
          <View
            style={
              styles.monthlyNoticeIconBox
            }
          >
            <Ionicons
              name="sparkles-outline"
              size={20}
              color="#3563C9"
            />
          </View>

          <View
            style={
              styles.monthlyNoticeTextArea
            }
          >
            <Text
              style={
                styles.monthlyNoticeTitle
              }
            >
              {getCurrentMonthLabel()} 생활비가 시작됐어요
            </Text>

            <Text
              style={
                styles.monthlyNoticeDescription
              }
            >
              {monthlyNoticeText}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* =========================
          서비스 메뉴
      ========================= */}

      <Modal
        visible={showServiceMenu}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeServiceMenu}
      >
        <View style={styles.serviceMenuModalRoot}>
          <Animated.View
            style={[
              styles.serviceMenuBackdrop,
              {
                opacity:
                  serviceMenuBackdropOpacity,
              },
            ]}
          >
            <Pressable
              style={styles.backdropPressArea}
              onPress={closeServiceMenu}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.serviceMenuSheet,
              {
                paddingTop: insets.top + 18,
                transform: [
                  {
                    translateX:
                      serviceMenuSlideAnim,
                  },
                ],
              },
            ]}
          >
            <View style={styles.serviceMenuHeader}>
              <View>
                <Text style={styles.serviceMenuBrand}>
                  얼마
                </Text>

                <Text style={styles.serviceMenuDescription}>
                  서비스 정보와 지원 메뉴를 확인하세요.
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeServiceMenu}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#687386"
                />
              </Pressable>
            </View>

            <Text style={styles.serviceSectionLabel}>
              서비스 정보
            </Text>

            {[
              {
                label: '개인정보처리방침',
                icon: 'shield-checkmark-outline' as const,
                color: '#3563C9',
              },
              {
                label: '이용약관',
                icon: 'document-text-outline' as const,
                color: '#687386',
              },
              {
                label: '오픈소스 라이선스',
                icon: 'code-slash-outline' as const,
                color: '#687386',
              },
            ].map((item, index, array) => (
              <Pressable
                key={item.label}
                style={[
                  styles.serviceMenuItem,
                  index === array.length - 1 &&
                  styles.serviceMenuItemLast,
                ]}
                onPress={() =>
                  handleServiceMenuPress(item.label)
                }
              >
                <View style={styles.serviceMenuItemLeft}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.color}
                  />

                  <Text style={styles.serviceMenuItemText}>
                    {item.label}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#687386"
                />
              </Pressable>
            ))}

            <Text
              style={[
                styles.serviceSectionLabel,
                styles.serviceSupportLabel,
              ]}
            >
              지원
            </Text>

            {[
              {
                label: '문의하기',
                icon: 'mail-outline' as const,
              },
              {
                label: '앱 정보',
                icon: 'information-circle-outline' as const,
              },
            ].map((item, index, array) => (
              <Pressable
                key={item.label}
                style={[
                  styles.serviceMenuItem,
                  index === array.length - 1 &&
                  styles.serviceMenuItemLast,
                ]}
                onPress={() =>
                  handleServiceMenuPress(item.label)
                }
              >
                <View style={styles.serviceMenuItemLeft}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color="#687386"
                  />

                  <Text style={styles.serviceMenuItemText}>
                    {item.label}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#687386"
                />
              </Pressable>
            ))}

            <Text style={styles.serviceVersion}>
              v1.0.0
            </Text>
          </Animated.View>
        </View>
      </Modal>

      {/* =========================
          Bottom Sheet
      ========================= */}

      <Modal
        visible={
          showSimulator
        }
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={
          closeSimulator
        }
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          keyboardVerticalOffset={0}
        >
          <Animated.View
            style={[
              styles.backdrop,

              {
                opacity:
                  backdropOpacity,
              },
            ]}
          >
            <Pressable
              style={
                styles.backdropPressArea
              }
              onPress={
                closeSimulator
              }
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.bottomSheet,

              {
                transform: [
                  {
                    translateY:
                      slideAnim,
                  },
                ],
              },
            ]}
          >
            <ScrollView
              style={styles.bottomSheetScroll}
              contentContainerStyle={styles.bottomSheetScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === 'ios'
                  ? 'interactive'
                  : 'none'
              }
              nestedScrollEnabled
            >
              <View
                style={
                  styles.sheetHandle
                }
              />

              <View
                style={
                  styles.sheetHeader
                }
              >
                <View
                  style={
                    styles.sheetTitleArea
                  }
                >
                  <Text
                    style={
                      styles.sheetTitle
                    }
                  >
                    이거 사도 돼?
                  </Text>

                  <Text
                    style={
                      styles.sheetDescription
                    }
                  >
                    금액을 입력하면 구매 후 하루 예산을 알려드려요.
                  </Text>
                </View>

                <Pressable
                  style={
                    styles.closeButton
                  }
                  onPress={
                    closeSimulator
                  }
                >
                  <Ionicons
                    name="close"
                    size={23}
                    color="#687386"
                  />
                </Pressable>
              </View>

              <Text
                style={
                  styles.sheetLabel
                }
              >
                사고 싶은 금액
              </Text>

              <View
                style={
                  styles.purchaseInputBox
                }
              >
                <TextInput
                  style={
                    styles.purchaseInput
                  }
                  value={
                    purchaseAmount
                  }
                  onChangeText={(
                    text
                  ) =>
                    setPurchaseAmount(
                      formatMoneyInput(
                        text
                      )
                    )
                  }
                  placeholder="0"
                  placeholderTextColor="#687386"
                  keyboardType="numeric"
                  returnKeyType="done"
                />

                <Text
                  style={
                    styles.purchaseUnit
                  }
                >
                  원
                </Text>
              </View>

              {purchase > 0 && (
                <>
                  {/* 비교 */}

                  <View
                    style={
                      styles.comparisonBox
                    }
                  >
                    <View
                      style={
                        styles.comparisonColumn
                      }
                    >
                      <Text
                        style={
                          styles.comparisonLabel
                        }
                      >
                        현재
                      </Text>

                      <Text
                        style={
                          styles.comparisonAmount
                        }
                      >
                        {formatMoney(
                          dailyBudget
                        )}
                        원
                      </Text>

                      <Text
                        style={
                          styles.comparisonSub
                        }
                      >
                        하루 사용 가능
                      </Text>
                    </View>

                    <View
                      style={
                        styles.arrowArea
                      }
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={22}
                        color="#687386"
                      />
                    </View>

                    <View
                      style={
                        styles.comparisonColumn
                      }
                    >
                      <Text
                        style={
                          styles.comparisonLabel
                        }
                      >
                        구매 후
                      </Text>

                      <Text
                        style={
                          styles.afterAmount
                        }
                      >
                        {formatMoney(
                          dailyBudgetAfterPurchase
                        )}
                        원
                      </Text>

                      <Text
                        style={
                          styles.comparisonSub
                        }
                      >
                        하루 사용 가능
                      </Text>
                    </View>
                  </View>

                  {!isOverBudget &&
                    dailyDifference >
                    0 && (
                      <View
                        style={
                          styles.differenceBox
                        }
                      >
                        <Ionicons
                          name="trending-down-outline"
                          size={18}
                          color="#687386"
                        />

                        <Text
                          style={
                            styles.differenceText
                          }
                        >
                          앞으로 하루에{' '}
                          <Text
                            style={
                              styles.differenceStrong
                            }
                          >
                            {formatMoney(
                              dailyDifference
                            )}
                            원
                          </Text>
                          씩 덜 사용할 수 있어요.
                        </Text>
                      </View>
                    )}

                  {simulationStatus && (
                    <View
                      style={[
                        styles.statusBox,

                        simulationStatus.type ===
                        'safe' &&
                        styles.statusSafe,

                        simulationStatus.type ===
                        'warning' &&
                        styles.statusWarning,

                        simulationStatus.type ===
                        'danger' &&
                        styles.statusDanger,
                      ]}
                    >
                      <Ionicons
                        name={
                          simulationStatus.icon
                        }
                        size={22}
                        color={
                          simulationStatus.type ===
                            'safe'
                            ? '#2F7D5A'
                            : simulationStatus.type ===
                              'warning'
                              ? '#A26A12'
                              : '#C94A4A'
                        }
                      />

                      <View
                        style={
                          styles.statusTextArea
                        }
                      >
                        <Text
                          style={
                            styles.statusTitle
                          }
                        >
                          {
                            simulationStatus.title
                          }
                        </Text>

                        <Text
                          style={
                            styles.statusMessage
                          }
                        >
                          {
                            simulationStatus.message
                          }
                        </Text>
                      </View>
                    </View>
                  )}

                  <View
                    style={
                      styles.remainingAfterBox
                    }
                  >
                    <Text
                      style={
                        styles.remainingAfterLabel
                      }
                    >
                      구매 후 사용 가능한 생활비
                    </Text>

                    <Text
                      style={
                        styles.remainingAfterAmount
                      }
                    >
                      {formatMoney(
                        usableBudgetAfterPurchase
                      )}
                      원
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles =
  StyleSheet.create({
    /* ========================
       Home
    ======================== */

    screen: {
      flex: 1,

      backgroundColor:
        '#FFFFFF',
    },

    scrollContent: {
      flexGrow: 1,
      // Safe Area 아래에 홈 화면 자체의 시각적 상단 여백을 추가합니다.
      paddingTop: 32,
      paddingBottom: 112,
    },

    scrollContentCompact: {
      // 세로가 짧은 기기에서도 너무 위에 붙지 않도록 여백을 유지합니다.
      paddingTop: 26,
      paddingBottom: 96,
    },

    content: {
      width: '100%',

      maxWidth: 520,

      alignSelf: 'center',
    },

    headerRow: {
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },

    headerRowCompact: {
      marginBottom: 18,
    },

    title: {
      flex: 1,
      fontSize: 24,
      lineHeight: 32,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#172033',
    },

    menuButton: {
      width: 38,
      height: 38,
      marginLeft: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    menuButtonPressed: {
      backgroundColor: '#F3F6FA',
    },

    /* ========================
       Daily card
    ======================== */

    dailyCard: {
      backgroundColor:
        '#F3F6FC',

      borderRadius: 22,
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 18,
    },

    dailyCardCompact: {
      paddingTop: 20,
      paddingBottom: 15,
    },

    dailyLabel: {
      textAlign: 'center',
      fontSize: 15,
      lineHeight: 21,
      fontFamily: 'Pretendard-Medium',
      color: '#687386',
    },

    dailyAmount: {
      marginTop: 3,

      textAlign: 'center',

      fontSize: 46,

      lineHeight: 54,

      letterSpacing: -1.3,

      fontFamily:
        'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    dailyAmountSmall: {
      fontSize: 41,

      lineHeight: 49,
    },

    dailyMessage: {
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Pretendard-Regular',
      color: '#566176',
    },

    dailyDivider: {
      height: 1,

      backgroundColor:
        '#E2E8F2',

      marginTop: 20,
      marginBottom: 14,
    },

    dailyBottomRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    monthSpentLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Pretendard-Regular',
      color: '#687386',
    },

    monthSpentAmount: {
      marginTop: 2,
      fontSize: 15,
      lineHeight: 21,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#566176',
    },

    monthSpentSubText: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'Pretendard-Medium',
      color: '#7F8A9D',
    },

    dDayBadge: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      backgroundColor:
        '#E7EEFC',

      paddingHorizontal: 9,

      paddingVertical: 6,

      borderRadius: 999,
    },

    dDayText: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#3563C9',
    },

    reserveInlineRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },

    reserveInlineText: {
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'Pretendard-Regular',
      color: '#687386',
    },

    /* ========================
       Today summary
    ======================== */

    budgetSummaryCard: {
      marginTop: 16,
      paddingHorizontal: 16,
      backgroundColor: '#F8FAFD',
      borderWidth: 1,
      borderColor: '#EEF2F7',
      borderRadius: 18,
    },

    todaySummary: {
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E9EDF3',
    },

    todaySummaryTop: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    todaySummaryLabel: {
      fontSize: 15,
      lineHeight: 21,
      fontFamily: 'Pretendard-Medium',
      color: '#566176',
    },

    todaySummaryAmount: {
      fontSize: 17,
      lineHeight: 23,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#172033',
    },

    todaySummaryBottom: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },

    statusDot: {
      width: 6,

      height: 6,

      borderRadius: 3,

      backgroundColor:
        '#98A2B3',

      marginRight: 7,
    },

    statusDotSafe: {
      backgroundColor:
        '#4D9471',
    },

    statusDotWarning: {
      backgroundColor:
        '#B5822F',
    },

    statusDotDanger: {
      backgroundColor:
        '#D86666',
    },

    todaySummaryMessage: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Pretendard-Medium',
      color: '#687386',
    },

    todaySummaryMessageSafe: {
      color: '#4D8167',
    },

    todaySummaryMessageWarning: {
      color: '#8C6A2D',
    },

    todaySummaryMessageDanger: {
      color: '#C65353',
    },

    /* ========================
       Remaining
    ======================== */

    remainingSection: {
      minHeight: 72,
      paddingTop: 16,
      paddingBottom: 16,
    },

    remainingTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    remainingLabel: {
      fontSize: 15,
      lineHeight: 21,
      fontFamily: 'Pretendard-Medium',
      color: '#566176',
    },

    remainingAmount: {
      fontSize: 17,
      lineHeight: 23,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#172033',
    },

    plannedNoticeRow: {
      marginTop: 7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    plannedNotice: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Pretendard-Regular',
      color: '#687386',
    },

    /* ========================
       Actions
    ======================== */

    actionSection: {
      marginTop: 16,
    },

    simulatorButton: {
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: '#F8FAFD',
      borderWidth: 1,
      borderColor: '#EEF2F7',
      borderRadius: 16,
    },

    simulatorButtonPressed: {
      opacity: 0.55,
    },

    simulatorTextArea: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
    },

    simulatorTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'Pretendard-Bold',
      color: '#172033',
    },

    simulatorDescription: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Pretendard-Regular',
      color: '#687386',
    },

    /* ========================
       Monthly notice
    ======================== */

    monthlyNotice: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 92,
      maxWidth: 480,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6ECF5',
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 10,
      zIndex: 500,
    },

    monthlyNoticeIconBox: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: '#EEF3FE',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    monthlyNoticeTextArea: {
      flex: 1,
    },

    monthlyNoticeTitle: {
      fontSize: 15,
      lineHeight: 21,
      fontFamily: 'Pretendard-Bold',
      color: '#172033',
    },

    monthlyNoticeDescription: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Pretendard-Regular',
      color: '#687386',
    },

    /* ========================
       Service menu
    ======================== */
    serviceMenuModalRoot: {
      flex: 1,
      alignItems: 'flex-end',
    },

    serviceMenuBackdrop: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(23, 32, 51, 0.34)',
    },

    serviceMenuSheet: {
      width: '72%',
      maxWidth: 360,
      height: '100%',

      backgroundColor: '#FFFFFF',

      paddingHorizontal: 20,
      paddingBottom: 28,

      shadowColor: '#000000',
      shadowOffset: {
        width: -4,
        height: 0,
      },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 14,
    },

    serviceMenuHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 22,
    },

    serviceMenuBrand: {
      fontSize: 23,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#172033',
    },

    serviceMenuDescription: {
      marginTop: 5,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Pretendard-Regular',
      color: '#687386',
    },

    serviceSectionLabel: {
      marginBottom: 8,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Pretendard-Bold',
      color: '#687386',
    },

    serviceSupportLabel: {
      marginTop: 22,
    },

    serviceMenuItem: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: '#EEF1F5',
    },

    serviceMenuItemLast: {
      borderBottomWidth: 0,
    },

    serviceMenuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },

    serviceMenuItemText: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'Pretendard-SemiBold',
      color: '#172033',
    },

    serviceVersion: {
      marginTop: 24,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Pretendard-Regular',
      color: '#687386',
    },

    /* ========================
       Modal
    ======================== */

    modalRoot: {
      flex: 1,

      justifyContent:
        'flex-end',
    },

    backdrop: {
      position: 'absolute',

      top: 0,
      bottom: 0,
      left: 0,
      right: 0,

      backgroundColor:
        'rgba(23, 32, 51, 0.38)',
    },

    backdropPressArea: {
      flex: 1,
    },

    bottomSheetScroll: {
      flexGrow: 0,
    },

    bottomSheetScrollContent: {
      paddingBottom: 36,
    },

    bottomSheet: {
      maxHeight: '88%',
      overflow: 'hidden',
      backgroundColor:
        '#FFFFFF',

      borderTopLeftRadius: 28,

      borderTopRightRadius: 28,

      paddingHorizontal: 24,

      paddingTop: 12,

      paddingBottom: 34,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: -5,
      },

      shadowOpacity: 0.1,

      shadowRadius: 18,

      elevation: 12,
    },

    sheetHandle: {
      alignSelf: 'center',

      width: 44,

      height: 5,

      borderRadius: 999,

      backgroundColor:
        '#D7DDE6',

      marginBottom: 22,
    },

    sheetHeader: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',

      marginBottom: 26,
    },

    sheetTitleArea: {
      flex: 1,

      paddingRight: 14,
    },

    sheetTitle: {
      fontSize: 23,
      lineHeight: 30,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#172033',
    },

    sheetDescription: {
      marginTop: 7,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: 'Pretendard-Regular',
      color: '#687386',
    },

    closeButton: {
      width: 38,

      height: 38,

      borderRadius: 19,

      backgroundColor:
        '#F5F7FA',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    sheetLabel: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'Pretendard-Bold',
      color: '#172033',
      marginBottom: 9,
    },

    purchaseInputBox: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        '#F1F5FC',

      borderRadius: 16,

      paddingHorizontal: 18,
    },

    purchaseInput: {
      flex: 1,

      paddingVertical: 18,

      fontSize: 26,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    purchaseUnit: {
      marginLeft: 8,

      fontSize: 16,

      fontFamily: 'Pretendard-Bold',

      color: '#687386',
    },

    comparisonBox: {
      marginTop: 24,

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        '#F8FAFC',

      borderRadius: 18,

      padding: 16,
    },

    comparisonColumn: {
      flex: 1,

      alignItems: 'center',
    },

    comparisonLabel: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Pretendard-Medium',
      color: '#687386',
    },

    comparisonAmount: {
      marginTop: 6,

      fontSize: 18,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    afterAmount: {
      marginTop: 6,

      fontSize: 18,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    comparisonSub: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'Pretendard-Regular',
      color: '#687386',
    },

    arrowArea: {
      width: 35,

      alignItems: 'center',
    },

    differenceBox: {
      marginTop: 12,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,
    },

    differenceText: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Pretendard-Regular',
      color: '#566176',
    },

    differenceStrong: {
      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    statusBox: {
      marginTop: 18,

      flexDirection: 'row',

      alignItems:
        'flex-start',

      borderRadius: 16,

      padding: 15,
    },

    statusSafe: {
      backgroundColor:
        '#EEF8F3',
    },

    statusWarning: {
      backgroundColor:
        '#FFF7E8',
    },

    statusDanger: {
      backgroundColor:
        '#FFF1F1',
    },

    statusTextArea: {
      flex: 1,

      marginLeft: 10,
    },

    statusTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#172033',
    },

    statusMessage: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: 'Pretendard-Regular',
      color: '#566176',
    },

    remainingAfterBox: {
      marginTop: 10,

      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      paddingTop: 14,

      borderTopWidth: 1,

      borderTopColor:
        '#EEF1F5',
    },

    remainingAfterLabel: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Pretendard-Medium',
      color: '#566176',
    },

    remainingAfterAmount: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#172033',
    },
  });