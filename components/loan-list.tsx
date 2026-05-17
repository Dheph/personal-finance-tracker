'use client'

import { useState } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { Loan, LOAN_TYPES } from '@/lib/finance-types'
import { LoanForm } from './loan-form'
import { LoanPaymentModal } from './loan-payment-modal'
import {
  Building2,
  Calendar,
  TrendingDown,
  Percent,
  MoreVertical,
  Edit,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LoanCardProps {
  loan: Loan
}

export function LoanCard({ loan }: LoanCardProps) {
  const { deleteLoan } = useFinance()
  const [showMenu, setShowMenu] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const progressPercent = ((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100
  const remainingInstallments = loan.installments - loan.paidInstallments
  const daysUntilDue = differenceInDays(parseISO(loan.nextDueDate), new Date())
  
  const loanType = LOAN_TYPES.find(t => t.id === loan.type)

  const statusConfig = {
    active: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Ativo' },
    paid_off: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Quitado' },
    defaulted: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Inadimplente' },
    renegotiated: { icon: RefreshCcw, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Renegociado' },
  }

  const status = statusConfig[loan.status]

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta divida?')) {
      await deleteLoan(loan.id)
    }
    setShowMenu(false)
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{loan.name}</h3>
              <p className="text-sm text-muted-foreground">{loan.institution || loanType?.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
              <status.icon className={`w-3.5 h-3.5 ${status.color}`} />
              <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
            </div>
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
                      onClick={() => { setShowPaymentModal(true); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <DollarSign className="w-4 h-4" />
                      Registrar Pagamento
                    </button>
                    <button
                      onClick={() => { setShowEditForm(true); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Progresso</span>
            <span className="text-foreground font-medium">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Saldo Devedor
            </div>
            <p className="text-lg font-semibold text-foreground">
              R$ {loan.remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              Parcela Mensal
            </div>
            <p className="text-lg font-semibold text-foreground">
              R$ {loan.monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {loan.paidInstallments}/{loan.installments} parcelas
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Percent className="w-3.5 h-3.5" />
              <span>{loan.interestRate}% a.a.</span>
            </div>
          </div>
          {loan.status === 'active' && (
            <div className={`text-xs font-medium ${daysUntilDue < 0 ? 'text-destructive' : daysUntilDue <= 7 ? 'text-amber-400' : 'text-muted-foreground'}`}>
              {daysUntilDue < 0 
                ? `Vencido ha ${Math.abs(daysUntilDue)} dias`
                : daysUntilDue === 0 
                  ? 'Vence hoje'
                  : `Vence em ${daysUntilDue} dias`
              }
            </div>
          )}
        </div>
      </div>

      {showEditForm && <LoanForm loan={loan} onClose={() => setShowEditForm(false)} />}
      {showPaymentModal && <LoanPaymentModal loan={loan} onClose={() => setShowPaymentModal(false)} />}
    </>
  )
}

export function LoanList() {
  const { db } = useFinance()

  const activeLoans = db.loans.filter(l => l.status === 'active')
  const paidLoans = db.loans.filter(l => l.status === 'paid_off')
  const otherLoans = db.loans.filter(l => l.status !== 'active' && l.status !== 'paid_off')

  if (db.loans.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingDown className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma divida cadastrada</h3>
        <p className="text-muted-foreground mb-4">
          Adicione seus emprestimos e financiamentos para acompanhar a quitacao.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Dividas Ativas ({activeLoans.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeLoans.map(loan => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </div>
      )}

      {/* Other Loans */}
      {otherLoans.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Em Situacao Especial ({otherLoans.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {otherLoans.map(loan => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </div>
      )}

      {/* Paid Loans */}
      {paidLoans.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Quitadas ({paidLoans.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {paidLoans.map(loan => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function LoanSummary() {
  const { db } = useFinance()

  const activeLoans = db.loans.filter(l => l.status === 'active')
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0)
  const monthlyPayments = activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0)
  const totalInterest = activeLoans.reduce((sum, l) => {
    const totalWithInterest = l.monthlyPayment * (l.installments - l.paidInstallments)
    return sum + Math.max(0, totalWithInterest - l.remainingAmount)
  }, 0)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-1">Dividas Ativas</p>
        <p className="text-2xl font-bold text-foreground">{activeLoans.length}</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-1">Saldo Devedor Total</p>
        <p className="text-2xl font-bold text-destructive">
          R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-1">Parcelas Mensais</p>
        <p className="text-2xl font-bold text-foreground">
          R$ {monthlyPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-1">Juros Estimados</p>
        <p className="text-2xl font-bold text-amber-400">
          R$ {totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  )
}
