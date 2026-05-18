'use client'

import { useState } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { Financing } from '@/lib/finance-types'
import {
  X,
  Building2,
  Percent,
  DollarSign,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'

interface FinancingFormProps {
  financing?: Financing
  onClose: () => void
}

export function FinancingForm({ financing, onClose }: FinancingFormProps) {
  const { addFinancing, updateFinancing } = useFinance()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Controle de tipo de parcela (Fixa vs Variável)
  const [isVariable, setIsVariable] = useState(
    financing ? financing.calculationModel !== 'FIXED' : true
  )

  const [formData, setFormData] = useState({
    title: financing?.title || '',
    bankName: financing?.bankName || '',
    type: financing?.type || 'house',
    calculationModel: financing?.calculationModel || 'VARIABLE',
    principalAmount: financing?.principalAmount || 0,
    currentBalance: financing?.currentBalance || 0,
    annualInterestRate: financing?.annualInterestRate || 0,
    totalInstallments: financing?.totalInstallments || 360,
    paidInstallments: financing?.paidInstallments || 0,
    indexer: financing?.indexer || 'IPCA',
    startDate: financing?.startDate || format(new Date(), 'yyyy-MM-dd'),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!formData.title.trim()) {
        throw new Error('Título é obrigatório')
      }
      if (formData.principalAmount <= 0) {
        throw new Error('Valor financiado deve ser maior que zero')
      }

      // Ajustar modelo e indexador caso seja Fixa
      const finalCalculationModel = isVariable 
        ? formData.calculationModel 
        : 'FIXED'
      const finalIndexer = isVariable 
        ? formData.indexer 
        : 'FIXED'

      const financingData = {
        title: formData.title.trim(),
        bankName: formData.bankName.trim() || undefined,
        type: formData.type as 'vehicle' | 'house' | 'personal' | 'other',
        calculationModel: finalCalculationModel as 'FIXED' | 'VARIABLE' | 'PRICE' | 'SAC',
        principalAmount: formData.principalAmount,
        currentBalance: financing ? formData.currentBalance : formData.principalAmount,
        annualInterestRate: formData.annualInterestRate,
        totalInstallments: formData.totalInstallments,
        paidInstallments: formData.paidInstallments,
        indexer: finalIndexer as 'FIXED' | 'SELIC' | 'CDI' | 'IPCA' | 'TR',
        startDate: formData.startDate,
      }

      if (financing) {
        await updateFinancing(financing.id, financingData)
      } else {
        await addFinancing(financingData)
      }

      onClose()
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setError(errorObj.message || 'Erro ao salvar financiamento')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            {financing ? 'Editar Financiamento' : 'Novo Financiamento Variável'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-3 rounded-xl animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Title & Bank */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Título do Financiamento *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Financiamento Casa"
                required
                className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Banco / Credor
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Ex: Caixa Econômica"
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Tipo do Bem Financiado
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm"
            >
              <option value="house">Imóvel (Casa, Apto, Lote)</option>
              <option value="vehicle">Veículo (Carro, Moto, Náutico)</option>
              <option value="personal">Pessoal / Outros</option>
              <option value="other">Geral / Investimentos</option>
            </select>
          </div>

          {/* Parcela Fixa ou Variável Switch (RN01) */}
          <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-foreground">Regime do Contrato</span>
              <p className="text-xs text-muted-foreground mt-0.5">Define se a taxa é fixa ou atrelada a índices econômicos.</p>
            </div>
            <div className="flex bg-input border border-border p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setIsVariable(false)
                  setFormData(prev => ({ ...prev, indexer: 'FIXED', calculationModel: 'FIXED' }))
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !isVariable 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Parcela Fixa
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsVariable(true)
                  setFormData(prev => ({ ...prev, indexer: 'IPCA', calculationModel: 'VARIABLE' }))
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isVariable 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Variável (Indexada)
              </button>
            </div>
          </div>

          {/* Indexer & Base Rate Grid */}
          {isVariable && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Indexador de Correção
                </label>
                <select
                  value={formData.indexer}
                  onChange={(e) => setFormData(prev => ({ ...prev, indexer: e.target.value }))}
                  className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm font-semibold"
                >
                  <option value="IPCA">IPCA (Inflação)</option>
                  <option value="SELIC">SELIC (Taxa Básica)</option>
                  <option value="CDI">CDI (Interbancário)</option>
                  <option value="TR">TR (Taxa Referencial)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Taxa Base Contratada (% a.a.)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={formData.annualInterestRate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, annualInterestRate: parseFloat(e.target.value) || 0 }))}
                    placeholder="Ex: 5.5"
                    step="0.01"
                    min="0"
                    required
                    className="w-full bg-input border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Valor Financiado & Taxa Fixa */}
          {!isVariable && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Taxa de Juros Fixa (% a.a.)
              </label>
              <div className="relative">
                <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.annualInterestRate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, annualInterestRate: parseFloat(e.target.value) || 0 }))}
                  placeholder="Ex: 9.8"
                  step="0.01"
                  min="0"
                  required
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm font-semibold"
                />
              </div>
            </div>
          )}

          {/* Amont & Current Balance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Valor Total Contratado *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.principalAmount || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    principalAmount: parseFloat(e.target.value) || 0,
                    currentBalance: financing ? prev.currentBalance : (parseFloat(e.target.value) || 0)
                  }))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {financing ? 'Saldo Devedor Atual *' : 'Saldo Devedor Inicial'}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.currentBalance || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentBalance: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Installments Group */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Total de Parcelas
              </label>
              <input
                type="number"
                value={formData.totalInstallments || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, totalInstallments: parseInt(e.target.value) || 0 }))}
                placeholder="Ex: 360"
                min="1"
                required
                className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Pagas
              </label>
              <input
                type="number"
                value={formData.paidInstallments}
                onChange={(e) => setFormData(prev => ({ ...prev, paidInstallments: Math.min(formData.totalInstallments, parseInt(e.target.value) || 0) }))}
                placeholder="0"
                min="0"
                max={formData.totalInstallments}
                required
                className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm"
              />
            </div>
          </div>

          {/* Date and Details Accordion */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Data do Contrato (Início)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Advanced Accordion Toggle */}
          {isVariable && (
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <span>Opções Avançadas (SAC / PRICE)</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showAdvanced && (
                <div className="p-4 bg-muted/10 border-t border-border/40 space-y-3 animate-slide-down">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Modelo de Amortização
                    </label>
                    <select
                      value={formData.calculationModel}
                      onChange={(e) => setFormData(prev => ({ ...prev, calculationModel: e.target.value }))}
                      className="w-full bg-input border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-xs font-bold"
                    >
                      <option value="VARIABLE">Amortização Variável Livre (Padrão)</option>
                      <option value="SAC">SAC (Sistema de Amortização Constante)</option>
                      <option value="PRICE">Tabela PRICE (Prestações Iguais + Juros)</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                      * O modelo selecionado calculará as parcelas mensais utilizando a matemática do indexador. Se você não tiver certeza, selecione a Variável Livre.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-muted text-foreground py-2.5 rounded-xl font-bold hover:bg-muted/80 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>{financing ? 'Salvar' : 'Criar Financiamento'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AddFinancingButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground px-4.5 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg text-sm"
      >
        <Plus className="w-4 h-4 stroke-[2.5px]" />
        Novo Financiamento
      </button>
      {isOpen && <FinancingForm onClose={() => setIsOpen(false)} />}
    </>
  )
}
