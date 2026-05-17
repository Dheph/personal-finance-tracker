'use client'

import { FinanceProvider } from '@/contexts/finance-context'
import { AppSidebar } from '@/components/app-sidebar'
import { CardForm } from '@/components/card-form'
import { CardList } from '@/components/card-list'

function CartoesContent() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      <main className="lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8 pt-20 lg:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Cartões</h1>
              <p className="text-muted-foreground">
                Gerencie seus cartões de crédito
              </p>
            </div>
            <CardForm />
          </div>
          
          <CardList />
        </div>
      </main>
    </div>
  )
}

export default function CartoesPage() {
  return (
    <FinanceProvider>
      <CartoesContent />
    </FinanceProvider>
  )
}
