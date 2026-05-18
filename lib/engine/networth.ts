import { Asset, Liability, NetWorthSnapshot } from './types';
import { Loan, Transaction } from '../finance-types';

/**
 * Calculates current net worth considering Assets, Manual Liabilities, and Auto-detected Liabilities (Loans, Credit Card expenses).
 */
export function calculateNetWorth(
  assets: Asset[],
  liabilities: Liability[],
  loans: Loan[],
  transactions: Transaction[]
): {
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  breakdown: {
    assets: { id?: string; name: string; value: number }[];
    liabilities: { id?: string; name: string; value: number }[];
  };
} {
  const assetsTotal = assets.reduce((sum, a) => sum + a.currentValue, 0);

  // Manual Liabilities
  const manualLiabilitiesTotal = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0);

  // Auto liabilities: active loans
  const activeLoans = loans.filter(l => l.status === 'active');
  const loansTotal = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0);

  // Auto liabilities: Current month's credit card transactions
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const creditCardTotal = transactions
    .filter(t => t.paymentMethod === 'credit_card' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const liabilitiesTotal = manualLiabilitiesTotal + loansTotal + creditCardTotal;
  const netWorth = assetsTotal - liabilitiesTotal;

  // Build Breakdown
  const assetsBreakdown = assets.map(a => ({ id: a.id, name: a.name, value: a.currentValue }));
  
  const liabilitiesBreakdown = [
    ...liabilities.map(l => ({ id: l.id, name: l.name, value: l.remainingAmount })),
    ...activeLoans.map(l => ({ id: l.id, name: `Empréstimo: ${l.name}`, value: l.remainingAmount })),
  ];
  if (creditCardTotal > 0) {
    liabilitiesBreakdown.push({ name: 'Fatura Cartões (Mês Atual)', value: creditCardTotal });
  }

  return {
    assetsTotal,
    liabilitiesTotal,
    netWorth,
    breakdown: {
      assets: assetsBreakdown,
      liabilities: liabilitiesBreakdown,
    },
  };
}

/**
 * Generates historical net worth snapshots based on transactions and snapshots.
 */
export function generateNetWorthHistory(
  assets: Asset[],
  liabilities: Liability[],
  loans: Loan[],
  transactions: Transaction[],
  monthsCount: number = 6
): NetWorthSnapshot[] {
  const history: NetWorthSnapshot[] = [];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // Filter transactions up to this month
    const txUpToMonth = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate <= new Date(d.getFullYear(), d.getMonth() + 1, 0); // end of month
    });

    // Estimate Credit Card liability for that specific month
    const creditCardForMonth = transactions
      .filter(t => t.paymentMethod === 'credit_card' && t.date.startsWith(monthStr))
      .reduce((sum, t) => sum + t.amount, 0);

    // Estimate Loan balances for that specific month (backtracking)
    let loansTotalForMonth = 0;
    for (const loan of loans) {
      const loanStart = new Date(loan.startDate);
      if (loanStart <= d) {
        // Approximate balance remaining in that month
        const monthsDiff = (d.getFullYear() - loanStart.getFullYear()) * 12 + (d.getMonth() - loanStart.getMonth());
        if (monthsDiff >= 0 && monthsDiff < loan.installments) {
          const unpaidInstallments = loan.installments - Math.min(monthsDiff, loan.paidInstallments);
          loansTotalForMonth += unpaidInstallments * loan.monthlyPayment;
        }
      }
    }

    // Dynamic Net Worth backtracking for assets/liabilities if they weren't updated.
    // For now we assume manual assets and manual liabilities are stable if not recorded historically.
    const assetsTotal = assets.reduce((sum, a) => sum + a.currentValue, 0);
    const manualLiabilitiesTotal = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0);

    const liabilitiesTotal = manualLiabilitiesTotal + loansTotalForMonth + creditCardForMonth;
    const netWorth = assetsTotal - liabilitiesTotal;

    history.push({
      month: monthStr,
      assetsTotal,
      liabilitiesTotal,
      netWorth,
    });
  }

  return history;
}
