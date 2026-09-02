import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const EXPENSES_KEY = 'expenses';
const BUDGET_KEY = 'budget-settings';
const CUSTOM_CATEGORIES_KEY = 'custom-categories';

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
  spentAmount: number;
  payday?: number;
  paydayType?: 'date' | 'lastDay';
};

type CustomCategory = {
  id: string;
  label: string;
  emoji: string;
  custom?: boolean;
};

type ExpenseGroup = {
  dateKey: string;
  date: Date;
  expenses: Expense[];
};

const DEFAULT_CATEGORY_EMOJI: Record<string, string> = {
  food: '🍚',
  cafe: '☕',
  transport: '🚇',
  shopping: '🛍️',
  leisure: '🎮',
  life: '🏠',
  etc: '📦',
};

export default function HistoryScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [customCategories, setCustomCategories] =
    useState<CustomCategory[]>([]);

  const [openedMenuId, setOpenedMenuId] =
    useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] =
    useState(() => {
      const today = new Date();

      return new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
    });

  useFocusEffect(
    useCallback(() => {
      loadData();

      setOpenedMenuId(null);
    }, [])
  );

  const loadData = async () => {
    try {
      const [
        savedExpenses,
        savedCustomCategories,
      ] = await Promise.all([
        AsyncStorage.getItem(
          EXPENSES_KEY
        ),

        AsyncStorage.getItem(
          CUSTOM_CATEGORIES_KEY
        ),
      ]);

      setExpenses(
        savedExpenses
          ? JSON.parse(savedExpenses)
          : []
      );

      setCustomCategories(
        savedCustomCategories
          ? JSON.parse(
              savedCustomCategories
            )
          : []
      );
    } catch (error) {
      console.error(
        '지출 내역 불러오기 실패:',
        error
      );
    }
  };

  const formatMoney = (
    amount: number
  ) => {
    return amount.toLocaleString(
      'ko-KR'
    );
  };

  const movePreviousMonth = () => {
    setSelectedMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );

    setOpenedMenuId(null);
  };

  const moveNextMonth = () => {
    setSelectedMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );

    setOpenedMenuId(null);
  };

  const goCurrentMonth = () => {
    const today = new Date();

    setSelectedMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setOpenedMenuId(null);
  };

  const selectedYear =
    selectedMonth.getFullYear();

  const selectedMonthIndex =
    selectedMonth.getMonth();

  const monthExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const date = new Date(
          expense.createdAt
        );

        return (
          date.getFullYear() ===
            selectedYear &&
          date.getMonth() ===
            selectedMonthIndex
        );
      })
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );
  }, [
    expenses,
    selectedYear,
    selectedMonthIndex,
  ]);

  const totalExpense = useMemo(() => {
    return monthExpenses.reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    );
  }, [monthExpenses]);

  const groupedExpenses =
    useMemo<ExpenseGroup[]>(() => {
      const groups =
        new Map<
          string,
          ExpenseGroup
        >();

      monthExpenses.forEach(
        (expense) => {
          const date = new Date(
            expense.createdAt
          );

          const dateKey = [
            date.getFullYear(),
            String(
              date.getMonth() + 1
            ).padStart(2, '0'),
            String(
              date.getDate()
            ).padStart(2, '0'),
          ].join('-');

          const currentGroup =
            groups.get(dateKey);

          if (currentGroup) {
            currentGroup.expenses.push(
              expense
            );
          } else {
            groups.set(dateKey, {
              dateKey,
              date: new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
              ),
              expenses: [expense],
            });
          }
        }
      );

      return Array.from(
        groups.values()
      ).sort(
        (a, b) =>
          b.date.getTime() -
          a.date.getTime()
      );
    }, [monthExpenses]);

  const customCategoryEmoji =
    useMemo(() => {
      const map: Record<
        string,
        string
      > = {};

      customCategories.forEach(
        (item) => {
          map[item.id] =
            item.emoji || '✨';
        }
      );

      return map;
    }, [customCategories]);

  const getCategoryEmoji = (
    category?: string
  ) => {
    if (!category) {
      return '💳';
    }

    return (
      DEFAULT_CATEGORY_EMOJI[
        category
      ] ??
      customCategoryEmoji[
        category
      ] ??
      '💳'
    );
  };

  const getWeekday = (
    date: Date
  ) => {
    const weekdays = [
      '일요일',
      '월요일',
      '화요일',
      '수요일',
      '목요일',
      '금요일',
      '토요일',
    ];

    return weekdays[
      date.getDay()
    ];
  };

  const formatGroupDate = (
    date: Date
  ) => {
    return `${
      date.getMonth() + 1
    }월 ${date.getDate()}일 ${getWeekday(
      date
    )}`;
  };

  const deleteExpense = async (
    expense: Expense
  ) => {
    try {
      const updatedExpenses =
        expenses.filter(
          (item) =>
            item.id !== expense.id
        );

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
        const budget: BudgetSettings =
          JSON.parse(savedBudget);

        const updatedBudget = {
          ...budget,

          spentAmount: Math.max(
            0,

            (Number(
              budget.spentAmount
            ) || 0) -
              expense.amount
          ),
        };

        await AsyncStorage.setItem(
          BUDGET_KEY,
          JSON.stringify(
            updatedBudget
          )
        );
      }

      setExpenses(
        updatedExpenses
      );

      setOpenedMenuId(null);
    } catch (error) {
      console.error(
        '지출 삭제 실패:',
        error
      );
    }
  };

  const confirmDelete = (
    expense: Expense
  ) => {
    if (Platform.OS === 'web') {
      const confirmed =
        window.confirm(
          `${expense.title} 지출 내역을 삭제할까요?\n\n${formatMoney(
            expense.amount
          )}원`
        );

      if (confirmed) {
        deleteExpense(expense);
      }

      return;
    }

    Alert.alert(
      '지출 삭제',
      `${expense.title} 지출 내역을 삭제할까요?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',

          onPress: () =>
            deleteExpense(
              expense
            ),
        },
      ]
    );
  };

  const editExpense = (
    expense: Expense
  ) => {
    setOpenedMenuId(null);

    router.push({
      pathname: '/expense',

      params: {
        id: expense.id,
      },
    });
  };

  const now = new Date();

  const isCurrentMonth =
    now.getFullYear() ===
      selectedYear &&
    now.getMonth() ===
      selectedMonthIndex;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* 상단 */}

      <View style={styles.header}>
        <Text style={styles.title}>
          지출 내역
        </Text>

        <Text
          style={
            styles.description
          }
        >
          월별 소비 내역을 확인해보세요.
        </Text>
      </View>

      {/* 월 선택 */}

      <View
        style={styles.monthSelector}
      >
        <Pressable
          style={
            styles.monthArrowButton
          }
          onPress={
            movePreviousMonth
          }
          hitSlop={10}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color="#172033"
          />
        </Pressable>

        <Pressable
          style={styles.monthCenter}
          onPress={
            goCurrentMonth
          }
        >
          <Text
            style={
              styles.monthTitle
            }
          >
            {selectedYear}년{' '}
            {selectedMonthIndex +
              1}
            월
          </Text>

          {!isCurrentMonth && (
            <Text
              style={
                styles.currentMonthGuide
              }
            >
              누르면 이번 달로 이동
            </Text>
          )}
        </Pressable>

        <Pressable
          style={
            styles.monthArrowButton
          }
          onPress={
            moveNextMonth
          }
          hitSlop={10}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color="#172033"
          />
        </Pressable>
      </View>

      {/* 월 총 지출 */}

      <View style={styles.totalBox}>
        <Text
          style={
            styles.totalLabel
          }
        >
          {selectedMonthIndex + 1}
          월 총 지출
        </Text>

        <Text
          style={
            styles.totalAmount
          }
        >
          {formatMoney(
            totalExpense
          )}
          원
        </Text>

        <Text
          style={
            styles.totalDescription
          }
        >
          총{' '}
          {
            monthExpenses.length
          }
          건의 지출을 기록했어요.
        </Text>
      </View>

      {/* 내역 */}

      <View style={styles.list}>
        {groupedExpenses.length ===
        0 ? (
          <View
            style={styles.empty}
          >
            <Text
              style={
                styles.emptyEmoji
              }
            >
              🧾
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              이 달에는 지출 내역이
              없어요
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              지출을 기록하면 날짜별로
              정리해서 보여드려요.
            </Text>
          </View>
        ) : (
          groupedExpenses.map(
            (group) => {
              const dayTotal =
                group.expenses.reduce(
                  (
                    sum,
                    expense
                  ) =>
                    sum +
                    expense.amount,
                  0
                );

              return (
                <View
                  key={
                    group.dateKey
                  }
                  style={
                    styles.dateGroup
                  }
                >
                  {/* 날짜 */}

                  <View
                    style={
                      styles.dateHeader
                    }
                  >
                    <Text
                      style={
                        styles.dateTitle
                      }
                    >
                      {formatGroupDate(
                        group.date
                      )}
                    </Text>

                    <Text
                      style={
                        styles.dayTotal
                      }
                    >
                      -
                      {formatMoney(
                        dayTotal
                      )}
                      원
                    </Text>
                  </View>

                  {/* 해당 날짜 지출 */}

                  <View
                    style={
                      styles.dayList
                    }
                  >
                    {group.expenses.map(
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
                              styles.expenseWrapper,

                              isMenuOpen &&
                                styles.expenseWrapperOpen,
                            ]}
                          >
                            <View
                              style={
                                styles.expenseItem
                              }
                            >
                              <View
                                style={
                                  styles.leftArea
                                }
                              >
                                <View
                                  style={
                                    styles.categoryIcon
                                  }
                                >
                                  <Text
                                    style={
                                      styles.categoryEmoji
                                    }
                                  >
                                    {getCategoryEmoji(
                                      expense.category
                                    )}
                                  </Text>
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
                                    numberOfLines={
                                      1
                                    }
                                  >
                                    {
                                      expense.title
                                    }
                                  </Text>

                                  <Text
                                    style={
                                      styles.expenseTime
                                    }
                                  >
                                    {new Date(
                                      expense.createdAt
                                    ).toLocaleTimeString(
                                      'ko-KR',
                                      {
                                        hour:
                                          '2-digit',
                                        minute:
                                          '2-digit',
                                      }
                                    )}
                                  </Text>
                                </View>
                              </View>

                              <View
                                style={
                                  styles.rightArea
                                }
                              >
                                <Text
                                  style={
                                    styles.expenseAmount
                                  }
                                >
                                  -
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
                                  hitSlop={
                                    10
                                  }
                                >
                                  <Ionicons
                                    name="ellipsis-vertical"
                                    size={
                                      20
                                    }
                                    color="#687386"
                                  />
                                </Pressable>
                              </View>
                            </View>

                            {/* 수정 / 삭제 메뉴 */}

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
                                    editExpense(
                                      expense
                                    )
                                  }
                                >
                                  <Ionicons
                                    name="pencil-outline"
                                    size={
                                      18
                                    }
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
                                    size={
                                      18
                                    }
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
                    )}
                  </View>
                </View>
              );
            }
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 120,
  },

  header: {
    marginBottom: 26,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#172033',
  },

  description: {
    marginTop: 8,
    fontSize: 15,
    color: '#8792A2',
  },

  // =========================
  // 월 선택
  // =========================

  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    backgroundColor: '#F8FAFC',

    borderRadius: 18,

    paddingHorizontal: 10,
    paddingVertical: 10,

    marginBottom: 14,
  },

  monthArrowButton: {
    width: 42,
    height: 42,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',
  },

  monthCenter: {
    flex: 1,

    minHeight: 44,

    alignItems: 'center',
    justifyContent: 'center',
  },

  monthTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172033',
  },

  currentMonthGuide: {
    marginTop: 3,

    fontSize: 10,

    color: '#98A2B3',
  },

  // =========================
  // 총 지출
  // =========================

  totalBox: {
    backgroundColor: '#F1F5FC',

    borderRadius: 20,

    padding: 20,
  },

  totalLabel: {
    fontSize: 14,

    color: '#687386',
  },

  totalAmount: {
    marginTop: 8,

    fontSize: 30,
    fontWeight: '800',

    color: '#3563C9',
  },

  totalDescription: {
    marginTop: 8,

    fontSize: 13,

    color: '#8792A2',
  },

  // =========================
  // 날짜별 목록
  // =========================

  list: {
    marginTop: 30,
  },

  dateGroup: {
    marginBottom: 30,
  },

  dateHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    marginBottom: 8,
  },

  dateTitle: {
    fontSize: 15,

    fontWeight: '800',

    color: '#172033',
  },

  dayTotal: {
    fontSize: 13,

    fontWeight: '600',

    color: '#8792A2',
  },

  dayList: {
    backgroundColor: '#FFFFFF',
  },

  // =========================
  // 지출 한 건
  // =========================

  expenseWrapper: {
    position: 'relative',

    zIndex: 1,
  },

  expenseWrapperOpen: {
    zIndex: 100,
  },

  expenseItem: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    minHeight: 72,

    borderBottomWidth: 1,

    borderBottomColor:
      '#EEF1F5',
  },

  leftArea: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    paddingRight: 8,
  },

  categoryIcon: {
    width: 46,
    height: 46,

    borderRadius: 15,

    backgroundColor: '#F5F7FA',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,
  },

  categoryEmoji: {
    fontSize: 21,
  },

  expenseInfo: {
    flex: 1,
  },

  expenseTitle: {
    fontSize: 16,

    fontWeight: '700',

    color: '#172033',
  },

  expenseTime: {
    marginTop: 5,

    fontSize: 12,

    color: '#98A2B3',
  },

  rightArea: {
    flexDirection: 'row',

    alignItems: 'center',

    marginLeft: 10,
  },

  expenseAmount: {
    fontSize: 15,

    fontWeight: '700',

    color: '#172033',
  },

  menuButton: {
    width: 34,
    height: 34,

    marginLeft: 5,

    alignItems: 'center',

    justifyContent: 'center',
  },

  // =========================
  // 수정 / 삭제 팝업
  // =========================

  menu: {
    position: 'absolute',

    top: 58,

    right: 0,

    width: 150,

    backgroundColor: '#FFFFFF',

    borderRadius: 14,

    paddingVertical: 6,

    zIndex: 200,

    shadowColor: '#000000',

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

    backgroundColor: '#EEF1F5',
  },

  menuText: {
    fontSize: 14,

    fontWeight: '600',

    color: '#172033',
  },

  deleteText: {
    fontSize: 14,

    fontWeight: '600',

    color: '#D84B4B',
  },

  // =========================
  // 빈 화면
  // =========================

  empty: {
    alignItems: 'center',

    paddingVertical: 70,
  },

  emptyEmoji: {
    fontSize: 36,
  },

  emptyTitle: {
    marginTop: 16,

    fontSize: 16,

    fontWeight: '700',

    color: '#172033',
  },

  emptyText: {
    marginTop: 7,

    fontSize: 13,

    lineHeight: 20,

    color: '#8792A2',

    textAlign: 'center',
  },
});