'use client'

import { useState, useMemo } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, AlertTriangle, Sparkles, CheckCircle2, ChevronRight, CreditCard, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency, getPaymentMethodLabel } from '@/lib/calculations'

export function SubscriptionCard() {
  const { db, engineResult } = useFinance()
  const [activeTab, setActiveTab] = useState<'subs' | 'installments'>('subs')

  const stats = useMemo(() => {
    if (!engineResult) return { sortedSubs: [], activeSubsMonthlyTotal: 0, currentMonthInstallments: [], totalInstallmentsMonthly: 0, insights: [] }

    const { items, insights } = engineResult.subscriptions

    // Sort active subscriptions first, then by cost descending
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

    // Calculate current month's active installments
    const currentMonthStr = format(new Date(), 'yyyy-MM')
    const currentMonthInstallments = db.transactions
      .filter(t => 
        t.type === 'expense' && 
        t.installments && 
        t.date.startsWith(currentMonthStr)
      )
      .sort((a, b) => b.amount - a.amount)

    const totalInstallmentsMonthly = currentMonthInstallments.reduce((sum, t) => sum + t.amount, 0)

    return {
      sortedSubs,
      activeSubsMonthlyTotal,
      currentMonthInstallments,
      totalInstallmentsMonthly,
      insights,
    }
  }, [db, engineResult])

  if (!engineResult) return null

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Resumo & Insights das Assinaturas e Parcelas */}
      <Card className="border-border bg-gradient-to-br from-violet-950/20 via-background to-background backdrop-blur-md lg:col-span-1 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-2 text-violet-400 font-medium tracking-wider uppercase text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Compromissos Mensais
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white mt-1">
            {formatCurrency(stats.activeSubsMonthlyTotal + stats.totalInstallmentsMonthly)}
            <span className="text-xs font-normal text-muted-foreground block mt-1">impacto recorrente estimado este mês</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-muted-foreground">Assinaturas Ativas</span>
              <span className="font-semibold text-foreground">{formatCurrency(stats.activeSubsMonthlyTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-muted-foreground">Parcelas no Cartão</span>
              <span className="font-semibold text-foreground">{formatCurrency(stats.totalInstallmentsMonthly)}</span>
            </div>
          </div>

          {/* Insights List */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alertas da Engine</h4>
            {stats.insights.length === 0 ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Sem anomalias detectadas nos compromissos.
              </div>
            ) : (
              stats.insights.map((insight, idx) => (
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
                    <span className="font-medium block leading-tight">
                      {insight.type === 'subscription_duplicate' ? 'Duplicidade Detectada' : 'Aumento de Preço'}
                    </span>
                    <p className="text-muted-foreground mt-0.5">{insight.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Assinaturas e Parcelas (Tabbed Card) */}
      <Card className="lg:col-span-2 border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-md font-semibold text-foreground">Gestão de Compromissos</CardTitle>
              <CardDescription className="text-xs">Identificados automaticamente pela Engine Financeira</CardDescription>
            </div>
            
            {/* Tabs Trigger */}
            <div className="flex rounded-lg bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setActiveTab('subs')}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'subs' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'hover:text-foreground'
                }`}
              >
                Assinaturas ({stats.sortedSubs.filter(s => s.isActive).length})
              </button>
              <button
                onClick={() => setActiveTab('installments')}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'installments' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'hover:text-foreground'
                }`}
              >
                Parcelas ({stats.currentMonthInstallments.length})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[310px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {activeTab === 'subs' ? (
            stats.sortedSubs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Nenhuma assinatura recorrente detectada ainda.
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Lance despesas com mesmo nome e padrão mensal para a Engine identificar.
                </p>
              </div>
            ) : (
              stats.sortedSubs.map((sub, idx) => {
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
                        {formatCurrency(currentCost)}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {sub.billingCycle === 'monthly' ? 'por mês' : 'por ano'}
                      </span>
                    </div>
                  </div>
                )
              })
            )
          ) : (
            stats.currentMonthInstallments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Nenhuma parcela em andamento este mês.
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Compras parceladas com cartão aparecerão aqui automaticamente.
                </p>
              </div>
            ) : (
              stats.currentMonthInstallments.map((inst, idx) => {
                // Extract clean description and current/total installment count
                const cleanName = inst.description.replace(/\s*\(\d+\/\d+\)/g, '')
                const current = inst.installments?.current || 1
                const total = inst.installments?.total || 1

                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 transition-all hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground block leading-tight">{cleanName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground capitalize">{inst.category}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3 inline" />
                            Vence: {inst.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[var(--destructive)] block">
                        {formatCurrency(inst.amount)}
                      </span>
                      <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 font-semibold border border-pink-500/20 mt-0.5">
                        Parcela {current}/{total}
                      </span>
                    </div>
                  </div>
                )
              })
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
