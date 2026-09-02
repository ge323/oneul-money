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
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const BUDGET_KEY = 'budget-settings';
const EXPENSES_KEY = 'expenses';

type Expense = {
  id: string;
  title: string;
  amount: number;
  category?: string;
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
  const [settings, setSettings] =
    useState<BudgetSettings>(
      DEFAULT_SETTINGS
    );

  const [
    showSimulator,
    setShowSimulator,
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
        ] = await Promise.all([
          AsyncStorage.getItem(
            BUDGET_KEY
          ),
          AsyncStorage.getItem(
            EXPENSES_KEY
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

  const remainingBudget =
    Math.max(
      0,

      settings.monthlyBudget -
        settings.fixedExpense -
        settings.savingGoal -
        settings.investmentAmount -
        settings.spentAmount
    );

  const dailyBudget =
    remainingDays > 0
      ? Math.floor(
          remainingBudget /
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
            '지출을 기록하면 오늘 소비 상태를 알려드려요.',
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

          message: `오늘 ${formatMoney(
            todaySpent
          )}원을 사용했어요.`,
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

          message: `오늘 ${formatMoney(
            todaySpent
          )}원을 사용했어요.`,
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

          message: `오늘 ${formatMoney(
            todaySpent
          )}원을 사용했어요.`,
        };
      }

      return {
        type: 'safe' as const,

        icon:
          'checkmark-circle-outline' as const,

        title:
          '오늘 소비는 적정해요',

        message: `오늘 ${formatMoney(
          todaySpent
        )}원 사용 · ${formatMoney(
          todayRemaining
        )}원 여유`,
      };
    };

  const todayStatus =
    getTodayStatus();

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

  const budgetAfterPurchase =
    Math.max(
      0,
      remainingBudget -
        purchase
    );

  const dailyBudgetAfterPurchase =
    remainingDays > 0
      ? Math.floor(
          budgetAfterPurchase /
            remainingDays
        )
      : 0;

  const dailyDifference =
    Math.max(
      0,
      dailyBudget -
        dailyBudgetAfterPurchase
    );

  const isOverBudget =
    purchase >
    remainingBudget;

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
            '현재 남은 생활비보다 큰 금액이에요.',
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
            '구매 후 하루 사용 가능 금액이 크게 줄어요.',
        };
      }

      return {
        type: 'safe',

        icon:
          'checkmark-circle' as const,

        title:
          '생활비 안에서는 가능해요',

        message:
          '구매 후에도 월급일까지 사용할 생활비가 남아 있어요.',
      };
    };

  const simulationStatus =
    getSimulationStatus();

  return (
    <>
      <View
        style={
          styles.container
        }
      >
        {/* =====================
            타이틀
        ===================== */}

        <Text
          style={
            styles.title
          }
        >
          오늘 얼마 써도 돼?
        </Text>

        {/* =====================
            오늘 사용 가능 카드
        ===================== */}

        <View
          style={
            styles.dailyCard
          }
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
              style={
                styles.dailyAmount
              }
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
            까지 써도 괜찮아요
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
                size={14}
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

        {/* =====================
            남은 생활비
        ===================== */}

        <View
          style={
            styles.remainingRow
          }
        >
          <View
            style={
              styles.remainingLeft
            }
          >
            <View
              style={
                styles.remainingIcon
              }
            >
              <Ionicons
                name="wallet-outline"
                size={17}
                color="#687386"
              />
            </View>

            <Text
              style={
                styles.remainingLabel
              }
            >
              남은 생활비
            </Text>
          </View>

          <Text
            style={
              styles.remainingAmount
            }
          >
            {formatMoney(
              remainingBudget
            )}
            원
          </Text>
        </View>

        {/* =====================
            이거 사도 돼?
        ===================== */}

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

        {/* =====================
            지출 기록
        ===================== */}

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
            size={21}
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

        {/* =====================
            오늘 소비 상태
        ===================== */}

        <View
          style={
            styles.todayStatusRow
          }
        >
          <Ionicons
            name={
              todayStatus.icon
            }
            size={17}
            color={
              todayStatus.type ===
              'safe'
                ? '#2F7D5A'
                : todayStatus.type ===
                    'warning'
                  ? '#9A6818'
                  : todayStatus.type ===
                      'danger'
                    ? '#D05B5B'
                    : '#8792A2'
            }
          />

          <View
            style={
              styles.todayStatusTextArea
            }
          >
            <Text
              style={[
                styles.todayStatusTitle,

                todayStatus.type ===
                  'safe' &&
                  styles.todayStatusTitleSafe,

                todayStatus.type ===
                  'warning' &&
                  styles.todayStatusTitleWarning,

                todayStatus.type ===
                  'danger' &&
                  styles.todayStatusTitleDanger,
              ]}
            >
              {
                todayStatus.title
              }
            </Text>

            <Text
              style={
                styles.todayStatusMessage
              }
            >
              {
                todayStatus.message
              }
            </Text>
          </View>
        </View>
      </View>

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
                    구매 후 남는 생활비
                  </Text>

                  <Text
                    style={
                      styles.remainingAfterAmount
                    }
                  >
                    {isOverBudget
                      ? '0'
                      : formatMoney(
                          budgetAfterPurchase
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

    container: {
      flex: 1,

      backgroundColor:
        '#FFFFFF',

      paddingHorizontal: 20,

      paddingTop: 70,

      paddingBottom: 96,
    },

    title: {
      fontSize: 21,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',

      marginBottom: 26,
    },

    /* ========================
       Daily card
    ======================== */

    dailyCard: {
      backgroundColor:
        '#F3F6FC',

      borderRadius: 24,

      paddingHorizontal: 20,

      paddingTop: 22,

      paddingBottom: 15,

      marginBottom: 14,
    },

    dailyLabel: {
      textAlign: 'center',

      fontSize: 14,

     fontFamily: 'Pretendard-Medium',

      color: '#7C8798',
    },

    dailyAmount: {
      marginTop: 3,

      textAlign: 'center',

      fontSize: 46,

      lineHeight: 54,

      letterSpacing: -1.3,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    dailyMessage: {
      marginTop: 0,

      textAlign: 'center',

      fontSize: 14,

      color: '#687386',
    },

    dailyDivider: {
      height: 1,

      backgroundColor:
        '#E2E8F2',

      marginTop: 19,

      marginBottom: 13,
    },

    dailyBottomRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    monthSpentLabel: {
      fontSize: 11,

      color: '#98A2B3',
    },

    monthSpentAmount: {
      marginTop: 3,

      fontSize: 13,

      fontFamily: 'Pretendard-Bold',

      color: '#687386',
    },

    dDayBadge: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      backgroundColor:
        '#E4ECFC',

      paddingHorizontal: 11,

      paddingVertical: 7,

      borderRadius: 999,
    },

    dDayText: {
      fontSize: 12,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    /* ========================
       Remaining
    ======================== */

    remainingRow: {
      minHeight: 58,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      paddingHorizontal: 5,

      marginBottom: 10,
    },

    remainingLeft: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    remainingIcon: {
      width: 34,

      height: 34,

      borderRadius: 11,

      backgroundColor:
        '#F5F7FA',

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 9,
    },

    remainingLabel: {
      fontSize: 13,

      color: '#687386',
    },

    remainingAmount: {
      fontSize: 15,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    /* ========================
       Simulator
    ======================== */

    simulatorButton: {
      minHeight: 58,

      flexDirection: 'row',

      alignItems: 'center',

      paddingHorizontal: 4,

      paddingVertical: 8,

      borderTopWidth: 1,

      borderBottomWidth: 1,

      borderColor:
        '#EEF1F5',

      marginBottom: 12,
    },

    simulatorButtonPressed: {
      opacity: 0.6,
    },

    simulatorTextArea: {
      flex: 1,

      marginLeft: 10,

      marginRight: 8,
    },

    simulatorTitle: {
      fontSize: 14,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    simulatorDescription: {
      marginTop: 3,

      fontSize: 11,

      lineHeight: 16,

      color: '#8792A2',
    },

    /* ========================
       Expense button
    ======================== */

    expenseButton: {
      minHeight: 54,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 4,

      backgroundColor:
        '#3563C9',

      borderRadius: 15,
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

      fontFamily: 'Pretendard-ExtraBold',
    },

    /* ========================
       Today status
    ======================== */

    todayStatusRow: {
      marginTop: 3,

      minHeight: 52,

      flexDirection: 'row',

      alignItems: 'center',

      paddingHorizontal: 4,

      paddingVertical: 10,
    },

    todayStatusTextArea: {
      flex: 1,

      marginLeft: 9,
    },

    todayStatusTitle: {
      fontSize: 12,

      fontFamily: 'Pretendard-Bold',

      color: '#172033',
    },

    todayStatusTitleSafe: {
      color: '#2F7D5A',
    },

    todayStatusTitleWarning: {
      color: '#8A631C',
    },

    todayStatusTitleDanger: {
      color: '#C65353',
    },

    todayStatusMessage: {
      marginTop: 2,

      fontSize: 10,

      lineHeight: 13,

      color: '#98A2B3',
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