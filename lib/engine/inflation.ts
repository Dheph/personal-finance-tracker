import { Transaction } from '../finance-types';
import { differenceInDays, parseISO } from 'date-fns';

export interface InflationReport {
  personalInflationRate: number; // percentage, e.g. 3.4 for +3.4%
  isInflationPositive: boolean;
  categoryInflation: {
    category: string;
    rate: number;
    spendA: number;
    spendB: number;
  }[];
  insightMessage: string;
}

/**
 * Calculates a custom Personal Inflation Index comparing standard cost categories 
 * between the last 30 days (Period A) and the preceding 30-60 days (Period B).
 */
export function calculatePersonalInflation(transactions: Transaction[]): InflationReport {
  const expenses = transactions.filter(t => t.type === 'expense');
  const today = new Date();

  // Categories to evaluate for personal cost of living
  const essentialCategories = ['food', 'utilities', 'transportation', 'health', 'housing'];

  // Segment transactions into Period A (0-30 days ago) and Period B (31-60 days ago)
  const periodA = expenses.filter(t => {
    try {
      const days = differenceInDays(today, parseISO(t.date));
      return days >= 0 && days <= 30 && essentialCategories.includes(t.category);
    } catch {
      return false;
    }
  });

  const periodB = expenses.filter(t => {
    try {
      const days = differenceInDays(today, parseISO(t.date));
      return days >= 31 && days <= 60 && essentialCategories.includes(t.category);
    } catch {
      return false;
    }
  });

  // Calculate sum and averages
  const sumA = periodA.reduce((sum, t) => sum + t.amount, 0);
  const sumB = periodB.reduce((sum, t) => sum + t.amount, 0);

  let personalInflationRate = 0;
  let isInflationPositive = true;

  if (sumB > 0 && sumA > 0) {
    personalInflationRate = ((sumA - sumB) / sumB) * 100;
    isInflationPositive = personalInflationRate >= 0;
  }

  // Calculate breakdown by category
  const categoryInflation: {
    category: string;
    rate: number;
    spendA: number;
    spendB: number;
  }[] = [];

  essentialCategories.forEach(cat => {
    const catA = periodA.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
    const catB = periodB.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);

    if (catB > 0 && catA > 0) {
      const rate = ((catA - catB) / catB) * 100;
      categoryInflation.push({
        category: cat,
        rate,
        spendA: catA,
        spendB: catB,
      });
    }
  });

  // Pick the category with the highest positive cost hike to build a highly targeted advice message
  let highestInflationCategory = '';
  let highestRate = 0;
  categoryInflation.forEach(item => {
    if (item.rate > highestRate) {
      highestRate = item.rate;
      highestInflationCategory = item.category;
    }
  });

  const CATEGORY_TRANSLATIONS: { [key: string]: string } = {
    food: 'Alimentação',
    utilities: 'Contas de Consumo',
    transportation: 'Transporte',
    health: 'Saúde',
    housing: 'Moradia',
  };

  let insightMessage = 'Seu custo de vida básico está equilibrado em relação ao mês anterior.';
  if (personalInflationRate > 0) {
    const catTranslated = CATEGORY_TRANSLATIONS[highestInflationCategory] || highestInflationCategory;
    insightMessage = `Seu custo de vida básico subiu ${personalInflationRate.toFixed(1)}% este mês. O principal fator de aumento foi a categoria de ${catTranslated}, que teve alta de ${highestRate.toFixed(0)}%.`;
  } else if (personalInflationRate < 0) {
    insightMessage = `Ótima notícia! Seu custo de vida básico diminuiu ${Math.abs(personalInflationRate).toFixed(1)}% em comparação ao mês passado.`;
  }

  return {
    personalInflationRate,
    isInflationPositive,
    categoryInflation,
    insightMessage,
  };
}
