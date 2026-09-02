import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BarChart,
  PieChart,
} from 'react-native-gifted-charts';

const EXPENSES_KEY = 'expenses';

type Period = 'week' | 'month' | 'year';

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
};

type CategoryInfo = {
  id: string;
  label: string;
};

const CATEGORIES: CategoryInfo[] = [
  { id: 'food', label: '식비' },
  { id: 'cafe', label: '카페' },
  { id: 'transport', label: '교통' },
  { id: 'shopping', label: '쇼핑' },
  { id: 'leisure', label: '여가' },
  { id: 'life', label: '생활' },
  { id: 'etc', label: '기타' },
];

export default function ReportScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<Period>('month');

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const loadExpenses = async () => {
    try {
      const saved = await AsyncStorage.getItem(EXPENSES_KEY);

      setExpenses(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error('지출 불러오기 실패:', error);
    }
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  const startOfDay = (date: Date) => {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
  };

  const getPeriodExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);

      if (period === 'week') {
        const today = startOfDay(now);

        const start = new Date(today);

        /*
         * 오늘 포함 최근 7일
         */
        start.setDate(today.getDate() - 6);

        return (
          expenseDate >= start &&
          expenseDate <= now
        );
      }

      if (period === 'month') {
        return (
          expenseDate.getFullYear() === now.getFullYear() &&
          expenseDate.getMonth() === now.getMonth()
        );
      }

      return expenseDate.getFullYear() === now.getFullYear();
    });
  }, [expenses, period]);

  const totalExpense = useMemo(() => {
    return getPeriodExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );
  }, [getPeriodExpenses]);

  /*
   * ============================
   * 막대그래프 데이터
   * ============================
   */

  const barData = useMemo(() => {
    const now = new Date();

    /*
     * 최근 7일
     */
    if (period === 'week') {
      const result = [];

      for (let i = 6; i >= 0; i -= 1) {
        const target = new Date(now);

        target.setHours(0, 0, 0, 0);
        target.setDate(target.getDate() - i);

        const nextDay = new Date(target);

        nextDay.setDate(nextDay.getDate() + 1);

        const total = expenses
          .filter((expense) => {
            const date = new Date(expense.createdAt);

            return date >= target && date < nextDay;
          })
          .reduce(
            (sum, expense) => sum + Number(expense.amount || 0),
            0
          );

        const weekdays = [
          '일',
          '월',
          '화',
          '수',
          '목',
          '금',
          '토',
        ];

        result.push({
          value: total,
          label: weekdays[target.getDay()],
          frontColor: '#3563C9',
        });
      }

      return result;
    }

    /*
     * 이번 달
     *
     * 1~5주차로 묶어서 보여줌.
     * 모바일에서 30개의 막대를 보여주는 것보다
     * 한눈에 보기 편함.
     */
    if (period === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();

      const lastDay = new Date(
        year,
        month + 1,
        0
      ).getDate();

      const result = [];

      let week = 1;

      for (
        let startDay = 1;
        startDay <= lastDay;
        startDay += 7
      ) {
        const endDay = Math.min(
          startDay + 6,
          lastDay
        );

        const total = expenses
          .filter((expense) => {
            const date = new Date(expense.createdAt);

            return (
              date.getFullYear() === year &&
              date.getMonth() === month &&
              date.getDate() >= startDay &&
              date.getDate() <= endDay
            );
          })
          .reduce(
            (sum, expense) =>
              sum + Number(expense.amount || 0),
            0
          );

        result.push({
          value: total,
          label: `${week}주`,
          frontColor: '#3563C9',
        });

        week += 1;
      }

      return result;
    }

    /*
     * 올해 1~12월
     */
    return Array.from(
      { length: 12 },
      (_, index) => {
        const total = expenses
          .filter((expense) => {
            const date = new Date(expense.createdAt);

            return (
              date.getFullYear() === now.getFullYear() &&
              date.getMonth() === index
            );
          })
          .reduce(
            (sum, expense) =>
              sum + Number(expense.amount || 0),
            0
          );

        return {
          value: total,
          label: `${index + 1}`,
          frontColor: '#3563C9',
        };
      }
    );
  }, [expenses, period]);

  /*
   * ============================
   * 카테고리 통계
   * ============================
   */

  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    getPeriodExpenses.forEach((expense) => {
      const category = expense.category || 'etc';

      categoryMap[category] =
        (categoryMap[category] || 0) +
        Number(expense.amount || 0);
    });

    return Object.entries(categoryMap)
      .map(([category, amount]) => {
        const info = CATEGORIES.find(
          (item) => item.id === category
        );

        return {
          id: category,
          label: info?.label || '기타',
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [getPeriodExpenses]);

  /*
   * gifted-charts PieChart용 데이터
   */

  const PIE_COLORS = [
    '#3563C9',
    '#6687D5',
    '#91A9E2',
    '#B8C8EB',
    '#D5DFF4',
    '#7892C8',
    '#A8B5CE',
  ];

  const pieData = useMemo(() => {
    return categoryData.map((item, index) => ({
      value: item.amount,
      color: PIE_COLORS[index % PIE_COLORS.length],
      text: item.label,
    }));
  }, [categoryData]);

  const getPeriodTitle = () => {
    if (period === 'week') {
      return '최근 7일 지출';
    }

    if (period === 'month') {
      return '이번 달 지출';
    }

    return '올해 지출';
  };

  const getChartTitle = () => {
    if (period === 'week') {
      return '요일별 지출';
    }

    if (period === 'month') {
      return '주차별 지출';
    }

    return '월별 지출';
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 헤더 */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/history');
            }
          }}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color="#172033"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            소비 리포트
          </Text>

          <Text style={styles.description}>
            내 소비 흐름을 한눈에 확인해보세요.
          </Text>
        </View>
      </View>

      {/* 기간 */}

      <View style={styles.periodTabs}>
        <PeriodButton
          label="1주"
          active={period === 'week'}
          onPress={() => setPeriod('week')}
        />

        <PeriodButton
          label="1개월"
          active={period === 'month'}
          onPress={() => setPeriod('month')}
        />

        <PeriodButton
          label="1년"
          active={period === 'year'}
          onPress={() => setPeriod('year')}
        />
      </View>

      {/* 총 지출 */}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {getPeriodTitle()}
        </Text>

        <Text style={styles.summaryAmount}>
          {formatMoney(totalExpense)}원
        </Text>

        <Text style={styles.summaryDescription}>
          총 {getPeriodExpenses.length}건의 지출이 있어요.
        </Text>
      </View>

      {/* 지출 추이 */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>
              {getChartTitle()}
            </Text>

            <Text style={styles.cardDescription}>
              언제 지출이 많았는지 확인해보세요.
            </Text>
          </View>

          <View style={styles.chartIcon}>
            <Ionicons
              name="bar-chart-outline"
              size={18}
              color="#3563C9"
            />
          </View>
        </View>

        {totalExpense > 0 ? (
          <View style={styles.chartArea}>
            <BarChart
              data={barData}
              height={180}
              barWidth={
                period === 'year'
                  ? 12
                  : period === 'week'
                    ? 24
                    : 30
              }
              spacing={
                period === 'year'
                  ? 10
                  : 18
              }
              roundedTop
              roundedBottom
              hideRules
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#E9EDF3"
              yAxisTextStyle={{
                color: '#98A2B3',
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: '#8792A2',
                fontSize: 11,
              }}
              noOfSections={4}
              isAnimated
              animationDuration={400}
            />
          </View>
        ) : (
          <EmptyChart />
        )}
      </View>

      {/* 카테고리 */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>
              카테고리별 지출
            </Text>

            <Text style={styles.cardDescription}>
              어디에 가장 많이 사용했는지 확인해보세요.
            </Text>
          </View>

          <View style={styles.chartIcon}>
            <Ionicons
              name="pie-chart-outline"
              size={18}
              color="#3563C9"
            />
          </View>
        </View>

        {pieData.length > 0 ? (
          <>
            <View style={styles.pieArea}>
              <PieChart
                data={pieData}
                donut
                radius={92}
                innerRadius={65}
                innerCircleColor="#FFFFFF"
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterLabel}>
                      총 지출
                    </Text>

                    <Text style={styles.pieCenterAmount}>
                      {formatMoney(totalExpense)}
                    </Text>

                    <Text style={styles.pieCenterUnit}>
                      원
                    </Text>
                  </View>
                )}
              />
            </View>

            <View style={styles.categoryList}>
              {categoryData.map((item, index) => {
                const percentage =
                  totalExpense > 0
                    ? Math.round(
                        (item.amount / totalExpense) * 100
                      )
                    : 0;

                return (
                  <View
                    key={item.id}
                    style={styles.categoryRow}
                  >
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryDot,
                          {
                            backgroundColor:
                              PIE_COLORS[
                                index % PIE_COLORS.length
                              ],
                          },
                        ]}
                      />

                      <Text style={styles.categoryName}>
                        {item.label}
                      </Text>
                    </View>

                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>
                        {formatMoney(item.amount)}원
                      </Text>

                      <Text style={styles.categoryPercentage}>
                        {percentage}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <EmptyChart />
        )}
      </View>
    </ScrollView>
  );
}

