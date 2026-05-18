import { Transaction } from '../finance-types';
import { Subscription, BehaviorInsight } from './types';
import { parseISO, differenceInDays } from 'date-fns';

/**
 * Automatically detects subscriptions from transaction history.
 * A subscription is defined by regular, monthly payments with similar names.
 */
export function detectSubscriptions(transactions: Transaction[]): {
  subscriptions: Subscription[];
  insights: BehaviorInsight[];
} {
  const expenses = transactions.filter(t => t.type === 'expense');
  const groups: { [key: string]: Transaction[] } = {};

  // Group by normalized name (lowercase, stripped numbers/months)
  expenses.forEach(tx => {
    const cleanName = tx.description
      .toLowerCase()
      .replace(/\s*\(\d+\/\d+\)/g, '') // strip installments notation
      .replace(/\d+/g, '')             // strip numbers
      .trim();
    
    if (cleanName.length < 3) return; // ignore extremely short names
    
    if (!groups[cleanName]) {
      groups[cleanName] = [];
    }
    groups[cleanName].push(tx);
  });

  const subscriptions: Subscription[] = [];
  const insights: BehaviorInsight[] = [];
  let detectedSubCount = 0;

  Object.entries(groups).forEach(([name, txs]) => {
    if (txs.length < 2) return; // Need at least 2 payments to assume recurrence

    // Sort by date ascending
    txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Check intervals in days between consecutive payments
    const intervals: number[] = [];
    for (let i = 1; i < txs.length; i++) {
      const days = differenceInDays(parseISO(txs[i].date), parseISO(txs[i - 1].date));
      intervals.push(days);
    }

    // A subscription has a regular interval around 25-35 days (monthly) or 350-380 days (yearly)
    const isMonthly = intervals.some(days => days >= 25 && days <= 35);
    const isYearly = intervals.some(days => days >= 340 && days <= 380);

    if (isMonthly || isYearly) {
      detectedSubCount++;
      const billingCycle = isYearly ? 'yearly' : 'monthly';
      const amountHistory = txs.map(t => t.amount);
      const lastTx = txs[txs.length - 1];

      // Calculate next charge date estimation
      const lastDate = new Date(lastTx.date);
      const nextCharge = new Date(lastDate);
      if (billingCycle === 'monthly') {
        nextCharge.setMonth(nextCharge.getMonth() + 1);
      } else {
        nextCharge.setFullYear(nextCharge.getFullYear() + 1);
      }

      subscriptions.push({
        id: `detected-${name.replace(/\s+/g, '-')}`,
        name: lastTx.description,
        amountHistory,
        billingCycle,
        nextChargeDate: nextCharge.toISOString().split('T')[0],
        category: lastTx.category,
        isActive: differenceInDays(new Date(), lastDate) < (isMonthly ? 45 : 400),
      });

      // Insight 1: Detect subscription price increase
      if (amountHistory.length >= 2) {
        const lastAmount = amountHistory[amountHistory.length - 1];
        const prevAmount = amountHistory[amountHistory.length - 2];
        if (lastAmount > prevAmount) {
          const increasePct = ((lastAmount - prevAmount) / prevAmount) * 100;
          insights.push({
            type: 'subscription_increase',
            severity: 'medium',
            message: `A assinatura do ${lastTx.description} aumentou ${increasePct.toFixed(0)}% (de R$ ${prevAmount.toFixed(2)} para R$ ${lastAmount.toFixed(2)})`,
          });
        }
      }

      // Insight 2: Detect duplicate subscriptions (e.g. paying twice in the same month)
      const months = txs.map(t => t.date.substring(0, 7));
      const hasDuplicates = months.some((m, idx) => months.indexOf(m) !== idx);
      if (hasDuplicates && billingCycle === 'monthly') {
        insights.push({
          type: 'subscription_duplicate',
          severity: 'high',
          message: `Possível cobrança duplicada detectada para ${lastTx.description} no mesmo mês.`,
        });
      }
    }
  });

  if (detectedSubCount > 10) {
    insights.push({
      type: 'too_many_subscriptions',
      severity: 'medium',
      message: `Você possui ${detectedSubCount} assinaturas ativas detectadas. Considere revisar possíveis desperdícios.`,
    });
  }

  return {
    subscriptions,
    insights,
  };
}
