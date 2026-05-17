'use client'

import { useMemo } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { EXPENSE_CATEGORIES } from '@/lib/finance-types'
import { calculateExpenseComparisons } from '@/lib/analytics'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react'

export function ExpenseComparison() {
  const { db } = useFinance()

  const comparisons = useMemo(() => {
    return calculateExpenseComparisons(db.transactions)
  }, [db.transactions])

  if (comparisons.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Sem dados suficientes</h3>
        <p className="text-muted-foreground">
          Adicione transacoes para ver comparacoes de gastos por categoria.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comparisons.map(comparison => {
        const categoryInfo = EXPENSE_CATEGORIES.find(c => c.id === comparison.category)
        const categoryLabel = categoryInfo?.label || comparison.category

        const TrendIcon = comparison.trend === 'up' 
          ? TrendingUp 
          : comparison.trend === 'down' 
            ? TrendingDown 
            : Minus

        const trendColor = comparison.trend === 'up'
          ? 'text-destructive'
          : comparison.trend === 'down'
            ? 'text-success'
            : 'text-muted-foreground'

        const trendBg = comparison.trend === 'up'
          ? 'bg-destructive/10'
          : comparison.trend === 'down'
            ? 'bg-success/10'
            : 'bg-muted'

        return (
          <div
            key={comparison.category}
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">{categoryLabel}</h4>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${trendBg}`}>
                <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                <span className={`text-sm font-medium ${trendColor}`}>
                  {comparison.percentageChange > 0 ? '+' : ''}{comparison.percentageChange.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Este Mes</p>
                <p className="font-semibold text-foreground">
                  R$ {comparison.currentMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Mes Anterior</p>
                <p className="font-semibold text-foreground">
                  R$ {comparison.previousMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Media 12 Meses</p>
                <p className="font-semibold text-foreground">
                  R$ {comparison.average12Months.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Maximo/Minimo</p>
                <p className="font-semibold text-foreground text-sm">
                  <span className="text-destructive">{comparison.highestEver.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                  {' / '}
                  <span className="text-success">{comparison.lowestEver.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                </p>
              </div>
            </div>

            {/* Progress compared to average */}
            {comparison.average12Months > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>vs Media</span>
                  <span>
                    {((comparison.currentMonth / comparison.average12Months) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      comparison.currentMonth > comparison.average12Months 
                        ? 'bg-destructive' 
                        : 'bg-success'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (comparison.currentMonth / comparison.average12Months) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ExpenseComparisonSummary() {
  const { db } = useFinance()

  const { increasing, decreasing, stable } = useMemo(() => {
    const comparisons = calculateExpenseComparisons(db.transactions)
    return {
      increasing: comparisons.filter(c => c.trend === 'up').length,
      decreasing: comparisons.filter(c => c.trend === 'down').length,
      stable: comparisons.filter(c => c.trend === 'stable').length,
    }
  }, [db.transactions])

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-destructive" />
          </div>
          <span className="text-sm text-muted-foreground">Aumentando</span>
        </div>
        <p className="text-2xl font-bold text-destructive">{increasing}</p>
        <p className="text-xs text-muted-foreground">categorias</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4 text-success" />
          </div>
          <span className="text-sm text-muted-foreground">Reduzindo</span>
        </div>
        <p className="text-2xl font-bold text-success">{decreasing}</p>
        <p className="text-xs text-muted-foreground">categorias</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
            <Minus className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">Estaveis</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{stable}</p>
        <p className="text-xs text-muted-foreground">categorias</p>
      </div>
    </div>
  )
}
