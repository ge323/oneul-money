import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '../components/AppHeader';

const EXPENSES_KEY = 'expenses';

type Expense = {
  id: string;
  title: string;
  amount: number;
  category?: string;
  createdAt: string;
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

  const totalExpense = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const getCategoryEmoji = (category?: string) => {
    if (!category) return '💳';

    return CATEGORY_EMOJI[category] ?? '💳';
  };

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
        <Text style={styles.totalLabel}>
          총 지출
        </Text>

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
            <Text style={styles.emptyEmoji}>
              🧾
            </Text>

            <Text style={styles.emptyTitle}>
              아직 지출 내역이 없어요
            </Text>

            <Text style={styles.emptyText}>
              지출을 기록하면 이곳에서 확인할 수 있어요.
            </Text>
          </View>
        ) : (
          expenses.map((expense) => (
            <View
              key={expense.id}
              style={styles.expenseItem}
            >
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

              <Text style={styles.expenseAmount}>
                -{formatMoney(expense.amount)}원
              </Text>
            </View>
          ))
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

  expenseAmount: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#172033',
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