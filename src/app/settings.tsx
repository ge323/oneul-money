import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [fixedExpense, setFixedExpense] = useState('');
  const [savingGoal, setSavingGoal] = useState('');
  const [spentAmount, setSpentAmount] = useState('');
  const [remainingDays, setRemainingDays] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>예산 설정</Text>
      <Text style={styles.description}>
        이번 달 사용할 예산을 입력해주세요.
      </Text>

      <View style={styles.form}>
        <InputItem
          label="월 예산"
          value={monthlyBudget}
          onChangeText={setMonthlyBudget}
          placeholder="1,000,000"
        />

        <InputItem
          label="고정비"
          value={fixedExpense}
          onChangeText={setFixedExpense}
          placeholder="400,000"
        />

        <InputItem
          label="저축 목표"
          value={savingGoal}
          onChangeText={setSavingGoal}
          placeholder="200,000"
        />

        <InputItem
          label="이미 사용한 금액"
          value={spentAmount}
          onChangeText={setSpentAmount}
          placeholder="100,000"
        />

        <InputItem
          label="남은 일수"
          value={remainingDays}
          onChangeText={setRemainingDays}
          placeholder="10"
        />
      </View>

      <Pressable
        style={styles.saveButton}
        onPress={() => router.back()}
      >
        <Text style={styles.saveButtonText}>저장하기</Text>
      </Pressable>
    </ScrollView>
  );
}

type InputItemProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

function InputItem({
  label,
  value,
  onChangeText,
  placeholder,
}: InputItemProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType="numeric"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
  },

  description: {
    marginTop: 8,
    fontSize: 15,
    color: '#777777',
  },

  form: {
    marginTop: 40,
    gap: 24,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
  },

  saveButton: {
    marginTop: 40,
    backgroundColor: '#111111',
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