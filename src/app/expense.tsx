import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const BUDGET_KEY = 'budget-settings';
const EXPENSES_KEY = 'expenses';

type BudgetSettings = {
  monthlyBudget: number;
  fixedExpense: number;
  savingGoal: number;
  spentAmount: number;
  remainingDays: number;
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  createdAt: string;
};

export default function ExpenseScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const saveExpense = async () => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return;
    }

    try {
      const savedExpenses = await AsyncStorage.getItem(EXPENSES_KEY);
      const expenses: Expense[] = savedExpenses
        ? JSON.parse(savedExpenses)
        : [];

      const newExpense: Expense = {
        id: Date.now().toString(),
        title: title.trim() || '지출',
        amount: numericAmount,
        createdAt: new Date().toISOString(),
      };

      const updatedExpenses = [newExpense, ...expenses];

      await AsyncStorage.setItem(
        EXPENSES_KEY,
        JSON.stringify(updatedExpenses)
      );

      const savedBudget = await AsyncStorage.getItem(BUDGET_KEY);

      if (savedBudget) {
        const budget: BudgetSettings = JSON.parse(savedBudget);

        const updatedBudget = {
          ...budget,
          spentAmount: budget.spentAmount + numericAmount,
        };

        await AsyncStorage.setItem(
          BUDGET_KEY,
          JSON.stringify(updatedBudget)
        );
      }

      router.back();
    } catch (error) {
      console.error('지출 저장 실패:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>지출 기록</Text>
      <Text style={styles.description}>
        오늘 사용한 금액을 입력해주세요.
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>어디에 썼나요?</Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="예: 점심"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>얼마를 썼나요?</Text>

          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="8500"
            keyboardType="numeric"
          />
        </View>
      </View>

      <Pressable
        style={styles.saveButton}
        onPress={saveExpense}
      >
        <Text style={styles.saveButtonText}>저장하기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
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

  form: {
    marginTop: 40,
    gap: 24,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
  },

  saveButton: {
    marginTop: 40,
    backgroundColor: '#111111',
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