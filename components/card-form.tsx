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
import { useFinance } from '@/contexts/finance-context'
import { CARD_BRANDS } from '@/lib/finance-types'
import { Plus } from 'lucide-react'

interface CardFormProps {
  onSuccess?: () => void
}

const CARD_COLORS = [
  { id: 'purple', label: 'Roxo', color: '#8A05BE' },
  { id: 'black', label: 'Preto', color: '#1a1a1a' },
  { id: 'blue', label: 'Azul', color: '#1A1F71' },
  { id: 'red', label: 'Vermelho', color: '#EB001B' },
  { id: 'green', label: 'Verde', color: '#00A651' },
  { id: 'orange', label: 'Laranja', color: '#FF6B00' },
  { id: 'pink', label: 'Rosa', color: '#E91E63' },
  { id: 'teal', label: 'Turquesa', color: '#00BCD4' },
]

export function CardForm({ onSuccess }: CardFormProps) {
  const { addCard } = useFinance()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [limit, setLimit] = useState('')
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [color, setColor] = useState('#8A05BE')
  
  const resetForm = () => {
    setName('')
    setBrand('')
    setLimit('')
    setClosingDay('')
    setDueDay('')
    setColor('#8A05BE')
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !brand || !limit || !closingDay || !dueDay) {
      return
    }
    
    addCard({
      name,
      brand,
      limit: parseFloat(limit),
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color,
    })
    
    resetForm()
    setOpen(false)
    onSuccess?.()
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cartão de Crédito</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cartão *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Itaú, Inter..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="brand">Bandeira *</Label>
            <Select value={brand} onValueChange={setBrand} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a bandeira" />
              </SelectTrigger>
              <SelectContent>
                {CARD_BRANDS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="limit">Limite *</Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              min="0"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="10000.00"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closingDay">Dia de Fechamento *</Label>
              <Select value={closingDay} onValueChange={setClosingDay} required>
                <SelectTrigger>
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDay">Dia de Vencimento *</Label>
              <Select value={dueDay} onValueChange={setDueDay} required>
                <SelectTrigger>
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Cor do Cartão</Label>
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.color)}
                  className={`h-8 w-8 rounded-full transition-all ${
                    color === c.color
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : ''
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
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
