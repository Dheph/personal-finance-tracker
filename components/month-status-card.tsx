'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinance } from '@/contexts/finance-context'
import { calculateMonthlyExpenses, calculateMonthlyIncome, formatCurrency } from '@/lib/calculations'
import { CheckCircle2, AlertTriangle, ShieldAlert, TrendingUp, TrendingDown, Landmark } from 'lucide-react'

export function MonthStatusCard() {
  const { db } = useFinance()

  const analysis = useMemo(() => {
    const monthlyIncome = calculateMonthlyIncome(db.transactions)
    const monthlyExpenses = calculateMonthlyExpenses(db.transactions)
    
    // Calculate total active debt obligations (monthly payment of active loans)
    const activeLoans = db.loans.filter((l) => l.status === 'active')
    const totalLoansDueThisMonth = activeLoans.reduce((acc, l) => acc + l.monthlyPayment, 0)
    
    const totalOutflows = monthlyExpenses + totalLoansDueThisMonth
    const netBalance = monthlyIncome - totalOutflows

    let status: 'safe' | 'warning' | 'screwed' = 'safe'
    let title = 'Tudo Sob Controle'
    let phrase = 'Você NÃO está na merda! 🎉'
    let description = 'Seu caixa operacional está positivo. Excelente preservação de margem de segurança!'
    let badgeColor = 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
    let glowColor = 'shadow-[var(--success)]/5'
    let icon = CheckCircle2

    if (netBalance < 0) {
      status = 'screwed'
      title = 'Alerta Vermelho'
      phrase = 'Você está oficialmente na merda! 💩💸'
      description = 'O total de saídas (despesas + parcelas de dívidas) superou suas receitas. Hora de cortar gastos imediatos!'
      badgeColor = 'bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/20'
      glowColor = 'shadow-[var(--destructive)]/5'
      icon = ShieldAlert
    } else if (netBalance <= 250) {
      status = 'warning'
      title = 'Atenção Máxima'
      phrase = 'No Limite! ⚠️'
      description = 'Você está no zero a zero ou com uma margem perigosamente estreita. Evite qualquer compra supérflua.'
      badgeColor = 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20'
      glowColor = 'shadow-[var(--warning)]/5'
      icon = AlertTriangle
    }

    return {
      monthlyIncome,
      monthlyExpenses,
      totalLoansDueThisMonth,
      totalOutflows,
      netBalance,
      status,
      title,
      phrase,
      description,
      badgeColor,
      glowColor,
      icon,
    }
  }, [db])

  const IconComponent = analysis.icon

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 border bg-card/60 backdrop-blur-md shadow-lg ${analysis.glowColor}`}>
      {/* Decorative colored glow bar at the top */}
      <div 
        className={`absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500 ${
          analysis.status === 'safe' 
            ? 'bg-[var(--success)]' 
            : analysis.status === 'warning'
            ? 'bg-[var(--warning)]'
            : 'bg-[var(--destructive)]'
        }`} 
      />

      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Status do Mês Atual
        </CardTitle>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${analysis.badgeColor}`}>
          {analysis.title}
        </span>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Slang Diagnostic Status Block */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-muted/40 border border-muted/50">
          <div className="mt-0.5">
            <IconComponent className={`h-5 w-5 ${
              analysis.status === 'safe' 
                ? 'text-[var(--success)]' 
                : analysis.status === 'warning'
                ? 'text-[var(--warning)]'
                : 'text-[var(--destructive)]'
            }`} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground mb-0.5">
              {analysis.phrase}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {analysis.description}
            </p>
          </div>
        </div>

        {/* Dynamic Glowing Balance Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fluxo de Caixa Líquido</span>
            <span className={`font-bold ${
              analysis.netBalance >= 0 
                ? 'text-[var(--success)]' 
                : 'text-[var(--destructive)]'
            }`}>
              {formatCurrency(analysis.netBalance)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden relative border border-muted/50">
            {analysis.netBalance > 0 ? (
              <div 
                className="h-full rounded-full bg-[var(--success)] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(var(--success-rgb),0.5)]"
                style={{ 
                  width: `${Math.min((analysis.netBalance / (analysis.monthlyIncome || 1)) * 100, 100)}%` 
                }}
              />
            ) : (
              <div 
                className="h-full rounded-full bg-[var(--destructive)] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(var(--destructive-rgb),0.5)]"
                style={{ 
                  width: `${Math.min((Math.abs(analysis.netBalance) / (analysis.totalOutflows || 1)) * 100, 100)}%` 
                }}
              />
            )}
          </div>
        </div>

        {/* Detailed Statistics Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <div className="space-y-1 p-3 rounded-xl bg-muted/20 border border-muted/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--success)]" />
              <span>Receitas Totais</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {formatCurrency(analysis.monthlyIncome)}
            </p>
          </div>

          <div className="space-y-1 p-3 rounded-xl bg-muted/20 border border-muted/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <TrendingDown className="h-3.5 w-3.5 text-[var(--destructive)]" />
              <span>Despesas Totais</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {formatCurrency(analysis.monthlyExpenses)}
            </p>
          </div>

          <div className="col-span-2 space-y-1 p-3 rounded-xl bg-muted/20 border border-muted/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Landmark className="h-3.5 w-3.5 text-[var(--warning)]" />
              <span>Compromisso de Dívidas (DTI)</span>
            </div>
            <p className="text-sm font-bold text-[var(--warning)]">
              {formatCurrency(analysis.totalLoansDueThisMonth)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
