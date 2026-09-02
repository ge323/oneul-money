import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Calendar,
  DateData,
  LocaleConfig,
} from 'react-native-calendars';

const PLANNED_EXPENSES_KEY = 'planned-expenses';
const EXPENSES_KEY = 'expenses';
const BUDGET_KEY = 'budget-settings';

/* =========================
   달력 한국어 설정
========================= */

LocaleConfig.locales.ko = {
  monthNames: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],

  monthNamesShort: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],

  dayNames: [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
  ],

  dayNamesShort: [
    '일',
    '월',
    '화',
    '수',
    '목',
    '금',
    '토',
  ],

  today: '오늘',
};

LocaleConfig.defaultLocale = 'ko';

/* =========================
   Types
========================= */

type PlannedExpense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  createdAt: string;
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
};

type BudgetSettings = {
  monthlyBudget?: number;
  fixedExpense?: number;
  savingGoal?: number;
  spentAmount?: number;
  payday?: number;
  paydayType?: 'date' | 'lastDay';
};

export default function PlanScreen() {
  const [
    plannedExpenses,
    setPlannedExpenses,
  ] = useState<PlannedExpense[]>([]);

  const [
    showPlanModal,
    setShowPlanModal,
  ] = useState(false);

  const [
    showCompleteModal,
    setShowCompleteModal,
  ] = useState(false);

  const [
    showCalendar,
    setShowCalendar,
  ] = useState(false);

  const [
    editingExpense,
    setEditingExpense,
  ] =
    useState<PlannedExpense | null>(
      null
    );

  const [
    completingExpense,
    setCompletingExpense,
  ] =
    useState<PlannedExpense | null>(
      null
    );

  const [
    openedMenuId,
    setOpenedMenuId,
  ] =
    useState<string | null>(
      null
    );

  const [title, setTitle] =
    useState('');

  const [amount, setAmount] =
    useState('');

  const [date, setDate] =
    useState('');

  const [
    actualAmount,
    setActualAmount,
  ] = useState('');

  const planSlideAnim =
    useRef(
      new Animated.Value(500)
    ).current;

  const planBackdropOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  const completeSlideAnim =
    useRef(
      new Animated.Value(500)
    ).current;

  const completeBackdropOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  useFocusEffect(
    useCallback(() => {
      loadPlannedExpenses();

      setOpenedMenuId(
        null
      );
    }, [])
  );

  const loadPlannedExpenses =
    async () => {
      try {
        const saved =
          await AsyncStorage.getItem(
            PLANNED_EXPENSES_KEY
          );

        setPlannedExpenses(
          saved
            ? JSON.parse(saved)
            : []
        );
      } catch (error) {
        console.error(
          '예정 지출 불러오기 실패:',
          error
        );
      }
    };

  const formatMoney = (
    value: number
  ) => {
    return value.toLocaleString(
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

  /* =========================
     날짜
  ========================= */

  const toDateString = (
    value: Date
  ) => {
    const year =
      value.getFullYear();

    const month =
      String(
        value.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const day =
      String(
        value.getDate()
      ).padStart(
        2,
        '0'
      );

    return `${year}-${month}-${day}`;
  };

  const getTodayString = () => {
    return toDateString(
      new Date()
    );
  };

  // UTC(toISOString)로 저장하면 한국 시간 새벽에 날짜가 하루 전으로
  // 보일 수 있어서, 지출 기록 시각은 기기 로컬 시간 기준 문자열로 저장합니다.
  const toLocalDateTimeString = (
    value: Date
  ) => {
    const year = value.getFullYear();
    const month = String(
      value.getMonth() + 1
    ).padStart(2, '0');
    const day = String(
      value.getDate()
    ).padStart(2, '0');
    const hours = String(
      value.getHours()
    ).padStart(2, '0');
    const minutes = String(
      value.getMinutes()
    ).padStart(2, '0');
    const seconds = String(
      value.getSeconds()
    ).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (
    value: string
  ) => {
    const targetDate =
      new Date(
        `${value}T00:00:00`
      );

    return `${targetDate.getMonth() + 1
      }월 ${targetDate.getDate()}일`;
  };

  const formatDisplayDate = (
    value: string
  ) => {
    if (!value) {
      return '날짜를 선택해주세요';
    }

    const targetDate =
      new Date(
        `${value}T00:00:00`
      );

    const weekdays = [
      '일',
      '월',
      '화',
      '수',
      '목',
      '금',
      '토',
    ];

    return `${targetDate.getFullYear()
      }년 ${targetDate.getMonth() + 1
      }월 ${targetDate.getDate()
      }일 ${weekdays[
      targetDate.getDay()
      ]
      }요일`;
  };

  const selectToday = () => {
    setDate(
      getTodayString()
    );
  };

  const selectTomorrow = () => {
    const tomorrow =
      new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    setDate(
      toDateString(
        tomorrow
      )
    );
  };

  const selectWeekend = () => {
    const target =
      new Date();

    const currentDay =
      target.getDay();

    let daysToSaturday =
      6 - currentDay;

    if (
      currentDay === 0
    ) {
      daysToSaturday = 6;
    }

    if (
      currentDay === 6
    ) {
      daysToSaturday = 0;
    }

    target.setDate(
      target.getDate() +
      daysToSaturday
    );

    setDate(
      toDateString(
        target
      )
    );
  };

  const openCalendar = () => {
    setShowCalendar(
      true
    );
  };

  const closeCalendar = () => {
    setShowCalendar(
      false
    );
  };

  const selectCalendarDate = (
    day: DateData
  ) => {
    setDate(
      day.dateString
    );

    setShowCalendar(
      false
    );
  };

  /* =========================
     예정 지출 추가
  ========================= */

  const openAddModal = () => {
    setOpenedMenuId(
      null
    );

    setEditingExpense(
      null
    );

    setTitle('');
    setAmount('');

    setDate(
      getTodayString()
    );

    planSlideAnim.setValue(
      500
    );

    planBackdropOpacity.setValue(
      0
    );

    setShowPlanModal(
      true
    );

    requestAnimationFrame(
      () => {
        Animated.parallel([
          Animated.timing(
            planSlideAnim,
            {
              toValue: 0,
              duration: 250,
              useNativeDriver:
                true,
            }
          ),

          Animated.timing(
            planBackdropOpacity,
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

  /* =========================
     예정 지출 수정
  ========================= */

  const openEditModal = (
    expense: PlannedExpense
  ) => {
    setOpenedMenuId(
      null
    );

    setEditingExpense(
      expense
    );

    setTitle(
      expense.title
    );

    setAmount(
      formatMoney(
        expense.amount
      )
    );

    setDate(
      expense.date
    );

    planSlideAnim.setValue(
      500
    );

    planBackdropOpacity.setValue(
      0
    );

    setShowPlanModal(
      true
    );

    requestAnimationFrame(
      () => {
        Animated.parallel([
          Animated.timing(
            planSlideAnim,
            {
              toValue: 0,
              duration: 250,
              useNativeDriver:
                true,
            }
          ),

          Animated.timing(
            planBackdropOpacity,
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

  const closePlanModal =
    () => {
      Animated.parallel([
        Animated.timing(
          planSlideAnim,
          {
            toValue: 500,
            duration: 200,
            useNativeDriver:
              true,
          }
        ),

        Animated.timing(
          planBackdropOpacity,
          {
            toValue: 0,
            duration: 100,
            useNativeDriver:
              true,
          }
        ),
      ]).start(() => {
        setShowPlanModal(
          false
        );

        setShowCalendar(
          false
        );

        setEditingExpense(
          null
        );

        setTitle('');
        setAmount('');
        setDate('');
      });
    };

  /* =========================
     예정 지출 저장
  ========================= */

  const savePlannedExpense =
    async () => {
      const numericAmount =
        parseMoney(amount);

      if (
        !title.trim() ||
        numericAmount <= 0 ||
        !date
      ) {
        return;
      }

      try {
        let updated:
          PlannedExpense[];

        if (
          editingExpense
        ) {
          updated =
            plannedExpenses.map(
              (item) => {
                if (
                  item.id !==
                  editingExpense.id
                ) {
                  return item;
                }

                return {
                  ...item,

                  title:
                    title.trim(),

                  amount:
                    numericAmount,

                  date,
                };
              }
            );
        } else {
          const newExpense:
            PlannedExpense = {
            id:
              Date.now().toString(),

            title:
              title.trim(),

            amount:
              numericAmount,

            date,

            createdAt:
              toLocalDateTimeString(new Date()),
          };

          updated = [
            ...plannedExpenses,
            newExpense,
          ];
        }

        updated.sort(
          (a, b) =>
            new Date(
              `${a.date}T00:00:00`
            ).getTime() -
            new Date(
              `${b.date}T00:00:00`
            ).getTime()
        );

        await AsyncStorage.setItem(
          PLANNED_EXPENSES_KEY,
          JSON.stringify(
            updated
          )
        );

        setPlannedExpenses(
          updated
        );

        closePlanModal();
      } catch (error) {
        console.error(
          editingExpense
            ? '예정 지출 수정 실패:'
            : '예정 지출 저장 실패:',
          error
        );
      }
    };

  /* =========================
     삭제
  ========================= */

  const deleteExpense =
    async (
      id: string
    ) => {
      const updated =
        plannedExpenses.filter(
          (item) =>
            item.id !== id
        );

      try {
        await AsyncStorage.setItem(
          PLANNED_EXPENSES_KEY,
          JSON.stringify(
            updated
          )
        );

        setPlannedExpenses(
          updated
        );

        setOpenedMenuId(
          null
        );
      } catch (error) {
        console.error(
          '예정 지출 삭제 실패:',
          error
        );
      }
    };

  const confirmDelete = (
    expense: PlannedExpense
  ) => {
    setOpenedMenuId(
      null
    );

    if (
      Platform.OS === 'web'
    ) {
      const confirmed =
        window.confirm(
          `${expense.title} 예정 지출을 삭제할까요?`
        );

      if (confirmed) {
        deleteExpense(
          expense.id
        );
      }

      return;
    }

    Alert.alert(
      '예정 지출 삭제',

      `${expense.title}을 삭제할까요?`,

      [
        {
          text: '취소',
          style: 'cancel',
        },

        {
          text: '삭제',
          style:
            'destructive',

          onPress: () =>
            deleteExpense(
              expense.id
            ),
        },
      ]
    );
  };

  /* =========================
     실제 지출 완료
  ========================= */

  const openCompleteModal = (
    expense: PlannedExpense
  ) => {
    setOpenedMenuId(
      null
    );

    setCompletingExpense(
      expense
    );

    setActualAmount(
      formatMoney(
        expense.amount
      )
    );

    completeSlideAnim.setValue(
      500
    );

    completeBackdropOpacity.setValue(
      0
    );

    setShowCompleteModal(
      true
    );

    requestAnimationFrame(
      () => {
        Animated.parallel([
          Animated.timing(
            completeSlideAnim,
            {
              toValue: 0,
              duration: 250,
              useNativeDriver:
                true,
            }
          ),

          Animated.timing(
            completeBackdropOpacity,
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

  const closeCompleteModal =
    () => {
      Animated.parallel([
        Animated.timing(
          completeSlideAnim,
          {
            toValue: 500,
            duration: 200,
            useNativeDriver:
              true,
          }
        ),

        Animated.timing(
          completeBackdropOpacity,
          {
            toValue: 0,
            duration: 100,
            useNativeDriver:
              true,
          }
        ),
      ]).start(() => {
        setShowCompleteModal(
          false
        );

        setCompletingExpense(
          null
        );

        setActualAmount('');
      });
    };

  const completePlannedExpense =
    async () => {
      if (
        !completingExpense
      ) {
        return;
      }

      const numericActualAmount =
        parseMoney(
          actualAmount
        );

      if (
        numericActualAmount <= 0
      ) {
        return;
      }

      try {
        const savedExpenses =
          await AsyncStorage.getItem(
            EXPENSES_KEY
          );

        const expenses:
          Expense[] =
          savedExpenses
            ? JSON.parse(
              savedExpenses
            )
            : [];

        const newExpense:
          Expense = {
          id:
            Date.now().toString(),

          title:
            completingExpense.title,

          amount:
            numericActualAmount,

          category:
            'etc',

          createdAt:
            toLocalDateTimeString(new Date()),
        };

        const updatedExpenses = [
          newExpense,
          ...expenses,
        ];

        await AsyncStorage.setItem(
          EXPENSES_KEY,
          JSON.stringify(
            updatedExpenses
          )
        );

        const savedBudget =
          await AsyncStorage.getItem(
            BUDGET_KEY
          );

        if (savedBudget) {
          const budget:
            BudgetSettings =
            JSON.parse(
              savedBudget
            );

          const updatedBudget = {
            ...budget,

            spentAmount:
              (Number(
                budget.spentAmount
              ) || 0) +
              numericActualAmount,
          };

          await AsyncStorage.setItem(
            BUDGET_KEY,
            JSON.stringify(
              updatedBudget
            )
          );
        }

        const updatedPlanned =
          plannedExpenses.filter(
            (item) =>
              item.id !==
              completingExpense.id
          );

        await AsyncStorage.setItem(
          PLANNED_EXPENSES_KEY,
          JSON.stringify(
            updatedPlanned
          )
        );

        setPlannedExpenses(
          updatedPlanned
        );

        closeCompleteModal();
      } catch (error) {
        console.error(
          '예정 지출 완료 처리 실패:',
          error
        );
      }
    };

  /* =========================
     데이터 계산
  ========================= */

  const upcomingExpenses =
    useMemo(() => {
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      return plannedExpenses
        .filter(
          (item) => {
            const expenseDate =
              new Date(
                `${item.date}T00:00:00`
              );

            return (
              expenseDate >=
              today
            );
          }
        )
        .sort(
          (a, b) =>
            new Date(
              `${a.date}T00:00:00`
            ).getTime() -
            new Date(
              `${b.date}T00:00:00`
            ).getTime()
        );
    }, [
      plannedExpenses,
    ]);

  const totalPlanned =
    upcomingExpenses.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );

  const actualNumericAmount =
    parseMoney(
      actualAmount
    );

  const amountDifference =
    completingExpense
      ? actualNumericAmount -
      completingExpense.amount
      : 0;

  return (
    <>
      <ScrollView
        style={
          styles.screen
        }
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text
          style={styles.title}
        >
          소비 계획
        </Text>

        <Text
          style={
            styles.description
          }
        >
          앞으로 쓸 돈을 미리 빼두고 생활비를 관리해보세요.
        </Text>

        <View
          style={
            styles.summaryCard
          }
        >
          <Text
            style={
              styles.summaryLabel
            }
          >
            예정된 지출
          </Text>

          <Text
            style={
              styles.summaryAmount
            }
          >
            {formatMoney(
              totalPlanned
            )}
            원
          </Text>

          <Text
            style={
              styles.summaryDescription
            }
          >
            앞으로 예정된{' '}
            {
              upcomingExpenses.length
            }
            건을 생활비에 미리 반영해요.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,

            pressed &&
            styles.addButtonPressed,
          ]}
          onPress={
            openAddModal
          }
        >
          <Ionicons
            name="add"
            size={20}
            color="#3563C9"
          />

          <Text
            style={
              styles.addButtonText
            }
          >
            예정 지출 추가
          </Text>
        </Pressable>

        <View
          style={styles.list}
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            앞으로 쓸 돈
          </Text>

          {upcomingExpenses.length ===
            0 ? (
            <View
              style={
                styles.empty
              }
            >
              <View
                style={
                  styles.emptyIconBox
                }
              >
                <Ionicons
                  name="calendar-outline"
                  size={30}
                  color="#98A2B3"
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                예정된 지출이 없어요
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                약속이나 병원, 미용실처럼 앞으로 쓸 돈을 미리 등록해보세요.
              </Text>
            </View>
          ) : (
            upcomingExpenses.map(
              (expense) => {
                const isMenuOpen =
                  openedMenuId ===
                  expense.id;

                return (
                  <View
                    key={
                      expense.id
                    }
                    style={[
                      styles.expenseCard,

                      isMenuOpen &&
                      styles.expenseCardOpen,
                    ]}
                  >
                    <View
                      style={
                        styles.expenseTop
                      }
                    >
                      <View
                        style={
                          styles.expenseIcon
                        }
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#5F6F86"
                        />
                      </View>

                      <View
                        style={
                          styles.expenseInfo
                        }
                      >
                        <Text
                          style={
                            styles.expenseTitle
                          }
                        >
                          {
                            expense.title
                          }
                        </Text>

                        <Text
                          style={
                            styles.expenseDate
                          }
                        >
                          {formatDate(
                            expense.date
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.expenseAmount
                        }
                      >
                        {formatMoney(
                          expense.amount
                        )}
                        원
                      </Text>

                      <Pressable
                        style={
                          styles.menuButton
                        }
                        onPress={() =>
                          setOpenedMenuId(
                            isMenuOpen
                              ? null
                              : expense.id
                          )
                        }
                        hitSlop={10}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={20}
                          color="#687386"
                        />
                      </Pressable>
                    </View>

                    {/* 메뉴 */}

                    {isMenuOpen && (
                      <View
                        style={
                          styles.menu
                        }
                      >
                        <Pressable
                          style={
                            styles.menuItem
                          }
                          onPress={() =>
                            openCompleteModal(
                              expense
                            )
                          }
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color="#3563C9"
                          />

                          <Text
                            style={
                              styles.completeMenuText
                            }
                          >
                            지출 완료
                          </Text>
                        </Pressable>

                        <View
                          style={
                            styles.menuDivider
                          }
                        />

                        <Pressable
                          style={
                            styles.menuItem
                          }
                          onPress={() =>
                            openEditModal(
                              expense
                            )
                          }
                        >
                          <Ionicons
                            name="pencil-outline"
                            size={18}
                            color="#172033"
                          />

                          <Text
                            style={
                              styles.menuText
                            }
                          >
                            수정하기
                          </Text>
                        </Pressable>

                        <View
                          style={
                            styles.menuDivider
                          }
                        />

                        <Pressable
                          style={
                            styles.menuItem
                          }
                          onPress={() =>
                            confirmDelete(
                              expense
                            )
                          }
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#D84B4B"
                          />

                          <Text
                            style={
                              styles.deleteText
                            }
                          >
                            삭제하기
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              }
            )
          )}
        </View>
      </ScrollView>

      {/* 예정 지출 추가/수정 */}

      <Modal
        visible={
          showPlanModal
        }
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={
          closePlanModal
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
                  planBackdropOpacity,
              },
            ]}
          >
            <Pressable
              style={
                styles.backdropPressArea
              }
              onPress={
                closePlanModal
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
                      planSlideAnim,
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
                  {editingExpense
                    ? '예정 지출 수정'
                    : '예정 지출 추가'}
                </Text>

                <Text
                  style={
                    styles.sheetDescription
                  }
                >
                  앞으로 사용할 돈을 미리 등록해주세요.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={
                  closePlanModal
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#687386"
                />
              </Pressable>
            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              어디에 쓸 예정인가요?
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={title}
              onChangeText={
                setTitle
              }
              placeholder="예: 주말 데이트"
            />

            <Text
              style={[
                styles.inputLabel,
                styles.inputTopMargin,
              ]}
            >
              예상 금액
            </Text>

            <View
              style={
                styles.amountInputBox
              }
            >
              <TextInput
                style={
                  styles.amountInput
                }
                value={amount}
                onChangeText={(
                  text
                ) =>
                  setAmount(
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
                  styles.unit
                }
              >
                원
              </Text>
            </View>

            <Text
              style={[
                styles.inputLabel,
                styles.inputTopMargin,
              ]}
            >
              언제 사용할 예정인가요?
            </Text>

            <Pressable
              style={
                styles.dateSelectButton
              }
              onPress={
                openCalendar
              }
            >
              <View
                style={
                  styles.dateSelectLeft
                }
              >
                <View
                  style={
                    styles.dateIconBox
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color="#3563C9"
                  />
                </View>

                <Text
                  style={
                    styles.dateSelectText
                  }
                >
                  {formatDisplayDate(
                    date
                  )}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#98A2B3"
              />
            </Pressable>

            <View
              style={
                styles.quickDateRow
              }
            >
              <Pressable
                style={
                  styles.quickDateButton
                }
                onPress={
                  selectToday
                }
              >
                <Text
                  style={
                    styles.quickDateText
                  }
                >
                  오늘
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.quickDateButton
                }
                onPress={
                  selectTomorrow
                }
              >
                <Text
                  style={
                    styles.quickDateText
                  }
                >
                  내일
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.quickDateButton
                }
                onPress={
                  selectWeekend
                }
              >
                <Text
                  style={
                    styles.quickDateText
                  }
                >
                  이번 주말
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={
                styles.saveButton
              }
              onPress={
                savePlannedExpense
              }
            >
              <Text
                style={
                  styles.saveButtonText
                }
              >
                {editingExpense
                  ? '수정하기'
                  : '추가하기'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* 실제 지출 */}

      <Modal
        visible={
          showCompleteModal
        }
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={
          closeCompleteModal
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
                  completeBackdropOpacity,
              },
            ]}
          >
            <Pressable
              style={
                styles.backdropPressArea
              }
              onPress={
                closeCompleteModal
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
                      completeSlideAnim,
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
                  실제 지출 기록
                </Text>

                <Text
                  style={
                    styles.sheetDescription
                  }
                >
                  실제로 사용한 금액을 확인해주세요.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={
                  closeCompleteModal
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#687386"
                />
              </Pressable>
            </View>

            {completingExpense && (
              <>
                <View
                  style={
                    styles.completeSummary
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.completeTitle
                      }
                    >
                      {
                        completingExpense.title
                      }
                    </Text>

                    <Text
                      style={
                        styles.completeDate
                      }
                    >
                      {formatDate(
                        completingExpense.date
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.expectedArea
                    }
                  >
                    <Text
                      style={
                        styles.expectedLabel
                      }
                    >
                      예상
                    </Text>

                    <Text
                      style={
                        styles.expectedAmount
                      }
                    >
                      {formatMoney(
                        completingExpense.amount
                      )}
                      원
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    styles.actualAmountLabel,
                  ]}
                >
                  실제 사용 금액
                </Text>

                <View
                  style={
                    styles.actualAmountBox
                  }
                >
                  <TextInput
                    style={
                      styles.actualAmountInput
                    }
                    value={
                      actualAmount
                    }
                    onChangeText={(
                      text
                    ) =>
                      setActualAmount(
                        formatMoneyInput(
                          text
                        )
                      )
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />

                  <Text
                    style={
                      styles.unit
                    }
                  >
                    원
                  </Text>
                </View>

                {actualNumericAmount >
                  0 && (
                    <View
                      style={
                        styles.differenceBox
                      }
                    >
                      {amountDifference ===
                        0 ? (
                        <>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color="#3563C9"
                          />

                          <Text
                            style={
                              styles.sameAmountText
                            }
                          >
                            예상한 금액과 같아요.
                          </Text>
                        </>
                      ) : amountDifference >
                        0 ? (
                        <>
                          <Ionicons
                            name="arrow-up-outline"
                            size={18}
                            color="#C56A43"
                          />

                          <Text
                            style={
                              styles.moreAmountText
                            }
                          >
                            예상보다{' '}
                            <Text
                              style={
                                styles.differenceStrong
                              }
                            >
                              {formatMoney(
                                amountDifference
                              )}
                              원
                            </Text>{' '}
                            더 사용했어요.
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name="arrow-down-outline"
                            size={18}
                            color="#2F7D5A"
                          />

                          <Text
                            style={
                              styles.lessAmountText
                            }
                          >
                            예상보다{' '}
                            <Text
                              style={
                                styles.differenceStrong
                              }
                            >
                              {formatMoney(
                                Math.abs(
                                  amountDifference
                                )
                              )}
                              원
                            </Text>{' '}
                            덜 사용했어요.
                          </Text>
                        </>
                      )}
                    </View>
                  )}

                <Text
                  style={
                    styles.completeGuide
                  }
                >
                  완료하면 예정 지출에서는 사라지고 실제 지출 내역에 기록돼요.
                </Text>

                <Pressable
                  style={
                    styles.saveButton
                  }
                  onPress={
                    completePlannedExpense
                  }
                >
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    지출로 기록하기
                  </Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* 달력 */}

      <Modal
        visible={
          showCalendar
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeCalendar
        }
      >
        <View
          style={
            styles.calendarModalRoot
          }
        >
          <Pressable
            style={
              styles.calendarBackdrop
            }
            onPress={
              closeCalendar
            }
          />

          <View
            style={
              styles.calendarCard
            }
          >
            <View
              style={
                styles.calendarHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.calendarTitle
                  }
                >
                  날짜 선택
                </Text>

                <Text
                  style={
                    styles.calendarDescription
                  }
                >
                  예정 지출 날짜를 선택해주세요.
                </Text>
              </View>

              <Pressable
                style={
                  styles.calendarCloseButton
                }
                onPress={
                  closeCalendar
                }
              >
                <Ionicons
                  name="close"
                  size={21}
                  color="#687386"
                />
              </Pressable>
            </View>

            <Calendar
              current={
                date ||
                getTodayString()
              }
              minDate={
                getTodayString()
              }
              onDayPress={
                selectCalendarDate
              }
              enableSwipeMonths
              markedDates={
                date
                  ? {
                    [date]: {
                      selected:
                        true,

                      selectedColor:
                        '#3563C9',

                      selectedTextColor:
                        '#FFFFFF',
                    },
                  }
                  : {}
              }
              theme={{
                calendarBackground:
                  '#FFFFFF',

                selectedDayBackgroundColor:
                  '#3563C9',

                selectedDayTextColor:
                  '#FFFFFF',

                todayTextColor:
                  '#3563C9',

                dayTextColor:
                  '#172033',

                textDisabledColor:
                  '#D5DAE2',

                arrowColor:
                  '#3563C9',

                monthTextColor:
                  '#172033',

                textMonthFontWeight:
                  '700',

                textDayFontWeight:
                  '500',

                textDayHeaderFontWeight:
                  '600',

                textMonthFontSize:
                  17,

                textDayFontSize:
                  14,

                textDayHeaderFontSize:
                  12,
              }}
            />

            <View
              style={
                styles.selectedDateBox
              }
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#3563C9"
              />

              <Text
                style={
                  styles.selectedDateText
                }
              >
                {formatDisplayDate(
                  date
                )}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
    },

    container: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 120,
    },

    title: {
      fontSize: 28,
      fontFamily: 'Pretendard-ExtraBold',
      color: '#172033',
    },

    description: {
      marginTop: 8,
      fontSize: 15,
      lineHeight: 21,
      color: '#8792A2',
    },

    summaryCard: {
      marginTop: 28,

      backgroundColor:
        '#F1F5FC',

      borderRadius: 22,

      padding: 20,
    },

    summaryLabel: {
      fontSize: 14,

      color: '#687386',
    },

    summaryAmount: {
      marginTop: 7,

      fontSize: 30,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    summaryDescription: {
      marginTop: 7,

      fontSize: 12,

      color: '#8792A2',
    },

    addButton: {
      marginTop: 14,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 5,

      backgroundColor:
        '#F8FAFC',

      borderRadius: 16,

      paddingVertical: 15,

      borderWidth: 1,

      borderColor:
        '#E4E9F0',
    },

    addButtonPressed: {
      backgroundColor:
        '#F1F5FC',
    },

    addButtonText: {
      fontSize: 15,

      fontFamily: 'Pretendard-Bold',

      color: '#3563C9',
    },

    list: {
      marginTop: 32,
    },

    sectionTitle: {
      fontSize: 18,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',

      marginBottom: 14,
    },

    expenseCard: {
      position: 'relative',

      minHeight: 74,

      justifyContent:
        'center',

      borderBottomWidth: 1,

      borderBottomColor:
        '#EEF1F5',

      zIndex: 1,
    },

    expenseCardOpen: {
      zIndex: 100,
    },

    expenseTop: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    expenseIcon: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        '#F5F7FA',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    expenseInfo: {
      flex: 1,

      marginLeft: 12,
    },

    expenseTitle: {
      fontSize: 15,

      fontFamily: 'Pretendard-Bold',

      color: '#172033',
    },

    expenseDate: {
      marginTop: 4,

      fontSize: 12,

      color: '#8792A2',
    },

    expenseAmount: {
      fontSize: 15,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    menuButton: {
      width: 34,
      height: 34,

      marginLeft: 3,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    /* 메뉴 */

    menu: {
      position: 'absolute',

      top: 55,
      right: 0,

      width: 150,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 14,

      paddingVertical: 6,

      zIndex: 200,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.12,

      shadowRadius: 10,

      elevation: 8,
    },

    menuItem: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,

      paddingHorizontal: 14,

      paddingVertical: 12,
    },

    menuDivider: {
      height: 1,

      backgroundColor:
        '#EEF1F5',
    },

    completeMenuText: {
      fontSize: 14,

      fontFamily: 'Pretendard-Bold',

      color: '#3563C9',
    },

    menuText: {
      fontSize: 14,

      fontFamily: 'Pretendard-SemiBold',

      color: '#172033',
    },

    deleteText: {
      fontSize: 14,

      fontFamily: 'Pretendard-SemiBold',

      color: '#D84B4B',
    },

    /* 빈 화면 */

    empty: {
      alignItems: 'center',

      paddingVertical: 60,
    },

    emptyIconBox: {
      width: 58,

      height: 58,

      borderRadius: 18,

      backgroundColor:
        '#F5F7FA',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    emptyTitle: {
      marginTop: 14,

      fontSize: 16,

      fontFamily: 'Pretendard-Bold',

      color: '#172033',
    },

    emptyDescription: {
      marginTop: 7,

      fontSize: 13,

      lineHeight: 20,

      color: '#8792A2',

      textAlign: 'center',
    },

    /* Modal */

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

      marginBottom: 25,
    },

    sheetTitleArea: {
      flex: 1,

      paddingRight: 12,
    },

    sheetTitle: {
      fontSize: 22,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    sheetDescription: {
      marginTop: 6,

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

    inputLabel: {
      fontSize: 14,

      fontFamily: 'Pretendard-Bold',

      color: '#172033',

      marginBottom: 8,
    },

    inputTopMargin: {
      marginTop: 20,
    },

    input: {
      backgroundColor:
        '#F5F7FA',

      borderRadius: 15,

      paddingHorizontal: 16,

      paddingVertical: 15,

      fontSize: 15,

      color: '#172033',
    },

    amountInputBox: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        '#F5F7FA',

      borderRadius: 15,

      paddingHorizontal: 16,
    },

    amountInput: {
      flex: 1,

      paddingVertical: 15,

      fontSize: 20,

      fontFamily: 'Pretendard-Bold',

      color: '#3563C9',
    },

    unit: {
      fontSize: 14,

      fontFamily: 'Pretendard-SemiBold',

      color: '#687386',
    },

    saveButton: {
      marginTop: 26,

      backgroundColor:
        '#3563C9',

      borderRadius: 16,

      paddingVertical: 17,

      alignItems: 'center',
    },

    saveButtonText: {
      color: '#FFFFFF',

      fontSize: 16,

      fontFamily: 'Pretendard-Bold',
    },

    /* 날짜 */

    dateSelectButton: {
      minHeight: 58,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      backgroundColor:
        '#F5F7FA',

      borderRadius: 15,

      paddingHorizontal: 13,

      borderWidth: 1,

      borderColor:
        '#EEF1F5',
    },

    dateSelectLeft: {
      flex: 1,

      flexDirection: 'row',

      alignItems: 'center',
    },

    dateIconBox: {
      width: 38,

      height: 38,

      borderRadius: 12,

      backgroundColor:
        '#EAF0FB',

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 11,
    },

    dateSelectText: {
      flex: 1,

      fontSize: 14,

      fontFamily: 'Pretendard-SemiBold',

      color: '#172033',
    },

    quickDateRow: {
      flexDirection: 'row',

      gap: 8,

      marginTop: 10,
    },

    quickDateButton: {
      backgroundColor:
        '#F5F7FA',

      borderRadius: 999,

      paddingHorizontal: 14,

      paddingVertical: 9,

      borderWidth: 1,

      borderColor:
        '#EEF1F5',
    },

    quickDateText: {
      fontSize: 12,

      fontFamily: 'Pretendard-SemiBold',

      color: '#687386',
    },

    /* 달력 */

    calendarModalRoot: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      paddingHorizontal: 20,
    },

    calendarBackdrop: {
      position: 'absolute',

      top: 0,
      bottom: 0,
      left: 0,
      right: 0,

      backgroundColor:
        'rgba(23, 32, 51, 0.42)',
    },

    calendarCard: {
      width: '100%',

      maxWidth: 430,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 24,

      paddingHorizontal: 18,

      paddingTop: 20,

      paddingBottom: 18,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 8,
      },

      shadowOpacity: 0.16,

      shadowRadius: 24,

      elevation: 14,
    },

    calendarHeader: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',

      marginBottom: 10,
    },

    calendarTitle: {
      fontSize: 20,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#172033',
    },

    calendarDescription: {
      marginTop: 5,

      fontSize: 12,

      color: '#8792A2',
    },

    calendarCloseButton: {
      width: 36,

      height: 36,

      borderRadius: 18,

      backgroundColor:
        '#F5F7FA',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    selectedDateBox: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 7,

      marginTop: 8,

      backgroundColor:
        '#F1F5FC',

      borderRadius: 14,

      paddingVertical: 12,

      paddingHorizontal: 12,
    },

    selectedDateText: {
      fontSize: 14,

      fontFamily: 'Pretendard-Bold',

      color: '#3563C9',
    },

    /* 실제 지출 */

    completeSummary: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      backgroundColor:
        '#F8FAFC',

      borderRadius: 16,

      padding: 16,
    },

    completeTitle: {
      fontSize: 16,

      fontFamily: 'Pretendard-Bold',

      color: '#172033',
    },

    completeDate: {
      marginTop: 5,

      fontSize: 12,

      color: '#8792A2',
    },

    expectedArea: {
      alignItems:
        'flex-end',

      marginLeft: 15,
    },

    expectedLabel: {
      fontSize: 11,

      color: '#98A2B3',
    },

    expectedAmount: {
      marginTop: 4,

      fontSize: 15,

      fontFamily: 'Pretendard-Bold',

      color: '#687386',
    },

    actualAmountLabel: {
      marginTop: 24,
    },

    actualAmountBox: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        '#F1F5FC',

      borderRadius: 16,

      paddingHorizontal: 18,
    },

    actualAmountInput: {
      flex: 1,

      paddingVertical: 17,

      fontSize: 24,

      fontFamily: 'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    differenceBox: {
      flexDirection: 'row',

      alignItems: 'center',

      marginTop: 14,

      paddingHorizontal: 2,

      gap: 6,
    },

    sameAmountText: {
      fontSize: 13,

      color: '#687386',
    },

    moreAmountText: {
      fontSize: 13,

      color: '#C56A43',
    },

    lessAmountText: {
      fontSize: 13,

      color: '#2F7D5A',
    },

    differenceStrong: {
      fontFamily: 'Pretendard-ExtraBold',
    },

    completeGuide: {
      marginTop: 20,

      fontSize: 12,

      lineHeight: 18,

      color: '#98A2B3',
    },
  });