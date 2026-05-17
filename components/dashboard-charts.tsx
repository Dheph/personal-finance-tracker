'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinance } from '@/contexts/finance-context'
import { getMonthlyTrend, formatCurrency } from '@/lib/calculations'
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
} from 'recharts'
import { calculateCategoryTotals } from '@/lib/calculations'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function MonthlyTrendChart() {
  const { db } = useFinance()
  
  const trendData = useMemo(() => {
    return getMonthlyTrend(db.transactions, 6)
  }, [db.transactions])
  
  const hasData = trendData.some((d) => d.receitas > 0 || d.despesas > 0)
  
  if (!hasData) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Evolução Mensal</CardTitle>
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
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Evolução Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                labelStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--foreground)', fontSize: '12px' }}>
                    {value === 'receitas' ? 'Receitas' : 'Despesas'}
                  </span>
                )}
              />
              <Bar
                dataKey="receitas"
                fill="var(--success)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="despesas"
                fill="var(--destructive)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function CategoryPieChart() {
  const { db } = useFinance()
  
  const categoryData = useMemo(() => {
    return calculateCategoryTotals(db.transactions).slice(0, 5)
  }, [db.transactions])
  
  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição de Gastos</CardTitle>
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
        <CardTitle className="text-base">Distribuição de Gastos</CardTitle>
      </CardHeader>
      <CardContent>
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
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {categoryData.map((category, index) => (
            <div key={category.category} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground">
                {category.label} ({((category.total / total) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
