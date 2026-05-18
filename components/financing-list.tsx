'use client'

import { useState } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { Financing, FinancingInstallment } from '@/lib/finance-types'
import { FinancingForm } from './financing-form'
import {
  Home,
  Car,
  Activity,
  HelpCircle,
  Calendar,
  Percent,
  TrendingDown,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  X,
  Loader2,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Modal de pagamento da parcela do financiamento
interface FinancingPaymentModalProps {
  financing: Financing
  installment: FinancingInstallment
  onClose: () => void
}

function FinancingPaymentModal({ financing, installment, onClose }: FinancingPaymentModalProps) {
  const { recordFinancingInstallmentPayment } = useFinance()
  const [isLoading, setIsLoading] = useState(false)
  const [actualValue, setActualValue] = useState(installment.predictedValue)
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await recordFinancingInstallmentPayment(installment.id, actualValue, notes)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">Confirmar Pagamento</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Parcela {installment.installmentNumber} de {financing.totalInstallments}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Vencimento original:</span>
              <span className="text-foreground font-semibold">
                {format(parseISO(installment.dueDate), 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Previsão automática:</span>
              <span className="text-foreground font-semibold">
                R$ {installment.predictedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Valor Real Pago (R$) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={actualValue}
                onChange={(e) => setActualValue(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0.01"
                required
                className="w-full bg-input border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-base"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Como o financiamento é variável, ajuste para o valor exato debitado da sua conta.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Observações / Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pago com amortização extra de R$ 500"
              rows={2}
              className="w-full bg-input border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 resize-none text-xs"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-muted text-foreground py-2.5 rounded-xl font-bold hover:bg-muted/80 transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-success text-success-foreground py-2.5 rounded-xl font-bold hover:bg-success/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Confirmar e Pagar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Card de Financiamento individual
interface FinancingCardProps {
  financing: Financing
}

export function FinancingCard({ financing }: FinancingCardProps) {
  const { db, deleteFinancing, economicRates } = useFinance()
  const [showMenu, setShowMenu] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [paymentInstallment, setPaymentInstallment] = useState<FinancingInstallment | null>(null)

  // Achar todas as parcelas deste financiamento
  const installments = (db.financingInstallments || [])
    .filter((i) => i.financingId === financing.id)
    .sort((a, b) => a.installmentNumber - b.installmentNumber)

  const paidInsts = installments.filter((i) => i.paid)
  const unpaidInsts = installments.filter((i) => !i.paid)
  const nextInstallment = unpaidInsts[0]

  const progressPercent =
    financing.totalInstallments > 0
      ? (financing.paidInstallments / financing.totalInstallments) * 100
      : 0

  const handleEdit = () => {
    setShowEdit(true)
    setShowMenu(false)
  }

  const handleDelete = async () => {
    if (confirm(`Excluir o financiamento "${financing.title}"? Isso removerá todo o histórico de projeções.`)) {
      await deleteFinancing(financing.id)
    }
    setShowMenu(false)
  }

  // Icons por tipo
  const typeIcons: Record<string, typeof Home> = {
    house: Home,
    vehicle: Car,
    personal: Activity,
    other: HelpCircle,
  }
  const TypeIcon = typeIcons[financing.type] || HelpCircle

  // Cores por tipo
  const typeColors: Record<string, string> = {
    house: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    vehicle: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    personal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    other: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }

  // Cálculo da variação de tendência para exibição de setas
  const totalAnnualRate = financing.annualInterestRate + (economicRates[financing.indexer] || 0)
  const hasIndexer = financing.indexer !== 'FIXED'

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/25 transition-all duration-300 shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${typeColors[financing.type] || typeColors.other}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm leading-tight">{financing.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{financing.bankName || 'Credor Direto'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors font-medium"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar Parâmetros
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir Financiamento
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Amortization */}
        <div className="mb-4 bg-muted/20 border border-border/40 rounded-xl p-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground font-medium">Progresso de Amortização</span>
            <span className="text-foreground font-bold">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
            {financing.paidInstallments} de {financing.totalInstallments} parcelas quitadas
          </span>
        </div>

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 gap-3.5 mb-4">
          <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Saldo Devedor</span>
            <span className="text-base font-bold text-foreground leading-tight tracking-tight">
              R$ {financing.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 relative overflow-hidden">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Previsão Próxima</span>
            <span className="text-base font-bold text-primary leading-tight tracking-tight">
              R$ {(financing.nextInstallmentPrediction || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {hasIndexer && (
              <span className="text-[9px] text-success font-semibold flex items-center gap-0.5 mt-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Estável ({financing.indexer})
              </span>
            )}
            {!hasIndexer && (
              <span className="text-[9px] text-muted-foreground font-medium block mt-1">
                Taxa Fixa Comercial
              </span>
            )}
          </div>
        </div>

        {/* Base Rate Badge & Start Date Info */}
        <div className="flex items-center justify-between text-xs border-b border-border/50 pb-3.5 mb-3.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Percent className="w-3.5 h-3.5" />
            <span>
              Contratado:{' '}
              <span className="text-foreground font-bold">{financing.annualInterestRate}% a.a.</span>
            </span>
          </div>
          {hasIndexer && (
            <div className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
              {financing.indexer} + {financing.annualInterestRate}% a.a.
            </div>
          )}
        </div>

        {/* Action Button & Collapsible History */}
        <div className="space-y-3">
          {nextInstallment ? (
            <button
              onClick={() => setPaymentInstallment(nextInstallment)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-2.5 rounded-xl text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" />
              Pagar Próxima Parcela (nº {nextInstallment.installmentNumber})
            </button>
          ) : (
            <div className="bg-success/15 border border-success/30 rounded-xl p-3 text-center">
              <span className="text-xs font-bold text-success flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Financiamento Quitante!
              </span>
            </div>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-all"
          >
            <span>Ver Histórico e Projeções</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Histórico colapsável Real vs Previsto */}
          {showHistory && (
            <div className="bg-muted/15 border border-border rounded-xl p-3 max-h-56 overflow-y-auto space-y-2 animate-slide-down">
              {installments.length === 0 && (
                <p className="text-[10px] text-center text-muted-foreground py-4">Sem parcelas projetadas.</p>
              )}
              {installments.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between border-b border-border/30 pb-2 last:border-b-0 last:pb-0 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {inst.paid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-primary/70" />
                    )}
                    <div>
                      <span className="font-semibold text-foreground">Parcela {inst.installmentNumber}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        Vence: {format(parseISO(inst.dueDate), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-foreground">
                      R${' '}
                      {(inst.paid ? inst.actualValue : inst.predictedValue).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    {inst.paid ? (
                      <span className="text-[8px] font-bold block text-success uppercase tracking-wider">Pago</span>
                    ) : (
                      <span className="text-[8px] font-bold block text-primary/70 uppercase tracking-wider">Projetado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && <FinancingForm financing={financing} onClose={() => setShowEdit(false)} />}
      {paymentInstallment && (
        <FinancingPaymentModal
          financing={financing}
          installment={paymentInstallment}
          onClose={() => setPaymentInstallment(null)}
        />
      )}
    </>
  )
}

// Summary block
export function FinancingSummary() {
  const { db } = useFinance()
  const activeFinancings = (db.financings || []).filter((f) => f.currentBalance > 0)
  
  const totalBalance = activeFinancings.reduce((sum, f) => sum + f.currentBalance, 0)
  const totalNextMonthRequirement = activeFinancings.reduce((sum, f) => sum + (f.nextInstallmentPrediction || 0), 0)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Contratos Ativos</p>
        <p className="text-2xl font-bold text-foreground">{activeFinancings.length}</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Saldo Devedor Total</p>
        <p className="text-2xl font-bold text-indigo-500">
          R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 col-span-2 md:col-span-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Próxima Exigência Mensal</p>
        <p className="text-2xl font-bold text-primary">
          R$ {totalNextMonthRequirement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  )
}

// Principal list container
export function FinancingList() {
  const { db } = useFinance()
  const financings = db.financings || []

  if (financings.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum Financiamento Ativo</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
          Cadastre seus financiamentos variáveis (ex: Caixa Habitação) para simular parcelas automáticas e gerenciar amortizações.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {financings.map((f) => (
        <FinancingCard key={f.id} financing={f} />
      ))}
    </div>
  )
}
