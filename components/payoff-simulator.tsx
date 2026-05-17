'use client'

import { useState, useMemo } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { PayoffStrategy, PAYOFF_STRATEGIES } from '@/lib/finance-types'
import {
  compareStrategies,
  getRecommendedStrategy,
  getSortedLoans,
  simulatePayoff,
} from '@/lib/payoff-calculator'
import {
  TrendingDown,
  Snowflake,
  Mountain,
  Shuffle,
  Settings,
  Calendar,
  DollarSign,
  Percent,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  GripVertical,
} from 'lucide-react'

export function PayoffSimulator() {
  const { db } = useFinance()
  const activeLoans = db.loans.filter(l => l.status === 'active')
  
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    // Default to sum of all minimum payments + 10%
    const minTotal = activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0)
    return Math.round(minTotal * 1.1)
  })
  
  const [selectedStrategy, setSelectedStrategy] = useState<PayoffStrategy>('snowball')
  const [customPriority, setCustomPriority] = useState<string[]>(() => 
    activeLoans.map(l => l.id)
  )

  const minTotalPayment = activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0)
  const recommendation = getRecommendedStrategy(activeLoans)
  
  const simulations = useMemo(() => {
    if (activeLoans.length === 0) return null
    return compareStrategies(activeLoans, monthlyBudget)
  }, [activeLoans, monthlyBudget])

  const currentSimulation = useMemo(() => {
    if (activeLoans.length === 0) return null
    return simulatePayoff(
      activeLoans, 
      selectedStrategy, 
      monthlyBudget, 
      selectedStrategy === 'custom' ? customPriority : undefined
    )
  }, [activeLoans, selectedStrategy, monthlyBudget, customPriority])

  const strategyIcons = {
    snowball: Snowflake,
    avalanche: Mountain,
    hybrid: Shuffle,
    custom: Settings,
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId === targetId) return

    const newPriority = [...customPriority]
    const draggedIndex = newPriority.indexOf(draggedId)
    const targetIndex = newPriority.indexOf(targetId)

    newPriority.splice(draggedIndex, 1)
    newPriority.splice(targetIndex, 0, draggedId)

    setCustomPriority(newPriority)
  }

  if (activeLoans.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingDown className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Sem dividas ativas</h3>
        <p className="text-muted-foreground">
          Adicione suas dividas na aba Dividas para simular estrategias de quitacao.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recommendation Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Estrategia Recomendada: {PAYOFF_STRATEGIES.find(s => s.id === recommendation.strategy)?.label}</p>
          <p className="text-sm text-muted-foreground mt-1">{recommendation.reason}</p>
        </div>
      </div>

      {/* Budget Input */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Orcamento Mensal para Dividas
        </label>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              value={monthlyBudget || ''}
              onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
              min={minTotalPayment}
              step="100"
              className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Min: R$ {minTotalPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        {monthlyBudget < minTotalPayment && (
          <p className="text-sm text-destructive mt-2">
            O orcamento deve ser pelo menos igual a soma das parcelas minimas.
          </p>
        )}
      </div>

      {/* Strategy Comparison */}
      {simulations && (
        <div className="grid gap-4 md:grid-cols-3">
          {(['snowball', 'avalanche', 'hybrid'] as const).map(strategy => {
            const simulation = simulations[strategy]
            const strategyInfo = PAYOFF_STRATEGIES.find(s => s.id === strategy)!
            const Icon = strategyIcons[strategy]
            const isSelected = selectedStrategy === strategy
            const isBest = simulation.totalInterest === Math.min(
              simulations.snowball.totalInterest,
              simulations.avalanche.totalInterest,
              simulations.hybrid.totalInterest
            )

            return (
              <button
                key={strategy}
                onClick={() => setSelectedStrategy(strategy)}
                className={`relative bg-card border rounded-xl p-4 text-left transition-all ${
                  isSelected 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {isBest && (
                  <div className="absolute -top-2 -right-2 bg-success text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    Menor Custo
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{strategyInfo.label}</h4>
                    <p className="text-xs text-muted-foreground">{strategyInfo.description}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Tempo
                    </span>
                    <span className="font-medium text-foreground">{simulation.totalMonths} meses</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5" /> Juros Totais
                    </span>
                    <span className="font-medium text-amber-400">
                      R$ {simulation.totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Total Pago
                    </span>
                    <span className="font-medium text-foreground">
                      R$ {simulation.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Custom Priority Option */}
      <button
        onClick={() => setSelectedStrategy('custom')}
        className={`w-full bg-card border rounded-xl p-4 text-left transition-all ${
          selectedStrategy === 'custom' 
            ? 'border-primary ring-2 ring-primary/20' 
            : 'border-border hover:border-primary/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedStrategy === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
            }`}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Personalizado</h4>
              <p className="text-sm text-muted-foreground">Defina sua propria ordem de prioridade</p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
            selectedStrategy === 'custom' ? 'rotate-90' : ''
          }`} />
        </div>
      </button>

      {/* Custom Priority List */}
      {selectedStrategy === 'custom' && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-3">Arraste para reordenar a prioridade</h4>
          <div className="space-y-2">
            {customPriority.map((loanId, index) => {
              const loan = activeLoans.find(l => l.id === loanId)
              if (!loan) return null

              return (
                <div
                  key={loanId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, loanId)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, loanId)}
                  className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 cursor-move hover:bg-muted transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{loan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: R$ {loan.remainingAmount.toLocaleString('pt-BR')} | {loan.interestRate}% a.a.
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payment Order Preview */}
      {currentSimulation && currentSimulation.totalMonths > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-3">Ordem de Pagamento</h4>
          <div className="space-y-3">
            {getSortedLoans(
              activeLoans, 
              selectedStrategy, 
              selectedStrategy === 'custom' ? customPriority : undefined
            ).map((loan, index) => (
              <div key={loan.id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{loan.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    R$ {loan.remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">{loan.interestRate}% a.a.</p>
                </div>
                {index < activeLoans.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {currentSimulation && currentSimulation.totalMonths > 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h4 className="font-semibold text-foreground">Resumo do Plano</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Estrategia</p>
              <p className="text-lg font-semibold text-foreground">
                {PAYOFF_STRATEGIES.find(s => s.id === selectedStrategy)?.label}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tempo para Quitar</p>
              <p className="text-lg font-semibold text-foreground">
                {currentSimulation.totalMonths} meses
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Juros a Pagar</p>
              <p className="text-lg font-semibold text-amber-400">
                R$ {currentSimulation.totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-lg font-semibold text-foreground">
                R$ {currentSimulation.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
