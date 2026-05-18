'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { 
  FinanceDatabase, 
  Transaction, 
  Card, 
  Loan,
  LoanPayment,
  PayoffPlan,
  DEFAULT_DATABASE,
  Asset,
  Liability,
  SinkingFund,
  AnnualExpense,
  Financing,
  FinancingInstallment
} from '@/lib/finance-types'
import {
  loadDatabase,
  saveDatabase as saveToStorage,
  exportDatabase as exportToFile,
  importDatabase as importFromFile,
} from '@/lib/storage'
import {
  subscribeToTransactions,
  subscribeToCards,
  subscribeToLoans,
  subscribeToLoanPayments,
  subscribeToPayoffPlans,
  saveTransaction,
  updateFirestoreTransaction,
  deleteFirestoreTransaction,
  saveCard,
  updateFirestoreCard,
  deleteFirestoreCard,
  saveLoan,
  updateFirestoreLoan,
  deleteFirestoreLoan,
  saveLoanPayment,
  savePayoffPlan,
  updateFirestorePayoffPlan,
  deleteFirestorePayoffPlan,
  enableOfflinePersistence,
  syncLocalToFirestore,
  subscribeToAssets,
  saveAsset,
  deleteFirestoreAsset,
  subscribeToLiabilities,
  saveLiability,
  deleteFirestoreLiability,
  subscribeToSinkingFunds,
  saveSinkingFund,
  deleteFirestoreSinkingFund,
  subscribeToAnnualExpenses,
  saveAnnualExpense,
  deleteFirestoreAnnualExpense,
  subscribeToFinancings,
  saveFinancing,
  updateFirestoreFinancing,
  deleteFirestoreFinancing,
  subscribeToFinancingInstallments,
  saveFinancingInstallment,
  updateFirestoreFinancingInstallment,
  deleteFirestoreFinancingInstallment,
} from '@/lib/firestore'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from './auth-context'
import { v4 as uuidv4 } from 'uuid'
import { runFinancialIntelligenceEngine, FinancialIntelligenceResult } from '@/lib/engine/core'
import { EconomicIndexers, fetchEconomicRates, DEFAULT_RATES } from '@/lib/engine/economic-rates'
import { generateProjectedInstallments, calculateNextInstallmentPrediction } from '@/lib/engine/financing-calculations'

