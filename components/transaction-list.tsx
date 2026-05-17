'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Badge } from '@/components/ui/badge'
import { useFinance } from '@/contexts/finance-context'
import {
  formatCurrency,
  getCategoryLabel,
  getPaymentMethodLabel,
  filterTransactions,
} from '@/lib/calculations'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/lib/finance-types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  X,
  RefreshCw,
} from 'lucide-react'

export function TransactionList() {
  const { db, deleteTransaction } = useFinance()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [paymentFilter, setPaymentFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  
  const filteredTransactions = useMemo(() => {
    return filterTransactions(db.transactions, {
      search: search || undefined,
      type: typeFilter as 'expense' | 'income' | undefined,
      category: categoryFilter || undefined,
      paymentMethod: paymentFilter || undefined,
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [db.transactions, search, typeFilter, categoryFilter, paymentFilter])
  
  const clearFilters = () => {
    setSearch('')
    setTypeFilter('')
    setCategoryFilter('')
    setPaymentFilter('')
  }
  
  const hasActiveFilters = search || typeFilter || categoryFilter || paymentFilter
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-base">
            Transações ({filteredTransactions.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-accent' : ''}
            >
              <Filter className="h-4 w-4" />
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t mt-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesas</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Pagamento" />
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
        )}
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? 'Nenhuma transação encontrada com os filtros aplicados'
                : 'Nenhuma transação registrada'}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
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
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {getCategoryLabel(transaction.category)} •{' '}
                            {format(parseISO(transaction.date), 'dd/MM')}
                          </p>
                          {transaction.installments && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {transaction.installments.current}/{transaction.installments.total}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">
                        {getCategoryLabel(transaction.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {format(parseISO(transaction.date), "dd 'de' MMM", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                      {transaction.cardId && (
                        <span className="ml-1 text-xs">
                          ({db.cards.find((c) => c.id === transaction.cardId)?.name})
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        transaction.type === 'income'
                          ? 'text-[var(--success)]'
                          : ''
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A transação será
                              removida permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTransaction(transaction.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
