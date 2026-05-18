'use client'

import { FinanceDatabase, DEFAULT_DATABASE, Transaction, Card } from './finance-types'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'finance_tracker_db'

export function loadDatabase(): FinanceDatabase {
  if (typeof window === 'undefined') {
    return DEFAULT_DATABASE
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...DEFAULT_DATABASE,
        ...parsed,
        assets: parsed.assets || [],
        liabilities: parsed.liabilities || [],
        sinkingFunds: parsed.sinkingFunds || [],
        annualExpenses: parsed.annualExpenses || [],
        customBudgets: parsed.customBudgets || [],
      }
    }
  } catch (error) {
    console.error('Erro ao carregar banco de dados:', error)
  }
  
  return DEFAULT_DATABASE
}

export function saveDatabase(db: FinanceDatabase): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (error) {
    console.error('Erro ao salvar banco de dados:', error)
  }
}

export function exportDatabase(db: FinanceDatabase): void {
  const dataStr = JSON.stringify(db, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importDatabase(file: File): Promise<FinanceDatabase> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as FinanceDatabase
        if (!data.transactions || !data.cards || !data.settings) {
          reject(new Error('Arquivo inválido'))
          return
        }
        saveDatabase(data)
        resolve(data)
      } catch {
        reject(new Error('Erro ao processar arquivo'))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsText(file)
  })
}

export function addTransaction(
  db: FinanceDatabase,
  transaction: Omit<Transaction, 'id' | 'createdAt'>
): FinanceDatabase {
  const newTransaction: Transaction = {
    ...transaction,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
  
  const updatedDb = {
    ...db,
    transactions: [newTransaction, ...db.transactions],
  }
  
  saveDatabase(updatedDb)
  return updatedDb
}

export function addInstallmentTransactions(
  db: FinanceDatabase,
  baseTransaction: Omit<Transaction, 'id' | 'createdAt' | 'installments'>,
  totalInstallments: number
): FinanceDatabase {
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
  
  const updatedDb = {
    ...db,
    transactions: [...transactions, ...db.transactions],
  }
  
  saveDatabase(updatedDb)
  return updatedDb
}

export function updateTransaction(
  db: FinanceDatabase,
  id: string,
  updates: Partial<Transaction>
): FinanceDatabase {
  const updatedDb = {
    ...db,
    transactions: db.transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    ),
  }
  
  saveDatabase(updatedDb)
  return updatedDb
}

export function deleteTransaction(db: FinanceDatabase, id: string): FinanceDatabase {
  const updatedDb = {
    ...db,
    transactions: db.transactions.filter((t) => t.id !== id),
  }
  
  saveDatabase(updatedDb)
  return updatedDb
}

export function addCard(
  db: FinanceDatabase,
  card: Omit<Card, 'id'>
): FinanceDatabase {
  const newCard: Card = {
    ...card,
    id: uuidv4(),
  }
  
  const updatedDb = {
    ...db,
    cards: [...db.cards, newCard],
  }
  
  saveDatabase(updatedDb)
  return updatedDb
}

export function updateCard(
  db: FinanceDatabase,
  id: string,
  updates: Partial<Card>
): FinanceDatabase {
  const updatedDb = {
    ...db,
    cards: db.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  }
  
  saveDatabase(updatedDb)
  return updatedDb
}

export function deleteCard(db: FinanceDatabase, id: string): FinanceDatabase {
  const updatedDb = {
    ...db,
    cards: db.cards.filter((c) => c.id !== id),
  }
  
  saveDatabase(updatedDb)
  return updatedDb
}
