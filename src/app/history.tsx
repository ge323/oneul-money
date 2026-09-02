import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const EXPENSES_KEY = 'expenses';

type Expense = {
  id: string;
  title: string;
  amount: number;
  createdAt: string;
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
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const totalExpense = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>지출 내역</Text>

      <Text style={styles.description}>
        지금까지 기록한 소비를 확인해보세요.
      </Text>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>총 지출</Text>

        <Text style={styles.totalAmount}>
          {formatMoney(totalExpense)}원
        </Text>
      </View>

      <View style={styles.list}>
        {expenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              아직 기록한 지출이 없어요.
            </Text>
          </View>
        ) : (
          expenses.map((expense) => (
            <View
              key={expense.id}
              style={styles.expenseItem}
            >
              <View>
                <Text style={styles.expenseTitle}>
                  {expense.title}
                </Text>

                <Text style={styles.expenseDate}>
                  {formatDate(expense.createdAt)}
                </Text>
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
    paddingTop: 60,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
  },

  description: {
    marginTop: 8,
    fontSize: 15,
    color: '#777777',
  },

  totalBox: {
    marginTop: 32,
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 20,
  },

  totalLabel: {
    fontSize: 14,
    color: '#777777',
  },

  totalAmount: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '800',
  },

  list: {
    marginTop: 28,
  },

  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  expenseDate: {
    marginTop: 5,
    fontSize: 13,
    color: '#999999',
  },

  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyText: {
    fontSize: 15,
    color: '#999999',
  },
});