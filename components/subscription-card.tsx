'use client'

import { useFinance } from '@/contexts/finance-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, AlertTriangle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react'

export function SubscriptionCard() {
  const { engineResult } = useFinance()

  if (!engineResult) return null

  const { items, insights } = engineResult.subscriptions

  // Sort: active subscriptions first, then by monthly cost descending
  const sortedSubs = [...items].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1
    if (!a.isActive && b.isActive) return 1
    const costA = a.amountHistory[a.amountHistory.length - 1] || 0
    const costB = b.amountHistory[b.amountHistory.length - 1] || 0
    return costB - costA
  })

  // Calculate sum of active subscriptions
  const activeSubsMonthlyTotal = items
    .filter(s => s.isActive)
    .reduce((sum, s) => {
      const lastCost = s.amountHistory[s.amountHistory.length - 1] || 0
      return sum + (s.billingCycle === 'yearly' ? lastCost / 12 : lastCost)
    }, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Resumo & Insights das Assinaturas */}
      <Card className="border-border bg-gradient-to-br from-violet-950/20 via-background to-background backdrop-blur-md lg:col-span-1 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-2 text-violet-400 font-medium tracking-wider uppercase text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Assinaturas V3
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white mt-1">
            R$ {activeSubsMonthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal text-muted-foreground block mt-1">impacto mensal estimado</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/40 border border-border/40">
            <span className="text-muted-foreground">Assinaturas Ativas</span>
            <span className="font-semibold text-foreground">{items.filter(s => s.isActive).length} ativas</span>
          </div>

          {/* Insights List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alertas da Engine</h4>
            {insights.length === 0 ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Sem anomalias ou aumentos detectados nas assinaturas.
              </div>
            ) : (
              insights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs leading-relaxed ${
                    insight.severity === 'high' 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium block leading-tight">{insight.type === 'subscription_duplicate' ? 'Duplicidade Detectada' : 'Aumento de Preço'}</span>
                    <p className="text-muted-foreground mt-0.5">{insight.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Assinaturas Detectadas */}
      <Card className="lg:col-span-2 border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-md font-semibold text-foreground">Assinaturas Detectadas</CardTitle>
            <CardDescription className="text-xs">Mapeadas automaticamente pela recorrência dos seus gastos</CardDescription>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-500/20">
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            100% Automático
          </span>
        </CardHeader>
        <CardContent className="max-h-[310px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {sortedSubs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nenhuma assinatura recorrente detectada ainda.
              <p className="text-xs text-muted-foreground/60 mt-1">Lance despesas com mesmo nome e padrão mensal para a Engine identificar.</p>
            </div>
          ) : (
            sortedSubs.map((sub, idx) => {
              const currentCost = sub.amountHistory[sub.amountHistory.length - 1] || 0
              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-muted/40 ${
                    sub.isActive 
                      ? 'border-border/60 bg-muted/20' 
                      : 'border-border/20 bg-muted/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${sub.isActive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-muted text-muted-foreground'}`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block leading-tight">{sub.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground capitalize">{sub.category}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground">Próxima: {sub.nextChargeDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground block">
                      R$ {currentCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {sub.billingCycle === 'monthly' ? 'por mês' : 'por ano'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
