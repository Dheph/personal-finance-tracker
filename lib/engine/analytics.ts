import { Transaction } from '../finance-types';
import { DynamicExpense, MonthlySnapshot, BehaviorInsight } from './types';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Detects dynamic recurring expenses (varying bills like electricity, water, gas, condo)
 * from transaction history and generates calculated metrics and behavior insights.
 */
export function detectDynamicExpenses(transactions: Transaction[]): {
  dynamicExpenses: DynamicExpense[];
  insights: BehaviorInsight[];
} {
  const expenses = transactions.filter(t => t.type === 'expense');
  const groups: { [key: string]: Transaction[] } = {};

  // Group transactions by normalized description
  expenses.forEach(tx => {
    const cleanName = tx.description
      .toLowerCase()
      .replace(/\s*\(\d+\/\d+\)/g, '') // strip installments
      .replace(/\d+/g, '')             // strip numbers
      .trim();

    if (cleanName.length < 3) return;

    if (!groups[cleanName]) {
      groups[cleanName] = [];
    }
    groups[cleanName].push(tx);
  });

  const dynamicExpenses: DynamicExpense[] = [];
  const insights: BehaviorInsight[] = [];

  Object.entries(groups).forEach(([name, txs]) => {
    if (txs.length < 3) return; // Need at least 3 historical points to calculate average and variation

    // Sort by date ascending
    txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Check monthly recurrence interval
    const intervals: number[] = [];
    for (let i = 1; i < txs.length; i++) {
      intervals.push(differenceInDays(parseISO(txs[i].date), parseISO(txs[i - 1].date)));
    }
    const isMonthly = intervals.some(days => days >= 25 && days <= 35);

    if (!isMonthly) return;

    // Check if the amount actually varies (standard deviation > 0 to be dynamic, not fixed subscription)
    const amounts = txs.map(t => t.amount);
    const avgAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const isFixed = amounts.every(val => Math.abs(val - avgAmount) < 0.5); // difference is negligible

    if (isFixed) return; // This is a fixed subscription, handled by subscriptions.ts

    // Group into monthly snapshots
    const history: MonthlySnapshot[] = txs.map(t => {
      const monthStr = t.date.substring(0, 7); // YYYY-MM
      return {
        month: monthStr,
        amount: t.amount,
      };
    });

    // 3-Month Moving Average for Expected Amount
    const last3Months = history.slice(-3);
    const expectedAmount = last3Months.reduce((sum, snap) => sum + snap.amount, 0) / last3Months.length;

    // Calculate Variation between the last two months
    let variationPct = 0;
    const lastSnapshot = history[history.length - 1];
    const prevSnapshot = history[history.length - 2];
    if (prevSnapshot && prevSnapshot.amount > 0) {
      variationPct = ((lastSnapshot.amount - prevSnapshot.amount) / prevSnapshot.amount) * 100;
    }

    const variationThreshold = 0.15; // 15% threshold for anomalies

    const dynamicExp: DynamicExpense = {
      id: `dynamic-${name.replace(/\s+/g, '-')}`,
      name: txs[txs.length - 1].description,
      category: txs[txs.length - 1].category,
      recurrence: {
        frequency: 'monthly',
        type: 'dynamic',
      },
      expectedAmount,
      variationThreshold,
      history,
    };

    dynamicExpenses.push(dynamicExp);

    // Insight 1: Anomaly detection (amount exceeded historical expectation by threshold)
    if (lastSnapshot.amount > expectedAmount * (1 + variationThreshold)) {
      const excessPct = ((lastSnapshot.amount - expectedAmount) / expectedAmount) * 100;
      insights.push({
        type: 'dynamic_expense_anomaly',
        severity: 'high',
        message: `Despesa com "${dynamicExp.name}" veio R$ ${lastSnapshot.amount.toFixed(2)}, ficando ${excessPct.toFixed(0)}% acima da média histórica (R$ ${expectedAmount.toFixed(2)}).`,
      });
    }

    // Insight 2: High monthly variation alert
    if (variationPct >= 10) {
      insights.push({
        type: 'dynamic_expense_variation',
        severity: 'medium',
        message: `A conta de "${dynamicExp.name}" subiu ${variationPct.toFixed(0)}% em relação ao mês anterior (R$ ${prevSnapshot.amount.toFixed(2)} ➔ R$ ${lastSnapshot.amount.toFixed(2)}).`,
      });
    } else if (variationPct <= -10) {
      insights.push({
        type: 'dynamic_expense_drop',
        severity: 'low',
        message: `Boa! A conta de "${dynamicExp.name}" caiu ${Math.abs(variationPct).toFixed(0)}% este mês.`,
      });
    }
  });

  return {
    dynamicExpenses,
    insights,
  };
}
