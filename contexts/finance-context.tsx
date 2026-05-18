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
  Liability
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
} from '@/lib/firestore'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from './auth-context'
import { v4 as uuidv4 } from 'uuid'
import { runFinancialIntelligenceEngine, FinancialIntelligenceResult } from '@/lib/engine/core'

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
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
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

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [user])

  // Transactions
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }

    // Update local state immediately
    setDb(prev => {
      const updated = {
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
      }
      saveToStorage(updated)
      return updated
    })

    // Sync to cloud if enabled
    if (isCloudEnabled && user) {
      await saveTransaction(user.uid, newTransaction)
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

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    setDb(prev => {
      const updated = {
        ...prev,
        transactions: prev.transactions.map(t => 
          t.id === id ? { ...t, ...updates } : t
        ),
      }
      saveToStorage(updated)
      return updated
    })

    if (isCloudEnabled && user) {
      await updateFirestoreTransaction(user.uid, id, updates)
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
        db.liabilities || []
      )
    } finally {
      setIsSyncing(false)
    }
  }, [isCloudEnabled, user, db])

  const refreshDatabase = () => {
    const data = loadDatabase()
    setDb(data)
  }

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
