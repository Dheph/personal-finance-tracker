'use client'

import { useState } from 'react'
import { useFinance } from '@/contexts/finance-context'
import { Asset, Liability, AssetType, LiabilityType } from '@/lib/finance-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Wallet, Landmark, Car, Home, TrendingUp, DollarSign, Plus, Trash2, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react'

const ASSET_ICONS = {
  cash: Wallet,
  investment: Landmark,
  vehicle: Car,
  property: Home,
  crypto: TrendingUp,
}

const ASSET_LABELS = {
  cash: 'Dinheiro em Mão',
  investment: 'Investimentos',
  vehicle: 'Veículos',
  property: 'Imóveis',
  crypto: 'Criptomoedas',
}

const LIABILITY_LABELS = {
  loan: 'Empréstimos',
  credit_card: 'Cartão de Crédito',
  financing: 'Financiamentos',
}

export function NetWorthCard() {
  const { engineResult, addAsset, deleteAsset, addLiability, deleteLiability } = useFinance()
  const [isAssetOpen, setIsAssetOpen] = useState(false)
  const [isLiabilityOpen, setIsLiabilityOpen] = useState(false)

  // Form states for Asset
  const [assetName, setAssetName] = useState('')
  const [assetType, setAssetType] = useState<AssetType>('cash')
  const [assetValue, setAssetValue] = useState('')

  // Form states for Liability
  const [liabilityName, setLiabilityName] = useState('')
  const [liabilityType, setLiabilityType] = useState<LiabilityType>('loan')
  const [liabilityValue, setLiabilityValue] = useState('')

  if (!engineResult) return null

  const { assetsTotal, liabilitiesTotal, current, breakdown, history } = engineResult.netWorth

  // Calculate Growth (last month comparison)
  let growthPct = 0
  let isGrowthPositive = true
  if (history && history.length >= 2) {
    const lastMonth = history[history.length - 1].netWorth
    const prevMonth = history[history.length - 2].netWorth
    if (prevMonth !== 0) {
      growthPct = ((lastMonth - prevMonth) / Math.abs(prevMonth)) * 100
      isGrowthPositive = growthPct >= 0
    }
  }

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetName || !assetValue) return
    await addAsset({
      name: assetName,
      type: assetType,
      currentValue: parseFloat(assetValue),
    })
    setAssetName('')
    setAssetValue('')
    setIsAssetOpen(false)
  }

  const handleAddLiability = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!liabilityName || !liabilityValue) return
    await addLiability({
      name: liabilityName,
      type: liabilityType,
      remainingAmount: parseFloat(liabilityValue),
    })
    setLiabilityName('')
    setLiabilityValue('')
    setIsLiabilityOpen(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Patrimônio Líquido Principal */}
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-indigo-950/40 via-background to-background backdrop-blur-md lg:col-span-1 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <CardHeader>
          <CardDescription className="text-indigo-400 font-medium tracking-wider uppercase text-xs">Patrimônio Líquido V3</CardDescription>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-white mt-1">
            R$ {current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {growthPct !== 0 && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isGrowthPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                {isGrowthPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {growthPct.toFixed(1)}% este mês
              </span>
              <span className="text-xs text-muted-foreground">relação ao mês anterior</span>
            </div>
          )}
          
          <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">Ativos Totais</span>
              <span className="text-lg font-bold text-emerald-400">
                + R$ {assetsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Passivos Totais</span>
              <span className="text-lg font-bold text-rose-400">
                - R$ {liabilitiesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Composição de Ativos */}
      <Card className="border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-md font-semibold text-foreground">Composição de Ativos</CardTitle>
            <CardDescription className="text-xs">Bens e investimentos acumulados</CardDescription>
          </div>
          <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-background">
              <DialogHeader>
                <DialogTitle>Adicionar Ativo</DialogTitle>
                <DialogDescription>Adicione bens de valor, investimentos externos ou saldo para calcular seu patrimônio real.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAsset} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-name">Nome do Ativo</Label>
                  <Input id="asset-name" placeholder="Ex: Apartamento, Reserva de Emergência, Corolla" value={assetName} onChange={e => setAssetName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset-type">Tipo</Label>
                    <Select value={assetType} onValueChange={(val: AssetType) => setAssetType(val)}>
                      <SelectTrigger id="asset-type">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ASSET_LABELS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asset-value">Valor Atual (R$)</Label>
                    <Input id="asset-value" type="number" step="0.01" placeholder="Ex: 50000" value={assetValue} onChange={e => setAssetValue(e.target.value)} required />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">Adicionar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="max-h-[220px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {breakdown.assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              Nenhum ativo manual cadastrado.
            </div>
          ) : (
            breakdown.assets.map((a, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-sm font-medium text-foreground block leading-tight">{a.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-400">
                    R$ {a.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => {
                    // Quick check if there is an ID associated
                    const originalAsset = engineResult.netWorth.breakdown.assets[idx]
                    const assetId = useFinance().db.assets.find(item => item.name === originalAsset.name && item.currentValue === originalAsset.value)?.id
                    if (assetId) deleteAsset(assetId)
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Composição de Passivos */}
      <Card className="border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-md font-semibold text-foreground">Dívidas & Obrigações</CardTitle>
            <CardDescription className="text-xs">Valores que subtraem do seu patrimônio</CardDescription>
          </div>
          <Dialog open={isLiabilityOpen} onOpenChange={setIsLiabilityOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-background">
              <DialogHeader>
                <DialogTitle>Adicionar Passivo Manual</DialogTitle>
                <DialogDescription>Adicione dívidas externas (como contas pendentes, empréstimos familiares, etc.).</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLiability} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="liability-name">Nome da Obrigação</Label>
                  <Input id="liability-name" placeholder="Ex: Boleto com Amigo, Dívida externa" value={liabilityName} onChange={e => setLiabilityName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="liability-type">Tipo</Label>
                    <Select value={liabilityType} onValueChange={(val: LiabilityType) => setLiabilityType(val)}>
                      <SelectTrigger id="liability-type">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LIABILITY_LABELS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liability-value">Valor Pendente (R$)</Label>
                    <Input id="liability-value" type="number" step="0.01" placeholder="Ex: 1500" value={liabilityValue} onChange={e => setLiabilityValue(e.target.value)} required />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">Adicionar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="max-h-[220px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {breakdown.liabilities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Trash2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              Nenhum passivo detectado.
            </div>
          ) : (
            breakdown.liabilities.map((l, idx) => {
              const isAutoDetected = l.name.includes('(Mês Atual)') || l.name.startsWith('Empréstimo:')
              return (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <div>
                      <span className="text-sm font-medium text-foreground block leading-tight">{l.name}</span>
                      {isAutoDetected && <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Automático</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-rose-400">
                      R$ {l.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {!isAutoDetected ? (
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => {
                        const originalLiability = engineResult.netWorth.breakdown.liabilities[idx]
                        const liabilityId = useFinance().db.liabilities.find(item => item.name === originalLiability.name && item.remainingAmount === originalLiability.value)?.id
                        if (liabilityId) deleteLiability(liabilityId)
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <div className="w-6" /> // spacer
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
