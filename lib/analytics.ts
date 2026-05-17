import { Transaction, ExpenseComparison, FinancialInsight, EXPENSE_CATEGORIES } from './finance-types'
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns'

// Get transactions for a specific month
export function getTransactionsForMonth(
  transactions: Transaction[],
  date: Date
): Transaction[] {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  
  return transactions.filter(t => {
    const transactionDate = parseISO(t.date)
    return isWithinInterval(transactionDate, { start, end })
  })
}

// Get category totals for a month
export function getCategoryTotalsForMonth(
  transactions: Transaction[],
  date: Date
): Record<string, number> {
  const monthTransactions = getTransactionsForMonth(transactions, date)
  const expenses = monthTransactions.filter(t => t.type === 'expense')
  
  const totals: Record<string, number> = {}
  
  for (const expense of expenses) {
    if (!totals[expense.category]) {
      totals[expense.category] = 0
    }
    totals[expense.category] += expense.amount
  }
  
  return totals
}

// Calculate expense comparisons
export function calculateExpenseComparisons(
  transactions: Transaction[],
  currentDate: Date = new Date()
): ExpenseComparison[] {
  const comparisons: ExpenseComparison[] = []
  
  // Get last 12 months of data
  const monthlyData: Record<string, Record<string, number>> = {}
  for (let i = 0; i < 12; i++) {
    const date = subMonths(currentDate, i)
    const monthKey = format(date, 'yyyy-MM')
    monthlyData[monthKey] = getCategoryTotalsForMonth(transactions, date)
  }
  
  // Get all categories that have any data
  const allCategories = new Set<string>()
  Object.values(monthlyData).forEach(month => {
    Object.keys(month).forEach(cat => allCategories.add(cat))
  })
  
  // Calculate comparisons for each category
  const currentMonth = format(currentDate, 'yyyy-MM')
  const previousMonth = format(subMonths(currentDate, 1), 'yyyy-MM')
  
  for (const category of allCategories) {
    const currentValue = monthlyData[currentMonth]?.[category] || 0
    const previousValue = monthlyData[previousMonth]?.[category] || 0
    
    // Calculate 12-month average
    let total12Months = 0
    let monthsWithData = 0
    let highestEver = 0
    let lowestEver = Number.MAX_VALUE
    
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i)
      const monthKey = format(date, 'yyyy-MM')
      const value = monthlyData[monthKey]?.[category] || 0
      
      if (value > 0) {
        total12Months += value
        monthsWithData++
        highestEver = Math.max(highestEver, value)
        lowestEver = Math.min(lowestEver, value)
      }
    }
    
    const average12Months = monthsWithData > 0 ? total12Months / monthsWithData : 0
    
    // Calculate percentage change
    let percentageChange = 0
    if (previousValue > 0) {
      percentageChange = ((currentValue - previousValue) / previousValue) * 100
    } else if (currentValue > 0) {
      percentageChange = 100 // New expense this month
    }
    
    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (percentageChange > 5) {
      trend = 'up'
    } else if (percentageChange < -5) {
      trend = 'down'
    }
    
    comparisons.push({
      category,
      currentMonth: currentValue,
      previousMonth: previousValue,
      average12Months: Math.round(average12Months * 100) / 100,
      highestEver,
      lowestEver: lowestEver === Number.MAX_VALUE ? 0 : lowestEver,
      percentageChange: Math.round(percentageChange * 10) / 10,
      trend,
    })
  }
  
  // Sort by current month value (highest first)
  return comparisons.sort((a, b) => b.currentMonth - a.currentMonth)
}

