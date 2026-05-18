import { Transaction, Card } from '../finance-types';
import { BehaviorInsight } from './types';
import { getDay, parseISO } from 'date-fns';

/**
 * Runs advanced behavioral heuristics on transaction history to evaluate spending habits.
 */
export function analyzeExpenseBehavior(
  transactions: Transaction[],
  cards: Card[]
): BehaviorInsight[] {
  const insights: BehaviorInsight[] = [];
  const expenses = transactions.filter(t => t.type === 'expense');

  if (expenses.length < 5) return [];

  // 1. Weekend Spending Analysis
  const weekendExpenses = expenses.filter(t => {
    const day = getDay(parseISO(t.date));
    return day === 0 || day === 6; // Sunday or Saturday
  });
  const weekendSum = weekendExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalSum = expenses.reduce((sum, t) => sum + t.amount, 0);

  if (totalSum > 0) {
    const weekendRatio = weekendSum / totalSum;
    if (weekendRatio > 0.55) {
      insights.push({
        type: 'weekend_spending_spike',
        severity: weekendRatio > 0.7 ? 'high' : 'medium',
        message: `Comportamento de Fim de Semana: ${Math.round(weekendRatio * 100)}% dos seus gastos totais ocorrem no sábado ou domingo (R$ ${weekendSum.toFixed(2)} de R$ ${totalSum.toFixed(2)}).`,
      });
    }
  }

  // 2. Late Night Stress Spending (after 22h / 10 PM)
  const lateNightExpenses = expenses.filter(t => {
    try {
      if (!t.createdAt) return false;
      const dateObj = new Date(t.createdAt);
      const hours = dateObj.getHours();
      return (hours >= 22 || hours < 5) && (t.category === 'food' || t.category === 'entertainment' || t.category === 'shopping');
    } catch {
      return false;
    }
  });

  if (lateNightExpenses.length >= 3) {
    const lateNightSum = lateNightExpenses.reduce((sum, t) => sum + t.amount, 0);
    insights.push({
      type: 'stress_spending',
      severity: 'medium',
      message: `Gastos Noturnos Detectados: Você fez ${lateNightExpenses.length} compras de alimentação/lazer após as 22h recentemente, totalizando R$ ${lateNightSum.toFixed(2)}. Cuidado com compras por impulso.`,
    });
  }

  // 3. Daily Impulse Pattern (Multiple purchases in shopping/delivery in a single day)
  const dateGroups: { [key: string]: Transaction[] } = {};
  expenses.forEach(t => {
    if (t.category === 'shopping' || t.category === 'food') {
      if (!dateGroups[t.date]) dateGroups[t.date] = [];
      dateGroups[t.date].push(t);
    }
  });

  let impulseDaysCount = 0;
  Object.values(dateGroups).forEach(txs => {
    if (txs.length >= 3) impulseDaysCount++;
  });

  if (impulseDaysCount >= 2) {
    insights.push({
      type: 'impulse_spending',
      severity: 'high',
      message: `Impulsividade: Detectamos múltiplos dias com 3 ou mais compras de compras/alimentação no mesmo dia. Tente aguardar 24 horas antes de fechar carrinhos.`,
    });
  }

  // 4. Spending proximity to Credit Card Closing statement
  cards.forEach(card => {
    const cardExpenses = expenses.filter(t => t.paymentMethod === 'credit_card' && t.cardId === card.id);
    if (cardExpenses.length < 5) return;

    let spikesBeforeClosing = 0;
    cardExpenses.forEach(t => {
      try {
        const dateObj = parseISO(t.date);
        const day = dateObj.getDate();
        const daysToClose = card.closingDay - day;
        // Spikes within 3 days before closing day
        if (daysToClose >= 0 && daysToClose <= 3) {
          spikesBeforeClosing++;
        }
      } catch {}
    });

    if (spikesBeforeClosing >= 3) {
      insights.push({
        type: 'proximity_spending',
        severity: 'medium',
        message: `Efeito Fechamento (${card.name}): Seus gastos tendem a subir na semana de fechamento da fatura (dia ${card.closingDay}). Evite antecipar compras apenas por "virar" a fatura.`,
      });
    }
  });

  return insights;
}
