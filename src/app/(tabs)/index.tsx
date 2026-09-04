import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

const BUDGET_KEY = 'budget-settings';
const EXPENSES_KEY = 'expenses';
const PLANNED_EXPENSES_KEY = 'planned-expenses';

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

type BudgetSettings = {
  monthlyBudget: number;
  fixedExpense: number;
  savingGoal: number;
  investmentAmount: number;
  spentAmount: number;
  payday: number;
  paydayType?: 'date' | 'lastDay';
};

const DEFAULT_SETTINGS: BudgetSettings = {
  monthlyBudget: 1000000,
  fixedExpense: 400000,
  savingGoal: 200000,
  investmentAmount: 0,
  spentAmount: 100000,
  payday: 25,
  paydayType: 'date',
};

export default function HomeScreen() {
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

  const [settings, setSettings] =
    useState<BudgetSettings>(
      DEFAULT_SETTINGS
    );

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
        isActive = false;
      };
    }, [])
  );

  const loadHomeData =
    async () => {
      try {
        const [
          savedBudget,
          savedExpenses,
          savedPlannedExpenses,
        ] = await Promise.all([
          AsyncStorage.getItem(
            BUDGET_KEY
          ),
          AsyncStorage.getItem(
            EXPENSES_KEY
          ),
          AsyncStorage.getItem(
            PLANNED_EXPENSES_KEY
          ),
        ]);

        if (savedBudget) {
          const data =
            JSON.parse(
              savedBudget
            );

          setSettings({
            monthlyBudget:
              Number(
                data.monthlyBudget
              ) || 0,

            fixedExpense:
              Number(
                data.fixedExpense
              ) || 0,

            savingGoal:
              Number(
                data.savingGoal
              ) || 0,

            investmentAmount:
              Number(
                data.investmentAmount
              ) || 0,

            spentAmount:
              Number(
                data.spentAmount
              ) || 0,

            payday:
              Number(
                data.payday
              ) || 25,

            paydayType:
              data.paydayType ||
              'date',
          });
        }

        const parsedExpenses:
          Expense[] =
          savedExpenses
            ? JSON.parse(
                savedExpenses
              )
            : [];

        const today =
          new Date();

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

              if (
                expenseDate <
                todayStart
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

  const getLastDay = (
    year: number,
    month: number
  ) => {
    return new Date(
      year,
      month + 1,
      0
    ).getDate();
  };

  const getRemainingDays =
    () => {
      const today =
        new Date();

      const year =
        today.getFullYear();

      const month =
        today.getMonth();

      const todayDate =
        today.getDate();

      let targetDate: Date;

      if (
        settings.paydayType ===
        'lastDay'
      ) {
        const thisMonthLastDay =
          getLastDay(
            year,
            month
          );

        if (
          todayDate <
          thisMonthLastDay
        ) {
          targetDate =
            new Date(
              year,
              month,
              thisMonthLastDay
            );
        } else {
          const nextMonthLastDay =
            getLastDay(
              year,
              month + 1
            );

          targetDate =
            new Date(
              year,
              month + 1,
              nextMonthLastDay
            );
        }
      } else {
        const thisMonthPayday =
          Math.min(
            settings.payday,
            getLastDay(
              year,
              month
            )
          );

        if (
          todayDate <
          thisMonthPayday
        ) {
          targetDate =
            new Date(
              year,
              month,
              thisMonthPayday
            );
        } else {
          const nextMonthPayday =
            Math.min(
              settings.payday,
              getLastDay(
                year,
                month + 1
              )
            );

          targetDate =
            new Date(
              year,
              month + 1,
              nextMonthPayday
            );
        }
      }

      const todayStart =
        new Date(
          year,
          month,
          todayDate
        );

      const difference =
        targetDate.getTime() -
        todayStart.getTime();

      const days =
        Math.ceil(
          difference /
            (
              1000 *
              60 *
              60 *
              24
            )
        );

      return Math.max(
        days,
        1
      );
    };

  const remainingDays =
    getRemainingDays();

  /* =========================
     생활비 계산
  ========================= */

  const SAFETY_RESERVE_RATE = 0.1;

  // 실제 지출뿐 아니라 앞으로 예정된 지출도 미리 빼둔 생활비
  const remainingBudget =
    Math.max(
      0,

      settings.monthlyBudget -
        settings.fixedExpense -
        settings.savingGoal -
        settings.investmentAmount -
        settings.spentAmount -
        plannedAmount
    );

  // 남은 생활비의 10%는 예상치 못한 지출을 위한 안전 여유금으로 보호
  const safetyReserve =
    Math.floor(
      remainingBudget *
        SAFETY_RESERVE_RATE
    );

  // 실제로 다음 월급일까지 나눠 사용할 수 있는 생활비
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

  // 구매 후 하루 권장 생활비
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
          '안전 여유금을 남기고도 월급일까지 사용할 생활비가 있어요.',
      };
    };

  const simulationStatus =
    getSimulationStatus();

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.scrollContent,

          isCompactHeight &&
            styles.scrollContentCompact,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
              정도까지가 적당해요
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
                  이번 달 사용
                </Text>

                <Text
                  style={
                    styles.monthSpentAmount
                  }
                >
                  {formatMoney(
                    settings.spentAmount
                  )}
                  원
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
                  D-
                  {
                    remainingDays
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* 오늘 사용 현황 */}

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
                color="#A3ADBC"
              />
            </Pressable>

            <Pressable
              style={({
                pressed,
              }) => [
                styles.expenseButton,

                pressed &&
                  styles.expenseButtonPressed,
              ]}
              onPress={() =>
                router.push(
                  '/expense'
                )
              }
            >
              <Ionicons
                name="add"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.expenseButtonText
                }
              >
                지출 기록하기
              </Text>
            </Pressable>
          </View>

          <Text
            style={
              styles.reserveGuide
            }
          >
            남은 생활비의 10%는 여유금으로 남겨두고 계산해요.
          </Text>
        </View>
      </ScrollView>

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
                  color="#A3ADBC"
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
                  color="#A3ADBC"
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
        <View
          style={
            styles.modalRoot
          }
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
                  사고 싶은 금액을 입력하면 구매 후 하루 예산을 계산해드려요.
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
                keyboardType="numeric"
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
                      color="#98A2B3"
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
          </Animated.View>
        </View>
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
      paddingTop: 46,
      paddingBottom: 112,
    },

    scrollContentCompact: {
      paddingTop: 28,
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
      fontSize: 21,
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
      paddingBottom: 17,
    },

    dailyCardCompact: {
      paddingTop: 20,
      paddingBottom: 15,
    },

    dailyLabel: {
      textAlign: 'center',

      fontSize: 13,

      fontFamily:
        'Pretendard-Medium',

      color: '#7C8798',
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

      fontSize: 13,

      fontFamily:
        'Pretendard-Regular',

      color: '#687386',
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
      fontSize: 10,

      fontFamily:
        'Pretendard-Regular',

      color: '#98A2B3',
    },

    monthSpentAmount: {
      marginTop: 2,

      fontSize: 12,

      fontFamily:
        'Pretendard-Bold',

      color: '#687386',
    },

    dDayBadge: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      backgroundColor:
        '#E7EEFC',

      paddingHorizontal: 10,

      paddingVertical: 6,

      borderRadius: 999,
    },

    dDayText: {
      fontSize: 11,

      fontFamily:
        'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    /* ========================
       Today summary
    ======================== */

    todaySummary: {
      marginTop: 18,
      paddingHorizontal: 2,
      paddingBottom: 18,
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
      fontSize: 13,

      fontFamily:
        'Pretendard-Medium',

      color: '#687386',
    },

    todaySummaryAmount: {
      fontSize: 15,

      fontFamily:
        'Pretendard-ExtraBold',

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

      fontSize: 11,

      lineHeight: 16,

      fontFamily:
        'Pretendard-Medium',

      color: '#8792A2',
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
      paddingHorizontal: 2,
      paddingTop: 17,
      paddingBottom: 17,
      borderBottomWidth: 1,
      borderBottomColor: '#E9EDF3',
    },

    remainingTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    remainingLabel: {
      fontSize: 13,
      fontFamily: 'Pretendard-Medium',
      color: '#687386',
    },

    remainingAmount: {
      fontSize: 15,
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
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'Pretendard-Regular',
      color: '#8B96A8',
    },

    /* ========================
       Actions
    ======================== */

    actionSection: {
      marginTop: 16,
      gap: 12,
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
      fontSize: 14,
      fontFamily: 'Pretendard-Bold',
      color: '#172033',
    },

    simulatorDescription: {
      marginTop: 2,
      fontSize: 10,
      lineHeight: 15,
      fontFamily: 'Pretendard-Regular',
      color: '#8F9AAD',
    },

    expenseButton: {
      marginTop: 25,
      minHeight: 56,
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 4,

      backgroundColor:
        '#3563C9',

      borderRadius: 16,
    },

    expenseButtonPressed: {
      backgroundColor:
        '#294FA5',

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    expenseButtonText: {
      color: '#FFFFFF',

      fontSize: 15,

      fontFamily:
        'Pretendard-ExtraBold',
    },

    reserveGuide: {
      marginTop: 14,
      paddingHorizontal: 10,
      textAlign: 'center',
      fontSize: 10,
      lineHeight: 15,
      fontFamily: 'Pretendard-Regular',
      color: '#9AA4B2',
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
  paddingTop: 48,
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
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'Pretendard-Regular',
      color: '#8792A2',
    },

    serviceSectionLabel: {
      marginBottom: 8,
      fontSize: 11,
      fontFamily: 'Pretendard-Bold',
      color: '#98A2B3',
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
      fontSize: 14,
      fontFamily: 'Pretendard-SemiBold',
      color: '#172033',
    },

    serviceVersion: {
      marginTop: 24,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: 'Pretendard-Regular',
      color: '#A3ADBC',
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

    bottomSheet: {
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
      fontSize: 22,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    sheetDescription: {
      marginTop: 7,

      fontSize: 13,

      lineHeight: 19,

      color: '#8792A2',
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
      fontSize: 14,

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
      fontSize: 12,

      color: '#8792A2',
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

      fontSize: 11,

      color: '#98A2B3',
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
      fontSize: 13,

      color: '#687386',
    },

    differenceStrong: {
      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    statusBox: {
      marginTop: 20,

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
      fontSize: 14,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    statusMessage: {
      marginTop: 4,

      fontSize: 12,

      lineHeight: 18,

      color: '#687386',
    },

    remainingAfterBox: {
      marginTop: 14,

      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      paddingTop: 16,

      borderTopWidth: 1,

      borderTopColor:
        '#EEF1F5',
    },

    remainingAfterLabel: {
      fontSize: 13,

      color: '#687386',
    },

    remainingAfterAmount: {
      fontSize: 17,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },
  });