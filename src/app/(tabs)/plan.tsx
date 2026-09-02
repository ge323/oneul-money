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

const PLANNED_EXPENSES_KEY =
  'planned-expenses';

type PlannedExpense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  createdAt: string;
};

export default function PlanScreen() {
  const [plannedExpenses, setPlannedExpenses] =
    useState<PlannedExpense[]>([]);

  const [showModal, setShowModal] =
    useState(false);

  const [title, setTitle] =
    useState('');

  const [amount, setAmount] =
    useState('');

  const [date, setDate] =
    useState('');

  const slideAnim = useRef(
    new Animated.Value(500)
  ).current;

  const backdropOpacity = useRef(
    new Animated.Value(0)
  ).current;

  useFocusEffect(
    useCallback(() => {
      loadPlannedExpenses();
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

  const getTodayString = () => {
    const today = new Date();

    const year =
      today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      today.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const openModal = () => {
    setTitle('');
    setAmount('');
    setDate(
      getTodayString()
    );

    slideAnim.setValue(500);
    backdropOpacity.setValue(0);

    setShowModal(true);

    requestAnimationFrame(() => {
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
    });
  };

  const closeModal = () => {
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
          duration: 100,
          useNativeDriver: true,
        }
      ),
    ]).start(() => {
      setShowModal(false);

      setTitle('');
      setAmount('');
      setDate('');
    });
  };

  const savePlannedExpense =
    async () => {
      const numericAmount =
        parseMoney(amount);

      if (
        !title.trim() ||
        numericAmount <= 0 ||
        !date.trim()
      ) {
        return;
      }

      const newExpense: PlannedExpense =
        {
          id:
            Date.now().toString(),

          title:
            title.trim(),

          amount:
            numericAmount,

          date:
            date.trim(),

          createdAt:
            new Date().toISOString(),
        };

      const updated = [
        ...plannedExpenses,
        newExpense,
      ].sort(
        (a, b) =>
          new Date(
            a.date
          ).getTime() -
          new Date(
            b.date
          ).getTime()
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

        closeModal();
      } catch (error) {
        console.error(
          '예정 지출 저장 실패:',
          error
        );
      }
    };

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

    deleteExpense(
      expense.id
    );
  };

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

      return plannedExpenses.filter(
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
      );
    }, [plannedExpenses]);

  const totalPlanned =
    upcomingExpenses.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );

  const formatDate = (
    value: string
  ) => {
    const date =
      new Date(
        `${value}T00:00:00`
      );

    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

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
          style={
            styles.title
          }
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
            건을 미리 반영해요.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,

            pressed &&
              styles.addButtonPressed,
          ]}
          onPress={
            openModal
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
          style={
            styles.list
          }
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
              <Text
                style={
                  styles.emptyEmoji
                }
              >
                📅
              </Text>

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
              (expense) => (
                <View
                  key={
                    expense.id
                  }
                  style={
                    styles.expenseItem
                  }
                >
                  <View
                    style={
                      styles.expenseIcon
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={21}
                      color="#3563C9"
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
                      styles.deleteButton
                    }
                    onPress={() =>
                      confirmDelete(
                        expense
                      )
                    }
                  >
                    <Ionicons
                      name="close"
                      size={19}
                      color="#98A2B3"
                    />
                  </Pressable>
                </View>
              )
            )
          )}
        </View>
      </ScrollView>

      <Modal
        visible={
          showModal
        }
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={
          closeModal
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
                closeModal
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
              <View>
                <Text
                  style={
                    styles.sheetTitle
                  }
                >
                  예정 지출 추가
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
                  closeModal
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
              value={
                title
              }
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
              예정 금액
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
                value={
                  amount
                }
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

            <TextInput
              style={
                styles.input
              }
              value={
                date
              }
              onChangeText={
                setDate
              }
              placeholder="2026-09-05"
            />

            <Text
              style={
                styles.dateGuide
              }
            >
              예: 2026-09-05
            </Text>

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
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 120,
    },

    title: {
      fontSize: 28,
      fontWeight: '800',
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
      fontWeight: '800',
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
      fontWeight: '700',
      color: '#3563C9',
    },

    list: {
      marginTop: 32,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#172033',
      marginBottom: 14,
    },

    expenseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 70,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEF1F5',
    },

    expenseIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        '#EEF3FB',
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
      fontWeight: '700',
      color: '#172033',
    },

    expenseDate: {
      marginTop: 4,
      fontSize: 12,
      color: '#8792A2',
    },

    expenseAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: '#172033',
    },

    deleteButton: {
      width: 34,
      height: 34,
      marginLeft: 3,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    empty: {
      alignItems: 'center',
      paddingVertical: 60,
    },

    emptyEmoji: {
      fontSize: 34,
    },

    emptyTitle: {
      marginTop: 14,
      fontSize: 16,
      fontWeight: '700',
      color: '#172033',
    },

    emptyDescription: {
      marginTop: 7,
      fontSize: 13,
      lineHeight: 20,
      color: '#8792A2',
      textAlign: 'center',
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
      marginBottom: 25,
    },

    sheetTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#172033',
    },

    sheetDescription: {
      marginTop: 6,
      fontSize: 13,
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
      fontWeight: '700',
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
      fontWeight: '700',
      color: '#3563C9',
    },

    unit: {
      fontSize: 14,
      fontWeight: '600',
      color: '#687386',
    },

    dateGuide: {
      marginTop: 6,
      fontSize: 11,
      color: '#98A2B3',
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
      fontWeight: '700',
    },
  });