import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
  category?: string;
  createdAt: string;
};

type CategoryInfo = {
  id: string;
  label: string;
  emoji: string;
};

const CATEGORIES: CategoryInfo[] = [
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

export default function StatsScreen() {
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
      console.error('통계 불러오기 실패:', error);
    }
  };

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth();

    return expenses.filter((expense) => {
      const date = new Date(expense.createdAt);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    });
  }, [expenses]);

  const totalExpense = useMemo(() => {
    return currentMonthExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
  }, [currentMonthExpenses]);

  const categoryStats = useMemo(() => {
    return CATEGORIES.map((category) => {
      const amount = currentMonthExpenses
        .filter(
          (expense) =>
            (expense.category ?? 'etc') === category.id
        )
        .reduce(
          (sum, expense) => sum + expense.amount,
          0
        );

      const percentage =
        totalExpense > 0
          ? Math.round((amount / totalExpense) * 100)
          : 0;

      return {
        ...category,
        amount,
        percentage,
      };
    })
      .filter((category) => category.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthExpenses, totalExpense]);

  const topCategory =
    categoryStats.length > 0
      ? categoryStats[0]
      : null;

  const averageExpense =
    currentMonthExpenses.length > 0
      ? Math.floor(
          totalExpense /
            currentMonthExpenses.length
        )
      : 0;

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  const now = new Date();

  const monthText =
    now.getMonth() + 1;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        소비 통계
      </Text>

      <Text style={styles.description}>
        {monthText}월 소비 흐름을 확인해보세요.
      </Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>
          이번 달 총 지출
        </Text>

        <Text style={styles.totalAmount}>
          {formatMoney(totalExpense)}원
        </Text>

        <Text style={styles.totalDescription}>
          총 {currentMonthExpenses.length}건을 기록했어요.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            가장 많이 쓴 곳
          </Text>

          <Text style={styles.summaryValue}>
            {topCategory
              ? `${topCategory.emoji} ${topCategory.label}`
              : '-'}
          </Text>

          {topCategory && (
            <Text style={styles.summarySubText}>
              {formatMoney(topCategory.amount)}원
            </Text>
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            건당 평균
          </Text>

          <Text style={styles.summaryValue}>
            {formatMoney(averageExpense)}원
          </Text>

          <Text style={styles.summarySubText}>
            평균 지출 금액
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          카테고리별 소비
        </Text>

        {categoryStats.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              📊
            </Text>

            <Text style={styles.emptyTitle}>
              아직 통계가 없어요
            </Text>

            <Text style={styles.emptyDescription}>
              지출을 기록하면 카테고리별 소비를 보여드려요.
            </Text>
          </View>
        ) : (
          <View style={styles.categoryList}>
            {categoryStats.map((category) => (
              <View
                key={category.id}
                style={styles.categoryItem}
              >
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryLeft}>
                    <View style={styles.categoryIcon}>
                      <Text style={styles.categoryEmoji}>
                        {category.emoji}
                      </Text>
                    </View>

                    <View>
                      <Text style={styles.categoryName}>
                        {category.label}
                      </Text>

                      <Text style={styles.categoryPercentage}>
                        {category.percentage}%
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.categoryAmount}>
                    {formatMoney(category.amount)}원
                  </Text>
                </View>

                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${category.percentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
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

  totalCard: {
    marginTop: 28,
    backgroundColor: '#F1F5FC',
    borderRadius: 22,
    padding: 22,
  },

  totalLabel: {
    fontSize: 14,
    color: '#687386',
  },

  totalAmount: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '800',
    color: '#3563C9',
  },

  totalDescription: {
    marginTop: 8,
    fontSize: 13,
    color: '#8792A2',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#8792A2',
  },

  summaryValue: {
    marginTop: 9,
    fontSize: 17,
    fontWeight: '700',
    color: '#172033',
  },

  summarySubText: {
    marginTop: 5,
    fontSize: 12,
    color: '#98A2B3',
  },

  section: {
    marginTop: 32,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172033',
  },

  categoryList: {
    marginTop: 18,
    gap: 22,
  },

  categoryItem: {
    gap: 12,
  },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  categoryEmoji: {
    fontSize: 20,
  },

  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  categoryPercentage: {
    marginTop: 3,
    fontSize: 12,
    color: '#8792A2',
  },

  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  progressBackground: {
    height: 7,
    backgroundColor: '#EEF1F5',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#3563C9',
    borderRadius: 999,
  },

  empty: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 50,
  },

  emptyEmoji: {
    fontSize: 36,
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
    color: '#8792A2',
    textAlign: 'center',
  },
});