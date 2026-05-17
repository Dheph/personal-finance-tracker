'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useFinance } from '@/contexts/finance-context'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/lib/finance-types'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

interface TransactionFormProps {
  onSuccess?: () => void
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { db, addTransaction, addInstallmentTransactions } = useFinance()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [cardId, setCardId] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isRecurring, setIsRecurring] = useState(false)
  const [hasInstallments, setHasInstallments] = useState(false)
  const [installments, setInstallments] = useState('2')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  
  const resetForm = () => {
    setType('expense')
    setDescription('')
    setAmount('')
    setCategory('')
    setPaymentMethod('pix')
    setCardId('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setIsRecurring(false)
    setHasInstallments(false)
    setInstallments('2')
    setNotes('')
    setTags('')
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description || !amount || !category || !date) {
      return
    }
    
    const competencyMonth = date.slice(0, 7)
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    
    const baseTransaction = {
      type,
      description,
      amount: parseFloat(amount),
      category,
      paymentMethod,
      cardId: paymentMethod === 'credit_card' ? cardId : undefined,
      date,
      competencyMonth,
      isRecurring,
      notes: notes || undefined,
      tags: parsedTags,
    }
    
    if (hasInstallments && parseInt(installments) > 1) {
      addInstallmentTransactions(baseTransaction, parseInt(installments))
    } else {
      addTransaction(baseTransaction)
    }
    
    resetForm()
    setOpen(false)
    onSuccess?.()
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setType('expense')
                setCategory('')
              }}
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setType('income')
                setCategory('')
                setPaymentMethod('bank_transfer')
              }}
            >
              Receita
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mercado, Uber, Salário..."
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pagamento *</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {paymentMethod === 'credit_card' && db.cards.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="card">Cartão</Label>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {db.cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: card.color }}
                        />
                        {card.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {type === 'expense' && paymentMethod === 'credit_card' && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="installments-switch">Parcelado</Label>
                <p className="text-xs text-muted-foreground">
                  Dividir em parcelas mensais
                </p>
              </div>
              <Switch
                id="installments-switch"
                checked={hasInstallments}
                onCheckedChange={setHasInstallments}
              />
            </div>
          )}
          
          {hasInstallments && (
            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i + 2).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="recurring">Recorrente</Label>
              <p className="text-xs text-muted-foreground">
                Despesa fixa mensal
              </p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="casa, trabalho, essencial (separados por vírgula)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              rows={2}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
