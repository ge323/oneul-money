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
  remainingDays: number;
};

const DEFAULT_SETTINGS: BudgetSettings = {
  monthlyBudget: 1000000,
  fixedExpense: 400000,
  savingGoal: 200000,
  spentAmount: 100000,
  remainingDays: 10,
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
      const saved = await AsyncStorage.getItem(BUDGET_KEY);

      if (!saved) return;

      setSettings(JSON.parse(saved));
    } catch (error) {
      console.error('예산 불러오기 실패:', error);
    }
  };

  const remainingBudget = Math.max(
    0,
    settings.monthlyBudget -
      settings.fixedExpense -
      settings.savingGoal -
      settings.spentAmount
  );

  const dailyBudget =
    settings.remainingDays > 0
      ? Math.floor(
          remainingBudget / settings.remainingDays
        )
      : 0;

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ko-KR');
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
            이번 달 남은 생활비
          </Text>

          <Text style={styles.infoValue}>
            {formatMoney(remainingBudget)}원
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            남은 기간
          </Text>

          <Text style={styles.infoValue}>
            D-{settings.remainingDays}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.expenseButton}
        onPress={() => router.push('./expense')}
      >
        <Text style={styles.expenseButtonText}>
          + 지출 기록하기
        </Text>
      </Pressable>
      
      <Pressable
      style={styles.historyButton}
      onPress={() => router.push('/history')}
    >
      <Text style={styles.historyButtonText}>
        지출 내역 보기
      </Text>
    </Pressable>

      <Pressable
        style={styles.settingButton}
        onPress={() => router.push('/settings')}
      >
        <Text style={styles.settingButtonText}>
          예산 설정하기
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
    fontSize: 22,
    fontWeight: '700',
  },

  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 18,
    color: '#777777',
    marginBottom: 12,
  },

  amount: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 12,
  },

  description: {
    fontSize: 18,
    color: '#777777',
  },

  infoBox: {
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 18,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  infoLabel: {
    fontSize: 15,
    color: '#777777',
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  expenseButton: {
    backgroundColor: '#F2F2F2',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },

  expenseButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },

  settingButton: {
    backgroundColor: '#111111',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },

  settingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  historyButton: {
  paddingVertical: 14,
  alignItems: 'center',
  marginBottom: 10,
  },

  historyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555555',
  },
});