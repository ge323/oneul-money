
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  type FixedExpense,
  getMonthlyFixedTotal,
  loadFixedExpenses,
  saveFixedExpenses,
} from '../utils/fixed-expenses';

const money = (value: number) =>
  value.toLocaleString('ko-KR');

export default function FixedExpensesScreen() {
  const [items, setItems] = useState<FixedExpense[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDay, setPaymentDay] = useState('1');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFixedExpenses().then(setItems);
    }, [])
  );

  const persist = async (next: FixedExpense[]) => {
    setSaving(true);

    try {
      await saveFixedExpenses(next);
      setItems(next);
      return true;
    } catch {
      Alert.alert('저장 실패', '다시 시도해 주세요.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setPaymentDay('1');
  };

  const submit = async () => {
    const parsedAmount = Number(amount.replace(/,/g, ''));
    const parsedDay = Number(paymentDay);

    if (
      !title.trim() ||
      !amount.trim() ||
      !Number.isSafeInteger(parsedAmount) ||
      parsedAmount <= 0 ||
      !Number.isInteger(parsedDay) ||
      parsedDay < 1 ||
      parsedDay > 31
    ) {
      Alert.alert(
        '입력 확인',
        '항목명, 0원 초과 금액, 결제일(1~31일)을 확인해 주세요.'
      );
      return;
    }

    const next: FixedExpense[] = editingId
      ? items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: title.trim(),
                amount: parsedAmount,
                paymentDay: parsedDay,
              }
            : item
        )
      : [
          ...items,
          {
            id: `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`,
            title: title.trim(),
            amount: parsedAmount,
            paymentDay: parsedDay,
            enabled: true,
          },
        ];

    if (await persist(next)) {
      resetForm();
    }
  };

  const remove = (id: string) => {
    Alert.alert(
      '고정지출 삭제',
      '이 항목을 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            void persist(
              items.filter((item) => item.id !== id)
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        고정지출 관리
      </Text>

      <Text style={styles.help}>
        월 생활비에 포함된 고정지출을 등록해 주세요.
        등록된 금액은 매달 권장 지출액 계산에서 제외돼요.
      </Text>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>
          매월 고정지출 합계
        </Text>

        <Text style={styles.summaryValue}>
          {money(getMonthlyFixedTotal(items))}원
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="항목명 (예: 월세)"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="금액 (원)"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <TextInput
          style={styles.input}
          placeholder="매월 결제일 (1~31)"
          keyboardType="number-pad"
          value={paymentDay}
          onChangeText={setPaymentDay}
        />

        <Pressable
          style={[
            styles.button,
            saving && styles.disabled,
          ]}
          onPress={() => {
            void submit();
          }}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {editingId
              ? '수정 저장'
              : '고정지출 추가'}
          </Text>
        </Pressable>

        {editingId && (
          <Pressable onPress={resetForm}>
            <Text style={styles.link}>
              수정 취소
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            등록된 고정지출이 없어요.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>
                {item.title}
              </Text>

              <Text style={styles.itemMeta}>
                매월 {item.paymentDay}일 ·{' '}
                {money(item.amount)}원
              </Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => {
                    setEditingId(item.id);
                    setTitle(item.title);
                    setAmount(String(item.amount));
                    setPaymentDay(
                      String(item.paymentDay)
                    );
                  }}
                >
                  <Text style={styles.link}>
                    수정
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => remove(item.id)}
                >
                  <Text style={styles.delete}>
                    삭제
                  </Text>
                </Pressable>
              </View>
            </View>

            <Switch
              value={item.enabled}
              onValueChange={(enabled) => {
                void persist(
                  items.map((row) =>
                    row.id === item.id
                      ? { ...row, enabled }
                      : row
                  )
                );
              }}
              disabled={saving}
            />
          </View>
        )}
      />

      <Text style={styles.footnote}>
        결제일은 참고용이며 자동 결제나 일반 지출
        등록은 하지 않아요. 29~31일은 해당 날짜가
        없는 달에도 월 고정지출로 계산돼요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 48,
  },

  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#172033',
  },

  help: {
    fontSize: 13,
    lineHeight: 20,
    color: '#687386',
    marginTop: 8,
  },

  summary: {
    backgroundColor: '#F1F5FC',
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
  },

  summaryLabel: {
    color: '#687386',
    fontSize: 13,
  },

  summaryValue: {
    color: '#3563C9',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 6,
  },

  form: {
    gap: 10,
    marginTop: 18,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E1E6EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#172033',
  },

  button: {
    backgroundColor: '#3563C9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  list: {
    paddingTop: 14,
    paddingBottom: 12,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F4',
    paddingVertical: 14,
  },

  itemBody: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  itemMeta: {
    fontSize: 12,
    color: '#687386',
    marginTop: 4,
  },

  actions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 10,
  },

  link: {
    color: '#3563C9',
    fontWeight: '600',
    fontSize: 13,
  },

  delete: {
    color: '#C43D3D',
    fontWeight: '600',
    fontSize: 13,
  },

  empty: {
    textAlign: 'center',
    color: '#8792A2',
    padding: 20,
  },

  footnote: {
    color: '#8792A2',
    fontSize: 11,
    lineHeight: 17,
    paddingBottom: 20,
  },
});
