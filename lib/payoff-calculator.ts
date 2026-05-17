import { Loan, PayoffStrategy, PayoffSimulation } from './finance-types'
import { addMonths, format } from 'date-fns'

// Sort loans by Snowball strategy (smallest balance first)
export function sortBySnowball(loans: Loan[]): Loan[] {
  return [...loans].sort((a, b) => a.remainingAmount - b.remainingAmount)
}

// Sort loans by Avalanche strategy (highest interest first)
export function sortByAvalanche(loans: Loan[]): Loan[] {
  return [...loans].sort((a, b) => b.interestRate - a.interestRate)
}

// Sort loans by Hybrid strategy (small wins first, then high interest)
export function sortByHybrid(loans: Loan[]): Loan[] {
  // Threshold: loans under 20% of the largest loan are considered "small"
  const maxAmount = Math.max(...loans.map(l => l.remainingAmount))
  const smallThreshold = maxAmount * 0.2

  const smallLoans = loans.filter(l => l.remainingAmount <= smallThreshold)
  const largeLoans = loans.filter(l => l.remainingAmount > smallThreshold)

  // Sort small loans by amount (snowball), large loans by interest (avalanche)
  const sortedSmall = sortBySnowball(smallLoans)
  const sortedLarge = sortByAvalanche(largeLoans)

  return [...sortedSmall, ...sortedLarge]
}

// Sort by custom priority
export function sortByCustom(loans: Loan[], customPriority: string[]): Loan[] {
  const priorityMap = new Map(customPriority.map((id, index) => [id, index]))
  return [...loans].sort((a, b) => {
    const priorityA = priorityMap.get(a.id) ?? Number.MAX_VALUE
    const priorityB = priorityMap.get(b.id) ?? Number.MAX_VALUE
    return priorityA - priorityB
  })
}

// Get sorted loans based on strategy
export function getSortedLoans(
  loans: Loan[], 
  strategy: PayoffStrategy, 
  customPriority?: string[]
): Loan[] {
  switch (strategy) {
    case 'snowball':
      return sortBySnowball(loans)
    case 'avalanche':
      return sortByAvalanche(loans)
    case 'hybrid':
      return sortByHybrid(loans)
    case 'custom':
      return sortByCustom(loans, customPriority || [])
    default:
      return loans
  }
}

// Simulate payoff with a given strategy
export function simulatePayoff(
  loans: Loan[],
  strategy: PayoffStrategy,
  monthlyBudget: number,
  customPriority?: string[]
): PayoffSimulation {
  if (loans.length === 0 || monthlyBudget <= 0) {
    return {
      strategy,
      totalMonths: 0,
      totalInterest: 0,
      totalPaid: 0,
      monthlyBreakdown: [],
    }
  }

  // Create working copies of loans
  const workingLoans = loans.map(loan => ({
    id: loan.id,
    remainingAmount: loan.remainingAmount,
    monthlyPayment: loan.monthlyPayment,
    interestRate: loan.interestRate,
  }))

  const sortedIds = getSortedLoans(loans, strategy, customPriority).map(l => l.id)
  const monthlyBreakdown: PayoffSimulation['monthlyBreakdown'] = []
  let totalInterest = 0
  let totalPaid = 0
  let month = 0
  const maxMonths = 360 // 30 years max to prevent infinite loops

  while (workingLoans.some(l => l.remainingAmount > 0) && month < maxMonths) {
    month++
    const currentDate = addMonths(new Date(), month)
    const monthLabel = format(currentDate, 'yyyy-MM')

    let availableBudget = monthlyBudget
    const monthPayments: { loanId: string; amount: number; remaining: number }[] = []

    // First, pay minimum payments on all active loans
    for (const loan of workingLoans) {
      if (loan.remainingAmount <= 0) continue

      // Apply monthly interest
      const monthlyInterestRate = loan.interestRate / 100 / 12
      const interestCharge = loan.remainingAmount * monthlyInterestRate
      loan.remainingAmount += interestCharge
      totalInterest += interestCharge

      // Pay minimum
      const minPayment = Math.min(loan.monthlyPayment, loan.remainingAmount)
      if (availableBudget >= minPayment) {
        loan.remainingAmount -= minPayment
        availableBudget -= minPayment
        totalPaid += minPayment

        monthPayments.push({
          loanId: loan.id,
          amount: minPayment,
          remaining: Math.max(0, loan.remainingAmount),
        })
      }
    }

    // Then, apply extra payments to priority loan
    if (availableBudget > 0) {
      for (const loanId of sortedIds) {
        const loan = workingLoans.find(l => l.id === loanId)
        if (!loan || loan.remainingAmount <= 0) continue

        const extraPayment = Math.min(availableBudget, loan.remainingAmount)
        if (extraPayment > 0) {
          loan.remainingAmount -= extraPayment
          availableBudget -= extraPayment
          totalPaid += extraPayment

          // Update existing payment record or add new one
          const existingPayment = monthPayments.find(p => p.loanId === loanId)
          if (existingPayment) {
            existingPayment.amount += extraPayment
            existingPayment.remaining = Math.max(0, loan.remainingAmount)
          } else {
            monthPayments.push({
              loanId: loan.id,
              amount: extraPayment,
              remaining: Math.max(0, loan.remainingAmount),
            })
          }
        }

        if (availableBudget <= 0) break
      }
    }

    monthlyBreakdown.push({
      month: monthLabel,
      payments: monthPayments,
    })
  }

  return {
    strategy,
    totalMonths: month,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    monthlyBreakdown,
  }
}

