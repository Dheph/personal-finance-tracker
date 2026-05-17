'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { ExpenseComparison, ExpenseComparisonSummary } from '@/components/expense-comparison'
import { FinancialInsights, SpendingTrendChart, AnalyticsMetrics } from '@/components/financial-insights'

export default function AnalyticsPage() {
  return (
    <AppSidebar>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Analise detalhada dos seus gastos e padroes financeiros
          </p>
        </div>

        {/* Metrics */}
        <div className="mb-6">
          <AnalyticsMetrics />
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Spending Trend */}
            <SpendingTrendChart />

            {/* Insights */}
            <FinancialInsights />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Comparison Summary */}
            <ExpenseComparisonSummary />

            {/* Expense Comparisons */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Comparacao por Categoria</h3>
              <ExpenseComparison />
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
