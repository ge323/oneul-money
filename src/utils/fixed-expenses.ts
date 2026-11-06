
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FIXED_EXPENSES_KEY = 'fixed-expenses';

export type FixedExpense = {
  id: string;
  title: string;
  amount: number;
  paymentDay: number;
  enabled: boolean;
};

export async function loadFixedExpenses(): Promise<FixedExpense[]> {
  try {
    const raw = await AsyncStorage.getItem(FIXED_EXPENSES_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is FixedExpense => {
      if (!item || typeof item !== 'object') return false;

      const e = item as Partial<FixedExpense>;

      return (
        typeof e.id === 'string' &&
        typeof e.title === 'string' &&
        typeof e.amount === 'number' &&
        Number.isFinite(e.amount) &&
        e.amount >= 0 &&
       typeof e.paymentDay === 'number' &&
        Number.isInteger(e.paymentDay) &&
        e.paymentDay >= 1 &&
        e.paymentDay <= 31 &&
        typeof e.enabled === 'boolean'
      );
    });
  } catch (error) {
    console.error('고정지출 불러오기 실패:', error);
    return [];
  }
}

export async function saveFixedExpenses(
  items: FixedExpense[]
): Promise<void> {
  await AsyncStorage.setItem(
    FIXED_EXPENSES_KEY,
    JSON.stringify(items)
  );
}

export function getMonthlyFixedTotal(
  items: FixedExpense[]
): number {
  return items.reduce(
    (sum, item) => sum + (item.enabled ? item.amount : 0),
    0
  );
}

export function calculateDailyAllowance(args: {
  monthlyBudget: number;
  fixedTotal: number;
  variableSpent: number;
  date?: Date;
}): number {
  const {
    monthlyBudget,
    fixedTotal,
    variableSpent,
    date = new Date(),
  } = args;

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  const remainingDays = Math.max(
    1,
    lastDay - date.getDate() + 1
  );

  const remaining = Math.max(
    0,
    monthlyBudget - fixedTotal - variableSpent
  );

  return Math.floor(
    (remaining * 0.9) / remainingDays
  );
}
