import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '../components/AppHeader';
import Screen from '../components/screen';
import {
  ensureCurrentMonthBudget,
  saveBudgetForMonth,
} from '../utils/monthly-budgets';

const SKIP_MONTHLY_NOTICE_ONCE_KEY =
  'skip-monthly-budget-notice-once';

export default function SettingsScreen() {
  const [
    monthlyBudget,
    setMonthlyBudget,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    showResetModal,
    setShowResetModal,
  ] = useState(false);

  const [
    hasExistingData,
    setHasExistingData,
  ] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const formatMoneyInput = (
    text: string
  ) => {
    const numbersOnly =
      text.replace(
        /[^0-9]/g,
        ''
      );

    if (!numbersOnly) {
      return '';
    }

    return Number(
      numbersOnly
    ).toLocaleString(
      'ko-KR'
    );
  };

  const parseMoney = (
    text: string
  ) => {
    return (
      Number(
        text.replace(
          /,/g,
          ''
        )
      ) || 0
    );
  };

  const loadSettings =
    async () => {
      try {
        const currentBudget =
          await ensureCurrentMonthBudget(
            0
          );

        setHasExistingData(
          currentBudget > 0
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
        setIsLoading(
          false
        );
      }
    };

  const budgetAmount =
    parseMoney(
      monthlyBudget
    );

  const canSave =
    !isLoading &&
    budgetAmount > 0;

  const saveSettings =
    async () => {
      if (!canSave) {
        return;
      }

      try {
        await saveBudgetForMonth(
          budgetAmount
        );

        await AsyncStorage.setItem(
          SKIP_MONTHLY_NOTICE_ONCE_KEY,
          'true'
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

  const confirmResetAllData =
    () => {
      setShowResetModal(
        true
      );
    };

  const resetAllData =
    async () => {
      try {
        setShowResetModal(
          false
        );

        await AsyncStorage.clear();

        router.replace(
          '/onboarding'
        );
      } catch (error) {
        console.error(
          '데이터 초기화 실패:',
          error
        );
      }
    };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
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
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustKeyboardInsets={
            Platform.OS === 'ios'
          }
        >
          <AppHeader
            title="예산 설정"
            description="이번 달에 내가 사용하기로 정한 생활비만 입력해주세요."
          />

          <View
            style={styles.form}
          >
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
            disabled={
              !canSave
            }
            style={({
              pressed,
            }) => [
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

          {hasExistingData && (
            <View
              style={
                styles.dataSection
              }
            >
              <View
                style={
                  styles.dataSectionHeader
                }
              >
                <Text
                  style={
                    styles.dataSectionTitle
                  }
                >
                  데이터 관리
                </Text>

                <Text
                  style={
                    styles.dataSectionDescription
                  }
                >
                  앱을 처음 설치한 상태로 되돌릴 수 있어요.
                </Text>
              </View>

              <Pressable
                style={({
                  pressed,
                }) => [
                    styles.resetButton,

                    pressed &&
                    styles.resetButtonPressed,
                  ]}
                onPress={
                  confirmResetAllData
                }
              >
                <View
                  style={
                    styles.resetButtonIcon
                  }
                >
                  <Ionicons
                    name="refresh-outline"
                    size={19}
                    color="#D64545"
                  />
                </View>

                <View
                  style={
                    styles.resetTextArea
                  }
                >
                  <Text
                    style={
                      styles.resetButtonTitle
                    }
                  >
                    모든 데이터 초기화
                  </Text>

                  <Text
                    style={
                      styles.resetButtonDescription
                    }
                  >
                    예산, 지출 기록 및 설정을 모두 삭제합니다.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#A5ADBA"
                />
              </Pressable>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={
            showResetModal
          }
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() =>
            setShowResetModal(
              false
            )
          }
        >
          <Pressable
            style={
              styles.modalOverlay
            }
            onPress={() =>
              setShowResetModal(
                false
              )
            }
          >
            <Pressable
              style={
                styles.resetModal
              }
              onPress={() => { }}
            >
              <Text
                style={
                  styles.resetModalTitle
                }
              >
                모든 데이터를 초기화할까요?
              </Text>

              <Text
                style={
                  styles.resetModalDescription
                }
              >
                예산, 지출 기록, 설정값과 온보딩 상태가 모두 삭제돼요.
                {'\n'}
                처음 실행한 상태로 돌아갑니다.
              </Text>

              <View
                style={
                  styles.resetWarningBox
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#D64545"
                />

                <Text
                  style={
                    styles.resetWarningText
                  }
                >
                  삭제한 데이터는 다시 복구할 수 없어요.
                </Text>
              </View>

              <View
                style={
                  styles.resetModalButtons
                }
              >
                <Pressable
                  style={({
                    pressed,
                  }) => [
                      styles.resetModalCancelButton,

                      pressed &&
                      styles.modalButtonPressed,
                    ]}
                  onPress={() =>
                    setShowResetModal(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.resetModalCancelText
                    }
                  >
                    취소
                  </Text>
                </Pressable>

                <Pressable
                  style={({
                    pressed,
                  }) => [
                      styles.resetModalConfirmButton,

                      pressed &&
                      styles.modalButtonPressed,
                    ]}
                  onPress={
                    resetAllData
                  }
                >
                  <Text
                    style={
                      styles.resetModalConfirmText
                    }
                  >
                    초기화
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </Screen>
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

      flexDirection:
        'row',

      alignItems:
        'center',

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
      flexDirection:
        'row',

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

      alignItems:
        'center',

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

    dataSection: {
      marginTop: 52,

      paddingTop: 24,

      borderTopWidth: 1,

      borderTopColor:
        '#EEF1F5',
    },

    dataSectionHeader: {
      marginBottom: 14,
    },

    dataSectionTitle: {
      fontSize: 16,
      lineHeight: 22,

      fontFamily:
        'Pretendard-Bold',

      color: '#172033',
    },

    dataSectionDescription: {
      marginTop: 4,

      fontSize: 13,
      lineHeight: 19,

      fontFamily:
        'Pretendard-Regular',

      color: '#98A2B3',
    },

    resetButton: {
      minHeight: 72,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal: 15,
      paddingVertical: 13,

      borderRadius: 16,

      backgroundColor:
        '#FFF8F8',

      borderWidth: 1,

      borderColor:
        '#F4DEDE',

      gap: 11,
    },

    resetButtonPressed: {
      opacity: 0.7,
    },

    resetButtonIcon: {
      width: 34,
      height: 34,

      borderRadius: 12,

      backgroundColor:
        '#FDECEC',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    resetTextArea: {
      flex: 1,
    },

    resetButtonTitle: {
      fontSize: 15,
      lineHeight: 21,

      fontFamily:
        'Pretendard-Bold',

      color: '#C83E3E',
    },

    resetButtonDescription: {
      marginTop: 3,

      fontSize: 12,
      lineHeight: 18,

      fontFamily:
        'Pretendard-Regular',

      color: '#8A6666',
    },

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(23, 32, 51, 0.42)',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal: 28,
    },

    resetModal: {
      width: '100%',
      maxWidth: 342,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 22,

      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 17,

      shadowColor:
        '#172033',

      shadowOffset: {
        width: 0,
        height: 10,
      },

      shadowOpacity: 0.14,
      shadowRadius: 22,

      elevation: 12,
    },

    resetModalTitle: {
      fontSize: 19,
      lineHeight: 26,

      fontFamily:
        'Pretendard-ExtraBold',

      color: '#172033',
    },

    resetModalDescription: {
      marginTop: 9,

      fontSize: 13,
      lineHeight: 20,

      fontFamily:
        'Pretendard-Regular',

      color: '#687386',
    },

    resetWarningBox: {
      marginTop: 15,

      minHeight: 40,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      paddingHorizontal: 11,
      paddingVertical: 9,

      borderRadius: 12,

      backgroundColor:
        '#FFF5F5',
    },

    resetWarningText: {
      flex: 1,

      fontSize: 12,
      lineHeight: 17,

      fontFamily:
        'Pretendard-Medium',

      color: '#D64545',
    },

    resetModalButtons: {
      marginTop: 17,

      flexDirection:
        'row',

      gap: 9,
    },

    resetModalCancelButton: {
      flex: 1,

      minHeight: 48,

      borderRadius: 14,

      backgroundColor:
        '#F2F4F7',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    resetModalCancelText: {
      fontSize: 15,
      lineHeight: 21,

      fontFamily:
        'Pretendard-Bold',

      color: '#566176',
    },

    resetModalConfirmButton: {
      flex: 1,

      minHeight: 48,

      borderRadius: 14,

      backgroundColor:
        '#D64545',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    resetModalConfirmText: {
      fontSize: 15,
      lineHeight: 21,

      fontFamily:
        'Pretendard-Bold',

      color: '#FFFFFF',
    },

    modalButtonPressed: {
      opacity: 0.75,
    },
  });