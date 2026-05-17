'use client'

import { FinanceProvider } from '@/contexts/finance-context'
import { AppSidebar } from '@/components/app-sidebar'
import { PayoffSimulator } from '@/components/payoff-simulator'

function PlanejamentoContent() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:pl-64">
        <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto pt-20 lg:pt-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Planejamento de Quitacao</h1>
            <p className="text-muted-foreground mt-1">
              Compare estrategias e crie um plano para quitar suas dividas mais rapido
            </p>
          </div>

          {/* Simulator */}
          <PayoffSimulator />
        </div>
      </main>
    </div>
  )
}

export default function PlanejamentoPage() {
  return (
    <FinanceProvider>
      <PlanejamentoContent />
    </FinanceProvider>
  )
}
