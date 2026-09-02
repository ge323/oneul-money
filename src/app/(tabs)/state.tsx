import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        소비 통계
      </Text>

      <Text style={styles.description}>
        이번 달 소비 흐름을 확인해보세요.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          이번 달 총 지출
        </Text>

        <Text style={styles.cardAmount}>
          0원
        </Text>

        <Text style={styles.cardDescription}>
          아직 통계 데이터를 연결하지 않았어요.
        </Text>
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
    fontSize: 28,
    fontWeight: '800',
    color: '#172033',
  },

  description: {
    marginTop: 8,
    fontSize: 15,
    color: '#8792A2',
  },

  card: {
    marginTop: 28,
    backgroundColor: '#F1F5FC',
    borderRadius: 20,
    padding: 20,
  },

  cardLabel: {
    fontSize: 14,
    color: '#687386',
  },

  cardAmount: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: '800',
    color: '#3563C9',
  },

  cardDescription: {
    marginTop: 8,
    fontSize: 13,
    color: '#8792A2',
  },
});