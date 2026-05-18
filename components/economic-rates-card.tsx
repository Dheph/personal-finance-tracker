'use client'

import { useFinance } from '@/contexts/finance-context'
import { Info, TrendingUp, Percent, Coins, ShieldCheck } from 'lucide-react'

export function EconomicRatesCard() {
  const { economicRates } = useFinance()

  const items = [
    {
      label: 'SELIC',
      value: economicRates?.SELIC ?? 10.75,
      description: 'Meta Selic (COPOM)',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20',
      icon: TrendingUp,
    },
    {
      label: 'CDI',
      value: economicRates?.CDI ?? 10.65,
      description: 'Taxa Interbancária',
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20',
      icon: Coins,
    },
    {
      label: 'IPCA',
      value: economicRates?.IPCA ?? 4.5,
      description: 'Inflação Oficial (12m)',
      color: 'from-rose-500/10 to-orange-500/10 text-rose-400 border-rose-500/20',
      icon: Percent,
    },
    {
      label: 'TR',
      value: economicRates?.TR ?? 1.2,
      description: 'Taxa Referencial (12m)',
      color: 'from-purple-500/10 to-fuchsia-500/10 text-purple-400 border-purple-500/20',
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-base">Índices Econômicos Nacionais</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Taxas atualizadas diariamente da API do Banco Central do Brasil para correção automática de parcelas.
          </p>
        </div>
        <div className="self-start sm:self-center flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/35 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-wider animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Conectado à API
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className={`bg-gradient-to-br ${item.color} border rounded-xl p-4 flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium tracking-wider opacity-85">{item.description}</span>
                <Icon className="w-4 h-4 opacity-75" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight">{item.value.toFixed(2)}%</span>
                <span className="text-[9px] block opacity-70 font-bold tracking-wider mt-1.5 uppercase">
                  TAXA ANUAL ({item.label})
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
