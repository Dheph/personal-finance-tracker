'use client'

import { useMemo } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { generateInsights, getDailyAverageSpending, getSpendingTrend } from '@/lib/analytics'
import { EXPENSE_CATEGORIES } from '@/lib/finance-types'
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CreditCard,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export function FinancialInsights() {
  const { db } = useFinance()

  const insights = useMemo(() => {
    return generateInsights(db.transactions)
  }, [db.transactions])

  const iconMap = {
    warning: AlertTriangle,
    success: CheckCircle2,
    info: Info,
    alert: AlertCircle,
  }

  const colorMap = {
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    alert: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
  }

  if (insights.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lightbulb className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">Sem insights no momento</h3>
        <p className="text-sm text-muted-foreground">
          Continue registrando transacoes para receber analises personalizadas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Insights Financeiros</h3>
      </div>
      {insights.map(insight => {
        const Icon = iconMap[insight.type]
        const colors = colorMap[insight.type]

        return (
          <div
            key={insight.id}
            className={`${colors.bg} border ${colors.border} rounded-xl p-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                <Icon className={`w-4 h-4 ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground">{insight.title}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{insight.description}</p>
              </div>
              {insight.value !== undefined && (
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-foreground">
                    R$ {insight.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {insight.percentageChange !== undefined && (
                    <p className={`text-sm ${insight.percentageChange > 0 ? 'text-destructive' : 'text-success'}`}>
                      {insight.percentageChange > 0 ? '+' : ''}{insight.percentageChange.toFixed(0)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SpendingTrendChart() {
  const { db } = useFinance()

  const trendData = useMemo(() => {
    return getSpendingTrend(db.transactions, 6)
  }, [db.transactions])

  if (trendData.every(d => d.income === 0 && d.expenses === 0)) {
    return null
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-foreground mb-4">Tendencia de 6 Meses</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af" 
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [
                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              name="Receitas"
              stroke="#22c55e"
              fill="url(#incomeGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Despesas"
              stroke="#ef4444"
              fill="url(#expenseGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function AnalyticsMetrics() {
  const { db } = useFinance()

  const metrics = useMemo(() => {
    const expenses = db.transactions.filter(t => t.type === 'expense')
    const income = db.transactions.filter(t => t.type === 'income')
    
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const dailyAverage = getDailyAverageSpending(db.transactions, 3)
    
    // Most used card
    const cardUsage: Record<string, number> = {}
    expenses.forEach(t => {
      if (t.cardId) {
        cardUsage[t.cardId] = (cardUsage[t.cardId] || 0) + t.amount
      }
    })
    const topCardId = Object.entries(cardUsage).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topCard = db.cards.find(c => c.id === topCardId)

    // Most expensive category
    const categoryTotals: Record<string, number> = {}
    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })
    const topCategoryId = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topCategory = EXPENSE_CATEGORIES.find(c => c.id === topCategoryId)

    // Recurring expenses
    const recurringExpenses = expenses.filter(t => t.isRecurring)
    const totalRecurring = recurringExpenses.reduce((sum, t) => sum + t.amount, 0)

    return {
      totalExpenses,
      totalIncome,
      dailyAverage,
      topCard,
      topCategory,
      totalRecurring,
      recurringCount: recurringExpenses.length,
    }
  }, [db.transactions, db.cards])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Media Diaria</span>
        </div>
        <p className="text-xl font-bold text-foreground">
          R$ {metrics.dailyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">ultimos 3 meses</p>
      </div>

      {metrics.topCategory && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Maior Categoria</span>
          </div>
          <p className="text-xl font-bold text-foreground truncate">
            {metrics.topCategory.label}
          </p>
        </div>
      )}

      {metrics.topCard && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cartao Mais Usado</span>
          </div>
          <p className="text-xl font-bold text-foreground truncate">
            {metrics.topCard.name}
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Gastos Recorrentes</span>
        </div>
        <p className="text-xl font-bold text-foreground">
          R$ {metrics.totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{metrics.recurringCount} itens</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-sm text-muted-foreground">Total Receitas</span>
        </div>
        <p className="text-xl font-bold text-success">
          R$ {metrics.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-destructive" />
          <span className="text-sm text-muted-foreground">Total Despesas</span>
        </div>
        <p className="text-xl font-bold text-destructive">
          R$ {metrics.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  )
}
