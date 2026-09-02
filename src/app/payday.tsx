import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '../components/AppHeader';

const BUDGET_KEY = 'budget-settings';

type PaydayType = 'date' | 'lastDay';

export default function PaydayScreen() {
  const [paydayType, setPaydayType] =
    useState<PaydayType>('date');

  const [payday, setPayday] = useState('25');

  useEffect(() => {
    loadPayday();
  }, []);

  const loadPayday = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(BUDGET_KEY);

      if (!saved) return;

      const data = JSON.parse(saved);

      setPaydayType(
        data.paydayType === 'lastDay'
          ? 'lastDay'
          : 'date'
      );

      setPayday(
        String(data.payday ?? 25)
      );
    } catch (error) {
      console.error(
        '월급일 불러오기 실패:',
        error
      );
    }
  };

  const savePayday = async () => {
    const paydayNumber =
      Number(payday);

    if (
      paydayType === 'date' &&
      (
        !paydayNumber ||
        paydayNumber < 1 ||
        paydayNumber > 31
      )
    ) {
      return;
    }

    try {
      const saved =
        await AsyncStorage.getItem(
          BUDGET_KEY
        );

      const currentData = saved
        ? JSON.parse(saved)
        : {};

      const updatedData = {
        ...currentData,

        paydayType,

        payday:
          paydayType === 'date'
            ? paydayNumber
            : currentData.payday ?? 25,
      };

      await AsyncStorage.setItem(
        BUDGET_KEY,
        JSON.stringify(updatedData)
      );

      router.back();
    } catch (error) {
      console.error(
        '월급일 저장 실패:',
        error
      );
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="월급일 설정"
        description="월급이 들어오는 방식을 설정해주세요."
      />

      <Text style={styles.sectionTitle}>
        월급일 유형
      </Text>

      <View style={styles.optionContainer}>
        <Pressable
          style={[
            styles.optionCard,
            paydayType === 'date' &&
              styles.optionCardSelected,
          ]}
          onPress={() =>
            setPaydayType('date')
          }
        >
          <View
            style={[
              styles.radioOuter,
              paydayType === 'date' &&
                styles.radioOuterSelected,
            ]}
          >
            {paydayType === 'date' && (
              <View
                style={
                  styles.radioInner
                }
              />
            )}
          </View>

          <View style={styles.optionTextArea}>
            <Text
              style={
                styles.optionTitle
              }
            >
              매월 특정 날짜
            </Text>

            <Text
              style={
                styles.optionDescription
              }
            >
              예: 매월 25일에 월급을 받아요.
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[
            styles.optionCard,
            paydayType === 'lastDay' &&
              styles.optionCardSelected,
          ]}
          onPress={() =>
            setPaydayType('lastDay')
          }
        >
          <View
            style={[
              styles.radioOuter,
              paydayType === 'lastDay' &&
                styles.radioOuterSelected,
            ]}
          >
            {paydayType ===
              'lastDay' && (
              <View
                style={
                  styles.radioInner
                }
              />
            )}
          </View>

          <View style={styles.optionTextArea}>
            <Text
              style={
                styles.optionTitle
              }
            >
              매월 말일
            </Text>

            <Text
              style={
                styles.optionDescription
              }
            >
              28일, 30일, 31일을 자동으로 계산해요.
            </Text>
          </View>
        </Pressable>
      </View>

      {paydayType === 'date' && (
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>
            월급일
          </Text>

          <View
            style={styles.inputBox}
          >
            <TextInput
              style={styles.input}
              value={payday}
              onChangeText={(text) =>
                setPayday(
                  text.replace(
                    /[^0-9]/g,
                    ''
                  )
                )
              }
              placeholder="25"
              keyboardType="numeric"
              maxLength={2}
            />

            <Text style={styles.unit}>
              일
            </Text>
          </View>

          <Text style={styles.helperText}>
            해당 날짜가 없는 달에는 그 달의 마지막 날로 자동 계산해요.
          </Text>
        </View>
      )}

      {paydayType === 'lastDay' && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            말일 지급
          </Text>

          <Text
            style={
              styles.infoDescription
            }
          >
            2월은 28일 또는 29일,
            4월은 30일,
            5월은 31일처럼
            월별 마지막 날짜를 자동으로 적용해요.
          </Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          pressed &&
            styles.saveButtonPressed,
        ]}
        onPress={savePayday}
      >
        <Text
          style={styles.saveButtonText}
        >
          저장하기
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
    paddingTop: 32,
  },

  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
    marginBottom: 12,
  },

  optionContainer: {
    gap: 10,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },

  optionCardSelected: {
    backgroundColor: '#F1F5FC',
    borderColor: '#3563C9',
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD3DF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterSelected: {
    borderColor: '#3563C9',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3563C9',
  },

  optionTextArea: {
    flex: 1,
    marginLeft: 14,
  },

  optionTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  optionDescription: {
    marginTop: 5,
    fontSize: 13,
    color: '#8792A2',
  },

  dateCard: {
    marginTop: 24,
    backgroundColor: '#F1F5FC',
    borderRadius: 20,
    padding: 18,
  },

  dateLabel: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  inputBox: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 16,
  },

  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 22,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#3563C9',
  },

  unit: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#687386',
  },

  helperText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: '#8792A2',
  },

  infoCard: {
    marginTop: 24,
    backgroundColor: '#F1F5FC',
    borderRadius: 20,
    padding: 18,
  },

  infoTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  infoDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#8792A2',
  },

  saveButton: {
    marginTop: 28,
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
    fontFamily: 'Pretendard-Bold',
  },
});