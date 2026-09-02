import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

type FixedExpense = {
  id: string;
  title: string;
  amount: number;
};

export default function SettingsScreen() {
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [savingGoal, setSavingGoal] = useState('');

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);

  const [fixedTitle, setFixedTitle] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');

  const [originalData, setOriginalData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

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

      if (!saved) {
        return;
      }

      const data = JSON.parse(saved);

      setOriginalData(data);

      setMonthlyBudget(
        data.monthlyBudget
          ? Number(data.monthlyBudget).toLocaleString('ko-KR')
          : ''
      );

      setSavingGoal(
        data.savingGoal
          ? Number(data.savingGoal).toLocaleString('ko-KR')
          : ''
      );

      // 새 구조의 고정지출 목록이 있으면 그대로 사용
      if (
        Array.isArray(data.fixedExpenses) &&
        data.fixedExpenses.length > 0
      ) {
        setFixedExpenses(data.fixedExpenses);
        return;
      }

      // 기존 fixedExpense 숫자 데이터가 있다면 자동 변환
      if (Number(data.fixedExpense) > 0) {
        setFixedExpenses([
          {
            id: 'legacy-fixed-expense',
            title: '기존 고정비',
            amount: Number(data.fixedExpense),
          },
        ]);
      }
    } catch (error) {
      console.error('예산 불러오기 실패:', error);
    }
  };

  const totalFixedExpense = useMemo(() => {
    return fixedExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
  }, [fixedExpenses]);

  const addFixedExpense = () => {
    const title = fixedTitle.trim();
    const amount = parseMoney(fixedAmount);

    if (!title || amount <= 0) {
      return;
    }

    const newExpense: FixedExpense = {
      id: `${Date.now()}-${Math.random()}`,
      title,
      amount,
    };

    setFixedExpenses((prev) => [
      ...prev,
      newExpense,
    ]);

    setFixedTitle('');
    setFixedAmount('');
  };

  const deleteFixedExpense = (id: string) => {
    setFixedExpenses((prev) =>
      prev.filter((expense) => expense.id !== id)
    );
  };

  const saveSettings = async () => {
    const updatedData = {
      // payday, paydayType, spentAmount 등
      // 기존 데이터는 그대로 보존
      ...originalData,

      monthlyBudget: parseMoney(monthlyBudget),
      savingGoal: parseMoney(savingGoal),

      // 상세 데이터
      fixedExpenses,

      // 기존 홈 계산 코드와 호환하기 위한 총액
      fixedExpense: totalFixedExpense,
    };

    try {
      await AsyncStorage.setItem(
        BUDGET_KEY,
        JSON.stringify(updatedData)
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
        description="한 달 동안 사용할 예산을 관리해보세요."
      />

      <View style={styles.form}>
        {/* 월 예산 */}
        <MoneyInput
          label="월 예산"
          value={monthlyBudget}
          onChangeText={(text) =>
            setMonthlyBudget(formatMoneyInput(text))
          }
          placeholder="1,920,000"
        />

        {/* 저축 목표 */}
        <MoneyInput
          label="저축 목표"
          value={savingGoal}
          onChangeText={(text) =>
            setSavingGoal(formatMoneyInput(text))
          }
          placeholder="300,000"
        />

        {/* 고정지출 */}
        <View style={styles.fixedSection}>
          <View style={styles.fixedHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                고정지출
              </Text>

              <Text style={styles.sectionDescription}>
                매달 정기적으로 나가는 비용을 등록해보세요.
              </Text>
            </View>
          </View>

          {/* 등록된 고정지출 */}
          {fixedExpenses.length > 0 && (
            <View style={styles.fixedList}>
              {fixedExpenses.map((expense) => (
                <View
                  key={expense.id}
                  style={styles.fixedItem}
                >
                  <View style={styles.fixedItemLeft}>
                    <View style={styles.fixedIcon}>
                      <Ionicons
                        name="repeat-outline"
                        size={18}
                        color="#3563C9"
                      />
                    </View>

                    <Text style={styles.fixedItemTitle}>
                      {expense.title}
                    </Text>
                  </View>

                  <View style={styles.fixedItemRight}>
                    <Text style={styles.fixedItemAmount}>
                      {formatMoney(expense.amount)}원
                    </Text>

                    <Pressable
                      style={styles.deleteButton}
                      onPress={() =>
                        deleteFixedExpense(expense.id)
                      }
                      hitSlop={8}
                    >
                      <Ionicons
                        name="close"
                        size={19}
                        color="#98A2B3"
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {fixedExpenses.length === 0 && (
            <View style={styles.emptyFixed}>
              <Text style={styles.emptyFixedText}>
                아직 등록한 고정지출이 없어요.
              </Text>
            </View>
          )}

          {/* 고정지출 추가 */}
          <View style={styles.addBox}>
            <Text style={styles.addTitle}>
              고정지출 추가
            </Text>

            <TextInput
              style={styles.titleInput}
              value={fixedTitle}
              onChangeText={setFixedTitle}
              placeholder="예: 월세, 통신비, 보험료"
            />

            <View style={styles.amountInputBox}>
              <TextInput
                style={styles.amountInput}
                value={fixedAmount}
                onChangeText={(text) =>
                  setFixedAmount(formatMoneyInput(text))
                }
                placeholder="0"
                keyboardType="numeric"
              />

              <Text style={styles.unitText}>
                원
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
              onPress={addFixedExpense}
            >
              <Ionicons
                name="add"
                size={20}
                color="#3563C9"
              />

              <Text style={styles.addButtonText}>
                추가하기
              </Text>
            </Pressable>
          </View>

          {/* 총 고정지출 */}
          <View style={styles.totalFixedBox}>
            <Text style={styles.totalFixedLabel}>
              총 고정지출
            </Text>

            <Text style={styles.totalFixedAmount}>
              {formatMoney(totalFixedExpense)}원
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
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 50,
  },

  form: {
    gap: 26,
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

  unitText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#687386',
  },

  fixedSection: {
    marginTop: 4,
  },

  fixedHeader: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172033',
  },

  sectionDescription: {
    marginTop: 5,
    fontSize: 13,
    color: '#8792A2',
  },

  fixedList: {
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
  },

  fixedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },

  fixedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  fixedIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF3FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  fixedItemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#172033',
  },

  fixedItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },

  fixedItemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
  },

  deleteButton: {
    width: 32,
    height: 32,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyFixed: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
  },

  emptyFixedText: {
    fontSize: 13,
    color: '#98A2B3',
  },

  addBox: {
    marginTop: 14,
    backgroundColor: '#F1F5FC',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },

  addTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 2,
  },

  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 15,
    color: '#172033',
  },

  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 15,
  },

  amountInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#172033',
  },

  addButton: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
  },

  addButtonPressed: {
    backgroundColor: '#E7EEFC',
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3563C9',
  },

  totalFixedBox: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5FC',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 17,
  },

  totalFixedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687386',
  },

  totalFixedAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3563C9',
  },

  saveButton: {
    marginTop: 34,
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