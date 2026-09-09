import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '../components/AppHeader';
import {
  ensureCurrentMonthBudget,
  saveBudgetForMonth,
} from '../utils/monthly-budgets';

const BUDGET_KEY = 'budget-settings';

type BudgetSettings = {
  monthlyBudget?: number;
  savingGoal?: number;
  investmentAmount?: number;
  fixedExpense?: number;
  fixedExpenses?: unknown[];
  spentAmount?: number;
  budgetMode?: 'simple';
  [key: string]: any;
};

export default function SettingsScreen() {
  const [monthlyBudget, setMonthlyBudget] =
    useState('');

  const [originalData, setOriginalData] =
    useState<BudgetSettings>({});

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const formatMoneyInput = (
    text: string
  ) => {
    const numbersOnly =
      text.replace(/[^0-9]/g, '');

    if (!numbersOnly) {
      return '';
    }

    return Number(
      numbersOnly
    ).toLocaleString('ko-KR');
  };

  const parseMoney = (
    text: string
  ) => {
    return (
      Number(
        text.replace(/,/g, '')
      ) || 0
    );
  };

  const getLegacyBudget = (
    data: BudgetSettings
  ) => {
    if (
      data.budgetMode === 'simple'
    ) {
      return (
        Number(
          data.monthlyBudget
        ) || 0
      );
    }

    return Math.max(
      0,
      (Number(
        data.monthlyBudget
      ) || 0) -
        (Number(
          data.savingGoal
        ) || 0) -
        (Number(
          data.investmentAmount
        ) || 0) -
        (Number(
          data.fixedExpense
        ) || 0)
    );
  };

  const loadSettings = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(
          BUDGET_KEY
        );

      const legacyData:
        BudgetSettings = saved
        ? JSON.parse(saved)
        : {};

      setOriginalData(
        legacyData
      );

      const fallbackBudget =
        getLegacyBudget(
          legacyData
        );

      /*
       * 이번 달 예산이 이미 있으면 그 값을 사용하고,
       * 없다면 가장 최근 월의 예산을 자동으로 이어받습니다.
       *
       * 월별 예산 데이터 자체가 아직 한 번도 만들어지지 않았다면
       * 기존 budget-settings의 값으로 최초 마이그레이션합니다.
       */
      const currentBudget =
        await ensureCurrentMonthBudget(
          fallbackBudget
        );

      setMonthlyBudget(
        currentBudget > 0
          ? currentBudget.toLocaleString(
              'ko-KR'
            )
          : ''
      );
    } catch (error) {
      console.error(
        '예산 불러오기 실패:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const budgetAmount =
    parseMoney(
      monthlyBudget
    );

  const canSave =
    !isLoading &&
    budgetAmount > 0;

  const saveSettings = async () => {
    if (!canSave) {
      return;
    }

    try {
      /*
       * 1) 현재 달의 예산을 월별 예산 저장소에 기록
       */
      await saveBudgetForMonth(
        budgetAmount
      );

      /*
       * 2) 기존 화면들과의 호환을 위해
       *    budget-settings에도 현재 예산을 동기화
       *
       * 홈 / 계획 / 내역 화면을 모두 월별 예산 방식으로
       * 변경한 뒤에는 이 호환 저장은 제거할 수 있습니다.
       */
      const updatedData:
        BudgetSettings = {
        ...originalData,

        budgetMode: 'simple',

        monthlyBudget:
          budgetAmount,

        savingGoal: 0,

        investmentAmount: 0,

        fixedExpense: 0,

        fixedExpenses: [],
      };

      await AsyncStorage.setItem(
        BUDGET_KEY,
        JSON.stringify(
          updatedData
        )
      );

      router.replace(
        '/(tabs)'
      );
    } catch (error) {
      console.error(
        '예산 저장 실패:',
        error
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === 'ios'
            ? 'interactive'
            : 'on-drag'
        }
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
      >
        <AppHeader
          title="예산 설정"
          description="이번 달에 내가 사용하기로 정한 생활비만 입력해주세요."
        />

        <View style={styles.form}>
          <View
            style={
              styles.inputSection
            }
          >
            <Text
              style={
                styles.label
              }
            >
              이번 달 생활비 한도
            </Text>

            <View
              style={
                styles.moneyInputBox
              }
            >
              <TextInput
                style={
                  styles.moneyInput
                }
                value={
                  monthlyBudget
                }
                onChangeText={(
                  text
                ) =>
                  setMonthlyBudget(
                    formatMoneyInput(
                      text
                    )
                  )
                }
                placeholder="0"
                placeholderTextColor="#98A2B3"
                keyboardType="numeric"
                returnKeyType="done"
                selectionColor="#3563C9"
              />

              <Text
                style={
                  styles.unitText
                }
              >
                원
              </Text>
            </View>

            <View
              style={
                styles.helperRow
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#7292D8"
              />

              <Text
                style={
                  styles.helperText
                }
              >
                예: 이번 달에 40만 원만 쓰고 싶다면 400,000원
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,

            !canSave &&
              styles.saveButtonDisabled,

            pressed &&
              canSave &&
              styles.saveButtonPressed,
          ]}
          onPress={
            saveSettings
          }
        >
          <Text
            style={[
              styles.saveButtonText,

              !canSave &&
                styles.saveButtonTextDisabled,
            ]}
          >
            저장하기
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
    },

    container: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 64,
    },

    form: {
      marginTop: 4,
    },

    inputSection: {
      gap: 12,
    },

    label: {
      fontSize: 18,
      lineHeight: 25,
      fontFamily:
        'Pretendard-Bold',
      color: '#172033',
    },

    moneyInputBox: {
      minHeight: 68,
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#F1F5FC',
      borderRadius: 18,
      paddingHorizontal: 16,
    },

    moneyInput: {
      flex: 1,
      paddingVertical: 18,
      fontSize: 24,
      lineHeight: 31,
      fontFamily:
        'Pretendard-ExtraBold',
      color: '#3563C9',
    },

    unitText: {
      marginLeft: 8,
      fontSize: 16,
      lineHeight: 22,
      fontFamily:
        'Pretendard-Bold',
      color: '#566176',
    },

    helperRow: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 7,
      paddingHorizontal: 2,
      marginTop: 2,
    },

    helperText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      fontFamily:
        'Pretendard-Regular',
      color: '#687386',
    },

    saveButton: {
      marginTop: 28,
      minHeight: 58,
      backgroundColor:
        '#3563C9',
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    saveButtonDisabled: {
      backgroundColor:
        '#E3E8F0',
    },

    saveButtonPressed: {
      backgroundColor:
        '#294FA5',
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      lineHeight: 23,
      fontFamily:
        'Pretendard-Bold',
    },

    saveButtonTextDisabled: {
      color: '#98A2B3',
    },
  });
