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
  const [investmentAmount, setInvestmentAmount] = useState('');

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);

  const [fixedTitle, setFixedTitle] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [showFixedForm, setShowFixedForm] = useState(false);

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

      setInvestmentAmount(
        data.investmentAmount
          ? Number(data.investmentAmount).toLocaleString('ko-KR')
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

  const availableMonthlyAmount = parseMoney(monthlyBudget);
  const savingGoalAmount = parseMoney(savingGoal);
  const investmentAmountValue = parseMoney(investmentAmount);

  const livingBudget = Math.max(
    0,
    availableMonthlyAmount -
      savingGoalAmount -
      investmentAmountValue -
      totalFixedExpense
  );

  const isBudgetOverAllocated =
    availableMonthlyAmount > 0 &&
    savingGoalAmount +
      investmentAmountValue +
      totalFixedExpense >
      availableMonthlyAmount;

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
    setShowFixedForm(false);
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
      investmentAmount: parseMoney(investmentAmount),

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

      router.replace('/(tabs)');
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
        description="이번 달에 실제로 사용할 돈을 기준으로 생활비를 계산해보세요."
      />

      <View style={styles.form}>
        {/* 이번 달 사용 가능 금액 */}
        <MoneyInput
          label="이번 달 사용 가능 금액"
          description="생활비, 고정지출, 저축에 사용할 수 있는 전체 금액이에요."
          value={monthlyBudget}
          onChangeText={(text) =>
            setMonthlyBudget(formatMoneyInput(text))
          }
          placeholder="1,920,000"
        />

        <View style={styles.helperBox}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color="#687386"
          />

          <Text style={styles.helperText}>
            월급과 꼭 같을 필요는 없어요. 이번 달에 실제로 관리할 금액만 입력하면 돼요.
          </Text>
        </View>

        {/* 저축 목표 */}
        <MoneyInput
          label="저축 목표"
          optional
          description="이번 달 사용하지 않고 따로 모아둘 금액이에요."
          value={savingGoal}
          onChangeText={(text) =>
            setSavingGoal(formatMoneyInput(text))
          }
          placeholder="0"
        />

        {/* 투자 금액 */}
        <MoneyInput
          label="투자 금액"
          optional
          description="이번 달 투자에 사용할 금액이에요."
          value={investmentAmount}
          onChangeText={(text) =>
            setInvestmentAmount(formatMoneyInput(text))
          }
          placeholder="0"
        />

        {/* 고정지출 */}
        <View style={styles.fixedSection}>
          <View style={styles.fixedHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                고정지출
              </Text>

              <Text style={styles.sectionDescription}>
                월세, 통신비처럼 꼭 나가는 비용만 등록하면 돼요. 등록하지 않아도 괜찮아요.
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

          {/* 고정지출 추가 버튼 */}
          {!showFixedForm && (
            <Pressable
              style={({ pressed }) => [
                styles.openAddFixedButton,
                pressed && styles.openAddFixedButtonPressed,
              ]}
              onPress={() => setShowFixedForm(true)}
            >
              <Ionicons
                name="add"
                size={18}
                color="#3563C9"
              />

              <Text style={styles.openAddFixedButtonText}>
                고정지출 추가
              </Text>
            </Pressable>
          )}

          {/* 고정지출 추가 폼 */}
          {showFixedForm && (
            <View style={styles.addBox}>
              <View style={styles.addBoxHeader}>
                <Text style={styles.addTitle}>
                  고정지출 추가
                </Text>

                <Pressable
                  style={styles.addBoxCloseButton}
                  onPress={() => {
                    setShowFixedForm(false);
                    setFixedTitle('');
                    setFixedAmount('');
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name="close"
                    size={19}
                    color="#98A2B3"
                  />
                </Pressable>
              </View>

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
          )}

          {/* 총 고정지출 */}
          <View style={styles.totalFixedRow}>
            <Text style={styles.totalFixedLabel}>
              총 고정지출
            </Text>

            <Text style={styles.totalFixedAmount}>
              {formatMoney(totalFixedExpense)}원
            </Text>
          </View>
        </View>
      </View>

      {/* 이번 달 생활비 */}
      <View style={styles.livingBudgetCard}>
        <View style={styles.livingBudgetHeader}>
          <View>
            <Text style={styles.livingBudgetLabel}>
              이번 달 생활비
            </Text>

            <Text style={styles.livingBudgetDescription}>
              사용 가능 금액에서 저축, 투자, 고정지출을 제외한 금액이에요.
            </Text>
          </View>

          <View style={styles.livingBudgetIcon}>
            <Ionicons
              name="wallet-outline"
              size={20}
              color="#3563C9"
            />
          </View>
        </View>

        <Text
          style={[
            styles.livingBudgetAmount,
            isBudgetOverAllocated &&
              styles.livingBudgetAmountDanger,
          ]}
        >
          {formatMoney(livingBudget)}원
        </Text>

        <View style={styles.calculationBox}>
          <CalculationRow
            label="사용 가능 금액"
            value={availableMonthlyAmount}
            formatMoney={formatMoney}
          />

          <CalculationRow
            label="저축 목표"
            value={savingGoalAmount}
            formatMoney={formatMoney}
            minus
          />

          <CalculationRow
            label="투자 금액"
            value={investmentAmountValue}
            formatMoney={formatMoney}
            minus
          />

          <CalculationRow
            label="고정지출"
            value={totalFixedExpense}
            formatMoney={formatMoney}
            minus
          />
        </View>

        {isBudgetOverAllocated && (
          <View style={styles.warningBox}>
            <Ionicons
              name="alert-circle-outline"
              size={17}
              color="#C94A4A"
            />

            <Text style={styles.warningText}>
              저축 목표, 투자 금액, 고정지출의 합이 사용 가능 금액보다 커요. 금액을 다시 확인해주세요.
            </Text>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          isBudgetOverAllocated &&
            styles.saveButtonDisabled,
          pressed &&
            !isBudgetOverAllocated &&
            styles.saveButtonPressed,
        ]}
        onPress={
          isBudgetOverAllocated
            ? undefined
            : saveSettings
        }
        disabled={isBudgetOverAllocated}
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
  description?: string;
  optional?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

function MoneyInput({
  label,
  description,
  optional = false,
  value,
  onChangeText,
  placeholder,
}: MoneyInputProps) {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
        </Text>

        {optional && (
          <Text style={styles.optionalText}>
            선택
          </Text>
        )}
      </View>

      {description && (
        <Text style={styles.inputDescription}>
          {description}
        </Text>
      )}

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

function CalculationRow({
  label,
  value,
  formatMoney,
  minus = false,
}: {
  label: string;
  value: number;
  formatMoney: (amount: number) => string;
  minus?: boolean;
}) {
  return (
    <View style={styles.calculationRow}>
      <Text style={styles.calculationLabel}>
        {minus ? `- ${label}` : label}
      </Text>

      <Text style={styles.calculationValue}>
        {formatMoney(value)}원
      </Text>
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
    gap: 8,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  label: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  optionalText: {
    marginLeft: 7,
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
    color: '#98A2B3',
  },

  inputDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8792A2',
  },

  helperBox: {
    marginTop: -12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  helperText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 11,
    lineHeight: 17,
    color: '#687386',
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
    fontFamily: 'Pretendard-SemiBold',
    color: '#172033',
  },

  unitText: {
    marginLeft: 8,
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    color: '#687386',
  },

  fixedSection: {
    marginTop: 4,
  },

  fixedHeader: {
    marginBottom: 14,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Pretendard-ExtraBold',
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
    fontFamily: 'Pretendard-SemiBold',
    color: '#172033',
  },

  fixedItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },

  fixedItemAmount: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
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

  openAddFixedButton: {
    marginTop: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E7ECF3',
  },

  openAddFixedButtonPressed: {
    backgroundColor: '#F1F5FC',
  },

  openAddFixedButtonText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#3563C9',
  },

  addBox: {
    marginTop: 12,
    backgroundColor: '#F1F5FC',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },

  addBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  addBoxCloseButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addTitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Bold',
    color: '#3563C9',
  },

  totalFixedRow: {
    marginTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },

  totalFixedLabel: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: '#687386',
  },

  totalFixedAmount: {
    fontSize: 15,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#3563C9',
  },

  livingBudgetCard: {
    marginTop: 28,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDF0F4',
  },

  livingBudgetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  livingBudgetLabel: {
    fontSize: 16,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#172033',
  },

  livingBudgetDescription: {
    maxWidth: 300,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: '#8792A2',
  },

  livingBudgetIcon: {
    width: 38,
    height: 38,
    marginLeft: 12,
    borderRadius: 12,
    backgroundColor: '#EAF0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  livingBudgetAmount: {
    marginTop: 18,
    fontSize: 28,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#3563C9',
  },

  livingBudgetAmountDanger: {
    color: '#C94A4A',
  },

  calculationBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E9EDF3',
    gap: 9,
  },

  calculationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  calculationLabel: {
    fontSize: 12,
    color: '#8792A2',
  },

  calculationValue: {
    fontSize: 12,
    fontFamily: 'Pretendard-Bold',
    color: '#687386',
  },

  warningBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3F3',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  warningText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 11,
    lineHeight: 17,
    color: '#B64545',
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

  saveButtonDisabled: {
    backgroundColor: '#B8C5DE',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
  },
});