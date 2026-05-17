import { FinanceDatabase, Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './finance-types'
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, format, subMonths } from 'date-fns'

export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount
  }, 0)
}

export function calculateMonthlyExpenses(
  transactions: Transaction[],
  month?: Date
): number {
  const targetMonth = month || new Date()
  const start = startOfMonth(targetMonth)
  const end = endOfMonth(targetMonth)
  
  return transactions
    .filter((t) => {
      const date = parseISO(t.date)
      return t.type === 'expense' && isWithinInterval(date, { start, end })
    })
    .reduce((acc, t) => acc + t.amount, 0)
}

export function calculateMonthlyIncome(
  transactions: Transaction[],
  month?: Date
): number {
  const targetMonth = month || new Date()
  const start = startOfMonth(targetMonth)
  const end = endOfMonth(targetMonth)
  
  return transactions
    .filter((t) => {
      const date = parseISO(t.date)
      return t.type === 'income' && isWithinInterval(date, { start, end })
    })
    .reduce((acc, t) => acc + t.amount, 0)
}

export function calculateCategoryTotals(
  transactions: Transaction[],
  month?: Date
): { category: string; label: string; total: number; color: string }[] {
  const targetMonth = month || new Date()
  const start = startOfMonth(targetMonth)
  const end = endOfMonth(targetMonth)
  
  const colors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ]
  
  const categoryTotals = transactions
    .filter((t) => {
      const date = parseISO(t.date)
      return t.type === 'expense' && isWithinInterval(date, { start, end })
    })
    .reduce((acc, t) => {
      const current = acc.get(t.category) || 0
      acc.set(t.category, current + t.amount)
      return acc
    }, new Map<string, number>())
  
  return Array.from(categoryTotals.entries())
    .map(([category, total], index) => {
      const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.id === category)
      return {
        category,
        label: categoryInfo?.label || category,
        total,
        color: colors[index % colors.length],
      }
    })
    .sort((a, b) => b.total - a.total)
}

export function calculateCardUsage(
  db: FinanceDatabase,
  month?: Date
): { cardId: string; name: string; used: number; limit: number; color: string }[] {
  const targetMonth = month || new Date()
  const start = startOfMonth(targetMonth)
  const end = endOfMonth(targetMonth)
  
  return db.cards.map((card) => {
    const used = db.transactions
      .filter((t) => {
        const date = parseISO(t.date)
        return (
          t.cardId === card.id &&
          t.paymentMethod === 'credit_card' &&
          isWithinInterval(date, { start, end })
        )
      })
      .reduce((acc, t) => acc + t.amount, 0)
    
    return {
      cardId: card.id,
      name: card.name,
      used,
      limit: card.limit,
      color: card.color,
    }
  })
}

export function getMonthlyTrend(
  transactions: Transaction[],
  monthsBack: number = 6
): { month: string; receitas: number; despesas: number }[] {
  const result: { month: string; receitas: number; despesas: number }[] = []
  
  for (let i = monthsBack - 1; i >= 0; i--) {
    const targetMonth = subMonths(new Date(), i)
    const start = startOfMonth(targetMonth)
    const end = endOfMonth(targetMonth)
    
    const monthTransactions = transactions.filter((t) => {
      const date = parseISO(t.date)
      return isWithinInterval(date, { start, end })
    })
    
    const receitas = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0)
    
    const despesas = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)
    
    result.push({
      month: format(targetMonth, 'MMM'),
      receitas,
      despesas,
    })
  }
  
  return result
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getCategoryLabel(categoryId: string): string {
  const expense = EXPENSE_CATEGORIES.find((c) => c.id === categoryId)
  if (expense) return expense.label
  
  const income = INCOME_CATEGORIES.find((c) => c.id === categoryId)
  if (income) return income.label
  
  return categoryId
}

export function getPaymentMethodLabel(methodId: string): string {
  const methods: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    cash: 'Dinheiro',
    bank_transfer: 'Transferência',
    boleto: 'Boleto',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    paypal: 'PayPal',
    mercado_pago: 'Mercado Pago',
    crypto: 'Criptomoeda',
  }
  return methods[methodId] || methodId
}

export function filterTransactions(
  transactions: Transaction[],
  filters: {
    search?: string
    type?: 'expense' | 'income'
    category?: string
    cardId?: string
    paymentMethod?: string
    startDate?: string
    endDate?: string
    minAmount?: number
    maxAmount?: number
    isRecurring?: boolean
  }
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesDescription = t.description.toLowerCase().includes(searchLower)
      const matchesTags = t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      const matchesCategory = t.category.toLowerCase().includes(searchLower)
      if (!matchesDescription && !matchesTags && !matchesCategory) {
        return false
      }
    }
    
    if (filters.type && t.type !== filters.type) return false
    if (filters.category && t.category !== filters.category) return false
    if (filters.cardId && t.cardId !== filters.cardId) return false
    if (filters.paymentMethod && t.paymentMethod !== filters.paymentMethod) return false
    
    if (filters.startDate) {
      const transDate = parseISO(t.date)
      const startDate = parseISO(filters.startDate)
      if (transDate < startDate) return false
    }
    
    if (filters.endDate) {
      const transDate = parseISO(t.date)
      const endDate = parseISO(filters.endDate)
      if (transDate > endDate) return false
    }
    
    if (filters.minAmount !== undefined && t.amount < filters.minAmount) return false
    if (filters.maxAmount !== undefined && t.amount > filters.maxAmount) return false
    if (filters.isRecurring !== undefined && t.isRecurring !== filters.isRecurring) return false
    
    return true
  })
}
