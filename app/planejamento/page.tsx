'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { PayoffSimulator } from '@/components/payoff-simulator'

export default function PlanejamentoPage() {
  return (
    <AppSidebar>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
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
    </AppSidebar>
  )
}
