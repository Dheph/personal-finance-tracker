import { Asset, Liability, Loan, Transaction } from '../finance-types';
import { differenceInDays, parseISO } from 'date-fns';

export interface RiskFactor {
  name: string;
  value: string;
  status: 'safe' | 'warning' | 'danger';
  description: string;
}

export interface RiskReport {
  score: number; // 0 - 100
  level: 'low' | 'medium' | 'high';
  liquidityMonths: number; // Months of coverage
  debtToAssetRatio: number;
  debtToIncomeRatio: number;
  factors: RiskFactor[];
  recommendation: string;
}

/**
 * Calculates a complete personal Financial Risk Matrix based on assets, liabilities, loans, and transaction history.
 */
export function calculateFinancialRisk(
  assets: Asset[],
  liabilities: Liability[],
  loans: Loan[],
  transactions: Transaction[]
): RiskReport {
  const today = new Date();

  // 1. Calculate Total Asset Value (manual)
  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);

  // 2. Calculate Liquid Assets (Cash, Investments, Crypto)
  const liquidAssets = assets
    .filter(a => ['cash', 'investment', 'crypto'].includes(a.type))
    .reduce((sum, a) => sum + a.currentValue, 0);

  // 3. Calculate Total Liabilities (Manual Liabilities + Active Loans remaining balance)
  const manualLiabilitiesVal = liabilities.reduce((sum, l) => sum + l.currentValue, 0);
  const activeLoans = loans.filter(l => l.status === 'active');
  const loansLiabilitiesVal = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalLiabilities = manualLiabilitiesVal + loansLiabilitiesVal;

  // 4. Calculate Average Monthly Expenses (rolling 90 days)
  const expenses = transactions.filter(t => t.type === 'expense');
  const recentExpenses = expenses.filter(t => {
    try {
      const days = differenceInDays(today, parseISO(t.date));
      return days >= 0 && days <= 90;
    } catch {
      return false;
    }
  });
  const totalRecentExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
  const averageMonthlyExpenses = totalRecentExpenses > 0 ? totalRecentExpenses / 3 : 3000; // default/fallback if none

  // 5. Calculate Average Monthly Income (rolling 90 days)
  const incomes = transactions.filter(t => t.type === 'income');
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

  // 6. Calculate Monthly Debt Commitments (Active loan payments + CC bills avg)
  const monthlyLoanPayments = activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const monthlyCcPayments = transactions
    .filter(t => t.paymentMethod === 'credit_card' && t.type === 'expense')
    .filter(t => {
      try {
        const days = differenceInDays(today, parseISO(t.date));
        return days >= 0 && days <= 90;
      } catch {
        return false;
      }
    })
    .reduce((sum, t) => sum + t.amount, 0) / 3;

  const totalMonthlyDebtPayments = monthlyLoanPayments + monthlyCcPayments;

  // Risk Core Calculations
  // A. Liquidity Months (Emergency Fund Coverage)
  const liquidityMonths = averageMonthlyExpenses > 0 ? liquidAssets / averageMonthlyExpenses : 99;

  // B. Debt-to-Asset Ratio
  const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : (totalLiabilities > 0 ? 1.0 : 0);

  // C. Debt-to-Income Ratio (Income Commitment)
  const debtToIncomeRatio = averageMonthlyIncome > 0 ? totalMonthlyDebtPayments / averageMonthlyIncome : 0;

  // Factor Details & Status Assignment
  const factors: RiskFactor[] = [];

  // Liquidity Factor
  let liquidityStatus: 'safe' | 'warning' | 'danger' = 'danger';
  let liquidityDesc = 'Seus ativos líquidos cobrem menos de 1 mês das suas despesas básicas.';
  if (liquidityMonths >= 6) {
    liquidityStatus = 'safe';
    liquidityDesc = 'Excelente! Sua reserva líquida cobre mais de 6 meses de despesas básicas.';
  } else if (liquidityMonths >= 3) {
    liquidityStatus = 'warning';
    liquidityDesc = 'Alerta. Sua reserva cobre de 3 a 6 meses de despesas básicas. Recomendado ampliar.';
  } else if (liquidityMonths >= 1) {
    liquidityStatus = 'warning';
    liquidityDesc = 'Atenção. Reserva baixa (cobre de 1 a 3 meses). Foco em aumentar poupança.';
  }
  factors.push({
    name: 'Reserva de Emergência',
    value: `${liquidityMonths.toFixed(1)} meses`,
    status: liquidityStatus,
    description: liquidityDesc,
  });

  // Debt-to-Asset Factor
  let dtaStatus: 'safe' | 'warning' | 'danger' = 'danger';
  let dtaDesc = 'Crítico. Suas dívidas totais superam 60% do seu patrimônio bruto total.';
  if (debtToAssetRatio <= 0.3) {
    dtaStatus = 'safe';
    dtaDesc = 'Saudável. Dívidas representam menos de 30% do seu patrimônio total.';
  } else if (debtToAssetRatio <= 0.6) {
    dtaStatus = 'warning';
    dtaDesc = 'Moderado. Suas dívidas comprometem entre 30% e 60% do patrimônio.';
  }
  factors.push({
    name: 'Relação Dívida/Patrimônio',
    value: `${(debtToAssetRatio * 100).toFixed(0)}%`,
    status: dtaStatus,
    description: dtaDesc,
  });

  // Debt-to-Income Commitment Factor
  let dtiStatus: 'safe' | 'warning' | 'danger' = 'danger';
  let dtiDesc = 'Perigoso! Mais de 45% do seu faturamento mensal vai direto para amortizar dívidas/faturas.';
  if (debtToIncomeRatio <= 0.15) {
    dtiStatus = 'safe';
    dtiDesc = 'Excelente. Menos de 15% da sua renda está comprometida com dívidas recorrentes.';
  } else if (debtToIncomeRatio <= 0.35) {
    dtiStatus = 'warning';
    dtiDesc = 'Moderado. Você compromete entre 15% e 35% da renda bruta com obrigações de dívida.';
  } else if (debtToIncomeRatio <= 0.45) {
    dtiStatus = 'warning';
    dtiDesc = 'Alerta Alto. Entre 35% e 45% da sua renda mensal está travada em parcelamentos e faturas.';
  }
  factors.push({
    name: 'Comprometimento da Renda',
    value: `${(debtToIncomeRatio * 100).toFixed(0)}%`,
    status: dtiStatus,
    description: dtiDesc,
  });

  // Score Formulation
  let score = 0;

  // Contribution from Liquidity (Max 35)
  if (liquidityMonths < 1) score += 35;
  else if (liquidityMonths < 3) score += 25;
  else if (liquidityMonths < 6) score += 12;

  // Contribution from Debt-to-Asset (Max 35)
  if (debtToAssetRatio > 0.6) score += 35;
  else if (debtToAssetRatio > 0.3) score += 20;
  else if (debtToAssetRatio > 0.1) score += 8;

  // Contribution from Debt-to-Income Commitment (Max 30)
  if (debtToIncomeRatio > 0.45) score += 30;
  else if (debtToIncomeRatio > 0.35) score += 22;
  else if (debtToIncomeRatio > 0.15) score += 10;

  score = Math.min(100, Math.round(score));

  let level: 'low' | 'medium' | 'high' = 'low';
  let recommendation = 'Seu perfil de risco financeiro está extremamente saudável. Continue mantendo sua excelente liquidez e controle de endividamento.';

  if (score >= 65) {
    level = 'high';
    recommendation = 'Ação Necessária! Alto comprometimento de renda e reservas críticas indicam estresse financeiro. Foco absoluto em quitar parcelamentos e congelar gastos não essenciais.';
  } else if (score >= 35) {
    level = 'medium';
    recommendation = 'Risco Moderado. Recomenda-se evitar novas dívidas de longo prazo e focar no aporte contínuo para atingir uma reserva mínima de 3 meses de despesas.';
  }

  return {
    score,
    level,
    liquidityMonths,
    debtToAssetRatio,
    debtToIncomeRatio,
    factors,
    recommendation,
  };
}
