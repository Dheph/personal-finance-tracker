import { Financing, FinancingInstallment } from '../finance-types'
import { EconomicIndexers } from './economic-rates'

/**
 * Retorna a taxa mensal correspondente ao indexador + taxa base do financiamento
 */
export function getMonthlyInterestRate(financing: Financing, rates: EconomicIndexers): number {
  const indexerRate = rates[financing.indexer] || 0 // % ao ano
  const totalAnnualRate = financing.annualInterestRate + indexerRate
  return totalAnnualRate / 100 / 12 // taxa decimal mensal
}

/**
 * Gera a tabela de parcelas previstas (projeções) do financiamento completo
 */
export function generateProjectedInstallments(
  financing: Omit<Financing, 'id' | 'createdAt' | 'updatedAt'> & { id: string },
  rates: EconomicIndexers
): Omit<FinancingInstallment, 'id' | 'createdAt'>[] {
  const installments: Omit<FinancingInstallment, 'id' | 'createdAt'>[] = []
  const monthlyRate = getMonthlyInterestRate(financing, rates)
  const total = financing.totalInstallments
  const baseDate = new Date(financing.startDate)

  let balance = financing.principalAmount

  // Se for modelo PRICE
  if (financing.calculationModel === 'PRICE') {
    const pmt = monthlyRate > 0 
      ? financing.principalAmount * (monthlyRate * Math.pow(1 + monthlyRate, total)) / (Math.pow(1 + monthlyRate, total) - 1)
      : financing.principalAmount / total

    for (let i = 1; i <= total; i++) {
      const dueDate = new Date(baseDate)
      dueDate.setMonth(baseDate.getMonth() + i)

      const interest = balance * monthlyRate
      const amortization = pmt - interest
      balance = Math.max(0, balance - amortization)

      installments.push({
        financingId: financing.id,
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        predictedValue: Number(pmt.toFixed(2)),
        paid: i <= financing.paidInstallments,
        actualValue: i <= financing.paidInstallments ? Number(pmt.toFixed(2)) : undefined,
        indexerValueUsed: rates[financing.indexer],
        interestRateUsed: financing.annualInterestRate
      })
    }
  } 
  // Se for modelo SAC
  else if (financing.calculationModel === 'SAC') {
    const constAmortization = financing.principalAmount / total

    for (let i = 1; i <= total; i++) {
      const dueDate = new Date(baseDate)
      dueDate.setMonth(baseDate.getMonth() + i)

      const interest = balance * monthlyRate
      const pmt = constAmortization + interest
      balance = Math.max(0, balance - constAmortization)

      installments.push({
        financingId: financing.id,
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        predictedValue: Number(pmt.toFixed(2)),
        paid: i <= financing.paidInstallments,
        actualValue: i <= financing.paidInstallments ? Number(pmt.toFixed(2)) : undefined,
        indexerValueUsed: rates[financing.indexer],
        interestRateUsed: financing.annualInterestRate
      })
    }
  } 
  // FIXED ou VARIABLE padrão
  else {
    const basePmt = financing.principalAmount / total

    for (let i = 1; i <= total; i++) {
      const dueDate = new Date(baseDate)
      dueDate.setMonth(baseDate.getMonth() + i)

      const multiplier = financing.calculationModel === 'VARIABLE' ? (1 + monthlyRate) : 1
      const pmt = basePmt * multiplier

      installments.push({
        financingId: financing.id,
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        predictedValue: Number(pmt.toFixed(2)),
        paid: i <= financing.paidInstallments,
        actualValue: i <= financing.paidInstallments ? Number(pmt.toFixed(2)) : undefined,
        indexerValueUsed: rates[financing.indexer],
        interestRateUsed: financing.annualInterestRate
      })
    }
  }

  return installments
}

/**
 * Executa os algoritmos de projeção (V1, V2, V3) para a PRÓXIMA parcela de um financiamento
 */
export function calculateNextInstallmentPrediction(
  financing: Financing,
  installments: FinancingInstallment[],
  rates: EconomicIndexers
): { predictedValue: number; trend: 'up' | 'down' | 'stable' } {
  const paidInstallments = [...installments]
    .filter(i => i.financingId === financing.id && i.paid)
    .sort((a, b) => a.installmentNumber - b.installmentNumber)

  const lastInstallment = paidInstallments[paidInstallments.length - 1]
  const last3 = paidInstallments.slice(-3)

  let v1 = financing.principalAmount / financing.totalInstallments
  if (last3.length > 0) {
    const sum = last3.reduce((acc, curr) => acc + (curr.actualValue || curr.predictedValue), 0)
    v1 = sum / last3.length
  }

  if (financing.calculationModel === 'FIXED') {
    return {
      predictedValue: lastInstallment?.actualValue || v1,
      trend: 'stable'
    }
  }

  const monthlyIndexerRate = (rates[financing.indexer] || 0) / 100 / 12
  const baseValue = lastInstallment?.actualValue || v1
  const v2 = baseValue * (1 + monthlyIndexerRate)

  const v3 = (v1 * 0.7) + (v2 * 0.3)
  const predictedValue = Number(v3.toFixed(2))

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (lastInstallment) {
    const lastVal = lastInstallment.actualValue || lastInstallment.predictedValue
    const diff = predictedValue - lastVal
    if (diff > 1) {
      trend = 'up'
    } else if (diff < -1) {
      trend = 'down'
    }
  }

  return {
    predictedValue,
    trend
  }
}
