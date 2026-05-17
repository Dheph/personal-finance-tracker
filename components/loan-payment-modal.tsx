'use client'

import { useState } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { Loan } from '@/lib/finance-types'
import {
  X,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react'
import { format, addMonths } from 'date-fns'

interface LoanPaymentModalProps {
  loan: Loan
  onClose: () => void
}

export function LoanPaymentModal({ loan, onClose }: LoanPaymentModalProps) {
  const { recordLoanPayment, updateLoan } = useFinance()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    amount: loan.monthlyPayment,
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'paid' as 'paid' | 'partial' | 'late',
    lateFee: 0,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (formData.amount <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }

      await recordLoanPayment({
        loanId: loan.id,
        amount: formData.amount + formData.lateFee,
        date: formData.date,
        installmentNumber: loan.paidInstallments + 1,
        status: formData.status,
        lateFee: formData.lateFee > 0 ? formData.lateFee : undefined,
        notes: formData.notes.trim() || undefined,
      })

      // Update next due date
      const nextDueDate = format(addMonths(new Date(loan.nextDueDate), 1), 'yyyy-MM-dd')
      await updateLoan(loan.id, { nextDueDate })

      onClose()
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || 'Erro ao registrar pagamento')
    } finally {
      setIsLoading(false)
    }
  }

  const remainingAfterPayment = Math.max(0, loan.remainingAmount - formData.amount)
  const willPayOff = remainingAfterPayment === 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Registrar Pagamento</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Loan Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Divida</p>
            <p className="font-semibold text-foreground">{loan.name}</p>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-muted-foreground">Saldo atual:</span>
              <span className="text-foreground font-medium">
                R$ {loan.remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parcela {loan.paidInstallments + 1} de {loan.installments}</span>
              <span className="text-foreground font-medium">
                R$ {loan.monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Valor Pago
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                step="0.01"
                min="0"
                required
                className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Data do Pagamento
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'paid', label: 'Pago' },
                { id: 'partial', label: 'Parcial' },
                { id: 'late', label: 'Atrasado' },
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: option.id as 'paid' | 'partial' | 'late' }))}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.status === option.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Late Fee */}
          {formData.status === 'late' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Multa/Juros por Atraso
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.lateFee || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, lateFee: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Observacoes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Anotacoes sobre este pagamento..."
              rows={2}
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo apos pagamento:</span>
              <span className={`font-medium ${willPayOff ? 'text-success' : 'text-foreground'}`}>
                R$ {remainingAfterPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {willPayOff && (
              <div className="flex items-center gap-2 text-success text-sm">
                <Check className="w-4 h-4" />
                <span className="font-medium">Esta divida sera quitada!</span>
              </div>
            )}
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
                'Registrar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
