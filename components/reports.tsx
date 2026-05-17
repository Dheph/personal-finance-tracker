'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinance } from '@/contexts/finance-context'
import {
  calculateBalance,
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculateCategoryTotals,
  calculateCardUsage,
  formatCurrency,
  getMonthlyTrend,
} from '@/lib/calculations'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'
import { subMonths, format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function ReportsSummary() {
  const { db } = useFinance()
  const [period, setPeriod] = useState('current')
  
  const stats = useMemo(() => {
    let targetMonth = new Date()
    if (period === 'last') {
      targetMonth = subMonths(new Date(), 1)
    } else if (period === 'last3') {
      targetMonth = subMonths(new Date(), 3)
    }
    
    const monthlyExpenses = calculateMonthlyExpenses(db.transactions, targetMonth)
    const monthlyIncome = calculateMonthlyIncome(db.transactions, targetMonth)
    const savings = monthlyIncome - monthlyExpenses
    const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0
    
    return {
      expenses: monthlyExpenses,
      income: monthlyIncome,
      savings,
      savingsRate,
      periodLabel:
        period === 'current'
          ? format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })
          : period === 'last'
          ? format(subMonths(new Date(), 1), "MMMM 'de' yyyy", { locale: ptBR })
          : 'Últimos 3 meses',
    }
  }, [db.transactions, period])
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Resumo do Período</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Mês Atual</SelectItem>
            <SelectItem value="last">Mês Passado</SelectItem>
            <SelectItem value="last3">Últimos 3 Meses</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{stats.periodLabel}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success)]/10">
              <TrendingUp className="h-5 w-5 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="text-lg font-bold text-[var(--success)]">
                {formatCurrency(stats.income)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--destructive)]/10">
              <TrendingDown className="h-5 w-5 text-[var(--destructive)]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="text-lg font-bold text-[var(--destructive)]">
                {formatCurrency(stats.expenses)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Economia</p>
              <p className={`text-lg font-bold ${stats.savings >= 0 ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}`}>
                {formatCurrency(stats.savings)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa de Economia</p>
              <p className={`text-lg font-bold ${stats.savingsRate >= 0 ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}`}>
                {stats.savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MonthlyComparisonChart() {
  const { db } = useFinance()
  
  const trendData = useMemo(() => {
    return getMonthlyTrend(db.transactions, 12)
  }, [db.transactions])
  
  const hasData = trendData.some((d) => d.receitas > 0 || d.despesas > 0)
  
  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Adicione transações para visualizar o gráfico
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparativo Mensal (12 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--card-foreground)',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--foreground)', fontSize: '12px' }}>
                    {value === 'receitas' ? 'Receitas' : 'Despesas'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="var(--success)"
                fill="url(#incomeGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="despesas"
                stroke="var(--destructive)"
                fill="url(#expenseGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function CategoryBreakdownChart() {
  const { db } = useFinance()
  
  const categoryData = useMemo(() => {
    return calculateCategoryTotals(db.transactions)
  }, [db.transactions])
  
  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Adicione despesas para visualizar o gráfico
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const total = categoryData.reduce((acc, c) => acc + c.total, 0)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gastos por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="total"
                  nameKey="label"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--card-foreground)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-3">
            {categoryData.map((category, index) => {
              const percentage = total > 0 ? (category.total / total) * 100 : 0
              return (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{category.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">
                      {formatCurrency(category.total)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CardUsageChart() {
  const { db } = useFinance()
  
  const cardData = useMemo(() => {
    return calculateCardUsage(db).filter((card) => card.limit > 0)
  }, [db])
  
  if (cardData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uso de Cartões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Cadastre cartões para visualizar o uso
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const chartData = cardData.map((card) => ({
    name: card.name,
    usado: card.used,
    disponivel: Math.max(card.limit - card.used, 0),
    color: card.color,
  }))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Uso de Cartões</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--card-foreground)',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--foreground)', fontSize: '12px' }}>
                    {value === 'usado' ? 'Utilizado' : 'Disponível'}
                  </span>
                )}
              />
              <Bar dataKey="usado" stackId="a" fill="var(--destructive)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="disponivel" stackId="a" fill="var(--success)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
