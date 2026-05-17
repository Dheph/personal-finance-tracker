'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinance } from '@/contexts/finance-context'
import {
  calculateBalance,
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculateCategoryTotals,
  calculateCardUsage,
  formatCurrency,
} from '@/lib/calculations'
import { TrendingUp, TrendingDown, Wallet, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export function DashboardCards() {
  const { db } = useFinance()
  
  const stats = useMemo(() => {
    const balance = calculateBalance(db.transactions)
    const monthlyExpenses = calculateMonthlyExpenses(db.transactions)
    const monthlyIncome = calculateMonthlyIncome(db.transactions)
    const cardUsage = calculateCardUsage(db)
    const totalCardUsed = cardUsage.reduce((acc, card) => acc + card.used, 0)
    const totalCardLimit = cardUsage.reduce((acc, card) => acc + card.limit, 0)
    
    return {
      balance,
      monthlyExpenses,
      monthlyIncome,
      monthlySavings: monthlyIncome - monthlyExpenses,
      totalCardUsed,
      totalCardLimit,
      cardUsagePercent: totalCardLimit > 0 ? (totalCardUsed / totalCardLimit) * 100 : 0,
    }
  }, [db])
  
  const cards = [
    {
      title: 'Saldo Total',
      value: formatCurrency(stats.balance),
      icon: Wallet,
      trend: stats.balance >= 0 ? 'up' : 'down',
      description: 'Receitas - Despesas',
      color: stats.balance >= 0 ? 'text-[var(--success)]' : 'text-[var(--destructive)]',
      bgColor: stats.balance >= 0 ? 'bg-[var(--success)]/10' : 'bg-[var(--destructive)]/10',
    },
    {
      title: 'Receitas do Mês',
      value: formatCurrency(stats.monthlyIncome),
      icon: TrendingUp,
      trend: 'up' as const,
      description: 'Total de entradas',
      color: 'text-[var(--success)]',
      bgColor: 'bg-[var(--success)]/10',
    },
    {
      title: 'Despesas do Mês',
      value: formatCurrency(stats.monthlyExpenses),
      icon: TrendingDown,
      trend: 'down' as const,
      description: 'Total de saídas',
      color: 'text-[var(--destructive)]',
      bgColor: 'bg-[var(--destructive)]/10',
    },
    {
      title: 'Uso de Cartões',
      value: formatCurrency(stats.totalCardUsed),
      icon: CreditCard,
      trend: stats.cardUsagePercent < 50 ? 'up' : 'down',
      description: `${stats.cardUsagePercent.toFixed(0)}% do limite`,
      color: stats.cardUsagePercent < 50 ? 'text-[var(--success)]' : stats.cardUsagePercent < 80 ? 'text-[var(--warning)]' : 'text-[var(--destructive)]',
      bgColor: stats.cardUsagePercent < 50 ? 'bg-[var(--success)]/10' : stats.cardUsagePercent < 80 ? 'bg-[var(--warning)]/10' : 'bg-[var(--destructive)]/10',
    },
  ]
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {card.trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 text-[var(--success)]" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-[var(--destructive)]" />
              )}
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function CategoryBreakdown() {
  const { db } = useFinance()
  
  const categoryTotals = useMemo(() => {
    return calculateCategoryTotals(db.transactions)
  }, [db.transactions])
  
  const total = categoryTotals.reduce((acc, c) => acc + c.total, 0)
  
  if (categoryTotals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma despesa registrada este mês
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryTotals.slice(0, 5).map((category, index) => {
          const percentage = total > 0 ? (category.total / total) * 100 : 0
          return (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{category.label}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(category.total)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function CardUsageBreakdown() {
  const { db } = useFinance()
  
  const cardUsage = useMemo(() => {
    return calculateCardUsage(db)
  }, [db])
  
  if (cardUsage.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uso de Cartões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum cartão cadastrado
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Uso de Cartões</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cardUsage.map((card) => {
          const percentage = card.limit > 0 ? (card.used / card.limit) * 100 : 0
          return (
            <div key={card.cardId} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: card.color }}
                  />
                  <span className="text-foreground">{card.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {formatCurrency(card.used)} / {formatCurrency(card.limit)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: card.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
