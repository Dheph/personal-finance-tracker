'use client'

import { FinanceProvider } from '@/contexts/finance-context'
import { AppSidebar } from '@/components/app-sidebar'
import { AddLoanButton } from '@/components/loan-form'
import { LoanList, LoanSummary } from '@/components/loan-list'

function DividasContent() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:pl-64">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pt-20 lg:pt-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dividas e Emprestimos</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie e acompanhe a quitacao das suas dividas
              </p>
            </div>
            <AddLoanButton />
          </div>

          {/* Summary Cards */}
          <div className="mb-6">
            <LoanSummary />
          </div>

          {/* Loan List */}
          <LoanList />
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
