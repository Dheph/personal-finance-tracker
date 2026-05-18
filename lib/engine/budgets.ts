import { Transaction } from '../finance-types';
import { differenceInDays, parseISO, startOfMonth, format } from 'date-fns';

export interface BudgetRecommendation {
  category: string;
  currentAverage: number; // 3-month rolling average
  recommendedLimit: number;
  status: 'under_control' | 'warning' | 'critical';
  currentMonthSpending: number;
  percentUsed: number;
  reason: string;
}

export interface DynamicBudgetReport {
  recommendations: BudgetRecommendation[];
  totalRecommended: number;
  suggestedSavings: number;
  totalCurrentMonthSpending: number;
  averageMonthlyIncome: number;
}

const CATEGORY_LABELS: { [key: string]: string } = {
  food: 'Alimentação',
  transport: 'Transporte',
  health: 'Saúde',
  education: 'Educação',
  housing: 'Moradia',
  utilities: 'Contas & Serviços',
  subscriptions: 'Assinaturas',
  shopping: 'Compras',
  travel: 'Viagem',
  entertainment: 'Lazer & Entretenimento',
  pets: 'Pets',
  insurance: 'Seguros',
  investments: 'Investimentos',
  debt_payment: 'Pagamento de Dívidas',
  taxes: 'Impostos',
  other_expense: 'Outras Despesas',
};

/**
 * Calculates dynamic budget recommendations based on a 3-month rolling average of expenses,
 * factored against average monthly income.
 */
export function calculateDynamicBudgets(
  transactions: Transaction[]
): DynamicBudgetReport {
  const expenses = transactions.filter(t => t.type === 'expense');
  const incomes = transactions.filter(t => t.type === 'income');
  const today = new Date();
  const currentMonthStr = format(today, 'yyyy-MM');

  // 1. Calculate Average Monthly Income (over past 90 days)
  const recentIncomes = incomes.filter(t => {
    try {
      const days = differenceInDays(today, parseISO(t.date));
      return days >= 0 && days <= 90;
    } catch {
      return false;
    }
  });
  const totalRecentIncome = recentIncomes.reduce((sum, t) => sum + t.amount, 0);
  const averageMonthlyIncome = totalRecentIncome > 0 ? totalRecentIncome / 3 : 0;

  // 2. Calculate category averages over rolling 90 days
  const recentExpenses = expenses.filter(t => {
    try {
      const days = differenceInDays(today, parseISO(t.date));
      return days >= 0 && days <= 90;
    } catch {
      return false;
    }
  });

  // Current Month Expenses
  const currentMonthExpenses = expenses.filter(t => {
    try {
      return t.competencyMonth === currentMonthStr || t.date.startsWith(currentMonthStr);
    } catch {
      return false;
    }
  });

  const categories = Array.from(new Set(expenses.map(t => t.category)));
  const recommendations: BudgetRecommendation[] = [];

  let totalRecommended = 0;
  let totalCurrentMonthSpending = 0;

  categories.forEach(cat => {
    const catRecent = recentExpenses.filter(t => t.category === cat);
    const catTotal = catRecent.reduce((sum, t) => sum + t.amount, 0);
    const currentAverage = catTotal / 3;

    const catCurrentMonth = currentMonthExpenses.filter(t => t.category === cat);
    const currentMonthSpending = catCurrentMonth.reduce((sum, t) => sum + t.amount, 0);
    totalCurrentMonthSpending += currentMonthSpending;

    if (currentAverage <= 0 && currentMonthSpending <= 0) return;

    // Apply smart multi-factor adjustments based on whether it is an essential or discretionary cost
    let multiplier = 1.0;
    let reason = 'Recomendado manter conforme média histórica.';

    // Essential categories
    const isEssential = ['food', 'utilities', 'health', 'housing', 'transport'].includes(cat);

    if (isEssential) {
      // Give a tiny buffer for essentials
      multiplier = 1.05;
      reason = 'Categoria essencial. Margem de segurança de +5% inclusa.';
    } else {
      // Discretionary: recommend optimization (trim 12%)
      multiplier = 0.88;
      reason = 'Categoria opcional. Sugerimos redução de 12% para otimização.';
    }

    // Income factor: if income is known and expenses are high, force extra optimization
    if (averageMonthlyIncome > 0) {
      const totalPastExpenseAvg = recentExpenses.reduce((sum, t) => sum + t.amount, 0) / 3;
      const savingsRate = (averageMonthlyIncome - totalPastExpenseAvg) / averageMonthlyIncome;

      if (savingsRate < 0.10) {
        // Savings rate below 10%, pressure discretionary category budgets by another 10%
        if (!isEssential) {
          multiplier *= 0.90;
          reason = 'Sua taxa de poupança está baixa (<10%). Corte preventivo de -10% recomendado.';
        }
      }
    }

    let recommendedLimit = Math.max(50, Math.round(currentAverage * multiplier));

    // Calculate percent used
    const percentUsed = recommendedLimit > 0 ? (currentMonthSpending / recommendedLimit) * 100 : 0;

    let status: 'under_control' | 'warning' | 'critical' = 'under_control';
    if (percentUsed >= 100) {
      status = 'critical';
    } else if (percentUsed >= 85) {
      status = 'warning';
    }

    recommendations.push({
      category: cat,
      currentAverage,
      recommendedLimit,
      status,
      currentMonthSpending,
      percentUsed,
      reason,
    });

    totalRecommended += recommendedLimit;
  });

  // Calculate suggested savings (Income - Recommended Budget)
  const suggestedSavings = averageMonthlyIncome > totalRecommended ? averageMonthlyIncome - totalRecommended : 0;

  // Sort recommendations: critical first, then warning, then under_control, and finally by highest current month spending
  recommendations.sort((a, b) => {
    const statusScore = { critical: 3, warning: 2, under_control: 1 };
    if (statusScore[a.status] !== statusScore[b.status]) {
      return statusScore[b.status] - statusScore[a.status];
    }
    return b.currentMonthSpending - a.currentMonthSpending;
  });

  return {
    recommendations,
    totalRecommended,
    suggestedSavings,
    totalCurrentMonthSpending,
    averageMonthlyIncome,
  };
}
