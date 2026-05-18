'use client'

import { useState } from 'react'
import { FinanceProvider } from '@/contexts/finance-context'
import { AppSidebar } from '@/components/app-sidebar'
import { AddLoanButton } from '@/components/loan-form'
import { LoanList, LoanSummary } from '@/components/loan-list'
import { EconomicRatesCard } from '@/components/economic-rates-card'
import { AddFinancingButton } from '@/components/financing-form'
import { FinancingList, FinancingSummary } from '@/components/financing-list'
import { Landmark, Sparkles } from 'lucide-react'

function DividasContent() {
  const [activeTab, setActiveTab] = useState<'fixed' | 'variable'>('fixed')

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:pl-64">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pt-20 lg:pt-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Compromissos e Dívidas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie empréstimos normais e financiamentos variáveis atrelados a índices econômicos.
              </p>
            </div>
            <div>
              {activeTab === 'fixed' ? <AddLoanButton /> : <AddFinancingButton />}
            </div>
          </div>

          {/* Gorgeous Tabs Switcher */}
          <div className="flex bg-muted/60 border border-border p-1 rounded-xl mb-6 max-w-md">
            <button
              onClick={() => setActiveTab('fixed')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'fixed'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Landmark className="w-4 h-4" />
              Empréstimos Fixos
            </button>
            <button
              onClick={() => setActiveTab('variable')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'variable'
                  ? 'bg-card text-foreground shadow-sm border border-primary/20 bg-gradient-to-r from-primary/5 to-indigo-500/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              Financiamentos Variáveis
            </button>
          </div>

          {/* Dynamic Content */}
          {activeTab === 'fixed' ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <LoanSummary />

              {/* Loan List */}
              <LoanList />
            </div>
          ) : (
            <div className="space-y-6">
              {/* BCB Rates Cards */}
              <EconomicRatesCard />

              {/* Financing Metrics Summary */}
              <FinancingSummary />

              {/* Variable Financing List */}
              <FinancingList />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DividasPage() {
  return (
    <FinanceProvider>
      <DividasContent />
    </FinanceProvider>
  )
}
