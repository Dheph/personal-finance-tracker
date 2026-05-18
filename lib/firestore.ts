'use client'

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  enableIndexedDbPersistence,
  writeBatch,
} from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from './firebase'
import { 
  Transaction, 
  Card, 
  Loan, 
  LoanPayment, 
  PayoffPlan,
  Settings,
  DEFAULT_DATABASE,
  Asset,
  Liability
} from './finance-types'

// Helper para remover valores undefined (Firestore não aceita undefined)
function removeUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

let persistenceEnabled = false

export async function enableOfflinePersistence() {
  if (!isFirebaseConfigured() || persistenceEnabled) return
  
  try {
    const db = getFirebaseDb()
    await enableIndexedDbPersistence(db)
    persistenceEnabled = true
  } catch (err: unknown) {
    const error = err as { code?: string }
    if (error.code === 'failed-precondition') {
      console.warn('Persistência offline não disponível - múltiplas abas abertas')
    } else if (error.code === 'unimplemented') {
      console.warn('Persistência offline não suportada neste navegador')
    }
  }
}

// Collection paths
const getUserCollection = (userId: string, collectionName: string) => {
  const db = getFirebaseDb()
  return collection(db, 'users', userId, collectionName)
}

// Transactions
export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  if (!isFirebaseConfigured()) return DEFAULT_DATABASE.transactions
  
  const col = getUserCollection(userId, 'transactions')
  const q = query(col, orderBy('date', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
}

export function subscribeToTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    callback(DEFAULT_DATABASE.transactions)
    return () => {}
  }
  
  const col = getUserCollection(userId, 'transactions')
  const q = query(col, orderBy('date', 'desc'))
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Transaction))
    callback(transactions)
  })
}

export async function saveTransaction(userId: string, transaction: Transaction): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'transactions')
  const { id, ...data } = transaction
  await setDoc(doc(col, id), removeUndefined(data))
}

export async function updateFirestoreTransaction(
  userId: string, 
  id: string, 
  updates: Partial<Transaction>
): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'transactions')
  await updateDoc(doc(col, id), removeUndefined(updates))
}

export async function deleteFirestoreTransaction(userId: string, id: string): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'transactions')
  await deleteDoc(doc(col, id))
}

// Cards
export async function fetchCards(userId: string): Promise<Card[]> {
  if (!isFirebaseConfigured()) return DEFAULT_DATABASE.cards
  
  const col = getUserCollection(userId, 'cards')
  const snapshot = await getDocs(col)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Card))
}

export function subscribeToCards(
  userId: string,
  callback: (cards: Card[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    callback(DEFAULT_DATABASE.cards)
    return () => {}
  }
  
  const col = getUserCollection(userId, 'cards')
  
  return onSnapshot(col, (snapshot) => {
    const cards = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Card))
    callback(cards)
  })
}

export async function saveCard(userId: string, card: Card): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'cards')
  const { id, ...data } = card
  await setDoc(doc(col, id), removeUndefined(data))
}

export async function updateFirestoreCard(
  userId: string, 
  id: string, 
  updates: Partial<Card>
): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'cards')
  await updateDoc(doc(col, id), removeUndefined(updates))
}

export async function deleteFirestoreCard(userId: string, id: string): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'cards')
  await deleteDoc(doc(col, id))
}

// Loans
export async function fetchLoans(userId: string): Promise<Loan[]> {
  if (!isFirebaseConfigured()) return []
  
  const col = getUserCollection(userId, 'loans')
  const q = query(col, orderBy('nextDueDate', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan))
}

export function subscribeToLoans(
  userId: string,
  callback: (loans: Loan[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  
  const col = getUserCollection(userId, 'loans')
  const q = query(col, orderBy('nextDueDate', 'asc'))
  
  return onSnapshot(q, (snapshot) => {
    const loans = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Loan))
    callback(loans)
  })
}

export async function saveLoan(userId: string, loan: Loan): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'loans')
  const { id, ...data } = loan
  await setDoc(doc(col, id), removeUndefined(data))
}

export async function updateFirestoreLoan(
  userId: string, 
  id: string, 
  updates: Partial<Loan>
): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'loans')
  await updateDoc(doc(col, id), removeUndefined({ ...updates, updatedAt: new Date().toISOString() }))
}

export async function deleteFirestoreLoan(userId: string, id: string): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'loans')
  await deleteDoc(doc(col, id))
}

// Loan Payments
export async function fetchLoanPayments(userId: string, loanId?: string): Promise<LoanPayment[]> {
  if (!isFirebaseConfigured()) return []
  
  const col = getUserCollection(userId, 'loanPayments')
  const q = loanId 
    ? query(col, where('loanId', '==', loanId), orderBy('date', 'desc'))
    : query(col, orderBy('date', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanPayment))
}

export function subscribeToLoanPayments(
  userId: string,
  callback: (payments: LoanPayment[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  
  const col = getUserCollection(userId, 'loanPayments')
  const q = query(col, orderBy('date', 'desc'))
  
  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as LoanPayment))
    callback(payments)
  })
}

