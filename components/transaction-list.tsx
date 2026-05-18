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
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function TransactionList() {
  const { db, deleteTransaction, updateTransaction } = useFinance()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [paymentFilter, setPaymentFilter] = useState<string>('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState<any>('pix')
  const [editCardId, setEditCardId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editUpdateSubsequent, setEditUpdateSubsequent] = useState(true)
  const [editNotes, setEditNotes] = useState('')
  const [editTags, setEditTags] = useState('')

  const handleStartEdit = (tx: any) => {
    setEditingTransaction(tx)
    setEditDescription(tx.description)
    setEditAmount(String(tx.amount))
    setEditCategory(tx.category)
    setEditPaymentMethod(tx.paymentMethod)
    setEditCardId(tx.cardId || '')
    setEditDate(tx.date)
    setEditNotes(tx.notes || '')
    setEditTags(tx.tags ? tx.tags.join(', ') : '')
    setEditUpdateSubsequent(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransaction) return

    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const updates: any = {
      description: editDescription,
      amount: parseFloat(editAmount),
      category: editCategory,
      paymentMethod: editPaymentMethod,
      cardId: editPaymentMethod === 'credit_card' ? editCardId : undefined,
      date: editDate,
      competencyMonth: editDate.slice(0, 7),
      notes: editNotes || undefined,
      tags: parsedTags,
    }

    await updateTransaction(editingTransaction.id, updates, editUpdateSubsequent)
    setEditingTransaction(null)
  }
  
  const ITEMS_PER_PAGE = 10
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  
  const filteredTransactions = useMemo(() => {
    let result = filterTransactions(db.transactions, {
      search: search || undefined,
      type: typeFilter as 'expense' | 'income' | undefined,
      category: categoryFilter || undefined,
      paymentMethod: paymentFilter || undefined,
    })

    if (startDateFilter) {
      result = result.filter((t) => t.date >= startDateFilter)
    }
    if (endDateFilter) {
      result = result.filter((t) => t.date <= endDateFilter)
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [db.transactions, search, typeFilter, categoryFilter, paymentFilter, startDateFilter, endDateFilter])
  
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
  const activePage = Math.min(currentPage, Math.max(1, totalPages))
  
  const paginatedTransactions = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTransactions, activePage])
  
  const clearFilters = () => {
    setSearch('')
    setTypeFilter('')
    setCategoryFilter('')
    setPaymentFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setCurrentPage(1)
  }
  
  const hasActiveFilters = 
    search || 
    typeFilter || 
    categoryFilter || 
    paymentFilter || 
    startDateFilter || 
    endDateFilter
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - activePage) <= 1) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }
  
  return (
    <>
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
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
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
          <div className="space-y-4 pt-4 border-t mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesas</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val)
                  setCurrentPage(1)
                }}
              >
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
              
              <Select
                value={paymentFilter}
                onValueChange={(val) => {
                  setPaymentFilter(val)
                  setCurrentPage(1)
                }}
              >
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                  Data de Início (De)
                </label>
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                  Data Limite (Até)
                </label>
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full"
                />
              </div>
            </div>
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
          <div className="space-y-4">
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
                  {paginatedTransactions.map((transaction) => (
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
                      <TableCell className="flex items-center justify-end gap-1">
                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleStartEdit(transaction)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete Button */}
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
            
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40 pt-4">
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  Mostrando <span className="font-semibold text-foreground">{(activePage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                  <span className="font-semibold text-foreground">
                    {Math.min(activePage * ITEMS_PER_PAGE, filteredTransactions.length)}
                  </span>{' '}
                  de <span className="font-semibold text-foreground">{filteredTransactions.length}</span> transações
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={activePage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {getPageNumbers().map((pageNum, idx) => {
                    if (typeof pageNum === 'string') {
                      return (
                        <span key={`ellipse-${idx}`} className="text-muted-foreground text-xs px-1 select-none">
                          {pageNum}
                        </span>
                      )
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={activePage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={activePage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
      {/* Modal de Edição */}
      {editingTransaction && (
        <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição *</Label>
                <Input
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ex: Mercado, Uber..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Valor *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-date">Data *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria *</Label>
                <Select value={editCategory} onValueChange={setEditCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingTransaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-paymentMethod">Método *</Label>
                  <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editPaymentMethod === 'credit_card' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-cardId">Cartão *</Label>
                    <Select value={editCardId} onValueChange={setEditCardId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cartão" />
                      </SelectTrigger>
                      <SelectContent>
                        {db.cards.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="edit-tags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="alimentacao, essencial, lazer..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Observações</Label>
                <Input
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Alguma anotação sobre esta transação..."
                />
              </div>

              {editingTransaction.isRecurring && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-violet-500/20 bg-violet-500/5">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-violet-300">Atualizar futuras recorrências?</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Atualizar automaticamente todas as despesas subsequentes desta série recorrente.
                    </p>
                  </div>
                  <Switch
                    checked={editUpdateSubsequent}
                    onCheckedChange={setEditUpdateSubsequent}
                  />
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingTransaction(null)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