/* =========================
   기간 버튼
========================= */

function PeriodButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.periodButton,
        active && styles.periodButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.periodButtonText,
          active && styles.periodButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* =========================
   빈 그래프
========================= */

function EmptyChart() {
  return (
    <View style={styles.emptyChart}>
      <Ionicons
        name="stats-chart-outline"
        size={30}
        color="#B3BBC7"
      />

      <Text style={styles.emptyChartTitle}>
        아직 지출 데이터가 없어요
      </Text>

      <Text style={styles.emptyChartDescription}>
        지출을 기록하면 여기에 자동으로 표시돼요.
      </Text>
    </View>
  );
}

/* =========================
   Styles
========================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 80,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 26,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#172033',
  },

  description: {
    marginTop: 5,
    fontSize: 13,
    color: '#8792A2',
  },

  /* 기간 */

  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    padding: 4,
    marginTop: 28,
  },

  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },

  periodButtonActive: {
    backgroundColor: '#FFFFFF',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  periodButtonText: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: '#8792A2',
  },

  periodButtonTextActive: {
    fontFamily: 'Pretendard-ExtraBold',
    color: '#3563C9',
  },

  /* 요약 */

  summaryCard: {
    marginTop: 18,
    backgroundColor: '#F1F5FC',
    borderRadius: 20,
    padding: 20,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#687386',
  },

  summaryAmount: {
    marginTop: 7,
    fontSize: 30,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#3563C9',
  },

  summaryDescription: {
    marginTop: 6,
    fontSize: 12,
    color: '#8792A2',
  },

  /* 카드 */

  card: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#EDF0F4',
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  cardTitle: {
    fontSize: 17,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#172033',
  },

  cardDescription: {
    marginTop: 5,
    fontSize: 12,
    color: '#8792A2',
  },

  chartIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F1F5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 막대 */

  chartArea: {
    marginTop: 28,
    overflow: 'hidden',
  },

  /* 도넛 */

  pieArea: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 24,
  },

  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  pieCenterLabel: {
    fontSize: 11,
    color: '#98A2B3',
  },

  pieCenterAmount: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: '800',
    color: '#172033',
  },

  pieCenterUnit: {
    marginTop: 1,
    fontSize: 10,
    color: '#98A2B3',
  },

  /* 카테고리 */

  categoryList: {
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
    paddingTop: 6,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },

  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 9,
  },

  categoryName: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#172033',
  },

  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryAmount: {
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  categoryPercentage: {
    width: 42,
    marginLeft: 9,
    fontSize: 12,
    color: '#98A2B3',
    textAlign: 'right',
  },

  /* Empty */

  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
  },

  emptyChartTitle: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#687386',
  },

  emptyChartDescription: {
    marginTop: 5,
    fontSize: 12,
    color: '#98A2B3',
  },
});