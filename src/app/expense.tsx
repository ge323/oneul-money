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

type Category = {
  id: string;
  label: string;
  emoji: string;
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
};

const CATEGORIES: Category[] = [
  {
    id: 'food',
    label: '식비',
    emoji: '🍚',
  },
  {
    id: 'cafe',
    label: '카페',
    emoji: '☕',
  },
  {
    id: 'transport',
    label: '교통',
    emoji: '🚇',
  },
  {
    id: 'shopping',
    label: '쇼핑',
    emoji: '🛍️',
  },
  {
    id: 'leisure',
    label: '여가',
    emoji: '🎮',
  },
  {
    id: 'life',
    label: '생활',
    emoji: '🏠',
  },
  {
    id: 'etc',
    label: '기타',
    emoji: '📦',
  },
];

export default function ExpenseScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');

  const handleAmountChange = (text: string) => {
    const numbersOnly = text.replace(/[^0-9]/g, '');

    if (!numbersOnly) {
      setAmount('');
      return;
    }

    const numericValue = Number(numbersOnly);

    setAmount(
      numericValue.toLocaleString('ko-KR')
    );
  };

  const saveExpense = async () => {
    const numericAmount = Number(
      amount.replace(/,/g, '')
    );

    if (!numericAmount || numericAmount <= 0) {
      return;
    }

    try {
      const savedExpenses =
        await AsyncStorage.getItem(EXPENSES_KEY);

      const expenses: Expense[] = savedExpenses
        ? JSON.parse(savedExpenses)
        : [];

      const newExpense: Expense = {
        id: Date.now().toString(),
        title: title.trim() || '지출',
        amount: numericAmount,
        category,
        createdAt: new Date().toISOString(),
      };

      const updatedExpenses = [
        newExpense,
        ...expenses,
      ];

      await AsyncStorage.setItem(
        EXPENSES_KEY,
        JSON.stringify(updatedExpenses)
      );

      const savedBudget =
        await AsyncStorage.getItem(BUDGET_KEY);

      if (savedBudget) {
        const budget: BudgetSettings =
          JSON.parse(savedBudget);

        const updatedBudget = {
          ...budget,
          spentAmount:
            budget.spentAmount + numericAmount,
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
      <Text style={styles.title}>
        지출 기록
      </Text>

      <Text style={styles.description}>
        오늘 사용한 금액을 기록해보세요.
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            얼마를 썼나요?
          </Text>

          <View style={styles.amountInputBox}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0"
              keyboardType="numeric"
            />

            <Text style={styles.wonText}>
              원
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            어디에 썼나요?
          </Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="예: 점심"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            카테고리
          </Text>

          <View style={styles.categoryContainer}>
            {CATEGORIES.map((item) => {
              const isSelected =
                category === item.id;

              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.categoryButton,
                    isSelected &&
                      styles.categoryButtonSelected,
                  ]}
                  onPress={() =>
                    setCategory(item.id)
                  }
                >
                  <Text
                    style={styles.categoryEmoji}
                  >
                    {item.emoji}
                  </Text>

                  <Text
                    style={[
                      styles.categoryText,
                      isSelected &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Pressable
        style={styles.saveButton}
        onPress={saveExpense}
      >
        <Text style={styles.saveButtonText}>
          기록하기
        </Text>
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
    color: '#172033',
  },

  description: {
    marginTop: 8,
    fontSize: 15,
    color: '#687386',
  },

  form: {
    marginTop: 36,
    gap: 28,
  },

  inputGroup: {
    gap: 10,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5FC',
    borderRadius: 16,
    paddingHorizontal: 18,
  },

  amountInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '800',
    color: '#3563C9',
  },

  wonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#687386',
  },

  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#172033',
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  categoryButtonSelected: {
    backgroundColor: '#E7EEFC',
  },

  categoryEmoji: {
    fontSize: 18,
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687386',
  },

  categoryTextSelected: {
    color: '#3563C9',
    fontWeight: '700',
  },

  saveButton: {
    marginTop: 36,
    backgroundColor: '#3563C9',
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