interface FinanceContextType {
  db: FinanceDatabase
  isLoading: boolean
  isSyncing: boolean
  isCloudEnabled: boolean
  engineResult: FinancialIntelligenceResult | null
  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>
  addInstallmentTransactions: (
    baseTransaction: Omit<Transaction, 'id' | 'createdAt' | 'installments'>,
    totalInstallments: number
  ) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>, updateSubsequent?: boolean) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  // Cards
  addCard: (card: Omit<Card, 'id'>) => Promise<void>
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  // Loans
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateLoan: (id: string, updates: Partial<Loan>) => Promise<void>
  deleteLoan: (id: string) => Promise<void>
  recordLoanPayment: (payment: Omit<LoanPayment, 'id'>) => Promise<void>
  // Payoff Plans
  addPayoffPlan: (plan: Omit<PayoffPlan, 'id' | 'createdAt'>) => Promise<void>
  updatePayoffPlan: (id: string, updates: Partial<PayoffPlan>) => Promise<void>
  deletePayoffPlan: (id: string) => Promise<void>
  // Assets
  addAsset: (asset: Omit<Asset, 'id' | 'updatedAt'>) => Promise<void>
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  // Liabilities
  addLiability: (liability: Omit<Liability, 'id' | 'updatedAt'>) => Promise<void>
  updateLiability: (id: string, updates: Partial<Liability>) => Promise<void>
  deleteLiability: (id: string) => Promise<void>
  // Sinking Funds
  addSinkingFund: (fund: Omit<SinkingFund, 'id' | 'createdAt'>) => Promise<void>
  updateSinkingFund: (id: string, updates: Partial<SinkingFund>) => Promise<void>
  deleteSinkingFund: (id: string) => Promise<void>
  // Annual Expenses
  addAnnualExpense: (expense: Omit<AnnualExpense, 'id'>) => Promise<void>
  updateAnnualExpense: (id: string, updates: Partial<AnnualExpense>) => Promise<void>
  deleteAnnualExpense: (id: string) => Promise<void>
  // Economic rates & Variable Financing
  economicRates: EconomicIndexers
  addFinancing: (financing: Omit<Financing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateFinancing: (id: string, updates: Partial<Financing>) => Promise<void>
  deleteFinancing: (id: string) => Promise<void>
  recordFinancingInstallmentPayment: (
    installmentId: string, 
    actualValue: number, 
    notes?: string
  ) => Promise<void>
  // Utilities
  exportDatabase: () => void
  importDatabase: (file: File) => Promise<void>
  syncToCloud: () => Promise<void>
  refreshDatabase: () => void
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [db, setDb] = useState<FinanceDatabase>(DEFAULT_DATABASE)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [engineResult, setEngineResult] = useState<FinancialIntelligenceResult | null>(null)
  const isCloudEnabled = isFirebaseConfigured() && !!user
  const [economicRates, setEconomicRates] = useState<EconomicIndexers>(DEFAULT_RATES)

  // Fetch indexer rates
  useEffect(() => {
    fetchEconomicRates().then(setEconomicRates)
  }, [])

  // Reactive Engine Calculation
  useEffect(() => {
    try {
      const result = runFinancialIntelligenceEngine(db, {
        assets: db.assets || [],
        liabilities: db.liabilities || [],
        sinkingFunds: db.sinkingFunds || [],
        annualExpenses: db.annualExpenses || [],
        customBudgets: db.customBudgets || [],
      })
      setEngineResult(result)
    } catch (e) {
      console.error('Erro ao executar Financial Intelligence Engine:', e)
    }
  }, [db])

  // Initial load from localStorage
  useEffect(() => {
    const data = loadDatabase()
    setDb(data)
    setIsLoading(false)
  }, [])

  // Enable offline persistence
  useEffect(() => {
    if (isFirebaseConfigured()) {
      enableOfflinePersistence()
    }
  }, [])

  // Subscribe to Firestore when authenticated
  useEffect(() => {
    if (!user || !isFirebaseConfigured()) return

    const unsubscribers: (() => void)[] = []

    // Subscribe to transactions
    unsubscribers.push(
      subscribeToTransactions(user.uid, (transactions) => {
        setDb(prev => {
          const updated = { ...prev, transactions }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to cards
    unsubscribers.push(
      subscribeToCards(user.uid, (cards) => {
        setDb(prev => {
          const updated = { ...prev, cards: cards.length > 0 ? cards : prev.cards }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to loans
    unsubscribers.push(
      subscribeToLoans(user.uid, (loans) => {
        setDb(prev => {
          const updated = { ...prev, loans }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to loan payments
    unsubscribers.push(
      subscribeToLoanPayments(user.uid, (loanPayments) => {
        setDb(prev => {
          const updated = { ...prev, loanPayments }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to payoff plans
    unsubscribers.push(
      subscribeToPayoffPlans(user.uid, (payoffPlans) => {
        setDb(prev => {
          const updated = { ...prev, payoffPlans }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to assets
    unsubscribers.push(
      subscribeToAssets(user.uid, (assets) => {
        setDb(prev => {
          const updated = { ...prev, assets }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to liabilities
    unsubscribers.push(
      subscribeToLiabilities(user.uid, (liabilities) => {
        setDb(prev => {
          const updated = { ...prev, liabilities }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to sinking funds
    unsubscribers.push(
      subscribeToSinkingFunds(user.uid, (sinkingFunds) => {
        setDb(prev => {
          const updated = { ...prev, sinkingFunds }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to annual expenses
    unsubscribers.push(
      subscribeToAnnualExpenses(user.uid, (annualExpenses) => {
        setDb(prev => {
          const updated = { ...prev, annualExpenses }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to financings
    unsubscribers.push(
      subscribeToFinancings(user.uid, (financings) => {
        setDb(prev => {
          const updated = { ...prev, financings }
          saveToStorage(updated)
          return updated
        })
      })
    )

    // Subscribe to financing installments
    unsubscribers.push(
      subscribeToFinancingInstallments(user.uid, (financingInstallments) => {
        setDb(prev => {
          const updated = { ...prev, financingInstallments }
          saveToStorage(updated)
          return updated
        })
      })
    )

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [user])

  // Transactions
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const transactionsToCreate: Transaction[] = []

    if (transaction.isRecurring) {
      const startYear = parseInt(transaction.date.substring(0, 4))
      const startMonth = parseInt(transaction.date.substring(5, 7)) - 1
      const startDay = parseInt(transaction.date.substring(8, 10))

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()

      let loopYear = startYear
      let loopMonth = startMonth

      while (loopYear < currentYear || (loopYear === currentYear && loopMonth <= currentMonth)) {
        const daysInMonth = new Date(loopYear, loopMonth + 1, 0).getDate()
        const targetDay = Math.min(startDay, daysInMonth)
        const formattedMonthStr = String(loopMonth + 1).padStart(2, '0')
        const formattedDayStr = String(targetDay).padStart(2, '0')
        const dateStr = `${loopYear}-${formattedMonthStr}-${formattedDayStr}`
        const competencyMonth = `${loopYear}-${formattedMonthStr}`

        transactionsToCreate.push({
          ...transaction,
          id: uuidv4(),
          date: dateStr,
          competencyMonth,
          createdAt: new Date().toISOString(),
        })

        loopMonth++
        if (loopMonth > 11) {
          loopMonth = 0
          loopYear++
        }
      }

      if (transactionsToCreate.length === 0) {
        transactionsToCreate.push({
          ...transaction,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        })
      }
    } else {
      transactionsToCreate.push({
        ...transaction,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      })
    }

    // Update local state immediately
    setDb(prev => {
      const updated = {
        ...prev,
        transactions: [...transactionsToCreate, ...prev.transactions],
      }
      saveToStorage(updated)
      return updated
    })

    // Sync to cloud if enabled
    if (isCloudEnabled && user) {
      for (const t of transactionsToCreate) {
        await saveTransaction(user.uid, t)
      }
    }
  }, [isCloudEnabled, user])

  const addInstallmentTransactions = useCallback(async (
    baseTransaction: Omit<Transaction, 'id' | 'createdAt' | 'installments'>,
    totalInstallments: number
  ) => {
    const transactions: Transaction[] = []
    const baseDate = new Date(baseTransaction.date)
    const installmentAmount = baseTransaction.amount / totalInstallments

    for (let i = 0; i < totalInstallments; i++) {
      const installmentDate = new Date(baseDate)
      installmentDate.setMonth(installmentDate.getMonth() + i)

      const competencyMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`

      transactions.push({
        ...baseTransaction,
        id: uuidv4(),
        amount: installmentAmount,
        date: installmentDate.toISOString().split('T')[0],
        competencyMonth,
        description: `${baseTransaction.description} (${i + 1}/${totalInstallments})`,
        installments: {
          current: i + 1,
          total: totalInstallments,
        },
        createdAt: new Date().toISOString(),
      })
    }

    // Update local state
    setDb(prev => {
      const updated = {
        ...prev,
        transactions: [...transactions, ...prev.transactions],
      }
      saveToStorage(updated)
      return updated
    })

    // Sync to cloud
    if (isCloudEnabled && user) {
      for (const t of transactions) {
        await saveTransaction(user.uid, t)
      }
    }
  }, [isCloudEnabled, user])

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>, updateSubsequent: boolean = false) => {
    let affectedIds: string[] = [id]
    let subsequentUpdatesMap: { [key: string]: Partial<Transaction> } = {}

    setDb(prev => {
      const originalTx = prev.transactions.find(t => t.id === id)
      if (!originalTx) return prev

      let updatedTransactions = prev.transactions.map(t => {
        if (t.id === id) {
          return { ...t, ...updates }
        }
        return t
      })

      if (updateSubsequent && originalTx.isRecurring) {
        const originalDesc = originalTx.description.toLowerCase().trim()
        const originalType = originalTx.type
        const originalDateStr = originalTx.date

        let dayChanged = false
        let targetDay = 0
        if (updates.date && updates.date !== originalDateStr) {
          const origDate = new Date(originalDateStr)
          const newDate = new Date(updates.date)
          dayChanged = origDate.getDate() !== newDate.getDate()
          targetDay = newDate.getDate()
        }

        updatedTransactions = updatedTransactions.map(t => {
          if (t.id === id) return t // already updated

          const isSubsequent = t.isRecurring &&
                              t.type === originalType &&
                              t.description.toLowerCase().trim() === originalDesc &&
                              t.date >= originalDateStr

          if (isSubsequent) {
            affectedIds.push(t.id)
            let newDateStr = t.date
            if (dayChanged && updates.date) {
              const parts = t.date.split('-')
              const year = parseInt(parts[0])
              const month = parseInt(parts[1]) - 1
              const daysInMonth = new Date(year, month + 1, 0).getDate()
              const finalDay = Math.min(targetDay, daysInMonth)
              const formattedMonth = String(month + 1).padStart(2, '0')
              const formattedDay = String(finalDay).padStart(2, '0')
              newDateStr = `${year}-${formattedMonth}-${formattedDay}`
            }

            const subsequentUpdates = { ...updates }
            if (updates.date) {
              subsequentUpdates.date = newDateStr
              subsequentUpdates.competencyMonth = newDateStr.slice(0, 7)
            }

            subsequentUpdatesMap[t.id] = subsequentUpdates
            return { ...t, ...subsequentUpdates }
          }

          return t
        })
      }

      const updated = {
        ...prev,
        transactions: updatedTransactions,
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      for (const affectedId of affectedIds) {
        const txUpdates = affectedId === id ? updates : subsequentUpdatesMap[affectedId]
        if (txUpdates) {
          await updateFirestoreTransaction(user.uid, affectedId, txUpdates)
        }
      }
    }
  }, [isCloudEnabled, user])

  const deleteTransaction = useCallback(async (id: string) => {
    setDb(prev => {
      const updated = {
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await deleteFirestoreTransaction(user.uid, id)
    }
  }, [isCloudEnabled, user])

  // Cards
  const addCard = useCallback(async (card: Omit<Card, 'id'>) => {
    const newCard: Card = {
      ...card,
      id: uuidv4(),
    }

    setDb(prev => {
      const updated = {
        ...prev,
        cards: [...prev.cards, newCard],
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await saveCard(user.uid, newCard)
    }
  }, [isCloudEnabled, user])

  const updateCard = useCallback(async (id: string, updates: Partial<Card>) => {
    setDb(prev => {
      const updated = {
        ...prev,
        cards: prev.cards.map(c => c.id === id ? { ...c, ...updates } : c),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await updateFirestoreCard(user.uid, id, updates)
    }
  }, [isCloudEnabled, user])

  const deleteCard = useCallback(async (id: string) => {
    setDb(prev => {
      const updated = {
        ...prev,
        cards: prev.cards.filter(c => c.id !== id),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await deleteFirestoreCard(user.uid, id)
    }
  }, [isCloudEnabled, user])

  // Loans
  const addLoan = useCallback(async (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newLoan: Loan = {
      ...loan,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }

    setDb(prev => {
      const updated = {
        ...prev,
        loans: [...prev.loans, newLoan],
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await saveLoan(user.uid, newLoan)
    }
  }, [isCloudEnabled, user])

  const updateLoan = useCallback(async (id: string, updates: Partial<Loan>) => {
    setDb(prev => {
      const updated = {
        ...prev,
        loans: prev.loans.map(l => 
          l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
        ),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await updateFirestoreLoan(user.uid, id, updates)
    }
  }, [isCloudEnabled, user])

  const deleteLoan = useCallback(async (id: string) => {
    setDb(prev => {
      const updated = {
        ...prev,
        loans: prev.loans.filter(l => l.id !== id),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await deleteFirestoreLoan(user.uid, id)
    }
  }, [isCloudEnabled, user])

  const recordLoanPayment = useCallback(async (payment: Omit<LoanPayment, 'id'>) => {
    const newPayment: LoanPayment = {
      ...payment,
      id: uuidv4(),
    }

    // Update loan's remaining amount and paid installments
    const loan = db.loans.find(l => l.id === payment.loanId)
    if (loan) {
      const newRemainingAmount = Math.max(0, loan.remainingAmount - payment.amount)
      const newPaidInstallments = loan.paidInstallments + 1
      const newStatus = newRemainingAmount === 0 ? 'paid_off' : loan.status

      await updateLoan(loan.id, {
        remainingAmount: newRemainingAmount,
        paidInstallments: newPaidInstallments,
        status: newStatus,
      })
    }

    setDb(prev => {
      const updated = {
        ...prev,
        loanPayments: [newPayment, ...prev.loanPayments],
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await saveLoanPayment(user.uid, newPayment)
    }
  }, [isCloudEnabled, user, db.loans, updateLoan])

  // Payoff Plans
  const addPayoffPlan = useCallback(async (plan: Omit<PayoffPlan, 'id' | 'createdAt'>) => {
    const newPlan: PayoffPlan = {
      ...plan,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }

    setDb(prev => {
      const updated = {
        ...prev,
        payoffPlans: [...prev.payoffPlans, newPlan],
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await savePayoffPlan(user.uid, newPlan)
    }
  }, [isCloudEnabled, user])

  const updatePayoffPlan = useCallback(async (id: string, updates: Partial<PayoffPlan>) => {
    setDb(prev => {
      const updated = {
        ...prev,
        payoffPlans: prev.payoffPlans.map(p => p.id === id ? { ...p, ...updates } : p),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await updateFirestorePayoffPlan(user.uid, id, updates)
    }
  }, [isCloudEnabled, user])

  const deletePayoffPlan = useCallback(async (id: string) => {
    setDb(prev => {
      const updated = {
        ...prev,
        payoffPlans: prev.payoffPlans.filter(p => p.id !== id),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await deleteFirestorePayoffPlan(user.uid, id)
    }
  }, [isCloudEnabled, user])

  // Assets
  const addAsset = useCallback(async (asset: Omit<Asset, 'id' | 'updatedAt'>) => {
    const newAsset: Asset = {
      ...asset,
      id: uuidv4(),
      updatedAt: new Date().toISOString(),
    }

    setDb(prev => {
      const updated = {
        ...prev,
        assets: [...(prev.assets || []), newAsset],
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await saveAsset(user.uid, newAsset)
    }
  }, [isCloudEnabled, user])

  const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    const updatedAsset = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    setDb(prev => {
      const updated = {
        ...prev,
        assets: (prev.assets || []).map(a => 
          a.id === id ? { ...a, ...updatedAsset } : a
        ),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      setDb(prev => {
        const found = prev.assets.find(a => a.id === id)
        if (found) {
          saveAsset(user.uid, found)
        }
        return prev
      })
    }
  }, [isCloudEnabled, user])

  const deleteAsset = useCallback(async (id: string) => {
    setDb(prev => {
      const updated = {
        ...prev,
        assets: (prev.assets || []).filter(a => a.id !== id),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await deleteFirestoreAsset(user.uid, id)
    }
  }, [isCloudEnabled, user])

  // Liabilities
  const addLiability = useCallback(async (liability: Omit<Liability, 'id' | 'updatedAt'>) => {
    const newLiability: Liability = {
      ...liability,
      id: uuidv4(),
      updatedAt: new Date().toISOString(),
    }

    setDb(prev => {
      const updated = {
        ...prev,
        liabilities: [...(prev.liabilities || []), newLiability],
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await saveLiability(user.uid, newLiability)
    }
  }, [isCloudEnabled, user])

  const updateLiability = useCallback(async (id: string, updates: Partial<Liability>) => {
    const updatedLiability = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    setDb(prev => {
      const updated = {
        ...prev,
        liabilities: (prev.liabilities || []).map(l => 
          l.id === id ? { ...l, ...updatedLiability } : l
        ),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      setDb(prev => {
        const found = prev.liabilities.find(l => l.id === id)
        if (found) {
          saveLiability(user.uid, found)
        }
        return prev
      })
    }
  }, [isCloudEnabled, user])

  const deleteLiability = useCallback(async (id: string) => {
    setDb(prev => {
      const updated = {
        ...prev,
        liabilities: (prev.liabilities || []).filter(l => l.id !== id),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await deleteFirestoreLiability(user.uid, id)
    }
  }, [isCloudEnabled, user])

  // Sinking Funds
  const addSinkingFund = useCallback(async (fund: Omit<SinkingFund, 'id' | 'createdAt'>) => {
    const newFund: SinkingFund = {
      ...fund,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }

    setDb(prev => {
      const updated = {
        ...prev,
        sinkingFunds: [...(prev.sinkingFunds || []), newFund],
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await saveSinkingFund(user.uid, newFund)
    }
  }, [isCloudEnabled, user])

  const updateSinkingFund = useCallback(async (id: string, updates: Partial<SinkingFund>) => {
    setDb(prev => {
      const updated = {
        ...prev,
        sinkingFunds: (prev.sinkingFunds || []).map(f => 
          f.id === id ? { ...f, ...updates } : f
        ),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      setDb(prev => {
        const found = prev.sinkingFunds.find(f => f.id === id)
        if (found) {
          saveSinkingFund(user.uid, found)
        }
        return prev
      })
    }
  }, [isCloudEnabled, user])

  const deleteSinkingFund = useCallback(async (id: string) => {
    setDb(prev => {
      const updated = {
        ...prev,
        sinkingFunds: (prev.sinkingFunds || []).filter(f => f.id !== id),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await deleteFirestoreSinkingFund(user.uid, id)
    }
  }, [isCloudEnabled, user])

  // Annual Expenses
  const addAnnualExpense = useCallback(async (expense: Omit<AnnualExpense, 'id'>) => {
    const newExpense: AnnualExpense = {
      ...expense,
      id: uuidv4(),
    }

    setDb(prev => {
      const updated = {
        ...prev,
        annualExpenses: [...(prev.annualExpenses || []), newExpense],
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await saveAnnualExpense(user.uid, newExpense)
    }
  }, [isCloudEnabled, user])

  const updateAnnualExpense = useCallback(async (id: string, updates: Partial<AnnualExpense>) => {
    setDb(prev => {
      const updated = {
        ...prev,
        annualExpenses: (prev.annualExpenses || []).map(e => 
          e.id === id ? { ...e, ...updates } : e
        ),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      setDb(prev => {
        const found = prev.annualExpenses.find(e => e.id === id)
        if (found) {
          saveAnnualExpense(user.uid, found)
        }
        return prev
      })
    }
  }, [isCloudEnabled, user])

  const deleteAnnualExpense = useCallback(async (id: string) => {
    setDb(prev => {
      const updated = {
        ...prev,
        annualExpenses: (prev.annualExpenses || []).filter(e => e.id !== id),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await deleteFirestoreAnnualExpense(user.uid, id)
    }
  }, [isCloudEnabled, user])

  // Utilities
  const exportDatabase = () => {
    exportToFile(db)
  }

  const importDatabase = async (file: File) => {
    const imported = await importFromFile(file)
    setDb(imported)
  }

  const syncToCloud = useCallback(async () => {
    if (!isCloudEnabled || !user) return

    setIsSyncing(true)
    try {
      await syncLocalToFirestore(
        user.uid,
        db.transactions,
        db.cards,
        db.loans,
        db.settings,
        db.assets || [],
        db.liabilities || [],
        db.sinkingFunds || [],
        db.annualExpenses || [],
        db.financings || [],
        db.financingInstallments || []
      )
    } finally {
      setIsSyncing(false)
    }
  }, [isCloudEnabled, user, db])

  const refreshDatabase = () => {
    const data = loadDatabase()
    setDb(data)
  }

  // Variable Financing Methods
  const addFinancing = useCallback(async (financingData: Omit<Financing, 'id' | 'createdAt' | 'updatedAt'>) => {
    const financingId = uuidv4()
    const nowStr = new Date().toISOString()

    const newFinancingBase: Financing = {
      ...financingData,
      id: financingId,
      createdAt: nowStr,
      updatedAt: nowStr
    }

    // Gerar parcelas projetadas
    const projected = generateProjectedInstallments(newFinancingBase, economicRates)
    const installments: FinancingInstallment[] = projected.map((inst) => ({
      ...inst,
      id: uuidv4(),
      createdAt: nowStr
    }))

    // Calcular primeira previsão e tendência da próxima parcela
    const { predictedValue } = calculateNextInstallmentPrediction(newFinancingBase, installments, economicRates)
    
    const finalFinancing: Financing = {
      ...newFinancingBase,
      nextInstallmentPrediction: predictedValue,
      lastInstallmentValue: installments.find(i => i.paid)?.actualValue
    }

    // Atualizar base de dados
    setDb(prev => {
      const updated = {
        ...prev,
        financings: [...(prev.financings || []), finalFinancing],
        financingInstallments: [...(prev.financingInstallments || []), ...installments]
      }
      saveToStorage(updated)
      return updated
    })

    // Sincronizar com Firestore se logado
    if (isCloudEnabled && user) {
      await saveFinancing(user.uid, finalFinancing)
      for (const inst of installments) {
        await saveFinancingInstallment(user.uid, inst)
      }
    }
  }, [isCloudEnabled, user, economicRates])

  const updateFinancing = useCallback(async (id: string, updates: Partial<Financing>) => {
    const nowStr = new Date().toISOString()

    setDb(prev => {
      const current = (prev.financings || []).find(f => f.id === id)
      if (!current) return prev

      const updatedFinancingBase: Financing = {
        ...current,
        ...updates,
        updatedAt: nowStr
      }

      // Se alterou parâmetros cruciais de cálculo, recalculamos parcelas futuras
      let updatedInstallments = [...(prev.financingInstallments || [])]
      const needsRecalculation = 
        updates.principalAmount !== undefined ||
        updates.annualInterestRate !== undefined ||
        updates.totalInstallments !== undefined ||
        updates.indexer !== undefined ||
        updates.calculationModel !== undefined ||
        updates.paidInstallments !== undefined

      if (needsRecalculation) {
        // Filtramos as parcelas desse financiamento
        const nonThisFinancing = updatedInstallments.filter(i => i.financingId !== id)
        
        // Geramos novas
        const projected = generateProjectedInstallments(updatedFinancingBase, economicRates)
        const newInsts: FinancingInstallment[] = projected.map(inst => ({
          ...inst,
          id: uuidv4(),
          createdAt: nowStr
        }))
        
        updatedInstallments = [...nonThisFinancing, ...newInsts]
      }

      // Calcular previsão e tendência atualizadas
      const financingInsts = updatedInstallments.filter(i => i.financingId === id)
      const { predictedValue } = calculateNextInstallmentPrediction(updatedFinancingBase, financingInsts, economicRates)
      
      const finalFinancing: Financing = {
        ...updatedFinancingBase,
        nextInstallmentPrediction: predictedValue,
        lastInstallmentValue: financingInsts.find(i => i.paid)?.actualValue
      }

      const updatedDb = {
        ...prev,
        financings: (prev.financings || []).map(f => f.id === id ? finalFinancing : f),
        financingInstallments: updatedInstallments
      }
      saveToStorage(updatedDb)

      // Atualizar no Firestore
      if (isCloudEnabled && user) {
        saveFinancing(user.uid, finalFinancing)
        if (needsRecalculation) {
          const oldThisFinancing = (prev.financingInstallments || []).filter(i => i.financingId === id)
          for (const oldInst of oldThisFinancing) {
            deleteFirestoreFinancingInstallment(user.uid, oldInst.id)
          }
          const newThisFinancing = updatedInstallments.filter(i => i.financingId === id)
          for (const newInst of newThisFinancing) {
            saveFinancingInstallment(user.uid, newInst)
          }
        }
      }

      return updatedDb
    })
  }, [isCloudEnabled, user, economicRates])

  const deleteFinancing = useCallback(async (id: string) => {
    setDb(prev => {
      const updatedDb = {
        ...prev,
        financings: (prev.financings || []).filter(f => f.id !== id),
        financingInstallments: (prev.financingInstallments || []).filter(i => i.financingId !== id)
      }
      saveToStorage(updatedDb)

      if (isCloudEnabled && user) {
        deleteFirestoreFinancing(user.uid, id)
        const oldThisFinancing = (prev.financingInstallments || []).filter(i => i.financingId === id)
        for (const oldInst of oldThisFinancing) {
          deleteFirestoreFinancingInstallment(user.uid, oldInst.id)
        }
      }

      return updatedDb
    })
  }, [isCloudEnabled, user])

  const recordFinancingInstallmentPayment = useCallback(async (
    installmentId: string, 
    actualValue: number, 
    notes?: string
  ) => {
    const nowStr = new Date().toISOString()

    setDb(prev => {
      const inst = (prev.financingInstallments || []).find(i => i.id === installmentId)
      if (!inst) return prev

      const financing = (prev.financings || []).find(f => f.id === inst.financingId)
      if (!financing) return prev

      // 1. Atualizar a parcela como paga
      const updatedInst: FinancingInstallment = {
        ...inst,
        paid: true,
        actualValue,
        notes
      }

      const updatedInstallments = (prev.financingInstallments || []).map(i => 
        i.id === installmentId ? updatedInst : i
      )

      // 2. Incrementar parcelas pagas no financiamento
      const newPaidInstallments = Math.min(financing.totalInstallments, financing.paidInstallments + 1)
      
      const totalAnnualRate = financing.annualInterestRate + (economicRates[financing.indexer] || 0)
      const monthlyRate = totalAnnualRate / 100 / 12
      const interestEstimated = financing.currentBalance * monthlyRate
      const principalAmortization = Math.max(0, actualValue - interestEstimated)
      const newBalance = Math.max(0, financing.currentBalance - principalAmortization)

      const updatedFinancingBase: Financing = {
        ...financing,
        paidInstallments: newPaidInstallments,
        currentBalance: newBalance,
        lastInstallmentValue: actualValue,
        updatedAt: nowStr
      }

      // Calcular nova previsão e tendência
      const financingInsts = updatedInstallments.filter(i => i.financingId === financing.id)
      const { predictedValue } = calculateNextInstallmentPrediction(updatedFinancingBase, financingInsts, economicRates)

      const finalFinancing: Financing = {
        ...updatedFinancingBase,
        nextInstallmentPrediction: predictedValue
      }

      const category = 
        financing.type === 'house' ? 'moradia' :
        financing.type === 'vehicle' ? 'transporte' : 'moradia'
      
      const newTransaction: Transaction = {
        id: uuidv4(),
        description: `Parcela ${inst.installmentNumber}/${financing.totalInstallments} - ${financing.title}`,
        amount: actualValue,
        type: 'expense',
        category,
        date: inst.dueDate,
        isRecurring: false,
        createdAt: nowStr
      }

      const updatedDb = {
        ...prev,
        transactions: [...prev.transactions, newTransaction],
        financings: (prev.financings || []).map(f => f.id === financing.id ? finalFinancing : f),
        financingInstallments: updatedInstallments
      }
      saveToStorage(updatedDb)

      if (isCloudEnabled && user) {
        saveFinancingInstallment(user.uid, updatedInst)
        saveFinancing(user.uid, finalFinancing)
        saveTransaction(user.uid, newTransaction)
      }

      return updatedDb
    })
  }, [isCloudEnabled, user, economicRates])

  return (
    <FinanceContext.Provider
      value={{
        db,
        isLoading,
        isSyncing,
        isCloudEnabled,
        engineResult,
        addTransaction,
        addInstallmentTransactions,
        updateTransaction,
        deleteTransaction,
        addCard,
        updateCard,
        deleteCard,
        addLoan,
        updateLoan,
        deleteLoan,
        recordLoanPayment,
        addPayoffPlan,
        updatePayoffPlan,
        deletePayoffPlan,
        addAsset,
        updateAsset,
        deleteAsset,
        addLiability,
        updateLiability,
        deleteLiability,
        addSinkingFund,
        updateSinkingFund,
        deleteSinkingFund,
        addAnnualExpense,
        updateAnnualExpense,
        deleteAnnualExpense,
        economicRates,
        addFinancing,
        updateFinancing,
        deleteFinancing,
        recordFinancingInstallmentPayment,
        exportDatabase,
        importDatabase,
        syncToCloud,
        refreshDatabase,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}
