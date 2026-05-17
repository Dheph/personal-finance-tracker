'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { FinanceDatabase, Transaction, Card, DEFAULT_DATABASE } from '@/lib/finance-types'
import {
  loadDatabase,
  saveDatabase as saveToStorage,
  exportDatabase as exportToFile,
  importDatabase as importFromFile,
  addTransaction as addTransactionToDb,
  addInstallmentTransactions as addInstallmentsToDb,
  updateTransaction as updateTransactionInDb,
  deleteTransaction as deleteTransactionFromDb,
  addCard as addCardToDb,
  updateCard as updateCardInDb,
  deleteCard as deleteCardFromDb,
} from '@/lib/storage'

interface FinanceContextType {
  db: FinanceDatabase
  isLoading: boolean
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void
  addInstallmentTransactions: (
    baseTransaction: Omit<Transaction, 'id' | 'createdAt' | 'installments'>,
    totalInstallments: number
  ) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addCard: (card: Omit<Card, 'id'>) => void
  updateCard: (id: string, updates: Partial<Card>) => void
  deleteCard: (id: string) => void
  exportDatabase: () => void
  importDatabase: (file: File) => Promise<void>
  refreshDatabase: () => void
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<FinanceDatabase>(DEFAULT_DATABASE)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const data = loadDatabase()
    setDb(data)
    setIsLoading(false)
  }, [])
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const updated = addTransactionToDb(db, transaction)
    setDb(updated)
  }
  
  const addInstallmentTransactions = (
    baseTransaction: Omit<Transaction, 'id' | 'createdAt' | 'installments'>,
    totalInstallments: number
  ) => {
    const updated = addInstallmentsToDb(db, baseTransaction, totalInstallments)
    setDb(updated)
  }
  
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const updated = updateTransactionInDb(db, id, updates)
    setDb(updated)
  }
  
  const deleteTransaction = (id: string) => {
    const updated = deleteTransactionFromDb(db, id)
    setDb(updated)
  }
  
  const addCard = (card: Omit<Card, 'id'>) => {
    const updated = addCardToDb(db, card)
    setDb(updated)
  }
  
  const updateCard = (id: string, updates: Partial<Card>) => {
    const updated = updateCardInDb(db, id, updates)
    setDb(updated)
  }
  
  const deleteCard = (id: string) => {
    const updated = deleteCardFromDb(db, id)
    setDb(updated)
  }
  
  const exportDatabase = () => {
    exportToFile(db)
  }
  
  const importDatabase = async (file: File) => {
    const imported = await importFromFile(file)
    setDb(imported)
  }
  
  const refreshDatabase = () => {
    const data = loadDatabase()
    setDb(data)
  }
  
  return (
    <FinanceContext.Provider
      value={{
        db,
        isLoading,
        addTransaction,
        addInstallmentTransactions,
        updateTransaction,
        deleteTransaction,
        addCard,
        updateCard,
        deleteCard,
        exportDatabase,
        importDatabase,
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
