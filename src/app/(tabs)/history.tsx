import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const EXPENSES_KEY = 'expenses';
const BUDGET_KEY = 'budget-settings';
const CUSTOM_CATEGORIES_KEY = 'custom-categories';

type IoniconName =
  ComponentProps<typeof Ionicons>['name'];

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
  icon?: IoniconName;
  emoji?: string;
  custom?: boolean;
};

type ExpenseGroup = {
  dateKey: string;
  date: Date;
  expenses: Expense[];
};

type CategoryOption = {
  id: string;
  label: string;
  icon: IoniconName;
};

const DEFAULT_CATEGORIES: CategoryOption[] = [
  {
    id: 'food',
    label: '식비',
    icon: 'restaurant-outline',
  },
  {
    id: 'cafe',
    label: '카페',
    icon: 'cafe-outline',
  },
  {
    id: 'transport',
    label: '교통',
    icon: 'subway-outline',
  },
  {
    id: 'shopping',
    label: '쇼핑',
    icon: 'bag-handle-outline',
  },
  {
    id: 'leisure',
    label: '여가',
    icon: 'game-controller-outline',
  },
  {
    id: 'life',
    label: '생활',
    icon: 'home-outline',
  },
  {
    id: 'etc',
    label: '기타',
    icon: 'ellipsis-horizontal-outline',
  },
];

const DEFAULT_CATEGORY_ICONS: Record<
  string,
  IoniconName
> = {
  food: 'restaurant-outline',
  cafe: 'cafe-outline',
  transport: 'subway-outline',
  shopping: 'bag-handle-outline',
  leisure: 'game-controller-outline',
  life: 'home-outline',
  etc: 'ellipsis-horizontal-outline',
};