export async function saveLoanPayment(userId: string, payment: LoanPayment): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'loanPayments')
  const { id, ...data } = payment
  await setDoc(doc(col, id), removeUndefined(data))
}

// Payoff Plans
export async function fetchPayoffPlans(userId: string): Promise<PayoffPlan[]> {
  if (!isFirebaseConfigured()) return []
  
  const col = getUserCollection(userId, 'payoffPlans')
  const snapshot = await getDocs(col)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoffPlan))
}

export function subscribeToPayoffPlans(
  userId: string,
  callback: (plans: PayoffPlan[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  
  const col = getUserCollection(userId, 'payoffPlans')
  
  return onSnapshot(col, (snapshot) => {
    const plans = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as PayoffPlan))
    callback(plans)
  })
}

export async function savePayoffPlan(userId: string, plan: PayoffPlan): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'payoffPlans')
  const { id, ...data } = plan
  await setDoc(doc(col, id), removeUndefined(data))
}

export async function updateFirestorePayoffPlan(
  userId: string, 
  id: string, 
  updates: Partial<PayoffPlan>
): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'payoffPlans')
  await updateDoc(doc(col, id), removeUndefined(updates))
}

export async function deleteFirestorePayoffPlan(userId: string, id: string): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const col = getUserCollection(userId, 'payoffPlans')
  await deleteDoc(doc(col, id))
}

// Settings
export async function fetchSettings(userId: string): Promise<Settings> {
  if (!isFirebaseConfigured()) return DEFAULT_DATABASE.settings
  
  const db = getFirebaseDb()
  const docRef = doc(db, 'users', userId, 'settings', 'preferences')
  const snapshot = await getDocs(query(collection(db, 'users', userId, 'settings')))
  
  if (snapshot.empty) {
    return DEFAULT_DATABASE.settings
  }
  
  return snapshot.docs[0].data() as Settings
}

export async function saveSettings(userId: string, settings: Settings): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const db = getFirebaseDb()
  await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), removeUndefined(settings))
}

// Batch operations for initial sync
export async function syncLocalToFirestore(
  userId: string,
  transactions: Transaction[],
  cards: Card[],
  loans: Loan[],
  settings: Settings
): Promise<void> {
  if (!isFirebaseConfigured()) return
  
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  
  // Sync transactions
  for (const transaction of transactions) {
    const { id, ...data } = transaction
    const ref = doc(db, 'users', userId, 'transactions', id)
    batch.set(ref, removeUndefined(data))
  }
  
  // Sync cards
  for (const card of cards) {
    const { id, ...data } = card
    const ref = doc(db, 'users', userId, 'cards', id)
    batch.set(ref, removeUndefined(data))
  }
  
  // Sync loans
  for (const loan of loans) {
    const { id, ...data } = loan
    const ref = doc(db, 'users', userId, 'loans', id)
    batch.set(ref, removeUndefined(data))
  }
  
  // Sync settings
  const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
  batch.set(settingsRef, removeUndefined(settings))

  // Sync assets
  for (const asset of assets) {
    const { id, ...data } = asset
    const ref = doc(db, 'users', userId, 'assets', id)
    batch.set(ref, removeUndefined(data))
  }

  // Sync liabilities
  for (const liability of liabilities) {
    const { id, ...data } = liability
    const ref = doc(db, 'users', userId, 'liabilities', id)
    batch.set(ref, removeUndefined(data))
  }

  await batch.commit()
}

// Assets Firestore Bindings
export function subscribeToAssets(
  userId: string,
  callback: (assets: Asset[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  
  const col = getUserCollection(userId, 'assets')
  return onSnapshot(col, (snapshot) => {
    const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset))
    callback(assets)
  })
}

export async function saveAsset(userId: string, asset: Asset): Promise<void> {
  if (!isFirebaseConfigured()) return
  const col = getUserCollection(userId, 'assets')
  const { id, ...data } = asset
  await setDoc(doc(col, id), removeUndefined(data))
}

export async function deleteFirestoreAsset(userId: string, id: string): Promise<void> {
  if (!isFirebaseConfigured()) return
  const col = getUserCollection(userId, 'assets')
  await deleteDoc(doc(col, id))
}

// Liabilities Firestore Bindings
export function subscribeToLiabilities(
  userId: string,
  callback: (liabilities: Liability[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  
  const col = getUserCollection(userId, 'liabilities')
  return onSnapshot(col, (snapshot) => {
    const liabilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Liability))
    callback(liabilities)
  })
}

export async function saveLiability(userId: string, liability: Liability): Promise<void> {
  if (!isFirebaseConfigured()) return
  const col = getUserCollection(userId, 'liabilities')
  const { id, ...data } = liability
  await setDoc(doc(col, id), removeUndefined(data))
}

export async function deleteFirestoreLiability(userId: string, id: string): Promise<void> {
  if (!isFirebaseConfigured()) return
  const col = getUserCollection(userId, 'liabilities')
  await deleteDoc(doc(col, id))
}

