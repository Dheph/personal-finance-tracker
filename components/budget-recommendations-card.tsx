'use client'

import { useState } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, PieChart, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

export function BudgetRecommendationsCard() {
  const { engineResult } = useFinance()
  const [showAll, setShowAll] = useState(false)

  if (!engineResult || !engineResult.budgets) return null

  const {
    recommendations,
    totalRecommended,
    suggestedSavings,
    totalCurrentMonthSpending,
    averageMonthlyIncome,
  } = engineResult.budgets

  const CATEGORY_LABELS: { [key: string]: string } = {
    food: 'Alimentação',
    transport: 'Transporte',
    health: 'Saúde',
    education: 'Educação',
    housing: 'Moradia',
    utilities: 'Contas & Serviços',
    subscriptions: 'Assinaturas',
    shopping: 'Compras',
    travel: 'Viagem',
    entertainment: 'Lazer & Entretenimento',
    pets: 'Pets',
    insurance: 'Seguros',
    investments: 'Investimentos',
    debt_payment: 'Pagamento de Dívidas',
    taxes: 'Impostos',
    other_expense: 'Outras Despesas',
  }

  const visibleRecommendations = showAll ? recommendations : recommendations.slice(0, 5)

  return (
    <Card className="relative overflow-hidden border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Decorative Gradient Background Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Recomendador de Orçamento Dinâmico
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-teal-400 bg-teal-500/10 border-teal-500/20">
            Engine Ativa
          </span>
        </div>
        <CardTitle className="mt-2">Orçamento Inteligente</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Metas autocalculadas com base em médias móveis de 3 meses e sua renda estimada de R$ {averageMonthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Dashboard Grid */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/20 border border-border/40">
          <div>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase block">Teto Recomendado</span>
            <span className="text-lg font-bold text-foreground block">
              R$ {totalRecommended.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-[9px] text-muted-foreground">Soma de todas as categorias</span>
          </div>
          <div className="border-l border-border/60 pl-3">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase block">Margem de Poupança</span>
            <span className="text-lg font-bold text-emerald-400 block shadow-[0_0_12px_rgba(16,185,129,0.1)]">
              R$ {suggestedSavings.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-[9px] text-muted-foreground">Alocação sugerida livre</span>
          </div>
        </div>

        {/* Categories budget progression list */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Análise de Categorias
            </span>
            <span className="text-[10px] text-muted-foreground">
              Despesa Total: R$ {totalCurrentMonthSpending.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              Histórico transacional insuficiente para sugerir limites no momento.
            </div>
          ) : (
            <div className="space-y-3.5">
              {visibleRecommendations.map((rec, idx) => {
                const limitVal = rec.recommendedLimit;
                const spendVal = rec.currentMonthSpending;
                const pct = Math.min(200, Math.round(rec.percentUsed));

                // Color mappings based on status
                let barColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
                let textColor = 'text-emerald-400';
                let icon = <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;

                if (rec.status === 'critical') {
                  barColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
                  textColor = 'text-rose-400';
                  icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
                } else if (rec.status === 'warning') {
                  barColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
                  textColor = 'text-amber-400';
                  icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
                }

                return (
                  <div key={idx} className="space-y-1.5 p-2 rounded-lg bg-muted/5 border border-border/10 hover:bg-muted/10 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {icon}
                        <span className="text-xs font-bold text-foreground">
                          {CATEGORY_LABELS[rec.category] || rec.category}
                        </span>
                      </div>
                      <span className={`text-[11px] font-extrabold ${textColor}`}>
                        {pct}%
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-0.5">
                      <span>
                        Gasto: R$ {spendVal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span>
                        Meta recomendada: R$ {limitVal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    {/* Reasoning Alert message */}
                    <div className="text-[9px] text-zinc-400/90 leading-normal border-t border-border/20 pt-1 mt-1 flex items-start gap-1">
                      <span className="text-teal-400 font-semibold uppercase">Engine:</span>
                      <span>{rec.reason}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Toggle View More/Less Button */}
          {recommendations.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mt-2 py-1.5 hover:bg-muted/30"
            >
              {showAll ? (
                <>
                  Ver Menos <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Ver Todas as Categorias ({recommendations.length}) <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
