import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const monthlyBudget = 1000000;
  const fixedExpense = 400000;
  const savingGoal = 200000;
  const spentAmount = 100000;
  const remainingDays = 10;

  const remainingBudget =
    monthlyBudget - fixedExpense - savingGoal - spentAmount;

  const dailyBudget = Math.floor(remainingBudget / remainingDays);

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘 얼마 써도 돼?</Text>

      <View style={styles.main}>
        <Text style={styles.label}>오늘은</Text>

        <Text style={styles.amount}>
          {formatMoney(dailyBudget)}원
        </Text>

        <Text style={styles.description}>써도 괜찮아요</Text>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>이번 달 남은 생활비</Text>
          <Text style={styles.infoValue}>
            {formatMoney(remainingBudget)}원
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>남은 기간</Text>
          <Text style={styles.infoValue}>
            D-{remainingDays}
          </Text>
        </View>
      </View>
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
    marginBottom: 40,
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
});