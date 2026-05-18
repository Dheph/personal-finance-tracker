'use client'

import { useFinance } from '@/contexts/finance-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, ShieldCheck, AlertCircle, Heart, DollarSign, ArrowUpRight } from 'lucide-react'

export function RiskMatrixCard() {
  const { engineResult } = useFinance()

  if (!engineResult || !engineResult.risk) return null

  const {
    score,
    level,
    liquidityMonths,
    debtToAssetRatio,
    debtToIncomeRatio,
    factors,
    recommendation,
  } = engineResult.risk

  // Determine styling based on risk level
  const getLevelStyles = () => {
    switch (level) {
      case 'high':
        return {
          color: 'text-rose-400',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/20',
          glow: 'from-rose-500/10',
          label: 'Risco Elevado',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
        }
      case 'medium':
        return {
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          glow: 'from-amber-500/10',
          label: 'Risco Moderado',
          icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
        }
      case 'low':
      default:
        return {
          color: 'text-teal-400',
          bgColor: 'bg-teal-500/10',
          borderColor: 'border-teal-500/20',
          glow: 'from-teal-500/10',
          label: 'Risco Baixo',
          icon: <ShieldCheck className="w-5 h-5 text-teal-400" />,
        }
    }
  }

  const styles = getLevelStyles()

  return (
    <Card className="relative overflow-hidden border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${styles.glow} to-transparent rounded-full blur-3xl pointer-events-none`} />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            {styles.icon}
            Matriz de Vulnerabilidade Financeira
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.color} ${styles.bgColor} ${styles.borderColor}`}>
            {styles.label}
          </span>
        </div>
        <CardTitle className="mt-2">Índice de Saúde Financeira</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Avaliação de vulnerabilidade através de alavancagem, liquidez básica e índice de endividamento bruto.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Score Indicator */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/10 border border-border/30 relative overflow-hidden">
          {/* Radial progress simulator */}
          <div className="relative flex items-center justify-center shrink-0 w-20 h-20 rounded-full border-4 border-zinc-800 bg-zinc-950 shadow-[inset_0_0_12px_rgba(0,0,0,0.5)]">
            <span className={`text-2xl font-black ${styles.color}`}>
              {score}%
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Índice de Risco</span>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {recommendation}
            </p>
          </div>
        </div>

        {/* Matrix Factors breakdowns */}
        <div className="space-y-3.5 pt-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Fatores Críticos
          </span>

          <div className="space-y-2.5">
            {factors.map((factor, idx) => {
              let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              let dotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'

              if (factor.status === 'danger') {
                badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                dotColor = 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
              } else if (factor.status === 'warning') {
                badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                dotColor = 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
              }

              return (
                <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/5 border border-border/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      <span className="text-xs font-bold text-foreground">
                        {factor.name}
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${badgeColor}`}>
                      {factor.value}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400/90 leading-relaxed mt-0.5">
                    {factor.description}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
