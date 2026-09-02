import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import type { ComponentProps } from 'react';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Calendar, LocaleConfig } from 'react-native-calendars';

import AppHeader from '../components/AppHeader';

LocaleConfig.locales.ko = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  dayNames: [
    '일요일', '월요일', '화요일', '수요일',
    '목요일', '금요일', '토요일',
  ],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

const BUDGET_KEY = 'budget-settings';
const EXPENSES_KEY = 'expenses';
const CUSTOM_CATEGORIES_KEY = 'custom-categories';

type IoniconName =
  ComponentProps<typeof Ionicons>['name'];

type BudgetSettings = {
  monthlyBudget: number;
  fixedExpense: number;
  savingGoal: number;
  spentAmount: number;
  payday?: number;
  paydayType?: 'date' | 'lastDay';
};

type Category = {
  id: string;
  label: string;
  icon: IoniconName;
  custom?: boolean;
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
};

const DEFAULT_CATEGORIES: Category[] = [
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

const ICON_OPTIONS: IoniconName[] = [
  'heart-outline',
  'paw-outline',
  'medical-outline',
  'school-outline',
  'airplane-outline',
  'car-outline',
  'shirt-outline',
  'gift-outline',
  'musical-notes-outline',
  'fitness-outline',
  'book-outline',
  'cut-outline',
  'bed-outline',
  'fast-food-outline',
  'wine-outline',
  'ticket-outline',
];

const getLocalISOString = () => {
  const date = new Date();

  const pad = (value: number) =>
    String(value).padStart(2, '0');

  const timezoneOffset = -date.getTimezoneOffset();
  const sign = timezoneOffset >= 0 ? '+' : '-';
  const offsetHours = pad(
    Math.floor(Math.abs(timezoneOffset) / 60)
  );
  const offsetMinutes = pad(
    Math.abs(timezoneOffset) % 60
  );

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}.` +
    `${String(date.getMilliseconds()).padStart(3, '0')}` +
    `${sign}${offsetHours}:${offsetMinutes}`
  );
};

export default function ExpenseScreen() {
  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const expenseId =
    typeof params.id === 'string'
      ? params.id
      : undefined;

  const isEditMode =
    Boolean(expenseId);

  const [title, setTitle] =
    useState('');

  const [amount, setAmount] =
    useState('');

  const [category, setCategory] =
    useState('food');

  const [expenseDate, setExpenseDate] =
    useState(() => {
      const now = new Date();
      return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-');
    });

  const [
    showDateModal,
    setShowDateModal,
  ] = useState(false);

  const [
    originalExpense,
    setOriginalExpense,
  ] = useState<Expense | null>(
    null
  );

  const [
    customCategories,
    setCustomCategories,
  ] = useState<Category[]>([]);

  const [
    showCategoryModal,
    setShowCategoryModal,
  ] = useState(false);

  const [
    newCategoryName,
    setNewCategoryName,
  ] = useState('');

  const [
    newCategoryIcon,
    setNewCategoryIcon,
  ] = useState<IoniconName>(
    'heart-outline'
  );

  const slideAnim = useRef(
    new Animated.Value(500)
  ).current;

  const backdropOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  useEffect(() => {
    loadInitialData();
  }, [expenseId]);

  const loadInitialData =
    async () => {
      await loadCustomCategories();

      if (expenseId) {
        await loadExpense(
          expenseId
        );
      }
    };

  const loadCustomCategories =
    async () => {
      try {
        const saved =
          await AsyncStorage.getItem(
            CUSTOM_CATEGORIES_KEY
          );

        if (!saved) {
          return;
        }

        const parsed =
          JSON.parse(saved);

        const migrated: Category[] =
          parsed.map(
            (item: any) => ({
              id: item.id,
              label: item.label,
              custom: true,
              icon:
                item.icon ||
                'ellipsis-horizontal-outline',
            })
          );

        setCustomCategories(
          migrated
        );

        await AsyncStorage.setItem(
          CUSTOM_CATEGORIES_KEY,
          JSON.stringify(
            migrated
          )
        );
      } catch (error) {
        console.error(
          '카테고리 불러오기 실패:',
          error
        );
      }
    };

  const loadExpense =
    async (
      id: string
    ) => {
      try {
        const saved =
          await AsyncStorage.getItem(
            EXPENSES_KEY
          );

        if (!saved) {
          return;
        }

        const expenses: Expense[] =
          JSON.parse(saved);

        const target =
          expenses.find(
            (item) =>
              item.id === id
          );

        if (!target) {
          return;
        }

        setOriginalExpense(
          target
        );

        setTitle(
          target.title
        );

        setAmount(
          Number(
            target.amount
          ).toLocaleString(
            'ko-KR'
          )
        );

        setCategory(
          target.category ||
          'etc'
        );

        const targetDate =
          new Date(target.createdAt);

        setExpenseDate(
          [
            targetDate.getFullYear(),
            String(targetDate.getMonth() + 1).padStart(2, '0'),
            String(targetDate.getDate()).padStart(2, '0'),
          ].join('-')
        );
      } catch (error) {
        console.error(
          '지출 불러오기 실패:',
          error
        );
      }
    };

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories,
  ];

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

  const openCategoryModal =
    () => {
      setNewCategoryName('');

      setNewCategoryIcon(
        'heart-outline'
      );

      slideAnim.setValue(500);

      backdropOpacity.setValue(
        0
      );

      setShowCategoryModal(
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

  const closeCategoryModal =
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
            duration: 100,
            useNativeDriver:
              true,
          }
        ),
      ]).start(() => {
        setShowCategoryModal(
          false
        );

        setNewCategoryName('');

        setNewCategoryIcon(
          'heart-outline'
        );
      });
    };

  const addCustomCategory =
    async () => {
      const name =
        newCategoryName.trim();

      if (!name) {
        return;
      }

      const newCategory: Category =
      {
        id: `custom-${Date.now()}`,
        label: name,
        icon:
          newCategoryIcon,
        custom: true,
      };

      const updatedCategories = [
        ...customCategories,
        newCategory,
      ];

      try {
        await AsyncStorage.setItem(
          CUSTOM_CATEGORIES_KEY,
          JSON.stringify(
            updatedCategories
          )
        );

        setCustomCategories(
          updatedCategories
        );

        setCategory(
          newCategory.id
        );

        closeCategoryModal();
      } catch (error) {
        console.error(
          '카테고리 저장 실패:',
          error
        );
      }
    };

  const updateBudgetSpentAmount =
    async (
      difference: number
    ) => {
      const savedBudget =
        await AsyncStorage.getItem(
          BUDGET_KEY
        );

      if (!savedBudget) {
        return;
      }

      const budget: BudgetSettings =
        JSON.parse(
          savedBudget
        );

      const currentSpent =
        Number(
          budget.spentAmount
        ) || 0;

      const updatedBudget = {
        ...budget,

        spentAmount: Math.max(
          0,
          currentSpent +
          difference
        ),
      };

      await AsyncStorage.setItem(
        BUDGET_KEY,
        JSON.stringify(
          updatedBudget
        )
      );
    };

  const formatExpenseDateLabel = (
    dateKey: string
  ) => {
    const [year, month, day] =
      dateKey.split('-').map(Number);

    const date = new Date(
      year,
      month - 1,
      day
    );

    const weekday = [
      '일', '월', '화', '수', '목', '금', '토',
    ][date.getDay()];

    return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
  };

  const buildExpenseDateTime = (
    dateKey: string,
    baseCreatedAt?: string
  ) => {
    const [year, month, day] =
      dateKey.split('-').map(Number);

    const baseDate = baseCreatedAt
      ? new Date(baseCreatedAt)
      : new Date();

    const date = new Date(
      year,
      month - 1,
      day,
      baseDate.getHours(),
      baseDate.getMinutes(),
      baseDate.getSeconds(),
      baseDate.getMilliseconds()
    );

    const pad = (value: number) =>
      String(value).padStart(2, '0');

    const timezoneOffset =
      -date.getTimezoneOffset();

    const sign =
      timezoneOffset >= 0 ? '+' : '-';

    const offsetHours = pad(
      Math.floor(
        Math.abs(timezoneOffset) / 60
      )
    );

    const offsetMinutes = pad(
      Math.abs(timezoneOffset) % 60
    );

    return (
      `${date.getFullYear()}-` +
      `${pad(date.getMonth() + 1)}-` +
      `${pad(date.getDate())}T` +
      `${pad(date.getHours())}:` +
      `${pad(date.getMinutes())}:` +
      `${pad(date.getSeconds())}.` +
      `${String(date.getMilliseconds()).padStart(3, '0')}` +
      `${sign}${offsetHours}:${offsetMinutes}`
    );
  };

  const createExpense =
    async (
      numericAmount: number
    ) => {
      const savedExpenses =
        await AsyncStorage.getItem(
          EXPENSES_KEY
        );

      const expenses: Expense[] =
        savedExpenses
          ? JSON.parse(
            savedExpenses
          )
          : [];

      const newExpense: Expense =
      {
        id:
          Date.now().toString(),

        title:
          title.trim() ||
          '지출',

        amount:
          numericAmount,

        category,

        createdAt:
          buildExpenseDateTime(expenseDate),
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

      await updateBudgetSpentAmount(
        numericAmount
      );
    };

  const updateExpense =
    async (
      numericAmount: number
    ) => {
      if (
        !expenseId ||
        !originalExpense
      ) {
        return;
      }

      const savedExpenses =
        await AsyncStorage.getItem(
          EXPENSES_KEY
        );

      if (!savedExpenses) {
        return;
      }

      const expenses: Expense[] =
        JSON.parse(
          savedExpenses
        );

      const updatedExpenses =
        expenses.map(
          (expense) => {
            if (
              expense.id !==
              expenseId
            ) {
              return expense;
            }

            return {
              ...expense,

              title:
                title.trim() ||
                '지출',

              amount:
                numericAmount,

              category,

              createdAt:
                buildExpenseDateTime(
                  expenseDate,
                  expense.createdAt
                ),
            };
          }
        );

      await AsyncStorage.setItem(
        EXPENSES_KEY,
        JSON.stringify(
          updatedExpenses
        )
      );

      const difference =
        numericAmount -
        originalExpense.amount;

      await updateBudgetSpentAmount(
        difference
      );
    };

  const saveExpense =
    async () => {
      const numericAmount =
        parseMoney(amount);

      if (
        numericAmount <= 0
      ) {
        return;
      }

      try {
        if (isEditMode) {
          await updateExpense(
            numericAmount
          );
        } else {
          await createExpense(
            numericAmount
          );
        }

        router.back();
      } catch (error) {
        console.error(
          isEditMode
            ? '지출 수정 실패:'
            : '지출 저장 실패:',
          error
        );
      }
    };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader
          title={
            isEditMode
              ? '지출 수정'
              : '지출 기록'
          }
          description={
            isEditMode
              ? '기록한 지출 정보를 수정해보세요.'
              : '오늘 사용한 금액을 기록해보세요.'
          }
        />

        <View style={styles.form}>
          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={styles.label}
            >
              얼마를 썼나요?
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
                style={styles.unit}
              >
                원
              </Text>
            </View>
          </View>

          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={styles.label}
            >
              어디에 썼나요?
            </Text>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={
                setTitle
              }
              placeholder="예: 점심"
            />
          </View>

          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={styles.label}
            >
              날짜
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.dateSelectButton,
                pressed &&
                styles.dateSelectButtonPressed,
              ]}
              onPress={() =>
                setShowDateModal(true)
              }
            >
              <View
                style={styles.dateSelectLeft}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#687386"
                />

                <Text
                  style={styles.dateSelectText}
                >
                  {formatExpenseDateLabel(
                    expenseDate
                  )}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#98A2B3"
              />
            </Pressable>
          </View>

          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={styles.label}
            >
              카테고리
            </Text>

            <View
              style={
                styles.categoryContainer
              }
            >
              {allCategories.map(
                (item) => {
                  const isSelected =
                    category ===
                    item.id;

                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.categoryButton,

                        isSelected &&
                        styles.categoryButtonSelected,
                      ]}
                      onPress={() =>
                        setCategory(
                          item.id
                        )
                      }
                    >
                      <Ionicons
                        name={
                          item.icon
                        }
                        size={18}
                        color={
                          isSelected
                            ? '#3563C9'
                            : '#687386'
                        }
                      />

                      <Text
                        style={[
                          styles.categoryText,

                          isSelected &&
                          styles.categoryTextSelected,
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

              <Pressable
                style={[
                  styles.categoryButton,
                  styles.addCategoryButton,
                ]}
                onPress={
                  openCategoryModal
                }
              >
                <Ionicons
                  name="add"
                  size={18}
                  color="#3563C9"
                />

                <Text
                  style={
                    styles.addCategoryText
                  }
                >
                  추가
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,

            pressed &&
            styles.saveButtonPressed,
          ]}
          onPress={saveExpense}
        >
          <Text
            style={
              styles.saveButtonText
            }
          >
            {isEditMode
              ? '수정하기'
              : '기록하기'}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setShowDateModal(false)
        }
      >
        <View
          style={styles.dateModalRoot}
        >
          <Pressable
            style={styles.dateModalBackdrop}
            onPress={() =>
              setShowDateModal(false)
            }
          />

          <View
            style={styles.calendarSheet}
          >
            <View
              style={styles.calendarHeader}
            >
              <View>
                <Text
                  style={styles.calendarTitle}
                >
                  지출 날짜
                </Text>
                <Text
                  style={styles.calendarSubtitle}
                >
                  실제로 사용한 날짜를 선택해주세요.
                </Text>
              </View>

              <Pressable
                style={styles.calendarCloseButton}
                onPress={() =>
                  setShowDateModal(false)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#687386"
                />
              </Pressable>
            </View>

            <Calendar
              current={expenseDate}
              markedDates={{
                [expenseDate]: {
                  selected: true,
                  selectedColor: '#3563C9',
                  selectedTextColor: '#FFFFFF',
                },
              }}
              onDayPress={(day) => {
                setExpenseDate(
                  day.dateString
                );
                setShowDateModal(false);
              }}
              enableSwipeMonths
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#98A2B3',
                selectedDayBackgroundColor: '#3563C9',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#3563C9',
                dayTextColor: '#172033',
                textDisabledColor: '#D0D5DD',
                arrowColor: '#3563C9',
                monthTextColor: '#172033',
                textDayFontFamily: 'Pretendard-Medium',
                textMonthFontFamily: 'Pretendard-Bold',
                textDayHeaderFontFamily: 'Pretendard-Medium',
                textDayFontSize: 14,
                textMonthFontSize: 17,
                textDayHeaderFontSize: 12,
              }}
            />

            <Pressable
              style={styles.todayButton}
              onPress={() => {
                const now = new Date();
                const today = [
                  now.getFullYear(),
                  String(now.getMonth() + 1).padStart(2, '0'),
                  String(now.getDate()).padStart(2, '0'),
                ].join('-');

                setExpenseDate(today);
                setShowDateModal(false);
              }}
            >
              <Text
                style={styles.todayButtonText}
              >
                오늘로 선택
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          showCategoryModal
        }
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={
          closeCategoryModal
        }
      >
        <View
          style={styles.modalRoot}
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
                closeCategoryModal
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
                  새 카테고리
                </Text>

                <Text
                  style={
                    styles.sheetDescription
                  }
                >
                  카테고리 이름과 아이콘을 선택해주세요.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={
                  closeCategoryModal
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
              카테고리 이름
            </Text>

            <TextInput
              style={
                styles.modalCategoryNameInput
              }
              value={
                newCategoryName
              }
              onChangeText={
                setNewCategoryName
              }
              placeholder="예: 반려동물"
              maxLength={10}
            />

            <Text
              style={[
                styles.sheetLabel,
                styles.iconLabel,
              ]}
            >
              아이콘
            </Text>

            <View
              style={
                styles.iconGrid
              }
            >
              {ICON_OPTIONS.map(
                (icon) => {
                  const isSelected =
                    icon ===
                    newCategoryIcon;

                  return (
                    <Pressable
                      key={icon}
                      style={[
                        styles.iconOption,

                        isSelected &&
                        styles.iconOptionSelected,
                      ]}
                      onPress={() =>
                        setNewCategoryIcon(
                          icon
                        )
                      }
                    >
                      <Ionicons
                        name={icon}
                        size={22}
                        color={
                          isSelected
                            ? '#3563C9'
                            : '#687386'
                        }
                      />
                    </Pressable>
                  );
                }
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.categorySaveButton,

                pressed &&
                styles.categorySaveButtonPressed,
              ]}
              onPress={
                addCustomCategory
              }
            >
              <Text
                style={
                  styles.categorySaveButtonText
                }
              >
                추가하기
              </Text>
            </Pressable>
          </Animated.View>
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
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 50,
    },

    form: {
      gap: 28,
    },

    inputGroup: {
      gap: 10,
    },

    label: {
      fontSize: 15,
      fontFamily: 'Pretendard-Bold',
      color: '#172033',
    },

    amountInputBox: {
      flexDirection: 'row',
      alignItems: 'center',

      backgroundColor:
        '#F1F5FC',

      borderRadius: 16,

      paddingHorizontal: 18,
    },

    amountInput: {
      flex: 1,

      paddingVertical: 18,

      fontSize: 28,
      fontFamily: 'Pretendard-ExtraBold',

      color: '#3563C9',
    },

    unit: {
      marginLeft: 8,

      fontSize: 15,
      fontFamily: 'Pretendard-Bold',

      color: '#687386',
    },

    input: {
      backgroundColor:
        '#F5F7FA',

      borderRadius: 16,

      paddingHorizontal: 16,
      paddingVertical: 16,

      fontSize: 16,

      color: '#172033',
    },

    dateSelectButton: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#F5F7FA',
      borderRadius: 16,
      paddingHorizontal: 16,
    },

    dateSelectButtonPressed: {
      opacity: 0.72,
    },

    dateSelectLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    dateSelectText: {
      fontSize: 16,
      fontFamily: 'Pretendard-Medium',
      color: '#172033',
    },

    dateModalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },

    dateModalBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(23, 32, 51, 0.34)',
    },

    calendarSheet: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 28,
    },

    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      marginBottom: 12,
    },

    calendarTitle: {
      fontSize: 20,
      fontFamily: 'Pretendard-Bold',
      color: '#172033',
    },

    calendarSubtitle: {
      marginTop: 5,
      fontSize: 13,
      fontFamily: 'Pretendard-Regular',
      color: '#98A2B3',
    },

    calendarCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F7FA',
    },

    todayButton: {
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      borderRadius: 15,
      backgroundColor: '#E7EEFC',
    },

    todayButtonText: {
      fontSize: 15,
      fontFamily: 'Pretendard-Bold',
      color: '#3563C9',
    },

    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',

      gap: 10,
    },

    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 7,

      backgroundColor:
        '#F5F7FA',

      borderRadius: 14,

      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    categoryButtonSelected: {
      backgroundColor:
        '#E7EEFC',
    },

    categoryText: {
      fontSize: 14,
      fontFamily: 'Pretendard-SemiBold',

      color: '#687386',
    },

    categoryTextSelected: {
      color: '#3563C9',
      fontFamily: 'Pretendard-Bold',
    },

    addCategoryButton: {
      borderWidth: 1,

      borderColor:
        '#DCE5F5',

      backgroundColor:
        '#FFFFFF',
    },

    addCategoryText: {
      fontSize: 14,
      fontFamily: 'Pretendard-Bold',

      color: '#3563C9',
    },

    saveButton: {
      marginTop: 36,

      backgroundColor:
        '#3563C9',

      borderRadius: 16,

      paddingVertical: 17,

      alignItems: 'center',
    },

    saveButtonPressed: {
      backgroundColor:
        '#294FA5',
    },

    saveButtonText: {
      color: '#FFFFFF',

      fontSize: 16,
      fontFamily: 'Pretendard-Bold',
    },

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

      marginBottom: 24,
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

    modalCategoryNameInput: {
      backgroundColor:
        '#F5F7FA',

      borderRadius: 16,

      paddingHorizontal: 16,
      paddingVertical: 16,

      fontSize: 16,

      color: '#172033',
    },

    iconLabel: {
      marginTop: 24,
    },

    iconGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 10,
    },

    iconOption: {
      width: 48,
      height: 48,

      borderRadius: 14,

      backgroundColor:
        '#F5F7FA',

      alignItems: 'center',
      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        'transparent',
    },

    iconOptionSelected: {
      backgroundColor:
        '#E7EEFC',

      borderColor:
        '#3563C9',
    },

    categorySaveButton: {
      marginTop: 28,

      backgroundColor:
        '#3563C9',

      borderRadius: 16,

      paddingVertical: 17,

      alignItems: 'center',
    },

    categorySaveButtonPressed: {
      backgroundColor:
        '#294FA5',
    },

    categorySaveButtonText: {
      color: '#FFFFFF',

      fontSize: 16,

      fontFamily: 'Pretendard-Bold',
    },
  });