// Compare all strategies
export function compareStrategies(
  loans: Loan[],
  monthlyBudget: number
): { snowball: PayoffSimulation; avalanche: PayoffSimulation; hybrid: PayoffSimulation } {
  return {
    snowball: simulatePayoff(loans, 'snowball', monthlyBudget),
    avalanche: simulatePayoff(loans, 'avalanche', monthlyBudget),
    hybrid: simulatePayoff(loans, 'hybrid', monthlyBudget),
  }
}

// Calculate potential savings by paying off early
export function calculateEarlySavings(
  loan: Loan,
  extraMonthlyPayment: number
): { monthsSaved: number; interestSaved: number } {
  if (loan.remainingAmount <= 0 || extraMonthlyPayment <= 0) {
    return { monthsSaved: 0, interestSaved: 0 }
  }

  // Calculate normal payoff
  const normalPayoff = simulatePayoff([loan], 'snowball', loan.monthlyPayment)
  
  // Calculate accelerated payoff
  const acceleratedPayoff = simulatePayoff(
    [loan], 
    'snowball', 
    loan.monthlyPayment + extraMonthlyPayment
  )

  return {
    monthsSaved: normalPayoff.totalMonths - acceleratedPayoff.totalMonths,
    interestSaved: Math.round((normalPayoff.totalInterest - acceleratedPayoff.totalInterest) * 100) / 100,
  }
}

// Get recommended strategy based on user's situation
export function getRecommendedStrategy(loans: Loan[]): {
  strategy: PayoffStrategy
  reason: string
} {
  if (loans.length === 0) {
    return { strategy: 'snowball', reason: 'Nenhuma divida cadastrada' }
  }

  // Count small loans (under R$1000)
  const smallLoans = loans.filter(l => l.remainingAmount < 1000).length
  const highInterestLoans = loans.filter(l => l.interestRate > 20).length
  const averageInterest = loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length

  // If many small loans, recommend snowball for quick wins
  if (smallLoans >= 3) {
    return {
      strategy: 'snowball',
      reason: `Voce tem ${smallLoans} dividas pequenas. O metodo Bola de Neve vai te dar vitorias rapidas e motivacao.`,
    }
  }

  // If high interest loans, recommend avalanche
  if (highInterestLoans >= 2 || averageInterest > 15) {
    return {
      strategy: 'avalanche',
      reason: `Voce tem dividas com juros altos (media de ${averageInterest.toFixed(1)}% a.a.). O metodo Avalanche vai economizar mais dinheiro.`,
    }
  }

  // Default to hybrid
  return {
    strategy: 'hybrid',
    reason: 'O metodo Hibrido combina vitorias rapidas com economia de juros - ideal para o seu perfil.',
  }
}
