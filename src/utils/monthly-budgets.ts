import AsyncStorage from '@react-native-async-storage/async-storage';

export const MONTHLY_BUDGETS_KEY =
  'monthly-budgets';

export type MonthlyBudgets = Record<
  string,
  number
>;

export const getMonthKey = (
  date = new Date()
) => {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  return `${year}-${month}`;
};

export const getPreviousMonthKey = (
  date = new Date()
) => {
  const previousMonth =
    new Date(
      date.getFullYear(),
      date.getMonth() - 1,
      1
    );

  return getMonthKey(
    previousMonth
  );
};

export const loadMonthlyBudgets =
  async (): Promise<MonthlyBudgets> => {
    try {
      const saved =
        await AsyncStorage.getItem(
          MONTHLY_BUDGETS_KEY
        );

      if (!saved) {
        return {};
      }

      const parsed =
        JSON.parse(saved);

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        return {};
      }

      return parsed;
    } catch (error) {
      console.error(
        '월별 생활비 불러오기 실패:',
        error
      );

      return {};
    }
  };

export const saveMonthlyBudgets =
  async (
    budgets: MonthlyBudgets
  ) => {
    try {
      await AsyncStorage.setItem(
        MONTHLY_BUDGETS_KEY,
        JSON.stringify(budgets)
      );
    } catch (error) {
      console.error(
        '월별 생활비 저장 실패:',
        error
      );

      throw error;
    }
  };

export const getBudgetForMonth =
  async (
    date = new Date()
  ) => {
    const budgets =
      await loadMonthlyBudgets();

    const monthKey =
      getMonthKey(date);

    return Number(
      budgets[monthKey]
    ) || 0;
  };

export const saveBudgetForMonth =
  async (
    amount: number,
    date = new Date()
  ) => {
    const budgets =
      await loadMonthlyBudgets();

    const monthKey =
      getMonthKey(date);

    const updated = {
      ...budgets,
      [monthKey]:
        Math.max(
          0,
          Number(amount) || 0
        ),
    };

    await saveMonthlyBudgets(
      updated
    );

    return updated[monthKey];
  };

export const getLatestPreviousBudget =
  async (
    date = new Date()
  ) => {
    const budgets =
      await loadMonthlyBudgets();

    const currentMonthKey =
      getMonthKey(date);

    const previousKeys =
      Object.keys(budgets)
        .filter(
          (key) =>
            key < currentMonthKey
        )
        .sort()
        .reverse();

    if (
      previousKeys.length === 0
    ) {
      return 0;
    }

    const latestKey =
      previousKeys[0];

    return Number(
      budgets[latestKey]
    ) || 0;
  };

export const ensureCurrentMonthBudget =
  async (
    fallbackBudget = 0,
    date = new Date()
  ) => {
    const budgets =
      await loadMonthlyBudgets();

    const currentMonthKey =
      getMonthKey(date);

    const currentBudget =
      Number(
        budgets[
          currentMonthKey
        ]
      ) || 0;

    if (
      currentBudget > 0
    ) {
      return currentBudget;
    }

    const previousKeys =
      Object.keys(budgets)
        .filter(
          (key) =>
            key < currentMonthKey
        )
        .sort()
        .reverse();

    const previousBudget =
      previousKeys.length > 0
        ? Number(
            budgets[
              previousKeys[0]
            ]
          ) || 0
        : 0;

    const inheritedBudget =
      previousBudget > 0
        ? previousBudget
        : Math.max(
            0,
            Number(
              fallbackBudget
            ) || 0
          );

    if (
      inheritedBudget <= 0
    ) {
      return 0;
    }

    const updated = {
      ...budgets,
      [currentMonthKey]:
        inheritedBudget,
    };

    await saveMonthlyBudgets(
      updated
    );

    return inheritedBudget;
  };