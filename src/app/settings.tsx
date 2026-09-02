import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '../components/AppHeader';

const BUDGET_KEY = 'budget-settings';

export default function SettingsScreen() {
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [fixedExpense, setFixedExpense] = useState('');
  const [savingGoal, setSavingGoal] = useState('');
  const [spentAmount, setSpentAmount] = useState('');
  const [remainingDays, setRemainingDays] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const formatMoneyInput = (text: string) => {
    const numbersOnly = text.replace(/[^0-9]/g, '');

    if (!numbersOnly) {
      return '';
    }

    return Number(numbersOnly).toLocaleString('ko-KR');
  };

  const parseMoney = (text: string) => {
    return Number(text.replace(/,/g, '')) || 0;
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(BUDGET_KEY);

      if (!saved) return;

      const data = JSON.parse(saved);

      setMonthlyBudget(
        Number(data.monthlyBudget ?? 0).toLocaleString('ko-KR')
      );

      setFixedExpense(
        Number(data.fixedExpense ?? 0).toLocaleString('ko-KR')
      );

      setSavingGoal(
        Number(data.savingGoal ?? 0).toLocaleString('ko-KR')
      );

      setSpentAmount(
        Number(data.spentAmount ?? 0).toLocaleString('ko-KR')
      );

      setRemainingDays(
        String(data.remainingDays ?? '')
      );
    } catch (error) {
      console.error('예산 불러오기 실패:', error);
    }
  };

  const saveSettings = async () => {
    const data = {
      monthlyBudget: parseMoney(monthlyBudget),
      fixedExpense: parseMoney(fixedExpense),
      savingGoal: parseMoney(savingGoal),
      spentAmount: parseMoney(spentAmount),
      remainingDays: Number(remainingDays) || 1,
    };

    try {
      await AsyncStorage.setItem(
        BUDGET_KEY,
        JSON.stringify(data)
      );

      router.back();
    } catch (error) {
      console.error('예산 저장 실패:', error);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader
        title="예산 설정"
        description="이번 달 예산 정보를 입력해주세요."
      />

      <View style={styles.form}>
        <MoneyInput
          label="월 예산"
          value={monthlyBudget}
          onChangeText={(text) =>
            setMonthlyBudget(formatMoneyInput(text))
          }
          placeholder="1,000,000"
        />

        <MoneyInput
          label="고정비"
          value={fixedExpense}
          onChangeText={(text) =>
            setFixedExpense(formatMoneyInput(text))
          }
          placeholder="400,000"
        />

        <MoneyInput
          label="저축 목표"
          value={savingGoal}
          onChangeText={(text) =>
            setSavingGoal(formatMoneyInput(text))
          }
          placeholder="200,000"
        />

        <MoneyInput
          label="이미 사용한 금액"
          value={spentAmount}
          onChangeText={(text) =>
            setSpentAmount(formatMoneyInput(text))
          }
          placeholder="100,000"
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            남은 일수
          </Text>

          <View style={styles.daysInputBox}>
            <TextInput
              style={styles.daysInput}
              value={remainingDays}
              onChangeText={(text) =>
                setRemainingDays(
                  text.replace(/[^0-9]/g, '')
                )
              }
              placeholder="10"
              keyboardType="numeric"
            />

            <Text style={styles.unitText}>
              일
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          pressed && styles.saveButtonPressed,
        ]}
        onPress={saveSettings}
      >
        <Text style={styles.saveButtonText}>
          저장하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}

type MoneyInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

function MoneyInput({
  label,
  value,
  onChangeText,
  placeholder,
}: MoneyInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View style={styles.moneyInputBox}>
        <TextInput
          style={styles.moneyInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType="numeric"
        />

        <Text style={styles.unitText}>
          원
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },

  form: {
    gap: 24,
  },

  inputGroup: {
    gap: 9,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  moneyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  moneyInput: {
    flex: 1,
    paddingVertical: 17,
    fontSize: 17,
    fontWeight: '600',
    color: '#172033',
  },

  daysInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  daysInput: {
    flex: 1,
    paddingVertical: 17,
    fontSize: 17,
    fontWeight: '600',
    color: '#172033',
  },

  unitText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#687386',
  },

  saveButton: {
    marginTop: 36,
    backgroundColor: '#3563C9',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },

  saveButtonPressed: {
    backgroundColor: '#294FA5',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});