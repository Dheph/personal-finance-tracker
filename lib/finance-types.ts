export interface Transaction {
  id: string
  type: 'expense' | 'income'
  paymentMethod: PaymentMethod
  cardId?: string
  description: string
  category: string
  subcategory?: string
  amount: number
  date: string
  competencyMonth: string
  installments?: {
    current: number
    total: number
  }
  tags: string[]
  isRecurring: boolean
  notes?: string
  createdAt: string
}

export interface Card {
  id: string
  name: string
  brand: string
  limit: number
  closingDay: number
  dueDay: number
  color: string
}

export interface Settings {
  currency: string
  theme: 'light' | 'dark' | 'system'
}



export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'cash'
  | 'bank_transfer'
  | 'boleto'
  | 'apple_pay'
  | 'google_pay'
  | 'paypal'
  | 'mercado_pago'
  | 'crypto'

export type TransactionType = 'expense' | 'income'

export const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salário' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'bonus', label: 'Bônus' },
  { id: 'investment_income', label: 'Rendimento de Investimento' },
  { id: 'refund', label: 'Reembolso' },
  { id: 'other_income', label: 'Outra Receita' },
] as const

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Alimentação', subcategories: ['supermercado', 'restaurante', 'delivery', 'cafeteria'] },
  { id: 'transport', label: 'Transporte', subcategories: ['uber', 'combustível', 'pedágio', 'metrô', 'ônibus'] },
  { id: 'health', label: 'Saúde', subcategories: ['farmácia', 'consulta', 'exame', 'plano de saúde'] },
  { id: 'education', label: 'Educação', subcategories: ['curso', 'livro', 'material'] },
  { id: 'housing', label: 'Moradia', subcategories: ['aluguel', 'condomínio', 'iptu', 'manutenção'] },
  { id: 'utilities', label: 'Contas', subcategories: ['luz', 'água', 'gás', 'internet', 'telefone'] },
  { id: 'subscriptions', label: 'Assinaturas', subcategories: ['streaming', 'software', 'academia'] },
  { id: 'shopping', label: 'Compras', subcategories: ['roupas', 'eletrônicos', 'casa'] },
  { id: 'travel', label: 'Viagem', subcategories: ['passagem', 'hospedagem', 'passeio'] },
  { id: 'entertainment', label: 'Lazer', subcategories: ['cinema', 'show', 'jogo'] },
  { id: 'pets', label: 'Pets', subcategories: ['ração', 'veterinário', 'pet shop'] },
  { id: 'insurance', label: 'Seguros', subcategories: ['auto', 'vida', 'residencial'] },
  { id: 'investments', label: 'Investimentos', subcategories: ['ações', 'fundos', 'cripto'] },
  { id: 'debt_payment', label: 'Pagamento de Dívidas' },
  { id: 'taxes', label: 'Impostos' },
  { id: 'other_expense', label: 'Outra Despesa' },
] as const

export const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Cartão de Crédito' },
  { id: 'debit_card', label: 'Cartão de Débito' },
  { id: 'pix', label: 'PIX' },
  { id: 'cash', label: 'Dinheiro' },
  { id: 'bank_transfer', label: 'Transferência Bancária' },
  { id: 'boleto', label: 'Boleto' },
  { id: 'apple_pay', label: 'Apple Pay' },
  { id: 'google_pay', label: 'Google Pay' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'mercado_pago', label: 'Mercado Pago' },
  { id: 'crypto', label: 'Criptomoeda' },
] as const

export const CARD_BRANDS = [
  { id: 'visa', label: 'Visa', color: '#1A1F71' },
  { id: 'mastercard', label: 'Mastercard', color: '#EB001B' },
  { id: 'elo', label: 'Elo', color: '#00A4E0' },
  { id: 'amex', label: 'American Express', color: '#006FCF' },
  { id: 'hipercard', label: 'Hipercard', color: '#B3131B' },
] as const

