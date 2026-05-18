'use client'

import { useFinance } from '@/contexts/finance-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Sparkles } from 'lucide-react'

export function PersonalInflationCard() {
  const { engineResult } = useFinance()

  if (!engineResult) return null

  const {
    personalInflationRate,
    isInflationPositive,
    categoryInflation,
    insightMessage,
  } = engineResult.inflation

  const CATEGORY_TRANSLATIONS: { [key: string]: string } = {
    food: 'Alimentação',
    utilities: 'Contas básicas',
    transportation: 'Transporte',
    health: 'Saúde',
    housing: 'Moradia',
  }

  // Get status details based on the rate
  const getStatus = () => {
    if (personalInflationRate === 0) {
      return {
        label: 'Estável',
        color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
        glow: 'from-zinc-500/5',
        arrow: null
      }
    }
    if (personalInflationRate > 0) {
      if (personalInflationRate > 15) {
        return {
          label: 'Alerta de Inflação Alta',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          glow: 'from-rose-500/5',
          arrow: <ArrowUpRight className="w-4 h-4 text-rose-400" />
        }
      }
      return {
        label: 'Inflação Controlada',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        glow: 'from-amber-500/5',
        arrow: <ArrowUpRight className="w-4 h-4 text-amber-400" />
      }
    }
    return {
      label: 'Deflação Pessoal',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      glow: 'from-emerald-500/5',
      arrow: <ArrowDownRight className="w-4 h-4 text-emerald-400" />
    }
  }

  const status = getStatus()

  return (
    <Card className="relative overflow-hidden border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${status.glow} to-transparent rounded-full blur-3xl pointer-events-none`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            Índice de Inflação Pessoal (IIP)
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
            {status.label}
          </span>
        </div>
        <CardTitle className="flex items-baseline gap-2 mt-2">
          <span className={`text-4xl font-extrabold tracking-tight ${isInflationPositive && personalInflationRate > 0 ? 'text-amber-400' : personalInflationRate < 0 ? 'text-emerald-400' : 'text-white'}`}>
            {personalInflationRate > 0 ? '+' : ''}{personalInflationRate.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs últimos 30-60 dias</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Insight Box */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground/90 leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <span>{insightMessage}</span>
        </div>

        {/* Custo por Categoria Essencial */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Impacto por Categoria</span>
          
          {categoryInflation.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-xs">
              Mapeando transações nas categorias essenciais...
            </div>
          ) : (
            <div className="space-y-2">
              {categoryInflation.map((cat, idx) => {
                const isCatPositive = cat.rate > 0
                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/10 hover:bg-muted/20 border border-border/20 transition-all">
                    <div className="flex items-center gap-2">
                      {isCatPositive ? (
                        <span className="p-1 rounded bg-amber-500/10 text-amber-400">
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                          <ArrowDownRight className="w-3 h-3" />
                        </span>
                      )}
                      <div>
                        <span className="text-xs font-semibold text-foreground block leading-tight">
                          {CATEGORY_TRANSLATIONS[cat.category] || cat.category}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          R$ {cat.spendB.toFixed(0)} → R$ {cat.spendA.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-extrabold ${isCatPositive ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isCatPositive ? '+' : ''}{cat.rate.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
