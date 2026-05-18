'use client'

import { useFinance } from '@/contexts/finance-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, TrendingUp, TrendingDown, RefreshCcw, Activity } from 'lucide-react'

export function DynamicExpensesCard() {
  const { engineResult } = useFinance()

  if (!engineResult) return null

  const { items, insights } = engineResult.dynamicExpenses

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Alertas & Resumo da Engine */}
      <Card className="border-border bg-gradient-to-br from-amber-950/20 via-background to-background backdrop-blur-md lg:col-span-1 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-400 font-medium tracking-wider uppercase text-xs">
            <Activity className="w-3.5 h-3.5" />
            Variações Dinâmicas V3
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Contas Variáveis
            <span className="text-xs font-normal text-muted-foreground block mt-1">
              A Engine monitora contas de consumo e prevê o valor do próximo mês.
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alertas de Variação</h4>
            {insights.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                Contas sob controle. Sem variações abruptas ou anomalias de consumo detectadas.
              </div>
            ) : (
              insights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs leading-relaxed ${
                    insight.severity === 'high' 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block leading-tight">
                      {insight.type === 'dynamic_expense_anomaly' ? 'Alerta de Consumo' : 'Variação Mensal'}
                    </span>
                    <p className="text-muted-foreground mt-0.5">{insight.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas e Médias Históricas */}
      <Card className="lg:col-span-2 border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-md font-semibold text-foreground">Previsões & Histórico</CardTitle>
            <CardDescription className="text-xs">Cálculo de médias móveis de 3 meses para amortização de flutuações</CardDescription>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/20">
            <RefreshCcw className="w-3 h-3 animate-spin-slow" />
            Atualizado Reativamente
          </span>
        </CardHeader>
        <CardContent className="max-h-[310px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nenhuma conta de consumo com variação detectada.
              <p className="text-xs text-muted-foreground/60 mt-1">Lançar contas como "Luz", "Gás", ou "Água" repetidamente com valores que mudam a cada mês.</p>
            </div>
          ) : (
            items.map((item, idx) => {
              const lastSnapshot = item.history[item.history.length - 1];
              const prevSnapshot = item.history[item.history.length - 2];
              let varPct = 0;
              if (prevSnapshot && prevSnapshot.amount > 0) {
                varPct = ((lastSnapshot.amount - prevSnapshot.amount) / prevSnapshot.amount) * 100;
              }

              return (
                <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-foreground block leading-tight">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-foreground block">
                        R$ {lastSnapshot.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Último Mês</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Média Esperada</span>
                      <span className="font-semibold text-foreground">
                        R$ {item.expectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Variação</span>
                      {varPct !== 0 ? (
                        <span className={`font-semibold inline-flex items-center gap-0.5 ${varPct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {varPct > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {Math.abs(varPct).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="font-semibold text-muted-foreground">-</span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Status Anomalia</span>
                      <span className={`font-semibold ${lastSnapshot.amount > item.expectedAmount * (1 + item.variationThreshold) ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {lastSnapshot.amount > item.expectedAmount * (1 + item.variationThreshold) ? 'Elevado' : 'Estável'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