// Generate financial insights
export function generateInsights(
  transactions: Transaction[],
  currentDate: Date = new Date()
): FinancialInsight[] {
  const insights: FinancialInsight[] = []
  const comparisons = calculateExpenseComparisons(transactions, currentDate)
  
  // Insight: Categories with significant increase
  for (const comparison of comparisons) {
    if (comparison.percentageChange > 20 && comparison.currentMonth > 100) {
      const categoryLabel = EXPENSE_CATEGORIES.find(c => c.id === comparison.category)?.label || comparison.category
      insights.push({
        id: `increase-${comparison.category}`,
        type: 'warning',
        title: `Aumento em ${categoryLabel}`,
        description: `Seus gastos com ${categoryLabel.toLowerCase()} aumentaram ${comparison.percentageChange.toFixed(0)}% este mes comparado ao anterior.`,
        category: comparison.category,
        value: comparison.currentMonth,
        percentageChange: comparison.percentageChange,
        createdAt: new Date().toISOString(),
      })
    }
  }
  
  // Insight: Categories with significant decrease
  for (const comparison of comparisons) {
    if (comparison.percentageChange < -20 && comparison.previousMonth > 100) {
      const categoryLabel = EXPENSE_CATEGORIES.find(c => c.id === comparison.category)?.label || comparison.category
      insights.push({
        id: `decrease-${comparison.category}`,
        type: 'success',
        title: `Reducao em ${categoryLabel}`,
        description: `Parabens! Voce reduziu seus gastos com ${categoryLabel.toLowerCase()} em ${Math.abs(comparison.percentageChange).toFixed(0)}% este mes.`,
        category: comparison.category,
        value: comparison.currentMonth,
        percentageChange: comparison.percentageChange,
        createdAt: new Date().toISOString(),
      })
    }
  }
  
  // Insight: Categories above average
  for (const comparison of comparisons) {
    if (comparison.currentMonth > comparison.average12Months * 1.3 && comparison.average12Months > 50) {
      const categoryLabel = EXPENSE_CATEGORIES.find(c => c.id === comparison.category)?.label || comparison.category
      const percentAbove = ((comparison.currentMonth - comparison.average12Months) / comparison.average12Months) * 100
      
      // Don't duplicate if we already have an increase insight for this category
      if (!insights.some(i => i.id === `increase-${comparison.category}`)) {
        insights.push({
          id: `above-avg-${comparison.category}`,
          type: 'info',
          title: `${categoryLabel} acima da media`,
          description: `Gastos com ${categoryLabel.toLowerCase()} estao ${percentAbove.toFixed(0)}% acima da sua media de 12 meses.`,
          category: comparison.category,
          value: comparison.currentMonth,
          percentageChange: percentAbove,
          createdAt: new Date().toISOString(),
        })
      }
    }
  }
  
  // Insight: New highest for category
  for (const comparison of comparisons) {
    if (comparison.currentMonth >= comparison.highestEver && comparison.currentMonth > 200) {
      const categoryLabel = EXPENSE_CATEGORIES.find(c => c.id === comparison.category)?.label || comparison.category
      
      // Don't duplicate if we already have an insight for this category
      if (!insights.some(i => i.category === comparison.category)) {
        insights.push({
          id: `highest-${comparison.category}`,
          type: 'alert',
          title: `Recorde em ${categoryLabel}`,
          description: `Este e o seu maior gasto com ${categoryLabel.toLowerCase()} nos ultimos 12 meses.`,
          category: comparison.category,
          value: comparison.currentMonth,
          createdAt: new Date().toISOString(),
        })
      }
    }
  }
  
  // Insight: Recurring expense detection (same amount, same category, monthly)
  const currentMonthTransactions = getTransactionsForMonth(transactions, currentDate)
  const recurringExpenses = currentMonthTransactions.filter(t => t.isRecurring && t.type === 'expense')
  const totalRecurring = recurringExpenses.reduce((sum, t) => sum + t.amount, 0)
  
  if (recurringExpenses.length >= 3) {
    insights.push({
      id: 'recurring-expenses',
      type: 'info',
      title: `${recurringExpenses.length} Gastos Recorrentes`,
      description: `Voce tem R$ ${totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em despesas recorrentes este mes.`,
      value: totalRecurring,
      createdAt: new Date().toISOString(),
    })
  }
  
  // Insight: Total spending comparison
  const currentMonthTotal = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const previousMonthTransactions = getTransactionsForMonth(transactions, subMonths(currentDate, 1))
  const previousMonthTotal = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  if (previousMonthTotal > 0) {
    const totalChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    
    if (totalChange > 15) {
      insights.push({
        id: 'total-increase',
        type: 'warning',
        title: 'Gastos Totais Aumentaram',
        description: `Seus gastos totais aumentaram ${totalChange.toFixed(0)}% comparado ao mes anterior.`,
        value: currentMonthTotal,
        percentageChange: totalChange,
        createdAt: new Date().toISOString(),
      })
    } else if (totalChange < -15) {
      insights.push({
        id: 'total-decrease',
        type: 'success',
        title: 'Gastos Totais Reduziram',
        description: `Otimo trabalho! Seus gastos totais reduziram ${Math.abs(totalChange).toFixed(0)}% comparado ao mes anterior.`,
        value: currentMonthTotal,
        percentageChange: totalChange,
        createdAt: new Date().toISOString(),
      })
    }
  }
  
  return insights.slice(0, 6) // Limit to 6 insights
}

// Get spending trend for the last N months
export function getSpendingTrend(
  transactions: Transaction[],
  months: number = 6,
  currentDate: Date = new Date()
): { month: string; income: number; expenses: number; balance: number }[] {
  const trend: { month: string; income: number; expenses: number; balance: number }[] = []
  
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(currentDate, i)
    const monthKey = format(date, 'MMM')
    const monthTransactions = getTransactionsForMonth(transactions, date)
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    trend.push({
      month: monthKey,
      income,
      expenses,
      balance: income - expenses,
    })
  }
  
  return trend
}

// Get daily average spending
export function getDailyAverageSpending(
  transactions: Transaction[],
  months: number = 3,
  currentDate: Date = new Date()
): number {
  let totalExpenses = 0
  let totalDays = 0
  
  for (let i = 0; i < months; i++) {
    const date = subMonths(currentDate, i)
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const daysInMonth = end.getDate()
    
    const monthExpenses = getTransactionsForMonth(transactions, date)
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    totalExpenses += monthExpenses
    totalDays += daysInMonth
  }
  
  return totalDays > 0 ? Math.round((totalExpenses / totalDays) * 100) / 100 : 0
}
