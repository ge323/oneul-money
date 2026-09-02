import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const BUDGET_KEY = 'budget-settings';

type BudgetSettings = {
  monthlyBudget: number;
  fixedExpense: number;
  savingGoal: number;
  spentAmount: number;
  payday: number;
  paydayType?: 'date' | 'lastDay';
};

const DEFAULT_SETTINGS: BudgetSettings = {
  monthlyBudget: 1000000,
  fixedExpense: 400000,
  savingGoal: 200000,
  spentAmount: 100000,
  payday: 25,
  paydayType: 'date',
};

export default function HomeScreen() {
  const [settings, setSettings] =
    useState<BudgetSettings>(DEFAULT_SETTINGS);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(BUDGET_KEY);

      if (!saved) return;

      const data = JSON.parse(saved);

      setSettings({
        monthlyBudget:
          Number(data.monthlyBudget) || 0,

        fixedExpense:
          Number(data.fixedExpense) || 0,

        savingGoal:
          Number(data.savingGoal) || 0,

        spentAmount:
          Number(data.spentAmount) || 0,

        payday:
          Number(data.payday) || 25,

        paydayType:
          data.paydayType || 'date',
      });
    } catch (error) {
      console.error(
        '예산 불러오기 실패:',
        error
      );
    }
  };

  const getLastDay = (
    year: number,
    month: number
  ) => {
    return new Date(
      year,
      month + 1,
      0
    ).getDate();
  };

  const getRemainingDays = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth();
    const todayDate = today.getDate();

    let targetDate: Date;

    if (settings.paydayType === 'lastDay') {
      const thisMonthLastDay =
        getLastDay(year, month);

      if (todayDate < thisMonthLastDay) {
        targetDate = new Date(
          year,
          month,
          thisMonthLastDay
        );
      } else {
        const nextMonthLastDay =
          getLastDay(year, month + 1);

        targetDate = new Date(
          year,
          month + 1,
          nextMonthLastDay
        );
      }
    } else {
      const thisMonthPayday = Math.min(
        settings.payday,
        getLastDay(year, month)
      );

      if (todayDate < thisMonthPayday) {
        targetDate = new Date(
          year,
          month,
          thisMonthPayday
        );
      } else {
        const nextMonthPayday = Math.min(
          settings.payday,
          getLastDay(year, month + 1)
        );

        targetDate = new Date(
          year,
          month + 1,
          nextMonthPayday
        );
      }
    }

    const todayStart = new Date(
      year,
      month,
      todayDate
    );

    const difference =
      targetDate.getTime() -
      todayStart.getTime();

    const days = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

    return Math.max(days, 1);
  };

  const remainingDays =
    getRemainingDays();

  const remainingBudget = Math.max(
    0,
    settings.monthlyBudget -
      settings.fixedExpense -
      settings.savingGoal -
      settings.spentAmount
  );

  const dailyBudget =
    remainingDays > 0
      ? Math.floor(
          remainingBudget /
            remainingDays
        )
      : 0;

  const formatMoney = (
    amount: number
  ) => {
    return amount.toLocaleString(
      'ko-KR'
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        오늘 얼마 써도 돼?
      </Text>

      <View style={styles.main}>
        <Text style={styles.label}>
          오늘은
        </Text>

        <Text style={styles.amount}>
          {formatMoney(dailyBudget)}원
        </Text>

        <Text style={styles.description}>
          써도 괜찮아요
        </Text>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            남은 생활비
          </Text>

          <Text style={styles.infoValue}>
            {formatMoney(
              remainingBudget
            )}
            원
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            다음 월급일까지
          </Text>

          <Text style={styles.infoValue}>
            D-{remainingDays}
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.expenseButton,
          pressed &&
            styles.expenseButtonPressed,
        ]}
        onPress={() =>
          router.push('/expense')
        }
      >
        <Text
          style={
            styles.expenseButtonText
          }
        >
          + 지출 기록하기
        </Text>
      </Pressable>

      <Text style={styles.guide}>
        지출을 기록하면 오늘 쓸 수 있는
        금액이 자동으로 다시 계산돼요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172033',
  },

  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 18,
    color: '#687386',
    marginBottom: 12,
  },

  amount: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 12,
    color: '#3563C9',
  },

  description: {
    fontSize: 18,
    color: '#687386',
  },

  infoBox: {
    backgroundColor: '#F1F5FC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 18,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: 15,
    color: '#687386',
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  expenseButton: {
    backgroundColor: '#3563C9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  expenseButtonPressed: {
    backgroundColor: '#294FA5',
  },

  expenseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  guide: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#98A2B3',
    textAlign: 'center',
  },
});