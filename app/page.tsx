'use client'

import { FinanceProvider } from '@/contexts/finance-context'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardCards, CategoryBreakdown, CardUsageBreakdown } from '@/components/dashboard-cards'
import { MonthlyTrendChart, CategoryPieChart } from '@/components/dashboard-charts'
import { RecentTransactions } from '@/components/recent-transactions'
import { LoanSummary } from '@/components/loan-list'
import { AnalyticsMetrics } from '@/components/financial-insights'
import { NetWorthCard } from '@/components/net-worth-card'
import { MonthStatusCard } from '@/components/month-status-card'
import { SubscriptionCard } from '@/components/subscription-card'
import { DynamicExpensesCard } from '@/components/dynamic-expenses-card'
import { BehaviorAnalysisCard } from '@/components/behavior-analysis-card'
import { ObligationsCard } from '@/components/obligations-card'
import { PersonalInflationCard } from '@/components/personal-inflation-card'
import { BudgetRecommendationsCard } from '@/components/budget-recommendations-card'
import { RiskMatrixCard } from '@/components/risk-matrix-card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function DashboardContent() {
  const today = new Date()
  
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      <main className="lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8 pt-20 lg:pt-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-foreground mb-4">Patrimônio Inteligente</h2>
                <NetWorthCard />
              </div>
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold text-foreground mb-4">Status do Mês</h2>
                <MonthStatusCard />
              </div>
            </div>

            <DashboardCards />
            
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Resumo de Dívidas</h2>
              <LoanSummary />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-foreground mb-4">Insights Financeiros</h2>
                <AnalyticsMetrics />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Padrões de Hábito</h2>
                <BehaviorAnalysisCard />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Contas Variáveis & Consumo</h2>
              <DynamicExpensesCard />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Provisões de Futuro</h2>
              <ObligationsCard />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold text-foreground mb-4">Inflação Pessoal</h2>
                <PersonalInflationCard />
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-foreground mb-4">Gestão de Assinaturas</h2>
                <SubscriptionCard />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Orçamento Inteligente</h2>
                <BudgetRecommendationsCard />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Análise de Risco</h2>
                <RiskMatrixCard />
              </div>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
              <MonthlyTrendChart />
              <CategoryPieChart />
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RecentTransactions />
              </div>
              <div className="space-y-6">
                <CategoryBreakdown />
                <CardUsageBreakdown />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <FinanceProvider>
      <DashboardContent />
    </FinanceProvider>
  )
}
