'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useFinance } from '@/contexts/finance-context'
import { calculateCardUsage, formatCurrency } from '@/lib/calculations'
import { CARD_BRANDS } from '@/lib/finance-types'
import { CreditCard, Trash2 } from 'lucide-react'

export function CardList() {
  const { db, deleteCard } = useFinance()
  
  const cardUsage = useMemo(() => {
    return calculateCardUsage(db)
  }, [db])
  
  if (db.cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <CreditCard className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhum cartão cadastrado</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Adicione seus cartões de crédito para acompanhar gastos e limites disponíveis.
        </p>
      </div>
    )
  }
  
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {db.cards.map((card) => {
        const usage = cardUsage.find((u) => u.cardId === card.id)
        const usedAmount = usage?.used || 0
        const usagePercent = card.limit > 0 ? (usedAmount / card.limit) * 100 : 0
        const available = card.limit - usedAmount
        const brandInfo = CARD_BRANDS.find((b) => b.id === card.brand)
        
        return (
          <Card
            key={card.id}
            className="relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${card.color}20 0%, ${card.color}05 100%)`,
            }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
              style={{ backgroundColor: card.color, transform: 'translate(30%, -30%)' }}
            />
            
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: card.color }}
                  >
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{card.name}</h3>
                    <p className="text-xs text-muted-foreground">{brandInfo?.label}</p>
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O cartão será removido,
                        mas as transações vinculadas serão mantidas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteCard(card.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Utilizado</span>
                    <span className="font-medium">{formatCurrency(usedAmount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(usagePercent, 100)}%`,
                        backgroundColor: usagePercent > 80 ? 'var(--destructive)' : card.color,
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Disponível</span>
                  <span
                    className={`font-medium ${
                      available < 0 ? 'text-[var(--destructive)]' : 'text-[var(--success)]'
                    }`}
                  >
                    {formatCurrency(available)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Limite</span>
                  <span className="font-medium">{formatCurrency(card.limit)}</span>
                </div>
                
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Fecha dia {card.closingDay}</span>
                  <span>Vence dia {card.dueDay}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
