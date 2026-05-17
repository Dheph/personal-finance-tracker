'use client'

import { useState } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { 
  Loan, 
  LoanType, 
  LoanStatus,
  LOAN_TYPES 
} from '@/lib/finance-types'
import {
  Plus,
  X,
  Calendar,
  Building2,
  Percent,
  DollarSign,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { format, addMonths } from 'date-fns'

interface LoanFormProps {
  loan?: Loan
  onClose: () => void
}

export function LoanForm({ loan, onClose }: LoanFormProps) {
  const { addLoan, updateLoan } = useFinance()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: loan?.name || '',
    institution: loan?.institution || '',
    type: loan?.type || 'personal_loan' as LoanType,
    totalAmount: loan?.totalAmount || 0,
    remainingAmount: loan?.remainingAmount || 0,
    interestRate: loan?.interestRate || 0,
    installments: loan?.installments || 12,
    paidInstallments: loan?.paidInstallments || 0,
    monthlyPayment: loan?.monthlyPayment || 0,
    startDate: loan?.startDate || format(new Date(), 'yyyy-MM-dd'),
    nextDueDate: loan?.nextDueDate || format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    status: loan?.status || 'active' as LoanStatus,
    notes: loan?.notes || '',
  })

  const calculateMonthlyPayment = () => {
    if (formData.totalAmount && formData.installments) {
      const monthlyRate = formData.interestRate / 100 / 12
      if (monthlyRate > 0) {
        // PMT formula with interest
        const payment = formData.totalAmount * 
          (monthlyRate * Math.pow(1 + monthlyRate, formData.installments)) /
          (Math.pow(1 + monthlyRate, formData.installments) - 1)
        setFormData(prev => ({ ...prev, monthlyPayment: Math.round(payment * 100) / 100 }))
      } else {
        // Simple division without interest
        setFormData(prev => ({ 
          ...prev, 
          monthlyPayment: Math.round((formData.totalAmount / formData.installments) * 100) / 100 
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!formData.name.trim()) {
        throw new Error('Nome e obrigatorio')
      }
      if (formData.totalAmount <= 0) {
        throw new Error('Valor total deve ser maior que zero')
      }

      const loanData = {
        name: formData.name.trim(),
        institution: formData.institution.trim(),
        type: formData.type,
        totalAmount: formData.totalAmount,
        remainingAmount: loan ? formData.remainingAmount : formData.totalAmount,
        interestRate: formData.interestRate,
        installments: formData.installments,
        paidInstallments: formData.paidInstallments,
        monthlyPayment: formData.monthlyPayment,
        startDate: formData.startDate,
        nextDueDate: formData.nextDueDate,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      }

      if (loan) {
        await updateLoan(loan.id, loanData)
      } else {
        await addLoan(loanData)
      }

      onClose()
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || 'Erro ao salvar emprestimo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-foreground">
            {loan ? 'Editar Emprestimo' : 'Novo Emprestimo'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Name & Institution */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nome da Divida *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Nubank Emprestimo"
                required
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Instituicao
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                  placeholder="Ex: Nubank"
                  className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Tipo de Divida
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as LoanType }))}
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {LOAN_TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Amount & Interest */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Valor Total *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.totalAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Taxa de Juros (% a.a.)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.interestRate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
                  placeholder="12.5"
                  step="0.1"
                  min="0"
                  className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Installments */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Parcelas
              </label>
              <input
                type="number"
                value={formData.installments || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) || 0 }))}
                placeholder="12"
                min="1"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Parcelas Pagas
              </label>
              <input
                type="number"
                value={formData.paidInstallments || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, paidInstallments: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
                max={formData.installments}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Valor Parcela
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.monthlyPayment || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyPayment: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            type="button"
            onClick={calculateMonthlyPayment}
            className="w-full bg-muted text-foreground py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            Calcular Parcela Automaticamente
          </button>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Data Inicio
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Proximo Vencimento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextDueDate: e.target.value }))}
                  className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Remaining Amount (edit only) */}
          {loan && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Saldo Devedor Atual
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.remainingAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, remainingAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as LoanStatus }))}
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="active">Ativo</option>
              <option value="paid_off">Quitado</option>
              <option value="defaulted">Inadimplente</option>
              <option value="renegotiated">Renegociado</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Observacoes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Anotacoes sobre este emprestimo..."
              rows={3}
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-muted text-foreground py-2.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {loan ? 'Salvar' : 'Adicionar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AddLoanButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nova Divida
      </button>
      {isOpen && <LoanForm onClose={() => setIsOpen(false)} />}
    </>
  )
}
