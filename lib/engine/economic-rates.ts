'use client'

export interface EconomicIndexers {
  SELIC: number // % a.a.
  CDI: number   // % a.a.
  IPCA: number  // % a.a.
  TR: number    // % a.a.
  FIXED: number // 0
}

const CACHE_KEY = 'personal_finance_economic_cache'
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 horas

export const DEFAULT_RATES: EconomicIndexers = {
  SELIC: 10.75,
  CDI: 10.65,
  IPCA: 4.5,
  TR: 1.2,
  FIXED: 0
}

interface CacheData {
  rates: EconomicIndexers
  lastUpdated: string
}

export async function fetchEconomicRates(): Promise<EconomicIndexers> {
  if (typeof window === 'undefined') {
    return DEFAULT_RATES
  }

  // Verificar cache
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed: CacheData = JSON.parse(cached)
      const age = Date.now() - new Date(parsed.lastUpdated).getTime()
      if (age < CACHE_DURATION_MS) {
        return parsed.rates
      }
    }
  } catch (e) {
    console.warn('Erro ao ler cache de taxas econômicas:', e)
  }

  // Se não houver cache ou estiver expirado, buscar da API do Banco Central
  const rates = { ...DEFAULT_RATES }

  try {
    // 1. Meta SELIC do COPOM - Série 432
    const selicRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json')
    if (selicRes.ok) {
      const data = await selicRes.json()
      if (data && data[0] && data[0].valor) {
        rates.SELIC = parseFloat(data[0].valor)
        rates.CDI = Math.max(0, rates.SELIC - 0.10) // CDI acompanha de perto SELIC - 0.1%
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar SELIC da API do BC:', e)
  }

  try {
    // 2. IPCA acumulado (Mensal) - Série 433 (últimos 12 meses compostos)
    const ipcaRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json')
    if (ipcaRes.ok) {
      const data = await ipcaRes.json()
      if (Array.isArray(data) && data.length > 0) {
        let compounded = 1
        for (const item of data) {
          const val = parseFloat(item.valor) / 100
          compounded *= (1 + val)
        }
        rates.IPCA = parseFloat(((compounded - 1) * 100).toFixed(2))
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar IPCA da API do BC:', e)
  }

  try {
    // 3. TR (Taxa Referencial Mensal acumulada) - Série 226
    const trRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json')
    if (trRes.ok) {
      const data = await trRes.json()
      if (Array.isArray(data) && data.length > 0) {
        let compounded = 1
        for (const item of data) {
          const val = parseFloat(item.valor) / 100
          compounded *= (1 + val)
        }
        rates.TR = parseFloat(((compounded - 1) * 100).toFixed(2))
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar TR da API do BC:', e)
  }

  const cacheData: CacheData = {
    rates,
    lastUpdated: new Date().toISOString()
  }
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (e) {
    console.warn('Erro ao salvar cache de taxas econômicas:', e)
  }

  return rates
}
