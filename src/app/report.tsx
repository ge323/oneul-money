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


const EXPENSES_KEY = 'expenses';
const CUSTOM_CATEGORIES_KEY = 'custom-categories';
const INSIGHT_UNLOCK_DATE_KEY = 'report-insight-unlock-date';
const USE_TEST_ADS =
  __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_ADS === 'true';

const REWARDED_AD_UNIT_ID = USE_TEST_ADS
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
  title: string;
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
      (error: unknown) => {
        console.error('보상형 광고 불러오기 실패:', error);
        setIsRewardedAdLoaded(false);
        setIsRewardedAdLoading(false);
      }
    );

    mobileAds()
      .initialize()
      .then(() => rewardedAd.load())
      .catch((error: unknown) => {
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
        unlockedDate,
      ] = await Promise.all([
        AsyncStorage.getItem(
          EXPENSES_KEY
        ),
        AsyncStorage.getItem(
          CUSTOM_CATEGORIES_KEY
        ),
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

  // 기간 탭과 무관하게 지금까지 기록한 모든 지출로 소비 습관을 분석합니다.
  const validExpenses = useMemo(() => expenses.filter((expense) => {
    const amount = Number(expense.amount);
    const date = new Date(expense.createdAt);
    return Number.isFinite(amount) && amount > 0 &&
      !Number.isNaN(date.getTime()) && date <= getNow();
  }), [expenses]);

  const hasEnoughInsightData = validExpenses.length >= 10;

  const spendingAnalysis = useMemo(() => {
    if (!hasEnoughInsightData) return null;

    const total = validExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const counts = new Map<string, number>();
    const amounts = new Map<string, number>();
    const weekdays = Array(7).fill(0) as number[];
    let smallCount = 0;
    let weekendTotal = 0;
    let earliest = Infinity;
    let latest = -Infinity;

    validExpenses.forEach((item) => {
      const amount = Number(item.amount);
      const date = new Date(item.createdAt);
      const category = item.category || 'etc';
      counts.set(category, (counts.get(category) || 0) + 1);
      amounts.set(category, (amounts.get(category) || 0) + amount);
      weekdays[date.getDay()] += amount;
      if (date.getDay() === 0 || date.getDay() === 6) weekendTotal += amount;
      if (amount <= 10000) smallCount += 1;
      earliest = Math.min(earliest, date.getTime());
      latest = Math.max(latest, date.getTime());
    });

    const topAmount = [...amounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topCount = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    const categoryName = (id: string) =>
      CATEGORIES.find((item) => item.id === id)?.label ||
      customCategories.find((item) => item.id === id)?.label || '기타';
    const topShare = Math.round((topAmount[1] / total) * 100);
    const smallShare = Math.round((smallCount / validExpenses.length) * 100);
    const weekendShare = Math.round((weekendTotal / total) * 100);
    const spanDays = Math.floor((latest - earliest) / 86400000) + 1;
    const weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const topDay = weekdays.indexOf(Math.max(...weekdays));

    let typeTitle = '균형 탐색형';
    let typeDescription = '여러 항목에 지출이 분산되어 있어요.';
    let advice = '지출을 꾸준히 기록하면서 자주 사용하는 항목부터 예산을 정해보세요.';

    if (spanDays >= 14 && weekendShare >= 45) {
      typeTitle = '주말 소비 집중형';
      typeDescription = `기록된 지출 금액의 ${weekendShare}%가 주말에 발생했어요.`;
      advice = '주말에 사용할 금액을 미리 정해두면 예상치 못한 지출을 줄이는 데 도움이 돼요.';
    } else if (smallShare >= 60) {
      typeTitle = '소액 결제 빈번형';
      typeDescription = `1만 원 이하 결제가 전체 ${smallShare}%를 차지해요.`;
      advice = '작은 결제도 모이면 커질 수 있어요. 자주 쓰는 항목의 주간 한도를 정해보세요.';
    } else if (topShare >= 45) {
      typeTitle = `${categoryName(topAmount[0])} 중심 소비형`;
      typeDescription = `${categoryName(topAmount[0])} 지출이 전체 금액의 ${topShare}%를 차지해요.`;
      advice = `${categoryName(topAmount[0])} 항목에 월별 한도를 정해두면 소비 관리에 도움이 돼요.`;
    }

    const insights: Insight[] = [
      {
        id: 'category', icon: 'pie-chart-outline',
        title: '가장 지출이 큰 항목',
        text: `${categoryName(topAmount[0])}에 ${formatMoney(topAmount[1])}원을 썼어요. 전체 지출의 ${topShare}%예요.`,
      },
      {
        id: 'frequency', icon: 'receipt-outline',
        title: '자주 반복된 소비',
        text: `${categoryName(topCount[0])} 항목을 ${topCount[1]}번 기록했어요. 1만 원 이하 결제는 ${smallCount}건(${smallShare}%)이에요.`,
      },
      spanDays >= 14 ? {
        id: 'weekday', icon: 'calendar-outline',
        title: '요일별 소비 특징',
        text: `기록된 지출 중 ${weekdayNames[topDay]}요일의 총액이 가장 높아요. 주말 지출 비중은 ${weekendShare}%예요.`,
      } : {
        id: 'average', icon: 'wallet-outline',
        title: '한 번에 쓰는 금액',
        text: `지출 1건당 평균 ${formatMoney(Math.round(total / validExpenses.length))}원을 사용했어요.`,
      },
    ];

    return { typeTitle, typeDescription, advice, insights, count: validExpenses.length };
  }, [validExpenses, customCategories, hasEnoughInsightData]);

  const showRewardedAd = async () => {
    if (!hasEnoughInsightData) return;
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

      {/* 소비 습관 분석: 기존 보상형 광고 및 당일 잠금 해제 유지 */}
      <View style={styles.insightCard}>
        <View style={styles.cardHeader}>
          <View style={styles.insightTitleArea}>
            <Text style={styles.cardTitle}>나의 소비 습관 분석</Text>
            <Text style={styles.cardDescription}>
              지금까지 기록한 지출에서 소비 습관을 찾아드려요.
            </Text>
          </View>
          <View style={styles.insightIcon}>
            <Ionicons name="sparkles-outline" size={19} color="#D58B16" />
          </View>
        </View>

        {!hasEnoughInsightData ? (
          <View style={styles.insightEmpty}>
            <Text style={styles.insightEmptyText}>
              분석하려면 지출 기록이 10건 이상 필요해요.{'\n'}
              현재 {validExpenses.length}건 기록했어요.
            </Text>
          </View>
        ) : isInsightUnlocked && spendingAnalysis ? (
          <View style={styles.insightList}>
            <View style={styles.personaCard}>
              <Text style={styles.personaEyebrow}>나의 소비 유형</Text>
              <Text style={styles.personaTitle}>{spendingAnalysis.typeTitle}</Text>
              <Text style={styles.personaDescription}>{spendingAnalysis.typeDescription}</Text>
            </View>
            <Text style={styles.insightSectionTitle}>발견한 소비 습관</Text>
            {spendingAnalysis.insights.map((insight) => (
              <View key={insight.id} style={styles.insightRow}>
                <View style={styles.insightRowIcon}>
                  <Ionicons name={insight.icon} size={16} color="#3563C9" />
                </View>
                <View style={styles.insightBody}>
                  <Text style={styles.insightRowTitle}>{insight.title}</Text>
                  <Text style={styles.insightText}>{insight.text}</Text>
                </View>
              </View>
            ))}
            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>💡 나를 위한 소비 조언</Text>
              <Text style={styles.adviceText}>{spendingAnalysis.advice}</Text>
            </View>
            <Text style={styles.unlockedCaption}>
              총 {spendingAnalysis.count}건 분석 · 오늘은 광고 없이 다시 확인할 수 있어요.
            </Text>
          </View>
        ) : (
          <View style={styles.insightLocked}>
            <Text style={styles.insightLockedText}>
              광고 1회 시청으로 소비 유형과 습관, 맞춤 조언을 확인해보세요.
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
                name={isRewardedAdLoading ? 'hourglass-outline' : isRewardedAdLoaded ? 'play-circle-outline' : 'refresh-outline'}
                size={19}
                color="#FFFFFF"
              />
              <Text style={styles.insightButtonText}>
                {isRewardedAdLoading ? '광고 준비 중...' : isRewardedAdLoaded ? '광고 보고 소비 습관 분석하기' : '광고 다시 불러오기'}
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

  personaCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#EEF3FC',
  },
  personaEyebrow: {
    fontSize: 12,
    color: '#687386',
    fontFamily: 'Pretendard-SemiBold',
  },
  personaTitle: {
    marginTop: 6,
    fontSize: 19,
    color: '#172033',
    fontFamily: 'Pretendard-ExtraBold',
  },
  personaDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: '#566176',
  },
  insightSectionTitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },
  insightBody: { flex: 1 },
  insightRowTitle: {
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },
  adviceCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  adviceTitle: {
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    color: '#172033',
  },
  adviceText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: '#566176',
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
