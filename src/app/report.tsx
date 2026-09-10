import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
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
import mobileAds, {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

import { ensureCurrentMonthBudget } from '../utils/monthly-budgets';

const EXPENSES_KEY = 'expenses';
const CUSTOM_CATEGORIES_KEY = 'custom-categories';
const INSIGHT_UNLOCK_DATE_KEY = 'report-insight-unlock-date';
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-8353387848033145/5341446224';

const rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: true,
});

/*
 * 평소/배포 시 null.
 * 새 달 테스트 예:
 * new Date(2026, 9, 1) // 2026년 10월 1일
 */
const DEV_TEST_DATE: Date | null = null;

const getNow = () => {
  return DEV_TEST_DATE
    ? new Date(DEV_TEST_DATE)
    : new Date();
};


type Period = 'week' | 'month' | 'year';

type Expense = {
  id: string;
  title: string;
  amount: number;
  category?: string;
  createdAt: string;
};

type CategoryInfo = {
  id: string;
  label: string;
};

type CustomCategory = {
  id: string;
  label: string;
  icon?: string;
  emoji?: string;
  custom?: boolean;
};

type BarDetail = {
  title: string;
  expenses: Expense[];
};

type Insight = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
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
  const [customCategories, setCustomCategories] =
    useState<CustomCategory[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [isInsightUnlocked, setIsInsightUnlocked] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [isRewardedAdLoaded, setIsRewardedAdLoaded] = useState(false);
  const [isRewardedAdLoading, setIsRewardedAdLoading] = useState(true);

  const [
    selectedBarDetail,
    setSelectedBarDetail,
  ] = useState<BarDetail | null>(null);

  const [
    isDetailModalVisible,
    setIsDetailModalVisible,
  ] = useState(false);

  const sheetTranslateY =
    useRef(
      new Animated.Value(500)
    ).current;

  const backdropOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    const unsubscribeLoaded = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setIsRewardedAdLoaded(true);
        setIsRewardedAdLoading(false);
      }
    );

    const unsubscribeEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        try {
          await AsyncStorage.setItem(
            INSIGHT_UNLOCK_DATE_KEY,
            getDateKey(getNow())
          );
        } catch (error) {
          console.error('소비 인사이트 잠금 해제 저장 실패:', error);
        } finally {
          setIsInsightUnlocked(true);
        }
      }
    );

    const unsubscribeClosed = rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsRewardedAdLoaded(false);
        setIsRewardedAdLoading(true);
        rewardedAd.load();
      }
    );

    const unsubscribeError = rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error('보상형 광고 불러오기 실패:', error);
        setIsRewardedAdLoaded(false);
        setIsRewardedAdLoading(false);
      }
    );

    mobileAds()
      .initialize()
      .then(() => rewardedAd.load())
      .catch((error) => {
        console.error('Google Mobile Ads 초기화 실패:', error);
        setIsRewardedAdLoading(false);
      });

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const loadData = async () => {
    try {
      const [
        savedExpenses,
        savedCustomCategories,
        currentBudget,
        unlockedDate,
      ] = await Promise.all([
        AsyncStorage.getItem(
          EXPENSES_KEY
        ),
        AsyncStorage.getItem(
          CUSTOM_CATEGORIES_KEY
        ),
        ensureCurrentMonthBudget(0),
        AsyncStorage.getItem(
          INSIGHT_UNLOCK_DATE_KEY
        ),
      ]);

      setExpenses(
        savedExpenses
          ? JSON.parse(savedExpenses)
          : []
      );

      setCustomCategories(
        savedCustomCategories
          ? JSON.parse(savedCustomCategories)
          : []
      );

      setMonthlyBudget(currentBudget);
      setIsInsightUnlocked(unlockedDate === getDateKey(getNow()));
    } catch (error) {
      console.error(
        '소비 리포트 데이터 불러오기 실패:',
        error
      );
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

  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const getPeriodExpenses = useMemo(() => {
    const now = getNow();

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

  const getCategoryLabel = (
    category?: string
  ) => {
    const defaultInfo =
      CATEGORIES.find(
        (item) =>
          item.id === category
      );

    const customInfo =
      customCategories.find(
        (item) =>
          item.id === category
      );

    return (
      defaultInfo?.label ||
      customInfo?.label ||
      '기타'
    );
  };

  const openBarDetail = (
    title: string,
    detailExpenses: Expense[]
  ) => {
    if (
      detailExpenses.length === 0
    ) {
      return;
    }

    const sortedExpenses =
      [...detailExpenses].sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );

    setSelectedBarDetail({
      title,
      expenses: sortedExpenses,
    });

    sheetTranslateY.setValue(
      500
    );

    backdropOpacity.setValue(
      0
    );

    setIsDetailModalVisible(
      true
    );

    requestAnimationFrame(
      () => {
        Animated.parallel([
          Animated.timing(
            sheetTranslateY,
            {
              toValue: 0,
              duration: 250,
              useNativeDriver:
                true,
            }
          ),

          Animated.timing(
            backdropOpacity,
            {
              toValue: 1,
              duration: 100,
              useNativeDriver:
                true,
            }
          ),
        ]).start();
      }
    );
  };

  const closeBarDetail = () => {
    Animated.parallel([
      Animated.timing(
        sheetTranslateY,
        {
          toValue: 500,
          duration: 200,
          useNativeDriver:
            true,
        }
      ),

      Animated.timing(
        backdropOpacity,
        {
          toValue: 0,
          duration: 60,
          useNativeDriver:
            true,
        }
      ),
    ]).start(() => {
      setIsDetailModalVisible(
        false
      );

      setSelectedBarDetail(
        null
      );
    });
  };

  const formatExpenseDate = (
    value: string
  ) => {
    const date =
      new Date(value);

    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatExpenseTime = (
    value: string
  ) => {
    return new Date(
      value
    ).toLocaleTimeString(
      'ko-KR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  /*
   * ============================
   * 막대그래프 데이터
   * ============================
   */

  const barData = useMemo(() => {
    const now = getNow();

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

        const detailExpenses =
          expenses.filter(
            (expense) => {
              const date =
                new Date(
                  expense.createdAt
                );

              return (
                date >= target &&
                date < nextDay
              );
            }
          );

        const total =
          detailExpenses.reduce(
            (sum, expense) =>
              sum +
              Number(
                expense.amount || 0
              ),
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

        const detailTitle =
          `${target.getMonth() + 1}월 ${target.getDate()}일 ${weekdays[target.getDay()]}요일 지출`;

        result.push({
          value: total,
          label:
            weekdays[
              target.getDay()
            ],
          frontColor: '#3563C9',
          onPress: () =>
            openBarDetail(
              detailTitle,
              detailExpenses
            ),
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

        const detailExpenses =
          expenses.filter(
            (expense) => {
              const date =
                new Date(
                  expense.createdAt
                );

              return (
                date.getFullYear() ===
                  year &&
                date.getMonth() ===
                  month &&
                date.getDate() >=
                  startDay &&
                date.getDate() <=
                  endDay
              );
            }
          );

        const total =
          detailExpenses.reduce(
            (sum, expense) =>
              sum +
              Number(
                expense.amount || 0
              ),
            0
          );

        const detailTitle =
          `${month + 1}월 ${week}주차 지출`;

        result.push({
          value: total,
          label: `${week}주`,
          frontColor: '#3563C9',
          onPress: () =>
            openBarDetail(
              detailTitle,
              detailExpenses
            ),
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
        const detailExpenses =
          expenses.filter(
            (expense) => {
              const date =
                new Date(
                  expense.createdAt
                );

              return (
                date.getFullYear() ===
                  now.getFullYear() &&
                date.getMonth() ===
                  index
              );
            }
          );

        const total =
          detailExpenses.reduce(
            (sum, expense) =>
              sum +
              Number(
                expense.amount || 0
              ),
            0
          );

        return {
          value: total,
          label: `${index + 1}`,
          frontColor: '#3563C9',
          onPress: () =>
            openBarDetail(
              `${index + 1}월 지출`,
              detailExpenses
            ),
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
      const category =
        expense.category || 'etc';

      categoryMap[category] =
        (categoryMap[category] || 0) +
        Number(
          expense.amount || 0
        );
    });

    return Object.entries(
      categoryMap
    )
      .map(
        ([category, amount]) => {
          const defaultInfo =
            CATEGORIES.find(
              (item) =>
                item.id === category
            );

          const customInfo =
            customCategories.find(
              (item) =>
                item.id === category
            );

          return {
            id: category,
            label:
              defaultInfo?.label ||
              customInfo?.label ||
              '기타',
            amount,
          };
        }
      )
      .sort(
        (a, b) =>
          b.amount - a.amount
      );
  }, [
    getPeriodExpenses,
    customCategories,
  ]);

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

  const previousPeriodExpense = useMemo(() => {
    const now = getNow();

    if (period === 'week') {
      const currentStart = startOfDay(now);
      currentStart.setDate(currentStart.getDate() - 6);

      const previousEnd = new Date(currentStart);
      previousEnd.setMilliseconds(-1);

      const previousStart = new Date(previousEnd);
      previousStart.setHours(0, 0, 0, 0);
      previousStart.setDate(previousStart.getDate() - 6);

      return expenses
        .filter((expense) => {
          const date = new Date(expense.createdAt);
          return date >= previousStart && date <= previousEnd;
        })
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    }

    if (period === 'month') {
      const previousYear =
        now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const comparableDay = Math.min(
        now.getDate(),
        new Date(previousYear, previousMonth + 1, 0).getDate()
      );

      return expenses
        .filter((expense) => {
          const date = new Date(expense.createdAt);
          return (
            date.getFullYear() === previousYear &&
            date.getMonth() === previousMonth &&
            date.getDate() <= comparableDay
          );
        })
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    }

    return expenses
      .filter(
        (expense) =>
          new Date(expense.createdAt).getFullYear() === now.getFullYear() - 1
      )
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses, period]);

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    if (period === 'month') {
      const now = getNow();
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      const remainingDays = Math.max(daysInMonth - now.getDate() + 1, 1);
      const remainingBudget = monthlyBudget - totalExpense;

      if (monthlyBudget > 0 && remainingBudget >= 0) {
        const dailyAvailable = Math.floor(remainingBudget / remainingDays);

        result.push({
          id: 'daily-budget',
          icon: 'wallet-outline',
          text: `예산을 지키려면 앞으로 하루 평균 ${formatMoney(
            dailyAvailable
          )}원까지 사용할 수 있어요.`,
        });
      } else if (monthlyBudget > 0) {
        result.push({
          id: 'daily-budget',
          icon: 'alert-circle-outline',
          text: `이번 달 예산을 ${formatMoney(
            Math.abs(remainingBudget)
          )}원 초과했어요. 남은 기간에는 지출을 줄여보세요.`,
        });
      } else {
        result.push({
          id: 'daily-budget',
          icon: 'wallet-outline',
          text: '예산을 설정하면 하루 사용 가능 금액도 알려드릴게요.',
        });
      }
    }

    if (getPeriodExpenses.length > 0 && previousPeriodExpense > 0) {
      const differenceRate = Math.round(
        ((totalExpense - previousPeriodExpense) / previousPeriodExpense) * 100
      );

      result.push({
        id: 'comparison',
        icon:
          differenceRate > 0
            ? 'trending-up-outline'
            : differenceRate < 0
              ? 'trending-down-outline'
              : 'swap-horizontal-outline',
        text:
          differenceRate === 0
            ? '이전 같은 기간과 비슷하게 쓰고 있어요.'
            : `이전 같은 기간보다 ${Math.abs(differenceRate)}% ${
                differenceRate > 0 ? '더' : '덜'
              } 쓰고 있어요.`,
      });
    } else if (getPeriodExpenses.length > 0) {
      result.push({
        id: 'comparison',
        icon: 'analytics-outline',
        text: '이전 기간 기록이 쌓이면 소비 변화를 알려드릴게요.',
      });
    }

    const topCategory = categoryData[0];
    if (topCategory) {
      const topRate = Math.round((topCategory.amount / totalExpense) * 100);

      result.push({
        id: 'category',
        icon: 'pie-chart-outline',
        text: `${topCategory.label}에 가장 많이 썼어요. 전체 지출의 ${topRate}%예요.`,
      });
    }

    if (period === 'month' && totalExpense > 0) {
      const now = getNow();
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      const projectedExpense = Math.round(
        (totalExpense / Math.max(now.getDate(), 1)) * daysInMonth
      );

      result.push({
        id: 'projection',
        icon: 'calendar-outline',
        text: `지금 속도라면 이번 달 약 ${formatMoney(projectedExpense)}원을 쓸 것으로 보여요.`,
      });
    }

    return result.slice(0, 4);
  }, [
    categoryData,
    getPeriodExpenses.length,
    monthlyBudget,
    period,
    previousPeriodExpense,
    totalExpense,
  ]);

  const showRewardedAd = async () => {
    if (!isRewardedAdLoaded) {
      setIsRewardedAdLoading(true);
      rewardedAd.load();
      return;
    }

    try {
      await rewardedAd.show();
    } catch (error) {
      console.error('보상형 광고 표시 실패:', error);
      setIsRewardedAdLoaded(false);
      setIsRewardedAdLoading(false);
    }
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

      {/* 소비 인사이트 */}

      <View style={styles.insightCard}>
        <View style={styles.cardHeader}>
          <View style={styles.insightTitleArea}>
            <Text style={styles.cardTitle}>소비 인사이트</Text>

            <Text style={styles.cardDescription}>
              내 소비 흐름을 간단하게 확인해보세요.
            </Text>
          </View>

          <View style={styles.insightIcon}>
            <Ionicons name="bulb-outline" size={19} color="#D58B16" />
          </View>
        </View>

        {isInsightUnlocked ? (
          insights.length > 0 ? (
            <View style={styles.insightList}>
              {insights.map((insight) => (
                <View key={insight.id} style={styles.insightRow}>
                  <View style={styles.insightRowIcon}>
                    <Ionicons name={insight.icon} size={16} color="#3563C9" />
                  </View>

                  <Text style={styles.insightText}>{insight.text}</Text>
                </View>
              ))}

              <Text style={styles.unlockedCaption}>
                오늘은 광고 없이 다시 확인할 수 있어요.
              </Text>
            </View>
          ) : (
            <View style={styles.insightEmpty}>
              <Text style={styles.insightEmptyText}>
                지출을 기록하면 소비 인사이트를 알려드릴게요.
              </Text>
            </View>
          )
        ) : (
          <View style={styles.insightLocked}>
            <Text style={styles.insightLockedText}>
              짧은 광고를 보고 오늘의 인사이트를 열어보세요.
            </Text>

            <Pressable
              disabled={isRewardedAdLoading}
              style={({ pressed }) => [
                styles.insightButton,
                isRewardedAdLoading && styles.insightButtonDisabled,
                pressed && styles.insightButtonPressed,
              ]}
              onPress={showRewardedAd}
            >
              <Ionicons
                name={
                  isRewardedAdLoading
                    ? 'hourglass-outline'
                    : isRewardedAdLoaded
                      ? 'play-circle-outline'
                      : 'refresh-outline'
                }
                size={19}
                color="#FFFFFF"
              />
              <Text style={styles.insightButtonText}>
                {isRewardedAdLoading
                  ? '광고 준비 중...'
                  : isRewardedAdLoaded
                    ? '광고 보고 확인하기'
                    : '광고 다시 불러오기'}
              </Text>
            </Pressable>
          </View>
        )}
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

      <Modal
        visible={
          isDetailModalVisible
        }
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={
          closeBarDetail
        }
      >
        <View
          style={
            styles.modalRoot
          }
        >
          <Animated.View
            style={[
              styles.modalBackdrop,

              {
                opacity:
                  backdropOpacity,
              },
            ]}
          >
            <Pressable
              style={
                styles.backdropPressArea
              }
              onPress={
                closeBarDetail
              }
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.bottomSheet,

              {
                transform: [
                  {
                    translateY:
                      sheetTranslateY,
                  },
                ],
              },
            ]}
          >

            <View
              style={
                styles.sheetHandle
              }
            />

            <View
              style={
                styles.sheetHeader
              }
            >
              <View
                style={
                  styles.sheetTitleArea
                }
              >
                <Text
                  style={
                    styles.sheetTitle
                  }
                >
                  {selectedBarDetail?.title}
                </Text>

                <Text
                  style={
                    styles.sheetSummary
                  }
                >
                  총{' '}
                  {selectedBarDetail?.expenses.length ??
                    0}
                  건 ·{' '}
                  {formatMoney(
                    selectedBarDetail?.expenses.reduce(
                      (
                        sum,
                        expense
                      ) =>
                        sum +
                        Number(
                          expense.amount ||
                            0
                        ),
                      0
                    ) ?? 0
                  )}
                  원
                </Text>
              </View>

              <Pressable
                style={
                  styles.sheetCloseButton
                }
                onPress={
                  closeBarDetail
                }
                hitSlop={8}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#687386"
                />
              </Pressable>
            </View>

            <ScrollView
              style={
                styles.sheetList
              }
              contentContainerStyle={
                styles.sheetListContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {selectedBarDetail?.expenses.map(
                (expense) => (
                  <View
                    key={
                      expense.id
                    }
                    style={
                      styles.sheetExpenseRow
                    }
                  >
                    <View
                      style={
                        styles.sheetExpenseLeft
                      }
                    >
                      <Text
                        style={
                          styles.sheetExpenseTitle
                        }
                        numberOfLines={1}
                      >
                        {
                          expense.title
                        }
                      </Text>

                      <Text
                        style={
                          styles.sheetExpenseMeta
                        }
                      >
                        {formatExpenseDate(
                          expense.createdAt
                        )}
                        {' · '}
                        {formatExpenseTime(
                          expense.createdAt
                        )}
                        {' · '}
                        {getCategoryLabel(
                          expense.category
                        )}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.sheetExpenseAmount
                      }
                    >
                      {formatMoney(
                        Number(
                          expense.amount ||
                            0
                        )
                      )}
                      원
                    </Text>
                  </View>
                )
              )}
            </ScrollView>

          </Animated.View>
        </View>
      </Modal>
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

  /* 소비 인사이트 */

  insightCard: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#F2E6C9',
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#FFFCF5',
  },

  insightTitleArea: {
    flex: 1,
    paddingRight: 12,
  },

  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFF1CF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  insightLocked: {
    marginTop: 20,
  },

  insightLockedText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#687386',
  },

  insightButton: {
    minHeight: 48,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#3563C9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  insightButtonPressed: {
    opacity: 0.86,
  },

  insightButtonDisabled: {
    backgroundColor: '#9DB1DD',
  },

  insightButtonText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },

  insightList: {
    marginTop: 18,
    gap: 12,
  },

  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  insightRowIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#EEF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  insightText: {
    flex: 1,
    paddingTop: 3,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: 'Pretendard-SemiBold',
    color: '#344054',
  },

  unlockedCaption: {
    marginTop: 3,
    fontSize: 11,
    color: '#98A2B3',
    textAlign: 'right',
  },

  insightEmpty: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 14,
  },

  insightEmptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#8792A2',
    textAlign: 'center',
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

  /* 막대 상세 Bottom Sheet */

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor:
      'rgba(23, 32, 51, 0.38)',
  },

  backdropPressArea: {
    flex: 1,
  },

  bottomSheet: {
    maxHeight: '90%',
    overflow: 'hidden',
    backgroundColor:
      '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,

    shadowColor:
      '#000000',

    shadowOffset: {
      width: 0,
      height: -5,
    },

    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 12,
  },

  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor:
      '#D7DDE6',
    marginBottom: 22,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  sheetTitleArea: {
    flex: 1,
  },

  sheetTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#172033',
  },

  sheetSummary: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Pretendard-Regular',
    color: '#687386',
  },

  sheetCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetList: {
    marginTop: 18,
  },

  sheetListContent: {
    paddingBottom: 8,
  },

  sheetExpenseRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
    paddingVertical: 12,
  },

  sheetExpenseLeft: {
    flex: 1,
    paddingRight: 14,
  },

  sheetExpenseTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },

  sheetExpenseMeta: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Pretendard-Regular',
    color: '#8792A2',
  },

  sheetExpenseAmount: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#172033',
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
