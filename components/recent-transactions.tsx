'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFinance } from '@/contexts/finance-context'
import { formatCurrency, getCategoryLabel, getPaymentMethodLabel } from '@/lib/calculations'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Link from 'next/link'

export function RecentTransactions() {
  const { db } = useFinance()
  
  const recentTransactions = useMemo(() => {
    return [...db.transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [db.transactions])
  
  if (recentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Últimas Transações</CardTitle>
          <Link
            href="/transacoes"
            className="text-sm text-primary hover:underline"
          >
            Ver todas
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma transação registrada
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Últimas Transações</CardTitle>
        <Link
          href="/transacoes"
          className="text-sm text-primary hover:underline"
        >
          Ver todas
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    transaction.type === 'income'
                      ? 'bg-[var(--success)]/10'
                      : 'bg-[var(--destructive)]/10'
                  }`}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="h-4 w-4 text-[var(--success)]" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-[var(--destructive)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{getCategoryLabel(transaction.category)}</span>
                    <span>•</span>
                    <span>
                      {format(parseISO(transaction.date), 'dd MMM', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-medium ${
                    transaction.type === 'income'
                      ? 'text-[var(--success)]'
                      : 'text-foreground'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getPaymentMethodLabel(transaction.paymentMethod)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
