'use client'

import { FinanceProvider } from '@/contexts/finance-context'
import { AppSidebar } from '@/components/app-sidebar'
import {
  ReportsSummary,
  MonthlyComparisonChart,
  CategoryBreakdownChart,
  CardUsageChart,
} from '@/components/reports'

function RelatoriosContent() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      <main className="lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8 pt-20 lg:pt-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise detalhada das suas finanças
            </p>
          </div>
          
          <div className="space-y-6">
            <ReportsSummary />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <MonthlyComparisonChart />
              <CategoryBreakdownChart />
            </div>
            
            <CardUsageChart />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function RelatoriosPage() {
  return (
    <FinanceProvider>
      <RelatoriosContent />
    </FinanceProvider>
  )
}
