import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '../../components/AppHeader';

const EXPENSES_KEY = 'expenses';
const BUDGET_KEY = 'budget-settings';

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
  remainingDays: number;
};

const CATEGORY_EMOJI: Record<string, string> = {
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
  const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const loadExpenses = async () => {
    try {
      const saved = await AsyncStorage.getItem(EXPENSES_KEY);

      if (!saved) {
        setExpenses([]);
        return;
      }

      setExpenses(JSON.parse(saved));
    } catch (error) {
      console.error('지출 내역 불러오기 실패:', error);
    }
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryEmoji = (category?: string) => {
    if (!category) {
      return '💳';
    }

    return CATEGORY_EMOJI[category] ?? '💳';
  };

  // 지출 삭제
  const deleteExpense = async (expense: Expense) => {
    try {
      // 1. 지출 목록에서 제거
      const updatedExpenses = expenses.filter(
        (item) => item.id !== expense.id
      );

      await AsyncStorage.setItem(
        EXPENSES_KEY,
        JSON.stringify(updatedExpenses)
      );

      // 2. 홈 화면의 총 사용 금액도 복구
      const savedBudget = await AsyncStorage.getItem(BUDGET_KEY);

      if (savedBudget) {
        const budget: BudgetSettings = JSON.parse(savedBudget);

        const updatedBudget: BudgetSettings = {
          ...budget,
          spentAmount: Math.max(
            0,
            budget.spentAmount - expense.amount
          ),
        };

        await AsyncStorage.setItem(
          BUDGET_KEY,
          JSON.stringify(updatedBudget)
        );
      }

      // 3. 화면 즉시 갱신
      setExpenses(updatedExpenses);
      setOpenedMenuId(null);
    } catch (error) {
      console.error('지출 삭제 실패:', error);
    }
  };

  // 삭제 확인
  const confirmDelete = (expense: Expense) => {
    // Expo Web
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `${expense.title} 지출 내역을 삭제할까요?\n\n${formatMoney(
          expense.amount
        )}원`
      );

      if (confirmed) {
        deleteExpense(expense);
      }

      return;
    }

    // iOS / Android
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
          onPress: () => deleteExpense(expense),
        },
      ]
    );
  };

  const editExpense = (expense: Expense) => {
    setOpenedMenuId(null);

    router.push({
      pathname: '/expense',
      params: {
        id: expense.id,
      },
    });
  };

  const totalExpense = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader
        title="지출 내역"
        description="지금까지 기록한 소비를 확인해보세요."
      />

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>총 지출</Text>

        <Text style={styles.totalAmount}>
          {formatMoney(totalExpense)}원
        </Text>

        <Text style={styles.totalDescription}>
          총 {expenses.length}건의 지출을 기록했어요.
        </Text>
      </View>

      <View style={styles.list}>
        {expenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧾</Text>

            <Text style={styles.emptyTitle}>
              아직 지출 내역이 없어요
            </Text>

            <Text style={styles.emptyText}>
              지출을 기록하면 이곳에서 확인할 수 있어요.
            </Text>
          </View>
        ) : (
          expenses.map((expense) => {
            const isMenuOpen =
              openedMenuId === expense.id;

            return (
              <View
                key={expense.id}
                style={styles.expenseWrapper}
              >
                <View style={styles.expenseItem}>
                  <View style={styles.leftArea}>
                    <View style={styles.categoryIcon}>
                      <Text style={styles.categoryEmoji}>
                        {getCategoryEmoji(expense.category)}
                      </Text>
                    </View>

                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle}>
                        {expense.title}
                      </Text>

                      <Text style={styles.expenseDate}>
                        {formatDate(expense.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rightArea}>
                    <Text style={styles.expenseAmount}>
                      -{formatMoney(expense.amount)}원
                    </Text>

                    <Pressable
                      style={styles.menuButton}
                      onPress={() =>
                        setOpenedMenuId(
                          isMenuOpen ? null : expense.id
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
                </View>

                {isMenuOpen && (
                  <View style={styles.menu}>
                    <Pressable
                      style={styles.menuItem}
                      onPress={() => editExpense(expense)}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={18}
                        color="#172033"
                      />

                      <Text style={styles.menuText}>
                        수정하기
                      </Text>
                    </Pressable>

                    <View style={styles.menuDivider} />

                    <Pressable
                      style={styles.menuItem}
                      onPress={() => confirmDelete(expense)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#D84B4B"
                      />

                      <Text style={styles.deleteText}>
                        삭제하기
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },

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

  list: {
    marginTop: 28,
  },

  expenseWrapper: {
    position: 'relative',
  },

  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },

  leftArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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

  expenseDate: {
    marginTop: 5,
    fontSize: 13,
    color: '#8792A2',
  },

  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },

  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172033',
  },

  menuButton: {
    width: 34,
    height: 34,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menu: {
    alignSelf: 'flex-end',
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    marginTop: 4,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
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
    fontSize: 14,
    color: '#8792A2',
    textAlign: 'center',
  },
});