// Loan Types
export type LoanType =
  | 'personal_loan'
  | 'financing'
  | 'consignado'
  | 'overdraft'
  | 'credit_card_installment'
  | 'informal_debt'
  | 'bnpl'

export type LoanStatus = 'active' | 'paid_off' | 'defaulted' | 'renegotiated'

export interface Loan {
  id: string
  name: string
  institution: string
  type: LoanType
  totalAmount: number
  remainingAmount: number
  interestRate: number
  installments: number
  paidInstallments: number
  monthlyPayment: number
  startDate: string
  nextDueDate: string
  status: LoanStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface LoanPayment {
  id: string
  loanId: string
  amount: number
  date: string
  installmentNumber: number
  status: 'paid' | 'partial' | 'late' | 'pending'
  lateFee?: number
  notes?: string
}

// Payoff Plan Types
export type PayoffStrategy = 'snowball' | 'avalanche' | 'hybrid' | 'custom'

export interface PayoffPlan {
  id: string
  name: string
  strategy: PayoffStrategy
  monthlyBudget: number
  loans: string[] // loan IDs
  customPriority?: string[] // for custom strategy
  startDate: string
  projectedEndDate: string
  totalInterestSaved: number
  isActive: boolean
  createdAt: string
}

export interface PayoffSimulation {
  strategy: PayoffStrategy
  totalMonths: number
  totalInterest: number
  totalPaid: number
  monthlyBreakdown: {
    month: string
    payments: { loanId: string; amount: number; remaining: number }[]
  }[]
}

// Expense Comparison Types
export interface ExpenseComparison {
  category: string
  currentMonth: number
  previousMonth: number
  average12Months: number
  highestEver: number
  lowestEver: number
  percentageChange: number
  trend: 'up' | 'down' | 'stable'
}

export interface FinancialInsight {
  id: string
  type: 'warning' | 'info' | 'success' | 'alert'
  title: string
  description: string
  category?: string
  value?: number
  percentageChange?: number
  createdAt: string
}

export const LOAN_TYPES = [
  { id: 'personal_loan', label: 'Empréstimo Pessoal' },
  { id: 'financing', label: 'Financiamento' },
  { id: 'consignado', label: 'Consignado' },
  { id: 'overdraft', label: 'Cheque Especial' },
  { id: 'credit_card_installment', label: 'Cartão Parcelado' },
  { id: 'informal_debt', label: 'Dívida Informal' },
  { id: 'bnpl', label: 'BNPL (Compre Agora, Pague Depois)' },
] as const

export const PAYOFF_STRATEGIES = [
  { 
    id: 'snowball', 
    label: 'Bola de Neve', 
    description: 'Prioriza menores dívidas primeiro - gera motivação com vitórias rápidas' 
  },
  { 
    id: 'avalanche', 
    label: 'Avalanche', 
    description: 'Prioriza maiores juros primeiro - economiza mais dinheiro no total' 
  },
  { 
    id: 'hybrid', 
    label: 'Híbrido', 
    description: 'Começa com pequenas vitórias, depois foca em juros altos' 
  },
  { 
    id: 'custom', 
    label: 'Personalizado', 
    description: 'Você define a ordem de prioridade das dívidas' 
  },
] as const

export interface FinanceDatabase {
  transactions: Transaction[]
  cards: Card[]
  loans: Loan[]
  loanPayments: LoanPayment[]
  payoffPlans: PayoffPlan[]
  categories: string[]
  settings: Settings
}

export const DEFAULT_DATABASE: FinanceDatabase = {
  transactions: [],
  cards: [
    {
      id: 'nubank',
      name: 'Nubank',
      brand: 'mastercard',
      limit: 10000,
      closingDay: 10,
      dueDay: 17,
      color: '#8A05BE',
    },
  ],
  loans: [],
  loanPayments: [],
  payoffPlans: [],
  categories: [
    'alimentação',
    'transporte',
    'moradia',
    'lazer',
    'saúde',
    'educação',
    'compras',
    'assinaturas',
  ],
  settings: {
    currency: 'BRL',
    theme: 'dark',
  },
}
