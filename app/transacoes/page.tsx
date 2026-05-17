'use client'

import { FinanceProvider } from '@/contexts/finance-context'
import { AppSidebar } from '@/components/app-sidebar'
import { TransactionForm } from '@/components/transaction-form'
import { TransactionList } from '@/components/transaction-list'

function TransacoesContent() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      <main className="lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8 pt-20 lg:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Transações</h1>
              <p className="text-muted-foreground">
                Gerencie suas receitas e despesas
              </p>
            </div>
            <TransactionForm />
          </div>
          
          <TransactionList />
        </div>
      </main>
    </div>
  )
}

export default function TransacoesPage() {
  return (
    <FinanceProvider>
      <TransacoesContent />
    </FinanceProvider>
  )
}
