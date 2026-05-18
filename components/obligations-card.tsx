'use client'

import { useState } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { SinkingFund, AnnualExpense } from '@/lib/finance-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Calendar, Goal, Landmark, Plus, Trash2, ArrowUpRight, DollarSign } from 'lucide-react'

export function ObligationsCard() {
  const { engineResult, addSinkingFund, deleteSinkingFund, addAnnualExpense, deleteAnnualExpense } = useFinance()
  const [isFundOpen, setIsFundOpen] = useState(false)
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)

  // Form states for Sinking Fund
  const [fundName, setFundName] = useState('')
  const [fundTarget, setFundTarget] = useState('')
  const [fundCurrent, setFundCurrent] = useState('')
  const [fundDate, setFundDate] = useState('')

  // Form states for Annual Expense
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseMonth, setExpenseMonth] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('')

  if (!engineResult) return null

  const {
    sinkingFunds,
    annualExpenses,
    totalSinkingMonthlyRequired,
    totalAnnualMonthlyRequired,
    totalObligationsMonthlyRequired,
  } = engineResult.obligations

  const handleAddFund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fundName || !fundTarget || !fundDate) return
    await addSinkingFund({
      goalName: fundName,
      targetAmount: parseFloat(fundTarget),
      currentAmount: fundCurrent ? parseFloat(fundCurrent) : 0,
      targetDate: fundDate,
    })
    setFundName('')
    setFundTarget('')
    setFundCurrent('')
    setFundDate('')
    setIsFundOpen(false)
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseName || !expenseAmount || !expenseMonth) return
    await addAnnualExpense({
      name: expenseName,
      annualAmount: parseFloat(expenseAmount),
      dueMonth: parseInt(expenseMonth),
      category: expenseCategory || 'outros',
    })
    setExpenseName('')
    setExpenseAmount('')
    setExpenseMonth('')
    setExpenseCategory('')
    setIsExpenseOpen(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Resumo Consolidado de Provisões */}
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-teal-950/20 via-background to-background backdrop-blur-md lg:col-span-1 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <CardHeader>
          <div className="flex items-center gap-2 text-teal-400 font-medium tracking-wider uppercase text-xs">
            <Calendar className="w-3.5 h-3.5" />
            Provisões de Futuro V3
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white mt-1">
            R$ {totalObligationsMonthlyRequired.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal text-muted-foreground block mt-1">Reserva Mensal Recomendada</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            A Engine calcula parcelas mensais simuladas para amortizar despesas futuras pesadas, evitando picos de caixa e endividamento.
          </p>
          <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">Metas de Reserva</span>
              <span className="text-md font-bold text-teal-400">
                R$ {totalSinkingMonthlyRequired.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Impostos & Anuais</span>
              <span className="text-md font-bold text-teal-400">
                R$ {totalAnnualMonthlyRequired.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sinking Funds (Reservas de Destino) */}
      <Card className="border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-md font-semibold text-foreground">Metas & Sinking Funds</CardTitle>
            <CardDescription className="text-xs">Reservas com alvo de valor e data limite</CardDescription>
          </div>
          <Dialog open={isFundOpen} onOpenChange={setIsFundOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-background">
              <DialogHeader>
                <DialogTitle>Nova Meta de Reserva (Sinking Fund)</DialogTitle>
                <DialogDescription>Adicione metas de aquisição ou fundos de emergência para calcular a poupança linear mensal.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddFund} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fund-name">Nome da Meta</Label>
                  <Input id="fund-name" placeholder="Ex: Viagem de Férias, Notebook Novo, Entrada Carro" value={fundName} onChange={e => setFundName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fund-target">Valor Alvo (R$)</Label>
                    <Input id="fund-target" type="number" step="0.01" placeholder="Ex: 8000" value={fundTarget} onChange={e => setFundTarget(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fund-current">Valor Já Poupado (R$)</Label>
                    <Input id="fund-current" type="number" step="0.01" placeholder="Ex: 1200" value={fundCurrent} onChange={e => setFundCurrent(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fund-date">Data Alvo</Label>
                  <Input id="fund-date" type="date" value={fundDate} onChange={e => setFundDate(e.target.value)} required />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white">Criar Meta</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="max-h-[220px] overflow-y-auto space-y-3.5 pr-2 scrollbar-thin">
          {sinkingFunds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Goal className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              Nenhum sinking fund cadastrado.
            </div>
          ) : (
            sinkingFunds.map((report, idx) => {
              const progressPct = Math.min(100, (report.fund.currentAmount / report.fund.targetAmount) * 100)
              return (
                <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm font-semibold text-foreground block leading-tight">{report.fund.goalName}</span>
                      <span className="text-[10px] text-muted-foreground">Faltam {report.monthsRemaining} meses • Limite: {report.fund.targetDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => deleteSinkingFund(report.fund.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted-foreground/15 rounded-full h-1.5 my-2">
                    <div className="bg-teal-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-border/40">
                    <span className="text-muted-foreground">Poupado: R$ {report.fund.currentAmount.toLocaleString('pt-BR')} de R$ {report.fund.targetAmount.toLocaleString('pt-BR')}</span>
                    <span className="font-bold text-teal-400">R$ {report.monthlyContributionRequired.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês</span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Provisões Anuais (Impostos / Seguros) */}
      <Card className="border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-md font-semibold text-foreground">Impostos & Custos Anuais</CardTitle>
            <CardDescription className="text-xs">IPTU, IPVA, Seguros ou Licenciamentos</CardDescription>
          </div>
          <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-background">
              <DialogHeader>
                <DialogTitle>Adicionar Despesa Anual</DialogTitle>
                <DialogDescription>Provisione despesas anuais pesadas dividindo o valor total por 12 meses.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-name">Descrição da Despesa</Label>
                  <Input id="expense-name" placeholder="Ex: IPVA 2027, IPTU, Seguro Casa, Anuidade" value={expenseName} onChange={e => setExpenseName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-amount">Valor Anual Total (R$)</Label>
                    <Input id="expense-amount" type="number" step="0.01" placeholder="Ex: 2400" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-month">Mês de Vencimento</Label>
                    <Input id="expense-month" type="number" min="1" max="12" placeholder="Ex: 1 para Janeiro" value={expenseMonth} onChange={e => setExpenseMonth(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Categoria</Label>
                  <Input id="expense-category" placeholder="Ex: impostos, transporte, moradia" value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white">Provisionar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="max-h-[220px] overflow-y-auto space-y-3.5 pr-2 scrollbar-thin">
          {annualExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Landmark className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              Nenhuma despesa anual provisionada.
            </div>
          ) : (
            annualExpenses.map((report, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-foreground block leading-tight">{report.expense.name}</span>
                  <span className="text-[10px] text-muted-foreground">Vence em {report.monthsUntilDue} meses • Valor total: R$ {report.expense.annualAmount.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <span className="text-sm font-extrabold text-teal-400 block leading-tight">R$ {report.monthlyProvisionRequired.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês</span>
                    <span className="text-[9px] text-muted-foreground uppercase">Provisão recomendada</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => deleteAnnualExpense(report.expense.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