export default function HistoryScreen() {
  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [
    customCategories,
    setCustomCategories,
  ] = useState<CustomCategory[]>([]);

  const [
    openedMenuId,
    setOpenedMenuId,
  ] = useState<string | null>(null);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('all');

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(() => {
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

      if (savedCustomCategories) {
        const parsed:
          CustomCategory[] =
          JSON.parse(
            savedCustomCategories
          );

        const migrated =
          parsed.map((item) => ({
            ...item,

            icon:
              item.icon ||
              'ellipsis-horizontal-outline',
          }));

        setCustomCategories(
          migrated
        );

        await AsyncStorage.setItem(
          CUSTOM_CATEGORIES_KEY,
          JSON.stringify(
            migrated
          )
        );
      } else {
        setCustomCategories([]);
      }
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

  /*
   * =========================
   * 해당 월 전체 지출
   * =========================
   */

  const monthExpenses =
    useMemo(() => {
      return expenses
        .filter((expense) => {
          const date =
            new Date(
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

  /*
   * 월 전체 총액
   *
   * 검색/필터를 걸어도
   * 이 금액은 변경하지 않음
   */

  const totalExpense =
    useMemo(() => {
      return monthExpenses.reduce(
        (sum, expense) =>
          sum + expense.amount,
        0
      );
    }, [monthExpenses]);

  /*
   * =========================
   * 사용자 카테고리
   * =========================
   */

  const customCategoryIcons =
    useMemo(() => {
      const map: Record<
        string,
        IoniconName
      > = {};

      customCategories.forEach(
        (item) => {
          map[item.id] =
            item.icon ||
            'ellipsis-horizontal-outline';
        }
      );

      return map;
    }, [customCategories]);

  const customCategoryLabels =
    useMemo(() => {
      const map: Record<
        string,
        string
      > = {};

      customCategories.forEach(
        (item) => {
          map[item.id] =
            item.label;
        }
      );

      return map;
    }, [customCategories]);

  const getCategoryIcon = (
    category?: string
  ): IoniconName => {
    if (!category) {
      return 'card-outline';
    }

    return (
      DEFAULT_CATEGORY_ICONS[
        category
      ] ??
      customCategoryIcons[
        category
      ] ??
      'ellipsis-horizontal-outline'
    );
  };

  const getCategoryLabel = (
    category?: string
  ) => {
    if (!category) {
      return '기타';
    }

    const defaultCategory =
      DEFAULT_CATEGORIES.find(
        (item) =>
          item.id === category
      );

    if (defaultCategory) {
      return defaultCategory.label;
    }

    return (
      customCategoryLabels[
        category
      ] ?? '기타'
    );
  };

  /*
   * =========================
   * 필터에 표시할 카테고리
   * =========================
   */

  const categoryOptions =
    useMemo<CategoryOption[]>(
      () => {
        const custom:
          CategoryOption[] =
          customCategories.map(
            (item) => ({
              id: item.id,

              label:
                item.label,

              icon:
                item.icon ||
                'ellipsis-horizontal-outline',
            })
          );

        return [
          ...DEFAULT_CATEGORIES,
          ...custom,
        ];
      },
      [customCategories]
    );

  /*
   * =========================
   * 검색 + 카테고리 필터
   * =========================
   */

  const normalizeText = (value: string) => {
  return value
    .toLowerCase()
    .replace(/\s+/g, '');
};

const filteredExpenses =
  useMemo(() => {
    const trimmed =
      searchQuery
        .trim()
        .toLowerCase();

    const normalizedSearch =
      normalizeText(trimmed);

    const numericSearch =
      trimmed.replace(
        /[^0-9]/g,
        ''
      );

    return monthExpenses.filter(
      (expense) => {
        const categoryMatches =
          selectedCategory ===
            'all' ||
          expense.category ===
            selectedCategory;

        if (!categoryMatches) {
          return false;
        }

        if (!trimmed) {
          return true;
        }

        const title =
          expense.title
            .toLowerCase();

        const categoryLabel =
          getCategoryLabel(
            expense.category
          ).toLowerCase();

        const normalizedTitle =
          normalizeText(title);

        const normalizedCategory =
          normalizeText(
            categoryLabel
          );

        const rawAmount =
          String(
            expense.amount
          );

        const formattedAmount =
          formatMoney(
            expense.amount
          );

        const titleMatches =
          title.includes(
            trimmed
          ) ||
          normalizedTitle.includes(
            normalizedSearch
          );

        const categoryNameMatches =
          categoryLabel.includes(
            trimmed
          ) ||
          normalizedCategory.includes(
            normalizedSearch
          );

        const amountMatches =
          numericSearch.length >
            0 &&
          (
            rawAmount.includes(
              numericSearch
            ) ||
            formattedAmount
              .replace(
                /,/g,
                ''
              )
              .includes(
                numericSearch
              )
          );

        return (
          titleMatches ||
          categoryNameMatches ||
          amountMatches
        );
      }
    );
  }, [
    monthExpenses,
    searchQuery,
    selectedCategory,
    customCategoryLabels,
  ]);
  /*
   * 검색/필터 결과 총액
   */

  const filteredTotal =
    useMemo(() => {
      return filteredExpenses.reduce(
        (sum, expense) =>
          sum + expense.amount,
        0
      );
    }, [filteredExpenses]);

  const isFiltering =
    searchQuery.trim().length >
      0 ||
    selectedCategory !== 'all';

  /*
   * =========================
   * 필터 결과를 날짜별 그룹화
   * =========================
   */

  const groupedExpenses =
    useMemo<ExpenseGroup[]>(
      () => {
        const groups =
          new Map<
            string,
            ExpenseGroup
          >();

        filteredExpenses.forEach(
          (expense) => {
            const date =
              new Date(
                expense.createdAt
              );

            const dateKey = [
              date.getFullYear(),

              String(
                date.getMonth() +
                  1
              ).padStart(
                2,
                '0'
              ),

              String(
                date.getDate()
              ).padStart(
                2,
                '0'
              ),
            ].join('-');

            const currentGroup =
              groups.get(dateKey);

            if (currentGroup) {
              currentGroup.expenses.push(
                expense
              );
            } else {
              groups.set(
                dateKey,
                {
                  dateKey,

                  date: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                  ),

                  expenses: [
                    expense,
                  ],
                }
              );
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
      },
      [filteredExpenses]
    );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(
      'all'
    );
    setOpenedMenuId(null);
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

  const formatTime = (
    value: string
  ) => {
    return new Date(
      value
    ).toLocaleTimeString(
      'ko-KR',
      {
        hour:
          '2-digit',
        minute:
          '2-digit',
      }
    );
  };

  /*
   * =========================
   * 삭제
   * =========================
   */

  const deleteExpense =
    async (
      expense: Expense
    ) => {
      try {
        const updatedExpenses =
          expenses.filter(
            (item) =>
              item.id !==
              expense.id
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
          const budget:
            BudgetSettings =
            JSON.parse(
              savedBudget
            );

          const updatedBudget = {
            ...budget,

            spentAmount:
              Math.max(
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

        setOpenedMenuId(
          null
        );
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
    if (
      Platform.OS === 'web'
    ) {
      const confirmed =
        window.confirm(
          `${expense.title} 지출 내역을 삭제할까요?\n\n${formatMoney(
            expense.amount
          )}원`
        );

      if (confirmed) {
        deleteExpense(
          expense
        );
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
          style:
            'destructive',

          onPress: () =>
            deleteExpense(
              expense
            ),
        },
      ]
    );
  };

  /*
   * =========================
   * 수정
   * =========================
   */

  const editExpense = (
    expense: Expense
  ) => {
    setOpenedMenuId(
      null
    );

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
      style={
        styles.screen
      }
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
      keyboardShouldPersistTaps="handled"
    >
      {/* =====================
          상단
      ====================== */}

      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.title
          }
        >
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

      {/* =====================
          소비 리포트
      ====================== */}

      <Pressable
        style={({
          pressed,
        }) => [
          styles.reportButton,

          pressed &&
            styles.reportButtonPressed,
        ]}
        onPress={() =>
          router.push(
            '/report'
          )
        }
      >
        <View
          style={
            styles.reportButtonLeft
          }
        >
          <View
            style={
              styles.reportIconBox
            }
          >
            <Ionicons
              name="stats-chart-outline"
              size={19}
              color="#3563C9"
            />
          </View>

          <View
            style={
              styles.reportTextArea
            }
          >
            <Text
              style={
                styles.reportButtonTitle
              }
            >
              소비 리포트
            </Text>

            <Text
              style={
                styles.reportButtonDescription
              }
            >
              1주, 1개월, 1년 소비 흐름을 확인해보세요.
            </Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color="#98A2B3"
        />
      </Pressable>

      {/* =====================
          월 선택
      ====================== */}

      <View
        style={
          styles.monthSelector
        }
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
          style={
            styles.monthCenter
          }
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

      {/* =====================
          월 총 지출
      ====================== */}

      <View
        style={
          styles.totalBox
        }
      >
        <Text
          style={
            styles.totalLabel
          }
        >
          {selectedMonthIndex +
            1}
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

      {/* =====================
          검색
      ====================== */}

      <View
        style={
          styles.searchSection
        }
      >
        <View
          style={
            styles.searchBox
          }
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#98A2B3"
          />

          <TextInput
            style={
              styles.searchInput
            }
            value={
              searchQuery
            }
            onChangeText={(
              value
            ) => {
              setSearchQuery(
                value
              );

              setOpenedMenuId(
                null
              );
            }}
            placeholder="지출 내역 검색"
            placeholderTextColor="#A8B0BE"
            returnKeyType="search"
          />

          {searchQuery.length >
            0 && (
            <Pressable
              style={
                styles.searchClearButton
              }
              onPress={() =>
                setSearchQuery(
                  ''
                )
              }
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#A8B0BE"
              />
            </Pressable>
          )}
        </View>

        {/* =====================
            카테고리 필터
        ====================== */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.categoryFilterContent
          }
          style={
            styles.categoryFilterScroll
          }
        >
          <Pressable
            style={[
              styles.filterChip,

              selectedCategory ===
                'all' &&
                styles.filterChipSelected,
            ]}
            onPress={() => {
              setSelectedCategory(
                'all'
              );

              setOpenedMenuId(
                null
              );
            }}
          >
            <Text
              style={[
                styles.filterChipText,

                selectedCategory ===
                  'all' &&
                  styles.filterChipTextSelected,
              ]}
            >
              전체
            </Text>
          </Pressable>

          {categoryOptions.map(
            (item) => {
              const isSelected =
                selectedCategory ===
                item.id;

              return (
                <Pressable
                  key={
                    item.id
                  }
                  style={[
                    styles.filterChip,

                    isSelected &&
                      styles.filterChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(
                      item.id
                    );

                    setOpenedMenuId(
                      null
                    );
                  }}
                >
                  <Ionicons
                    name={
                      item.icon
                    }
                    size={15}
                    color={
                      isSelected
                        ? '#3563C9'
                        : '#687386'
                    }
                  />

                  <Text
                    style={[
                      styles.filterChipText,

                      isSelected &&
                        styles.filterChipTextSelected,
                    ]}
                  >
                    {
                      item.label
                    }
                  </Text>
                </Pressable>
              );
            }
          )}
        </ScrollView>

        {/* 결과 요약 */}

        {isFiltering && (
          <View
            style={
              styles.searchResultSummary
            }
          >
            <View>
              <Text
                style={
                  styles.searchResultTitle
                }
              >
                {searchQuery.trim()
                  ? `'${searchQuery.trim()}' 검색 결과`
                  : selectedCategory ===
                      'all'
                    ? '검색 결과'
                    : `${getCategoryLabel(
                        selectedCategory
                      )} 지출`}
              </Text>

              <Text
                style={
                  styles.searchResultInfo
                }
              >
                {
                  filteredExpenses.length
                }
                건 ·{' '}
                {formatMoney(
                  filteredTotal
                )}
                원
              </Text>
            </View>

            <Pressable
              style={
                styles.resetButton
              }
              onPress={
                clearFilters
              }
            >
              <Ionicons
                name="refresh-outline"
                size={14}
                color="#687386"
              />

              <Text
                style={
                  styles.resetButtonText
                }
              >
                초기화
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* =====================
          지출 목록
      ====================== */}

      <View
        style={
          styles.list
        }
      >
        {/* 월 자체에 데이터가 없음 */}

        {monthExpenses.length ===
        0 ? (
          <View
            style={
              styles.empty
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="receipt-outline"
                size={30}
                color="#98A2B3"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              이 달에는 지출 내역이 없어요
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              지출을 기록하면 날짜별로 정리해서 보여드려요.
            </Text>
          </View>
        ) : groupedExpenses.length ===
          0 ? (
          /*
           * 월 데이터는 있는데
           * 검색/필터 결과가 없음
           */
          <View
            style={
              styles.empty
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="search-outline"
                size={29}
                color="#98A2B3"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              검색 결과가 없어요
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              다른 검색어나 카테고리로 다시 찾아보세요.
            </Text>

            <Pressable
              style={
                styles.emptyResetButton
              }
              onPress={
                clearFilters
              }
            >
              <Text
                style={
                  styles.emptyResetButtonText
                }
              >
                전체 내역 보기
              </Text>
            </Pressable>
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

                  {/* 하루 지출 */}

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
                              {/* 왼쪽 */}

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
                                  <Ionicons
                                    name={getCategoryIcon(
                                      expense.category
                                    )}
                                    size={
                                      21
                                    }
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
                                    numberOfLines={
                                      1
                                    }
                                  >
                                    {
                                      expense.title
                                    }
                                  </Text>

                                  <View
                                    style={
                                      styles.expenseMetaRow
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.expenseTime
                                      }
                                    >
                                      {formatTime(
                                        expense.createdAt
                                      )}
                                    </Text>

                                    <View
                                      style={
                                        styles.metaDot
                                      }
                                    />

                                    <Text
                                      style={
                                        styles.expenseCategoryName
                                      }
                                    >
                                      {getCategoryLabel(
                                        expense.category
                                      )}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              {/* 오른쪽 */}

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

                            {/* 수정 / 삭제 */}

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

    header: {
      marginBottom: 20,
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

    // ========================
    // 소비 리포트
    // ========================

    reportButton: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      backgroundColor:
        '#F8FAFC',

      borderRadius: 18,

      paddingHorizontal: 14,

      paddingVertical: 14,

      borderWidth: 1,

      borderColor:
        '#EDF0F4',

      marginBottom: 16,
    },

    reportButtonPressed: {
      backgroundColor:
        '#F1F5FC',
    },

    reportButtonLeft: {
      flex: 1,

      flexDirection: 'row',

      alignItems: 'center',
    },

    reportIconBox: {
      width: 42,

      height: 42,

      borderRadius: 14,

      backgroundColor:
        '#EAF0FB',

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 11,
    },

    reportTextArea: {
      flex: 1,

      paddingRight: 8,
    },

    reportButtonTitle: {
      fontSize: 14,

      fontWeight: '800',

      color: '#172033',
    },

    reportButtonDescription: {
      marginTop: 4,

      fontSize: 11,

      lineHeight: 16,

      color: '#8792A2',
    },

    // ========================
    // 월 선택
    // ========================

    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',

      backgroundColor:
        '#F8FAFC',

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
      justifyContent:
        'center',
    },

    monthCenter: {
      flex: 1,

      minHeight: 44,

      alignItems: 'center',
      justifyContent:
        'center',
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

    // ========================
    // 총 지출
    // ========================

    totalBox: {
      backgroundColor:
        '#F1F5FC',

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

    // ========================
    // 검색
    // ========================

    searchSection: {
      marginTop: 18,
    },

    searchBox: {
      minHeight: 52,

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        '#F5F7FA',

      borderRadius: 16,

      paddingHorizontal: 15,

      borderWidth: 1,

      borderColor:
        '#EDF0F4',
    },

    searchInput: {
      flex: 1,

      marginLeft: 9,

      paddingVertical: 13,

      fontSize: 14,

      color: '#172033',

      outlineStyle: 'none' as any,
    },

    searchClearButton: {
      width: 32,
      height: 32,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    // ========================
    // 카테고리 필터
    // ========================

    categoryFilterScroll: {
      marginTop: 11,

      marginHorizontal: -24,
    },

    categoryFilterContent: {
      paddingHorizontal: 24,

      gap: 8,
    },

    filterChip: {
      height: 38,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      paddingHorizontal: 13,

      borderRadius: 999,

      backgroundColor:
        '#F5F7FA',

      borderWidth: 1,

      borderColor:
        '#EEF1F5',
    },

    filterChipSelected: {
      backgroundColor:
        '#EAF0FB',

      borderColor:
        '#D4E0F7',
    },

    filterChipText: {
      fontSize: 12,

      fontWeight: '600',

      color: '#687386',
    },

    filterChipTextSelected: {
      fontWeight: '700',

      color: '#3563C9',
    },

    // ========================
    // 검색 결과 요약
    // ========================

    searchResultSummary: {
      marginTop: 14,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      backgroundColor:
        '#F8FAFC',

      borderRadius: 14,

      paddingHorizontal: 14,

      paddingVertical: 12,
    },

    searchResultTitle: {
      fontSize: 12,

      fontWeight: '700',

      color: '#172033',
    },

    searchResultInfo: {
      marginTop: 3,

      fontSize: 12,

      color: '#8792A2',
    },

    resetButton: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      paddingHorizontal: 9,

      paddingVertical: 7,

      borderRadius: 10,

      backgroundColor:
        '#FFFFFF',
    },

    resetButtonText: {
      fontSize: 11,

      fontWeight: '600',

      color: '#687386',
    },

    // ========================
    // 날짜별 목록
    // ========================

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
      backgroundColor:
        '#FFFFFF',
    },

    // ========================
    // 지출
    // ========================

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

      backgroundColor:
        '#F5F7FA',

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 12,
    },

    expenseInfo: {
      flex: 1,
    },

    expenseTitle: {
      fontSize: 16,

      fontWeight: '700',

      color: '#172033',
    },

    expenseMetaRow: {
      flexDirection: 'row',

      alignItems: 'center',

      marginTop: 5,
    },

    expenseTime: {
      fontSize: 12,

      color: '#98A2B3',
    },

    metaDot: {
      width: 3,

      height: 3,

      borderRadius: 2,

      marginHorizontal: 6,

      backgroundColor:
        '#CBD1DA',
    },

    expenseCategoryName: {
      fontSize: 11,

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

      justifyContent:
        'center',
    },

    // ========================
    // 수정/삭제 팝업
    // ========================

    menu: {
      position: 'absolute',

      top: 58,

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

    // ========================
    // Empty
    // ========================

    empty: {
      alignItems: 'center',

      paddingVertical: 70,
    },

    emptyIcon: {
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

    emptyResetButton: {
      marginTop: 18,

      backgroundColor:
        '#EAF0FB',

      borderRadius: 12,

      paddingHorizontal: 15,

      paddingVertical: 10,
    },

    emptyResetButtonText: {
      fontSize: 13,

      fontWeight: '700',

      color: '#3563C9',
    },
  });