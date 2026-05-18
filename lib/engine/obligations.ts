import { SinkingFund, AnnualExpense } from '../finance-types';
import { differenceInMonths, parseISO, startOfMonth } from 'date-fns';

export interface SinkingFundReport {
  fund: SinkingFund;
  remainingAmount: number;
  monthsRemaining: number;
  monthlyContributionRequired: number;
}

export interface AnnualExpenseReport {
  expense: AnnualExpense;
  monthlyProvisionRequired: number;
  monthsUntilDue: number;
  nextDueDate: string;
}

export interface ObligationsReport {
  sinkingFunds: SinkingFundReport[];
  annualExpenses: AnnualExpenseReport[];
  totalSinkingMonthlyRequired: number;
  totalAnnualMonthlyRequired: number;
  totalObligationsMonthlyRequired: number;
}

/**
 * Calculates obligations, sinking funds required savings, and annual expense provisions.
 */
export function calculateObligations(
  sinkingFunds: SinkingFund[],
  annualExpenses: AnnualExpense[]
): ObligationsReport {
  const today = startOfMonth(new Date());

  // 1. Sinking Funds
  let totalSinkingMonthlyRequired = 0;
  const sinkingReports: SinkingFundReport[] = sinkingFunds.map(fund => {
    const remainingAmount = Math.max(0, fund.targetAmount - fund.currentAmount);
    
    let monthsRemaining = 1;
    try {
      const targetDateObj = startOfMonth(parseISO(fund.targetDate));
      monthsRemaining = differenceInMonths(targetDateObj, today);
      if (monthsRemaining <= 0) {
        monthsRemaining = 1; // standard fallback
      }
    } catch {
      monthsRemaining = 1;
    }

    const monthlyContributionRequired = remainingAmount / monthsRemaining;
    totalSinkingMonthlyRequired += monthlyContributionRequired;

    return {
      fund,
      remainingAmount,
      monthsRemaining,
      monthlyContributionRequired,
    };
  });

  // 2. Annual Expenses
  let totalAnnualMonthlyRequired = 0;
  const annualReports: AnnualExpenseReport[] = annualExpenses.map(expense => {
    const monthlyProvisionRequired = expense.annualAmount / 12;
    totalAnnualMonthlyRequired += monthlyProvisionRequired;

    // Calculate months until due
    const currentMonth = new Date().getMonth() + 1; // 1-12
    let monthsUntilDue = expense.dueMonth - currentMonth;
    if (monthsUntilDue < 0) {
      monthsUntilDue += 12; // Next year
    }
    if (monthsUntilDue === 0) {
      monthsUntilDue = 12;
    }

    const currentYear = new Date().getFullYear();
    const targetYear = currentMonth > expense.dueMonth ? currentYear + 1 : currentYear;
    const nextDueDate = `${targetYear}-${String(expense.dueMonth).padStart(2, '0')}-01`;

    return {
      expense,
      monthlyProvisionRequired,
      monthsUntilDue,
      nextDueDate,
    };
  });

  return {
    sinkingFunds: sinkingReports,
    annualExpenses: annualReports,
    totalSinkingMonthlyRequired,
    totalAnnualMonthlyRequired,
    totalObligationsMonthlyRequired: totalSinkingMonthlyRequired + totalAnnualMonthlyRequired,
  };
}
