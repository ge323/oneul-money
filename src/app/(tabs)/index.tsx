import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import {
  useCallback,
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

type BudgetSettings = {
  monthlyBudget: number;
  fixedExpense: number;
  savingGoal: number;
  spentAmount: number;
  payday: number;
  paydayType?: 'date' | 'lastDay';
};

const DEFAULT_SETTINGS: BudgetSettings = {
  monthlyBudget: 1000000,
  fixedExpense: 400000,
  savingGoal: 200000,
  spentAmount: 100000,
  payday: 25,
  paydayType: 'date',
};

export default function HomeScreen() {
  const [settings, setSettings] =
    useState<BudgetSettings>(
      DEFAULT_SETTINGS
    );

  const [showSimulator, setShowSimulator] =
    useState(false);

  const [purchaseAmount, setPurchaseAmount] =
    useState('');

  const slideAnim = useRef(
    new Animated.Value(500)
  ).current;

  const backdropOpacity = useRef(
    new Animated.Value(0)
  ).current;

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(
          BUDGET_KEY
        );

      if (!saved) return;

      const data = JSON.parse(saved);

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
    } catch (error) {
      console.error(
        '예산 불러오기 실패:',
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

  const getRemainingDays = () => {
    const today = new Date();

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
        settings.spentAmount
    );

  const dailyBudget =
    remainingDays > 0
      ? Math.floor(
          remainingBudget /
            remainingDays
        )
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

  const openSimulator = () => {
    slideAnim.setValue(500);
    backdropOpacity.setValue(0);

    setShowSimulator(true);

    requestAnimationFrame(
      () => {
        Animated.parallel([
          Animated.timing(
            slideAnim,
            {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            backdropOpacity,
            {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }
          ),
        ]).start();
      }
    );
  };

  const closeSimulator = () => {
    Animated.parallel([
      Animated.timing(
        slideAnim,
        {
          toValue: 500,
          duration: 200,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        backdropOpacity,
        {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }
      ),
    ]).start(() => {
      setShowSimulator(
        false
      );

      setPurchaseAmount('');
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

  const getSimulationStatus = () => {
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
        <Text
          style={
            styles.title
          }
        >
          오늘 얼마 써도 돼?
        </Text>

        <View
          style={styles.main}
        >
          <Text
            style={
              styles.label
            }
          >
            오늘은
          </Text>

          <Text
            style={
              styles.amount
            }
          >
            {formatMoney(
              dailyBudget
            )}
            원
          </Text>

          <Text
            style={
              styles.description
            }
          >
            써도 괜찮아요
          </Text>
        </View>

        <View
          style={
            styles.infoBox
          }
        >
          <View
            style={
              styles.infoRow
            }
          >
            <Text
              style={
                styles.infoLabel
              }
            >
              남은 생활비
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              {formatMoney(
                remainingBudget
              )}
              원
            </Text>
          </View>

          <View
            style={
              styles.infoRow
            }
          >
            <Text
              style={
                styles.infoLabel
              }
            >
              다음 월급일까지
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              D-
              {
                remainingDays
              }
            </Text>
          </View>
        </View>

        {/* 이거 사도 돼 */}
        <Pressable
          style={({ pressed }) => [
            styles.simulatorButton,

            pressed &&
              styles.simulatorButtonPressed,
          ]}
          onPress={
            openSimulator
          }
        >
          <View
            style={
              styles.simulatorIcon
            }
          >
            <Ionicons
              name="bag-handle-outline"
              size={20}
              color="#3563C9"
            />
          </View>

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
              사고 싶은 금액이 생활비에
              미치는 영향을 확인해보세요.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#98A2B3"
          />
        </Pressable>

        {/* 지출 기록 */}
        <Pressable
          style={({ pressed }) => [
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
          <Text
            style={
              styles.expenseButtonText
            }
          >
            + 지출 기록하기
          </Text>
        </Pressable>

        <Text
          style={
            styles.guide
          }
        >
          지출을 기록하면 오늘 쓸 수
          있는 금액이 자동으로 다시
          계산돼요.
        </Text>
      </View>

      {/* ====================== */}
      {/* 이거 사도 돼 Bottom Sheet */}
      {/* ====================== */}

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
          {/* 검은 배경 */}
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

          {/* Bottom Sheet */}
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
                  사고 싶은 금액을 입력하면
                  구매 후 생활비를 계산해드려요.
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

            {/* 구매 금액 */}

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
                        씩 덜 사용할 수
                        있어요.
                      </Text>
                    </View>
                  )}

                {/* 상태 */}

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

                {/* 남은 생활비 */}

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
    container: {
      flex: 1,

      backgroundColor:
        '#FFFFFF',

      paddingHorizontal: 24,

      paddingTop: 60,

      paddingBottom: 100,
    },

    title: {
      fontSize: 22,

      fontWeight: '800',

      color: '#172033',
    },

    main: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    label: {
      fontSize: 18,

      color: '#687386',

      marginBottom: 12,
    },

    amount: {
      fontSize: 48,

      fontWeight: '800',

      marginBottom: 12,

      color: '#3563C9',
    },

    description: {
      fontSize: 18,

      color: '#687386',
    },

    infoBox: {
      backgroundColor:
        '#F1F5FC',

      borderRadius: 20,

      padding: 20,

      marginBottom: 14,

      gap: 18,
    },

    infoRow: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',
    },

    infoLabel: {
      fontSize: 15,

      color: '#687386',
    },

    infoValue: {
      fontSize: 15,

      fontWeight: '700',

      color: '#172033',
    },

    // 이거 사도 돼?

    simulatorButton: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        '#F8FAFC',

      borderRadius: 18,

      paddingHorizontal: 16,

      paddingVertical: 15,

      marginBottom: 10,

      borderWidth: 1,

      borderColor:
        '#EEF1F5',
    },

    simulatorButtonPressed: {
      backgroundColor:
        '#F1F5FC',
    },

    simulatorIcon: {
      width: 42,

      height: 42,

      borderRadius: 14,

      backgroundColor:
        '#EAF0FB',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    simulatorTextArea: {
      flex: 1,

      marginLeft: 12,

      marginRight: 8,
    },

    simulatorTitle: {
      fontSize: 15,

      fontWeight: '800',

      color: '#172033',
    },

    simulatorDescription: {
      marginTop: 4,

      fontSize: 12,

      lineHeight: 17,

      color: '#8792A2',
    },

    // 지출 기록

    expenseButton: {
      backgroundColor:
        '#3563C9',

      paddingVertical: 16,

      borderRadius: 16,

      alignItems: 'center',
    },

    expenseButtonPressed: {
      backgroundColor:
        '#294FA5',
    },

    expenseButtonText: {
      color: '#FFFFFF',

      fontSize: 16,

      fontWeight: '700',
    },

    guide: {
      marginTop: 12,

      fontSize: 12,

      lineHeight: 18,

      color: '#98A2B3',

      textAlign: 'center',
    },

    // ========================
    // Modal
    // ========================

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

      fontWeight: '800',

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

      fontWeight: '700',

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

      fontWeight: '800',

      color: '#3563C9',
    },

    purchaseUnit: {
      marginLeft: 8,

      fontSize: 16,

      fontWeight: '700',

      color: '#687386',
    },

    // 비교

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

      fontWeight: '800',

      color: '#172033',
    },

    afterAmount: {
      marginTop: 6,

      fontSize: 18,

      fontWeight: '800',

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
      fontWeight: '800',

      color: '#172033',
    },

    // 상태

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

      fontWeight: '800',

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

      fontWeight: '800',

      color: '#172033',
    },
  });