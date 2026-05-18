'use client'

import { useFinance } from '@/contexts/finance-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertOctagon, HeartCrack, Flame, Compass, HelpCircle } from 'lucide-react'

const BEHAVIOR_ICONS = {
  weekend_spending_spike: Flame,
  stress_spending: HeartCrack,
  impulse_spending: AlertOctagon,
  proximity_spending: Compass,
}

const BEHAVIOR_TITLES = {
  weekend_spending_spike: 'Pico de Fim de Semana',
  stress_spending: 'Gastos de Estresse / Noturnos',
  impulse_spending: 'Padrão de Impulsividade',
  proximity_spending: 'Efeito Fechamento de Fatura',
}

export function BehaviorAnalysisCard() {
  const { engineResult } = useFinance()

  if (!engineResult) return null

  const { insights } = engineResult.behavior

  return (
    <Card className="border-border bg-gradient-to-br from-indigo-950/10 via-background to-background shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-md font-semibold text-foreground flex items-center gap-2">
          Análise Comportamental V3
        </CardTitle>
        <CardDescription className="text-xs">
          A Engine estuda dias da semana, horários e fechamento de faturas para mapear seus hábitos de consumo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
        {insights.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30 animate-pulse" />
            Nenhum hábito incomum ou nocivo detectado pela IA ainda.
            <p className="text-[11px] text-muted-foreground/60 mt-1">Conforme você lança transações reais com data e hora, os padrões aparecem.</p>
          </div>
        ) : (
          insights.map((insight, idx) => {
            const IconComponent = BEHAVIOR_ICONS[insight.type as keyof typeof BEHAVIOR_ICONS] || HelpCircle
            const title = BEHAVIOR_TITLES[insight.type as keyof typeof BEHAVIOR_TITLES] || 'Hábito Mapeado'

            return (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border flex items-start gap-3.5 transition-all hover:bg-muted/30 ${
                  insight.severity === 'high' 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                    : insight.severity === 'medium' 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  insight.severity === 'high' 
                    ? 'bg-rose-500/20 text-rose-400' 
                    : insight.severity === 'medium' 
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold block leading-tight">{title}</span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {insight.message}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
